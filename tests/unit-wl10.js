// WL-10：武器掉落一律 Lv1＋神兵坊升級裝備等級（D 級原創）。node tests/unit-wl10.js
// 目的：stages.json 全部裝備掉落引用為 Lv1（品質／機率不變）；神兵坊第 5 頁籤升級一次一檔，
// 費用 60×(目標等級+5)、成功率 100%、上限＝主角等級（穿戴中取穿戴者等級）、plus/q/gems/aff 保留；
// 通天塔首通藍裝亦 Lv1；商店／七日禮包不動；現有裝備 grandfathered；存檔 v12 不變。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh() { var c = load(); c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c = fresh(), M = c.MJ, G = M.G, R = M.R, U = M.U, D = M.D, S = M.S;

console.log('[掉落：stages.json 全部裝備掉落引用為 Lv1]');
var stages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'stages.json'), 'utf8')).stages;
var drops = [], firsts = [];
stages.forEach(function (st) {
  (st.drops || []).forEach(function (d) { if (String(d.item).indexOf('eq:') === 0) drops.push(d); });
  ((st.first || {}).items || []).forEach(function (it) { if (String(it.item).indexOf('eq:') === 0) firsts.push(it); });
});
ok(stages.length === 117 && drops.length === 234, '117 關、關卡掉落裝備共 234 條（WL-12 新章 27 關 ×2）');
ok(drops.every(function (d) { return /eq:[a-z]+1$/.test(d.item); }), '234 條關卡掉落模板等級全部為 Lv1');
var qc = { 0: 0, 1: 0, 2: 0, 3: 0 };
drops.forEach(function (d) { qc[d.q]++; });
ok(qc[0] === 65 && qc[1] === 91 && qc[2] === 52 && qc[3] === 26, '掉落品質分布（白 65／綠 91／藍 52／紫 26；WL-12 新章 54 條＋OD-5 ch9/ch10 王／隱藏 q1→q2、q2→q3）');
var s11 = stages.filter(function (x) { return x.id === 's1_1'; })[0];
ok(s11.drops[0].item === 'eq:wp1' && s11.drops[0].q === 0 && s11.drops[0].chance === 0.25 && s11.drops[1].item === 'eq:cp1' && s11.drops[1].q === 1 && s11.drops[1].chance === 0.08, 's1_1 掉落內容不變（wp1 白 25%＋cp1 綠 8%）');
var s108 = stages.filter(function (x) { return x.id === 's10_8'; })[0];
ok(s108.drops[0].item === 'eq:wj1' && s108.drops[0].q === 2 && s108.drops[0].chance === 0.5 && s108.drops[1].item === 'eq:ar1' && s108.drops[1].q === 3 && s108.drops[1].chance === 0.35, 's10_8 掉落內容（wj1 藍 50%＋ar1 紫 35%；WL-12 OD-5 同步修正與 ch1–8 一致，原綠 50%＋藍 20%）');
ok(firsts.length === 26 && firsts.every(function (it) { return /eq:[a-z]+1$/.test(it.item) && it.q === 2; }), '26 條首通獎勵藍裝亦全部改為 Lv1（品質 q2 不變；WL-12 新章精英首通 ＋6）');
ok(drops.every(function (d) { return R.equipTpl(d.item.slice(3)) != null; }), '全部掉落模板存在（Lv1 模板皆有）');

console.log('[R.nextEquipTier：下一檔查詢]');
ok(JSON.stringify(R.EQUIP_TIERS) === JSON.stringify([1, 6, 12, 18, 24, 30, 36, 42, 48, 54]), '檔次表 [1,6,12,18,24,30,36,42,48,54]');
ok(R.nextEquipTier('wp1') === 'wp6' && R.nextEquipTier('bt12') === 'bt18' && R.nextEquipTier('wj48') === 'wj54', '下一檔查詢（wp1→wp6、bt12→bt18、wj48→wj54）');
ok(R.nextEquipTier('bt54') == null && R.nextEquipTier('wp54') == null, 'Lv54 已是最高檔，無下一檔');
ok(R.nextEquipTier('nope') == null && R.nextEquipTier('bt99') == null, '未知模板／不在檔次表的模板回傳 null');

