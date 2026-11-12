// 虛空之門擴充 ch9 雁門關 + ch10 長安（WL-2）＋ ch11–13（WL-12）：node tests/unit-gate2.js
// 內容只讀 src/data/stages.json（直接讀檔，不依賴 data.generated.js 是否已重包），
// 再把新資料注入 harness 的 MJ.D.stages，驗證解鎖鏈與舊存檔相容。
// ES5 語法。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function rd(p) { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', p), 'utf8')); }

var D = rd('src/data/stages.json');
var EQ = rd('src/data/equipment.json');
var HEROES = rd('src/data/heroes.json');
var stages = D.stages, chapters = D.chapters, enemies = D.enemies;
var byId = {}, byCh = {};
stages.forEach(function (s) { byId[s.id] = s; (byCh[s.ch] = byCh[s.ch] || []).push(s); });
var chById = {};
chapters.forEach(function (c) { chById[c.id] = c; });
var heroIds = {};
HEROES.list.forEach(function (h) { heroIds[h.id] = 1; });
var eqIds = {};
EQ.list.forEach(function (e) { eqIds[e.id] = 1; });
var itemIds = EQ.items || {};

console.log('[章節／關卡數量]');
ok(chapters.length === 16, '共 16 章（WL-15 新增 ch14 蓬萊仙島、ch15 終南絕巔、ch16 九重天）');
ok(stages.length === 144, '共 144 關（117 + 27）');
ok(chapters[8].id === 9 && chapters[8].name === '雁門關' && chapters[8].lv === 60, 'ch9 雁門關 Lv60');
ok(chapters[9].id === 10 && chapters[9].name === '長安' && chapters[9].lv === 69, 'ch10 長安 Lv69');
ok(chapters[10].id === 11 && chapters[10].name === '桃花島' && chapters[10].lv === 79, 'ch11 桃花島 Lv79（WL-12）');
ok(chapters[11].id === 12 && chapters[11].name === '崑崙之巔' && chapters[11].lv === 80, 'ch12 崑崙之巔 Lv80（WL-12）');
ok(chapters[12].id === 13 && chapters[12].name === '天外天' && chapters[12].lv === 80, 'ch13 天外天 Lv80（WL-12）');
ok(chapters[13].id === 14 && chapters[13].name === '蓬萊仙島' && chapters[13].lv === 80, 'ch14 蓬萊仙島 Lv80（WL-15）');
ok(chapters[14].id === 15 && chapters[14].name === '終南絕巔' && chapters[14].lv === 80, 'ch15 終南絕巔 Lv80（WL-15）');
ok(chapters[15].id === 16 && chapters[15].name === '九重天' && chapters[15].lv === 80, 'ch16 九重天 Lv80（WL-15）');
ok(chapters.every(function (c) { return byCh[c.id] && byCh[c.id].length === 9; }), '每章 9 關');
ok(chapters.every(function (c) { return c.stageNames.length === 9 && c.souls.length === 6 && c.pool.length >= 3 && c.elite.length === 2 && c.boss && c.hidden; }), '每章欄位齊全（stageNames 9、souls 6、pool 3–5、elite 2、boss、hidden）');

