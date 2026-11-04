// 以 acorn 驗證所有 JS 為 ES5 語法
var acorn = require('acorn'), fs = require('fs'), path = require('path');
var dir = path.join(__dirname, '..', 'src', 'js'), bad = 0;
fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).forEach(function (f) {
  try { acorn.parse(fs.readFileSync(path.join(dir, f), 'utf8'), { ecmaVersion: 5 }); console.log('ES5 OK', f); }
  catch (e) { bad++; console.log('ES5 FAIL', f, e.message); }
});
// 內嵌腳本
var html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'mengjiang.html'), 'utf8'), re = /<script>([\s\S]*?)<\/script>/g, m, n = 0;
while ((m = re.exec(html))) { n++; try { acorn.parse(m[1], { ecmaVersion: 5 }); } catch (e) { bad++; console.log('ES5 FAIL inline #' + n, e.message); } }
console.log('inline scripts', n, bad ? 'FAILURES ' + bad : 'all ES5');
process.exit(bad ? 1 : 0);
