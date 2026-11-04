/* 戰鬥引擎（純邏輯，不碰畫面）
   先完整模擬並產生事件列表，畫面只負責重播。
   傷害公式為「暫定」（D）：原作公式未公開。 */
MJ.Battle = (function () {
  var B = {}, U = MJ.U;
  B.FORMULA_NOTE = '暫定傷害公式（D，非原作數值）：傷害 = max(1, (攻擊 × 技能倍率 + 固定值) × 隨機(0.95~1.05) − 防禦)；物理對物防、法術對法防、絕技對絕技防禦（A：三種傷害）；命中率 = 90% + (命中 − 閃避)%；暴擊率 = 5% + 暴擊%，暴擊 ×1.5；目標高於攻擊者 10 級以上必定未命中（B）。';

  function rc(cell) { return { r: Math.floor(cell / 3), c: cell % 3 }; }
  function cellOf(r, c) { return r * 3 + c; }
  B.patternCells = function (pattern, tcell) {
    var p = rc(tcell), out = [], r, c;
    function add(r2, c2) { if (r2 >= 0 && r2 < 3 && c2 >= 0 && c2 < 3) out.push(cellOf(r2, c2)); }
    switch (pattern) {
      case 'line2': add(p.r, p.c); add(p.r, p.c + 1); break;
      case 'line3': for (c = 0; c < 3; c++) add(p.r, c); break;
      case 'col2': add(p.r, p.c); add(p.r < 2 ? p.r + 1 : p.r - 1, p.c); break;
      case 'col3': for (r = 0; r < 3; r++) add(r, p.c); break;
      case 'square': var r2 = p.r < 2 ? p.r + 1 : p.r - 1, c2 = p.c < 2 ? p.c + 1 : p.c - 1; add(p.r, p.c); add(p.r, c2); add(r2, p.c); add(r2, c2); break;
      case 'cross': add(p.r, p.c); add(p.r - 1, p.c); add(p.r + 1, p.c); add(p.r, p.c - 1); add(p.r, p.c + 1); break;
      case 'diag': add(p.r, p.c); add(p.r - 1, p.c - 1); add(p.r - 1, p.c + 1); add(p.r + 1, p.c - 1); add(p.r + 1, p.c + 1); break;
      case 'all': for (r = 0; r < 9; r++) out.push(r); break;
      default: add(p.r, p.c);
    }
    return out;
  };
  // C：優先攻擊同一排最前方的敵人，否則最近一排
  B.pickTarget = function (unit, foes) {
    var alive = U.filter(foes, function (u) { return u.hp > 0; });
    if (!alive.length) return null;
    var my = rc(unit.cell).r, best = null, bestKey = 1e9;
    U.each(alive, function (u) {
      var p = rc(u.cell), key = Math.abs(p.r - my) * 10 + p.c + (p.r < my ? 0.5 : 0);
      if (key < bestKey) { bestKey = key; best = u; }
    });
    return best;
  };

  // ===== v9 攻擊範圍（單位 rv>=9 才套用；舊戰報照舊規則重播） =====
  // 錨點 A（巴哈 sn282 技能說明圖：綠格＝施放者本身、不受傷害，紅格＝受擊格）：範圍是「以施放者自己的格子為起點、往敵方方向」的相對位移。
  // 位移 [dr, dc]：dr＝上下列差；dc＝從「施放者正前方第一格」起算往前的格數（0＝正前方）。
  // 往前數格時先經過自己這一側、同一列「還活著」的隊友（B：攻略「往前打二格」「攻擊距離 2~3 格放後排相當吃香」；C：活著的隊友擋格），
  // 再進入敵方陣中、依同一列「還活著」的敵人由前往後數。
  // 範圍內沒有敵人：先往前一格「衝」（自己這列正前方是空格才可前進，C：攻略「衝比其他將快」「前進速度」），仍打不到就「揮空」（B：攻略「揮空」；不出手、不加無雙 C）。
  B.RANGE = {
    single: [[0, 0]], line2: [[0, 0], [0, 1]], line3: [[0, 0], [0, 1], [0, 2]],
    col3: [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]],
    cross: [[0, 0], [0, 1], [0, 2], [-1, 1], [1, 1]],
    diag: [[0, 1], [-1, 0], [1, 0], [-1, 2], [1, 2]]
  };
  // 名稱型範圍 → 相對位移（col2／square 在最下列時往上翻，沿用舊版翻轉習慣，C）
  B.rangeOffsets = function (skill, row) {
    if (skill.shape && skill.shape.length) return skill.shape;
    var p = skill.pattern || 'single', d = row < 2 ? 1 : -1;
    if (p === 'col2') return [[0, 0], [d, 0]];
    if (p === 'square') return [[0, 0], [0, 1], [d, 0], [d, 1]];
    return B.RANGE[p] || B.RANGE.single;
  };
  // 同一列、在 u 前方（欄號較小）還活著的單位
  function aheadAlive(u, list) { var p = rc(u.cell); return U.filter(list, function (x) { return x !== u && x.hp > 0 && rc(x.cell).r === p.r && rc(x.cell).c < p.c; }).length; }
  function rowAlive(list, r) { return U.filter(list, function (x) { return x.hp > 0 && rc(x.cell).r === r; }).sort(function (a, b) { return a.cell - b.cell; }); }
  // 回傳 { hits: 受擊敵人, cells: 敵方紅格（含空格，給畫面顯示）, blocked: 被隊友擋住的己方格 }
  B.reach = function (u, skill, allies, foes) {
    var p = rc(u.cell), dA = aheadAlive(u, allies), out = { hits: [], cells: [], blocked: [] }, mine = rowAlive(allies, p.r), front = U.filter(mine, function (x) { return rc(x.cell).c < p.c; }).sort(function (a, b) { return b.cell - a.cell; });
    if (skill.pattern === 'all') { U.each(foes, function (f) { if (f.hp > 0) out.hits.push(f); }); for (var k = 0; k < 9; k++) out.cells.push(k); return out; }
    U.each(B.rangeOffsets(skill, p.r), function (o) {
      var r2 = p.r + o[0]; if (r2 < 0 || r2 > 2) return;
      var e = o[1] - dA;
      if (e < 0) { if (o[0] === 0 && front[o[1]]) out.blocked.push(front[o[1]].cell); return; }
      var L = rowAlive(foes, r2), cell;
      if (e < L.length) { cell = L[e].cell; if (out.hits.indexOf(L[e]) < 0) out.hits.push(L[e]); }
      else { var c2 = (L.length ? rc(L[L.length - 1].cell).c : -1) + 1 + (e - L.length); if (c2 > 2) return; cell = cellOf(r2, c2); }
      if (out.cells.indexOf(cell) < 0) out.cells.push(cell);
    });
    return out;
  };
  // 往前衝一格：自己這一列正前方是空格（沒有活著的隊友）才前進
  B.canAdvance = function (u, allies) {
    var p = rc(u.cell); if (p.c === 0) return false;
    var ahead = cellOf(p.r, p.c - 1);
    return !U.find(allies, function (x) { return x !== u && x.hp > 0 && x.cell === ahead; });
  };

  // 橫移（D）：自己這一列沒有敵人時，往最近一列有敵人的方向移一格（目標格必須是空格）
  B.sideStep = function (u, allies, foes) {
    var p = rc(u.cell);
    if (rowAlive(foes, p.r).length) return null;
    var best = null, bd = 9;
    U.each(foes, function (f) { if (f.hp > 0) { var d = Math.abs(rc(f.cell).r - p.r); if (d < bd) { bd = d; best = rc(f.cell).r; } } });
    if (best == null) return null;
    var r2 = p.r + (best > p.r ? 1 : -1);
    var free = function (t) { return !U.find(allies, function (x) { return x !== u && x.hp > 0 && x.cell === t; }); };
    // 先找同一欄，再找更後面的欄（不會越過隊友往前跳）
    for (var c = p.c; c < 3; c++) if (free(cellOf(r2, c))) return cellOf(r2, c);
    return null;
  };

  // A（影片2）：雙方依位置交替行動——左方前排下、右方前排下、左方前排中……；由前列到後列，同列由下到上
  B.posKey = function (cell) { var p = rc(cell); return p.c * 3 + (2 - p.r); };
  B.turnOrder = function (A, Bs) {
    function sorted(list) { return U.filter(list, function (u) { return u.hp > 0; }).sort(function (a, b) { return B.posKey(a.cell) - B.posKey(b.cell); }); }
    var a = sorted(A), b = sorted(Bs), out = [], n = Math.max(a.length, b.length);
    for (var i = 0; i < n; i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); }
    return out;
  };
  // P4：被動可來自武將本身（passive）或後天習得欄（pb）；習得被動效果固定 ×1（D）
  function has(u, id) { return u.passive === id || u.pb === id || (u.rv >= 9 && u.passive2 === id); }
  function pmOf(u, id) { return u.passive === id || (u.rv >= 9 && u.passive2 === id) ? (u.pm || 1) : 1; }
  function v9(u) { return u.rv >= 9; }
  // v9 負面狀態（燒傷／流血／封印／虛弱）：清心可清除
  function hasDebuff(u) { return (u.dots && u.dots.length) || u.seal || u.healCut || u.dhT || u.sj || u.defBuff < 0 || u.tdeb; }
  B.has = has;
  // P4：負面狀態機率 = 基礎 × (1 + 施加機率%) × (1 − 狀態抵抗%)（D）
  function stChance(base, att, tgt) { return base * (1 + (att.dbf || 0) / 100) * Math.max(0, 1 - (tgt.res || 0) / 100); }
  function mkUnit(src, side, cell) {
    var u = U.extend({}, src);
    u.side = side; u.cell = cell; u.cell0 = cell; u.key = side + cell;
    u.maxHp = src.hp; u.hp = src.curHp != null ? Math.max(0, Math.min(src.hp, src.curHp)) : src.hp; u.rage = src.curRage || 0;
    u.dtype = src.dtype || (src.phys ? 'p' : 'm'); u.pm = src.pm || 1;
    if (u.jatk == null) u.jatk = Math.max(src.patk || 0, src.matk || 0);
    if (u.jdef == null) u.jdef = src.pdef || 0; u.stun = 0; u.defBuff = 0; u.defBuffT = 0; u.revived = false;
    // P4 新被動（D 數值）
    if (has(u, 'gaojiyudi')) { u.pdef = Math.floor(u.pdef * 1.2); u.mdef = Math.floor(u.mdef * 1.2); u.jdef = Math.floor(u.jdef * 1.2); }
    if (has(u, 'pozhou')) u.res = (u.res || 0) + (v9(u) ? 30 : 50);
    if (has(u, 'renai') && !v9(u)) u.rage = Math.min(100, u.rage + 15);
    if (v9(u)) {
      // v9 被動（B：snA967）：殺氣訣 法攻+10、強刃 物攻+10、強甲 防+10、飄忽若神 閃避+5（D）、凝心 狀態機率 +1%+2%/級
      if (has(u, 'shaqi')) { u.matk += Math.round(10 * pmOf(u, 'shaqi')); if (u.dtype === 'j') u.jatk += Math.round(10 * pmOf(u, 'shaqi')); }
      if (has(u, 'qiangren')) { u.patk += Math.round(10 * pmOf(u, 'qiangren')); if (u.dtype === 'j') u.jatk += Math.round(10 * pmOf(u, 'qiangren')); }
      if (has(u, 'qiangjia')) { var qj = Math.round(10 * pmOf(u, 'qiangjia')); u.pdef += qj; u.mdef += qj; u.jdef += qj; }
      if (has(u, 'piaohu')) u.dodge = (u.dodge || 0) + 5 * pmOf(u, 'piaohu');
      if (has(u, 'ningxin')) u.dbf = (u.dbf || 0) + 1 + 2 * ((u.plv || 1) - 1);
      u.dots = []; u.seal = 0; u.healCut = 0; u.healCutT = 0; u.sxN = 0; u.bsN = 0;
    }
    u.sj = 0; u.dhT = 0;
    return u;
  }

  B.run = function (teamA, teamB, opt) {
    opt = opt || {};
    var rng = U.rng(opt.seed || 1);
    var maxRounds = opt.maxRounds || 36, lvSup = opt.levelSuppression || 10;
    var A = [], Bs = [], ev = [], all, pending = [];
    U.each(teamA, function (x) { A.push(mkUnit(x.unit, 'A', x.cell)); });
    U.each(teamB, function (x) { Bs.push(mkUnit(x.unit, 'B', x.cell)); });
    all = A.concat(Bs);
    function foesOf(u) { return u.side === 'A' ? Bs : A; }
    function alliesOf(u) { return u.side === 'A' ? A : Bs; }
    function alive(list) { return U.filter(list, function (u) { return u.hp > 0; }); }
    function snapshot(u) { return { key: u.key, hp: u.hp, maxHp: u.maxHp, rage: u.rage }; }

    // v9：治療量受「虛弱」影響
    function healAmt(m, amt) { return m.healCut ? Math.max(1, Math.floor(amt * (1 - m.healCut))) : amt; }
    function addDot(att, tgt, k, v, t) {
      tgt.dots.push({ k: k, v: Math.max(1, v), t: t, from: att.key });
      ev.push({ t: 'status', to: tgt.key, s: k === 'burn' ? '燒傷' : '流血' });
    }
    function hurt(att, tgt, skill, isCounter) {
      var e = { t: 'hit', from: att.key, to: tgt.key };
      if (tgt.lv - att.lv > lvSup) { e.miss = true; e.why = '等級壓制'; ev.push(e); return 0; }
      var hitCh = U.clamp(0.9 + ((att.hit || 0) - (tgt.dodge || 0)) / 100, 0.2, 1);
      if (rng() > hitCh) { e.miss = true; e.why = '閃避'; ev.push(e); return 0; }
      // 三種傷害（A）：物理對物防、法術對法防、絕技對絕技防禦（以敏捷為主，D）
      var dt = att.dtype, atk = (dt === 'p' ? att.patk : dt === 'm' ? att.matk : att.jatk) * (1 + (att.atkBuff || 0)), def = dt === 'p' ? tgt.pdef : dt === 'm' ? tgt.mdef : tgt.jdef;
      if (att.dhT) atk *= 0.7; // 鈍化中（D）
      if (tgt.sj) def *= 1 - 0.1 * tgt.sj; // 碎甲層數（D）
      if (has(att, 'pojia')) def *= 0.8; // 破甲：無視 20% 防禦（D）
      e.dt = dt;
      var raw = (atk * skill.mult + (skill.flat || 0)) * (0.95 + rng() * 0.1) - def * (1 + tgt.defBuff);
      var dmg = Math.max(1, Math.floor(raw));
      if (rng() < 0.05 + (att.crit || 0) / 100) { dmg = Math.floor(dmg * 1.5); e.crit = true; }
      var pv = opt.pvp ? (att.pvp || 0) : (att.pve || 0); // P4：PVP／PVE 傷害%（D）
      if (pv) dmg = Math.max(1, Math.floor(dmg * (1 + pv / 100)));
      if (!opt.pvp && tgt.npcCut && att.side === 'B') dmg = Math.max(1, Math.floor(dmg * (1 - tgt.npcCut / 100))); // 錐行陣（A：sn77）
      if (!v9(tgt) && has(tgt, 'huajie') && rng() < 0.2) { dmg = Math.max(1, Math.floor(dmg / 2)); e.hj = true; ev.push({ t: 'text', to: tgt.key, s: '化解', c: 'green' }); }
      tgt.hp = Math.max(0, tgt.hp - dmg);
      e.dmg = dmg; e.hp = tgt.hp;
      ev.push(e);
      if (skill.ultTotal) skill.ultTotal.v += dmg;
      // A：「狂暴」字樣見於官方圖；觸發條件與數值為 D——王關首領生命低於 30% 時攻擊 +20%
      if (tgt.hp > 0 && tgt.boss && tgt.layers > 1 && !tgt.kb && tgt.hp < tgt.maxHp * 0.3) { tgt.kb = true; tgt.atkBuff = 0.2; ev.push({ t: 'text', to: tgt.key, s: '狂暴', c: 'red' }); }
      if (tgt.hp > 0) {
        if (v9(att)) {
          if (has(att, 'xinu') && rng() < 0.3) { var xn9 = Math.round(20 * pmOf(att, 'xinu')); tgt.rage = Math.max(0, tgt.rage - xn9); ev.push({ t: 'text', to: tgt.key, s: '無雙-' + xn9, c: 'red' }); }
          else gainRage(tgt, 10 + Math.floor(rng() * 11));
          if (has(att, 'huajie') && tgt.rage > 0 && rng() < 0.3) { var st9 = Math.min(10, tgt.rage); tgt.rage -= st9; ev.push({ t: 'text', to: tgt.key, s: '化解 無雙-' + st9, c: 'red' }); gainRage(att, st9); }
        }
        else if (has(att, 'xinu')) { var xn = Math.round(20 * pmOf(att, 'xinu')); tgt.rage = Math.max(0, tgt.rage - xn); ev.push({ t: 'text', to: tgt.key, s: '無雙-' + xn, c: 'red' }); }
        else gainRage(tgt, 10 + Math.floor(rng() * 11));
      }
      if (has(att, 'xixue') && att.hp > 0 && (!v9(att) || rng() < 0.12)) {
        var hv = Math.max(1, Math.floor(dmg * (v9(att) ? 0.1 : 0.15) * pmOf(att, 'xixue'))); if (v9(att)) hv = healAmt(att, hv); att.hp = Math.min(att.maxHp, att.hp + hv);
        ev.push({ t: 'heal', to: att.key, amt: hv, hp: att.hp, why: '吸血' });
      }
      // 還施彼身（B）：被攻擊後反彈 50% 傷害，上限 300
      if (v9(tgt) && !isCounter && has(tgt, 'huanshi') && att.hp > 0 && att !== tgt) {
        var rf = Math.min(300, Math.floor(dmg * 0.5)); if (rf > 0) { att.hp = Math.max(0, att.hp - rf); ev.push({ t: 'text', to: tgt.key, s: '還施彼身', c: 'green' }); ev.push({ t: 'hit', from: tgt.key, to: att.key, dmg: rf, hp: att.hp, reflect: true }); if (att.hp <= 0) die(att); }
      }
      if (tgt.hp <= 0) die(tgt);
      else if (skill.fx) {
        if (skill.fx.stun && rng() < stChance(skill.fx.stun, att, tgt)) { tgt.stun = 1; ev.push({ t: 'status', to: tgt.key, s: '眩暈' }); }
        if (skill.fx.armorBreak && rng() < stChance(skill.fx.armorBreak, att, tgt)) { tgt.defBuff = -0.15; tgt.defBuffT = 2; ev.push({ t: 'text', to: tgt.key, s: '防禦-15%', c: 'red' }); }
        if (v9(att) && tgt.dots) {
          if (skill.fx.burn && rng() < stChance(skill.fx.burn, att, tgt)) addDot(att, tgt, 'burn', Math.floor(dmg * 0.2), 2); // 灼傷（B 名稱／D 數值）
          if (skill.fx.bleed && rng() < stChance(skill.fx.bleed, att, tgt)) addDot(att, tgt, 'bleed', Math.floor(dmg * 0.15), 3); // 流血（B 名稱／D 數值）
        }
      }
      if (v9(att) && tgt.hp > 0 && tgt.dots) {
        if (has(att, 'duohun') && rng() < stChance(0.12, att, tgt)) { tgt.seal = 2; ev.push({ t: 'status', to: tgt.key, s: '封印無雙' }); }
        if (has(att, 'xuruo') && rng() < stChance(0.31, att, tgt)) { tgt.healCut = 0.24; tgt.healCutT = 5; ev.push({ t: 'status', to: tgt.key, s: '虛弱' }); }
        if (has(att, 'fenxin') && rng() < stChance(0.2, att, tgt)) addDot(att, tgt, 'burn', Math.floor(Math.max(att.patk, att.matk, att.jatk || 0) * 0.2), 2);
      }
      if (tgt.hp > 0) {
        if (has(att, 'suijia') && tgt.sj < 3) { tgt.sj++; ev.push({ t: 'text', to: tgt.key, s: '碎甲' + tgt.sj, c: 'red' }); }
        if (has(att, 'dunhua') && rng() < stChance(0.25, att, tgt)) { tgt.dhT = 2; ev.push({ t: 'status', to: tgt.key, s: '鈍化' }); }
      }
      if (!isCounter && tgt.hp > 0 && has(tgt, 'huizhan') && !tgt.stun && rng() < (v9(tgt) ? 0.15 : 0.2) * pmOf(tgt, 'huizhan')) {
        pending.push({ a: tgt, b: att }); // 反擊延到本次招式結算後

      }
      return dmg;
    }
    // C：無雙值——攻擊 +25~35、受擊 +10~20，滿 100 施放無雙技（影片2 顯示綠字「無雙+31」）
    function gainRage(u, n) {
      if (u.hp <= 0 || u.rage >= 100) return;
      u.rage = Math.min(100, u.rage + n);
      ev.push({ t: 'rage', u: u.key, gain: n, rage: u.rage });
    }
    function die(u) {
      if (v9(u)) {
        // v9（B：snA967）：不死 15% 生命剩 1（每場 1 次，D）；復甦 5% 以 15% 生命復活（每場最多 2 次）
        if (has(u, 'busi') && !u.bsN && rng() < 0.15 * pmOf(u, 'busi')) { u.bsN = 1; u.hp = 1; ev.push({ t: 'revive', to: u.key, hp: 1, name: '不死' }); return; }
        if (has(u, 'suxing') && u.sxN < 2 && rng() < 0.05 * pmOf(u, 'suxing')) { u.sxN++; u.hp = Math.max(1, Math.floor(u.maxHp * 0.15)); ev.push({ t: 'revive', to: u.key, hp: u.hp, name: '復甦' }); return; }
        u.hp = 0; ev.push({ t: 'dead', to: u.key }); return;
      }
      if (!u.revived && (has(u, 'suxing') || has(u, 'busi'))) {
        u.revived = true;
        var sx = has(u, 'suxing');
        u.hp = sx ? Math.max(1, Math.floor(u.maxHp * 0.15 * pmOf(u, 'suxing'))) : 1;
        ev.push({ t: 'revive', to: u.key, hp: u.hp, name: sx ? '甦醒' : '不死' });
        return;
      }
      u.hp = 0;
      ev.push({ t: 'dead', to: u.key });
    }
    function useSkill(u, skill, isUlt) {
      if (skill.pattern === 'healAll') {
        var mates = alive(alliesOf(u));
        ev.push({ t: 'act', u: u.key, skill: skill.name, ult: isUlt, cells: U.map(mates, function (m) { return m.cell; }), side: u.side, heal: true });
        var base = Math.max(u.matk, u.patk);
        U.each(mates, function (m) {
          var amt = Math.max(1, Math.floor((base * skill.mult + (skill.flat || 0)) * (0.95 + rng() * 0.1))); if (v9(u)) amt = healAmt(m, amt);
          m.hp = Math.min(m.maxHp, m.hp + amt);
          ev.push({ t: 'heal', to: m.key, amt: amt, hp: m.hp });
        });
        return;
      }
      var foes = foesOf(u), tgt, cells, sk = skill, rch = null;
      if (u.rv >= 9) {
        rch = B.reach(u, skill, alliesOf(u), foes);
        if (!rch.hits.length) return;
        tgt = rch.hits[0]; cells = U.map(rch.hits, function (f) { return f.cell; });
        ev.push({ t: 'act', u: u.key, skill: skill.name, ult: isUlt, cells: cells, range: rch.cells, blocked: rch.blocked, side: tgt.side, target: tgt.key, pattern: skill.pattern, rv: 9, lx: !!u.lx });
      } else {
        tgt = B.pickTarget(u, foes);
        if (!tgt) return;
        cells = B.patternCells(skill.pattern, tgt.cell);
        ev.push({ t: 'act', u: u.key, skill: skill.name, ult: isUlt, cells: cells, side: tgt.side, target: tgt.key, pattern: skill.pattern });
      }
      if (isUlt) { sk = U.extend({}, skill); sk.ultTotal = { v: 0 }; }
      if (rch) U.each(rch.hits, function (f) { if (f.hp > 0) hurt(u, f, sk, false); });
      else U.each(foes, function (f) { if (f.hp > 0 && cells.indexOf(f.cell) >= 0) hurt(u, f, sk, false); });
      if (isUlt) ev.push({ t: 'ultEnd', u: u.key, total: sk.ultTotal.v });
      if (isUlt && u.lx) U.each(alive(alliesOf(u)), function (m) { if (m !== u && m.did === u.partner) gainRage(m, 20); }); // 連攜（D）
      var pc = pending; pending = [];
      U.each(pc, function (p) {
        if (p.a.hp <= 0 || p.b.hp <= 0) return;
        ev.push({ t: 'act', u: p.a.key, skill: '反擊', ult: false, cells: [p.b.cell], side: p.b.side, target: p.b.key, counter: true });
        ev.push({ t: 'text', to: p.a.key, s: '反擊', c: 'red' });
        hurt(p.a, p.b, { mult: 1, flat: 0 }, true);
      });
      if (skill.fx && skill.fx.buffDef) {
        U.each(alive(alliesOf(u)), function (m) { m.defBuff = skill.fx.buffDef; m.defBuffT = 2; ev.push({ t: 'text', to: m.key, s: '物防+' + Math.round(skill.fx.buffDef * 100) + '%', c: 'green' }); });
      }
    }
    var round = 0, winner = null;
    // 連攜（B 對象：snA967／D 效果）：夥伴同時上陣，兩人攻擊 +10%
    U.each(all, function (u) {
      if (!v9(u) || !u.partner) return;
      if (U.find(alliesOf(u), function (m) { return m !== u && m.did === u.partner; })) { u.lx = true; u.patk = Math.floor(u.patk * 1.1); u.matk = Math.floor(u.matk * 1.1); u.jatk = Math.floor(u.jatk * 1.1); }
    });
    ev.push({ t: 'start', units: U.map(all, snapshot) });
    U.each(all, function (u) { if (u.lx) ev.push({ t: 'text', to: u.key, s: '連攜', c: 'green' }); });
    while (round < maxRounds && !winner) {
      round++;
      ev.push({ t: 'round', n: round });
      var order = B.turnOrder(A, Bs);
      for (var i = 0; i < order.length && !winner; i++) {
        var u = order[i];
        if (u.hp <= 0) continue; // 陣亡單位不行動
        if (u.defBuffT) { u.defBuffT--; if (!u.defBuffT) u.defBuff = 0; }
        if (u.dhT) u.dhT--;
        if (v9(u)) {
          // 持續傷害（辟邪 −50%，B）
          if (u.dots.length) {
            var keep = [];
            U.each(u.dots, function (d) {
              if (u.hp <= 0) return;
              var dv = has(u, 'bixie') ? Math.max(1, Math.floor(d.v * 0.5)) : d.v; u.hp = Math.max(0, u.hp - dv);
              ev.push({ t: 'hit', from: d.from, to: u.key, dmg: dv, hp: u.hp, dot: d.k });
              if (u.hp <= 0) die(u);
              if (--d.t > 0) keep.push(d);
            });
            u.dots = keep;
            if (u.hp <= 0) { if (!alive(Bs).length) winner = 'A'; else if (!alive(A).length) winner = 'B'; continue; }
          }
          if (u.seal) u.seal--;
          if (u.healCutT && !--u.healCutT) u.healCut = 0;
          if (has(u, 'qingxin') && hasDebuff(u) && rng() < 0.3) { u.dots = []; u.seal = 0; u.healCut = 0; u.healCutT = 0; u.dhT = 0; u.sj = 0; if (u.defBuff < 0) { u.defBuff = 0; u.defBuffT = 0; } u.stun = 0; ev.push({ t: 'text', to: u.key, s: '清心', c: 'green' }); }
        }
        if (u.stun) { u.stun = 0; ev.push({ t: 'skip', u: u.key, why: '眩暈' }); continue; }
        if (v9(u)) {
          if (has(u, 'gjliaoshang') && u.hp < u.maxHp) { var gh9 = healAmt(u, Math.floor(u.maxHp * 0.08)); u.hp = Math.min(u.maxHp, u.hp + gh9); ev.push({ t: 'text', to: u.key, s: '高級療傷', c: 'green' }); ev.push({ t: 'heal', to: u.key, amt: gh9, hp: u.hp }); }
          else if (has(u, 'liaoshang') && u.hp < u.maxHp && rng() < 0.5) { // 療傷（B）：50% 恢復攻擊 20% 的生命
            var lh = healAmt(u, Math.max(1, Math.floor(Math.max(u.patk, u.matk) * 0.2 * pmOf(u, 'liaoshang')))); u.hp = Math.min(u.maxHp, u.hp + lh);
            ev.push({ t: 'text', to: u.key, s: '療傷', c: 'green' }); ev.push({ t: 'heal', to: u.key, amt: lh, hp: u.hp });
          }
          if (has(u, 'renai') && rng() < 0.3) gainRage(u, Math.round(15 * pmOf(u, 'renai'))); // 忍耐（B 機率／D 點數）
        } else if (has(u, 'gjliaoshang') && u.hp < u.maxHp) { // 高級療傷：每回合必定回復 8%（D）
          var gh = Math.floor(u.maxHp * 0.08); u.hp = Math.min(u.maxHp, u.hp + gh);
          ev.push({ t: 'text', to: u.key, s: '高級療傷', c: 'green' }); ev.push({ t: 'heal', to: u.key, amt: gh, hp: u.hp });
        } else if (has(u, 'liaoshang') && u.hp < u.maxHp && rng() < 0.5) {
          var hv = Math.floor(u.maxHp * 0.08 * pmOf(u, 'liaoshang')); u.hp = Math.min(u.maxHp, u.hp + hv);
          ev.push({ t: 'text', to: u.key, s: '療傷', c: 'green' }); ev.push({ t: 'heal', to: u.key, amt: hv, hp: u.hp });
        }
        var isUlt = u.rage >= 100 && !(v9(u) && u.seal); // 奪魂：封印中不能放無雙
        if (u.rv >= 9) {
          // v9：範圍以自己的格子為起點；打不到先往前衝，仍打不到就揮空（見 B.reach 註解）
          var me = u;
          var can = function (sk) { return sk && (sk.pattern === 'healAll' || B.reach(me, sk, alliesOf(me), foesOf(me)).hits.length > 0); };
          while (!can(u.active) && !(isUlt && can(u.ult)) && B.canAdvance(u, alliesOf(u))) {
            var from = u.cell; u.cell = from - 1; ev.push({ t: 'move', u: u.key, from: from, to: u.cell });
          }
          // 衝到最前仍打不到，且同列已沒有敵人：往最近一列有敵人的方向橫移一格（D：原創防卡關，原作未見記載），再試著往前
          if (!can(u.active) && !(isUlt && can(u.ult))) {
            var vs = B.sideStep(u, alliesOf(u), foesOf(u));
            if (vs != null) {
              ev.push({ t: 'move', u: u.key, from: u.cell, to: vs, side: true }); u.cell = vs;
              while (!can(u.active) && !(isUlt && can(u.ult)) && B.canAdvance(u, alliesOf(u))) { var f2 = u.cell; u.cell = f2 - 1; ev.push({ t: 'move', u: u.key, from: f2, to: u.cell }); }
            }
          }
          if (isUlt && !can(u.ult)) isUlt = false; // 無雙打不到：保留無雙值，改用主動技（C）
          if (!isUlt && !can(u.active)) { var wr = B.reach(u, u.active, alliesOf(u), foesOf(u)); ev.push({ t: 'whiff', u: u.key, skill: u.active.name, range: wr.cells, blocked: wr.blocked, side: u.side === 'A' ? 'B' : 'A' }); }
          else {
            if (isUlt) u.rage = 0;
            useSkill(u, isUlt ? u.ult : u.active, isUlt);
            if (u.hp > 0 && !isUlt) gainRage(u, 25 + Math.floor(rng() * 11));
          }
        } else {
          if (isUlt) u.rage = 0;
          useSkill(u, isUlt ? u.ult : u.active, isUlt);
          if (u.hp > 0 && !isUlt) gainRage(u, 25 + Math.floor(rng() * 11));
        }
        if (u.hp > 0 && has(u, 'lianzhan') && alive(foesOf(u)).length && !(u.rv >= 9 && !B.reach(u, u.active, alliesOf(u), foesOf(u)).hits.length) && rng() < Math.min(0.5, 0.2 * pmOf(u, 'lianzhan'))) {
          ev.push({ t: 'text', to: u.key, s: '2連擊', c: 'red' });
          useSkill(u, u.active, false);
        }
        if (!alive(Bs).length) winner = 'A';
        else if (!alive(A).length) winner = 'B';
      }
    }
    var win = winner === 'A';
    ev.push({ t: 'end', win: win, timeout: !winner, rounds: round });
    return {
      win: win, timeout: !winner, rounds: round, events: ev,
      deadA: U.filter(A, function (u) { return u.hp <= 0; }).length,
      units: U.map(all, function (u) { return { key: u.key, side: u.side, cell: u.cell, cell0: u.cell0, name: u.name, hp: u.hp, maxHp: u.maxHp, rage: u.rage, hid: u.hid }; })
    };
  };
  return B;
})();
