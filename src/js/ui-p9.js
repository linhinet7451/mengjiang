/* 網路資料搜查-2 P2 介面：第二被動欄、連攜顯示、陣法新加成名稱、裝備部位「項鍊」 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  U.extend(UI.STAT_NAMES, { agi: '敏捷', atk: '攻擊', def: '防禦', npcCut: '受 NPC 傷害減少' });
  if (G.SLOT_NAMES) G.SLOT_NAMES.jade = '項鍊'; // 只改顯示名稱（存檔欄位仍為 jade）
  function pname(id) { var p = id && MJ.D.heroes.passives[id]; return p ? p.name : ''; }
  // 隊伍中成立的連攜
  G.lxPairs = function () {
    var list = G.teamList ? G.teamList() : [], ids = {}, out = [];
    U.each(list, function (x) { ids[x.hero.id] = 1; });
    U.each(list, function (x) { var d = R.heroDef(x.hero.id); if (d && d.partner && ids[d.partner]) out.push([x.hero.id, d.partner]); });
    return out;
  };
  UI.lxLine = function () {
    var p = G.lxPairs(), seen = {}, names = [];
    U.each(p, function (x) { var k = [x[0], x[1]].sort().join('|'); if (seen[k]) return; seen[k] = 1; names.push(R.heroDef(x[0]).name + (U.find(p, function (y) { return y[0] === x[1] && y[1] === x[0]; }) ? '⇄' : '→') + R.heroDef(x[1]).name); });
    return '<div class="lx-line">連攜：' + (names.length ? '<b>' + U.esc(names.join('、')) + '</b>（攻擊 +10%，無雙時夥伴 +20 無雙值；效果為本作設計 D）' : '目前沒有成立的連攜（夥伴同時上陣才成立）') + '</div>';
  };
  var skill1 = UI.hallTabs.skill;
  UI.hallTabs.skill = function (h0, s, def) {
    var html = skill1(h0, s, def);
    if (!def) return html;
    var p2 = def.passive2 && MJ.D.heroes.passives[def.passive2], pd = def.partner && R.heroDef(def.partner);
    var inT = pd && U.find(G.teamList ? G.teamList() : [], function (x) { return x.hero.id === def.partner; });
    var box = '<div class="skill3 p2-row"><div class="sk-lab">被<br>動</div><div class="pgrid none"></div><div class="sk-d">' +
      (p2 ? '<b>' + U.esc(p2.name) + '</b> <span class="sklv">第二被動</span><br>' + U.esc(p2.desc) : '<b>第二被動：無</b><br><small>原版資料只記一個被動</small>') +
      '<br><small>連攜：' + (pd ? U.esc(pd.name) + (inT ? '（已同時上陣，成立）' : '（夥伴同時上陣才成立）') : '無') + '</small></div></div>';
    return html + box;
  };
  UI.passiveNames = function (def) { return [pname(def.passive), pname(def.passive2)].filter(function (x) { return x; }).join('、'); };
})();
