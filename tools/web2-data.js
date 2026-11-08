// 網路資料搜查-2 還原（P1～P4）資料修補：node tools/web2-data.js [P1 P2 P3 P4]
// 可重複執行（每項都是「設定成目標值」）。來源：docs/sources/web2/c-*.json（本機），GitHub 版改讀 docs/sources-extracted/web2/c-*.json（只含我們整理的事實）
var fs = require('fs'), path = require('path');
var D = path.join(__dirname, '..', 'src', 'data');
function rd(n) { return JSON.parse(fs.readFileSync(path.join(D, n + '.json'), 'utf8')); }
function wr(n, o) { fs.writeFileSync(path.join(D, n + '.json'), JSON.stringify(o, null, 1)); }
var phases = process.argv.slice(2); if (!phases.length) phases = ['P1', 'P2', 'P3', 'P4'];
var H = rd('heroes'), C = rd('config'), F = rd('formations'), P = rd('provenance'), T = rd('stages');
var byId = {}; H.list.forEach(function (h) { byId[h.id] = h; });
function src(id, o) { P.sources[id] = o; }
function conflict(o) { var i = P.conflicts.findIndex(function (k) { return k.id === o.id; }); if (i >= 0) P.conflicts[i] = o; else P.conflicts.push(o); }
function entry(o) {
  if (o.grade === 'C' || o.grade === 'D') { o.tentative = true; if (o.label.indexOf('原版') >= 0) throw new Error('C/D label 含原版 ' + o.id); } else o.tentative = false;
  o.conflicts = o.conflicts || []; o.sources = o.sources || [];
  var i = P.entries.findIndex(function (e) { return e.id === o.id; }); if (i >= 0) P.entries[i] = o; else P.entries.push(o);
}
var LB = { A: '原版（原版畫面證實）', B: '原版（當年攻略記載）', C: '推測（間接資料）', D: '本作設計（暫定）' };
src('W967', { title: '【攻略】武將技能一覽表(段譽降臨)（巴哈姆特哈啦板 snA=967）', url: 'https://forum.gamer.com.tw/C.php?bsn=22512&snA=967', author: 'gjo3xu04（水瀲）', date: '2012-06-14～2013-05-23', region: '台版', grade: 'B' });
src('W7', { title: '武將技能表（精華區 sn=7）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=7', grade: 'B' });
src('W60', { title: '將魂/品質表（巴哈姆特精華區 sn=60，轉貼百度）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=60', author: '巴哈玩家', date: '2012-12-29', region: '台版轉陸版', grade: 'B' });
src('W77', { title: '陣法（巴哈姆特精華區 sn=77，8 張陣法面板截圖）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=77', author: '巴哈玩家', date: '2013-03', region: '台版', grade: 'A' });
src('W6', { title: '經驗表（巴哈姆特精華區 sn=6）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=6', author: '巴哈玩家', date: '2012', region: '台版', grade: 'B' });
src('W48', { title: '【討論】將星錄武將升級所需將魂數資料補完計劃（巴哈姆特精華區 sn=48）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=48', author: '賀賀（gadder）', date: '2012-11-26', region: '台版', grade: 'B', note: '表格有空白與欄位對齊不明處；與 W53 白魂 Lv10 有差異' });
src('W53', { title: '【問題】將星等級所需魂數（巴哈姆特精華區 sn=53）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=53', author: 'Will（willwillhi）', date: '2012-12-16', region: '台版', grade: 'B' });
src('W84', { title: '寶石數值（巴哈姆特精華區 sn=84）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=84', author: '巴哈玩家', date: '2013', region: '台版', grade: 'B' });
src('W86', { title: '心法（巴哈姆特精華區 sn=86／91）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=86', author: '巴哈玩家', date: '2013', region: '台版', grade: 'B' });
src('W91', { title: '心法攻略（補充）（巴哈姆特精華區 sn=91）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=91', author: '大溪（loamiia）', date: '2013-08-21', region: '台版', grade: 'B' });
src('W88', { title: '生死劫（巴哈姆特精華區 sn=88）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=88', author: '巴哈玩家', date: '2013', region: '台版', grade: 'B' });
src('W51', { title: '【攻略】戰場物品效果（巴哈姆特精華區 sn=51）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=51', author: '水瀲（gjo3xu04）', date: '2012-12-06', region: '台版', grade: 'B' });
src('W17', { title: '【攻略】新手導覽（巴哈姆特精華區 sn=17）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=17', author: '水瀲（gjo3xu04）', date: '2012-06-23', region: '台版', grade: 'B' });
src('W47', { title: '將星錄組合（巴哈姆特精華區 sn=47／53／48）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=47', author: '巴哈玩家', date: '2012–2013', region: '台版', grade: 'B' });
src('W4892', { title: '1.5.9 陣法優劣（巴哈姆特哈啦板 snA=4892）', url: 'https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=4892', author: '巴哈玩家（轉自大陸玩家）', date: '2013-03-13', region: '陸版轉貼', grade: 'B', note: '內嵌 tooltip 截圖為 A' });
src('W541', { title: '合成公式表（巴哈姆特哈啦板 snA=541）', url: 'https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=541', author: '巴哈玩家', date: '2012-06', region: '台版', grade: 'B' });
src('W282', { title: '6 級技能範圍（巴哈姆特哈啦板 snA=282，14 張技能截圖）', url: 'https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=282', author: '孤風蒼月', date: '2012-05-30～2013-02', region: '台版', grade: 'A', note: '截圖為原版畫面（A）；內文規則為 B' });
src('W8', { title: '六等變範圍（巴哈姆特精華區 sn=8）', url: 'https://forum.gamer.com.tw/G2.php?bsn=22512&sn=8', author: '未保存', date: '未保存', region: '台版', grade: 'B', note: '來源索引只保留「六大天王六等不變、紫將僅趙雲／呂布不變、藍將全變、無雙不變」摘要' });
src('WPV', { title: '官方宣傳片「猛將無雙 ／ Facebook 臉書網頁遊戲 ／ 宣傳片」（YouTube，本地 reference/web2/video）', url: 'https://www.youtube.com/watch?v=tcxWoC-Rtb8', author: 'XtremeLegend2013', date: '2013-11-04', region: '台版', grade: 'A' });

