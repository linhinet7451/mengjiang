// v11 規則（C 玩家回憶 Tomas t23u）：每回合雙方持續往前；走到底回到我方第一排後方排隊（同一列）；敵我都一樣。node tests/unit-wrap.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, lv: 10, phys: true, dtype: 'p', hit: 200, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 11 }; for (var k in (o || {})) u[k] = o[k]; return u; }
function advs(r) { return r.events.filter(function (e) { return e.t === 'adv'; }); }
// 依事件重建每個人的位置（br 固定、bx 隨 adv 改變）
function track(r, cb) {
  var pos = {}; r.events[0].bd.pos.forEach(function (p) { pos[p[0]] = { br: p[1], bx: p[2] }; });
  r.events.forEach(function (e, i) { if (e.t === 'adv') e.m.forEach(function (m) { pos[m.u].bx = m.to; }); if (cb) cb(e, pos, i); });
  return pos;
}

console.log('[規則版本]');
ok(M.R.RV >= 11, '現行規則版本 R.RV >= 11（目前 ' + M.R.RV + '；v12 見 unit-wrap12.js）');
var r = B.run([{ cell: 3, unit: mk('前') }], [{ cell: 3, unit: mk('敵') }], { seed: 1, maxRounds: 2 });
ok(r.board && r.board.v === 11 && r.events[0].bd.v === 11, '全部單位 rv 11：戰報標示 v11 棋盤');
r = B.run([{ cell: 3, unit: mk('前', { rv: 10 }) }], [{ cell: 3, unit: mk('敵') }], { seed: 1, maxRounds: 2 });
ok(r.board && r.board.v === undefined && r.events[0].bd.v === undefined, 'rv 10 與 rv 11 混在一起時整場照 v10（戰報沒有 v 欄位，與舊戰報格式相同）');

console.log('[持續前進：同一列敵人死了也繼續走]');
var killer = mk('殺手', { patk: 1e7 });
r = B.run([{ cell: 3, unit: killer }, { cell: 0, unit: mk('上擋') }], [{ cell: 3, unit: mk('弱敵', { hp: 10 }) }, { cell: 0, unit: mk('上敵') }], { seed: 2, maxRounds: 8 });
var deadR = 0, xs = [];
track(r, function (e, pos) { if (e.t === 'dead' && e.to === 'B3') deadR = 1; if (e.t === 'adv' && deadR) xs.push(pos.A3.bx); });
ok(r.events.some(function (e) { return e.t === 'dead' && e.to === 'B3'; }), '同列敵人被打倒');
ok(xs.length >= 3 && xs[1] === xs[0] + 1 && xs[2] === xs[1] + 1, '敵人死後仍每回合往前一格（' + xs.slice(0, 4).join('→') + '）');
var pos0 = track(r);
ok(r.units.every(function (u) { return u.br === Math.floor(u.cell0 / 3); }), '全場沒有人換列');
// 不同列的敵人不會擋住：沒有 v10 的「不能越過敵方最前線」
r = B.run([{ cell: 0, unit: mk('上') }], [{ cell: 6, unit: mk('下敵') }], { seed: 3, maxRounds: 4 });
var p3 = track(r);
ok(p3.A0.bx === 6 && p3.B6.bx === 1, '別列的敵人不擋路：我方走到第 ' + p3.A0.bx + ' 欄、敵方走到第 ' + p3.B6.bx + ' 欄（兩軍錯身而過）');

