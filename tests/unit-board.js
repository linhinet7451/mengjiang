// v10 大棋盤規則（C 玩家回憶 Tomas 2026-11-04）：每回合雙方前進一格、不能換列、攻擊格以自己所在格為起點。node tests/unit-board.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, lv: 10, phys: true, dtype: 'p', hit: 200, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 10 }; for (var k in (o || {})) u[k] = o[k]; return u; }
function hitsBy(r) { var o = {}; r.events.forEach(function (e) { if (e.t === 'hit' && !e.miss && !e.dot && !e.reflect) o[e.from] = (o[e.from] || 0) + 1; }); return o; }
function advs(r) { return r.events.filter(function (e) { return e.t === 'adv'; }); }

console.log('[規則版本]');
ok(M.R.RV === 15, "現行規則版本 R.RV = 15（技能格圖 v14、棋盤規則仍為 v12）");
ok(B.BOARD.cols === 8 && B.BOARD.gap === 2, '棋盤每列 8 格（我方 3＋中間 2＋敵方 3）');
ok(B.homeBx('A', 0) === 2 && B.homeBx('A', 2) === 0 && B.homeBx('B', 0) === 5 && B.homeBx('B', 2) === 7, '開場位置：我方前排第 2 格、敵方前排第 5 格');

console.log('[每回合雙方前進一格]');
var r = B.run([{ cell: 3, unit: mk('前') }, { cell: 4, unit: mk('後') }], [{ cell: 3, unit: mk('敵') }], { seed: 1, maxRounds: 3 });
var a1 = advs(r)[0];
ok(r.board && r.board.cols === 8, '戰報標示為大棋盤');
ok(a1 && a1.m.length === 3, '第 1 回合三人都前進（' + (a1 ? a1.m.length : 0) + ' 人）');
ok(a1 && a1.m.every(function (m) { return Math.abs(m.to - m.from) === 1; }), '每次只走一格');
var mA = a1.m.filter(function (m) { return m.u.charAt(0) === 'A'; }), mB = a1.m.filter(function (m) { return m.u.charAt(0) === 'B'; });
ok(mA.every(function (m) { return m.to > m.from; }) && mB.every(function (m) { return m.to < m.from; }), '我方往右（敵方方向）、敵方往左');
ok(r.units.every(function (u) { return u.br === Math.floor(u.cell0 / 3); }), '戰鬥結束時每個人都還在原本那一列（不能上下移動）');
ok(!r.events.some(function (e) { return e.t === 'move'; }), '沒有舊版的「衝刺／橫移」事件');
var a2 = advs(r)[1];
ok(!a2 || a2.m.every(function (m) { return m.u !== 'A3' && m.u !== 'B3'; }), '雙方前排相鄰後不再前進（被敵人擋住）');

console.log('[擋路]');
// 同列：我方前排接觸敵人後停住，後排走到前排身後也停住
r = B.run([{ cell: 3, unit: mk('前') }, { cell: 5, unit: mk('後') }], [{ cell: 3, unit: mk('敵') }], { seed: 2, maxRounds: 6 });
var fin = {}; r.units.forEach(function (u) { fin[u.key] = u.bx; });
ok(fin.A3 + 1 === fin.B3, '前排停在敵人正前方（我 ' + fin.A3 + '／敵 ' + fin.B3 + '）');
ok(fin.A5 + 1 === fin.A3, '後排停在隊友身後（' + fin.A5 + '）');
// 前方隊友陣亡後讓出格子
var weak = mk('弱', { hp: 1 });
r = B.run([{ cell: 3, unit: weak }, { cell: 4, unit: mk('後') }], [{ cell: 3, unit: mk('敵', { patk: 1e6 }) }], { seed: 3, maxRounds: 6 });
var died = r.events.some(function (e) { return e.t === 'dead' && e.to === 'A3'; });
var hb = hitsBy(r);
ok(died && hb.A4 > 0, '前方隊友陣亡後，後排往前補位並打到敵人（' + (hb.A4 || 0) + ' 次）');

