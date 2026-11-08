// 網路資料搜查-2 P3-2：W967/W282 攻擊範圍格圖與 sn8 Lv6 規則。node tests/unit-web2-p3-range.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, R = M.R, H = M.D.heroes;
var root = path.join(__dirname, '..');
var grids = JSON.parse(fs.readFileSync(path.join(root, 'docs/sources-extracted/web2/c-snA967-grids.json'), 'utf8'));
var sourceHeroes = JSON.parse(fs.readFileSync(path.join(root, 'docs/sources-extracted/web2/c-snA967-heroes.json'), 'utf8'));
var w282 = JSON.parse(fs.readFileSync(path.join(root, 'docs/sources-extracted/web2/c-snA282-lv6.json'), 'utf8')).heroes;
var prov = JSON.parse(fs.readFileSync(path.join(root, 'src/data/provenance.json'), 'utf8'));
var convert = require('../tools/glyph967.js');
var aliases = { '建甯公主': '建寧公主', '丘處機': '邱處機', '無涯子': '無崖子', '喬峰': '蕭峰' };
var byName = {}, meta = {}, c282ByName = {};
H.list.forEach(function (h) { byName[h.name] = h; });
sourceHeroes.forEach(function (h) { if (h.color && h.color !== '-') meta[h.name] = h; });
Object.keys(w282).forEach(function (n) { if (w282[n].shape) c282ByName[aliases[n] || n] = w282[n]; });
function same(a, b) { return JSON.stringify((a || []).map(function (p) { return [p[0], p[1]]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; })) === JSON.stringify((b || []).map(function (p) { return [p[0], p[1]]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; })); }
function pe(id) { return prov.entries.filter(function (e) { return e.id === id; })[0]; }
function hasSource(e, id) { return !!e && (e.sources || []).some(function (s) { return s.s === id; }); }

console.log('[來源覆蓋、逐人 provenance]');
ok(R.RV === 15, '現行技能規則 RV15（技能格圖仍照 RV14 規則）');
ok(Object.keys(grids).length === 61, 'W967 來源格圖有 61 名武將');
var mapped = 0, direct = 0, badBasic = [], badLv6 = [], badUlt = [], ambiguous = 0, highLevel = 0;
Object.keys(grids).forEach(function (sourceName) {
  var name = aliases[sourceName] || sourceName, h = byName[name], row = grids[sourceName];
  if (!h || !Array.isArray(h.active.range14) || !Array.isArray(h.ult.range14)) { badBasic.push(sourceName); return; }
  mapped++;
  var a14 = h.active.range14, u14 = h.ult.range14, b = convert(row[0]), u = convert(row[2]), cdata = c282ByName[name];
  if (!same(a14[0], b.shape)) badBasic.push(name + ' Lv1');
  if (!same(u14, u.shape)) badUlt.push(name + ' ult');
  var expected6 = cdata ? cdata.shape : row[1] === 'same' ? b.shape : convert(row[1]).shape;
  if (!same(a14[1], expected6)) badLv6.push(name + ' shape');
  var e = pe('web2.range.hero.' + h.id);
  if (!e || e.grade !== 'C' || !hasSource(e, 'W967')) badBasic.push(name + ' provenance');
  if (cdata) {
    direct++;
    if (!hasSource(e, 'W282') || e.current.indexOf('W282') < 0) badLv6.push(name + ' W282 source');
    if (cdata.q || cdata.lv > 6) {
      ambiguous++;
      if (!e.note || !/模糊|推用/.test(e.note)) badLv6.push(name + ' C caveat');
    }
    if (cdata.lv > 6) highLevel++;
  } else if (hasSource(e, 'W282')) badLv6.push(name + ' unexpected W282 source');
});
ok(mapped === 61 && direct === 49 && highLevel === 15 && badBasic.length === 0 && badLv6.length === 0 && badUlt.length === 0, '61/61 格圖完整映射；W282 有格位圖 ' + direct + ' 筆（Lv6 ' + (direct - highLevel) + '、Lv7+ 推用 ' + highLevel + '），其餘由 W967 提供');
ok(ambiguous === 19 && highLevel === 15, 'W282 模糊/升級後等級推用 19 筆（shape? 6、Lv7+ 15，重疊 2）在逐人 provenance 標 C');
var entries = prov.entries.filter(function (e) { return /^web2\.range\.hero\./.test(e.id); });
var missing = H.list.filter(function (h) { return !grids[Object.keys(grids).filter(function (n) { return (aliases[n] || n) === h.name; })[0]]; });
var leadProv = pe('web2.range.hero.lead');
ok(entries.length === H.list.length + 1 && entries.filter(function (e) { return e.grade === 'C'; }).length === 61 && entries.filter(function (e) { return e.grade === 'D'; }).length === 27 && !!leadProv && leadProv.grade === 'B' && missing.length === 27, '89 名武將/主角各有來源記錄：61 名 C、未列來源 27 名、主角 1 名 B');
var leadLv1 = R.skillOf({ id: 'lead', sk: { a: 1 } }, 'a'), leadLv6 = R.skillOf({ id: 'lead', sk: { a: 6 } }, 'a');
ok(leadLv1.pattern === 'shape' && same(leadLv1.shape, [[0, 0]]) && leadLv6.pattern === 'shape' && same(leadLv6.shape, [[0, 0], [0, 1]]), '主角普攻：Lv1 向前一格，Lv6 向前兩格');