console.log('[走到底回到第一排後方排隊]');
r = B.run([{ cell: 0, unit: mk('上') }, { cell: 3, unit: mk('中') }], [{ cell: 3, unit: mk('中敵') }], { seed: 4, maxRounds: 9 });
var wraps = [];
track(r, function (e, pos) { if (e.t === 'adv') e.m.forEach(function (m) { if (m.wrap) wraps.push({ m: m, pos: JSON.parse(JSON.stringify(pos)) }); }); });
var w0 = wraps.filter(function (w) { return w.m.u === 'A0'; })[0];
ok(!!w0, '上排走到第 7 欄後再往前，觸發「走到底」（wrap）');
ok(w0 && w0.m.from === 7 && w0.pos.A0.br === 0, '從最後一欄（7）回去，而且留在同一列（第 ' + (w0 ? w0.pos.A0.br : '?') + ' 列）');
ok(w0 && w0.m.to === w0.pos.A3.bx - 1, '排在我方第一排（最前面的隊友，第 ' + (w0 ? w0.pos.A3.bx : '?') + ' 欄）後一欄：第 ' + (w0 ? w0.m.to : '?') + ' 欄');
var afterW = [];
track(r, function (e, pos) { if (e.t === 'adv' && w0 && r.events.indexOf(e) > 0) afterW.push(pos.A0.bx); });
// 排隊後繼續往前
var iW = afterW.indexOf(w0 ? w0.m.to : -1);
ok(iW >= 0 && afterW[iW + 1] === afterW[iW] + 1, '排隊後下一回合又繼續往前');
// 敵方也一樣
r = B.run([{ cell: 3, unit: mk('中') }], [{ cell: 0, unit: mk('上敵') }, { cell: 3, unit: mk('中敵') }], { seed: 5, maxRounds: 9 });
var bw = null; track(r, function (e, pos) { if (e.t === 'adv') e.m.forEach(function (m) { if (m.wrap && m.u === 'B0' && !bw) bw = { m: m, front: pos.B3.bx }; }); });
ok(bw && bw.m.from === 0 && bw.m.to === bw.front + 1, '敵方走到我方底線（第 0 欄）也回到敵方第一排後方（第 ' + (bw ? bw.front : '?') + ' 欄後 → 第 ' + (bw ? bw.m.to : '?') + ' 欄）');

console.log('[排隊位置（D）]');
var q = { key: 'A0', side: 'A', br: 0, bx: 7, hp: 1 }, f1 = { key: 'A3', side: 'A', br: 1, bx: 4, hp: 1 }, f2 = { key: 'A1', side: 'A', br: 0, bx: 3, hp: 1 };
ok(B.queueBx(q, [q, f1]) === 3, '排隊格＝我方其他人最前面那欄（4）的後一欄（3）');
ok(B.queueBx(q, [q, f1, f2]) === 2, '那格有人（同列隊友在 3）就再往後一格（2）');
var en = { key: 'B0', side: 'B', br: 0, bx: 3, hp: 1 };
ok(B.queueBx(q, [q, f1, en]) === 2, '那格有敵人也一樣往後排（2）');
ok(B.queueBx(q, [q]) === 2, '只剩自己一人：回到開場第一排那一欄（我方第 2 欄）');
var qb = { key: 'B0', side: 'B', br: 0, bx: 0, hp: 1 };
ok(B.queueBx(qb, [qb]) === 5, '敵方只剩一人：回到第 5 欄');
var dead = { key: 'A4', side: 'A', br: 1, bx: 6, hp: 0 };
ok(B.queueBx(q, [q, f1, dead]) === 3, '陣亡的隊友不算第一排');
var full = [q, { key: 'A3', side: 'A', br: 1, bx: 2, hp: 1 }]; [0, 1].forEach(function (x, i) { full.push({ key: 'X' + i, side: 'B', br: 0, bx: x, hp: 1 }); });
ok(B.queueBx(q, full) === 2, '後面都滿了：找前面最近的空格（' + B.queueBx(q, full) + '）');
// 同一回合兩人走到底：依行動順序排
var A = [{ key: 'A0', side: 'A', br: 0, bx: 7, hp: 1 }, { key: 'A3', side: 'A', br: 1, bx: 5, hp: 1 }, { key: 'A1', side: 'A', br: 0, bx: 6, hp: 1 }];
var mv = B.advance11([A[0], A[1], A[2]], A);
var m0 = mv.filter(function (m) { return m.u === 'A0'; })[0], m1 = mv.filter(function (m) { return m.u === 'A1'; })[0];
ok(m0 && m0.wrap && m0.to === 5 && m1 && !m1.wrap && m1.to === 7, '先到底的人排在第一排後面（' + (m0 ? m0.to : '?') + '），後面的人照常往前（' + (m1 ? m1.to : '?') + '）');
var Q = [{ key: 'A0', side: 'A', br: 0, bx: 7, hp: 1 }, { key: 'A3', side: 'A', br: 1, bx: 7, hp: 1 }, { key: 'A6', side: 'A', br: 2, bx: 3, hp: 1 }];
mv = B.advance11([Q[0], Q[1], Q[2]], Q);
var g0 = mv.filter(function (m) { return m.u === 'A0'; })[0], g1 = mv.filter(function (m) { return m.u === 'A3'; })[0];
ok(g0 && g1 && g0.wrap && g1.wrap && g0.to === 6 && g1.to === 5, '兩人同回合走到底：依行動順序，先排的在前（' + (g0 ? g0.to : '?') + '），後排的再往後（' + (g1 ? g1.to : '?') + '）');

