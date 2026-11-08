// 加碼玩法單元測試（華容道、觀星台、玄機盤）：node tests/unit-extras.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, G = M.G, R = M.R, S = M.S, U = M.U;
G.newGame('測試', '力耐', 'm', 7);
var s = S.state;
ok(s.qiyu && s.qiyu.hrd && s.qiyu.star && s.qiyu.wheel, '新存檔有奇遇欄位');
G.lead().lv = 1;
ok(!G.hrdStart(0).ok && !G.starDraw(0).ok && !G.wheelSpin().ok, '主角未滿 ' + G.QIYU_OPEN + ' 級時奇遇未開放');
G.lead().lv = 20;

// ---- 華容道：以 BFS 驗證每個布局的最少步數 ----
function key(b) { var g = G.hrdGrid(b); return U.map(g, function (v) { return v < 0 ? '.' : b[v].t; }).join(''); }
function bfs(start) {
  var q = [start], seen = {}, d = {}; var k0 = key(start); seen[k0] = 1; d[k0] = 0;
  for (var h = 0; h < q.length; h++) {
    var b = q[h], kb = key(b);
    if (U.find(b, function (p) { return p.t === 'C' && p.r === 3 && p.c === 1; })) return d[kb];
    var g = G.hrdGrid(b);
    for (var i = 0; i < b.length; i++) {
      var p = b[i], z = G.HRD_SIZE[p.t];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (m) {
        var nr = p.r + m[0], nc = p.c + m[1];
        if (nr < 0 || nc < 0 || nr + z[0] > 5 || nc + z[1] > 4) return;
        for (var r = 0; r < z[0]; r++) for (var cc = 0; cc < z[1]; cc++) { var v = g[(nr + r) * 4 + nc + cc]; if (v !== -1 && v !== i) return; }
        var nb = b.map(function (x, j) { return j === i ? { t: x.t, r: nr, c: nc } : x; });
        var k = key(nb); if (seen[k]) return; seen[k] = 1; d[k] = d[kb] + 1; q.push(nb);
      });
    }
  }
  return -1;
}
function solvePath(start) {
  // 回傳一串 [pi, dr, dc]（依棋子索引）讓 G.hrdMove 實際走完
  var q = [start], prev = {}, k0 = key(start); prev[k0] = null; var keyOf = [k0];
  for (var h = 0; h < q.length; h++) {
    var b = q[h], kb = keyOf[h];
    if (U.find(b, function (p) { return p.t === 'C' && p.r === 3 && p.c === 1; })) {
      var path = [], k = kb; while (prev[k]) { path.unshift(prev[k].mv); k = prev[k].from; } return path;
    }
    var g = G.hrdGrid(b);
    for (var i = 0; i < b.length; i++) {
      var p = b[i], z = G.HRD_SIZE[p.t];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (m) {
        var nr = p.r + m[0], nc = p.c + m[1];
        if (nr < 0 || nc < 0 || nr + z[0] > 5 || nc + z[1] > 4) return;
        for (var r = 0; r < z[0]; r++) for (var cc = 0; cc < z[1]; cc++) { var v = g[(nr + r) * 4 + nc + cc]; if (v !== -1 && v !== i) return; }
        var nb = b.map(function (x, j) { return j === i ? { t: x.t, r: nr, c: nc } : x; });
        var k = key(nb); if (k in prev) return; prev[k] = { from: kb, mv: [i, m[0], m[1]] }; q.push(nb); keyOf.push(k);
      });
    }
  }
  return null;
}
console.log('[華容道]');
G.HRD.forEach(function (lv, i) {
  var b = lv.p.map(function (x) { return { t: x[0], r: x[1], c: x[2] }; });
  var g = G.hrdGrid(b), empty = g.filter(function (v) { return v < 0; }).length;
  ok(empty === 2, lv.name + '：棋盤合法（剩 2 個空格）');
  ok(bfs(b) === lv.min, lv.name + '：BFS 最少步數 = ' + lv.min);
});
ok(!G.hrdStart(1).ok, '沒破第一關不能挑第二關');
ok(G.hrdStart(0).ok && G.hrd().moves === 0, '開始第一關');
ok(!G.hrdMove(0, 2, 0).ok, '一次只能移動一格');
var blocked = null; G.hrd().cur.forEach(function (p, i) { if (blocked == null && !G.hrdCanMove(i, -1, 0) && p.r > 0) blocked = i; });
ok(blocked != null && !G.hrdMove(blocked, -1, 0).ok, '被擋住的棋子不能移動');
var path = solvePath(G.hrd().cur), m0 = path[0];
G.hrdMove(m0[0], m0[1], m0[2]);
ok(G.hrd().moves === 1 && G.hrdUndo().ok && G.hrd().moves === 2 && G.hrd().hist.length === 0, '悔一步會還原位置（悔棋也算步數）');
G.hrdReset();
var gold0 = s.player.gold, last;
path.forEach(function (m) { last = G.hrdMove(m[0], m[1], m[2]); });
ok(last.ok && last.solved && last.moves === G.HRD[0].min && last.stars === 3, '照最短解走完會破解，並拿到三星');
ok(last.first && last.daily && s.player.gold > gold0, '首次破解與歷練破解獎勵都發放');
ok(!G.hrdMove(0, 1, 0).ok, '破解後不能再移動');
ok(G.hrdUnlocked(1) && G.hrdStart(1).ok, '破解後解鎖下一關');
G.hrdStart(0); var p2 = solvePath(G.hrd().cur), l2; p2.forEach(function (m) { l2 = G.hrdMove(m[0], m[1], m[2]); });
ok(l2.solved && !l2.first && !l2.daily && l2.rewards.length === 0, '沒有再贏戰鬥就再次破解，不會重複領獎');
var raw = JSON.stringify(S.wrap(s));
ok(S.parse(raw).ok && S.parse(raw).state.qiyu.hrd.best.h1 === G.HRD[0].min, '最佳步數會存進存檔');

