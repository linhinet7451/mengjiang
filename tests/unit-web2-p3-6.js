// P3-6：戰場道具來源格形、可重播事件與 BOSS／精英框色。node tests/unit-web2-p3-6.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function mk(n, rv) {
  return { name: n, lv: 10, hp: 100000, patk: 100, matk: 80, jatk: 90, pdef: 10, mdef: 10, jdef: 10, hit: 200, crit: 0, dodge: 0, rv: rv,
    dtype: 'p', phys: true, active: { name: '普攻', pattern: 'single', mult: 1 }, ult: { name: '無雙', pattern: 'single', mult: 1 } };
}
var c = load(), M = c.MJ, B = M.Battle, cfg = M.D.config.battleItems;
console.log('[P3-6 來源格形／隨機事件／版本閘門／框色]');
ok(M.R.RV === 15, '目前戰鬥規則升至 RV15');
ok(cfg.bombs.length === 3 && B.fieldItemCells('bombLarge').cells.length === 8, '大範圍炸彈 O 格為 8 格');
ok(eq(cfg.bombs.map(function (x) { return x.rows; }), [['XOOX', 'OOOO', 'XOOX'], ['OXO', 'XOX', 'OXO'], ['XOX', 'OOO', 'XOX']]), '大／中／小炸彈三種來源格形照錄');
ok(B.fieldItemCells('bombMedium').cells.length === 5 && B.fieldItemCells('bombSmall').cells.length === 5, '中／小炸彈各 5 格（依來源 X/O 掩碼計數）');
var fl = B.fieldItemCells('flame', 'A'), fr = B.fieldItemCells('flame', 'B');
ok(fl.cells.length === 4 && eq(fl.cells, [[1, 1], [2, 2], [3, 3], [4, 4]]), '左側噴火槍四格斜線方向正確');
ok(fr.cells.length === 4 && eq(fr.cells, [[1, 3], [2, 2], [3, 1], [4, 0]]), '右側噴火槍四格反向斜線正確');
ok(B.resolveFieldItem('flame', { side: 'A' }).status === 'burn', '噴火槍事件附灼傷狀態描述');
var b1 = B.resolveFieldItem('bombLarge', { seed: 754, side: 'A' }), b2 = B.resolveFieldItem('bombLarge', { seed: 754, side: 'A' });
ok(eq(b1, b2) && b1.cells.some(function (x) { return eq(x, b1.hitCell); }), '炸彈隨機命中格在固定 seed 下可重現且位於 O 格');
ok(b1.strength === 'low' && B.resolveFieldItem('bombSmall', { seed: 754 }).strength === 'high', '大炸彈威力低、小炸彈威力高（相對級距）');
var f1 = B.resolveFieldItem('flag', { hits: 1, seed: 19 }), f2 = B.resolveFieldItem('flag', { hits: 2, seed: 19 }), f3 = B.resolveFieldItem('flag', { hits: 3, seed: 19 });
ok(f1.percent === 8 && f1.perHitPercent === 8 && f1.stacks === 1, '旗幟命中 1 次為 8%×1');
ok(f2.percent === 14 && f2.perHitPercent === 7 && f2.stacks === 2, '旗幟命中 2 次為 7%×2');
ok(f3.percent === 18 && f3.perHitPercent === 6 && f3.stacks === 3, '旗幟命中 3 次為 6%×3');
ok(f1.stat === B.resolveFieldItem('flag', { hits: 1, seed: 19 }).stat && ['patk', 'matk', 'hit', 'mdef'].indexOf(f1.stat) >= 0, '旗幟屬性例子從來源已知欄中固定亂數選出');
ok(B.resolveFieldItem('flag', { hits: 4, seed: 19 }).unresolved, '來源未列的第 4 次旗幟級距保持未解析');
var fresh15 = B.run([{ cell: 3, unit: mk('A', 15) }], [{ cell: 3, unit: mk('B', 15) }], { seed: 92, maxRounds: 1, fieldItems: [{ id: 'bombLarge', side: 'A' }, { id: 'flag', side: 'B', hits: 2 }, { id: 'flame', side: 'B' }] });
var fresh15b = B.run([{ cell: 3, unit: mk('A', 15) }], [{ cell: 3, unit: mk('B', 15) }], { seed: 92, maxRounds: 1, fieldItems: [{ id: 'bombLarge', side: 'A' }, { id: 'flag', side: 'B', hits: 2 }, { id: 'flame', side: 'B' }] });
var fe = fresh15.events.filter(function (e) { return e.t === 'fieldItem'; });
ok(fe.length === 3 && fe.every(function (e) { return e.scope === 'displayOnly'; }), 'RV15 戰報包含三個只顯示來源描述的道具事件');
ok(eq(fe, fresh15b.events.filter(function (e) { return e.t === 'fieldItem'; })), '同一 seed 的完整道具事件可重播');
ok(fresh15.events[0].t === 'start' && fresh15.events[1].t === 'fieldItem', '道具事件緊接 start snapshot，便於舊事件序列版本隔離');
var legacy14 = B.run([{ cell: 3, unit: mk('A', 14) }], [{ cell: 3, unit: mk('B', 14) }], { seed: 92, maxRounds: 1, fieldItems: [{ id: 'bombLarge', side: 'A' }] });
ok(!legacy14.events.some(function (e) { return e.t === 'fieldItem'; }), 'RV14 舊戰報不附加新 P3.6 事件');
var elite = M.D.stageIndex.s1_4, boss = M.D.stageIndex.s1_8;
ok(elite.enemies.some(function (e) { return e.leader && e.honorFrame === 'silver'; }) && boss.enemies.some(function (e) { return e.leader && e.honorFrame === 'gold'; }), '既有精英／BOSS 首領資料分別標記銀框／金框');
ok(M.G.buildEnemy(elite).some(function (x) { return x.unit.honorFrame === 'silver'; }) && M.G.buildEnemy(boss).some(function (x) { return x.unit.honorFrame === 'gold'; }), '關卡建立敵人快照時保留首領框色欄位');
ok(['web2.battleItems.bombs', 'web2.battleItems.flag', 'web2.battleItems.flame', 'web2.honorTrial.frames'].every(function (id) { return M.D.provenance.entries.some(function (x) { return x.id === id; }); }), '炸彈、旗幟、火焰器與框色均有 provenance');
console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
