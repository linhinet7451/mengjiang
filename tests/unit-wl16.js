// WL-16：小叮噹／皮卡丘強化移植（以 Tomas 2026-11-12 上傳建置 20261112-1144 為準）＋專屬被動 百寶袋／靜電＋一鍵卸裝＋神兵坊篩選。node tests/unit-wl16.js
// 數值來源：1144 建置語意 diff（非 wl16-design 規劃案：百寶袋回復採 20% 非規劃 15%；叮噹走 growth 路線；皮卡丘成長 int 3.24／agi 3.25）。
var load = require('./harness.js');
var fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh(type) { var c = load(); c.MJ.G.newGame('測試', type || '力耐', 'm', 1); return c; }

console.log('[武將數據（1144 建置原值）]');
var c = fresh(), M = c.MJ, G = M.G, R = M.R, S = M.S, D = M.D, U = M.U;
var dora = R.heroDef('doraemon'), pika = R.heroDef('pikachu');
ok(dora.growth.int === 3.42 && dora.growth.con === 3.03 && dora.base.int === 15 && dora.base.con === 15, '小叮噹成長 int 3.42／con 3.03，base 不變 15／15');
ok(pika.growth.int === 3.24 && pika.growth.agi === 3.25 && pika.base.int === 13 && pika.base.agi === 12, '皮卡丘成長 int 3.24／agi 3.25，base 不變 13／12');
ok(dora.active.mult === 1.8 && dora.active.fx && dora.active.fx.armorBreak === 0.5, '空氣砲 ×1.8＋破防 0.5');
ok(dora.ult.mult === 2.2 && dora.ult.flat === 200 && dora.ult.fx && dora.ult.fx.stun === 0.3, '任意門 ×2.2／200＋眩暈 0.3');
ok(pika.active.mult === 2 && pika.ult.mult === 2.4 && pika.ult.flat === 200, '電光一閃 ×2.0／十萬伏特 ×2.4／200');
ok(dora.passive === 'dabaodai' && pika.passive === 'jingdian', '被動改專屬：百寶袋／靜電');
ok(D.heroes.passives.dabaodai && D.heroes.passives.dabaodai.name === '百寶袋' && D.heroes.passives.dabaodai.grade === 'D（本作專屬效果）', '被動表有百寶袋（D 專屬）');
ok(D.heroes.passives.jingdian && D.heroes.passives.jingdian.name === '靜電' && D.heroes.passives.jingdian.grade === 'D（本作專屬效果）', '被動表有靜電（D 專屬）');
ok(G.PASSIVE_IDS.indexOf('dabaodai') >= 0 && G.PASSIVE_IDS.indexOf('jingdian') >= 0, 'G.PASSIVE_IDS 含 dabaodai／jingdian（sys7）');

console.log('[面板：Lv90／5 星／技能 10／裸裝]');
function mkHero(id) { var h = G.newHero(id, S.state); h.lv = 90; h.star = 5; h.sk = { a: 10, u: 10, p: 10 }; return h; }
var rows = D.heroes.list.map(function (def) { var h = mkHero(def.id); return { id: def.id, power: R.power(h, S.state), d: R.derived(h, S.state) }; });
rows.sort(function (a, b) { return b.power - a.power; });
console.log('  面板前 3：' + rows.slice(0, 3).map(function (r) { return r.id + ' ' + r.power; }).join('、'));
ok(rows[0].id === 'doraemon' && rows[0].power === 9506, '小叮噹面板戰力第 1（9506）');
ok(rows[1].id === 'pikachu' && rows[1].power === 9181, '皮卡丘面板戰力第 2（9181）');
ok(rows[2].power === 8445 && rows[0].power > rows[2].power * 1.1, '第 3 名 8445，叮噹高出 >10%（凌駕）');
var dd = R.derived(mkHero('doraemon'), S.state), dp = R.derived(mkHero('pikachu'), S.state);
ok(dd.hp === 10390, '小叮噹生命 10390');
ok(dp.agi === 488 && rows.every(function (r) { return r.id === 'pikachu' || r.d.agi < 488; }), '皮卡丘敏捷 488，全武將第一');
ok(dp.crit === 12, '皮卡丘暴擊 12（靜電 R.derived）');
ok(dp.hp === 6730, '皮卡丘生命 6730（玻璃大砲）');
var ud = R.heroUnit(mkHero('doraemon'), S.state), up = R.heroUnit(mkHero('pikachu'), S.state);
ok(Math.round(ud.active.mult * 1000) === 3197 && Math.round(ud.ult.mult * 1000) === 3907 && ud.ult.flat === 380, '小叮噹神級倍率：空氣砲 ×3.197／任意門 ×3.907＋380');
ok(Math.round(up.active.mult * 1000) === 3552 && Math.round(up.ult.mult * 1000) === 4262 && up.ult.flat === 380, '皮卡丘神級倍率：電光一閃 ×3.552／十萬伏特 ×4.262＋380（全遊戲最高無雙）');
ok(ud.active.fx && ud.active.fx.armorBreak === 0.5 && ud.ult.fx && ud.ult.fx.stun === 0.3, '小叮噹戰鬥單位 fx 帶入：破防／眩暈');

