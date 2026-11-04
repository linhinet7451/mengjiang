// 由資料自動產生 docs/附錄-資料表.md（每筆資料的可信度等級）
var fs = require('fs');
function J(f) { return JSON.parse(fs.readFileSync(__dirname + '/../src/data/' + f + '.json', 'utf8')); }
var H = J('heroes'), C = J('config'), S = J('stages'), F = J('formations');
var q = C.qualityNames, o = ['# 附錄：資料表與等級（自動產生，請勿手改）', '', '由 `node tools/gen-appendix.js` 依 src/data/*.json 產生。等級定義見《資料考證.md》。', '', '## 武將', '', '| 名稱 | 出處 | 品質 | 類型 | 主動技 | 無雙技 | 被動 | 將魂 | 等級 | 備註 |', '|---|---|---|---|---|---|---|---|---|---|'];
H.list.forEach(function (h) {
  var notes = [];
  if (h.activeNameGrade) notes.push('主動技名：' + h.activeNameGrade);
  if (h.ultNameGrade) notes.push('無雙技名：' + h.ultNameGrade);
  if (h.passiveGrade) notes.push('被動：' + h.passiveGrade);
  if (h.note) notes.push(h.note);
  o.push('| ' + [h.name, h.faction, q[h.quality], h.type, h.active.name, h.ult.name, H.passives[h.passive].name, h.souls, h.grade, notes.join('；') || '—'].join(' | ') + ' |');
});
o.push('', '技能倍率、範圍、屬性數值：全部為 D（自訂），未見官方數字。', '', '## 被動技能', '', '| 名稱 | 效果（本作） | 等級 |', '|---|---|---|');
Object.keys(H.passives).forEach(function (k) { var p = H.passives[k]; o.push('| ' + p.name + ' | ' + p.desc + ' | ' + p.grade + ' |'); });
o.push('', '## 陣法', '', '| 名稱 | 說明 | 可站格位 |', '|---|---|---|');
F.forEach(function (f) { o.push('| ' + f.name + ' | ' + f.desc + ' | ' + f.cells.join(',') + ' |'); });
o.push('', '陣法名稱 B（攻略）；格位與效果 C/D。', '', '## 虛空之門關卡', '', '| 章 | 關卡 | 種類 | 精力 | 建議等級 |', '|---|---|---|---|---|');
S.stages.forEach(function (s) { o.push('| ' + s.ch + ' | ' + s.name + ' | ' + s.kind + ' | ' + s.energy + ' | ' + (s.lv || '') + ' |'); });
o.push('', '章節名「曼陀山莊」A（宣傳影片）；其他章名、關卡名、敵人與獎勵 D。關卡種類（普通/精英/王/隱藏，隱藏需全三星）B。');
fs.writeFileSync(__dirname + '/../docs/附錄-資料表.md', o.join('\n') + '\n');
console.log('docs/附錄-資料表.md', H.list.length, 'heroes', S.stages.length, 'stages');
