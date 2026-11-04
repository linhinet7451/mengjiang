// 打包：把 src/index.html 與 src/boot-test.html 內的 CSS/JS 全部內嵌，輸出單一檔案到 dist/
var fs = require('fs'), path = require('path');
var SRC = path.join(__dirname, '..', 'src'), DIST = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);
function inline(html) {
  html = html.replace(/<!--INLINE_CSS_START-->[\s\S]*?<!--INLINE_CSS_END-->/, function (blk) {
    var out = '';
    blk.replace(/href="([^"]+\.css)"/g, function (m, f) { out += '<style>\n' + fs.readFileSync(path.join(SRC, f), 'utf8') + '\n</style>\n'; });
    return out;
  });
  html = html.replace(/<!--INLINE_JS_START-->[\s\S]*?<!--INLINE_JS_END-->/, function (blk) {
    var out = '';
    blk.replace(/src="([^"]+\.js)"/g, function (m, f) {
      var code = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/<\/script/gi, '<\\/script');
      code.split('/*@@CHUNK*/').forEach(function (part, i) { out += '<script>/* ' + f + (i ? ' #' + (i + 1) : '') + ' */\n' + part + '\n</script>\n'; });
    });
    return out;
  });
  if (/<script[^>]+src=|<link[^>]+stylesheet/i.test(html)) throw new Error('仍有外部資源未內嵌');
  return html;
}
var main = inline(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));
fs.writeFileSync(path.join(DIST, 'mengjiang.html'), main);
var bt = inline(fs.readFileSync(path.join(SRC, 'boot-test.html'), 'utf8')).replace('href="index.html"', 'href="mengjiang.html"');
fs.writeFileSync(path.join(DIST, 'boot-test.html'), bt);
console.log('dist/mengjiang.html', main.length, 'bytes; dist/boot-test.html', bt.length, 'bytes');
