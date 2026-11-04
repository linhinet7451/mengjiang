// 把 src/data/*.json 包成 JS（file:// 下無法 fetch JSON）
var fs = require('fs'), path = require('path');
var dir = path.join(__dirname, '..', 'src', 'data');
var names = ['config', 'heroes', 'equipment', 'stages', 'formations', 'shop', 'tasks', 'provenance'];
var out = '/* 自動產生，請勿手改：node tools/build-data.js */\nMJ.D = {\n' + names.map(function (n) {
  return '  ' + n + ': ' + JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir, n + '.json'), 'utf8')));
}).join(',\n') + '\n};\n';
fs.writeFileSync(path.join(__dirname, '..', 'src', 'js', 'data.generated.js'), out);
console.log('data.generated.js', out.length, 'bytes');
