// 網路資料搜查-2 還原（P1～P4，存檔 v9）。node tests/unit-web2.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c.MJ.U.now = function () { return T0; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
function fx(f) { return fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'); }
var c, M, G, S, R, D, PROV = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
var W967P = path.join(__dirname, '..', 'docs', 'sources', 'web2', 'c-snA967-heroes.json'); if (!fs.existsSync(W967P)) W967P = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-snA967-heroes.json');
var W967 = JSON.parse(fs.readFileSync(W967P, 'utf8'));
var QN = { '黑': 0, '白': 1, '綠': 2, '藍': 3, '紫': 4, '橙': 5 };
function pe(id) { return (PROV.entries || []).filter(function (e) { return e.id === id; })[0]; }

console.log('[P1 武將品質、類型、魂量]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R; D = M.D;
var byName = {}; D.heroes.list.forEach(function (h) { byName[h.name] = h; });
var rows = W967.rows || W967, diffQ = [], diffT = [], checked = 0;
rows.forEach(function (r) { var h = byName[r.name]; if (!h) return; checked++; if (QN[r.color] != null && QN[r.color] !== h.quality) diffQ.push(r.name); if (r.type && r.type !== h.type) diffT.push(r.name); });
ok(checked >= 40 && !diffQ.length, '已有武將品質與巴哈 snA967 一覽一致（比對 ' + checked + ' 人，不符：' + (diffQ.join('、') || '無') + '）');
ok(!diffT.length, '類型與一覽一致（不符：' + (diffT.join('、') || '無') + '）');
ok(D.heroes.list.every(function (h) { return h.id === 'lead' || h.quality < 3 || h.souls > 0 || h.noRecruit; }), '藍色以上都有招募魂量');
ok(['liubei', 'caocao', 'lvbu', 'duanyu', 'xiongmao'].every(function (id) { return R.heroDef(id).quality === 4; }), '劉備、曹操、呂布、段譽、熊貓為紫');
ok(R.heroDef('liubei').type === '力敏' && R.dtypeOf(R.heroDef('liubei').type) === 'p', '劉備 力敏（物理）');
ok(D.heroes.list.filter(function (h) { return h.quality === 3; }).every(function (h) { return h.souls === 5; }), '藍將招募 5 魂');
ok(D.heroes.list.filter(function (h) { return h.quality === 4 && h.souls; }).every(function (h) { return h.souls === 30 || h.souls === 45; }), '紫將招募 30 或 45 魂');
var sq = R.heroDef('sunquan'); ok(sq.souls === 45 && /C/.test(sq.soulsGrade || ''), '孫權 30/45 兩說衝突：採 45、標 C');
ok(R.teamSlots(1) === 3 && R.teamSlots(15) === 4 && R.teamSlots(25) === 5 && R.teamSlots(35) === 6 && R.teamSlots(60) === 7 && R.teamSlots(70) === 8, '上陣人數 3/4/5/6/7/8（1/15/25/35/60/70 級）');
['web2.hero.quality', 'web2.hero.type', 'web2.team.slots'].forEach(function (id) { var e = pe(id); ok(e && /^[ABCD]$/.test(e.grade), 'provenance ' + id + ' 有分級（' + (e && e.grade) + '）'); });
ok((PROV.entries || []).every(function (e) { return !/^[CD]$/.test(e.grade) || !/原版/.test(e.label || ''); }), 'C/D 條目都沒有標「原版」');

console.log('[P1 招募]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
S.state.bag.stack['soul:liubei'] = 45; var rc = G.summon('liubei');
ok(rc && rc.ok && S.state.heroes.some(function (h) { return h.id === 'liubei'; }) && !(S.state.bag.stack['soul:liubei'] > 0), '45 將魂招募劉備（紫）');
S.state.bag.stack['soul:wangyuyan'] = 4; rc = G.summon('wangyuyan');
ok(rc && !rc.ok, '王語嫣（藍）4 魂不夠，需要 5 魂');

console.log('[P1 存檔 v8 → v9]');
c = load(); c.MJ.U.now = function () { return T0; }; M = c.MJ; R = M.R;
var raw8 = JSON.parse(fx('save-v8.json')).data, p = M.S.parse(fx('save-v8.json'));
ok(p.ok && p.state.version === M.S.VERSION && M.S.VERSION >= 9 && p.state.migratedFrom === 8, 'v8 存檔（改版前程式產生）可匯入並升到 v' + M.S.VERSION);
if (p.ok) {
  var st = p.state; M.S.state = st;
  ok(st.heroes.length === raw8.heroes.length && st.heroes.every(function (h, i) { return h.uid === raw8.heroes[i].uid && h.id === raw8.heroes[i].id && h.lv === raw8.heroes[i].lv && h.star === raw8.heroes[i].star; }), '武將 ' + st.heroes.length + ' 人全部保留（uid／等級／星級不變）');
  ok(st.player.silver === raw8.player.silver && st.player.gold === raw8.player.gold && st.bag.stack['soul:liubei'] === 12, '銀幣、金幣、將魂保留');
  ok(raw8.jiangxing.lit === 5 && st.jiangxing.lit === 0 && st.jiangxing.legacySoulRefunded === 130 && st.player.xinghun === (raw8.player.xinghun || 0) + 130, 'v8 fixture 的 5 顆舊星盤投入退款 130 星魂，舊 lit 停用');
  ok(st.buildingUnlocks.jiangxing && st.heroes.every(function (h) { return h.jxLevel === 0; }), '舊將星錄入口解鎖保留並補齊每名武將 jxLevel');
  var eq8 = [], eq9 = []; raw8.heroes.forEach(function (h) { for (var k in h.eq) eq8.push(h.eq[k].uid); }); st.heroes.forEach(function (h) { for (var k in h.eq) eq9.push(h.eq[k].uid); });
  ok(eq8.join() === eq9.join() && st.bag.equips.length === raw8.bag.equips.length, '穿戴中 ' + eq9.length + ' 件與背包 ' + st.bag.equips.length + ' 件裝備都保留');
  function H(id) { return st.heroes.filter(function (h) { return h.id === id; })[0]; }
  ok(H('liubei').eq.weapon.t === 'wp24' && H('liubei').eq.weapon.enh === 5 && H('liubei').eq.weapon.gems[0] === 'atk' && H('liubei').eq.weapon.q === 3, '劉備 智→力：法杖 wm24 換成同級物理武器 wp24，保留品質／強化／寶石');
  ok(H('caocao').eq.weapon.t === 'wp30' && H('lvbu').eq.weapon.t === 'wp30' && H('xiongmao').eq.weapon.t === 'wp24', '曹操換物理武器；呂布、熊貓原本就是物理不變');
  var n = 0; for (var k in st.team.cells) n++;
  var lead = H('lead');
  ok(n === R.teamSlots(lead.lv) && n === 6, '50 級隊伍 7 人 → 原版 6 人');
  ok(U_has(st.team.cells, lead.uid), '主角仍在隊伍');
  ok(st.heroes.length === raw8.heroes.length, '被移出隊伍的武將仍在武將列表');
  ok((st.migrateNotes || []).some(function (x) { return /劉備/.test(x) && /藍→紫|智耐→力敏/.test(x); }) && st.migrateNotes.some(function (x) { return /待命區/.test(x); }), '遷移說明寫明品質／類型修正與回到待命區的武將');
  var rp = M.G.arenaReplay(0); ok(rp.ok && rp.consistent, 'v8 戰報以舊規則重播，結果相同');
  ok(R.derived(H('liubei'), st).patk > 0 && M.G.buildTeam().length === 6, '升級後可正常組隊與計算屬性');
}
function U_has(o, v) { for (var k in o) if (o[k] === v) return true; return false; }
['save-v7.json', 'save-v6.json', 'save-v5.json', 'save-v4.json', 'save-v2.json', 'save-v1.json'].forEach(function (f) {
  var cc = load(); cc.MJ.U.now = function () { return T0; };
  var pp = cc.MJ.S.parse(fx(f)); var n0 = JSON.parse(fx(f)).data.heroes.length;
  ok(pp.ok && pp.state.version === cc.MJ.S.VERSION && pp.state.heroes.length === n0, f + ' 一路升到 v' + cc.MJ.S.VERSION + '（武將 ' + n0 + ' 人保留）');
});

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