console.log('[G.upgradeCost：費用表]');
ok(G.upgradeCost({ t: 'bt1' }) === 660 && G.upgradeCost({ t: 'bt6' }) === 1020 && G.upgradeCost({ t: 'bt12' }) === 1380, '費用 Lv6 660／Lv12 1020／Lv18 1380（60×(目標等級+5)）');
ok(G.upgradeCost({ t: 'bt18' }) === 1740 && G.upgradeCost({ t: 'bt24' }) === 2100 && G.upgradeCost({ t: 'bt30' }) === 2460, '費用 Lv24 1740／Lv30 2100／Lv36 2460');
ok(G.upgradeCost({ t: 'bt36' }) === 2820 && G.upgradeCost({ t: 'bt42' }) === 3180 && G.upgradeCost({ t: 'bt48' }) === 3540, '費用 Lv42 2820／Lv48 3180／Lv54 3540');
ok(G.upgradeCost({ t: 'bt54' }) == null, '已滿級無升級費用');
var fullCost = 0, t = 'bt1';
while (t) { var cc = G.upgradeCost({ t: t }); if (cc == null) break; fullCost += cc; t = R.nextEquipTier(t); }
ok(fullCost === 18900, 'Lv1→54 全程每件 18,900 銀（全套 8 件 151,200）');

