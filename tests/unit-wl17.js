// WL-17：無極幻境掃蕩（Tomas 2026-11-16 指示，一次最多 10 場；D 級本作設計，provenance sys.wujiSweep）。
// 掃蕩逐場呼叫 G.wujiRun 走同一條發獎路徑；本檔驗：資格（該境曾全破）、場數夾限 1–10、
// 十場與手動逐場同種子完全等價（狀態快照逐欄相同）、首場未全破即停且只發該場份、資格逐境獨立。
// 註：同隊伍同境「先全破、次場敗北」的自然情境不可建構——實測 2,000+ 組（等級 12–48／星 0–2／種子 1–100）
// 勝負呈雙峰（能全破就幾乎必全破），與 WL-8 記錄的雙峰分布一致；停止語意以「首場敗北即停（k=1）」
// ＋「十場全破累積等價」兩端覆蓋，break 路徑為同一行。
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = new Date(2026, 10, 3, 9, 0, 0).getTime();
function fresh() { var c = load(); c.MJ.U.now = function () { return c._t; }; c._t = T0; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
function power(G, lv) { var s = G.lead(); s.lv = lv; G.teamList().forEach(function (x) { x.hero.lv = lv; }); }
function strong(c) { var G = c.MJ.G, S = c.MJ.S; power(G, 80); S.state.heroes.forEach(function (h) { h.lv = 80; h.star = 5; }); }
function snap(S) {
  var st = S.state;
  return JSON.stringify({
    silver: st.player.silver, gold: st.player.gold, honor: st.player.honor || 0,
    stack: st.bag.stack, wuji: st.wuji, wujiTry: (st.daily && st.daily.c.wujiTry) || 0,
    battles: st.stats.battles, wins: st.stats.wins,
    heroes: st.heroes.map(function (h) { return [h.id, h.lv, h.exp]; })
  });
}
function restore(S, save) { var p = S.parse(save); S.state = p.state; }

console.log('[資格與前置檢查]');
var c = fresh(), M = c.MJ, G = M.G, S = M.S;
ok(!G.wujiSweep('w1', 5, 777).ok, '未達開放等級（主角 1 級）不能掃蕩');
strong(c);
ok(G.WUJI_SWEEP_MAX === 10, '掃蕩上限 10 場');
ok(!G.wujiCanSweep('w1') && !G.wujiCanSweep('w9'), '未全破前 canSweep 為假（不存在的境也為假）');
var r = G.wujiSweep('w1', 5, 777);
ok(!r.ok && r.msg.indexOf('通關後開放掃蕩') >= 0, '未全破的境拒絕掃蕩，訊息「通關後開放掃蕩」');
ok(S.state.wuji.clears === 0 && ((S.state.daily && S.state.daily.c.wujiTry) || 0) === 0, '被拒絕的掃蕩不計次、不發獎（無副作用）');
ok(!G.wujiSweep('w9', 5, 777).ok, '不存在的境不能掃蕩');
r = G.wujiRun('w1', 99);
ok(r.ok && r.full && G.wujiCanSweep('w1'), '手動全破 w1 後開放掃蕩');
ok(!G.wujiCanSweep('w2') && !G.wujiSweep('w2', 3, 777).ok, '資格逐境獨立：只全破 w1 不能掃蕩 w2');
var saveQ = S.exportText(); // 已全破 w1 的基準存檔（clears=1、wujiTry=1）

console.log('[場數夾限 1–10]');
restore(S, saveQ);
r = G.wujiSweep('w1', 25, 777);
ok(r.ok && r.fought === 10 && r.fullCount === 10, '要求 25 場夾限為 10 場');
restore(S, saveQ);
r = G.wujiSweep('w1', 0, 777);
ok(r.ok && r.fought === 1, '要求 0 場夾限為 1 場');
restore(S, saveQ);
r = G.wujiSweep('w1', -3, 888);
ok(r.ok && r.fought === 1, '要求負數場夾限為 1 場');

console.log('[十場等價：掃蕩 == 手動逐場（同種子）]');
restore(S, saveQ);
var manualCleared = [], i, mr;
for (i = 0; i < 10; i++) { mr = G.wujiRun('w1', (777 + i * 1000003) >>> 0); manualCleared.push(mr.cleared); }
var snapA = snap(S);
restore(S, saveQ);
var sw = G.wujiSweep('w1', 10, 777), snapB = snap(S);
ok(sw.ok && sw.fought === 10 && sw.fullCount === 10, '掃蕩 10 場全破');
ok(JSON.stringify(sw.runs.map(function (x) { return x.cleared; })) === JSON.stringify(manualCleared), '逐場到達波次與手動逐場相同（' + manualCleared.join('/') + '）');
ok(snapA === snapB, '最終狀態逐欄相同：銀幣／金幣／榮譽／背包／wuji 紀錄／wujiTry／戰鬥統計／武將等級經驗');
ok(S.state.wuji.clears === 11, '全破次數 1（資格場）＋10（掃蕩）＝11');
ok(G.daily().c.wujiTry === 11, '歷練任務 wujiTry 計數與手動 11 場等價');
ok(sw.souls === 80, '十場將魂共 80（每場 8）');
ok(sw.totals.some(function (x) { return x.indexOf('銀幣 ×') === 0; }) && sw.totals.some(function (x) { return x === '全隊經驗 +' + sw.exp; }), '總獲得含銀幣加總與全隊經驗加總');
ok(sw.totals.filter(function (x) { return x.indexOf('將魂 ×') > 0; }).length >= 1, '總獲得含將魂品項加總');

console.log('[首場未全破即停：只發該場份]');
restore(S, saveQ);
G.teamList().forEach(function (x) { x.hero.lv = 12; x.hero.star = 0; }); // 降級到必敗隊伍
var silver0 = S.state.player.silver;
var swF = G.wujiSweep('w1', 10, 1);
ok(swF.ok && swF.fought === 1 && swF.fullCount === 0, '要求 10 場但首場未全破，只跑 1 場就停');
ok(swF.runs[0].cleared >= 1 && swF.runs[0].cleared < 40, '首場到達波次 ' + swF.runs[0].cleared + '（部分通過）');
ok(S.state.player.silver > silver0, '未全破場次已通過波次的獎勵照常發放（銀幣有入帳）');
var snapF = snap(S);
restore(S, saveQ);
G.teamList().forEach(function (x) { x.hero.lv = 12; x.hero.star = 0; });
var mrF = G.wujiRun('w1', 1);
ok(mrF.cleared === swF.runs[0].cleared && snap(S) === snapF, '掃蕩首場與手動同種子單場完全等價（波次與狀態逐欄相同）');
ok(S.state.wuji.clears === 1, '未全破不增加全破次數（仍為資格場的 1）');

console.log('[存檔相容]');
restore(S, saveQ);
G.wujiSweep('w1', 3, 777);
var save2 = S.exportText(), c2 = load(), p2 = c2.MJ.S.parse(save2);
ok(p2 && p2.state.wuji.clears === 4, '掃蕩後存檔可匯出再載入（clears=4 保留）');
ok(c2.MJ.S.VERSION === 12, '存檔版本維持 v12（零遷移）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