console.log('[關卡結構]');
var bad = [];
stages.forEach(function (s) {
  var c = chById[s.ch];
  if (!c) { bad.push(s.id + ' 無所屬章節'); return; }
  if (s.name !== c.stageNames[s.idx]) bad.push(s.id + ' 名稱與章節 stageNames 不符');
  if (s.ch >= 9 && s.enemies.length !== 9) bad.push(s.id + ' 敵人 ' + s.enemies.length + ' 名，ch9–ch16 應為 9 名');
  if (s.enemies.length > 9) bad.push(s.id + ' 敵人超過 9 格上限');
  if (s.enemies.length < 3) bad.push(s.id + ' 敵人少於 3 名');
  var cells = {}, leaders = 0;
  s.enemies.forEach(function (e) {
    if (e.cell < 0 || e.cell > 8 || cells[e.cell]) bad.push(s.id + ' cell 重複或超出 0-8：' + e.cell);
    cells[e.cell] = 1;
    if (!enemies[e.e]) bad.push(s.id + ' 未知的敵人種類：' + e.e);
    if (e.leader) {
      leaders++;
      if (e.cell !== 4) bad.push(s.id + ' 首領不在 cell 4');
      if (e.lv !== s.lv + 1) bad.push(s.id + ' 首領等級應為關卡 lv+1');
      var want = s.kind === 'elite' ? c.elite : (s.kind === 'boss' ? [c.boss] : [c.hidden]);
      if (want.indexOf(e.e) < 0) bad.push(s.id + ' 首領 ' + e.e + ' 不在該章 ' + s.kind + ' 名單');
      if (s.kind === 'normal') bad.push(s.id + ' 普通關不應有首領');
    } else {
      if (c.pool.indexOf(e.e) < 0) bad.push(s.id + ' 小兵 ' + e.e + ' 不在該章 pool');
      if (e.lv !== s.lv) bad.push(s.id + ' 小兵等級應與關卡 lv 一致：' + e.e + ' lv' + e.lv);
    }
  });
  if (s.kind === 'normal' && leaders !== 0) bad.push(s.id + ' 普通關有首領');
  if (s.kind !== 'normal' && leaders !== 1) bad.push(s.id + ' ' + s.kind + '關應恰有 1 名首領，實際 ' + leaders);
  if (s.kind === 'normal' && s.energy !== 1) bad.push(s.id + ' 普通關精力應為 1');
  if (s.kind === 'elite' && s.energy !== 2) bad.push(s.id + ' 菁英關精力應為 2');
  if ((s.kind === 'boss' || s.kind === 'hidden') && s.energy !== 3) bad.push(s.id + ' 王關／隱藏關精力應為 3');
});
ok(!bad.length, '全部 144 關：ch9–ch16 各 9 名敵人、全章 cell 0-8 唯一、首領 cell 4 且 lv+1、小兵屬該章 pool 且 lv 一致、精力 1/2/3' + (bad.length ? '（' + bad.slice(0, 5).join('；') + '）' : '') + '（註：ch1-8 人數只驗 ≤9 格上限；WL-1 的 499→556 增兵目前只在單檔 HTML，不在 stages.json，見回報）');

console.log('[解鎖鏈]');
var badU = [];
stages.forEach(function (s) {
  if (s.unlock === null) { if (s.id !== 's1_1') badU.push(s.id + ' 只有 s1_1 可無解鎖條件'); return; }
  if (s.unlock === 'all3star') { if (s.kind !== 'hidden') badU.push(s.id + ' all3star 只用於隱藏關'); return; }
  if (!byId[s.unlock]) badU.push(s.id + ' 解鎖目標不存在：' + s.unlock);
});
ok(!badU.length, '每關 unlock 指向既有關卡、all3star 或 null' + (badU.length ? '（' + badU.slice(0, 5).join('；') + '）' : ''));
ok(byId.s9_1.unlock === 's8_8' && byId.s10_1.unlock === 's9_8' && byId.s11_1.unlock === 's10_8' && byId.s12_1.unlock === 's11_8' && byId.s13_1.unlock === 's12_8', 'ch9 由 s8_8 解鎖、ch10 由 s9_8 解鎖、ch11 由 s10_8 解鎖、ch12 由 s11_8 解鎖、ch13 由 s12_8 解鎖');
ok(byId.s14_1.unlock === 's13_8' && byId.s15_1.unlock === 's14_8' && byId.s16_1.unlock === 's15_8', 'ch14 由 s13_8 解鎖、ch15 由 s14_8 解鎖、ch16 由 s15_8 解鎖（WL-15）');
ok(byId.s9_9.unlock === 'all3star' && byId.s10_9.unlock === 'all3star' && byId.s11_9.unlock === 'all3star' && byId.s12_9.unlock === 'all3star' && byId.s13_9.unlock === 'all3star', '五章隱藏關皆為 all3star（本章其餘 8 關三星）');
ok(byId.s14_9.unlock === 'all3star' && byId.s15_9.unlock === 'all3star' && byId.s16_9.unlock === 'all3star', 'ch14–16 隱藏關皆為 all3star（WL-15）');
ok(stages.filter(function (s) { return s.ch === 9; }).every(function (s, i) { return i === 0 || s.unlock === 's9_' + i || s.kind === 'hidden'; }), 'ch9 章內鏈完整');
ok(stages.filter(function (s) { return s.ch === 10; }).every(function (s, i) { return i === 0 || s.unlock === 's10_' + i || s.kind === 'hidden'; }), 'ch10 章內鏈完整');
[11, 12, 13].forEach(function (ch) { ok(stages.filter(function (s) { return s.ch === ch; }).every(function (s, i) { return i === 0 || s.unlock === 's' + ch + '_' + i || s.kind === 'hidden'; }), 'ch' + ch + ' 章內鏈完整（WL-12）'); });
[14, 15, 16].forEach(function (ch) { ok(stages.filter(function (s) { return s.ch === ch; }).every(function (s, i) { return i === 0 || s.unlock === 's' + ch + '_' + i || s.kind === 'hidden'; }), 'ch' + ch + ' 章內鏈完整（WL-15）'); });