if (phases.indexOf('P1') >= 0) {
  var QB = ['wangyuyan', 'weixiaobao', 'liqiushui', 'jianning', 'xuchu', 'taishici', 'sunce'];
  var QP = ['duanyu', 'xiaoqiao', 'daqiao', 'azi', 'huangyueying', 'huangrong', 'dongfang', 'shuanger', 'renyingying', 'xuzhu', 'sunquan', 'xiongmao'];
  var S30 = ['renwoxing', 'linghuchong', 'caocao', 'shuanger', 'xuzhu', 'wuyazi', 'azi', 'zhangwuji', 'zhouyu'];
  var TY = { sunshangxiang: '智耐', xiaoqiao: '智耐', huangyueying: '智敏', shuanger: '智敏', zhoubotong: '力耐', caocao: '力耐', lvbu: '力耐', dianwei: '力敏', miejue: '力敏', sunquan: '力敏', liubei: '力敏', duanyu: '力敏' };
  QB.forEach(function (id) { var h = byId[id]; h.quality = 3; h.souls = 5; h.qGrade = 'B'; });
  QP.forEach(function (id) { var h = byId[id]; h.quality = 4; h.souls = S30.indexOf(id) >= 0 ? 30 : 45; h.qGrade = 'B'; });
  H.list.forEach(function (h) { if (h.quality === 4) h.souls = S30.indexOf(h.id) >= 0 ? 30 : 45; });
  Object.keys(TY).forEach(function (id) {
    var h = byId[id], to = TY[id], from = h.type; if (from === to) return;
    if (!h.typeOrig) h.typeOrig = from;
    if (from.charAt(0) !== to.charAt(0)) { var t = h.base.str; h.base.str = h.base.int; h.base.int = t; }
    if (from.charAt(1) !== to.charAt(1)) { var t2 = h.base.agi; h.base.agi = h.base.con; h.base.con = t2; }
    h.type = to; h.growth = JSON.parse(JSON.stringify({ str: C.grow[to][0], int: C.grow[to][1], agi: C.grow[to][2], con: C.grow[to][3] }));
    h.tGrade = 'B';
  });
  Object.keys(TY).forEach(function (id) { var h = byId[id]; if (h.typeOrig) h.typeGrade = 'B（巴哈 snA967 武將一覽「類型」欄；v9 由' + h.typeOrig + '修正）'; });
  C.teamSlotsByLevel = [[1, 3], [15, 4], [25, 5], [35, 6], [60, 7], [70, 8]];
  entry({ id: 'web2.hero.quality', cat: '武將', item: '19 名武將品質修正', spec: '依 snA967 字色', current: '綠→藍 7、藍→紫 11、綠→紫 1（熊貓）', grade: 'B', label: LB.B, sources: [{ s: 'W967', q: '表格以字色標示品質（綠/藍/紫）' }, { s: 'W60', q: '藍將：王語嫣 韋小寶 李秋水 建寧 許褚 太史慈 孫策…' }, { s: 'W541', q: '藍將全都要5個 紫將有公式的要30個 沒公式的要45個（公式材料含王語嫣、韋小寶、李秋水、建寧、許褚）' }], phase: 'web2-P1' });
  entry({ id: 'web2.hero.type', cat: '武將', item: '12 名武將類型修正', spec: '依 snA967 類型欄', current: '孫尚香/小喬 智耐、黃月英/雙兒 智敏、周伯通/曹操/呂布 力耐、典韋/滅絕/孫權/劉備/段譽 力敏；成長改為該類型成長', grade: 'B', label: LB.B, sources: [{ s: 'W967', q: '武將 - 類型 欄' }, { s: 'W282', q: '技能截圖 tooltip 顯示：曹操 力耐型武將、典韋 力敏…' }], phase: 'web2-P1' });
  entry({ id: 'web2.hero.souls30', cat: '將魂', item: '30 魂紫將名單', spec: 'sn60', current: '任我行、令狐沖、曹操（45→30）、雙兒、虛竹、無崖子、阿紫、張無忌、周瑜；其餘紫 45', grade: 'B', label: LB.B, sources: [{ s: 'W60', q: '二線紫（30 魂）名單' }], conflicts: ['K10'], phase: 'web2-P1' });
  entry({ id: 'web2.team.slots', cat: '陣容', item: '上陣人數', spec: 'sn41', current: '主角＋副將：1 級 3 人、15 級 4（D）、25 級 5、35 級 6、60 級 7、70 級 8（上限 8）', grade: 'B', label: LB.B, sources: [{ s: 'S1', q: '副將第 4 位 25 級、第 5 位 35、第 6 位 60、第 7 位 70' }], phase: 'web2-P1', note: '1/15 級的 3、4 人為本作沿用（D）' });
  entry({ id: 'web2.team.slots.early', cat: '陣容', item: '前 25 級上陣人數', spec: '—', current: '1 級 3 人、15 級 4 人', grade: 'D', label: LB.D, sources: [], phase: 'web2-P1' });
  conflict({ id: 'K10', item: '孫權／東方不敗／夏侯惇 的將魂數', sides: [{ claim: '紫將有公式的要 30 個（此三人在公式表中有公式）', sources: ['W541'], date: '2012-06' }, { claim: '30 魂紫將名單不含此三人（45 魂）', sources: ['W60', 'W967'], date: '2012-12' }], handling: '維持 45，標 C；兩方說法都保留', status: '已處理（web2-P1）' });
  H.list.forEach(function (h) { if (['sunquan', 'dongfang', 'xiahoudun'].indexOf(h.id) >= 0) h.soulsGrade = 'C'; });
}
if (phases.indexOf('FIX') >= 0 || phases.indexOf('P1') >= 0) {
  // 緊急修正（2026-11-04 Tomas 回報）：攻擊範圍以施放者自己的格子為起點，我方擋住前方
  var Q967 = { s: 'W967', q: '表頭「普攻格數／六等普攻格數／無雙技格數」，格圖如段譽「■■■ ●■」（● 為空白對齊；武將所在列第一格 ■ 是自己，往右的 ■ 是往前打到的格）' };
  var QPV = { s: 'WPV', q: '宣傳片：黑底戰場、攻擊範圍格紅色、己方格綠色' };
  var RG = [
    ['web2.range.anchor', '範圍以施放者自己的格子為起點', '技能範圍圖的起點是武將自己（往前數格）', 'A', [QPV, Q967]],
    ['web2.range.count', '往前數的是「格上的活人」', 'dc 往前數同列活著的單位；e = dc − 前方我方人數，指到敵方第 r+dr 列由前往後第 e 個活人', 'B', [Q967]],
    ['web2.range.block', '我方擋住前方格子', '同列前方有活著的我方時，前排佔掉的格數不能打到敵人；前方我方陣亡後才打得到', 'C', [Q967]],
    ['web2.range.convert', '舊範圍資料換算', '本作 single/line/col… 範圍名換成以自己為起點的格子偏移', 'C', [Q967]],
    ['web2.range.advance', '打不到時往前衝', '範圍內沒有敵人且前方格子空著就往前移（因為按活人計算，移動多為表現）', 'D', []],
    ['web2.range.whiff', '揮空', '範圍內沒有敵人時顯示「揮空」，不加怒氣、連斬不觸發', 'D', []],
    ['web2.range.ultfallback', '無雙打不到改用主動技', '無雙範圍內無敵人時保留怒氣、改放主動技', 'D', []],
    ['web2.range.sidestep', '換列（防卡關）', '自己這一列沒有敵人時，每回合往最近有敵人的列移一格（先同欄，再往後的欄，目標格須空）', 'D', []]
  ];
  P.entries = P.entries.filter(function (e) { return ['web2.range.whiff.word', 'web2.range.whiff.rule'].indexOf(e.id) < 0; });
  RG.forEach(function (x) { entry({ id: x[0], cat: '戰鬥', item: x[1], spec: 'snA967／sn41／宣傳片', current: x[2], grade: x[3], label: LB[x[3]], sources: x[4], phase: 'web2-fix', note: x[3] === 'D' ? '原版資料沒寫，本作自訂' : undefined }); });
  entry({ id: 'web2.formation.persist', cat: '陣容', item: '陣法與站位存檔', spec: '—', current: '換陣法時保留仍開放格子上的武將，其餘移到最近的空開放格（不刪武將）；所有戰鬥模式使用編好的站位', grade: 'D', label: LB.D, sources: [], phase: 'web2-fix' });
}
if (phases.indexOf('P2') >= 0) {
  var r2 = require('./web2-p2.js')({ H: H, C: C, F: F, P: P, byId: byId, entry: entry, conflict: conflict, LB: LB, src: src });
  console.log('P2 made', r2.made.length, 'passives', r2.nP, 'partners', r2.nL);
}
if (phases.indexOf('P3') >= 0) {
  var r3 = require('./web2-p3.js')({ H: H, C: C, P: P, T: T, entry: entry, conflict: conflict, LB: LB });
  console.log('P3 mapped', r3.mapped, '/', r3.rows, 'skill rows; ranges', r3.ranges, 'sourced /', r3.fallbackRanges, 'fallback; honor frames', r3.frames);
}

