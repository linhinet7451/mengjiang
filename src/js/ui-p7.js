/* P4 介面：後天被動欄（技能分頁）、新屬性名稱、拜訪武將戰報版本 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  U.extend(UI.STAT_NAMES, { res: '狀態抵抗', dbf: '負面狀態施加機率', pvp: 'PVP傷害', pve: 'PVE傷害' });
  var skill0 = UI.hallTabs.skill;
  UI.hallTabs.skill = function (h0, s, def) {
    var html = skill0(h0, s, def), c = G.pbCfg(), P = MJ.D.heroes.passives;
    var box = '<div class="skill3 pb-row"><div class="sk-lab">習<br>得</div><div class="pgrid none"></div><div class="sk-d">';
    if (!G.pbOpen(h0)) box += '<b>後天被動欄</b><br><small>武將 ' + c.open + ' 級開放（D）</small>';
    else {
      var cur = h0.pb && P[h0.pb], pick = UI.sel.pbPick || '';
      box += cur ? '<b>' + cur.name + '</b> <span class="sklv">習得</span><br>' + U.esc(cur.desc) + '<br><small>習得被動效果固定 ×1.00（D）</small>' : '<b>未習得</b><br><small>可從 ' + G.pbChoices(h0.uid).length + ' 種被動中選 1 種</small>';
      box += '<div class="pb-list">' + U.map(G.pbChoices(h0.uid), function (id) {
        return '<a class="chip' + (id === h0.pb ? ' on' : '') + (id === pick ? ' sel' : '') + '" data-a="pbPick" data-v="' + id + '">' + P[id].name + '</a>';
      }).join('') + '</div>';
      if (pick && P[pick]) box += '<div class="pb-pick"><b>' + P[pick].name + '</b>：' + U.esc(P[pick].desc) + ' <small>（' + P[pick].grade + '）</small></div>';
      box += '<div class="sk-up"><small>' + U.fmt(c.silver) + ' 銀　技能書 ' + (s.bag.stack.jinengshu || 0) + '/' + c.jinengshu + '</small><a class="btn small' + (pick && pick !== h0.pb ? '' : ' off') + '" data-a="pbLearn">' + (h0.pb ? '替換' : '習得') + '</a></div>';
    }
    box += '</div></div>';
    var cut = html.lastIndexOf('<p class="note">');
    return (cut >= 0 ? html.slice(0, cut) + box + html.slice(cut) : html + box) + '<p class="note">被動名稱為 B（攻略），新被動的數值與習得消耗皆為 D（暫定）。</p>';
  };
  UI.actions.pbPick = function (v) { UI.sel.pbPick = v; UI.render(); };
  UI.actions.pbLearn = function () {
    var pid = UI.sel.pbPick; if (!pid) { UI.toast('請先選擇要習得的被動'); return; }
    var r = G.pbLearn(UI.sel.hallUid, pid);
    if (UI.res(r, '習得「' + MJ.D.heroes.passives[pid].name + '」')) { UI.sel.pbPick = ''; UI.render(); }
  };
})();
