/* 戰鬥畫面：重播 MJ.Battle 產生的事件（結果與獎勵在開戰前已計算並存檔） */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G;
  var BT = null; // 目前戰鬥播放狀態
  var ROWY = [206, 336, 466]; // art2：武將放大 1.25 倍，排距同步加大 // 第四階段：排距加大，名字與血條不再壓到上一排武將
  function pos(side, cell) {
    var r = Math.floor(cell / 3), c = cell % 3;
    var x = side === 'A' ? 395 - c * 108 - (2 - r) * 10 : 565 + c * 108 + (2 - r) * 10;
    return { x: x, y: ROWY[r] };
  }
  UI.battlePos = pos;
  // v10 大棋盤：3 列 × 8 格（我方 3＋中間 2＋敵方 3），格距 96px，畫面置中
  var BSTEP = 96;
  function bpos(r, bx) { return { x: Math.round(480 + (bx - 3.5) * BSTEP), y: ROWY[r] }; }
  UI.boardPos = bpos;
  // 單位目前位置（v10 用棋盤座標，舊戰報用各自的 3×3）
  function upos(x) { return x.bx != null ? bpos(x.br, x.bx) : pos(x.side, x.cell); }
  var MELEE_WP = { sword: 1, blade: 1, spear: 1, halberd: 1, dagger: 1, whip: 1, none: 1, staff: 0, fan: 0, qin: 0, bow: 0, needle: 0 };
  function isMelee(u) { return u.phys && MELEE_WP[u.look.wp] !== 0; }

  // 無雙演出開關（獨立於戰鬥速度 1x/2x/4x；預設開，見 state.js applyDefaults）
  UI.musouOn = function () { var st = MJ.S.state && MJ.S.state.settings; return !st || st.musou !== false; };

  // 全屏無雙特效（CSS/SVG，無圖片；D 級本作設計）。按無雙技名稱對應；
  // WL-2 起三名武將無雙改用宣傳片 A 級名稱（貂蟬 千秋蓮舞、孫尚香 美人計、王語嫣 滅絕劍法），
  // 衝突 VID2-NAMES 已解決，見 provenance 與 docs/資料考證.md §18。
  var ULT_FX = { '義薄雲天': 'beam', '九陰白骨爪': 'claw', '滅絕劍法': 'ice', '千秋蓮舞': 'petal', '美人計': 'petal', '神鬼亂舞': 'dragon', '雷霆震怒': 'stomp' };
  function ultFx(skill) {
    if (!UI.musouOn() || (UI.lowFx && UI.lowFx())) return;
    var fx = el('fx'); if (!fx) return;
    var kind = ULT_FX[skill] || 'flash';
    var d = document.createElement('div');
    d.className = 'ultfx ' + kind;
    if (kind === 'dragon') d.innerHTML = '<svg viewBox="0 0 960 600"><path d="M60 500 C200 420 160 300 300 260 C400 230 440 300 540 240 C640 180 680 260 780 200 C850 160 900 220 930 180 L950 200 C890 300 830 280 770 340 C690 420 650 360 550 420 C450 480 430 540 310 540 C210 540 120 560 60 500 Z" fill="#141414"/><circle cx="830" cy="210" r="9" fill="#fff"/><path d="M690 330 q40 -30 80 0 M710 370 q40 -30 80 0" stroke="#141414" stroke-width="6" fill="none"/></svg>';
    else if (kind === 'beam') d.innerHTML = '<div class="uf-planet"></div><div class="uf-beam"></div>';
    else if (kind === 'claw') d.innerHTML = '<svg viewBox="0 0 960 600"><path d="M180 80 L700 520 M320 60 L840 500 M460 40 L900 420" stroke="#e02020" stroke-width="26" stroke-linecap="round" opacity=".85"/></svg>';
    else if (kind === 'ice') d.innerHTML = '<div class="uf-ice"></div>';
    else if (kind === 'petal') d.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
    else if (kind === 'stomp') d.innerHTML = '<div class="uf-foot"></div>';
    fx.appendChild(d);
    if (kind === 'stomp') shake(true);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1300);
  }
  UI._ultFx = ultFx;

  // 攻擊動作動畫（D 級原創；原版攻擊動作無法考察，自行合理製作）
  // 對應表：揮刀＝物理近戰（力型，刀劍槍戟匕鞭：弧形刀光＋前衝＋回位）；
  // 出拳＝物理徒手（wp none，如梅超風：拳影＋衝擊波）；氣功＝法術／絕技（dtype m/j：聚氣光球＋發射波）。
  // 全身動作版（2026-11-09，實機測試回饋：舊版只有小光效、人物不動、看不出在打）：
  // 人物是單張點陣圖（art.js A.figure 回傳 <img>，手臂與武器畫死在圖裡），無法只轉動手臂；
  // 因此用整體位移＋傾斜做出動作：蓄力後仰 → 前衝 → 轉身揮砍 → 回位；受擊方後仰閃白。
  // 時長約 380ms 基準（揮刀 500ms，讓刀光蓋到命中瞬間），隨戰鬥速度（1x/2x/4x）等比縮短；
  // 省電模式不加新光效與頓停（只保留既有前衝位移）；與無雙演出開關獨立（關閉無雙演出時普通攻擊動畫照常）。
  // 每個行動只觸發一次，不影響傷害與回合邏輯。命中頓停（hit-stop）只延後傷害顯示約 60ms（1x），不改傷害數值。
  var ATK_SPEC = { slash: 200, fist: 160, wave: 120, dur: 380, slashDur: 500, hitstop: 60 };
  UI._atkSpec = ATK_SPEC;
  UI._atkDur = function (sp) { return Math.round(ATK_SPEC.dur / (sp || 1)); };
  UI._hitstopMs = function (sp) { return Math.round(ATK_SPEC.hitstop / (sp || 1)); };
  // 攻擊方向：朝目標的 x 方向（+1 向右／-1 向左）；沒有目標時依陣營（A 向右、B 向左）
  UI._atkDir = function (me, tgt) {
    if (me && tgt) { var a = upos(me), b = upos(tgt); if (b.x !== a.x) return b.x > a.x ? 1 : -1; }
    return me && me.side === 'B' ? -1 : 1;
  };
  function attackKind(u) {
    if (!u) return 'slash';
    if (u.dtype === 'm' || u.dtype === 'j') return 'wave';
    if (!u.look || !u.look.wp || u.look.wp === 'none') return 'fist';
    return 'slash';
  }
  UI._attackKind = attackKind;
  // 命中閃光（目標處；全屏震動只保留給暴擊／無雙——每擊都震會讓整個舞台（含跳過按鈕）一直位移，
  // WebKit 上曾導致 bSkip 點擊 30s 等不到穩定而逾時；目標的翻身（kbA/kbB）已是該處的小震動）
  function impactFlash(p, when) {
    if (UI.lowFx && UI.lowFx()) return;
    setTimeout(function () {
      var fx = el('fx'); if (!fx || !BT || BT.done) return;
      var f = document.createElement('div'); f.className = 'hitflash';
      f.style.left = (p.x - 60) + 'px'; f.style.top = (p.y - 120) + 'px';
      fx.appendChild(f);
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 260);
    }, when);
  }
  // 非近戰全身動作：蓄力後仰 → 向目標前推 → 回位（step() 的 windup/lunge 只處理近戰）
  // 結束時一定清除 inline transform 與 class；棋盤位置（left/top）從不改動
  function bodyThrust(ue, kind, dir, impact) {
    if (!ue) return;
    var cls = kind === 'wave' ? 'atk-raise' : 'atk-thrust';
    ue.className = ue.className.replace(/ atk-(raise|thrust|hit|cast)/g, '') + ' ' + cls;
    setTimeout(function () {
      if (!ue.parentNode) return;
      ue.className = ue.className.replace(/ atk-(raise|thrust|hit|cast)/g, '') + (kind === 'wave' ? ' atk-cast' : ' atk-hit');
      var dx = dir * (kind === 'wave' ? 14 : 22);
      ue.style.webkitTransform = ue.style.transform = 'translate(' + dx + 'px,0)';
    }, T(140));
    setTimeout(function () {
      ue.style.webkitTransform = ue.style.transform = '';
      ue.className = ue.className.replace(/ atk-(raise|thrust|hit|cast)/g, '');
    }, impact + T(300));
  }
  function attackAnim(me, e) {
    if (!me || e.heal || (UI.lowFx && UI.lowFx())) return;
    var fx = el('fx'); if (!fx) return;
    var kind = attackKind(me.u), sp = BT ? BT.speed : 1, dur = UI._atkDur(sp);
    var a = upos(me), tgt = e.target && BT.units[e.target] ? BT.units[e.target] : null, b = tgt ? upos(tgt) : null;
    var dir = UI._atkDir(me, tgt), impact = T(e.ult ? 520 : 420), d;
    var ue = el('u' + e.u);
    var melee = isMelee(me.u) && e.pattern !== 'all' && !!tgt;
    // 非近戰 step() 不會前衝：這裡補全身動作（近戰由 step() 的 windup/lunge 處理，不重複）
    if (!melee && ue) bodyThrust(ue, kind, dir, impact);
    if (kind === 'slash') {
      // 200px 雙弧刀光（主弧＋殘影弧），置於出招者與目標之間，揮向目標方向
      var cx = b ? Math.round((a.x + b.x) / 2) : a.x, cy = b ? Math.round((a.y + b.y) / 2) : a.y;
      d = document.createElement('div'); d.className = 'atkfx slash';
      d.style.left = (cx - 100) + 'px'; d.style.top = (cy - 150) + 'px';
      d.innerHTML = '<svg viewBox="0 0 200 200"><path d="M22 162 A140 140 0 0 1 178 38 L154 56 A110 110 0 0 0 42 142 Z" fill="rgba(255,244,200,.98)"/><path d="M30 170 A132 132 0 0 1 170 50 L158 62 A112 112 0 0 0 44 152 Z" fill="rgba(255,190,60,.9)"/></svg>';
      // B 方揮向左：鏡像內層 svg（外層 div 不動，避免與旋轉動畫衝突）
      if (dir < 0) { var sv = d.getElementsByTagName('svg')[0]; if (sv) sv.style.webkitTransform = sv.style.transform = 'scaleX(-1)'; }
      d.style.webkitAnimationDuration = d.style.animationDuration = Math.round(ATK_SPEC.slashDur / sp) + 'ms';
      fx.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, T(ATK_SPEC.slashDur) + 160);
      impactFlash(b || a, impact);
    } else if (kind === 'fist') {
      // 拳影從出招者飛向目標，命中時在目標處爆開
      var fb = document.createElement('div'); fb.className = 'atkfx fistfly';
      fb.style.left = (a.x - 30) + 'px'; fb.style.top = (a.y - 120) + 'px';
      fx.appendChild(fb);
      var fdx = (b ? b.x : a.x) - a.x, fdy = (b ? b.y : a.y) - a.y;
      fb.style.webkitTransitionDuration = fb.style.transitionDuration = T(220) + 'ms';
      setTimeout(function () { fb.style.webkitTransform = fb.style.transform = 'translate(' + fdx + 'px,' + fdy + 'px)'; }, 30);
      setTimeout(function () {
        if (fb.parentNode) fb.parentNode.removeChild(fb);
        var bb = document.createElement('div'); bb.className = 'atkfx fistburst';
        var p = b || a; bb.style.left = (p.x - 80) + 'px'; bb.style.top = (p.y - 130) + 'px';
        fx.appendChild(bb);
        setTimeout(function () { if (bb.parentNode) bb.parentNode.removeChild(bb); }, T(320) + 120);
      }, T(240));
      impactFlash(b || a, impact);
    } else {
      // 氣功：聚氣光球加大加亮（投射光球由 step() 另行發射）
      d = document.createElement('div'); d.className = 'atkfx charge';
      d.style.left = (a.x - 60) + 'px'; d.style.top = (a.y - 130) + 'px';
      d.style.webkitAnimationDuration = d.style.animationDuration = dur + 'ms';
      fx.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, T(420) + 120);
      impactFlash(b || a, impact);
    }
  }

  // 無雙切入底部 6 枚技能牌：出招方全隊武將的無雙技名（CSS 直書籤，無圖片）
  function ciCards(side, actorName) {
    var list = side === 'A' ? BT.r.team : BT.r.foes;
    var sorted = list.slice().sort(function (a, b) { return a.cell - b.cell; });
    var h = '<div class="ci-cards">';
    U.each(sorted.slice(0, 6), function (x) {
      var u = x.unit, un = (u.ult && u.ult.name) || (u.active && u.active.name) || '';
      h += '<div class="ci-card' + (u.name === actorName ? ' on' : '') + '"><i>' + U.esc(u.name) + '</i><b>' + U.esc(un) + '</b></div>';
    });
    return h + '</div>';
  }

  // 戰場背景士兵剪影（D 純裝飾）：兩側各一排深色半透明剪影，在棋盤後方，不參與判定
  function armyHtml() {
    function soldier(x, y, w, flip) {
      return '<svg class="soldier' + (flip ? ' flip' : '') + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px" viewBox="0 0 40 80"><path d="M20 2 L27 10 L27 16 L13 16 L13 10 Z M13 18 L27 18 L29 46 L11 46 Z M13 46 L17 46 L16 78 L12 78 Z M23 46 L27 46 L28 78 L24 78 Z M33 4 L37 4 L31 78 L28 78 Z" fill="#14100a"/></svg>';
    }
    return '<div class="b-army" aria-hidden="true">' +
      soldier(52, 490, 34, false) + soldier(108, 505, 28, false) + soldier(158, 486, 36, false) + soldier(96, 528, 26, false) + soldier(152, 532, 30, false) +
      soldier(874, 490, 34, true) + soldier(824, 505, 28, true) + soldier(766, 486, 36, true) + soldier(838, 528, 26, true) + soldier(778, 532, 30, true) + '</div>';
  }

  // 底部資訊列：回合數＋雙方站位小格（綠＝我方／紅＝敵方）＋連擊數。
  // 連擊＝本回合內連續造成傷害的次數（雙方合計，每回合開始歸零；本作計數方式，D）。
  function updateInfo() {
    if (!BT) return;
    var rd = el('binfo-round'); if (rd) rd.innerHTML = '第' + (BT.round || 1) + '回合';
    var cb = el('binfo-combo'); if (cb) cb.innerHTML = '連擊 x' + (BT.combo || 0);
    var g = el('binfo-grid'); if (!g) return;
    var W = BT.bd ? BT.bd.cols : 3, h = '', r, c;
    for (r = 0; r < 3; r++) for (c = 0; c < W; c++) {
      var cls = '';
      U.each(U.keys(BT.units), function (k) {
        var x = BT.units[k]; if (x.hp <= 0) return;
        var br = BT.bd ? x.br : Math.floor(x.cell / 3), bx = BT.bd ? x.bx : (x.side === 'A' ? 2 - (x.cell % 3) : x.cell % 3);
        if (br === r && bx === c) cls = x.side === 'A' ? 'a' : 'b';
      });
      h += '<i class="' + cls + '"></i>';
    }
    g.innerHTML = h;
  }
  UI._bInfo = function () { updateInfo(); };

  function hpHtml(hp, max, layers) {
    if (layers > 1) {
      var per = max / layers, idx = Math.max(1, Math.ceil(hp / per)), w = hp <= 0 ? 0 : (hp - (idx - 1) * per) / per * 100;
      var cols = ['#3fd14a', '#f2c230', '#ff6a2a'];
      return '<div class="hp layered" style="background:' + (idx > 1 ? cols[(idx - 2) % 3] : '#3a1010') + '"><i style="width:' + w.toFixed(1) + '%;background:' + cols[(idx - 1) % 3] + '"></i><b>×' + idx + '</b></div>';
    }
    return '<div class="hp"><i style="width:' + (max ? U.clamp(hp / max * 100, 0, 100) : 0).toFixed(1) + '%"></i></div>';
  }
  UI.hpHtml = hpHtml;

  // 修正（陣法看不出來）：我方只有陣法開放的格子畫成「陣位」
  function tileBase(side, c) {
    if (side === 'X') { // v10：我方開場那 3 欄裡、陣法開放的格子畫成陣位
      var cols = BT && BT.bd ? BT.bd.cols : 8, r = Math.floor(c / cols), bx = c % cols, home = bx <= 2 ? r * 3 + (2 - bx) : -1;
      return 'tile bd' + (home >= 0 && BT && BT.open && BT.open.indexOf(home) >= 0 ? ' open' : '') + (bx === 3 || bx === 4 ? ' mid' : '');
    }
    return 'tile' + (side === 'A' && BT && BT.open && BT.open.indexOf(c) >= 0 ? ' open' : '');
  }
  function auraQ(u) { if (u.honorFrame === 'silver') return 0; var q = u.honorFrame === 'gold' || u.boss ? 4 : (u.quality || 0); return q >= 3 ? q : 0; }
  UI.screens.battle = function () {
    if (!BT) return '<div class="scr"></div>';
    var r = BT.r, h = '<div class="battle' + (BT.showGrid ? ' showgrid' : '') + (BT.done ? ' ended' + (r.win ? '' : ' lost') : '') + '" id="bt">' + MJ.Art.battlefield(r.stage.bg || (r.stage.ch ? MJ.D.stages.chapters[r.stage.ch - 1].bg : null), r.stage.id);
    h += armyHtml();
    // 格子（v10：一個大棋盤）
    if (BT.bd) {
      for (var bi = 0; bi < 3 * BT.bd.cols; bi++) { var bp = bpos(Math.floor(bi / BT.bd.cols), bi % BT.bd.cols); h += '<div class="' + tileBase('X', bi) + '" id="tX' + bi + '" style="left:' + (bp.x - 45) + 'px;top:' + (bp.y - 16) + 'px"></div>'; }
    } else U.each(['A', 'B'], function (side) {
      for (var c = 0; c < 9; c++) { var p = pos(side, c); h += '<div class="' + tileBase(side, c) + '" id="t' + side + c + '" style="left:' + (p.x - 50) + 'px;top:' + (p.y - 16) + 'px"></div>'; }
    });
    // 單位
    U.each(r.team.concat(r.foes), function (x, i) {
      var side = i < r.team.length ? 'A' : 'B', u = x.unit, key = side + x.cell, p = BT.units[key] ? upos(BT.units[key]) : pos(side, x.cell);
      var honorClass = u.honorFrame === 'gold' ? ' rank-boss' : (u.honorFrame === 'silver' ? ' rank-elite' : ''), honorTag = u.honorFrame === 'gold' ? '<em class="rank-tag gold">BOSS</em>' : (u.honorFrame === 'silver' ? '<em class="rank-tag silver">精英</em>' : '');
      // WL-4 首領詞綴：戰鬥中首領頭像旁顯示詞綴名（只會出現在王關／隱藏關首領身上）
      var affixTag = (u.affix && MJ.Battle.affixById(u.affix)) ? '<em class="affix-tag">' + U.esc(MJ.Battle.affixById(u.affix).name) + '</em>' : '';
      h += '<div class="bu side' + side + (u.boss ? ' boss' : '') + honorClass + '" data-honor-frame="' + U.esc(u.honorFrame || '') + '" id="u' + key + '" style="left:' + (p.x - 56) + 'px;top:' + (p.y - 130) + 'px;z-index:' + (10 + Math.floor(x.cell / 3)) + '">' +
        '<div class="bcirc' + (u.boss ? ' boss' : '') + honorClass + '"></div>' + (auraQ(u) ? '<div class="baura q' + auraQ(u) + '"></div>' : '') +
        '<div class="bhp" id="h' + key + '">' + hpHtml(u.curHp != null ? u.curHp : u.hp, u.hp, u.layers) + '</div>' +
        '<div class="bfig">' + MJ.Art.figure(u.look, { enemy: side === 'B', cape: u.boss }) + '</div>' +
        '<div class="bnm"><span>' + honorTag + affixTag + U.esc(u.name) + ' <small>Lv' + u.lv + '</small></span></div></div>';
    });
    // 影片 HUD：上方一條合併總生命條（左綠＝我方／右橙紅＝敵方），數字置中於條下方，金色端頭、火焰分隔
    h += '<div class="b-tot split"><div class="tb-wrap"><div class="tb tb-a"><i id="tbA" style="width:100%"></i></div><div class="tb-sep"></div><div class="tb tb-b"><i id="tbB" style="width:100%"></i></div></div><div class="tb-nums"><span id="ttA">我方</span><span class="tb-flame"></span><span id="ttB">敵方</span></div></div>';
    // art4：下方我方頭像列（原版戰鬥畫面下方的武將頭像，含生命／無雙條）
    h += '<div class="b-info" id="binfo"><span class="bi-round" id="binfo-round">第1回合</span><span class="bi-grid" id="binfo-grid"></span><span class="bi-combo" id="binfo-combo">連擊 x0</span></div>';
    h += '<div class="b-pbar" id="bpbar">' + U.map(r.team.slice().sort(function (a, b) { return a.cell - b.cell; }), function (x) {
      var u = x.unit, k = 'A' + x.cell, q = u.boss ? 4 : (u.quality || 0), hp = u.curHp != null ? u.curHp : u.hp, rg = U.clamp(u.curRage || 0, 0, 100);
      return '<div class="pb' + (hp <= 0 ? ' dead' : '') + (rg >= 100 ? ' full' : '') + ' q' + q + '" id="pb' + k + '"><div class="pb-art">' + MJ.Art.portrait(u.look, q) + '</div>' +
        '<div class="pb-bar hp"><i id="pbh' + k + '" style="width:' + (u.hp ? U.clamp(hp / u.hp * 100, 0, 100) : 0).toFixed(1) + '%"></i></div>' +
        '<div class="pb-bar rg"><i id="pbr' + k + '" style="width:' + rg + '%"></i></div></div>';
    }).join('') + '</div>';
    h += '<div class="fx" id="fx"></div>';
    h += '<div class="b-title">' + U.esc(r.stage.name) + '</div>';
    h += '<div class="b-round" id="bround">第1回合</div>';
    if (BT.bd) h += '<div class="b-rule">' + (BT.bd.v >= 12 ? '雙方每回合一直往前・走到底統一換到第一列排隊對打' : BT.bd.v >= 11 ? '雙方每回合一直往前・走到底回第一排後方排隊・不換列' : '每回合雙方前進一格・只能前後不能換列') + '</div>';
    h += '<div class="b-skill" id="bskill"></div>';
    h += '<div class="cutin" id="cutin"></div>';
    h += '<div class="b-bl"><a class="zhen' + (BT.showGrid ? ' on' : '') + '" data-a="bGrid">陣</a><div class="swords"><svg viewBox="0 0 40 40" class="art"><path d="M6 6 L30 30 M34 6 L10 30" stroke="#e0e0e0" stroke-width="4" stroke-linecap="round"/><path d="M26 26 L32 32 M14 26 L8 32" stroke="#c9a24a" stroke-width="6" stroke-linecap="round"/></svg><b id="bleft">x ' + MJ.D.config.maxRounds + '</b></div></div>';
    h += '<div class="b-br">' + (UI.muteBtn ? UI.muteBtn('big') : '') + '<a class="sbtn" id="bspeed" data-a="bSpeed">' + BT.speed + 'x</a><a class="sbtn" data-a="bSkip">跳過</a>' + ((r.mode === 'tower' || r.mode === 'wuji') ? '<a class="sbtn" data-a="bSkipAll">跳過全部</a>' : '') + '</div>';
    h += '<div class="b-tr"><a class="sbtn small" data-a="bLog">戰報</a><a class="sbtn small" data-a="bDetail">明細</a><a class="sbtn small" data-a="bFormula">公式</a></div>';
    h += '<div class="blog' + (BT.showLog ? ' on' : '') + '" id="blog">' + BT.logHtml + '</div>';
    if (BT.showDetail) { h += '<div class="bdetail"><b>事件明細（已播放 ' + BT.i + '/' + BT.ev.length + '）</b>'; U.each(BT.ev.slice(0, BT.i), function (ev, ix) { var line = evLog(ev); if (line) h += '<div><small>#' + (ix + 1) + '</small> ' + U.esc(line) + '</div>'; }); h += '</div>'; }
    h += '<div id="bresult"></div></div>';
    return h;
  };

  UI.startBattle = function (res) {
    if (UI.clearAuto) UI.clearAuto();
    if (BT && BT.timer) clearTimeout(BT.timer);
    var s = MJ.S.state;
    BT = { r: res, ev: res.battle.events, i: 0, speed: s.settings.speed || 1, units: {}, logHtml: '', showLog: false, showDetail: false, showGrid: false, done: false, round: 0, open: G.openCells ? G.openCells() : null, bd: res.battle.board || null };
    U.each(res.team, function (x) { BT.units['A' + x.cell] = { u: x.unit, hp: x.unit.curHp != null ? x.unit.curHp : x.unit.hp, max: x.unit.hp, side: 'A', cell: x.cell }; });
    U.each(res.foes, function (x) { BT.units['B' + x.cell] = { u: x.unit, hp: x.unit.hp, max: x.unit.hp, side: 'B', cell: x.cell }; });
    if (BT.bd) U.each(U.keys(BT.units), function (k) { var x = BT.units[k]; x.br = Math.floor(x.cell / 3); x.bx = MJ.Battle.homeBx(x.side, x.cell); });
    UI.modal = null;
    UI.go('battle');
    updateInfo();
    BT.timer = setTimeout(step, 400);
    totals();
  };
  UI.actions.startBattle = function (id) {
    var r = G.fight(id);
    if (!UI.res(r)) return;
    UI.startBattle(r);
  };
  function T(ms) { return ms / (BT ? BT.speed : 1); }
  function el(id) { return document.getElementById(id); }
  function nameOf(key) { var x = BT.units[key]; return x ? x.u.name : key; }
  function addLog(t, cls) { BT.logHtml = '<div class="' + (cls || '') + '">' + U.esc(t) + '</div>' + BT.logHtml; var l = el('blog'); if (l) l.innerHTML = BT.logHtml; }
  function floatText(key, text, cls, dy) {
    var x = BT.units[key]; if (!x) return;
    var p = upos(x), fx = el('fx'); if (!fx) return;
    var d = document.createElement('div');
    d.className = 'ftxt ' + (cls || '');
    // art3：飄字一律留在舞台內、不蓋到上方雙方總生命條（約 y<44）。最上排整疊往下移，保持「技能名 > 無雙+ > 暴擊 > 數字」的上下順序
    var FT_MIN = 82, shift = Math.max(0, FT_MIN - (p.y - 224));
    var lx = p.x - 60 + (Math.random() * 20 - 10); lx = Math.max(6, Math.min(960 - 166, lx));
    d.style.left = lx + 'px'; d.style.top = Math.min(600 - 70, p.y - 164 - (dy || 0) + shift) + 'px';
    d.innerHTML = text;
    fx.appendChild(d);
    // art4：最上排飄字會經過自己的名牌，飄字期間把名牌淡化，減少重疊
    var ue = shift > 0 ? el('u' + key) : null;
    if (ue) { x.ftN = (x.ftN || 0) + 1; if (ue.className.indexOf(' ftop') < 0) ue.className += ' ftop'; }
    setTimeout(function () {
      if (d.parentNode) d.parentNode.removeChild(d);
      if (ue) { x.ftN = Math.max(0, (x.ftN || 1) - 1); if (!x.ftN) ue.className = ue.className.replace(/ ftop/g, ''); }
    }, T(1100) + 200);
  }
  // 命中火花（CSS，低成本）
  function hitSpark(key, crit) {
    var x = BT.units[key], fx = el('fx'); if (!x || !fx) return;
    var p = upos(x), d = document.createElement('div');
    d.className = 'spark' + (crit ? ' crit' : ''); d.style.left = (p.x - 40) + 'px'; d.style.top = (p.y - 104) + 'px';
    fx.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 380);
  }
  // art2：依傷害類型的技能光效（物理＝刀光、法術＝法陣光環、絕技＝金色光柱）；省電模式只留簡單版
  function skillFx(key, dt, crit) {
    var x = BT.units[key], fx = el('fx'); if (!x || !fx) return;
    var p = upos(x), d = document.createElement('div'), low = UI.lowFx && UI.lowFx();
    d.className = 'skfx ' + (dt === 'm' ? 'm' : dt === 'j' ? 'j' : 'p') + (x.side === 'A' ? ' fromB' : ' fromA') + (crit ? ' crit' : '') + (low ? ' lite' : '');
    d.style.left = (p.x - 60) + 'px'; d.style.top = (p.y - 140) + 'px';
    d.innerHTML = low ? '' : '<i></i><b></b>';
    fx.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, low ? 300 : 620);
  }
  UI._skillFx = skillFx;
  UI._floatText = function (k, t, c, dy) { floatText(k, t, c, dy); };
  function setHp(key, hp) {
    var x = BT.units[key]; if (!x) return; x.hp = hp;
    var h = el('h' + key); if (h) h.innerHTML = hpHtml(hp, x.max, x.u.layers);
    var ph = el('pbh' + key); if (ph) ph.style.width = (x.max ? U.clamp(hp / x.max * 100, 0, 100) : 0).toFixed(1) + '%';
    totals();
  }
  function totals() {
    U.each(['A', 'B'], function (sd) {
      var cur = 0, max = 0;
      U.each(U.keys(BT.units), function (k) { var x = BT.units[k]; if (x.side === sd) { cur += Math.max(0, x.hp); max += x.max; } });
      var b = el('tb' + sd), t = el('tt' + sd);
      if (b) b.style.width = (max ? cur / max * 100 : 0).toFixed(1) + '%';
      if (t) t.innerHTML = (sd === 'A' ? '我方 ' : '敵方 ') + U.fmt(cur) + '/' + U.fmt(max);
    });
  }
  UI._bTotals = function () { if (BT) totals(); };
  function setDead(key, dead) { var e = el('u' + key); if (e) e.className = e.className.replace(/ dead/g, '') + (dead ? ' dead' : ''); var pb = el('pb' + key); if (pb) pb.className = pb.className.replace(/ dead/g, '') + (dead ? ' dead' : ''); }
  function setRage(key, v) {
    var x = BT.units[key]; if (!x) return; x.rage = U.clamp(v || 0, 0, 100);
    var r = el('pbr' + key); if (r) r.style.width = x.rage + '%';
    var pb = el('pb' + key); if (pb) pb.className = pb.className.replace(/ full/g, '') + (x.rage >= 100 ? ' full' : '');
  }
  UI._setRage = function (k, v) { if (BT) setRage(k, v); };
  // 音效節流：同一種音效 60ms 內只播一次（群攻時避免爆音）
  var lastSfx = {};
  function sfx(n) { if (!MJ.Audio) return; var t = Date.now(); if (lastSfx[n] && t - lastSfx[n] < 60) return; lastSfx[n] = t; MJ.Audio.sfx(n); }
  function shake(big) { var b = el('bt'); if (!b) return; b.className = b.className.replace(/ shake(big)?/g, ''); void b.offsetWidth; b.className += big && !(UI.lowFx && UI.lowFx()) ? ' shakebig' : ' shake'; }
  function flash(cls) { var fx = el('fx'); if (!fx) return; var f = document.createElement('div'); f.className = 'bflash ' + (cls || ''); fx.appendChild(f); setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 450); }
  function highlight(side, cells, cls, ms) {
    U.each(cells || [], function (c) { var t = el('t' + side + c); if (t) { t.className = tileBase(side, c) + ' ' + cls; } });
    setTimeout(function () { U.each(cells || [], function (c) { var t = el('t' + side + c); if (t && t.className.indexOf(cls) >= 0) t.className = tileBase(side, c); }); }, ms);
  }
  // 修正（攻擊範圍看不到）：v9 戰報帶有攻擊範圍。畫面先壓暗戰場，紅格＝這次技能的範圍，亮紅＝實際受擊，綠＝施放者，灰＝被隊友擋住的格
  function showRange(e, me, ms) {
    if (!e.range) return;
    var b = el('bt'); if (b) { b.className = b.className.replace(/ aim/g, '') + ' aim'; clearTimeout(BT.aimT); BT.aimT = setTimeout(function () { var b2 = el('bt'); if (b2) b2.className = b2.className.replace(/ aim/g, ''); }, ms); }
    var hit = e.cells || [];
    highlight(e.side, U.filter(e.range, function (c) { return hit.indexOf(c) < 0; }), 'rng', ms);
    if (e.bd) { if (e.me != null) highlight('X', [e.me], 'me', ms); return; }
    if (me) highlight(me.side, [me.cell], 'me', ms);
    if (e.blocked && me) highlight(me.side, e.blocked, 'blk', ms);
  }
  function unitAt(side, cell) { var k = U.find(U.keys(BT.units), function (k2) { var x = BT.units[k2]; return x.side === side && x.cell === cell && x.hp > 0; }); return k ? BT.units[k] : null; }
  function miniGrid(cells, side, range, e) {
    if (e && e.bd && BT.bd) { // v10：小地圖畫整個棋盤
      var W = BT.bd.cols, hb = '<div class="mgrid bd">';
      for (var i = 0; i < 3 * W; i++) {
        var occ = U.find(U.keys(BT.units), function (k) { var x = BT.units[k]; return x.hp > 0 && x.br * W + x.bx === i; });
        hb += '<i class="' + (cells.indexOf(i) >= 0 ? 'on' : range && range.indexOf(i) >= 0 ? 'rg' : i === e.me ? 'me' : '') + (occ ? ' occ' : '') + '"></i>';
      }
      return hb + '</div>';
    }
    var h = '<div class="mgrid">';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var col = side === 'B' ? c : 2 - c, cell = r * 3 + col, occ = !!unitAt(side, cell);
      h += '<i class="' + (cells.indexOf(cell) >= 0 ? 'on' : range && range.indexOf(cell) >= 0 ? 'rg' : '') + (occ ? ' occ' : '') + '"></i>';
    }
    return h + '</div>';
  }
  // v9：往前衝一格（鍵值不變，格子改變）
  function moveUnit(e) {
    var x = BT.units[e.u]; if (!x) return;
    x.cell = e.to;
    var d = el('u' + e.u), p = pos(x.side, x.cell);
    if (d) { d.className = d.className.replace(/ moving/g, '') + ' moving'; d.style.left = (p.x - 56) + 'px'; d.style.top = (p.y - 130) + 'px'; d.style.zIndex = 10 + Math.floor(x.cell / 3); }
    addLog(x.u.name + (e.side ? ' 換列' : ' 往前衝'), '');
  }
  UI._bMove = function (e) { if (BT) moveUnit(e); };
  // v10：回合開始雙方一起前進一格（同時播放）
  function advUnits(e) {
    U.each(e.m, function (m) {
      var x = BT.units[m.u]; if (!x) return;
      x.bx = m.to; if (m.br != null) x.br = m.br; // v12：走到底的人換到第一列（最上方）
      var d = el('u' + m.u), p = upos(x);
      if (d && m.wrap) { // v11：走到底，閃回我方第一排後方排隊（不滑過整排）
        d.className = d.className.replace(/ moving| wrapped/g, '') + ' wrapping'; d.style.left = (p.x - 56) + 'px'; if (m.br != null) { d.style.top = (p.y - 130) + 'px'; d.style.zIndex = 10 + x.br; }
        BT.wraps = (BT.wraps || 0) + 1;
        setTimeout(function () { d.className = d.className.replace(/ wrapping/g, '') + ' wrapped'; setTimeout(function () { d.className = d.className.replace(/ wrapped/g, ''); }, 900); }, 60);
      } else if (d) { d.className = d.className.replace(/ moving| wrapped/g, '') + ' moving'; d.style.left = (p.x - 56) + 'px'; }
    });
    var nw = U.filter(e.m, function (m) { return m.wrap; }), np = U.filter(e.m, function (m) { return m.pass; });
    if (np.length) BT.passes = (BT.passes || 0) + np.length;
    addLog('雙方前進一格（' + e.m.length + ' 人移動）' + (np.length ? '；' + U.map(np, function (m) { return nameOf(m.u); }).join('、') + ' 打不到人，從敵人身邊穿過去' : '') + (nw.length ? '；' + U.map(nw, function (m) { return nameOf(m.u); }).join('、') + (BT.bd && BT.bd.v >= 12 ? ' 走到底，統一換到第一列排隊' : ' 走到底，回到第一排後方排隊') : ''), '');
  }
  UI._bAdv = function (e) { if (BT) advUnits(e); };
  function fieldItemPreview(e) {
    var fx = el('fx'); if (!fx) return;
    var box = document.createElement('div'), body = '', rows = e.rows || [];
    box.className = 'field-preview ' + (e.id === 'flag' ? 'flag' : '');
    if (e.id === 'flag') {
      var labels = { patk: '物攻', matk: '法攻', hit: '命中', mdef: '法防' };
      body = e.unresolved ? '此命中級距來源未列' : (labels[e.stat] || e.stat || '屬性未知') + ' +' + e.percent + '%（命中 ' + e.hits + ' 次）';
    } else if (e.id === 'flame') body = '四格斜線・附灼傷（數值未載）';
    else body = (e.strength === 'low' ? '小威力' : e.strength === 'medium' ? '中威力' : '大威力') + '・隨機命中格';
    var html = '<b>' + U.esc(e.name || '戰場道具') + '</b><span>' + U.esc(body) + '</span>';
    if (rows.length) {
      html += '<div class="field-map">';
      U.each(rows, function (row, r) {
        html += '<div class="field-row">';
        for (var c = 0; c < row.length; c++) {
          var mark = row.charAt(c), selected = e.hitCell && e.hitCell[0] === r && e.hitCell[1] === c;
          html += '<i class="' + (mark === 'O' ? 'area' : mark === 'P' ? 'source' : '') + (selected ? ' selected' : '') + '">' + (mark === 'P' ? '◆' : mark === 'O' ? '●' : '') + '</i>';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    box.innerHTML = html; fx.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 1800);
  }
  function evLog(e) {
    switch (e.t) {
      case 'hit': return e.miss ? nameOf(e.to) + (e.why === '等級壓制' ? ' 等級壓制，攻擊無效' : ' 閃避了攻擊') : nameOf(e.from) + ' 對 ' + nameOf(e.to) + ' 造成 ' + e.dmg + ' 傷害' + (e.crit ? '（暴擊）' : '') + (e.sup && e.sup < 1 ? '（壓制 ×' + e.sup.toFixed(2) + '）' : '');
      case 'heal': return nameOf(e.to) + ' 回復 ' + e.amt + ' 生命' + (e.why ? '（' + e.why + '）' : '');
      case 'dead': return nameOf(e.to) + ' 陣亡';
      case 'revive': return nameOf(e.to) + ' 觸發「' + e.name + '」重新站起';
      case 'status': return nameOf(e.to) + ' ' + e.s;
      case 'skip': return nameOf(e.u) + ' 眩暈中，無法行動';
      case 'whiff': return nameOf(e.u) + ' 「' + e.skill + '」範圍內沒有敵人，揮空';
      case 'wait': return nameOf(e.u) + ' 攻擊格內沒有敵人，等待前進';
      case 'stale': return (e.quiet ? '連續 ' + e.quiet + ' 回合雙方都沒有人受傷（剩下的人不同列、技能打不到）：' : '雙方都走不動、攻擊格也碰不到對方：') + '依剩餘生命判定（我方 ' + e.a + '%／敵方 ' + e.b + '%）→ ' + (e.win ? '我方勝' : '敵方勝');
      case 'fieldItem': return e.id === 'flag' ? (e.unresolved ? '戰場道具「旗幟」：來源未列命中 ' + e.hits + ' 次級距' : '旗幟：' + ({ patk: '物攻', matk: '法攻', hit: '命中', mdef: '法防' }[e.stat] || e.stat) + ' +' + e.percent + '%（命中 ' + e.hits + ' 次）') : (e.name + '：' + (e.id === 'flame' ? '四格斜線，附灼傷（數值未載）' : '範圍內隨機命中，' + (e.strength === 'low' ? '小威力' : e.strength === 'medium' ? '中威力' : '大威力')));
      default: return null;
    }
  }
  // 套用一個「結果類」事件（傷害/治療/文字…）
  function applyEv(e) {
    var lg = evLog(e); if (lg) addLog(lg, e.t === 'dead' ? 'bad' : '');
    switch (e.t) {
      case 'hit':
        if (e.miss) { floatText(e.to, e.why === '等級壓制' ? '無效' : '閃避', 'red small'); break; }
        setHp(e.to, e.hp);
        BT.combo = (BT.combo || 0) + 1; var cb = el('binfo-combo'); if (cb) cb.innerHTML = '連擊 x' + BT.combo;
        var eu = el('u' + e.to); if (eu) { eu.className = eu.className.replace(/ hurt( crit)?/g, ''); void eu.offsetWidth; eu.className += ' hurt' + (e.crit ? ' crit' : ''); }
        var at = BT.units[e.from]; skillFx(e.to, at ? (at.u.dtype || (at.u.phys ? 'p' : 'm')) : 'p', e.crit);
        if (e.crit) { floatText(e.to, '暴擊', 'critlab', 38); floatText(e.to, '-' + e.dmg, 'crit'); shake(!!BT.ultTotal); sfx('crit'); }
        else { floatText(e.to, '-' + e.dmg, 'dmg'); sfx('hit'); }
        if (e.sup && e.sup < 1) floatText(e.to, '壓制 ×' + e.sup.toFixed(2), 'red small', -28);
        hitSpark(e.to, e.crit);
        if (BT.ultTotal && !e.dot && !e.reflect) { BT.ultTotal.v += e.dmg; var tt = el('ulttotal'); if (tt) tt.innerHTML = '總傷害 <b>' + U.fmt(BT.ultTotal.v) + '</b>'; }
        break;
      case 'heal': sfx('heal'); setHp(e.to, e.hp); floatText(e.to, '<i class="leaf"></i>+' + e.amt, 'heal'); var hu = el('u' + e.to); if (hu) { hu.className = hu.className.replace(/ healed/g, ''); void hu.offsetWidth; hu.className += ' healed'; } break;
      case 'dead': setHp(e.to, 0); setDead(e.to, true); sfx('dead'); updateInfo(); break;
      case 'revive': setDead(e.to, false); setHp(e.to, e.hp); floatText(e.to, e.name, 'green small'); break;
      case 'status': floatText(e.to, e.s, 'red small', 20); break;
      case 'text': floatText(e.to, e.s, (e.c === 'green' ? 'green' : 'red') + ' small', 24); break;
      case 'fieldItem': fieldItemPreview(e); break;
      case 'rage': setRage(e.u, e.rage); floatText(e.u, '無雙+' + e.gain, 'green small', 44); break;
      case 'ultEnd': break;
    }
  }
  function step() {
    if (!BT || BT.done) return;
    if (UI.screen !== 'battle') { BT = null; return; }
    var ev = BT.ev;
    if (BT.i >= ev.length) return finish();
    var e = ev[BT.i++];
    if (e.t === 'start') return next(0);
    if (e.t === 'round') {
      BT.round = e.n; BT.combo = 0;
      var rd = el('bround'); if (rd) { rd.innerHTML = '第' + e.n + '回合'; rd.className = 'b-round pop'; }
      updateInfo();
      var lf = el('bleft'); if (lf) lf.innerHTML = 'x ' + (MJ.D.config.maxRounds - e.n + 1);
      addLog('—— 第' + e.n + '回合 ——', 'rnd');
      return next(T(380));
    }
    if (e.t === 'end') return finish();
    if (e.t === 'skip') { applyEv(e); floatText(e.u, '眩暈', 'red small'); return next(T(400)); }
    if (e.t === 'move') { moveUnit(e); return next(T(300)); }
    if (e.t === 'adv') { advUnits(e); return next(T(480)); }
    if (e.t === 'wait') { applyEv(e); return next(T(60)); }
    if (e.t === 'stale') { applyEv(e); return next(T(700)); }
    if (e.t === 'whiff') { applyEv(e); floatText(e.u, '揮空', 'red small'); showRange(e, BT.units[e.u], T(520)); return next(T(560)); }
    if (e.t !== 'act') { applyEv(e); return next(T(120)); }
    // 行動：收集後續結果事件
    var group = [];
    while (BT.i < ev.length && ['act', 'round', 'end', 'skip'].indexOf(ev[BT.i].t) < 0) group.push(ev[BT.i++]);
    var me = BT.units[e.u], ue = el('u' + e.u);
    var t0 = 0;
    addLog(me.u.name + ' 施展「' + e.skill + '」' + (e.ult ? '（無雙）' : ''), e.ult ? 'ult' : '');
    if (e.ult) setRage(e.u, 0);
    var showCi = true;
    if (e.ult) {
      showCi = UI.musouOn();
      if (showCi) {
        BT.ultTotal = { v: 0 }; sfx('ult'); ultFx(e.skill);
        var ci = el('cutin');
        if (ci) {
          ci.innerHTML = '<div class="ci-band side' + me.side + '"><div class="ci-art' + (MJ.Art.hasCutin(me.u.look) ? ' hi' : '') + '">' + MJ.Art.cutin(me.u.look, me.u.quality || 4, { enemy: me.side === 'B' }) + '</div>' +
            '<div class="ci-top">' + U.esc(me.u.name) + '・' + U.esc(e.skill) + '</div>' +
            '<div class="ci-vname">' + U.esc(e.skill) + '</div><div class="ci-txt"><div class="ci-combo">' + (e.lx ? '無雙連攜' : '無雙技') + '</div><div class="ci-name">' + U.esc(e.skill) + '</div><div class="ci-who">' + U.esc(me.u.name) + '</div></div>' +
            (e.heal ? '' : '<div class="ci-mini">' + miniGrid(e.cells, e.side, e.range, e) + '</div>') + '</div>' +
            ciCards(me.side, me.u.name) + '<div class="ci-total" id="ulttotal">' + (e.heal ? '' : '總傷害 <b>0</b>') + '</div>';
          ci.className = 'cutin on';
        }
        t0 = T(1000);
      } else t0 = 0; // 無雙演出關：不建 cut-in、不播全屏特效、不延遲，直接結算（傷害數字與戰報照常）
    } else {
      if (e.skill !== '普攻' && e.skill !== '攻擊') floatText(e.u, e.skill, 'skillname', 60);
    }
    BT.timer = setTimeout(function () {
      var ci2 = el('cutin'); if (ci2 && e.ult && showCi) ci2.className = 'cutin on small';
      if (e.ult && showCi) { var sk2 = el('bskill'); if (sk2) { sk2.innerHTML = U.esc(e.skill); sk2.className = 'b-skill on'; } flash(me.side === 'A' ? 'gold' : 'blue'); shake(true); }
      showRange(e, me, T(e.ult ? 900 : 560));
      highlight(e.side, e.cells, e.heal ? 'heal' : 'warn', T(e.ult ? 900 : 520));
      attackAnim(me, e); // 攻擊動作（揮刀／出拳／氣功）：傷害在 impact 時才結算，時序不變
      var tgtKey = e.target, melee = !e.heal && isMelee(me.u) && e.pattern !== 'all';
      if (ue) ue.className = ue.className.replace(/ acting/g, '') + ' acting';
      if (melee && tgtKey && BT.units[tgtKey] && ue) {
        var tp = upos(BT.units[tgtKey]), mp = upos(me);
        var dx = tp.x - mp.x + (me.side === 'A' ? -70 : 70), dy = tp.y - mp.y;
        ue.className += ' windup';
        setTimeout(function () { ue.className = ue.className.replace(/ windup/g, '') + ' lunge'; ue.style.webkitTransform = ue.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }, T(150));
      } else if (!e.heal && tgtKey && BT.units[tgtKey]) {
        // 遠程／法術：投射光球（飛行時間隨速度等比縮短，抵達時在目標處爆開）
        var a = upos(me), b = upos(BT.units[tgtKey]), fx = el('fx');
        if (fx) {
          var o = document.createElement('div'); o.className = 'orb ' + (attackKind(me.u) === 'wave' ? 'wave' : (me.u.dtype === 'j' ? 'jue' : me.u.phys ? 'arrow' : 'magic'));
          o.style.left = (a.x - 14) + 'px'; o.style.top = (a.y - 84) + 'px';
          o.style.webkitTransitionDuration = o.style.transitionDuration = T(300) + 'ms';
          fx.appendChild(o);
          setTimeout(function () { o.style.webkitTransform = o.style.transform = 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y) + 'px)'; }, T(150));
          setTimeout(function () {
            if (o.parentNode) o.parentNode.removeChild(o);
            if (!(UI.lowFx && UI.lowFx())) {
              var ob = document.createElement('div'); ob.className = 'hitflash';
              ob.style.left = (b.x - 60) + 'px'; ob.style.top = (b.y - 120) + 'px';
              fx.appendChild(ob);
              setTimeout(function () { if (ob.parentNode) ob.parentNode.removeChild(ob); }, 260);
            }
          }, T(450));
        }
      }
      var impact = T(e.ult ? 520 : 420);
      // 命中頓停（hit-stop，D）：命中瞬間凍結約 60ms（1x，隨速度等比縮短），再結算傷害；
      // 只延後顯示時序，不改傷害數值與事件順序；省電模式或治療不頓停
      var hs = (!e.heal && !(UI.lowFx && UI.lowFx())) ? UI._hitstopMs(BT.speed) : 0;
      setTimeout(function () {
        var btEl = el('bt');
        if (hs > 0 && btEl && btEl.className.indexOf('hitstop') < 0) btEl.className += ' hitstop';
        setTimeout(function () {
          if (btEl) btEl.className = btEl.className.replace(/ hitstop/g, '');
          var k = 0;
          U.each(group, function (g) { if (g.t === 'hit' || g.t === 'heal') k++; });
          // 還原一定執行（即使已跳過戰鬥）：攻擊者回位，棋盤不漂移（原版 step() 也是無條件還原）
          setTimeout(function () {
            if (ue) { ue.style.webkitTransform = ue.style.transform = ''; ue.className = ue.className.replace(/ (acting|lunge|windup|atk-raise|atk-thrust|atk-hit|atk-cast)/g, ''); }
          }, T(260 + k * 45));
          if (!BT || BT.done) return;
          var k2 = 0;
          U.each(group, function (g) { setTimeout(function () { if (BT && !BT.done) applyEv(g); }, T(k2 * 45)); if (g.t === 'hit' || g.t === 'heal') k2++; });
          BT.timer = setTimeout(function () {
            if (e.ult) { var ci3 = el('cutin'); if (ci3) ci3.className = 'cutin'; var sk3 = el('bskill'); if (sk3) sk3.className = 'b-skill'; BT.ultTotal = null; }
            step();
          }, T((e.ult && showCi) ? 900 : 560) + T(k2 * 45));
        }, hs);
      }, impact);
    }, t0);
  }
  function next(ms) { BT.timer = setTimeout(step, ms); }
  function finish() {
    if (!BT || BT.done) return;
    BT.done = true;
    clearTimeout(BT.timer);
    // 以模擬結果校正最終畫面
    U.each(BT.r.battle.units, function (u) { setHp(u.key, u.hp); setDead(u.key, u.hp <= 0); });
    var ci = el('cutin'); if (ci) ci.className = 'cutin';
    // 2026-11-09：結算畫面延後 300ms 才出現；若這段時間玩家已離開戰鬥
    // （bBack/bCity 會把 BT 清成 null）或已開新戰鬥，舊結算就不再顯示，
    // 否則 showResult 讀 BT.r 會在 WebKit 拋「null is not an object」。
    var bt = BT;
    setTimeout(function () { if (BT === bt) showResult(); }, 300);
  }
  UI.battleFinish = finish;
  function showResult() {
    if (!BT) return; // 已離開戰鬥（bBack/bCity 清掉 BT），不顯示舊結算
    var r = BT.r, s = MJ.S.state, h;
    var b = el('bresult'); if (!b) return;
    var btEl = el('bt'); if (btEl && btEl.className.indexOf('ended') < 0) btEl.className += ' ended';
    sfx(r.win ? 'win' : 'lose');
    if (UI.battleResultMusic) UI.battleResultMusic();
    if (r.mode && UI.modeResult) { if (!r.win && btEl) btEl.className += ' lost'; b.innerHTML = UI.modeResult(r); return; }
    if (r.win) {
      var stars = ''; for (var i = 0; i < 3; i++) stars += '<i class="' + (i < r.stars ? 'on' : '') + '">★</i>';
      h = '<div class="dim"></div><div class="result win"><div class="banner">勝 利</div><div class="rstars">' + stars + '</div><div class="parch rbody">' +
        '<div>回合數：' + r.battle.rounds + '</div>' +
        '<div>全隊經驗 +' + r.exp + '</div>' +
        (r.levelUps.length ? '<div class="lvup">升級！' + U.esc(r.levelUps.join('、')) + '</div>' : '') +
        '<div class="rw-h">戰利品</div><div class="reward-list">' + U.map(r.rewards, function (x) { return '<div class="rw">' + U.esc(x) + '</div>'; }).join('') + '</div>' +
        (r.firstRewards ? '<div class="rw-h">首通獎勵</div><div class="reward-list">' + U.map(r.firstRewards, function (x) { return '<div class="rw first">' + U.esc(x) + '</div>'; }).join('') + '</div>' : '') +
        '</div>';
    } else {
      var bt = el('bt'); if (bt) bt.className += ' lost';
      var lead = G.lead();
      h = '<div class="dim"></div><div class="result lose"><div class="banner">戰 敗</div><div class="parch rbody">' +
        '<div>' + (r.battle.stale ? '雙方都碰不到對方，依剩餘生命判定敵方勝。可以換陣法，讓武將和敵人站在同一列或用打得到別列的技能。' : r.battle.timeout ? '已達 ' + MJ.D.config.maxRounds + ' 回合上限，判定進攻方失敗。' : '我方全軍覆沒。') + '</div>' +
        '<div>沒有獲得任何獎勵；不扣任何資源，可以馬上再挑戰。</div>' +
        (r.nextMorale ? '<div class="morale">越戰越勇：下次挑戰本關，我方生命／攻擊 +' + Math.round(r.nextMorale * 100) + '%</div>' : '') +
        '<div class="rw-h">如何提升戰鬥力</div><div class="tips">・到神武殿培養武將：按「最強」換上更好的裝備、安排訓練<br>・重打已通關的關卡累積經驗<br>・在聚賢莊招募更高品質的武將<br>・調整陣法，把耐打的武將放在前排</div></div>';
    }
    var sg = r.stage;
    h += '<div class="btn-row"><a class="btn" data-a="bAgain" data-v="' + sg.id + '">再戰一次</a><a class="btn" data-a="bBack">返回關卡</a><a class="btn" data-a="bCity">回主城</a></div></div>';
    b.innerHTML = h;
  }
  UI.actions.bSpeed = function () { BT.speed = BT.speed === 1 ? 2 : (BT.speed === 2 ? 4 : 1); MJ.S.state.settings.speed = BT.speed; MJ.S.save(); var e = el('bspeed'); if (e) e.innerHTML = BT.speed + 'x'; };
  UI.actions.bSkip = function () {
    if (!BT || BT.done) return;
    if (UI.clearAuto) UI.clearAuto();
    clearTimeout(BT.timer);
    // 把剩餘事件寫進戰報
    for (; BT.i < BT.ev.length; BT.i++) { var lg = evLog(BT.ev[BT.i]); if (lg) addLog(lg); }
    var fx = el('fx'); if (fx) fx.innerHTML = '';
    finish();
  };
  // 跳過全部（WL-3 任務 2；只在通天塔／無極幻境出現）：
  // 塔＝本層已打完，直接連打到戰敗或登頂再看總結；無極＝結果已算好，直接跳到總結。
  UI.actions.bSkipAll = function () {
    if (!BT || BT.done) return;
    if (UI.clearAuto) UI.clearAuto();
    clearTimeout(BT.timer);
    var r = BT.r, fx = el('fx'); if (fx) fx.innerHTML = '';
    var bt = el('bt'); if (bt && bt.className.indexOf('ended') < 0) bt.className += ' ended';
    var b = el('bresult'); if (!b) return;
    if (r.mode === 'tower') {
      var agg = UI.towerSkipRun(r);
      if (!agg.ok) { UI.toast(agg.msg || '無法跳過', 'bad'); return; }
      BT.done = true;
      b.innerHTML = UI.towerSkipSummary(agg);
    } else if (r.mode === 'wuji') {
      BT.done = true;
      b.innerHTML = UI.modeResult(r, true);
    }
  };
  UI.actions.bLog = function () { BT.showLog = !BT.showLog; var l = el('blog'); if (l) l.className = 'blog' + (BT.showLog ? ' on' : ''); };
  UI.actions.bDetail = function () { BT.showDetail = !BT.showDetail; UI.render(); };
  UI.actions.bGrid = function (v, a) { BT.showGrid = !BT.showGrid; var b = el('bt'); if (b) b.className = b.className.replace(/ showgrid/g, '') + (BT.showGrid ? ' showgrid' : ''); a.className = 'zhen' + (BT.showGrid ? ' on' : ''); };
  UI.actions.bFormula = function () { UI.toast(MJ.Battle.FORMULA_NOTE); var t = el('toast'); if (t) { clearTimeout(UI._ft); } };
  UI.actions.bAgain = function (id) { if (UI.clearAuto) UI.clearAuto(); BT.done = true; var r = G.fight(id); if (!r.ok) { UI.toast(r.msg, 'bad'); return; } UI.startBattle(r); };
  UI.actions.bBack = function () { if (UI.clearAuto) UI.clearAuto(); if (BT) { BT.done = true; if (BT.r.stage.ch) UI.sel.gateCh = BT.r.stage.ch; } BT = null; UI.go('gate'); };
  UI.actions.bCity = function () { if (UI.clearAuto) UI.clearAuto(); if (BT) BT.done = true; BT = null; UI.go('city'); };
  UI.battleState = function () { return BT; };
})();