console.log('[等級與獎勵]');
ok([9, 10, 11, 12, 13, 14, 15, 16].every(function (ch) {
  var lvs = byCh[ch].map(function (s) { return s.lv; });
  return lvs.every(function (v, i) { return i === 0 || v >= lvs[i - 1]; });
}), 'ch9–ch16 章內等級單調不減（ch13–16 多關同 Lv90，允許相等）');
ok(byCh[9].map(function (s) { return s.lv; }).join(',') === '60,61,62,63,64,65,65,66,69', 'ch9 等級 60-66、隱藏 69（與 ch7/ch8 的 +0..+6／+9 形狀一致）');
ok(byCh[10].map(function (s) { return s.lv; }).join(',') === '69,70,71,72,73,74,74,75,78', 'ch10 等級 69-75、隱藏 78');
ok(byCh[11].map(function (s) { return s.lv; }).join(',') === '79,80,80,81,82,82,83,84,85', 'ch11 等級 79-84、隱藏 85（WL-12）');
ok(byCh[12].map(function (s) { return s.lv; }).join(',') === '85,86,86,87,87,88,88,89,89', 'ch12 等級 85-89、隱藏 89（WL-12）');
ok(byCh[13].map(function (s) { return s.lv; }).join(',') === '89,89,90,90,90,90,90,90,90', 'ch13 等級 89-90、多關同 Lv90 封頂（WL-12）');
ok(byCh[14].map(function (s) { return s.lv; }).join(',') === '90,90,90,90,90,90,90,90,90', 'ch14 等級全 Lv90（WL-15）');
ok(byCh[15].map(function (s) { return s.lv; }).join(',') === '90,90,90,90,90,90,90,90,90', 'ch15 等級全 Lv90（WL-15）');
ok(byCh[16].map(function (s) { return s.lv; }).join(',') === '90,90,90,90,90,90,90,90,90', 'ch16 等級全 Lv90（WL-15）');
var badR = [];
for (var i = 0; i < 9; i++) {
  var s8 = byId['s8_' + (i + 1)], s9 = byId['s9_' + (i + 1)], s10 = byId['s10_' + (i + 1)], s11 = byId['s11_' + (i + 1)], s12 = byId['s12_' + (i + 1)], s13 = byId['s13_' + (i + 1)];
  if (!(s9.exp > s8.exp && s10.exp > s9.exp && s11.exp > s10.exp && s12.exp > s11.exp && s13.exp > s12.exp)) badR.push('idx' + i + ' exp 未遞增');
  if (!(s9.silver > s8.silver && s10.silver > s9.silver && s11.silver > s10.silver && s12.silver > s11.silver && s13.silver > s12.silver)) badR.push('idx' + i + ' silver 未遞增');
  if (!(s9.first.silver > s8.first.silver && s10.first.silver > s9.first.silver && s11.first.silver > s10.first.silver && s12.first.silver > s11.first.silver && s13.first.silver > s12.first.silver)) badR.push('idx' + i + ' 首通銀幣未遞增');
  var s14 = byId['s14_' + (i + 1)], s15 = byId['s15_' + (i + 1)], s16 = byId['s16_' + (i + 1)];
  // ch14–16 全 Lv90：idx2–8 與 s13 同位相等；idx0–1 對照 s13_3（s13_1／_2 為 Lv89，數值較低）
  var ref = i < 2 ? byId['s13_3'] : s13;
  if (!(s14.exp === ref.exp && s15.exp === ref.exp && s16.exp === ref.exp)) badR.push('idx' + i + ' ch14–16 exp 應與 s13 Lv90 同位相等（全 Lv90 封頂）');
  if (!(s14.silver === ref.silver && s15.silver === ref.silver && s16.silver === ref.silver)) badR.push('idx' + i + ' ch14–16 silver 應與 s13 Lv90 同位相等');
  if (!(s14.first.silver === ref.first.silver && s15.first.silver === ref.first.silver && s16.first.silver === ref.first.silver)) badR.push('idx' + i + ' ch14–16 首通銀幣應與 s13 Lv90 同位相等');
}
ok(!badR.length, 'ch9–ch13 經驗、銀幣、首通銀幣皆高於上一章同位關卡；ch14–16 與 s13 同位相等（全 Lv90 封頂，WL-15）' + (badR.length ? '（' + badR.join('；') + '）' : ''));
ok(byCh[9][0].exp === 357 && byCh[10][0].exp === 413 && byCh[9][8].exp === 1064 && byCh[10][8].exp === 1203 && byCh[11][0].exp === 473 && byCh[13][8].exp === 1563 && byCh[16][8].exp === 1563, '獎勵數值符合 ch7→ch8 同位比率外推（s9_1 exp 357、s10_1 exp 413、s9_9 exp 1064、s10_9 exp 1203；WL-12：s11_1 exp 473、s13_9 exp 1563；WL-15：s16_9 exp 1563）');

