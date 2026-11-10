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
    // WL-6 隨機敵方組合：精英／王關／隱藏關的面板顯示本次抽出的組合（與實戰同一顆待用種子）；普通關為原組合
    var foes = G.stageFoes(id);
    var leader = U.find(foes, function (x) { return x.unit.boss; }) || foes[0];
    var b = '<div class="stage-pop"><div class="sp-l"><div class="egrid3">';
    for (var r = 0; r < 3; r++) for (var c = 2; c >= 0; c--) {
      var cell = r * 3 + c, en = U.find(foes, function (x) { return x.cell === cell; });
      if (en) { b += '<div class="eg' + (en.unit.boss ? ' boss' : '') + '">' + MJ.Art.portrait(en.unit.look, en.unit.boss ? 4 : 1, { enemy: true }) + '<span>' + en.unit.lv + '</span></div>'; }
      else b += '<div class="eg none"></div>';
    }
    b += '</div><div class="note">敵方站位（右側為前排）</div></div><div class="sp-r">';
    b += '<div class="row"><b>' + U.esc(leader.unit.name) + '</b>　等級 ' + leader.unit.lv + '</div>';
    // WL-4 首領詞綴（D 級原創）：王關／隱藏關才有；戰前顯示，開戰用的就是同一顆種子，顯示與實戰一致
    var affix = G.stageAffix(id);
    if (affix) b += '<div class="row affix">首領詞綴：<b>' + U.esc(affix.name) + '</b>（' + U.esc(affix.desc) + '）</div>';
    // WL-6 隨機敵方組合（D 級原創）：精英／王關／隱藏關的小兵每場重抽，上面站位圖就是本次抽出的組合
    if (sg.kind === 'elite' || sg.kind === 'boss' || sg.kind === 'hidden') {
      var counts = {};
      U.each(foes, function (f) { if (!f.unit.boss) counts[f.unit.name] = (counts[f.unit.name] || 0) + 1; });
      var parts = [];
      U.each(U.keys(counts), function (k) { parts.push(k + '×' + counts[k]); });
      b += '<div class="row rand">敵方組合：隨機（本次小兵：' + parts.join('、') + '）</div>';
    }
    // WL-6 增援波次（D 級原創）：王關／隱藏關才有；首領血量首次低於 50% 時觸發一次
    if (sg.kind === 'boss' || sg.kind === 'hidden') b += '<div class="row reinf">增援：首領血量首次低於 50% 時，2 名同章小兵加入戰場（滿編時待命，空出格子即補進）</div>';
    b += '<div class="row">類型：' + KIND[sg.kind] + '關　敵人 ' + sg.enemies.length + ' 名</div>';
    b += '<div class="row">獎勵：經驗 ' + sg.exp + '／人　銀幣 ' + sg.silver + '</div>';
    b += '<div class="row">可能掉落：' + U.map(sg.drops, function (d) { return (d.item.indexOf('eq:') === 0 ? MJ.D.config.equipQualityNames[d.q] + '．' : '') + G.itemName(d.item) + '(' + Math.round(d.chance * 100) + '%)'; }).join('、') + '</div>';
    var f = sg.first, fl = [];
    if (f.gold) fl.push('金幣 ' + f.gold); if (f.silver) fl.push('銀幣 ' + f.silver); U.each(f.items || [], function (x) { fl.push((x.item.indexOf('eq:') === 0 ? MJ.D.config.equipQualityNames[x.q || 0] + '．' : '') + G.itemName(x.item) + '×' + (x.n || 1)); });
    b += '<div class="row">首通獎勵：' + (s.firstClaimed[id] ? '<s>' + fl.join('、') + '</s>（已領取）' : fl.join('、')) + '</div>';
    // WL-5 限回合挑戰（D 級原創）：只開放給已通關的關卡；戰前寫明規則與獎勵，進戰鬥用的就是同一組條件
    var chSt = G.challengeState(id);
    // WL-7 ×2 挑戰（D 級原創）：只開放給已通關的關卡；敵方攻防血 ×2、正常 36 回合，詞綴／增援／隨機組合照常疊加
    var dbSt = G.doubleState(id);
    if (ss.clears > 0) {
      b += '<div class="row chal"><b>限回合挑戰</b>：12 回合內打贏；失敗不影響通關紀錄與越戰越勇</div>';
      b += '<div class="row chal">挑戰獎勵：銀幣 ' + sg.silver + ' → ' + Math.floor(sg.silver * G.CHALLENGE.silverMult) + '（+50%）、首次挑戰成功金幣 +' + G.CHALLENGE.firstGold + (chSt.gold ? '（已領取）' : '') + '、無死亡多一次將魂掉落</div>';
      b += '<div class="row chal">挑戰狀態：' + (chSt.cleared ? '已完成挑戰' : '尚未完成挑戰') + '</div>';
      b += '<div class="row dbl"><b>×2 挑戰</b>：敵方攻擊／防禦／血量全部 ×2（36 回合，詞綴／增援／隨機組合照常疊加）；失敗不影響通關紀錄與越戰越勇</div>';
      b += '<div class="row dbl">挑戰獎勵：銀幣 ' + sg.silver + ' → ' + Math.floor(sg.silver * G.DOUBLE.silverMult) + '（+50%）、首次挑戰成功金幣 +' + G.DOUBLE.firstGold + (dbSt.gold ? '（已領取）' : '') + '、無死亡多一次將魂掉落</div>';
      b += '<div class="row dbl">挑戰狀態：' + (dbSt.cleared ? '已完成挑戰' : '尚未完成挑戰') + '</div>';
    }
    b += '<div class="row">最佳：' + ['未通關', '★', '★★', '★★★'][ss.stars] + '　通關次數 ' + ss.clears + '</div>';
    if (ss.fails) b += '<div class="row morale">越戰越勇：連敗 ' + ss.fails + ' 次，我方生命／攻擊 +' + Math.round(R.moraleBonus(ss.fails) * 100) + '%</div>';
    b += '<div class="note">星級：無陣亡 3 星、陣亡 1 人 2 星、其他 1 星（D）。</div>';
    var tp = '<div class="prebattle"><b>我方主動技範圍預覽</b><div class="prebattle-grid">';
    U.each(G.teamList(), function (tx) { var sk = R.skillOf(tx.hero, 'a'); tp += '<div class="prebattle-card"><b>' + U.esc(G.nameOf(tx.hero)) + ' Lv' + tx.hero.lv + '</b><small>' + U.esc(sk.name) + '．' + U.esc(sk.pattern || '') + '．倍率 ' + Math.round((sk.mult || 0) * 100) + '%</small>' + (UI.patternGrid ? UI.patternGrid(sk.pattern, 1, sk) : '') + '</div>'; });
    tp += '</div><small class="note">綠格為施放者，紅格為目前技能可命中的範圍；實際命中仍會受敵方站位與阻擋影響。</small></div>';
    b += tp + '<div class="btn-row"><a class="btn big red" data-a="startBattle" data-v="' + id + '">開始戰鬥</a>' + (ss.clears > 0 ? '<a class="btn big" data-a="startChallenge" data-v="' + id + '">限回合挑戰</a><a class="btn big" data-a="startDouble" data-v="' + id + '">×2 挑戰</a>' : '') + '</div></div></div>';
    return UI.panel('出戰．' + sg.name, b, { cls: 'narrow2' });
  };
})();
