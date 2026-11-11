// 關卡小兵數量梯度單元測試（2026-11-09，使用者回饋：每關小兵太少，貼近原版人海）：node tests/unit-stages.js
// 梯度（D 級設計）：普通關依章節遞增，菁英／首領／隱藏關以首領＋小兵填滿；上限 9 格（cell 0-8）。
// 新增小兵沿用該章 pool，等級＝關卡 lv；首領等級＝關卡 lv+1、固定在 cell 4。
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, D = M.D;
var stages = D.stages.stages, chapters = {};
D.stages.chapters.forEach(function (ch) { chapters[ch.id] = ch; });
var TARGETS = {
  1: { normal: [4, 4, 5, 5, 5], elite: 6, boss: 7, hidden: 7 },
  2: { normal: [5, 5, 6, 6, 6], elite: 7, boss: 7, hidden: 7 },
  3: { normal: [6, 6, 7, 7, 7], elite: 8, boss: 8, hidden: 8 },
  4: { normal: [7, 7, 7, 7, 7], elite: 8, boss: 8, hidden: 8 },
  5: { normal: [8, 8, 8, 8, 8], elite: 9, boss: 9, hidden: 9 },
  6: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  7: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  8: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  9: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  10: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  11: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  12: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 },
  13: { normal: [9, 9, 9, 9, 9], elite: 9, boss: 9, hidden: 9 }
};
ok(stages.length === 117, '共 117 關');
var normalSeen = {}, total = 0, bad = [];
stages.forEach(function (s) {
  var ch = chapters[s.ch], t = TARGETS[s.ch];
  var target = s.kind === 'normal' ? t.normal[normalSeen[s.ch] || 0] : t[s.kind];
  if (s.kind === 'normal') normalSeen[s.ch] = (normalSeen[s.ch] || 0) + 1;
  total += s.enemies.length;
  if (s.enemies.length !== target) bad.push(s.id + ' 有 ' + s.enemies.length + ' 名，應為 ' + target);
  var cells = {};
  s.enemies.forEach(function (e) {
    if (e.cell < 0 || e.cell > 8 || cells[e.cell]) bad.push(s.id + ' cell 重複或超出 0-8：' + e.cell);
    cells[e.cell] = 1;
    if (!D.stages.enemies[e.e]) bad.push(s.id + ' 未知的敵人種類：' + e.e);
    if (e.leader) {
      if (s.kind === 'normal') bad.push(s.id + ' 普通關不應有首領');
      if (e.lv !== s.lv + 1) bad.push(s.id + ' 首領等級應為關卡 lv+1');
      var want = s.kind === 'elite' ? ch.elite : (s.kind === 'boss' ? [ch.boss] : [ch.hidden]);
      if (want.indexOf(e.e) < 0) bad.push(s.id + ' 首領 ' + e.e + ' 不在該章 ' + s.kind + ' 名單');
    } else {
      if (ch.pool.indexOf(e.e) < 0) bad.push(s.id + ' 小兵 ' + e.e + ' 不在該章 pool');
      if (e.lv !== s.lv) bad.push(s.id + ' 小兵等級應與關卡 lv 一致：' + e.e + ' lv' + e.lv);
    }
  });
  var leaders = s.enemies.filter(function (e) { return e.leader; }).length;
  if (s.kind === 'normal' && leaders !== 0) bad.push(s.id + ' 普通關有首領');
  if (s.kind !== 'normal' && leaders !== 1) bad.push(s.id + ' ' + s.kind + '關應恰有 1 名首領，實際 ' + leaders);
});
ok(!bad.length, '每關數量符合梯度、cell 唯一且在 0-8、種類屬於該章 pool、首領關恰有 1 名首領' + (bad.length ? '（' + bad.slice(0, 5).join('；') + '）' : ''));
ok(total === 961, '小兵＋首領總數 961（WL-1：556；WL-2 新增 ch9／ch10 共 162；WL-12 新增 ch11–13 共 243）');
var counts = {};
stages.forEach(function (s) { counts[s.ch + '-' + s.kind] = (counts[s.ch + '-' + s.kind] || []).concat(s.enemies.length); });
ok(counts['1-normal'].join(',') === '4,4,5,5,5' && counts['2-normal'].join(',') === '5,5,6,6,6', '第 1-2 章普通關 4-6 名（教學關保留 4 名，不一次填滿）');
ok(counts['5-normal'].join(',') === '8,8,8,8,8' && counts['8-normal'].join(',') === '9,9,9,9,9', '第 5 章普通關 8 名、第 8 章普通關填滿 9 名');
ok(counts['1-boss'].join(',') === '7' && counts['2-elite'].join(',') === '7,7' && counts['5-elite'].join(',') === '9,9', '菁英／首領關首領＋小兵填滿至 7-9 名');
// 難度不只看數量：第一關新手隊 40 種子仍全勝（unit-board 另有 >=24/40 門檻），小兵等級未動
var G = M.G, S = M.S;
G.newGame('測試', '力耐', 'm', 7);
var w = 0;
for (var sd = 1; sd <= 10; sd++) { var r = G.fight('s1_1', sd * 7 + 1); if (r.win) w++; }
ok(w === 10, '第一關（4 名敵人）新手隊 10 種子全勝，教學難度未失控');
console.log('結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