console.log('[攻擊格以自己所在的格子為起點]');
r = B.run([{ cell: 3, unit: mk('前') }, { cell: 4, unit: mk('後單') }], [{ cell: 3, unit: mk('敵') }], { seed: 4, maxRounds: 5 });
hb = hitsBy(r);
ok(hb.A3 > 0 && !hb.A4, '單體（正前方 1 格）的後排，前面有隊友時打不到（前 ' + (hb.A3 || 0) + '／後 ' + (hb.A4 || 0) + '）');
ok(r.events.some(function (e) { return e.t === 'wait' && e.u === 'A4'; }), '打不到時記一筆「等待前進」，不加無雙值');
r = B.run([{ cell: 3, unit: mk('前') }, { cell: 4, unit: mk('後二', { active: { name: '二格', pattern: 'line2', mult: 1 } }) }], [{ cell: 3, unit: mk('敵') }], { seed: 4, maxRounds: 5 });
hb = hitsBy(r);
ok(hb.A4 > 0, '往前二格（line2）的後排，越過隊友打到敵人（' + (hb.A4 || 0) + ' 次）');
var act = r.events.filter(function (e) { return e.t === 'act' && e.u === 'A4'; })[0];
ok(act && act.bd && act.range.length === 2 && act.me != null && act.range.every(function (x) { return Math.floor(x / 8) === Math.floor(act.me / 8); }), '行動事件帶棋盤格：自己＝綠、紅格兩格且同一列');
// 無雙也照自己的攻擊格：直排（col3）打到上下列
var colU = mk('直排', { rage: 0, curRage: 100, ult: { name: '直排無雙', pattern: 'col3', mult: 1 } });
r = B.run([{ cell: 3, unit: colU }], [{ cell: 0, unit: mk('上') }, { cell: 3, unit: mk('中') }, { cell: 6, unit: mk('下') }], { seed: 5, maxRounds: 3 });
var ult = r.events.filter(function (e) { return e.t === 'act' && e.ult; })[0];
ok(ult && ult.cells.length === 3, '無雙（直排）依自己的攻擊格打到三列（' + (ult ? ult.cells.length : 0) + ' 人）');
// 沒有敵人的列：不會橫移換列（移除 D 橫移規則），只會一路往前
r = B.run([{ cell: 0, unit: mk('上') }], [{ cell: 6, unit: mk('下敵') }], { seed: 6, maxRounds: 8 });
ok(r.units.filter(function (u) { return u.key === 'A0'; })[0].br === 0 && !r.events.some(function (e) { return e.t === 'move' && e.side; }), '自己這一列沒有敵人時不換列（舊 D 橫移規則已移除）');
var a0 = r.units.filter(function (u) { return u.key === 'A0'; })[0], b6 = r.units.filter(function (u) { return u.key === 'B6'; })[0];
ok(a0.bx < b6.bx, '不能越過敵方最前線（D）：我 ' + a0.bx + '／敵 ' + b6.bx + '，兩軍不會穿過彼此');
ok(r.stale && !r.timeout && r.events.some(function (e) { return e.t === 'stale'; }), '雙方都打不到、也走不動時判定僵局（D），不用等到時間到（第 ' + r.rounds + ' 回合）');
console.log('[不能越過敵方最前線／僵局]');
// 前線：不同列的敵人也會擋住「欄」，任何人都不會踏進敵方最前面活人所在的欄
r = B.run([{ cell: 0, unit: mk('上') }, { cell: 3, unit: mk('中') }], [{ cell: 4, unit: mk('中後') }], { seed: 8, maxRounds: 6 });
var pos = {}, dead = {}, bad = 0, nA = 0;
r.units.forEach(function (u) { pos[u.key] = B.homeBx(u.key.charAt(0), u.cell0 % 3); });
r.events.forEach(function (e) {
  if (e.t === 'dead') dead[e.to] = 1;
  if (e.t === 'adv') e.m.forEach(function (m) {
    var side = m.u.charAt(0), front = null;
    for (var k in pos) if (k.charAt(0) !== side && !dead[k]) front = front == null ? pos[k] : (side === 'A' ? Math.min(front, pos[k]) : Math.max(front, pos[k]));
    if (side === 'A') nA++;
    if (front != null && (side === 'A' ? m.to >= front : m.to <= front)) bad++;
    pos[m.u] = m.to;
  });
});
ok(bad === 0, '前進時不會踏進敵方最前線所在欄（檢查 ' + nA + ' 次我方前進，違規 ' + bad + ' 次）');
// 僵局判定：血量比例高的一方勝；比例相同算我方輸
var hurt = mk('受傷', { hp: 1e6 }); hurt.curHp = 4e5;
r = B.run([{ cell: 0, unit: hurt }], [{ cell: 6, unit: mk('滿血') }], { seed: 9, maxRounds: 30 });
ok(r.stale && r.win === false, '僵局：我方血量比例較低（40%）判輸');
var hurtB = mk('敵傷'); hurtB.curHp = 3e5;
r = B.run([{ cell: 0, unit: mk('滿血') }], [{ cell: 6, unit: hurtB }], { seed: 9, maxRounds: 30 });
ok(r.stale && r.win === true, '僵局：我方血量比例較高判勝');
r = B.run([{ cell: 0, unit: mk('滿') }], [{ cell: 6, unit: mk('滿敵') }], { seed: 9, maxRounds: 30 });
ok(r.stale && r.win === false, '僵局：比例相同（100%:100%）算我方沒贏');
var se = r.events.filter(function (e) { return e.t === 'stale'; })[0];
ok(se && se.a === 100 && se.b === 100, '僵局事件帶雙方血量比例（' + (se ? se.a + '%:' + se.b + '%' : '無') + '）');
// 有人打得到就不是僵局
r = B.run([{ cell: 3, unit: mk('前') }], [{ cell: 3, unit: mk('敵', { hp: 5000 }) }], { seed: 10, maxRounds: 30 });
ok(!r.stale && r.win, '打得到敵人時正常打完，不判僵局');

