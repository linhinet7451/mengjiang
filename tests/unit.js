// Node 單元測試（遊戲邏輯，不含畫面）：node tests/unit.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh() { var c = load(); c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }

console.log('[新遊戲]');
var c = fresh(), M = c.MJ, G = M.G, R = M.R, S = M.S;
ok(G.lead() && G.lead().lv === 1, '主角 Lv1');
ok(G.teamCount() >= 1 && G.inTeam(G.lead().uid) != null, '主角在陣中');
ok(!!c._store[S.KEY], '新遊戲後已自動存檔');

console.log('[升級數值]');
var l = G.lead(), d1 = R.derived(l, S.state);
G.addExp(l, 100000);
var d2 = R.derived(l, S.state);
ok(l.lv > 1 && d2.hp > d1.hp && d2.patk > d1.patk && d2.str > d1.str, '升級後生命/攻擊/力量上升（Lv' + l.lv + '）');
var c6 = fresh(), l6 = c6.MJ.G.lead(); l6.lv = 6; var d6 = c6.MJ.R.derived(l6, c6.MJ.S.state);
ok(d6.str === 26 && d6.int === 14 && d6.agi === 11 && d6.con === 24 && d6.hp === 558 && d6.patk === 135, 'Lv6 力耐主角數值與 A 級截圖一致（26/14/11/24，生命558，物攻135）');