console.log('[敵方模板：s14_8／s15_8 同步新數值＋fx 傳遞]');
var enD = D.stages.enemies.doraemon, enP = D.stages.enemies.pikachu;
ok(enD.actMult === 1.8 && enD.ultMult === 2.2 && enD.passive === 'dabaodai' && enD.actFx && enD.actFx.armorBreak === 0.5 && enD.ultFx && enD.ultFx.stun === 0.3, '敵方小叮噹模板：×1.8／×2.2／百寶袋／actFx／ultFx');
ok(enP.actMult === 2 && enP.ultMult === 2.4 && enP.passive === 'jingdian' && enP.ultFx === null, '敵方皮卡丘模板：×2.0／×2.4／靜電');
var sg148 = M.D.stageIndex['s14_8'], sg158 = M.D.stageIndex['s15_8'];
var uD = R.enemyUnit({ e: 'doraemon', cell: 4, lv: 91 }, sg148), uP = R.enemyUnit({ e: 'pikachu', cell: 4, lv: 91 }, sg158);
ok(uD.active.fx && uD.active.fx.armorBreak === 0.5 && uD.ult.fx && uD.ult.fx.stun === 0.3, 'R.enemyUnit 傳遞 actFx／ultFx 到戰鬥單位');
ok(uP.active.fx === null && uP.ult.fx === null, 'R.enemyUnit 無 fx 模板傳 null（既有行為不變）');

console.log('[百寶袋：三效果實際觸發（60 種子）]');
var B = M.Battle;
function mk(n, o) { var u = { name: n, hp: 1e5, patk: 300, matk: 300, pdef: 50, mdef: 50, jdef: 50, agi: 10, lv: 50, phys: false, dtype: 'm', hit: 200, crit: 0, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 11, boss: false, layers: 1 }; for (var k in (o || {})) u[k] = o[k]; return u; }
var cnt = { heal: 0, stun: 0, def: 0 }, healAmtOk = 0, healToAlly = 0, foeStun = 0;
for (var sd = 1; sd <= 60; sd++) {
  var r = B.run([{ cell: 0, unit: mk('叮噹', { passive: 'dabaodai', agi: 30 }) }, { cell: 1, unit: mk('隊友', { hp: 10000, curHp: 1000, agi: 5 }) }], [{ cell: 3, unit: mk('敵', { hp: 1e6, patk: 50, agi: 1 }) }], { seed: sd, maxRounds: 6, levelSuppression: 10 });
  r.events.forEach(function (e) {
    if (e.t === 'text' && e.s === '百寶袋・補給') cnt.heal++;
    if (e.t === 'text' && e.s === '百寶袋・任意門') cnt.stun++;
    if (e.t === 'text' && e.s === '百寶袋・防禦+15%') cnt.def++;
    if (e.t === 'heal' && e.why === '百寶袋') { if (e.amt === 2000) healAmtOk++; if (e.to === 'A1') healToAlly++; }
    if (e.t === 'status' && e.s === '眩暈' && e.to === 'B3') foeStun++;
  });
}
console.log('  三分支計數（60 種子）：補給 ' + cnt.heal + '、任意門 ' + cnt.stun + '、防禦 ' + cnt.def);
ok(cnt.heal > 0 && cnt.stun > 0 && cnt.def > 0, '百寶袋三效果都實際觸發');
ok(healAmtOk > 0 && healAmtOk === cnt.heal && healToAlly === cnt.heal, '補給量恆＝最傷隊友最大生命 20%（10000×0.2＝2000），且補到 A1 隊友');
ok(foeStun > 0 && foeStun === cnt.stun, '任意門分支使敵人眩暈（status 眩暈 → B3）');
var cnt0 = 0;
for (var sd0 = 1; sd0 <= 20; sd0++) {
  var r0 = B.run([{ cell: 0, unit: mk('甲', { agi: 30 }) }], [{ cell: 3, unit: mk('敵', { hp: 1e6, patk: 50, agi: 1 }) }], { seed: sd0, maxRounds: 6, levelSuppression: 10 });
  cnt0 += r0.events.filter(function (e) { return e.t === 'text' && String(e.s).indexOf('百寶袋') === 0; }).length;
}
ok(cnt0 === 0, '對照組（無百寶袋被動）不觸發任何百寶袋效果');

