// P4-3 生死劫九層、解鎖、首通獎勵與存檔遷移。node tests/unit-web2-p4-3.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
var c = load(), M = c.MJ, G = M.G, S = M.S;
G.newGame('生死劫測試', '力耐', 'm', 9);
var names = ['魑', '冷香絕', '摩羅', '羅迦', '魎', '羲天', '阿修羅', '深淵之龍', '窮奇'];
ok(eq(G.SSJ_LAYERS.map(function (x) { return x.name; }), names), '九層首領名稱與 G2(88) 索引一致');
ok(G.SSJ_LAYERS.length === 9 && G.SSJ_LAYERS.every(function (x, i, a) { return x.lv > 0 && (i === 0 || x.lv > a[i - 1].lv); }), '九層敵軍等級為明確遞增的 D 級設定');
ok(G.ssjStage(1, 21).enemies.length === 1 && G.ssjStage(1, 21).enemies[0].honorFrame === 'gold', '每層建立單一金框首領');
ok(G.ssjStage(0) === null && G.ssjStage(10) === null && G.ssjStage('x') === null, '越界或非數字層數不產生戰鬥');
ok(!G.ssjChallenge(2, 1).ok && /前一層/.test(G.ssjChallenge(2, 1).msg), '尚未通過前層時拒絕挑戰');
var oldCells = S.state.team.cells;
S.state.team.cells = {};
ok(!G.ssjChallenge(1, 1).ok && G.ssjProgress().best === 0, '沒有隊伍時不開始挑戰');
S.state.team.cells = oldCells;

var originalRun = M.Battle.run, call = 0;
M.Battle.run = function (team, foes) {
  call++;
  return { win: call !== 2, rounds: 2, deadA: 0, units: [], events: [] };
};
var first = G.ssjChallenge(1, 44);
ok(first.ok && first.win && first.first && first.stage.name === '生死劫・第 1 層', '勝利通過第一層並標記首通');
ok(first.foes.length === 1 && first.foes[0].unit.name === '魑' && first.foes[0].unit.honorFrame === 'gold', '戰鬥單位使用對應名稱與首領金框');
ok(first.rewards.length === 1 && G.ssjProgress().best === 1 && G.ssjProgress().clears[1] === 1, '首通只發銀幣、保存最佳層與通關次數');
ok(G.ssjChallenge(3, 5).ok === false && /前一層/.test(G.ssjChallenge(3, 5).msg), '未連續通過前層不能跳關');
var secondFloor = G.ssjChallenge(2, 45);
ok(secondFloor.ok && !secondFloor.win && G.ssjProgress().best === 1, '戰敗不提升進度或發放獎勵');
var replay = G.ssjChallenge(1, 46);
ok(replay.ok && replay.win && !replay.first && replay.rewards.length === 0 && G.ssjProgress().clears[1] === 2, '已通關層可重戰但不重複領首通獎勵');
M.Battle.run = originalRun;

var old = JSON.parse(JSON.stringify(S.state));
old.version = 11; delete old.shengsijie;
var parsed = S.parse(JSON.stringify({ app: S.APP, version: 11, data: old }));
ok(parsed.ok && parsed.state.version === 12 && parsed.state.migratedFrom === 11, 'v11 存檔遷移至 v12 並建立生死劫進度');
ok(parsed.state.shengsijie.best === 0 && eq(parsed.state.shengsijie.clears, {}), '新進度預設為零且不改動舊存檔其他欄位');
ok(M.D.provenance.entries.some(function (x) { return x.id === 'web2.shengsijie.rules' && x.grade === 'D'; }), '生死劫未證實規則有 D 級 provenance');
console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
