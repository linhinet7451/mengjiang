// v12 規則（C 玩家回憶 Tomas）：走到底不分敵我，統一回到第一排（我方 bx 2／敵方 bx 5）排隊，同列、不換列；被佔用就往後排。node tests/unit-wrap12.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, lv: 10, phys: true, dtype: 'p', hit: 200, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 12 }; for (var k in (o || {})) u[k] = o[k]; return u; }
function bu(side, br, bx, hp) { return { side: side, br: br, bx: bx, hp: hp == null ? 100 : hp, key: side + br + bx }; }

console.log('[版本]');
ok(M.R.RV === 13, '現行規則版本 R.RV = 13（棋盤仍使用 v12）');
var r = B.run([{ cell: 3, unit: mk('前') }], [{ cell: 3, unit: mk('敵') }], { seed: 1, maxRounds: 2 });
ok(r.board && r.board.v === 12 && r.events[0].bd.v === 12, '全部單位 rv 12：戰報標示 v12 棋盤');
r = B.run([{ cell: 3, unit: mk('前', { rv: 11 }) }], [{ cell: 3, unit: mk('敵') }], { seed: 1, maxRounds: 2 });
ok(r.board && r.board.v === 11, 'rv 11 與 rv 12 混在一起：整場照 v11');

console.log('[排隊格：統一換到最上方第一列]');
var q = bu('A', 2, 7), qb = bu('B', 2, 0);
function Q(u, list) { return JSON.stringify(B.queue12(u, list)); }
ok(Q(q, [q]) === '{"br":0,"bx":2}', '我方走到底：換到第一列（br 0）第一排欄（bx 2），不管原本在哪一列');
ok(Q(qb, [qb]) === '{"br":0,"bx":5}', '敵方走到底：換到第一列 bx 5');
ok(Q(q, [q, bu('A', 1, 6)]) === '{"br":0,"bx":2}', '不看隊友目前在哪');
ok(Q(q, [q, bu('A', 0, 2)]) === '{"br":0,"bx":1}', '第一列第一排已有隊友：排在其後方（bx 1）');
ok(Q(q, [q, bu('B', 0, 2)]) === '{"br":0,"bx":1}', '被敵人佔用也一樣排後方');
ok(Q(q, [q, bu('A', 0, 2), bu('A', 0, 1), bu('A', 0, 0)]) === '{"br":0,"bx":3}', '後方滿了：往前找第一列最近空格（bx 3）');
ok(Q(q, [q, bu('A', 0, 2), bu('A', 0, 1), bu('A', 0, 0), bu('A', 0, 3), bu('A', 0, 4), bu('A', 0, 5), bu('A', 0, 6), bu('A', 0, 7)]) === '{"br":1,"bx":2}', '第一列全滿：改排第 2 列');
ok(Q(qb, [qb, bu('A', 0, 5), bu('B', 0, 6)]) === '{"br":0,"bx":7}', '敵方：bx 5、6 被佔用，排到 bx 7');
ok(Q(q, [q, { side: 'B', br: 0, bx: 2, hp: 0 }]) === '{"br":0,"bx":2}', '陣亡的人讓出格子');

console.log('[實際戰鬥：走到底後雙方都在第一列輪流打]');
r = B.run([{ cell: 0, unit: mk('上') }, { cell: 7, unit: mk('下') }], [{ cell: 6, unit: mk('下敵', { hp: 20000 }) }], { seed: 3, maxRounds: 36 });
var wraps = [], nonWrapRowChange = 0, pos = {};
r.events[0].bd.pos.forEach(function (p) { pos[p[0]] = p[1]; });
r.events.forEach(function (e) { if (e.t === 'adv') e.m.forEach(function (m) { if (m.wrap) { wraps.push(m); pos[m.u] = m.br != null ? m.br : pos[m.u]; } else if (m.br != null) nonWrapRowChange++; }); });
ok(wraps.length >= 2, '有人走到底（' + wraps.length + ' 次）');
ok(wraps.every(function (m) { return m.br === 0 || m.br === 1 || m.br === 2; }) && wraps[0].br === 0, '走到底的人換到第一列（第一次 br ' + wraps[0].br + '）');
ok(nonWrapRowChange === 0, '平常前進沒有換列');
var lastBr = {}; r.units.forEach(function (u) { lastBr[u.key] = u.br; });
var hits = r.events.filter(function (e) { return e.t === 'hit' && !e.miss; }).length;
ok(hits > 5, '原本不同列（打不到）的敵我，走到底後在第一列接戰（命中 ' + hits + ' 次）');
ok(!r.stale && !r.timeout && r.win, '不再因為不同列而僵局或超時，我方打倒敵人');

console.log('[舊戰報相容與固定種子]');
var gold = require('./golden-run.js');
var g11 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'battle-golden-v11.json'), 'utf8'));
ok(JSON.stringify(gold(load, { rv: 11 })) === JSON.stringify(g11), 'R.RV=11 重跑：與 battle-golden-v11.json 完全相同（v11 舊戰報照舊重播）');
var g10 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'battle-golden-v10.json'), 'utf8'));
ok(JSON.stringify(gold(load, { rv: 10 })) === JSON.stringify(g10), 'R.RV=10 重跑：與 battle-golden-v10.json 完全相同');
var g12p = path.join(__dirname, 'fixtures', 'battle-golden-v12.json'), now12 = gold(load, { rv: 12 });
if (process.argv[2] === '--write-golden') fs.writeFileSync(g12p, JSON.stringify(now12, null, 1));
ok(fs.existsSync(g12p) && JSON.stringify(JSON.parse(fs.readFileSync(g12p, 'utf8'))) === JSON.stringify(now12), 'v12 規則固定種子結果與 battle-golden-v12.json 相同');
ok(JSON.stringify(now12) !== JSON.stringify(g11), 'v12 與 v11 結果不同（確實換了規則）');
var g13p = path.join(__dirname, 'fixtures', 'battle-golden-v13.json'), now13 = gold(load);
if (process.argv[2] === '--write-golden') fs.writeFileSync(g13p, JSON.stringify(now13, null, 1));
ok(fs.existsSync(g13p) && JSON.stringify(JSON.parse(fs.readFileSync(g13p, 'utf8'))) === JSON.stringify(now13), 'v13 技能倍率固定種子結果與 battle-golden-v13.json 相同');

console.log('[遊戲內戰鬥]');
c = load(); M = c.MJ; M.U.now = function () { return 1767225600000; }; M.G.newGame('測', '力耐', 'm', 1);
var res = M.G.fight('s1_1', 99);
ok(res.battle.board && res.battle.board.v === 12, '實際關卡使用 v12 棋盤（R.RV 13 只新增技能規則）');
console.log('結果：通過 ' + pass + '／失敗 ' + fail);
process.exit(fail ? 1 : 0);