console.log('[靜電：麻痺觸發（60 種子）]');
var hits = 0, stuns = 0, skips = 0;
for (var sd3 = 1; sd3 <= 60; sd3++) {
  var r3 = B.run([{ cell: 3, unit: mk('攻', { agi: 20, patk: 400 }) }], [{ cell: 3, unit: mk('皮', { passive: 'jingdian', hp: 1e6, agi: 1, patk: 10 }) }], { seed: sd3, maxRounds: 6, levelSuppression: 10 });
  hits += r3.events.filter(function (e) { return e.t === 'hit' && e.from === 'A3' && !e.miss; }).length;
  stuns += r3.events.filter(function (e) { return e.t === 'status' && e.s === '麻痺' && e.to === 'A3'; }).length;
  skips += r3.events.filter(function (e) { return e.t === 'skip' && e.u === 'A3'; }).length;
}
console.log('  命中 ' + hits + ' 次、麻痺 ' + stuns + ' 次（' + (hits ? (stuns / hits * 100).toFixed(1) : '0') + '%）、攻擊者跳過行動 ' + skips + ' 次');
ok(stuns > 30 && stuns / hits > 0.15 && stuns / hits < 0.35, '靜電麻痺觸發率落在 25% 合理帶（15%～35%）');
ok(skips > 0, '麻痺使攻擊者實際跳過行動（skip 事件）');
var stun0 = 0;
for (var sd4 = 1; sd4 <= 20; sd4++) {
  var r4 = B.run([{ cell: 3, unit: mk('攻', { agi: 20, patk: 400 }) }], [{ cell: 3, unit: mk('守', { hp: 1e6, agi: 1, patk: 10 }) }], { seed: sd4, maxRounds: 6, levelSuppression: 10 });
  stun0 += r4.events.filter(function (e) { return e.t === 'status' && e.s === '麻痺'; }).length;
}
ok(stun0 === 0, '對照組（無靜電）不觸發麻痺');

console.log('[一鍵卸裝 G.unequipAll]');
var c2 = fresh(), G2 = c2.MJ.G, S2 = c2.MJ.S;
var h1 = G2.newHero('guanyu', S2.state); S2.state.heroes.push(h1);
h1.eq.weapon = { uid: 501, t: 'wp1', q: 0, plus: 0, aff: [], gems: [] };
h1.eq.helm = { uid: 502, t: 'hm1', q: 0, plus: 0, aff: [], gems: [] };
h1.eq.armor = { uid: 503, t: 'ar1', q: 0, plus: 0, aff: [], gems: [] };
var bagBefore = S2.state.bag.equips.length;
var ru = G2.unequipAll(h1.uid);
ok(ru.ok && ru.changed === 3, '卸裝成功：changed＝3');
ok(!h1.eq.weapon && !h1.eq.helm && !h1.eq.armor && S2.state.bag.equips.length === bagBefore + 3, '3 件裝備全數回到包裹、身上清空');
var h2 = G2.newHero('zhangfei', S2.state); S2.state.heroes.push(h2);
ok(!G2.unequipAll(h2.uid).ok, '沒穿裝備時回失敗');
h1.eq.weapon = { uid: 504, t: 'wp1', q: 0, plus: 0, aff: [], gems: [] };
h1.eq.helm = { uid: 505, t: 'hm1', q: 0, plus: 0, aff: [], gems: [] };
h1.eq.armor = { uid: 506, t: 'ar1', q: 0, plus: 0, aff: [], gems: [] };
var capSave = G2.BAG_CAP; G2.BAG_CAP = G2.bagUsed() + 2; // 人為把上限壓到只剩 2 格（現行 BAG_CAP＝Infinity，此分支平時不觸發）
var ru2 = G2.unequipAll(h1.uid);
G2.BAG_CAP = capSave;
ok(!ru2.ok && !!h1.eq.weapon && !!h1.eq.helm && !!h1.eq.armor, '包裹空間不足時整批拒絕，裝備一件不動');
ok(!G2.unequipAll(999999).ok, '不存在的武將回失敗');

