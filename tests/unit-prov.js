// 原版考證表檢查：node tests/unit-prov.js
// 規則：A/B/C/D 分級；C、D 的標籤不得含「原版」；來源、衝突必須存在；規格書每一項都要有條目
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..'), pass = 0, fail = 0;
function ok(c, n) { if (c) pass++; else { fail++; console.log('✗ ' + n); } }
var P = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'provenance.json'), 'utf8'));
ok(P.version >= 1 && P.grades && P.sources && P.conflicts && P.entries, '考證表結構完整');
var ids = {}, kid = {};
P.conflicts.forEach(function (k) { kid[k.id] = k; ok(k.sides && k.sides.length >= 2, '衝突 ' + k.id + ' 至少保留兩方說法'); ok(!!k.handling && !!k.status, '衝突 ' + k.id + ' 有處理方式與狀態'); k.sides.forEach(function (s) { (s.sources || []).forEach(function (x) { ok(!!P.sources[x], '衝突 ' + k.id + ' 的來源 ' + x + ' 存在'); }); }); });
for (var i = 1; i <= 9; i++) ok(!!kid['K' + i], '衝突 K' + i + ' 存在');
P.entries.forEach(function (e) {
  ok(!ids[e.id], '條目 id 不重複 ' + e.id); ids[e.id] = e;
  ok(/^[ABCD]$/.test(e.grade), '分級是 A～D ' + e.id);
  ok(typeof e.label === 'string' && e.label.length > 0, '有顯示標籤 ' + e.id);
  if (e.grade === 'C' || e.grade === 'D') ok(e.label.indexOf('原版') < 0, 'C/D 條目不得標成原版 ' + e.id + '（' + e.label + '）');
  if (e.grade === 'C' || e.grade === 'D') ok(e.tentative === true, 'C/D 條目標記暫定 ' + e.id);
  if (e.grade !== 'D') ok(e.sources && e.sources.length > 0, 'A/B/C 條目至少一個來源 ' + e.id); else ok(Array.isArray(e.sources), 'D 條目有 sources 欄位 ' + e.id);
  (e.sources || []).forEach(function (s) { ok(!!P.sources[s.s], '來源 ' + s.s + ' 存在（' + e.id + '）'); ok(typeof s.q === 'string' && s.q.length > 0, '有引文（' + e.id + '）'); });
  (e.conflicts || []).forEach(function (k) { ok(!!kid[k], '引用的衝突 ' + k + ' 存在（' + e.id + '）'); });
  // A/B 必須有 A/B 級來源（不能只靠規格書）
  if (e.grade === 'A' || e.grade === 'B') ok(e.sources.some(function (s) { return P.sources[s.s] && /[AB]/.test(P.sources[s.s].grade); }), 'A/B 條目有原版來源 ' + e.id);
});
// 規格書每一項都要有條目
['lim.energy', 'lim.retry.xukong', 'lim.retry.tower', 'lim.retry.wuji', 'lim.retry.shanggu', 'lim.daily', 'lim.recruitCd', 'lim.realtime', 'lim.firstClear',
 'soul.cost.green', 'soul.cost.blue', 'soul.cost.purple45', 'soul.combine', 'soul.sources', 'eq.slots8', 'eq.weapon', 'eq.stats.new',
 'skill.busi', 'skill.suxing', 'skill.rennai', 'skill.huajie', 'skill.xinu', 'skill.xixue', 'skill.rexue', 'skill.gjyudi', 'skill.pozhou', 'skill.pojia', 'skill.dunhua', 'skill.suijia', 'skill.lianzhan', 'skill.huizhan', 'skill.liaoshang', 'skill.gjliaoshang',
 'grow.peiyang.cost', 'grow.leadPromote', 'soul.combineLv', 'grow.jx.irreversible', 'st.tower.open', 'st.tower.every10', 'st.wuji.soul5', 'st.xukong.kinds', 'data.table'
].forEach(function (id) { ok(!!ids[id], '規格項目有考證條目 ' + id); });
// 建置後的 data.generated.js 內含考證表，遊戲可讀
var ctx = { MJ: {}, console: console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', 'js', 'data.generated.js'), 'utf8'), ctx);
ok(ctx.MJ.D.provenance && ctx.MJ.D.provenance.entries.length === P.entries.length, 'data.generated.js 含最新考證表（' + P.entries.length + ' 條）');
// 畫面上的「原版」字樣：src/js 中不得把 C/D 條目寫成原版（抽查考證表引用處）
var src = fs.readdirSync(path.join(ROOT, 'src', 'js')).filter(function (f) { return /\.js$/.test(f) && !/generated/.test(f); }).map(function (f) { return fs.readFileSync(path.join(ROOT, 'src', 'js', f), 'utf8'); }).join('\n');
ok(!/C[級：:（(][^\n]{0,12}原版[^\n]{0,4}(證實|記載)/.test(src) && !/D[級：:（(][^\n]{0,12}原版[^\n]{0,4}(證實|記載)/.test(src), '程式中沒有把 C/D 寫成「原版證實／記載」');
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
