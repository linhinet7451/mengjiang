/* P1/P2：戰前預覽、戰鬥明細、養成比較、圖鑑來源與原版玩法入口 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  function statLine(d) { return '物攻 ' + d.patk + '　法攻 ' + d.matk + '　絕攻 ' + d.jatk + '<br>物防 ' + d.pdef + '　法防 ' + d.mdef + '　絕防 ' + d.jdef + '<br>生命 ' + d.hp + '　命中 ' + (d.hit || 0).toFixed(2) + '　暴擊 ' + (d.crit || 0).toFixed(2); }
  UI.modals.heroCompare = function () {
    var s = MJ.S.state, h = G.hero(UI.sel.hallUid) || G.lead(), now = R.derived(h, s), next = U.extend({}, h); next.lv = h.lv + 1;
    var nd = R.derived(next, s), a = R.skillOf(h, 'a'), na = R.skillOf(next, 'a');
    var body = '<div class="compare-grid"><div class="compare-card"><b>目前 Lv' + h.lv + '</b><p>' + statLine(now) + '</p><small>主動：' + U.esc(a.name) + '　Lv' + a.lv + '<br>範圍：' + U.esc(a.pattern) + '　倍率：' + Math.round(a.mult * 100) + '%</small></div><div class="compare-card next"><b>升級後 Lv' + next.lv + '</b><p>' + statLine(nd) + '</p><small>主動：' + U.esc(na.name) + '　Lv' + na.lv + '<br>範圍：' + U.esc(na.pattern) + '　倍率：' + Math.round(na.mult * 100) + '%</small></div></div><div class="prov-note">此預覽只計算等級成長，不扣除資源、不改變存檔；技能等級不能超過武將等級。</div>';
    return UI.panel('升級前後比較', body, { cls: 'narrow' });
  };
  UI.modals.originalModes = function () {
    var p = G.p2ModeState ? G.p2ModeState() : { guild: { lv: 1, contrib: 0 }, copper: { claimed: false }, exorcism: { clears: 0 } };
    var modes = [
      ['guild','公會','單機替代：捐獻銀幣累積幫貢與公會等級','guildDonate','捐獻 1,000 銀幣'],
      ['league','武林大會','使用拜訪武將排名賽作為單機競技','open','進入拜訪武將','arena'],
      ['hrd','華容道','奇遇內六關滑塊解謎','open','進入奇遇','qiyu'],
      ['copper','銅雀台','單機替代：每日領取一次掛機獎勵','copperClaim',p.copper.claimed ? '今日已領取' : '領取今日獎勵'],
      ['star','觀星台','奇遇內星運與經驗加成','open','進入奇遇','qiyu'],
      ['mystery','玄機盤','奇遇內轉盤、機率與保底','open','進入奇遇','qiyu'],
      ['exorcism','除魔殿','單機替代：消耗 5 精力進行除魔挑戰','exorcismFight','開始除魔']
    ];
    var h = '<div class="mode-note">已實作的離線替代會直接使用本作存檔與資源；公會／銅雀台／除魔殿不連接真人伺服器，原版線上排名與社交資料不會被虛構。</div><div class="mode-grid">';
    U.each(modes, function (m) { var stat = m[0] === 'guild' ? 'Lv' + p.guild.lv + '　幫貢 ' + p.guild.contrib : (m[0] === 'exorcism' ? '累計通關 ' + p.exorcism.clears : ''); h += '<div class="mode-card"><b>' + U.esc(m[1]) + '</b><small>' + U.esc(m[2]) + '</small><span class="dim2">' + U.esc(stat) + '</span>'; if (m[3] === 'open') h += '<a class="btn small" data-a="open" data-v="' + m[5] + '">' + U.esc(m[4]) + '</a>'; else h += '<a class="btn small' + (m[0] === 'copper' && p.copper.claimed ? ' disabled' : '') + '" data-a="' + m[3] + '">' + U.esc(m[4]) + '</a>'; h += '</div>'; });
    return UI.panel('原版玩法中心', h + '</div>', { cls: 'wide' });
  };
  UI.actions.openOriginalModes = function () { UI.open('originalModes'); };
  UI.actions.guildDonate = function () { var r = G.guildDonate(); if (UI.res(r, r.ok ? '捐獻成功，' + r.reward : '')) UI.renderModal(); };
  UI.actions.copperClaim = function () { var r = G.copperClaim(); if (UI.res(r, r.ok ? '銅雀台獎勵已領取' : '')) { UI.renderModal(); if (r.got) UI.rewardBox('銅雀台', r.got); } };
  UI.actions.exorcismFight = function () { var r = G.exorcismFight(); if (UI.res(r, r.ok ? '除魔完成，累計 ' + r.clears + ' 次' : '')) { UI.renderModal(); if (r.got) UI.rewardBox('除魔殿', r.got); } };
  UI.openP1Detail = function () { UI.open('heroCompare'); };
})();
