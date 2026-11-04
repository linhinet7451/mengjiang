// 緊急修正回歸測試：陣法存檔、攻擊範圍（v9）。node tests/unit-fix.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c.MJ.U.now = function () { return T0; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
function J(o) { return JSON.stringify(o); }

console.log('[修正一：陣法與站位存檔]');
var c = fresh(), M = c.MJ, G = M.G, S = M.S;
G.lead().lv = 70; // 開放全部陣法與 8 人上陣
var ids = S.state.heroes.map(function (h) { return h.uid; });
var r1 = G.setFormation('yulin');
ok(r1.ok && S.state.team.formation === 'yulin', '換成魚鱗陣');
var before = J(S.state.team.cells);
// 換陣法時原本站在新陣法開放格上的武將不會被搬動
var keep = Object.keys(S.state.team.cells).filter(function (k) { return M.D.formIndex.fengshi.cells.indexOf(+k) >= 0 || G.openCells().length === 9; });
var lead = G.lead().uid, leadCell = +G.inTeam(lead);
var tgt = leadCell === 2 ? 1 : 2; var rs = G.setCell(tgt, lead);
ok(rs.ok && +G.inTeam(lead) === tgt, '主角移到第 ' + tgt + ' 格');
var cells1 = J(S.state.team.cells);
S.save();
// 重新載入（同一個 localStorage）
var p = S.load();
ok(p.ok && p.state.team.formation === 'yulin' && J(p.state.team.cells) === cells1, '存檔→讀檔後陣法與站位不變 ' + cells1);
S.state = p.state;
var cap = [], run = M.Battle.run;
M.Battle.run = function (t) { cap.push(J(t.map(function (x) { return [x.cell, x.unit.name]; }).sort())); return run.apply(this, arguments); };
var want = J(G.teamList().map(function (x) { return [x.cell, G.nameOf(x.hero)]; }).sort());
var nm = {};
G.fight('s1_1'); ok(cap[cap.length - 1] === want, '一般關卡使用編好的站位');
G.towerFight(); ok(cap[cap.length - 1] === want, '通天塔使用編好的站位');
var n1 = cap.length, wr = G.wujiRun(G.WUJI[0].id); ok(wr.ok && cap[n1] === want, '無極幻境（第一波）使用編好的站位');
n1 = cap.length; var sr = G.sgRun(G.SG_TIERS[0].id); ok(sr.ok && cap[n1] === want, '藏寶窟（第一關）使用編好的站位');
var al = G.arenaList(); var ar = G.arenaFight(al[0]); ok(ar.ok && cap[cap.length - 1] === want, '拜訪武將（競技）使用編好的站位');
M.Battle.run = run;
// 換陣法（Tomas 2026-11-04 回報修正）：武將依新陣法的格位順序換位，順序沿用舊陣法的格位順序；沒有人被踢出
c = fresh(); M = c.MJ; G = M.G; S = M.S;
var forms1 = M.D.formations.filter(function (f) { return !f.open || f.open <= 1; });
function orderIn(f) { var cells = S.state.team.cells; return f.cells.filter(function (x) { return cells[x]; }).map(function (x) { return cells[x]; }); }
var prevF = G.formation(), n0 = G.teamCount(), allMove = true, kept = true, anyMoved = false;
forms1.forEach(function (f) {
  if (f.id === G.formation().id) return;
  var before = orderIn(G.formation()), r3 = G.setFormation(f.id), want = f.cells.slice(0, n0).sort().join(',');
  if (!(r3.ok && G.teamCount() === n0 && Object.keys(S.state.team.cells).map(Number).sort().join(',') === want)) allMove = false;
  if (orderIn(f).join(',') !== before.join(',')) kept = false;
  if (r3.moved && r3.moved.length) anyMoved = true;
});
ok(allMove, '換到每個 1 級陣法：' + n0 + ' 位武將都站到新陣法格位順序的前 ' + n0 + ' 格（' + forms1.length + ' 個陣法）');
ok(kept, '換陣時武將的先後順序不變（舊陣第 k 位 → 新陣第 k 位）');
ok(anyMoved, '換陣法確實會讓武將換位（舊版因格子重疊幾乎不動）');
G.setFormation('fangyuan'); var fa = J(S.state.team.cells); G.setFormation('yanxing'); var ya = J(S.state.team.cells);
ok(fa !== ya, '方圓陣 → 雁行陣 站位不同（方圓 ' + fa + '／雁行 ' + ya + '）');
var cap2 = []; var run2 = M.Battle.run; M.Battle.run = function (a, b, o) { cap2.push(J(a.map(function (x) { return x.cell; }).sort())); return run2.apply(this, arguments); };
G.fight('s1_1'); M.Battle.run = run2;
ok(cap2[0] === J(Object.keys(S.state.team.cells).map(Number).sort()), '換陣後的關卡戰鬥使用新陣法站位（' + cap2[0] + '）');
var p2 = S.load(); // setFormation 已自動存檔（G.commit）
ok(p2.ok && p2.state.team.formation === 'yanxing' && J(p2.state.team.cells) === ya, '換陣自動存檔，重新讀檔：陣法與站位都保留');
ok(M.R.teamSlots(999) === 8, '上陣上限 8 人（陣法畫面提示改為「最多 8 人」）');

