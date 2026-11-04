// 由 save-v8.json 產生 v9、v10 存檔樣本（給換陣法端對端測試用）：node tests/make-save-v9-v10.js
// v9：只套用 v8→v9 升級步驟並標成版本 9（模擬 v9 版玩家的存檔）；v10：完整升級到 v10 並存成新格式。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var F = path.join(__dirname, 'fixtures'), v8 = JSON.parse(fs.readFileSync(path.join(F, 'save-v8.json'), 'utf8'));
var c = load(), S = c.MJ.S;
var d9 = JSON.parse(JSON.stringify(v8.data)); S.STEPS[8](d9); d9.version = 9; delete d9.migrateNotes; delete d9.migratedFrom;
fs.writeFileSync(path.join(F, 'save-v9.json'), JSON.stringify({ app: v8.app, version: 9, savedAt: v8.savedAt, data: d9 }));
var d10 = S.migrate(JSON.parse(JSON.stringify(v8.data))); delete d10.migrateNotes; delete d10.migratedFrom;
fs.writeFileSync(path.join(F, 'save-v10.json'), JSON.stringify({ app: v8.app, version: 10, savedAt: v8.savedAt, data: d10 }));
console.log('v9 team', JSON.stringify(d9.team), '\nv10 team', JSON.stringify(d10.team));