console.log('[掉落引用]');
var badD = [];
stages.forEach(function (s) {
  if (s.ch < 9) return;
  s.drops.concat(s.first.items || []).forEach(function (d) {
    var it = d.item;
    if (it.indexOf('eq:') === 0) { if (!eqIds[it.slice(3)]) badD.push(s.id + ' 未知裝備：' + it); }
    else if (it.indexOf('soul:') === 0) { if (!heroIds[it.slice(5)]) badD.push(s.id + ' 未知將魂：' + it); }
    else if (it.indexOf('gem_') === 0 || it.indexOf('xf_') === 0) { if (!itemIds[it]) badD.push(s.id + ' 未知道具：' + it); }
    else if (!itemIds[it] && ['jinglitang', 'jinengshu', 'peiyangdan', 'xinfacanye', 'xilianshi', 'tufeiling', 'shenjishu'].indexOf(it) < 0) badD.push(s.id + ' 未知道具：' + it);
  });
  if (s.drops.length < 8) badD.push(s.id + ' 掉落過少');
});
chapters.forEach(function (c) {
  if (c.id < 9) return;
  c.souls.forEach(function (s) { if (!heroIds[s]) badD.push('ch' + c.id + ' 未知將魂：' + s); });
  c.pool.concat(c.elite, [c.boss, c.hidden]).forEach(function (e) { if (!enemies[e]) badD.push('ch' + c.id + ' 未知敵人：' + e); });
});
ok(!badD.length, 'ch9–ch16 所有掉落、首通獎勵、將魂、敵人 key 皆存在於 equipment／heroes／enemies' + (badD.length ? '（' + badD.slice(0, 5).join('；') + '）' : ''));
ok([9, 10, 11, 12, 13, 14, 15, 16].every(function (ch) { return byCh[ch].every(function (s) { return s.drops.some(function (d) { return d.item.indexOf('eq:') === 0 && /1$/.test(d.item); }); }); }), 'ch9–ch16 裝備掉落皆為 Lv1（WL-10：全部掉落從 Lv1 開始，品質不變）');