console.log('[G.upgradeEquip：升級流程與保留]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
G.lead().lv = 30; S.state.player.silver = 100000;
var e = G.addEquip('bt12', 3); e.plus = 5; e.aff = [{ k: 'hp', v: 100 }]; e.gems = ['gem_atk_1'];
var hpBefore = R.equipStats(e).hp, silBefore = S.state.player.silver;
var r = G.upgradeEquip(e.uid);
ok(r.ok && r.from === 'bt12' && r.to === 'bt18' && r.cost === 1380, 'bt12→bt18 成功，費用 1380');
ok(e.t === 'bt18' && e.plus === 5 && e.q === 3 && JSON.stringify(e.gems) === '["gem_atk_1"]' && e.aff.length === 1 && e.aff[0].v === 100, 'plus／品質／寶石／洗煉屬性全部保留，只改模板');
ok(S.state.player.silver === silBefore - 1380, '銀幣恰扣 1380');
ok(R.equipStats(e).hp > hpBefore, '升級後數值上升（hp ' + hpBefore + ' → ' + R.equipStats(e).hp + '）');
ok(R.equipTpl(e.t).name === '銀扣腰帶' && G.itemName('eq:bt18') === '銀扣腰帶', '名稱隨模板變（銅扣腰帶→銀扣腰帶），面板可預覽');
ok(e.uid != null && G.findEquip(e.uid).e === e, '升級不換 uid，鍛造選擇／穿戴關聯不斷');
r = G.upgradeEquip(e.uid);
ok(r.ok && r.to === 'bt24' && e.t === 'bt24', '連續升級 bt18→bt24');
G.lead().lv = 54; // 升到滿級需主角 54 級（上限＝主角等級）
while (G.upgradeEquip(e.uid).ok) { /* 升到滿 */ }
ok(e.t === 'bt54' && !G.upgradeEquip(e.uid).ok, '一路升到 bt54 後再升級失敗（已達最高等級）');
var eMax = G.addEquip('bt54', 3);
ok(!G.upgradeEquip(eMax.uid).ok, 'Lv54 裝備直接升級失敗');

console.log('[升級上限：主角等級／穿戴者等級]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
G.lead().lv = 10; S.state.player.silver = 100000;
var e2 = G.addEquip('bt6', 0);
ok(!G.upgradeEquip(e2.uid).ok && e2.t === 'bt6', '主角 10 級：bt6 升 bt12 被擋（目標 12 > 主角 10）');
G.lead().lv = 12;
ok(G.upgradeEquip(e2.uid).ok && e2.t === 'bt12', '主角升到 12 級後可升級');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
G.lead().lv = 30; S.state.player.silver = 100000;
var e3 = G.addEquip('bt12', 2);
ok(G.equip(G.lead().uid, e3.uid).ok, '主角 30 級穿上 bt12');
G.lead().lv = 12;
ok(!G.upgradeEquip(e3.uid).ok && e3.t === 'bt12', '穿戴中取穿戴者等級：主角降到 12 級後 bt12 升 bt18 被擋');
G.lead().lv = 18;
ok(G.upgradeEquip(e3.uid).ok && e3.t === 'bt18', '穿戴者升到 18 級後可升級（裝備留在身上）');

console.log('[升級失敗情況]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
G.lead().lv = 30; S.state.player.silver = 0;
var e4 = G.addEquip('bt1', 0);
ok(!G.upgradeEquip(e4.uid).ok && S.state.player.silver === 0 && e4.t === 'bt1', '銀幣不足：升級失敗、不扣錢、不改模板');
ok(!G.upgradeEquip(999999).ok, '找不到裝備失敗');
S.state.player.silver = 100000;
e4.washPending = [{ k: 'hp', v: 10 }];
ok(!G.upgradeEquip(e4.uid).ok && e4.t === 'bt1', '洗煉待確認時擋下升級');
delete e4.washPending;
ok(G.upgradeEquip(e4.uid).ok && e4.t === 'bt6', '處理完洗煉結果後可升級');

console.log('[通天塔首通藍裝 Lv1；碎片合成不動]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
[10, 30, 50, 70, 90].forEach(function (f) {
  var fl = G.towerFloor(f), eq = fl.first.items.filter(function (it) { return String(it.item).indexOf('eq:') === 0; });
  ok(eq.length === 1 && /eq:[a-z]+1$/.test(eq[0].item) && eq[0].q === 2, '通天塔第 ' + f + ' 層首通藍裝為 Lv1（' + (eq[0] && eq[0].item) + '）');
});
var fl20 = G.towerFloor(20);
ok(fl20.first.items.some(function (it) { return it.item === G.FRAG; }), '第 20 層仍給紫裝碎片（偶數層不動）');
G.lead().lv = 30;
ok(G.fragLv() === 30, '碎片合成等級仍＝主角等級（30 級→Lv30 檔，不動）');

console.log('[商店／七日禮包不動]');
var shopEq = D.shop.filter(function (x) { return String(x.item).indexOf('eq:') === 0; });
ok(shopEq.length === 18 && shopEq.every(function (x) { return x.q === 0 && /eq:[a-z]+(1|6|12)$/.test(x.item); }), '商店 18 件裝備商品不動（白裝 Lv1/6/12）');
ok(G.SEVEN[6].items[0].item === 'eq:wp6' && G.SEVEN[6].items[0].q === 3, '七日禮包第 7 天仍為 Lv6 紫武（一次性贈禮，不動）');

console.log('[現有裝備 grandfathered；存檔相容]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
var old = G.addEquip('bt54', 3); old.plus = 27; old.aff = [{ k: 'hp', v: 500 }]; old.gems = ['gem_atk_5'];
var statsBefore = JSON.stringify(R.equipStats(old));
ok(!G.upgradeEquip(old.uid).ok && JSON.stringify(R.equipStats(old)) === statsBefore && old.plus === 27, '舊 Lv54 +27 裝備不受影響（已滿級，數值不變）');
var old2 = G.addEquip('bt30', 2); old2.plus = 10;
var save = S.exportText();
var c2 = load(); var p = c2.MJ.S.parse(save); c2.MJ.S.state = p.state;
var back = c2.MJ.S.state.bag.equips.filter(function (x) { return x.uid === old2.uid; })[0];
ok(back && back.t === 'bt30' && back.plus === 10 && back.q === 2, '匯出匯入往返：舊裝備等級／強化／品質不變');
ok(M.S.VERSION === 12, '存檔版本仍為 v12（零遷移、零新欄位）');

console.log('[考證]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
ok(prov.entries.length === 324, '考證表共 324 條（319＋5）');
ok(prov.entries.filter(function (e) { return e.grade === 'D'; }).length === 158, 'D 級 158 條');
['mode.equipDropLv1', 'forge.upgradeLevel'].forEach(function (id) {
  var e5 = prov.entries.filter(function (x) { return x.id === id; })[0];
  ok(!!e5 && e5.grade === 'D' && e5.label.indexOf('原版') < 0 && e5.tentative === true, '考證條目 ' + id + ' 為 D 級／暫定／不標原版');
});
ok(M.D.provenance && M.D.provenance.entries.length === 324, 'data.generated.js 含最新考證表（324 條）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
if (fail) process.exit(1);