console.log('[擋路（D）]');
r = B.run([{ cell: 3, unit: mk('前') }, { cell: 4, unit: mk('後') }], [{ cell: 3, unit: mk('敵') }], { seed: 6, maxRounds: 4 });
var pb = track(r);
ok(pb.A3.bx + 1 === pb.B3.bx && pb.A4.bx + 1 === pb.A3.bx, '前方有人（敵人或隊友）就停住，打得到人時不交換不穿過（' + pb.A4.bx + '、' + pb.A3.bx + ' | ' + pb.B3.bx + '）');

console.log('[卡住穿過（D）]');
// 我方只會打斜角（diag，打不到正前方相鄰格），敵人緊貼在正前方：第一回合貼上停下、打不到人；下一回合從敵人身邊穿過去
r = B.run([{ cell: 3, unit: mk('斜', { active: { name: '斜打', pattern: 'diag', mult: 1 }, ult: { name: '斜無雙', pattern: 'diag', mult: 1 } }) }], [{ cell: 3, unit: mk('敵', { hp: 3e6 }) }], { seed: 8, maxRounds: 12 });
var pz = null, prevAdj = false, waitedAdj = false, enemyPass = 0;
track(r, function (e, pos) {
  if (e.t === 'adv') e.m.forEach(function (m) { if (m.pass && m.u === 'A3' && !pz) pz = { m: m, b: (e.m.filter(function (k) { return k.u === 'B3'; })[0] || { from: pos.B3.bx }).from, br: pos.A3.br }; if (m.pass && m.u === 'B3') enemyPass++; });
  if (!pz && e.t === 'wait' && e.u === 'A3' && pos.A3.bx + 1 === pos.B3.bx) waitedAdj = true;
});
ok(waitedAdj, '先緊貼著敵人停下，那一回合技能打不到人（等待）');
ok(pz && pz.m.to > pz.b && pz.m.from + 1 === pz.b && pz.br === 1, '下一回合從敵人身邊穿過去（第 ' + (pz ? pz.m.from + '→' + pz.m.to : '?') + ' 欄，敵人在第 ' + (pz ? pz.b : '?') + ' 欄），仍在同一列');
ok(enemyPass === 0, '打得到人的敵人不會穿過，留下來打');
r = B.run([{ cell: 3, unit: mk('前') }], [{ cell: 3, unit: mk('敵', { hp: 3e6 }) }], { seed: 8, maxRounds: 12 });
ok(!advs(r).some(function (e) { return e.m.some(function (m) { return m.pass; }); }), '雙方都打得到正前方時，沒有人穿過（照舊貼著打）');

console.log('[攻擊範圍以自己當下的格子為起點]');
r = B.run([{ cell: 0, unit: mk('上', { active: { name: '二格', pattern: 'line2', mult: 1 } }) }, { cell: 3, unit: mk('中') }], [{ cell: 3, unit: mk('中敵') }, { cell: 0, unit: mk('上敵', { hp: 3e6 }) }], { seed: 7, maxRounds: 12 });
var badR = 0, nAct = 0;
track(r, function (e, pos) {
  if (e.t !== 'act' || !e.bd) return; nAct++;
  var p = pos[e.u], d = e.u.charAt(0) === 'A' ? 1 : -1;
  if (e.me !== p.br * 8 + p.bx) badR++;
  if (e.pattern === 'single' && e.range.indexOf(p.br * 8 + p.bx + d) < 0) badR++;
});
ok(nAct > 5 && badR === 0, '每次出手的綠格＝自己目前的格子、紅格從那裡往前算（' + nAct + ' 次出手，不符 ' + badR + ' 次）');

