// WL-18：武將專屬特效檔案（fx-profiles.js）＋ ui-battle.js 接線
// 純表現層：本測試只驗資料完整性／唯一性／查表安全與接線存在性，不驗戰鬥數值（不變性由黃金戰報與模擬比對把關）。
var fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.log('✗ ' + m); } }

var root = path.join(__dirname, '..');
var heroes = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'heroes.json'), 'utf8')).list;

// ---- 載入 fx-profiles.js（獨立 MJ 環境）----
var ctx = { console: console, setTimeout: setTimeout, clearTimeout: clearTimeout };
ctx.window = ctx;
ctx.MJ = { UI: { sel: {}, screens: {}, actions: {}, modals: {} }, D: { heroes: { list: heroes } } };
ctx.document = { getElementById: function () { return null; }, createElement: function () { return { className: '', style: {}, appendChild: function () {}, set innerHTML(v) {}, get innerHTML() { return ''; } }; } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'src', 'js', 'util.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'src', 'js', 'fx-profiles.js'), 'utf8'), ctx);
var FX = ctx.MJ.FX;

console.log('[特效檔案：覆蓋與唯一性]');
ok(!!FX && !!FX.P && !!FX.E, 'MJ.FX 已建立（含武將表 P 與敵方表 E）');
ok(heroes.length === 90, '武將資料共 90 名（實際 ' + heroes.length + '）');
var missing = heroes.filter(function (h) { return !FX.P[h.id]; });
ok(missing.length === 0, '90 名武將全覆蓋（缺：' + missing.map(function (h) { return h.id; }).join(',') + '）');
var PROJS = ['qi', 'flame', 'bolt', 'ice', 'petal', 'water', 'note', 'star', 'poison', 'holy', 'ring', 'claw', 'wind', 'sand', 'blood', 'leaf'];
var BURSTS = ['ring', 'cross', 'star', 'splash', 'bloom', 'spike', 'globe', 'crack'];
var MOTIONS = ['dash', 'spin', 'cast', 'leap'];
var SCREENS = ['quake', 'flash', 'calm'];
function validRow(a) {
  return a && a.length === 6 && /^#[0-9a-f]{6}$/.test(a[0]) && /^#[0-9a-f]{6}$/.test(a[1]) &&
    PROJS.indexOf(a[2]) >= 0 && BURSTS.indexOf(a[3]) >= 0 && MOTIONS.indexOf(a[4]) >= 0 && SCREENS.indexOf(a[5]) >= 0;
}
var badRows = Object.keys(FX.P).filter(function (id) { return !validRow(FX.P[id]); });
ok(badRows.length === 0, '武將表每列格式合法（色碼＋型態池）（不良：' + badRows.join(',') + '）');
var seen = {}, dup = [];
Object.keys(FX.P).forEach(function (id) { var a = FX.P[id], k = [a[0], a[2], a[3], a[4]].join('|'); if (seen[k]) dup.push(id); seen[k] = id; });
ok(dup.length === 0, '（主色, 彈道, 爆發, 位移）組合全表互異（重複：' + dup.join(',') + '）');
var badE = Object.keys(FX.E).filter(function (k) { return !validRow(FX.E[k]); });
ok(Object.keys(FX.E).length >= 12 && badE.length === 0, '敵方具名首領特效 ≥12 組且格式合法（實際 ' + Object.keys(FX.E).length + ' 組）');

console.log('[特殊武將與查表安全]');
ok(!!FX.P.doraemon && FX.P.doraemon[2] === 'ring', '小叮噹特效存在（空氣砲衝擊環）');
ok(!!FX.P.pikachu && FX.P.pikachu[2] === 'bolt', '皮卡丘特效存在（雷電）');
ok(FX.of('guanyu').c1 === '#2fae5f' && FX.of('guanyu').proj === 'qi', '關羽查表：青綠刀氣');
var fb = FX.of('no-such-hero');
ok(!!fb && fb.c1 && fb.proj && fb.burst && fb.motion && fb.screen, '未知 id 回安全 fallback（非 null、欄位齊全）');
var threw = false;
try { FX.of(null); FX.of(undefined); FX.of(''); FX.of(0); FX.ofArt(null); FX.ofArt(undefined); } catch (e) { threw = true; }
ok(!threw, 'of/ofArt 對 null／undefined／空字串不丟例外');
ok(FX.ofArt('b_murongfu') !== null && FX.ofArt('b_murongfu').proj === 'star', '敵方具名首領以立繪 key 查得到（慕容復）');
ok(FX.ofArt('g_guard') === null && FX.ofArt('e_huaxiong') === null, '一般敵人／借用武將立繪者 ofArt 回 null（走姓名／武將路徑或模板）');
var fxSrc = fs.readFileSync(path.join(root, 'src', 'js', 'fx-profiles.js'), 'utf8');
ok(fxSrc.indexOf('Math.random') < 0, 'fx-profiles.js 不使用 Math.random（視覺不引入新亂數源）');

console.log('[ui-battle.js 接線]');
vm.runInContext(fs.readFileSync(path.join(root, 'src', 'js', 'ui-battle.js'), 'utf8'), ctx);
var UI = ctx.MJ.UI;
ok(typeof UI._fxProfOf === 'function', 'ui-battle.js 暴露 UI._fxProfOf');
var profOf = UI._fxProfOf;
ok(profOf({ look: { art: 'h_guanyu' }, name: '關羽' }).c1 === '#2fae5f', '以 look.art=h_guanyu 解析關羽特效');
ok(profOf({ look: { art: 'c_lead_f' }, name: '自訂名' }).proj === 'qi', '主角（c_lead_*）解析為主角特效');
ok(profOf({ look: { art: 'b_murongfu' }, name: '慕容復' }).proj === 'star', '敵方具名首領以 b_* 立繪 key 解析');
ok(profOf({ look: { art: 'h_zhangjiao' }, name: '張角' }).proj === 'bolt', '借用武將立繪的敵方（張角）沿用該武將特效');
ok(profOf({ look: {}, name: '關羽' }).c1 === '#2fae5f', '無立繪 key 時以姓名對照解析');
ok(profOf({ look: {}, name: '無名小兵' }) === null, '查不到的單位回 null（維持既有模板特效）');
ok(profOf(null) === null && profOf({}) === null && profOf({ look: null }) === null, 'fxProfOf 對殘缺單位不丟例外且回 null');
ok(UI._fxRgba('#2fae5f', 0.5) === 'rgba(47,174,95,0.5)', 'fxRgba 色碼轉換正確');
ok(UI._fxSlashSvg(null).indexOf('rgba(255,244,200') >= 0, '無特效時揮灑 SVG＝原本金色雙弧（向後相容）');
ok(UI._fxSlashSvg(FX.of('guanyu')).indexOf('#2fae5f') >= 0, '關羽揮灑 SVG 含其主色');
ok(UI._fxSlashSvg(FX.of('meichaofeng')).indexOf('stroke') >= 0, '爪型態武將（梅超風）揮灑為三痕線條');
BURSTS.forEach(function (b) {
  var p = { c1: '#112233', c2: '#ddeeff', proj: 'qi', burst: b, motion: 'dash', screen: 'flash' };
  ok(UI._fxBurstSvg(p).indexOf('#112233') >= 0, '爆發形狀 ' + b + ' 的 SVG 含個人色');
});
var ubSrc = fs.readFileSync(path.join(root, 'src', 'js', 'ui-battle.js'), 'utf8');
ok(/ultFx\(e\.skill, fxProfOf\(me\.u\)\)/.test(ubSrc), '無雙全屏特效呼叫帶出招者特效');
ok(/skillFx\(e\.to, .*fxProfOf\(at\.u\)/.test(ubSrc), '命中光效呼叫帶攻擊者特效');
ok((ubSrc.match(/Math\.random/g) || []).length === 1, 'ui-battle.js 未新增 Math.random（仍為既有 1 處）');
ok(ubSrc.indexOf("'義薄雲天': 'beam'") >= 0 && ubSrc.indexOf("'雷霆震怒': 'stomp'") >= 0, '既有 7 招專屬無雙造型對照表保留');

console.log('[index.html／CSS]');
var idx = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
var iFx = idx.indexOf('js/fx-profiles.js'), iUb = idx.indexOf('js/ui-battle.js');
ok(iFx >= 0 && iUb >= 0 && iFx < iUb, 'index.html 於 ui-battle.js 之前載入 fx-profiles.js');
var css = fs.readFileSync(path.join(root, 'src', 'css', 'style.css'), 'utf8');
ok(css.indexOf('.orb.fxp-') >= 0 && css.indexOf('.ultfx.bolt') >= 0 && css.indexOf('.ultfx.flame') >= 0 && css.indexOf('.ultfx.ring') >= 0 && css.indexOf('.ultfx.star') >= 0, 'style.css 有 WL-18 造型（彈道形狀＋無雙 bolt/flame/ring/star）');
ok(css.indexOf('@keyframes ultring') >= 0 && css.indexOf('@keyframes ultflame') >= 0, 'style.css 有 ultring／ultflame 動畫');

console.log('結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