console.log('[招募]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S;
S.state.player.silver = 1e7;
var cand = S.state.recruit.cands[0];
var before = S.state.heroes.length, silver = S.state.player.silver;
var r = G.recruit(cand);
ok(r.ok && S.state.heroes.length === before + 1, '招募成功，武將數 +1（' + R.heroDef(cand).name + '）');
ok(S.state.player.silver === silver - G.recruitCost(cand), '扣除正確銀幣');
ok(!G.recruit(cand).ok, '不可重複招募同一武將');
S.state.player.silver = 0;
var c2 = S.state.recruit.cands[0];
if (c2) ok(!G.recruit(c2).ok, '銀幣不足時招募失敗');

console.log('[上陣/下陣]');
var h = r.hero;
var other = G.teamList().filter(function (x) { return x.hero.id !== 'lead'; })[0];
ok(!G.addToTeam(h.uid).ok, '出戰人數已滿時不能再加入（上限 ' + R.teamSlots(G.lead().lv) + '）');
ok(G.removeFromTeam(other.hero.uid).ok, '先移出一名隊員');
var a = G.addToTeam(h.uid);
ok(a.ok && G.inTeam(h.uid) != null, '加入出戰');
ok(G.removeFromTeam(h.uid).ok && G.inTeam(h.uid) == null, '移出出戰');
ok(!G.removeFromTeam(G.lead().uid).ok, '主角不可移出');

console.log('[裝備]');
var e = G.addEquip(M.D.equipment.list[0].id, 1);
var lead = G.lead(), slot = R.equipTpl(e.t).slot, dB = R.derived(lead, S.state);
var er = G.equip(lead.uid, e.uid);
ok(er.ok && lead.eq[slot] && lead.eq[slot].uid === e.uid, '穿上裝備');
var dE = R.derived(lead, S.state);
ok(R.power(lead, S.state) > R.power(G.lead(), S.state) - 1 && JSON.stringify(dE) !== JSON.stringify(dB), '裝備改變數值');
ok(G.unequip(lead.uid, slot).ok && !lead.eq[slot] && S.state.bag.equips.some(function (x) { return x.uid === e.uid; }), '卸下裝備回到包裹');
ok(JSON.stringify(R.derived(lead, S.state)) === JSON.stringify(dB), '卸下後數值還原');

console.log('[戰鬥 勝利]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
var sil0 = S.state.player.silver, en0 = S.state.player.energy;
var f = G.fight('s1_1', 12345);
ok(f.ok !== false && f.win === true, '1-1 勝利');
ok(S.state.player.silver > sil0 && f.energyCost === 0 && S.state.player.energy === en0, '勝利有獎勵、不消耗精力（P2：精力已取消）');
ok(S.state.stages.s1_1 && S.state.stages.s1_1.clears === 1, '紀錄通關');
ok(G.stageUnlocked('s1_2'), '解鎖下一關 1-2');
ok(!G.stageUnlocked('s1_3'), '1-3 仍未解鎖');
ok(JSON.parse(c._store[S.KEY]).data.stages.s1_1.clears === 1, '獎勵已在播放前存檔');

console.log('[戰鬥 失敗]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
var last = M.D.stages.stages[M.D.stages.stages.length - 1].id;
S.state.stages = {}; M.D.stages.stages.forEach(function (s) { S.state.stages[s.id] = { stars: 3, clears: 1 }; });
S.state.player.lv = 99; G.lead().lv = 1; S.state.player.energy = 999;
var stTarget = M.D.stages.stages.filter(function (s) { return G.stageUnlocked(s.id); }).pop();
var sil1 = S.state.player.silver, en1 = S.state.player.energy, bag1 = JSON.stringify(S.state.bag), exp1 = G.lead().exp, cl1 = S.state.stages[stTarget.id].clears;
var fl = G.fight(stTarget.id, 999);
ok(fl.ok !== false && fl.win === false, 'Lv1 打最後一關「' + stTarget.name + '」戰敗');
ok(S.state.player.silver === sil1 && JSON.stringify(S.state.bag) === bag1 && G.lead().exp === exp1 && S.state.stages[stTarget.id].clears === cl1, '戰敗無任何獎勵/經驗/通關紀錄');
ok(S.state.player.energy === en1, '戰敗不扣任何資源');

console.log('[戰鬥規則]');
var deadActs = 0, totalFights = 0, maxRound = 0, orderOk = true;
for (var seed = 1; seed <= 40; seed++) {
  var cc = fresh(); cc.MJ.S.state.player.energy = 999;
  var res = cc.MJ.G.fight('s1_1', seed * 7919); totalFights++;
  var dead = {}, evs = res.battle.events;
  evs.forEach(function (ev) {
    if (ev.t === 'dead') dead[ev.to] = 1;
    if (ev.t === 'revive') delete dead[ev.to];
    if ((ev.t === 'act' && !ev.counter) && dead[ev.u]) deadActs++;
    if (ev.t === 'round') maxRound = Math.max(maxRound, ev.n);
  });
}
ok(deadActs === 0, '陣亡武將不會出手（' + totalFights + ' 場）');
ok(maxRound <= 36, '回合不超過 36');
var t = M.Battle.run(G.buildTeam(), G.buildEnemy(M.D.stageIndex.s1_1), { seed: 3, maxRounds: 1 });
ok(t.win === false && t.timeout === true, '回合用盡判定進攻方失敗');

console.log('[存檔 匯出/匯入]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
S.state.player.silver = 4321; S.save(true);
var txt = S.exportText();
var c3 = load(); var p = c3.MJ.S.parse(txt);
ok(p.ok && p.state.player.silver === 4321 && p.state.player.name === '測試', '匯出文字可匯入並還原');
ok(!c3.MJ.S.parse('{bad json').ok, '拒絕非 JSON');
ok(!c3.MJ.S.parse('{"app":"other","data":{}}').ok, '拒絕非本遊戲存檔');
var broken = JSON.parse(txt); delete broken.data.heroes; ok(!c3.MJ.S.parse(JSON.stringify(broken)).ok, '拒絕缺欄位的存檔');
c._store[S.KEY] = '壞掉的存檔'; var lb = S.load();
ok(lb.ok && lb.fromBackup, '主存檔損壞時自動改讀備份');
S.reset(); ok(!c._store[S.KEY] && !c._store[S.BACKUP_KEY], '重置刪除主存檔與備份');

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
