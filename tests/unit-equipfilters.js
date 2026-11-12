// 裝備一鍵取下、神兵坊品質／武器類別篩選回歸測試
var load = require('./harness.js'), fs = require('fs');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, G = M.G, S = M.S;
G.newGame('裝備篩選', '力耐', 'm', 1);
var h = G.lead(), weaponIds = Object.keys(M.D.equipIndex).filter(function (id) { return M.R.equipTpl(id).slot === 'weapon'; });
var byKind = {};
weaponIds.forEach(function (id) { var t = M.R.equipTpl(id), k = t.id.charAt(1); if (byKind[k] == null) byKind[k] = id; });
['p', 'm', 'j'].forEach(function (k, i) { if (byKind[k]) G.addEquip(byKind[k], i + 1); });
ok(typeof G.unequipAll === 'function', '提供一鍵取下 API');
var slots = M.R.SLOTS, before = 0;
slots.forEach(function (slot, i) { var e = G.addEquip(weaponIds[0], 3); if (i < 3 && e) { h.eq[slot] = e; var ix = S.state.bag.equips.indexOf(e); if (ix >= 0) S.state.bag.equips.splice(ix, 1); before++; } });
var r = G.unequipAll(h.uid);
ok(r.ok && r.changed === before, '一次取下全部已穿戴裝備');
ok(slots.every(function (slot) { return !h.eq[slot]; }), '取下後所有裝備欄清空');
ok(!G.unequipAll(h.uid).ok, '沒有裝備時一鍵取下會提示失敗');
var hall = fs.readFileSync('src/js/ui-hall.js', 'utf8'), forge = fs.readFileSync('src/js/ui-p2.js', 'utf8');
ok(forge.indexOf("UI.qualityChips('forgeQ'") >= 0 && forge.indexOf('data-a="forgeKind"') >= 0 && forge.indexOf('UI.actions.forgeQ') >= 0, '神兵坊顯示品質與武器類別篩選');
ok(forge.indexOf("x.e.q === +fq") >= 0, '品質篩選依裝備 q 值');
ok(forge.indexOf("t.id.charAt(1) === fk") >= 0, '武器類別篩選依模板類別');
ok(hall.indexOf('data-a="unequipAll"') >= 0, '神武殿顯示全部取下按鈕');
console.log('結果：通過 ' + pass + '／失敗 ' + fail);
process.exit(fail ? 1 : 0);