console.log('[sn8：六等範圍規則]');
var sixKings = ['岳靈珊', '鹿杖客', '蔡文姬', '張角', '丘處機', '華雄'];
ok(sixKings.every(function (n) { var h = byName[aliases[n] || n]; return h && same(h.active.range14[0], h.active.range14[1]); }), '六大天王（六名綠魂將）六等範圍不變');
var blue = Object.keys(grids).filter(function (n) { return meta[n] && meta[n].color === '藍'; });
ok(blue.length > 0 && blue.every(function (n) { var h = byName[aliases[n] || n]; return !same(h.active.range14[0], h.active.range14[1]); }), '藍魂將六等範圍全部改變（' + blue.length + ' 名）');
var purple = Object.keys(grids).filter(function (n) { return meta[n] && meta[n].color === '紫'; });
var unexpected = purple.filter(function (n) { var h = byName[aliases[n] || n], changed = !same(h.active.range14[0], h.active.range14[1]); return (n === '趙雲' || n === '呂布' || n === '熊貓') ? changed : !changed; });
ok(purple.length > 0 && !unexpected.length && ['趙雲', '呂布'].every(function (n) { var h = byName[n]; return same(h.active.range14[0], h.active.range14[1]); }), '紫將例外符合來源：趙雲/呂布不變；熊貓為唯一保留的 C 級格圖衝突');
var zi = byName['紫雲'], ziEntry = pe('web2.range.hero.ziyun');
ok(hasSource(ziEntry, 'W282') && !same(zi.active.range14[0], zi.active.range14[1]) && ziEntry.conflicts.indexOf('P3R-SHAPE-ZIYUN') >= 0 && prov.conflicts.some(function (x) { return x.id === 'P3R-SHAPE-ZIYUN' && /已處理/.test(x.status); }), '紫雲採 W282 直接 Lv6 格位，記錄 W967「same」來源差異');
var panda = byName['熊貓'], pandaEntry = pe('web2.range.hero.xiongmao');
ok(same(panda.active.range14[0], panda.active.range14[1]) && pandaEntry.grade === 'C' && pandaEntry.conflicts.indexOf('P3R-SN8-XIONGMAO') >= 0 && prov.conflicts.some(function (x) { return x.id === 'P3R-SN8-XIONGMAO' && /待補/.test(x.status); }), '熊貓未臆造缺失格位，保留 W967 shape 並標示未解衝突 C');

console.log('[RV14 技能快照與無雙 invariant]');
var ultStable = true, healsPreserved = true, activeCorrect = true;
Object.keys(grids).forEach(function (sourceName) {
  var h = byName[aliases[sourceName] || sourceName];
  var u1 = R.skillOf({ id: h.id, sk: { u: 1 } }, 'u'), u9 = R.skillOf({ id: h.id, sk: { u: 9 } }, 'u');
  if (u1.pattern !== u9.pattern || !same(u1.shape, u9.shape)) ultStable = false;
  if (h.ult.pattern === 'healAll') {
    var expected = h.ult.p3 && h.ult.p3.pattern || 'healAll';
    if (u1.pattern !== expected || u9.pattern !== expected) healsPreserved = false;
  }
  var a1 = R.skillOf({ id: h.id, sk: { a: 1 } }, 'a'), a6 = R.skillOf({ id: h.id, sk: { a: 6 } }, 'a');
  if (a1.pattern !== 'shape' || !same(a1.shape, h.active.range14[0]) || a6.pattern !== 'shape' || !same(a6.shape, h.active.range14[1])) activeCorrect = false;
});
ok(ultStable, '61 名無雙範圍在 Lv1/Lv9 固定不變');
ok(healsPreserved, '全體治療仍保留治療語義，劉備沿用既有全體傷害規則');
ok(activeCorrect, 'RV14 R.skillOf 對 61 名主動技能採 Lv1/Lv6 shape');
var fallbackHero = missing.length ? missing[0] : null;
if (fallbackHero) {
  var old = R.skillOf({ id: fallbackHero.id, sk: { a: 6 } }, 'a');
  ok(!fallbackHero.active.range14 && old.pattern === fallbackHero.active.pattern && pe('web2.range.hero.' + fallbackHero.id).grade === 'D', '未列 W967 的 ' + fallbackHero.name + ' 保留原 pattern，沒有合成格位');
} else ok(false, '存在未列 W967 的武將作 fallback 驗收');
M.R.RV = 13;
var legacy = R.skillOf({ id: 'caocao', sk: { a: 6 } }, 'a');
ok(legacy.pattern === R.heroDef('caocao').active.pattern && !legacy.range14, 'RV13 不套用新範圍，也不外洩 metadata');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exitCode = fail ? 1 : 0;