console.log('[僵局（D）：連續 8 回合沒人受傷]');
r = B.run([{ cell: 0, unit: mk('上') }], [{ cell: 6, unit: mk('下敵') }], { seed: 8, maxRounds: 36 });
var st = r.events.filter(function (e) { return e.t === 'stale'; })[0];
ok(r.stale && !r.timeout && st && st.quiet === 8 && r.rounds === 9, '不同列、互相打不到：第 ' + r.rounds + ' 回合判定僵局（連續 ' + (st ? st.quiet : '?') + ' 回合沒人受傷），不等到 36 回合');
ok(r.win === false, '僵局血量相同算我方沒贏');
r = B.run([{ cell: 3, unit: mk('前') }], [{ cell: 3, unit: mk('敵', { hp: 30000 }) }], { seed: 9, maxRounds: 36 });
ok(!r.stale && r.win, '一直有人受傷就照常打完');

console.log('[舊戰報相容]');
var g10 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'battle-golden-v10.json'), 'utf8'));
ok(JSON.stringify(require('./golden-run.js')(load, { rv: 10 })) === JSON.stringify(g10), 'R.RV=10 重跑：與 battle-golden-v10.json 完全相同');
var g11p = path.join(__dirname, 'fixtures', 'battle-golden-v11.json'), now11 = require('./golden-run.js')(load, { rv: 11 });
if (process.argv[2] === '--write-golden') fs.writeFileSync(g11p, JSON.stringify(now11, null, 1));
ok(fs.existsSync(g11p) && JSON.stringify(JSON.parse(fs.readFileSync(g11p, 'utf8'))) === JSON.stringify(now11), 'v11 規則固定種子結果與 battle-golden-v11.json 相同');
ok(JSON.stringify(now11) !== JSON.stringify(g10), 'v11 與 v10 結果不同（確實換了規則）');

console.log('[遊戲內戰鬥]');
c = load(); M = c.MJ; M.U.now = function () { return 1767225600000; }; M.G.newGame('測', '力耐', 'm', 1);
var res = M.G.fight('s1_1', 99);
ok(res.battle.board && res.battle.board.v === 12 && res.battle.units.every(function (u) { return u.br === Math.floor(u.cell0 / 3); }), '實際關卡仍使用 BOARD-3 v12 棋盤（RV13 僅新增技能規則），沒有人換列');
var nt = 0;
for (var s = 1; s <= 30; s++) { var rr = M.G.fight(['s1_1', 's1_2', 's1_3'][s % 3], s * 13); if (rr.battle.timeout) nt++; }
ok(nt <= 3, '前三關 30 場超時 ' + nt + ' 場');
// 真武將 6 對 6（不同陣形錯開列）：會有人走到底排隊，而且沒有人換列
var list = M.D.heroes.list, nw = 0, lane = 0;
var team = list.slice(0, 6).map(function (d, i) { var hh = M.G.newHero(d.id, M.S.state); hh.lv = 30; return { unit: M.R.heroUnit(hh, M.S.state), cell: [0, 1, 2, 3, 4, 5][i] }; });
var foes = list.slice(6, 12).map(function (d, i) { var hh = M.G.newHero(d.id, M.S.state); hh.lv = 30; return { unit: M.R.heroUnit(hh, M.S.state), cell: [3, 4, 5, 6, 7, 8][i] }; });
team.concat(foes).forEach(function (t) { t.unit.rv = 11; }); // 這段驗證 v11 行為：單位固定 rv 11
for (s = 1; s <= 10; s++) { rr = B.run(JSON.parse(JSON.stringify(team)), JSON.parse(JSON.stringify(foes)), { seed: s, maxRounds: 36, levelSuppression: 10 }); rr.events.forEach(function (e) { if (e.t === 'adv') e.m.forEach(function (m) { if (m.wrap) nw++; }); }); if (!rr.units.every(function (u) { return u.br === Math.floor(u.cell0 / 3); })) lane++; }
ok(nw > 0 && lane === 0, '真武將錯列對戰 10 場：走到底排隊 ' + nw + ' 次、換列 ' + lane + ' 場');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
