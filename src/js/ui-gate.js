/* 虛空之門：章節路線圖 → 3×3 關卡格（A：宣傳片）→ 出戰視窗 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  var NODE = [[150, 400], [370, 300], [590, 380], [800, 250]];
  var KIND = { normal: '普通', elite: '精英', boss: '王關', hidden: '隱藏' };
  UI.screens.gate = function () {
    var s = MJ.S.state, ch = UI.sel.gateCh;
    var h = '<div class="scr gate-scr"><div class="voidbg"></div>' + UI.hud();
    if (!ch) {
      h += '<div class="frame bigframe gate"><div class="plaque">虛空之門</div><a class="xbtn" data-a="city">×</a><div class="map">';
      h += '<svg class="art path" viewBox="0 0 900 480"><path d="M150 400 Q260 300 370 300 Q480 300 590 380 Q700 450 800 250" stroke="#f6e7c8" stroke-width="10" fill="none" stroke-dasharray="4 16" stroke-linecap="round"/></svg>';
      var curCh = 1; U.each(MJ.D.stages.chapters, function (c) { if (G.chapterUnlocked(c.id)) curCh = c.id; });
      var chs = MJ.D.stages.chapters, vols = Math.ceil(chs.length / 4);
      if (UI.sel.gateVol == null) UI.sel.gateVol = Math.floor((curCh - 1) / 4);
      var vol = Math.min(vols - 1, UI.sel.gateVol);
      U.each(chs.slice(vol * 4, vol * 4 + 4), function (c, i) {
        var open = G.chapterUnlocked(c.id), st3 = 0, cl = 0;
        U.each(MJ.D.stages.stages, function (x) { if (x.ch === c.id) { var ss = G.stageState(x.id); st3 += ss.stars; if (ss.clears) cl++; } });
        h += '<div class="cnode' + (open ? '' : ' locked') + '" style="left:' + (NODE[i][0] - 70) + 'px;top:' + (NODE[i][1] - 90) + 'px" data-a="' + (open ? 'gateCh' : 'info') + '" data-v="' + (open ? c.id : '第' + c.id + '章「' + c.name + '」：需要主角等級 ' + c.lv + '，並通關上一章王關') + '">' +
          (c.id === curCh ? '<div class="arrow" title="目前進度"></div>' : '') + '<div class="cn-orb" style="background:' + c.bg + '">' + (open ? '<span>' + c.id + '</span>' : '<span>鎖</span>') + '</div><div class="cn-name">' + U.esc(c.name) + '</div><div class="cn-sub">' + (open ? '★' + st3 + '/27　通關 ' + cl + '/9' : '需要 Lv' + c.lv) + '</div></div>';
      });
      if (vols > 1) h += '<div class="gate-vol">' + (vol > 0 ? '<a class="btn small" data-a="gateVol" data-v="' + (vol - 1) + '">◀ 上一卷</a>' : '') + '<b>第' + ['一', '二', '三'][vol] + '卷</b>' + (vol < vols - 1 ? '<a class="btn small" data-a="gateVol" data-v="' + (vol + 1) + '">下一卷 ▶</a>' : '') + '</div>';
      h += '</div><div class="gate-tip">挑戰關卡不消耗精力，可無限重複挑戰；首通獎勵只發一次，一般獎勵可重複取得。</div></div>';
    } else {
      var c = U.find(MJ.D.stages.chapters, function (x) { return x.id === ch; });
      h += '<div class="frame bigframe gate"><div class="plaque">第' + c.id + '章．' + U.esc(c.name) + '</div><a class="xbtn" data-a="gateBack">×</a>';
      h += '<div class="parch ch-desc">' + U.esc(c.desc) + '</div><div class="sgrid">';
      U.each(U.filter(MJ.D.stages.stages, function (x) { return x.ch === ch; }), function (sg) {
        var open = G.stageUnlocked(sg.id), ss = G.stageState(sg.id), stars = '';
        for (var i = 0; i < 3; i++) stars += '<i class="' + (i < ss.stars ? 'on' : '') + '">★</i>';
        var e = MJ.D.stages.enemies[U.find(sg.enemies, function (x) { return x.leader; }) ? U.find(sg.enemies, function (x) { return x.leader; }).e : sg.enemies[0].e];
        h += '<div class="snode k-' + sg.kind + (open ? '' : ' locked') + '" data-a="' + (open ? 'stagePop' : 'info') + '" data-v="' + (open ? sg.id : G.lockReason(sg.id)) + '">' +
          '<div class="sn-art">' + (open ? MJ.Art.portrait({ g: e.look[0], skin: e.look[1], hair: e.look[2], hs: e.look[3], beard: e.look[4], cloth: e.look[5], trim: e.look[6], wp: e.look[7], art: e.art }, sg.kind === 'normal' ? 1 : (sg.kind === 'elite' ? 3 : 4), { enemy: true }) : '<div class="lockart">？</div>') + '</div>' +
          '<div class="sn-name">' + U.esc(sg.name) + ' <small>' + ch + '-' + (sg.idx + 1) + '</small></div><div class="sn-kind">' + KIND[sg.kind] + '</div><div class="stars">' + stars + '</div></div>';
      });
      h += '</div></div>';
    }
    return h + '</div>';
  };
  UI.actions.gateCh = function (v) { UI.sel.gateCh = +v; UI.render(); };
  UI.actions.gateVol = function (v) { UI.sel.gateVol = +v; UI.render(); };
  UI.actions.gateBack = function () { UI.sel.gateCh = null; UI.render(); };
  UI.actions.stagePop = function (v) { UI.open('stage', v); };
  UI.modals.stage = function (id) {
    var sg = MJ.D.stageIndex[id], ss = G.stageState(id), s = MJ.S.state;
    var leader = U.find(sg.enemies, function (x) { return x.leader; }) || sg.enemies[0];
    var b = '<div class="stage-pop"><div class="sp-l"><div class="egrid3">';
    for (var r = 0; r < 3; r++) for (var c = 2; c >= 0; c--) {
      var cell = r * 3 + c, en = U.find(sg.enemies, function (x) { return x.cell === cell; });
      if (en) { var t = MJ.D.stages.enemies[en.e]; b += '<div class="eg' + (en.leader ? ' boss' : '') + '">' + MJ.Art.portrait({ g: t.look[0], skin: t.look[1], hair: t.look[2], hs: t.look[3], beard: t.look[4], cloth: t.look[5], trim: t.look[6], wp: t.look[7], art: t.art }, en.leader ? 4 : 1, { enemy: true }) + '<span>' + en.lv + '</span></div>'; }
      else b += '<div class="eg none"></div>';
    }
    b += '</div><div class="note">敵方站位（右側為前排）</div></div><div class="sp-r">';
    b += '<div class="row"><b>' + U.esc(MJ.D.stages.enemies[leader.e].name) + '</b>　等級 ' + leader.lv + '</div>';
    b += '<div class="row">類型：' + KIND[sg.kind] + '關　敵人 ' + sg.enemies.length + ' 名</div>';
    b += '<div class="row">獎勵：經驗 ' + sg.exp + '／人　銀幣 ' + sg.silver + '</div>';
    b += '<div class="row">可能掉落：' + U.map(sg.drops, function (d) { return (d.item.indexOf('eq:') === 0 ? MJ.D.config.equipQualityNames[d.q] + '．' : '') + G.itemName(d.item) + '(' + Math.round(d.chance * 100) + '%)'; }).join('、') + '</div>';
    var f = sg.first, fl = [];
    if (f.gold) fl.push('金幣 ' + f.gold); if (f.silver) fl.push('銀幣 ' + f.silver); U.each(f.items || [], function (x) { fl.push((x.item.indexOf('eq:') === 0 ? MJ.D.config.equipQualityNames[x.q || 0] + '．' : '') + G.itemName(x.item) + '×' + (x.n || 1)); });
    b += '<div class="row">首通獎勵：' + (s.firstClaimed[id] ? '<s>' + fl.join('、') + '</s>（已領取）' : fl.join('、')) + '</div>';
    b += '<div class="row">最佳：' + ['未通關', '★', '★★', '★★★'][ss.stars] + '　通關次數 ' + ss.clears + '</div>';
    if (ss.fails) b += '<div class="row morale">越戰越勇：連敗 ' + ss.fails + ' 次，我方生命／攻擊 +' + Math.round(R.moraleBonus(ss.fails) * 100) + '%</div>';
    b += '<div class="note">星級：無陣亡 3 星、陣亡 1 人 2 星、其他 1 星（D）。</div>';
    var tp = '<div class="prebattle"><b>我方主動技範圍預覽</b><div class="prebattle-grid">';
    U.each(G.teamList(), function (tx) { var sk = R.skillOf(tx.hero, 'a'); tp += '<div class="prebattle-card"><b>' + U.esc(G.nameOf(tx.hero)) + ' Lv' + tx.hero.lv + '</b><small>' + U.esc(sk.name) + '．' + U.esc(sk.pattern || '') + '．倍率 ' + Math.round((sk.mult || 0) * 100) + '%</small>' + (UI.patternGrid ? UI.patternGrid(sk.pattern, 1, sk) : '') + '</div>'; });
    tp += '</div><small class="note">綠格為施放者，紅格為目前技能可命中的範圍；實際命中仍會受敵方站位與阻擋影響。</small></div>';
    b += tp + '<div class="btn-row"><a class="btn big red" data-a="startBattle" data-v="' + id + '">開始戰鬥</a></div></div></div>';
    return UI.panel('出戰．' + sg.name, b, { cls: 'narrow2' });
  };
})();