console.log('[修正二：攻擊範圍以自己的格子為起點]');
c = load(); M = c.MJ; var B = M.Battle;
function mk(n, hp, pat, atk) { return { name: n, hp: hp, patk: atk || 100, matk: 100, pdef: 0, mdef: 0, lv: 10, phys: true, dtype: 'p', active: { name: n + '技', pattern: pat || 'single', mult: 1 }, ult: { name: n + '無雙', pattern: pat || 'single', mult: 1 }, rv: 9 }; }
function hitsBy(r) { var o = {}; r.events.forEach(function (e) { if (e.t === 'hit' && !e.miss) o[e.from] = (o[e.from] || 0) + 1; }); return o; }
// Tomas 的情境：同一列前後兩人，後面的人單體（往前 1 格）
var r = B.run([{ cell: 3, unit: mk('前', 1e6) }, { cell: 4, unit: mk('後', 1e6) }], [{ cell: 3, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 4 });
var hb = hitsBy(r);
ok(hb.A3 > 0 && !hb.A4, '前排隊友活著時，後排單體武將打不到（前 ' + (hb.A3 || 0) + ' 次、後 ' + (hb.A4 || 0) + ' 次）');
ok(r.events.some(function (e) { return e.t === 'whiff' && e.u === 'A4' && e.blocked && e.blocked.indexOf(3) >= 0; }), '後排揮空事件標出被隊友擋住的格子（格 3）');
ok(!r.events.some(function (e) { return e.t === 'rage' && e.u === 'A4'; }), '揮空不加無雙值');
// 前排陣亡後，後排就打得到
r = B.run([{ cell: 3, unit: mk('前', 1) }, { cell: 4, unit: mk('後', 1e6) }], [{ cell: 3, unit: mk('敵', 1e6, 'single', 50) }], { seed: 1, maxRounds: 4 });
hb = hitsBy(r);
ok(r.events.some(function (e) { return e.t === 'dead' && e.to === 'A3'; }) && hb.A4 > 0, '前排陣亡後，後排就能出手（後 ' + (hb.A4 || 0) + ' 次）');
// 打 2 格的後排武將，前排活著也打得到
r = B.run([{ cell: 3, unit: mk('前', 1e6) }, { cell: 4, unit: mk('後', 1e6, 'line2') }], [{ cell: 3, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 3 });
ok(hitsBy(r).A4 > 0, '直線 2 格的後排武將越過前排隊友打到敵人');
// 往前衝：打不到、且自己正前方是空格時往前一格（前排隊友仍擋著，所以衝完仍揮空）
r = B.run([{ cell: 3, unit: mk('前', 1e6) }, { cell: 5, unit: mk('後', 1e6) }], [{ cell: 3, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 2 });
var mv = r.events.filter(function (e) { return e.t === 'move' && e.u === 'A5'; });
ok(mv.length === 1 && mv[0].from === 5 && mv[0].to === 4, '前方空格：往前衝一格（5→4），之後被隊友擋住不再前進');
ok(!hitsBy(r).A5, '衝到隊友身後仍打不到（單體）');
var u5 = r.units.filter(function (u) { return u.key === 'A5'; })[0];
ok(u5.cell0 === 5 && u5.cell === 4, '戰後保留原始格（cell0=5），下一波從原格開始');
// 自己這一列沒有敵人：往有敵人的列橫移（D 防卡關）
r = B.run([{ cell: 0, unit: mk('上', 1e6) }], [{ cell: 6, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 3 });
mv = r.events.filter(function (e) { return e.t === 'move' && e.side; });
ok(mv.length >= 1 && mv[0].from === 0 && mv[0].to === 3 && hitsBy(r).A0 > 0, '同列沒有敵人：橫移一列（0→3）後再打');
// 範圍內完全沒有敵人（全部在別列且有隊友擋）：揮空
r = B.run([{ cell: 0, unit: mk('上', 1e6) }, { cell: 3, unit: mk('中前', 1e6) }, { cell: 6, unit: mk('下', 1e6) }, { cell: 4, unit: mk('中後', 1e6) }], [{ cell: 0, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 2 });
ok(r.events.some(function (e) { return e.t === 'whiff'; }), '打不到又不能移動時揮空');
// 無雙打不到：保留無雙值，改用主動技
var a = mk('甲', 1e6, 'single'); a.ult = { name: '甲無雙', pattern: 'diag', mult: 3 }; // diag 正前方那格不打
r = B.run([{ cell: 3, unit: a }], [{ cell: 3, unit: mk('敵', 1e6) }], { seed: 2, maxRounds: 12 });
var acts = r.events.filter(function (e) { return e.t === 'act' && e.u === 'A3'; });
ok(acts.length && acts.every(function (e) { return !e.ult; }), '無雙範圍內沒有敵人時改用主動技（' + acts.length + ' 次都不是無雙）');
// 全體技能不受擋格影響
r = B.run([{ cell: 3, unit: mk('前', 1e6) }, { cell: 4, unit: mk('後', 1e6, 'all') }], [{ cell: 8, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 2 });
ok(hitsBy(r).A4 > 0, '全體技能不受擋格影響');
// 戰報攜帶範圍資料給畫面用
r = B.run([{ cell: 3, unit: mk('前', 1e6, 'line3') }], [{ cell: 3, unit: mk('敵', 1e6) }], { seed: 1, maxRounds: 1 });
var ae = r.events.filter(function (e) { return e.t === 'act'; })[0];
ok(ae && ae.rv === 9 && J(ae.range) === J([3, 4, 5]) && J(ae.cells) === J([3]), '攻擊事件附上紅格 range=' + J(ae && ae.range) + '、受擊 cells=' + J(ae && ae.cells));
// 範圍位移表
ok(J(B.rangeOffsets({ pattern: 'single' }, 1)) === '[[0,0]]' && J(B.rangeOffsets({ pattern: 'col2' }, 2)) === '[[0,0],[-1,0]]', '位移表：單體＝正前方；縱向 2 格在最下列往上翻');
ok(J(B.rangeOffsets({ pattern: 'single', shape: [[0, 1]] }, 1)) === '[[0,1]]', 'skill.shape 可覆寫範圍（給 P4 的 Lv6 圖用）');
// 舊規則：rv 8 的單位照舊（舊戰報可重播）
var o = mk('後', 1e6); o.rv = 8; var f8 = mk('前', 1e6); f8.rv = 8; var e8 = mk('敵', 1e6); e8.rv = 8;
r = B.run([{ cell: 3, unit: f8 }, { cell: 4, unit: o }], [{ cell: 3, unit: e8 }], { seed: 1, maxRounds: 3 });
ok(hitsBy(r).A4 > 0 && !r.events.some(function (e) { return e.t === 'whiff' || e.t === 'move'; }), 'rv 8 單位維持舊規則（舊戰報結果不變）');
// 遊戲內產生的單位都是 v9
c = fresh(); M = c.MJ;
var bt = M.G.buildTeam();
ok(bt.length && bt.every(function (x) { return x.unit.rv === M.R.RV && M.R.RV >= 9; }), '遊戲內武將單位使用 v9 規則（rv=' + M.R.RV + '）');
var res = M.G.fight('s1_1');
ok(res.ok !== false && res.battle.events.some(function (e) { return e.t === 'act' && e.range; }), '實際關卡戰報帶有攻擊範圍');

console.log('[v9 戰鬥黃金樣本]');
var gold = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'battle-golden-v9.json'), 'utf8'));
var now = require('./golden-run.js')(load, { rv: 9 });
ok(JSON.stringify(now) === JSON.stringify(gold), 'v9 規則（R.RV=9）固定種子戰鬥結果與 battle-golden-v9.json 相同（改規則時要更新樣本）');
var leg = require('./golden-run.js')(load, { legacy: true }), g6 = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'battle-golden-v6.json'), 'utf8'));
ok(JSON.stringify(leg) !== JSON.stringify(now), '新舊規則結果不同（確實換了範圍規則）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
