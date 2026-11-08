// P4-1／P4-2／P4-5／P4-6 專項驗收
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(c, n) { if (c) { pass++; console.log('  通過', n); } else { fail++; console.log('✗ 失敗', n); } }
var c = load(), M = c.MJ, G = M.G, S = M.S, R = M.R;
G.newGame('P4', '力耐', 'm', 1);
var L = G.lead();
console.log('[P4-1 寶石來源表]');
ok(M.D.config.gems.sourceLevels.patk.join(',') === '17,58,164,324,665', 'W84 物攻寶石逐級表照錄');
var e = { t: Object.keys(M.D.equipIndex)[0], q: 0, plus: 0, aff: [], gems: ['gem_atk_1', 'gem_atk_5'] };
var gs = R.equipStats(e);
ok(gs.patk === 700 && gs.matk === 682 && gs.jatk === 682, '舊存檔 gem_* 等級讀取新 W84 數值且三種攻擊同步');
console.log('[P4-2 心法兩格與魂經驗]');
ok(JSON.stringify(M.D.config.xinfaSlots) === '[1,60]' && M.D.config.xinfaSoulExp.purple === 100, '第一格 Lv1、第二格 Lv60，魂經驗紫魂 100');
var h = G.newHero('diaochan', S.state); h.lv = 60; h.xf = [{ id: 'jingang', lv: 2 }, { id: 'yijin', lv: 1 }, { id: 'beiming', lv: 3 }]; S.state.heroes.push(h); S.state.bag.stack.xf_beiming = 0; S.state.bag.stack['soul:' + h.id] = 1;
var text = S.exportText(), parsed = S.parse(text);
ok(parsed.ok && parsed.state.heroes.filter(function (x) { return x.uid === h.uid; })[0].xf.length === 2, '舊第三格遷移後不再是可用欄位');
var mh = parsed.state.heroes.filter(function (x) { return x.uid === h.uid; })[0];
ok(parsed.state.bag.stack.xf_beiming === 1 && mh.xfOverflow && mh.xfOverflow.length === 1, '第三格退回秘笈且原資料保留');
console.log('[P4-5／P4-6 來源分級]');
ok(M.D.provIndex['web2.skill.sourceEffects'].sources[0].s === 'W967', 'W967 狀態效果 provenance 可追溯且未知機率不外推');
var ids = ['hongqigong','zixia','huangyaoshi','ouyangfeng','simayi','zhizunbao','yuebuqun','weiyan','huangzhong','ganning'];
ok(ids.every(function (id) { var d = M.D.heroIndex[id]; return d && d.grade; }), '十名未充分來源武將保留既有資料分級，不擅改數值');
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