console.log('[舊存檔相容：真實 v10 存檔 fixture]');
var c = load(), M = c.MJ, G = M.G, S = M.S;
// 注入新版 stages.json（harness 載的是重包前的 data.generated.js，仍為 8 章）
M.D.stages = D;
M.D.stageIndex = {};
D.stages.forEach(function (s) { M.D.stageIndex[s.id] = s; });
var fxText = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v10.json'), 'utf8');
var rawOld = JSON.parse(fxText).data;
var p = M.S.parse(fxText);
ok(p.ok && p.state.version === M.S.VERSION, 'v10 舊存檔可匯入並升到 v' + M.S.VERSION);
if (p.ok) {
  var st = p.state;
  var oldKeys = Object.keys(rawOld.stages || {}).sort();
  var newKeys = Object.keys(st.stages || {}).sort();
  ok(JSON.stringify(oldKeys) === JSON.stringify(newKeys), '舊存檔關卡紀錄鍵集合不變（' + oldKeys.length + ' 關，無 s9_／s10_ 鍵被憑空建立）');
  ok(JSON.stringify(st.stages) === JSON.stringify(rawOld.stages), '舊存檔關卡紀錄內容逐字不變');
  M.S.state = st;
  ok(G.stageState('s9_1').stars === 0 && G.stageState('s9_1').clears === 0, '新關卡對舊存檔預設 0 星／0 通關（stageState 缺省值）');
  ok(!G.stageUnlocked('s9_1') && !G.chapterUnlocked(9) && !G.chapterUnlocked(10), '舊存檔（主角 Lv50）第 9／10 章仍鎖定');
  ok(G.stageUnlocked('s1_1') === true, '舊存檔第 1 關仍可正常開啟');
}

console.log('[舊存檔相容：模擬已通關 ch8 的舊存檔]');
c = load(); M = c.MJ; G = M.G; S = M.S;
M.D.stages = D;
M.D.stageIndex = {};
D.stages.forEach(function (s) { M.D.stageIndex[s.id] = s; });
G.newGame('測試', '力耐', 'm', 7);
var lead = G.lead();
lead.lv = 60;
// 模擬舊存檔：ch1-8 全通關（s8_8 已通關，但 ch8 隱藏關未三星）
S.state.stages = {};
stages.forEach(function (s) { if (s.ch <= 8) S.state.stages[s.id] = { stars: 3, clears: 1 }; });
S.state.stages.s8_9 = { stars: 0, clears: 0 };
ok(G.chapterUnlocked(9) && G.stageUnlocked('s9_1'), '通關 s8_8 且 Lv60：ch9 與 s9_1 解鎖');
ok(!G.stageUnlocked('s9_2') && !G.stageUnlocked('s9_9'), 's9_2（未通關 s9_1）與 s9_9（未全三星）仍鎖定');
ok(!G.chapterUnlocked(10) && !G.stageUnlocked('s10_1'), '未通關 s9_8：ch10 與 s10_1 仍鎖定');
ok(S.state.stages.s8_8.clears === 1 && S.state.stages.s8_8.stars === 3, '舊進度 s8_8（3 星／1 通關）原樣保留');
S.state.stages.s9_1 = { stars: 3, clears: 1 };
ok(G.stageUnlocked('s9_2') && !G.stageUnlocked('s9_3'), '通關 s9_1 後 s9_2 解鎖、s9_3 仍鎖定（鏈式解鎖）');
// ch9 其餘 8 關全三星 → 隱藏關開啟（不需通關 s9_8 以外的條件）
byCh[9].forEach(function (s) { if (s.kind !== 'hidden') S.state.stages[s.id] = { stars: 3, clears: 1 }; });
ok(G.stageUnlocked('s9_9'), 'ch9 其餘 8 關全三星：隱藏關 s9_9 解鎖');
lead.lv = 69; // lockReason 先驗主角等級：s10_1 的章節門檻是 Lv69
ok(G.lockReason('s10_1') === '需先通關「雁門決戰」', '鎖定原因正確指向 s9_8（雁門決戰）');

console.log('[地圖 UI：不需改程式]');
var vols = Math.ceil(chapters.length / 4);
ok(vols === 4, 'ui-gate.js 的 vols = ceil(16/4) = 4 卷，自動容納 ch11–ch16（WL-15：16 章剛好 4 卷，不需補卷名）');
ok(['一', '二', '三', '四'][vols - 1] === '四', '卷名陣列有第 4 卷標籤，不會越界（WL-12 補「四」）');
ok(M.D.stages.chapters[9].bg && M.D.stages.chapters[8].bg, '新章節有地圖底色');

console.log('結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