console.log('[神兵坊篩選（UI 層：ui.js＋ui-p2.js）]');
var c3 = load(), M3 = c3.MJ, G3 = M3.G, S3 = M3.S, R3 = M3.R;
G3.newGame('測試', '力耐', 'm', 1);
c3.MJ.UI = { sel: {}, page: {}, screens: {}, actions: {}, modals: {}, go: function () {}, render: function () {}, confirm: function () {}, toast: function () {} };
c3.MJ.Art = { portrait: function () { return '<i></i>'; }, icon: function () { return '<b></b>'; } };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui.js'), 'utf8'), c3, { filename: 'ui.js' });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-p2.js'), 'utf8'), c3, { filename: 'ui-p2.js' });
var UI3 = M3.UI;
ok(typeof UI3.screens.forge === 'function' && typeof UI3.actions.forgeQ === 'function' && typeof UI3.actions.forgeSlot === 'function' && typeof UI3.actions.forgeKind === 'function', 'forge 畫面與 forgeQ／forgeSlot／forgeKind 動作存在');
S3.state.heroes.forEach(function (h) { h.eq = {}; }); // 清掉開局預設裝備，只留測試fixtures
S3.state.bag.equips = [];
[['wp1', 0], ['wm6', 3], ['hm1', 2], ['ar1', 3]].forEach(function (d2, i) { S3.state.bag.equips.push({ uid: 900 + i, t: d2[0], q: d2[1], plus: 0, aff: [], gems: [] }); });
UI3.render = function () {};
function forgeCount() { var html = UI3.screens.forge(); return (html.match(/forgePick/g) || []).length; }
var forgeHtml = UI3.screens.forge();
ok(forgeHtml.indexOf('forge-filter-label') >= 0 && forgeHtml.indexOf('data-a="forgeQ"') >= 0 && forgeHtml.indexOf('data-a="forgeSlot"') >= 0 && forgeHtml.indexOf('data-a="forgeKind"') >= 0, 'forge 畫面有篩選列（品質／部位／武器類別）');
ok(forgeCount() === 4, '無篩選時列出全部 4 件');
UI3.actions.forgeQ('3'); ok(UI3.sel.forgeQ === 3 && forgeCount() === 2, '品質篩選 q3：剩 2 件（wm6／ar1）');
UI3.actions.forgeQ(''); UI3.actions.forgeSlot('weapon'); ok(forgeCount() === 2, '部位篩選 weapon：剩 2 件（wp1／wm6）');
UI3.actions.forgeKind('m'); ok(forgeCount() === 1, '武器類別篩選 法攻：剩 1 件（wm6）');
UI3.actions.forgeSlot(''); ok(UI3.sel.forgeKind === '' && forgeCount() === 4, '清除部位篩選同時清除武器類別，回到 4 件');

console.log('[考證＋存檔版本]');
var prov = M.D.provenance;
ok(prov.entries.length === 336, '考證共 336 條（334＋2）');
ok(prov.entries.filter(function (x) { return x.grade === 'D'; }).length === 170, 'D 級共 170 條（168＋2）');
['skill.dabaodai', 'skill.jingdian'].forEach(function (id) {
  var e = prov.entries.filter(function (x) { return x.id === id; })[0];
  ok(!!e && e.grade === 'D' && e.tentative === true && e.phase === 'WL-16' && e.label.indexOf('原版') < 0, '考證含 ' + id + '（D 級、WL-16、標籤不寫「原版」）');
});
ok(M.S.VERSION === 12, '存檔版本仍為 v12');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
