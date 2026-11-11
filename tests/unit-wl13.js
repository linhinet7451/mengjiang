// WL-13：玩家實測修復輪 A＋B（#3/#13/#14/#20/#8/#11/#12＋#15/#16/#4/#18/#17/#10 驗證）。node tests/unit-wl13.js
// 引擎層測試：開局種子、訓練封頂、技能書升級、洗煉放棄退石、「最強」武器嚴格版、考證表 319／D 153、格圖玩家語言。
// UI 層（#3 全站掃描、#4 選將選技能流程、#11 結算星星、UI.AUTO_DELAY）見 tests/e2e.js。
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh(type) { var c = load(); c.MJ.G.newGame('測試', type || '力耐', 'm', 1); return c; }
function seq(arr) { var i = 0; return function () { return arr[i++ % arr.length]; }; }

console.log('[開局種子 #20／存檔版本]');
var c = fresh(), M = c.MJ, G = M.G, R = M.R, S = M.S, D = M.D, l = G.lead();
ok(S.VERSION === 12, '存檔版本仍為 v12');
ok(S.state.bag.stack.seed_yin === 1, '新存檔開局送搖錢樹苗 seed_yin ×1');
ok(S.state.bag.stack.seed_yin === 1 && Object.keys(S.state.bag.stack).filter(function (k) { return k.indexOf('seed_') === 0; }).length === 1, '開局只有 1 種種子（不重複送）');

console.log('[格圖玩家語言 #3]');
ok(D.heroes.patterns.shape === '特殊格圖', 'patterns.shape 為「特殊格圖」（非原版格圖）');
ok(D.heroes.patterns.single === '單體', 'patterns.single 為「單體」（玩家語言）');
ok(Object.keys(D.heroes.patterns).every(function (k) { return !/[A-Za-z]/.test(D.heroes.patterns[k]); }), '格圖表全部值皆為玩家語言（無英文字串外洩）');

console.log('[訓練封頂 #16]');
S.state.player.silver = 1e7;
var cand = S.state.recruit.cands[0]; G.recruit(cand);
var h = S.state.heroes[S.state.heroes.length - 1];
l.lv = 6; h.lv = 6; h.exp = R.expNeed(6) - 1;
ok(G.trainAbsorbable(h) === 0, '武將 Lv6＝主角 Lv6 且本級經驗已滿時可吸收為 0');
var silv = S.state.player.silver;
ok(!G.trainNow(h.uid).ok && S.state.player.silver === silv, '封頂時訓練擋下且不扣銀');
h.exp = 0;
ok(G.trainAbsorbable(h) === R.expNeed(6) - 1, '經驗為 0 時可吸收＝本級尚缺（expNeed-1）');
var cost = G.trainCost(h);
var r = G.trainNow(h.uid);
ok(r.ok && S.state.player.silver === silv - cost, '未滿時訓練正常扣銀並給經驗');
ok(G.trainAbsorbable(l) === Infinity, '主角未滿級時可吸收視為無上限（Infinity）');
l.lv = R.maxLevel;
ok(G.trainAbsorbable(l) === 0 && !G.trainNow(l.uid).ok, '主角滿級時可吸收為 0 且訓練擋下');

