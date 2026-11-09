// ART-5（WL-2）美術覆蓋檢查：node tests/unit-art5.js
// 具名敵方獨立立繪、頭像／cut-in 完整性、meta.json 無殘留、全部畫面有專屬配樂。
var fs = require('fs'), path = require('path'), vm = require('vm');
var R = path.join(__dirname, '..', 'src', 'js'), ctx = { MJ: {}, console: console };
ctx.window = ctx;
vm.createContext(ctx);
['data.generated.js', 'assets.generated.js', 'assets-map.js', 'audio.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8'), ctx, { filename: f }); });
var MJ = ctx.MJ, A = MJ.ASSETS, pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  通過', n); } else { fail++; console.log('✗ 失敗', n); } }
function isWebp(k) { return typeof A[k] === 'string' && /^data:image\/webp;base64,/.test(A[k]); }

// 1. WL-2 新增 12 名具名敵方首領：立繪＋頭像＋cut-in 齊全
var NEW12 = { zhangbao: 'b_zhangbao', zhangliang: 'b_zhangliang', nanhua: 'b_nanhua', e_qiuqianren: 'b_qiuqianren', e_yanglianting: 'b_yanglianting', e_huodu: 'b_huodu', e_ouyangke: 'b_ouyangke', e_lijue: 'b_lijue', e_caoren: 'b_caoren', e_daerba: 'b_daerba', b_menge: 'b_menge', e_hebiweng: 'b_hebiweng' };
Object.keys(NEW12).forEach(function (ek) {
  var k = NEW12[ek];
  ok(MJ.D.stages.enemies[ek].art === k, '敵方對應 ' + ek + ' → ' + k);
  ok(isWebp(k) && isWebp(k + '_av') && isWebp(k + '_ci'), '立繪／頭像／cut-in ' + k);
  ok(A[k + '_ci'].length > 6000, 'cut-in 有實質內容 ' + k + '_ci（' + A[k + '_ci'].length + '）');
});
// 2. 12 張新圖各只被一個敵方 key 使用（不再共用通用圖或他人立繪）
var used = {};
Object.keys(MJ.D.stages.enemies).forEach(function (ek) { var a = MJ.D.stages.enemies[ek].art; used[a] = (used[a] || 0) + 1; });
Object.keys(NEW12).forEach(function (ek) { ok(used[NEW12[ek]] === 1, '獨立美術不共用 ' + NEW12[ek]); });
// 3. 全部 63 敵方 key 都有立繪＋頭像；每個被用到的 b_/g_ 圖都有 cut-in（戰鬥無雙演出不退回頭像）
Object.keys(MJ.D.stages.enemies).forEach(function (ek) {
  var a = MJ.D.stages.enemies[ek].art;
  ok(a && isWebp(a) && isWebp(a + '_av'), '敵方美術 ' + ek + ' → ' + a);
});
Object.keys(used).forEach(function (a) { if (a[0] === 'b' || a[0] === 'g') ok(isWebp(a + '_ci'), '敵方 cut-in ' + a + '_ci'); });
// 4. 武將 88 位皆有立繪＋頭像＋cut-in（含 3 位 artAlias 沿用同人首領圖）
MJ.D.heroes.list.forEach(function (h) {
  ok(isWebp('h_' + h.id) && isWebp('h_' + h.id + '_av') && isWebp('h_' + h.id + '_ci'), '武將全套 ' + h.id);
  ok(h.look.art === 'h_' + h.id, '武將 look.art ' + h.id);
});
// 5. meta.json 無殘留 key：每個 key 都有對應 out/*.webp，每個立繪檔都有 meta 條目
var meta = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'out', 'meta.json'), 'utf8'));
var outDir = path.join(__dirname, '..', 'src', 'assets', 'out');
Object.keys(meta).forEach(function (k) { ok(fs.existsSync(path.join(outDir, k + '.webp')), 'meta 有檔 ' + k); });
fs.readdirSync(outDir).filter(function (f) { return /\.webp$/.test(f) && f.indexOf('_av.webp') < 0 && f.indexOf('_ci.webp') < 0; }).forEach(function (f) {
  ok(meta.hasOwnProperty(f.replace(/\.webp$/, '')), '立繪有 meta ' + f);
});
// 6. 全部 15 個畫面都有 SCENE_OF 對應（不再回退主城曲），對應曲目存在且可生成
var SCREENS = ['arena', 'battle', 'city', 'farm', 'forge', 'gate', 'hall', 'jxl', 'newgame', 'recruit', 'shanggu', 'shengsijie', 'tower', 'wuji', 'wulin'];
var AU = MJ.Audio;
SCREENS.forEach(function (s) {
  var song = AU.SCENE_OF[s];
  ok(typeof song === 'string' && AU.SONGS[song], '畫面有專屬曲 ' + s + ' → ' + song);
  if (song && AU.SONGS[song]) { var p = AU.pattern(song); ok(p.steps === 64 && p.mel.length === 64, '曲目可生成 ' + song); }
});
// 7. WL-2 新增 6 首曲目彼此旋律不同，且與主城曲不同
var NEW6 = ['forge', 'hall', 'jxl', 'shanggu', 'shengsijie', 'wulin'];
var seen = {};
NEW6.forEach(function (n) {
  var m = JSON.stringify(AU.pattern(n).mel);
  ok(!seen[m], '新曲旋律獨立 ' + n);
  seen[m] = n;
  ok(m !== JSON.stringify(AU.pattern('city').mel), '新曲異於主城曲 ' + n);
});
ok(AU.sceneFor('wulin') === 'wulin' && AU.sceneFor('forge') === 'forge' && AU.sceneFor('shengsijie') === 'shengsijie', 'sceneFor 走新對應');
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
