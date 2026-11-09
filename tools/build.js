// 打包：把 src/index.html 與 src/boot-test.html 內的 CSS/JS 全部內嵌，輸出單一檔案到 dist/
var fs = require('fs'), path = require('path'), terser = require('terser');
var SRC = path.join(__dirname, '..', 'src'), DIST = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
async function inline(html, web) {
  html = html.replace(/<!--INLINE_CSS_START-->[\s\S]*?<!--INLINE_CSS_END-->/, function (blk) {
    var out = '';
    blk.replace(/href="([^"]+\.css)"/g, function (m, f) { out += '<style>\n' + fs.readFileSync(path.join(SRC, f), 'utf8') + '\n</style>\n'; });
    return out;
  });
  var jsBlock = html.match(/<!--INLINE_JS_START-->[\s\S]*?<!--INLINE_JS_END-->/);
  if (jsBlock) {
    var out = '';
    var files = [], re = /src="([^"]+\.js)"/g, match;
    while ((match = re.exec(jsBlock[0]))) files.push(match[1]);
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      // Keep readable source files; compact only the single-file distribution, not the original modules.
      var code = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/<\/script/gi, '<\\/script').replace(/^\s*\/\/[^\n]*(?:\n|$)/gm, '').replace(/^[\t ]*\r?\n/gm, '').replace(/[\t ]+$/gm, '');
      if (web && f === 'js/assets.generated.js') code = code.replace(/^(MJ\.ASSETS\["([^"]+)"\]=)"data:[^"]*"/gm, function (m, pre, key) { return pre + '"assets/' + key + '.webp"'; });
      var parts = code.split('/*@@CHUNK*/');
      for (var j = 0; j < parts.length; j++) {
        var part = parts[j].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n+$/, '');
        if (f !== 'js/assets.generated.js') {
          var minified = await terser.minify(part, { ecma: 5, compress: false, mangle: false, format: { comments: false, ecma: 5 } });
          part = minified.code;
        }
        out += '<script>\n' + part + '\n</script>\n';
      }
    }
    html = html.replace(jsBlock[0], out);
  }
  if (/<script[^>]+src=|<link[^>]+stylesheet/i.test(html)) throw new Error('仍有外部資源未內嵌');
  return html;
}
// 建置編號（2026-11-04）：GitHub Pages 以 Cache-Control max-age=600 送出 HTML，瀏覽器可能用 10 分鐘內的舊檔。
// 在檔案內嵌建置編號，設定畫面與開頭畫面顯示，方便確認手上跑的是不是最新版（沒有 Service Worker，不需清除快取程式）。
function stamp(html, id) { return html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="mj-build" content="' + id + '">\n<script>window.MJ_BUILD = "' + id + '";</script>'); }
(async function () {
  var main = await inline(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));
  var d = new Date(), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var BID = d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '-' + require('crypto').createHash('sha256').update(main).digest('hex').slice(0, 8);
  main = stamp(main, BID);
  fs.writeFileSync(path.join(DIST, 'mengjiang.html'), main);
  var web = stamp(await inline(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'), true), BID);
  fs.writeFileSync(path.join(DIST, 'index.web.html'), web);
  var wa = path.join(DIST, 'assets'); if (!fs.existsSync(wa)) fs.mkdirSync(wa);
  fs.readdirSync(path.join(SRC, 'assets', 'out')).forEach(function (n) { if (/\.webp$/.test(n)) fs.copyFileSync(path.join(SRC, 'assets', 'out', n), path.join(wa, n)); });
  console.log('web build dist/index.web.html', Buffer.byteLength(web, 'utf8'), 'bytes + dist/assets/');
  var bootHtml = await inline(fs.readFileSync(path.join(SRC, 'boot-test.html'), 'utf8'));
  var bt = stamp(bootHtml.replace('href="index.html"', 'href="mengjiang.html"'), BID);
  fs.writeFileSync(path.join(DIST, 'boot-test.html'), bt);
  var mb = Buffer.byteLength(main, 'utf8'), bb = Buffer.byteLength(bt, 'utf8');
  console.log('build', BID, '; dist/mengjiang.html', mb, 'bytes (UTF-8); dist/boot-test.html', bb, 'bytes');
  if (mb >= 20000000) { console.error('超過 20,000,000 bytes 上限'); process.exit(2); }
})().catch(function (err) { console.error(err); process.exit(1); });
