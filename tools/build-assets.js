// 產生 src/js/assets.generated.js：把 src/assets/out/*.webp 以 base64 內嵌成 MJ.ASSETS
// 用法：node tools/build-assets.js
var fs = require('fs'), path = require('path');
var OUT = path.join(__dirname, '..', 'src', 'assets', 'out');
var files = fs.readdirSync(OUT).filter(function (f) { return /\.webp$/.test(f); }).sort();
var meta = JSON.parse(fs.readFileSync(path.join(OUT, 'meta.json'), 'utf8'));
var s = '/* 自動產生，請勿手改：node tools/build-assets.js。經原公司同意（依倉庫擁有者說明），可參考或直接使用原作的美術、音樂等素材，目標是盡量貼近原作。使用原作素材時需在 docs/美術素材來源.md 記錄來源。若無原始檔案，可依 reference/ 的截圖與影片重繪貼近原版的素材。 */\n';
s += 'MJ.ASSET_META = ' + JSON.stringify(Object.keys(meta).sort().reduce(function (o, k) { o[k] = [meta[k].w, meta[k].h]; return o; }, {})) + ';\n';
// art2：分成約 900KB 一段，build.js 會把每段拆成獨立 <script>，每段結束回報載入進度（MJ_LDP）
s += 'MJ.ASSETS = {};\n';
var total = 0, cur = 0, chunks = 1, LIM = 900000;
files.forEach(function (f, i) {
  var b = fs.readFileSync(path.join(OUT, f)); total += b.length;
  var line = 'MJ.ASSETS["' + f.replace(/\.webp$/, '') + '"]="data:image/webp;base64,' + b.toString('base64') + '";\n';
  if (cur > 0 && cur + line.length > LIM) { s += 'typeof MJ_LDP === "function" && MJ_LDP(@@P' + chunks + ');\n/*@@CHUNK*/\n'; chunks++; cur = 0; }
  s += line; cur += line.length;
});
s += 'typeof MJ_LDP === "function" && MJ_LDP(@@P' + chunks + ');\n';
for (var c = 1; c <= chunks; c++) s = s.replace('@@P' + c + ')', (Math.round(8 + 80 * c / chunks)) + ')');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'js', 'assets.generated.js'), s);
console.log(files.length + ' assets, ' + chunks + ' chunks, raw ' + total + ' bytes, js ' + s.length + ' bytes');