console.log('[舊戰報相容]');
var o9 = mk('舊', { rv: 9 }), e9 = mk('舊敵', { rv: 9 });
r = B.run([{ cell: 3, unit: o9 }], [{ cell: 3, unit: e9 }], { seed: 7, maxRounds: 3 });
ok(!r.board && !advs(r).length, 'rv 9 單位照 v9 規則（沒有大棋盤、沒有每回合前進）');
r = B.run([{ cell: 3, unit: mk('新') }], [{ cell: 3, unit: mk('舊敵', { rv: 9 }) }], { seed: 7, maxRounds: 3 });
ok(!r.board, '新舊單位混在一起時照舊規則（整場一致）');
var gold9 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'battle-golden-v9.json'), 'utf8'));
ok(JSON.stringify(require('./golden-run.js')(load, { rv: 9 })) === JSON.stringify(gold9), 'R.RV=9 重跑：與 battle-golden-v9.json 完全相同');
var g10p = path.join(__dirname, 'fixtures', 'battle-golden-v10.json'), now10 = require('./golden-run.js')(load, { rv: 10 });
ok(fs.existsSync(g10p) && JSON.stringify(JSON.parse(fs.readFileSync(g10p, 'utf8'))) === JSON.stringify(now10), 'R.RV=10 重跑：與 battle-golden-v10.json 完全相同（v10 舊戰報照舊重播）');
ok(JSON.stringify(now10) !== JSON.stringify(gold9), 'v10 與 v9 結果不同（確實換了規則）');

console.log('[遊戲內戰鬥]');
c = load(); M = c.MJ; M.U.now = function () { return 1767225600000; }; M.G.newGame('測', '力耐', 'm', 1);
var res = M.G.fight('s1_1', 99);
ok(res.battle.board && res.battle.events.some(function (e) { return e.t === 'adv'; }), '實際關卡使用大棋盤並有前進事件');
function rate(rv) { var w = 0, rd = 0; for (var s = 1; s <= 40; s++) { var cc = load(rv ? { legacy: rv } : {}); cc.MJ.U.now = function () { return 1767225600000; }; cc.MJ.G.newGame('測', '力耐', 'm', 1); var rr = cc.MJ.G.fight('s1_1', s * 7 + 1); if (rr.win) w++; rd += rr.battle.rounds; } return [w, rd / 40]; }
var r10 = rate(10), r9 = rate(9);
ok(r10[0] >= 24, '第一關（40 種子）新規則勝率 ' + r10[0] + '/40、平均 ' + r10[1].toFixed(1) + ' 回合（v9：' + r9[0] + '/40、' + r9[1].toFixed(1) + ' 回合）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
