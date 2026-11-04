// pt12u 第 2 階段（P2）：取消精力、冷卻、每日上限與現實時間等待。node tests/unit-pt2.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c._t = T0; c.MJ.U.now = function () { return c._t; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c, M, G, S, r, i;

console.log('[招募：聚賢莊 每次付費、無冷卻、無每日上限]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
var costs = { normal: 0, baijin: 50, zijin: 200, zhizun: 500 };
Object.keys(costs).forEach(function (k) { ok(G.recruitStatus(k).cost === costs[k] && G.recruitStatus(k).cdLeft === 0 && G.recruitStatus(k).left === null, M.D.config.recruit[k].name + '：每次 ' + costs[k] + ' 金、無冷卻、無次數'); });
S.state.player.gold = 10000;
var g = S.state.player.gold, okAll = true;
for (i = 0; i < 30; i++) if (!G.refresh('normal').ok) okAll = false;
ok(okAll && S.state.player.gold === g, '普通刷新連續 30 次都成功且免費');
g = S.state.player.gold; okAll = true;
for (i = 0; i < 5; i++) if (!G.refresh('zhizun').ok) okAll = false;
ok(okAll && S.state.player.gold === g - 2500, '至尊刷新連續 5 次，每次扣 500 金（共 2500）');
S.state.player.gold = 199; r = G.refresh('zijin');
ok(!r.ok && S.state.player.gold === 199 && /200/.test(r.msg || r.error || JSON.stringify(r)), '金幣不足 200 時紫金刷新失敗，不扣金');
ok(S.state.recruit.cands && S.state.recruit.cands.length > 0, '刷新後有候選武將');
ok(M.D.config.recruit.baijin.cdMin != null, '原版冷卻資料保留在設定中（只做對照，不生效）');

console.log('[戰鬥：不消耗精力、可無限重試]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
S.state.player.energy = 0;
var allOk = true, wins = 0;
for (i = 0; i < 40; i++) { r = G.fight('s1_1', 100 + i); if (r.ok === false) allOk = false; if (r.win) wins++; }
ok(allOk && S.state.player.energy === 0, '精力 0 也能連打 40 場 1-1（精力欄位保留但不使用）');
ok(wins === 40 && S.state.stages.s1_1.clears === 40, '40 場都勝利並記錄通關');
var first = M.D.stageIndex.s1_1;
ok(typeof G.tick === 'function' && (G.tick(), S.state.player.energy === 0), 'G.tick 不再回復精力');

console.log('[歷練點（以勝場取代每日／現實時間）]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
ok(G.ticket('free').ready, '新存檔：免費禮物立即可領');
r = G.claimFreeGift(); ok(r.ok && !G.ticket('free').ready && G.ticket('free').left === G.TICKET.free, '領取後要再贏 ' + G.TICKET.free + ' 場');
c._t = T0 + 30 * 86400000; ok(!G.ticket('free').ready, '時間快轉 30 天也不會變可領（不看時間）');
for (i = 0; i < G.TICKET.free; i++) G.fight('s1_1', 300 + i);
ok(G.ticket('free').ready && G.claimFreeGift().ok, '再贏 ' + G.TICKET.free + ' 場後可再領');
var fail0 = S.state.stats.wins; M.D.stages.stages.forEach(function (x) { S.state.stages[x.id] = { stars: 3, clears: 1 }; });
S.state.player.lv = 99; G.lead().lv = 1;
var lastSt = M.D.stages.stages.filter(function (x) { return G.stageUnlocked(x.id); }).pop().id; r = G.fight(lastSt, 9);
ok(r.win === false && S.state.stats.wins === fail0 && !G.ticket('free').ready, '戰敗不增加勝場、不推進歷練點');

console.log('[訓練：立即完成、可重複]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
var L = G.lead(); S.state.player.silver = 100000;
var e0 = L.exp, lv0 = L.lv, sv0 = S.state.player.silver, cost = G.trainCost(L), want = G.TRAIN_MIN * G.trainRate(L);
r = G.trainNow(L.uid);
ok(r.ok && r.exp === want && S.state.player.silver === sv0 - cost, '立即訓練：+' + r.exp + ' 經驗，扣 ' + cost + ' 銀幣');
ok(L.lv > lv0 || L.exp > e0, '經驗立即入帳');
ok(G.trainNow(L.uid).ok && G.trainNow(L.uid).ok, '可連續訓練');
ok(!S.state.training && G.trainGain() === 0, '沒有掛機狀態、不會再累積離線經驗');
S.state.player.silver = 0; ok(!G.trainNow(L.uid).ok, '銀幣不足不能訓練');

console.log('[農田、塔俸、無極、競技場：無時間／次數限制]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
G.addItem('seed_yin', 5);
for (i = 0; i < 3; i++) G.plant(i, 'seed_yin');
var hv = 0; for (i = 0; i < 3; i++) if (G.harvest(i).ok) hv++;
ok(hv === 3, '種下 3 塊田立即全部收成');
ok(G.wujiLeft('w1') === Infinity, '無極幻境次數不限');
ok(G.arenaState().tries === G.ARENA_TRIES, '競技場顯示次數固定（不扣）');

console.log('[小銀袋（原精力湯）]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
G.addItem('jinglitang', 1); var s1 = S.state.player.silver;
r = G.useItem('jinglitang', G.lead().uid);
ok(r.ok && S.state.player.silver === s1 + 500, '小銀袋 = 銀幣 +500（D）');

console.log('[存檔 v4 → v5 遷移]');
var txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v4.json'), 'utf8');
c = load(); c._t = T0; c.MJ.U.now = function () { return c._t; }; M = c.MJ;
var p = M.S.parse(txt);
ok(p.ok && p.state.version === M.S.VERSION && p.state.migratedFrom === 4, 'v4 存檔可匯入並升到 v' + M.S.VERSION);
if (p.ok) {
  var st = p.state, ld = null; st.heroes.forEach(function (h) { if (h.id === 'lead') ld = h; });
  ok(JSON.stringify(st.recruit.cd) === '{}' && st.recruit.normalUsed === 0, '清除招募冷卻與每日次數');
  ok(st.training === null && (st.migrateNotes || []).some(function (x) { return /訓練結算：經驗 \+960/.test(x); }), '進行中的訓練（120 分鐘）結算成經驗 +960');
  ok(ld.lv >= 2, '主角等級保留或因結算提升（Lv' + ld.lv + '）');
  ok(JSON.stringify(st.sign.days) === '[1,2,3]' && st.sign.total === 3, '簽到日期 [3,5,9] 改成依序 3 次');
  ok(st.daily.round === 1 && st.tickets && typeof st.tickets === 'object', '補上歷練輪次與歷練點');
  ok(st.player.silver === 43280 && st.player.gold === 326 && st.player.energy === 37, '保留銀幣、金幣（精力欄位保留不用）');
  ok(st.stages.s1_1 && st.stages.s1_1.clears === 1, '保留通關紀錄');
  M.S.state = st;
  ok(M.G.fight('s1_2', 5).ok !== false && M.G.refresh('normal').ok, '遷移後可戰鬥、刷新');
  var again = load().MJ.S.parse(M.S.exportText());
  ok(again.ok && again.state.version === M.S.VERSION, '遷移後再匯出／匯入正常');
}

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