console.log('[技能書升級 #4]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; l = G.lead();
S.state.player.silver = 1e7;
l.lv = 20; G.addItem('jinengshu', 100);
var books0 = S.state.bag.stack.jinengshu, lv0 = R.skillLv(l, 'a');
r = G.skillUp(l.uid, 'a');
ok(r.ok && R.skillLv(l, 'a') === lv0 + 1 && S.state.bag.stack.jinengshu === books0 - lv0, '技能書升級：技能 +1 級、扣書＝原等級數');
delete S.state.bag.stack.jinengshu; silv = S.state.player.silver;
ok(!G.skillUp(l.uid, 'a').ok && S.state.player.silver === silv, '技能書不足時升級失敗且不扣銀');
ok(G.skillUpCost(l, 'a') && G.skillUpCost(l, 'a').items.jinengshu === R.skillLv(l, 'a'), 'skillUpCost 費用＝當前等級本數');

console.log('[洗煉放棄退石 #15]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; l = G.lead();
S.state.player.silver = 1e7;
S.state.buildings.shenbing = 10;
var e = G.addEquip('wp1', 2) || S.state.bag.equips[S.state.bag.equips.length - 1];
var uid = e.uid;
G.addItem('xilianshi', 3);
r = G.wash(uid, seq([0.1, 0.5, 0.7]));
ok(r.ok && e.washPending && S.state.bag.stack.xilianshi === 2, '洗煉擲骰：扣石 ×1、產生待確認結果');
var silvAfterWash = S.state.player.silver;
r = G.washCancel(uid);
ok(r.ok && !e.washPending && S.state.bag.stack.xilianshi === 3 && S.state.player.silver === silvAfterWash, '放棄退石：洗煉石 2→3、銀幣不退還、待確認結果清除');
ok(!G.washCancel(uid).ok, '沒有待確認結果時放棄失敗（不重複退石）');
G.wash(uid, seq([0.1, 0.5, 0.7]));
ok(S.state.bag.stack.xilianshi === 2, '再洗一次扣石 ×1');
r = G.washAccept(uid);
ok(r.ok && e.aff.length && !e.washPending && S.state.bag.stack.xilianshi === 2, '保留結果：不退石，屬性寫入');

console.log('[「最強」武器嚴格版 #18]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; l = G.lead();
l.lv = 20;
S.state.bag.equips.length = 0; // 清掉開局附贈的 wp1／ar1，包裹只留法攻杖
var staff = G.addEquip('wm1', 2); // 桃木杖：只有 matk
ok(R.derived(l, S.state).dtype === 'p', '主角（力耐）dtype 為物攻');
r = G.autoEquip(l.uid);
ok(r.ok && !l.eq.weapon, '包裹只有法攻杖時嚴格版：物攻武將不裝異屬性武器（留空）');
var sword = G.addEquip('wp1', 2); // 有 patk 的武器
l.eq.weapon = null; S.state.bag.equips.push(staff); // 杖放回包裹，兩把武器都在包裹
r = G.autoEquip(l.uid);
ok(r.ok && l.eq.weapon && R.equipTpl(l.eq.weapon.t).stats.patk, '有物攻武器時仍優先選符合 dtype 的武器');
// 回歸：已穿符合武器時，高評分異屬性武器不得搶走它（評分合計三攻，同檔同分、高檔更高分，
// 異屬性武器對此武將的實戰傷害毫無幫助；舊寫法只看包裹有無符合武器，已穿的符合武器不算，
// 模擬 30 天因此由 87/117 掉到 67/117、超時 1→824 場）
var staffHi = G.addEquip('wm12', 2); // Lv12 法攻杖，評分高於 Lv1 劍
ok(R.equipScore(staffHi) > R.equipScore(l.eq.weapon), 'Lv12 杖評分高於已穿的 Lv1 劍（前置條件）');
r = G.autoEquip(l.uid);
ok(r.ok && l.eq.weapon && l.eq.weapon.t === 'wp1' && S.state.bag.equips.indexOf(staffHi) >= 0, '已穿物攻劍時，高評分法攻杖不得取代（保留符合 dtype 的武器）');
// 已穿異屬性武器、包裹有符合武器時，符合者直接取代（不拿異屬性評分當門檻：同檔評分相同會卡住）
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; l = G.lead();
l.lv = 20; S.state.bag.equips.length = 0;
var staffPre = G.addEquip('wm1', 2); l.eq.weapon = staffPre; S.state.bag.equips.splice(S.state.bag.equips.indexOf(staffPre), 1);
ok(l.eq.weapon && l.eq.weapon.t === 'wm1', '前置：直接穿上異屬性法攻杖');
G.addEquip('wp1', 2);
r = G.autoEquip(l.uid);
ok(r.ok && l.eq.weapon && l.eq.weapon.t === 'wp1', '包裹出現物攻劍時直接取代異屬性杖（同分也不卡住）');

console.log('[考證表 #3／WL-13]');
var prov = M.D.provenance;
ok(prov.entries.length === 319, '考證表共 319 條（313＋6）');
ok(prov.entries.filter(function (x) { return x.grade === 'D'; }).length === 153, 'D 級共 153 條（147＋6）');
['ui.skillBookUse', 'train.capAbsorbable', 'wuji.autoDelay10', 'autoEquip.dtype', 'farm.startSeed', 'wash.cancelRefund'].forEach(function (id) {
  ok(!!prov.entries.filter(function (x) { return x.id === id; })[0], '考證含 WL-13 條目 ' + id);
});
var wc = prov.entries.filter(function (x) { return x.id === 'wash.cancelRefund'; })[0];
ok(wc && wc.grade === 'D', 'wash.cancelRefund 為 D 級');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
if (fail) process.exit(1);