console.log('[觀星台]');
function seq(vals) { var i = 0; return function () { return vals[i++ % vals.length]; }; }
var st0 = G.starState();
ok(st0.free && st0.left === Infinity && !st0.luck && G.starExpBonus() === 0, '新存檔第一次免費、不限次數、尚無星運');
s.player.gold = 15;
var d1 = G.starDraw(3, seq([0.5]));
ok(d1.ok && d1.cost === 0 && d1.luck.id === 'xiaoji' && s.player.gold === 15, '第一次免費（機率 0.5 → 小吉）');
ok(G.starExpBonus() === 8, '今日星運給 +8% 經驗');
var d2 = G.starDraw(0, seq([0.99]));
ok(d2.ok && d2.cost === G.STAR_GOLD && d2.luck.id === 'moji' && G.starExpBonus() === 8, '第二次花金幣；抽到較差的不會蓋掉目前最好的');
var d3 = G.starDraw(1, seq([0.01]));
ok(!d3.ok, '金幣不足時不能觀星');
s.player.gold = 100; d3 = G.starDraw(1, seq([0.01]));
ok(d3.ok && d3.luck.id === 'daji' && G.starExpBonus() === 20, '抽到大吉會升級今日星運');
ok(G.starDraw(2, seq([0.5])).ok && s.qiyu.star.luck === 'daji', '第 4 次仍可觀星（沒有每日上限），較差結果不覆蓋大吉');
var allPos = G.STAR_LUCK.every(function (l) { return l.exp > 0 && G.starReward(l).silver > 0; });
ok(allPos, '所有運勢都是正面效果（沒有懲罰）');
s.stages = {}; G.lead().lv = 20; s.player.energy = 999;
var hero = G.lead(), exp0 = hero.exp, lv0 = hero.lv;
var fr = G.fight('s1_1', 3);
ok(fr.win && fr.starPct === 20 && fr.starExp === Math.floor(fr.exp * 0.2), '虛空之門勝利時套用星運經驗加成');
ok(s.qiyu.star.luckLeft === G.STAR_LAST - 1, '每場虛空之門勝利扣 1 場星運（剩 ' + s.qiyu.star.luckLeft + ' 場）');
s.qiyu.star.day = '2000-01-01'; ok(G.starExpBonus() === 20, '星運不看日期（換日不失效）');
s.qiyu.star.luckLeft = 1; G.fight('s1_1', 4);
ok(G.starExpBonus() === 0 && !G.starState().luck, '星運場數用完後失效');