if (phases.indexOf('P4') >= 0) {
  var soulRecipeNames = [{"in":["張角","張角","蔡文姬","鹿杖客","岳靈珊"],"out":"韋小寶"},{"in":["蔡文姬","蔡文姬","蔡文姬","張角","華雄"],"out":"韋小寶"},{"in":["邱處機","邱處機","張角","蔡文姬","岳靈珊"],"out":"建寧公主"},{"in":["邱處機","邱處機","岳靈珊","岳靈珊","蔡文姬"],"out":"建寧公主"},{"in":["邱處機","邱處機","張角","鹿杖客","岳靈珊"],"out":"許褚"},{"in":["邱處機","邱處機","邱處機","鹿杖客","岳靈珊"],"out":"許褚"},{"in":["華雄","華雄","張角","岳靈珊","鹿杖客"],"out":"鰲拜"},{"in":["蔡文姬","蔡文姬","蔡文姬","岳靈珊","張角"],"out":"鰲拜"},{"in":["鹿杖客","鹿杖客","蔡文姬","蔡文姬","岳靈珊"],"out":"梅超風"},{"in":["華雄","華雄","張角","張角","岳靈珊"],"out":"梅超風"},{"in":["典韋","韋小寶","張遼","滅絕師太","左冷禪"],"out":"虛竹"},{"in":["董卓","韋小寶","袁紹","阿珂","顏良"],"out":"虛竹"},{"in":["李秋水","韋小寶","韋小寶","建寧公主","顏良"],"out":"虛竹"},{"in":["鰲拜","韋小寶","梅超風","典韋","許褚"],"out":"虛竹"},{"in":["董卓","鰲拜","建寧公主","張遼","顏良"],"out":"曹操"},{"in":["周伯通","孫策","天山童姥","阿珂","李莫愁"],"out":"曹操"},{"in":["周伯通","李秋水","孫策","梅超風","滅絕師太"],"out":"曹操"},{"in":["李秋水","韋小寶","梅超風","典韋","顏良"],"out":"曹操"},{"in":["孫策","典韋","梅超風","袁紹","建寧公主"],"out":"任我行"},{"in":["李莫愁","鰲拜","梅超風","梅超風","左冷禪"],"out":"任我行"},{"in":["董卓","梅超風","建寧公主","王語嫣","王語嫣"],"out":"任我行"},{"in":["李秋水","張遼","張遼","滅絕師太","左冷禪"],"out":"任我行"},{"in":["孫策","韋小寶","太史慈","滅絕師太","李莫愁"],"out":"張無忌"},{"in":["孫策","孫策","建寧公主","袁紹","左冷禪"],"out":"張無忌"},{"in":["周伯通","孫策","李秋水","鰲拜","左冷禪"],"out":"張無忌"},{"in":["李莫愁","梅超風","袁紹","許褚","王語嫣"],"out":"張無忌"},{"in":["太史慈","袁紹","許褚","滅絕師太","王語嫣"],"out":"孫權"},{"in":["王語嫣","左冷禪","袁紹","許褚","李莫愁"],"out":"孫權"},{"in":["鰲拜","天山童姥","建寧公主","梅超風","顏良"],"out":"孫權"},{"in":["周伯通","天山童姥","韋小寶","阿珂","許褚"],"out":"孫權"},{"in":["典韋","梅超風","阿珂","許褚","李莫愁"],"out":"令狐沖"},{"in":["李秋水","建寧公主","袁紹","許褚","張遼"],"out":"東方不敗"},{"in":["周伯通","李秋水","韋小寶","許褚","左冷禪"],"out":"周瑜"},{"in":["董卓","鰲拜","周伯通","許褚","滅絕師太"],"out":"夏侯惇"}];
  var byName = {}; H.list.forEach(function (h) { byName[h.name] = h.id; });
  // Compact runtime form: "materialId,materialId,materialId,materialId,materialId,outputId".
  C.soulCombine.recipes = soulRecipeNames.map(function (r) {
    return r.in.map(function (name) { if (!byName[name]) throw new Error('W541 recipe hero missing: ' + name); return byName[name]; }).concat([byName[r.out]]).join(',');
  });
  entry({ id: 'web2.soulCombine.recipes', cat: '將魂合成', item: '5 魂合成公式', spec: 'snA541', current: '34 條非爭議公式；放置順序無關；綠將無公式；正確配方提示；爭議兩條不觸發', grade: 'B', label: LB.B, sources: [{ s: 'W541', q: '2012-06 合成公式表；34 條配方及合成規則' }], phase: 'web2-P4', note: '兩條留言爭議公式保留於 contested，不進 runtime。' });
  entry({ id: 'web2.shengsijie.rules', cat: '生死劫', item: '九層首領名稱與挑戰規則', spec: 'G2(88)', current: '九層名稱依攻略；逐層開放、首領等級／外觀／技能與首通銀幣及經驗獎勵均為本作暫定設計。', grade: 'D', label: LB.D, sources: [{ s: 'W88', q: '攻略可確認九層名稱；未提供敵方數值與獎勵規則' }], phase: 'web2-P4-3', note: '沒有來源的戰鬥數值與解鎖／獎勵均明確標 D。' });
}
if (phases.indexOf('P1') >= 0 || 1) { wr('heroes', H); wr('config', C); wr('formations', F); wr('provenance', P); }
if (phases.indexOf('P3') >= 0) wr('stages', T);
console.log('web2-data done', phases.join(','), 'heroes', H.list.length, 'prov', P.entries.length);
