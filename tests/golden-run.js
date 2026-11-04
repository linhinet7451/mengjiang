// 戰鬥回歸：以固定種子跑 5 場關卡與 5 場原有被動混戰，回傳事件雜湊（給 unit-pt4 與舊引擎比對）
// opts.legacy：以改版前資料（fixtures/data-v8.generated.js）與舊規則版本（R.RV=8）重跑，確認舊戰鬥事件不變
module.exports = function (load, opts) {
  opts = opts || {};
  function h(str) { var x = 2166136261; for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; }
  var c = load(opts.legacy ? { data: require('path').join(__dirname, 'fixtures', 'data-v8.generated.js'), legacy: 8 } : {}), M = c.MJ, G = M.G, S = M.S; M.U.now = function () { return 1767225600000; };
  G.newGame('黃金', '智敏', 'm', 3);
  var out = [];
  ['s1_1', 's1_2', 's1_3', 's1_1', 's1_2'].forEach(function (id, i) {
    var r = G.fight(id, 1000 + i * 37);
    out.push({ id: id, seed: 1000 + i * 37, win: r.win, n: r.battle.events.length, h: h(JSON.stringify(r.battle.events)) });
  });
  // 各種原有被動與技能效果都要走過：直接建單位
  var R = M.R, list = M.D.heroes.list;
  var seen = {}, picks = list.filter(function (d) { if (!d.passive || seen[d.passive]) return false; seen[d.passive] = 1; return true; });
  var fxs = list.filter(function (d) { return picks.indexOf(d) < 0 && ((d.active && d.active.fx) || (d.ult && d.ult.fx)); });
  picks = picks.concat(fxs).slice(0, 12);
  var team = picks.slice(0, 6).map(function (d, i) { var hh = G.newHero(d.id, S.state); hh.lv = 30; return { unit: R.heroUnit(hh, S.state), cell: i }; });
  var foes = picks.slice(6, 12).map(function (d, i) { var hh = G.newHero(d.id, S.state); hh.lv = 30; return { unit: R.heroUnit(hh, S.state), cell: i + 3 }; });
  [1, 2, 3, 4, 5].forEach(function (sd) {
    var r = M.Battle.run(JSON.parse(JSON.stringify(team)), JSON.parse(JSON.stringify(foes)), { seed: sd, maxRounds: 36, levelSuppression: 10 });
    out.push({ id: 'mix', seed: sd, win: r.win, n: r.events.length, h: h(JSON.stringify(r.events)) });
  });
  return { passives: picks.map(function (d) { return d.passive; }), runs: out };
};