console.log('[玄機盤]');
var odds = G.wheelOdds(), sum = 0; odds.forEach(function (o) { sum += o.pct; });
ok(odds.length === 12 && Math.abs(sum - 100) < 0.5, '12 個獎項（5 顆骰子），機率加總 100%');
var dd = G.wheelDice(seq([0.5]));
ok(dd.dice.join(',') === '4,4,4,4,4' && dd.v === 4665, '5 顆骰子作 base-6 數字（0.5 → 全 4，v=4665）');
ok(G.wheelDice(seq([0])).dice.join(',') === '1,1,1,1,1' && G.wheelDice(seq([0.999])).dice.join(',') === '6,6,6,6,6', '骰面 1～6 邊界正確');
var w0 = G.wheelState(); s.player.silver = 0;
var sp1 = G.wheelSpin(seq([0.5]));
ok(sp1.ok && sp1.free && sp1.cost === 0, '新存檔第一次免費（之後每贏 ' + G.TICKET.wheel + ' 場一次）');
ok(sp1.dice.join(',') === '4,4,4,4,4' && sp1.idx === 6, '同種子擲出全 4，對應獎項「培養丹 ×5」（base-6 映射決定）');
ok(!G.wheelSpin(seq([0.5])).ok, '銀幣不足時不能轉');
s.player.silver = 1e9; s.qiyu.wheel.pity = 0;
var hitBig = false;
for (var i = 0; i < G.WHEEL_PITY - 1; i++) { var r = G.wheelSpin(seq([0.99])); if (r.idx === 0) hitBig = true; }
ok(!hitBig && s.qiyu.wheel.pity === G.WHEEL_PITY - 1, '連續 9 次沒有大獎');
var sv = s.player.silver, rp = G.wheelSpin(seq([0.99]));
ok(rp.idx === 0 && s.qiyu.wheel.pity === 0 && sv - s.player.silver + 100 >= G.wheelCost(), '第 10 次保底必中玄機大獎，之後保底重算');
var big = G.wheelSpin(seq([0.001]));
ok(big.idx === 0 && s.qiyu.wheel.pity === 0, '正常機率也可能直接中大獎');
var cnt = {}, rng = U.rng(42); s.qiyu.wheel.pity = -1e9;
for (var j = 0; j < 4000; j++) { var x = G.wheelSpin(rng); cnt[x.idx] = (cnt[x.idx] || 0) + 1; }
ok(Math.abs(cnt[3] / 4000 - odds[3].pct / 100) < 0.03, '大量轉動的分布接近公開機率（銀幣 ' + odds[3].pct + '%，實測 ' + (cnt[3] / 40).toFixed(1) + '%）');
ok(G.wheelCost() === 500 + 100 * G.lead().lv, '花費 500＋等級×100 銀幣');

console.log('[舊存檔]');
var old = JSON.parse(JSON.stringify(s)); delete old.qiyu;
var po = S.parse(JSON.stringify(S.wrap(old)));
ok(po.ok && po.state.qiyu && po.state.qiyu.wheel.pity === 0, '沒有奇遇欄位的舊存檔會自動補上');

console.log('\n加碼玩法：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
