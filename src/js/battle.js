/* 戰鬥引擎（純邏輯，不碰畫面）
   先完整模擬並產生事件列表，畫面只負責重播。
   傷害公式為「暫定」（D）：原作公式未公開。 */
MJ.Battle = (function () {
  var B = {}, U = MJ.U;
  B.FORMULA_NOTE = '暫定傷害公式（D，非原作數值）：傷害 = max(1, (攻擊 × 技能倍率 + 固定值) × 隨機(0.95~1.05) − 防禦)；物理對物防、法術對法防、絕技對絕技防禦（A：三種傷害）；命中率 = 90% + (命中 − 閃避)%；暴擊率 = 5% + 暴擊%，暴擊 ×1.5；目標高於攻擊者 10 級以上傷害遞減，每多 1 級 −5%，最低 10%（D 級原創，2026-11-09 Tomas 指示；舊 B 級「必定未命中」已取代）。';

  // WL-4 首領詞綴（D 級原創，2026-11-09 Tomas 指示；原版沒有）：只上虛空之門王關與隱藏關的首領，
  // 每場一個，由戰鬥種子派生（pickAffix 用獨立的 U.rng(seed)，不消耗戰鬥本身的亂數流；同一種子同一關詞綴相同）。
  // 寫入方式：G.fight 在開戰前把詞綴寫進首領單位的 affix 欄位（見 game.js G.applyStageAffix），
  // 引擎只讀 u.affix 生效；精英關首領雖也是 boss 模板，但不帶詞綴。
  B.AFFIXES = [
    { id: 'life', name: '嗜血', desc: '吸血 10%' },
    { id: 'thorns', name: '荊棘', desc: '反彈所受傷害 15%' },
    { id: 'swift', name: '疾風', desc: '敏捷 +30%、先手' },
    { id: 'rock', name: '堅岩', desc: '物防法防 +20%' },
    { id: 'fury', name: '狂怒', desc: '血量低於 50% 時攻擊 +15%' }
  ];
  B.affixById = function (id) { return U.find(B.AFFIXES, function (a) { return a.id === id; }) || null; };
  B.pickAffix = function (seed) { var r = U.rng(seed || 1); return B.AFFIXES[Math.floor(r() * B.AFFIXES.length)].id; };

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
  // P3-6：道具範圍取自 provenance-backed config；不包含來源未提供的傷害係數／燒傷數值。
  function fieldCfg() { return MJ.D && MJ.D.config && MJ.D.config.battleItems; }
  function maskCells(rows) {
    var out = [];
    U.each(rows || [], function (row, r) { for (var c = 0; c < row.length; c++) if (row.charAt(c) === 'O') out.push([r, c]); });
    return out;
  }
  B.fieldItemCells = function (id, side) {
    var cfg = fieldCfg(), rows = null, item = null, direction = null;
    if (!cfg) return null;
    if (id === 'flame') {
      item = cfg.flame; direction = side === 'B' ? 'fromRight' : 'fromLeft';
      rows = item.patterns[direction];
    } else {
      item = U.find(cfg.bombs || [], function (x) { return x.id === id; });
      if (item) rows = item.rows;
    }
    if (!rows) return null;
    return { rows: rows.slice(), cells: maskCells(rows), direction: direction, emitter: direction ? (direction === 'fromLeft' ? [0, 0] : [0, 4]) : null };
  };
  B.resolveFieldItem = function (id, opt) {
    opt = opt || {};
    var cfg = fieldCfg(), side = opt.side === 'B' ? 'B' : 'A', seed = opt.seed || 1, rng = U.rng(seed), layout, item, tier, stat, stats;
    if (!cfg) return null;
    if (id === 'flag') {
      item = cfg.flag; tier = U.find(item.tiers, function (x) { return x.hits === opt.hits; });
      if (!tier) return { t: 'fieldItem', id: 'flag', name: item.name, side: side, hits: opt.hits || 0, unresolved: true, scope: 'displayOnly' };
      stats = item.buffExamples || []; stat = stats.length ? stats[Math.floor(rng() * stats.length)] : null;
      return { t: 'fieldItem', id: 'flag', name: item.name, side: side, color: item.sideColors[side], hits: tier.hits, percent: tier.totalPercent, perHitPercent: tier.perHitPercent, stacks: tier.stacks, stat: stat, statPoolPartial: true, scope: 'displayOnly' };
    }
    if (id === 'flame') {
      item = cfg.flame; layout = B.fieldItemCells(id, side);
      return { t: 'fieldItem', id: id, name: item.name, side: side, rows: layout.rows, cells: layout.cells, direction: layout.direction, status: item.status, relativePower: item.relativePower, scope: 'displayOnly' };
    }
    item = U.find(cfg.bombs || [], function (x) { return x.id === id; });
    if (!item) return null;
    layout = B.fieldItemCells(id, side);
    var pick = layout.cells.length ? Math.floor(rng() * layout.cells.length) : -1;
    return { t: 'fieldItem', id: id, name: item.name, side: side, rows: layout.rows, cells: layout.cells, hitCell: pick >= 0 ? layout.cells[pick] : null, strength: item.strength, randomTarget: !!item.randomTarget, scope: 'displayOnly' };
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

  // ===== v10 大棋盤（單位 rv>=10 才套用；rv 9 以下的舊戰報照舊規則重播） =====
  // C（玩家回憶 Tomas，2026-11-04）：戰場是一個大棋盤；每回合雙方所有人都往敵方方向前進一格，只能前後、不能上下換列；
  // 普攻、主動、無雙都依武將自己的攻擊格，以「自己目前所在的格子」為起點往前算。
  // 棋盤：每列 3（我方）＋ GAP（中間空地）＋ 3（敵方）格。GAP＝2 為本作設定（D）：開場雙方前排中間隔兩格，第 1 回合各進一格就接戰。
  // 擋路（C／D）：前方那一格有任何活著的單位（隊友或敵人）就停下；走到棋盤邊緣也停下。陣亡單位讓出格子。
  // 同一回合的移動依行動順序（我方前排先，見 turnOrder）逐一判定，所以後排可以跟著前排一起往前。
  B.BOARD = { gap: 2, cols: 8 };
  B.homeBx = function (side, cell) { var c = cell % 3; return side === 'A' ? 2 - c : 3 + B.BOARD.gap + c; };
  B.bcell = function (r, bx) { return r * B.BOARD.cols + bx; };
  function bdir(u) { return u.side === 'A' ? 1 : -1; }
  // 往前的進度（0＝在自己最後排），供行動順序用
  function prog(u) { return u.side === 'A' ? u.bx : B.BOARD.cols - 1 - u.bx; }
  // 攻擊格（v10）：位移 [dr, dc]，dc＝0 是自己正前方那一格（棋盤上的真實格子，不再跳過隊友）；格子裡有活著的敵人才受擊
  B.reach10 = function (u, skill, foes) {
    var out = { hits: [], cells: [], blocked: [] }, d = bdir(u), W = B.BOARD.cols;
    var at = function (r, bx) { return U.find(foes, function (f) { return f.hp > 0 && f.br === r && f.bx === bx; }); };
    if (skill.pattern === 'all') { U.each(foes, function (f) { if (f.hp > 0) { out.hits.push(f); out.cells.push(B.bcell(f.br, f.bx)); } }); return out; }
    U.each(B.rangeOffsets(skill, u.br), function (o) {
      var r2 = u.br + o[0], x2 = u.bx + d * (1 + o[1]);
      if (r2 < 0 || r2 > 2 || x2 < 0 || x2 >= W) return;
      var cl = B.bcell(r2, x2); if (out.cells.indexOf(cl) < 0) out.cells.push(cl);
      var f = at(r2, x2); if (f && out.hits.indexOf(f) < 0) out.hits.push(f);
    });
    return out;
  };
  // 一回合的前進：回傳 [{u, from, to}]
  B.advance10 = function (order, all) {
    var moved = [];
    U.each(order, function (u) {
      if (u.hp <= 0) return;
      var x2 = u.bx + bdir(u);
      if (x2 < 0 || x2 >= B.BOARD.cols) return; // 棋盤邊緣
      if (U.find(all, function (o) { return o !== u && o.hp > 0 && o.br === u.br && o.bx === x2; })) return; // 前方有人（隊友或敵人）
      // 接戰線（D）：不能走到敵方最前排那一欄（含）之後；自己這列沒有敵人時，停在與敵軍前排相鄰的那一欄，不會和敵人擦身而過
      if (U.find(all, function (o) { return o.side !== u.side && o.hp > 0 && (u.side === 'A' ? o.bx <= x2 : o.bx >= x2); })) return;
      moved.push({ u: u.key, from: u.bx, to: x2 }); u.bx = x2;
    });
    return moved;
  };
  // v11（R.RV=11，Tomas t23u 回憶，C）：每回合雙方持續往前一格，同一列對面的敵人死了也繼續走，不停在中間；
  // 走到棋盤盡頭（再往前就出界）時，回到「自己這一方第一排（目前最前面的我方武將那一欄）的後方」排隊，列不變；敵我都一樣。
  // 細節（D，本作解讀）：
  //  - 前方那一格有任何活著的單位（敵人或隊友）就停下（不交換、不穿過）；同一回合依行動順序逐一判定，所以後面的人可以跟著前面的人一起走。
  //  - 排隊位置＝我方其他活著單位裡最前面那一欄的後一欄（同一列）；那格有人就再往後一格，一直到自己的底線；後面都滿了才改找前面最近的空格。
  //  - 我方只剩自己一人時，回到自己開場的第一排那一欄（我方 bx 2／敵方 bx 5）排隊。
  //  - 同一回合有好幾個人走到盡頭：依行動順序（較前面、下排先）一個一個排，後到的排在先到的後面。
  B.queueBx = function (u, all) {
    var W = B.BOARD.cols, d = bdir(u), front = null;
    U.each(all, function (o) { if (o !== u && o.hp > 0 && o.side === u.side && (front === null || (d > 0 ? o.bx > front : o.bx < front))) front = o.bx; });
    var start = front === null ? B.homeBx(u.side, 0) : front - d;
    var free = function (x) { return x >= 0 && x < W && !U.find(all, function (o) { return o !== u && o.hp > 0 && o.br === u.br && o.bx === x; }); };
    var x;
    for (x = start; x >= 0 && x < W; x -= d) if (free(x)) return x;
    for (x = start + d; x >= 0 && x < W; x += d) if (x !== u.bx && free(x)) return x;
    return null;
  };
  // v12（R.RV=12，Tomas 2026-11-04／05 回憶，C；使用者回報 2026-11-05「走到底後統一換到第一列排隊對打」）：
  // 走到底的人，不分敵我，統一換到畫面最上方的「第一列」（br 0），站在第一排那一欄（我方 bx 2／敵方 bx 5）；
  // 那格已被佔用（隊友或敵人都算）就依序排在其後方（我方往 bx 0、敵方往 bx 7）；後方滿了才往前找第一列最近的空格；第一列整列都滿，再依序找第 2、3 列。
  // 平常每回合的前進仍然只能前後、不換列；只有「走到底」這一步會換到第一列。因此最後會出現敵我雙方都在第一列對打。回傳 {br, bx}；找不到空格回傳 null。
  B.queue12 = function (u, all) {
    var W = B.BOARD.cols, d = bdir(u), start = B.homeBx(u.side, 0);
    var free = function (r, x) { return x >= 0 && x < W && !U.find(all, function (o) { return o !== u && o.hp > 0 && o.br === r && o.bx === x; }); };
    for (var r = 0; r < 3; r++) {
      var x;
      for (x = start; x >= 0 && x < W; x -= d) if (free(r, x)) return { br: r, bx: x };
      for (x = start + d; x >= 0 && x < W; x += d) if (free(r, x)) return { br: r, bx: x };
    }
    return null;
  };
  //  - 卡住穿過（D，本作解讀，Tomas「不會卡在中間只能挨打」）：上一回合就已經緊貼著敵人停下、那一回合技能還是打不到人（等待），這回合前方仍是敵人時，
  //    從敵人身邊穿過去，走到同一列再往前第一個空格；一路到盡頭都沒有空格，就照走到底的規則回第一排後方排隊。打得到人的就照樣停下來打。
  B.advance11 = function (order, all, st, v12) {
    var moved = [], W = B.BOARD.cols;
    function at(u, x) { return U.find(all, function (o) { return o !== u && o.hp > 0 && o.br === u.br && o.bx === x; }); }
    function wrap(u) {
      if (v12) { var q2 = B.queue12(u, all); if (q2 && (q2.br !== u.br || q2.bx !== u.bx)) { moved.push({ u: u.key, from: u.bx, to: q2.bx, wrap: 1, br: q2.br, fromBr: u.br }); u.br = q2.br; u.bx = q2.bx; } return; }
      var q = B.queueBx(u, all); if (q !== null && q !== u.bx) { moved.push({ u: u.key, from: u.bx, to: q, wrap: 1 }); u.bx = q; }
    }
    U.each(order, function (u) {
      if (u.hp <= 0) return;
      var d = bdir(u), x2 = u.bx + d;
      if (x2 < 0 || x2 >= W) { wrap(u); return; } // 走到盡頭：回到我方第一排後方排隊
      var o = at(u, x2);
      if (o) {
        if (o.side === u.side) return; // 前方是隊友：停下排隊
        var stuck = st && st.waited[u.key] && st.blocked[u.key];
        if (st) st.next[u.key] = 1;
        if (!stuck) return; // 前方緊貼敵人：停下來打
        for (var x = x2 + d; x >= 0 && x < W; x += d) if (!at(u, x)) { moved.push({ u: u.key, from: u.bx, to: x, pass: 1 }); u.bx = x; return; }
        wrap(u); return;
      }
      moved.push({ u: u.key, from: u.bx, to: x2 }); u.bx = x2;
    });
    return moved;
  };
  B.hpRatio = function (list) { var h = 0, m = 0; U.each(list, function (u) { m += u.maxHp; if (u.hp > 0) h += u.hp; }); return m ? h / m : 0; };
  B.turnOrder10 = function (A, Bs) {
    function sorted(list) { return U.filter(list, function (u) { return u.hp > 0; }).sort(function (a, b) { return (prog(b) - prog(a)) || (b.br - a.br) || (a.cell0 - b.cell0); }); }
    var a = sorted(A), b = sorted(Bs), out = [], n = Math.max(a.length, b.length);
    for (var i = 0; i < n; i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); }
    return out;
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
    var maxRounds = opt.maxRounds || 36, lvSup = opt.levelSuppression || 10, oldSup = !!opt.oldSuppression;
    var A = [], Bs = [], ev = [], all, pending = [];
    U.each(teamA, function (x) { A.push(mkUnit(x.unit, 'A', x.cell)); });
    U.each(teamB, function (x) { Bs.push(mkUnit(x.unit, 'B', x.cell)); });
    all = A.concat(Bs);
    // v10 大棋盤：全部單位都是 rv>=10 才啟用（舊戰報的單位沒有 rv 10，照舊規則）
    var BD = all.length > 0 && U.filter(all, function (u) { return u.rv >= 10; }).length === all.length;
    // v15 戰場道具事件只附加在所有快照都為 rv>=15 的新戰報；舊戰報逐位保留原事件序列。
    var FI = all.length > 0 && U.filter(all, function (u) { return u.rv >= 15; }).length === all.length;
    // v11 持續前進＋走到底排隊：全部單位都是 rv>=11 才啟用（rv 10 的舊戰報照 v10 前線規則重播）
    var BV = BD ? (U.filter(all, function (u) { return u.rv >= 12; }).length === all.length ? 12 : (U.filter(all, function (u) { return u.rv >= 11; }).length === all.length ? 11 : 10)) : 0;
    if (BD) U.each(all, function (u) { u.br = Math.floor(u.cell / 3); u.bx = B.homeBx(u.side, u.cell); });
    function bc(u) { return B.bcell(u.br, u.bx); }
    function reachOf(u, sk) { return BD ? B.reach10(u, sk, foesOf(u)) : B.reach(u, sk, alliesOf(u), foesOf(u)); }
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
      // WL-3 前的舊規則只留給 v6 以前戰報重播（opt.oldSuppression；見 sys4 arenaReplay／wulinReplay）：其餘一律走下面傷害遞減
      if (oldSup && tgt.lv - att.lv > lvSup) { e.miss = true; e.why = '等級壓制'; ev.push(e); return 0; }
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
      // WL-3：等級壓制改傷害遞減（D：2026-11-09 Tomas 指示；舊 B 級「必定未命中」已取代）——等差 > lvSup 時每多 1 級 −5%，最低 10%
      var supD = tgt.lv - att.lv, sup = 1;
      if (supD > lvSup) sup = Math.max(0.10, 1 - 0.05 * (supD - lvSup));
      if (sup < 1) { dmg = Math.max(1, Math.floor(dmg * sup)); e.sup = Math.round(sup * 100) / 100; }
      // P3：來源有明確上限者，依 provenance 的 C 級引擎解讀限制每次命中的最終傷害；舊快照無此欄位。
      if (skill.maxDamage != null) dmg = Math.min(dmg, skill.maxDamage);
      if (!v9(tgt) && has(tgt, 'huajie') && rng() < 0.2) { dmg = Math.max(1, Math.floor(dmg / 2)); e.hj = true; ev.push({ t: 'text', to: tgt.key, s: '化解', c: 'green' }); }
      tgt.hp = Math.max(0, tgt.hp - dmg);
      e.dmg = dmg; e.hp = tgt.hp;
      ev.push(e);
      if (skill.ultTotal) skill.ultTotal.v += dmg;
      // A：「狂暴」字樣見於官方圖；觸發條件與數值為 D——王關首領生命低於 30% 時攻擊 +20%
      // WL-4：狂暴改為累加（原為直接賦值 0.2），才能與詞綴「狂怒」疊加到 +35%；無其他地方寫 atkBuff，改動安全。
      if (tgt.hp > 0 && tgt.boss && tgt.layers > 1 && !tgt.kb && tgt.hp < tgt.maxHp * 0.3) { tgt.kb = true; tgt.atkBuff = (tgt.atkBuff || 0) + 0.2; ev.push({ t: 'text', to: tgt.key, s: '狂暴', c: 'red' }); }
      // WL-4 詞綴「狂怒」：首領生命低於 50% 時攻擊 +15%，與狂暴疊加（<30% 時合計 +35%）
      if (tgt.hp > 0 && tgt.boss && tgt.affix === 'fury' && !tgt.furyOn && tgt.hp < tgt.maxHp * 0.5) { tgt.furyOn = true; tgt.atkBuff = (tgt.atkBuff || 0) + 0.15; ev.push({ t: 'text', to: tgt.key, s: '狂怒', c: 'red' }); }
      if (tgt.hp > 0) {
        if (v9(att)) {
          if (has(att, 'xinu') && rng() < 0.3) { var xn9 = Math.round(30 * pmOf(att, 'xinu')); tgt.rage = Math.max(0, tgt.rage - xn9); ev.push({ t: 'text', to: tgt.key, s: '無雙-' + xn9, c: 'red' }); }
          else gainRage(tgt, 10 + Math.floor(rng() * 11));
          if (has(att, 'huajie') && tgt.rage > 0 && rng() < 0.3) { var st9 = Math.min(10, tgt.rage); tgt.rage -= st9; ev.push({ t: 'text', to: tgt.key, s: '化解 無雙-' + st9, c: 'red' }); gainRage(att, st9); }
        }
        else if (has(att, 'xinu')) { var xn = Math.round(30 * pmOf(att, 'xinu')); tgt.rage = Math.max(0, tgt.rage - xn); ev.push({ t: 'text', to: tgt.key, s: '無雙-' + xn, c: 'red' }); }
        else gainRage(tgt, 10 + Math.floor(rng() * 11));
      }
      if (has(att, 'xixue') && att.hp > 0 && (!v9(att) || rng() < 0.12)) {
        var hv = Math.max(1, Math.floor(dmg * (v9(att) ? 0.1 : 0.15) * pmOf(att, 'xixue'))); if (v9(att)) hv = healAmt(att, hv); att.hp = Math.min(att.maxHp, att.hp + hv);
        ev.push({ t: 'heal', to: att.key, amt: hv, hp: att.hp, why: '吸血' });
      }
      // WL-4 詞綴「嗜血」：首領造成傷害的 10% 回血（固定吸血，不經機率；與被動吸血可疊加）
      if (att.affix === 'life' && att.hp > 0) {
        var lv = Math.max(1, Math.floor(dmg * 0.1)); if (v9(att)) lv = healAmt(att, lv); att.hp = Math.min(att.maxHp, att.hp + lv);
        ev.push({ t: 'heal', to: att.key, amt: lv, hp: att.hp, why: '嗜血' });
      }
      // 還施彼身（B）：被攻擊後反彈 50% 傷害，上限 300
      if (v9(tgt) && !isCounter && has(tgt, 'huanshi') && att.hp > 0 && att !== tgt) {
        var rf = Math.min(300, Math.floor(dmg * 0.5)); if (rf > 0) { att.hp = Math.max(0, att.hp - rf); ev.push({ t: 'text', to: tgt.key, s: '還施彼身', c: 'green' }); ev.push({ t: 'hit', from: tgt.key, to: att.key, dmg: rf, hp: att.hp, reflect: true }); if (att.hp <= 0) die(att); }
      }
      // WL-4 詞綴「荊棘」：首領受擊時反彈所受傷害 15%（無上限；反擊不反彈，避免遞迴；與還施彼身可疊加）
      if (!isCounter && tgt.affix === 'thorns' && att.hp > 0 && att !== tgt) {
        var th = Math.max(1, Math.floor(dmg * 0.15)); att.hp = Math.max(0, att.hp - th); ev.push({ t: 'text', to: tgt.key, s: '荊棘', c: 'green' }); ev.push({ t: 'hit', from: tgt.key, to: att.key, dmg: th, hp: att.hp, reflect: true }); if (att.hp <= 0) die(att);
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
        ev.push(BD ? { t: 'act', u: u.key, skill: skill.name, ult: isUlt, cells: U.map(mates, bc), side: 'X', me: bc(u), heal: true, bd: 1 } : { t: 'act', u: u.key, skill: skill.name, ult: isUlt, cells: U.map(mates, function (m) { return m.cell; }), side: u.side, heal: true });
        var base = Math.max(u.matk, u.patk);
        U.each(mates, function (m) {
          var amt = Math.max(1, Math.floor((base * skill.mult + (skill.flat || 0)) * (0.95 + rng() * 0.1))); if (v9(u)) amt = healAmt(m, amt);
          m.hp = Math.min(m.maxHp, m.hp + amt);
          ev.push({ t: 'heal', to: m.key, amt: amt, hp: m.hp });
        });
        return;
      }
      var foes = foesOf(u), tgt, cells, sk = skill, rch = null;
      if (BD) {
        rch = B.reach10(u, skill, foes);
        if (!rch.hits.length) return;
        tgt = rch.hits[0]; cells = U.map(rch.hits, bc);
        ev.push({ t: 'act', u: u.key, skill: skill.name, ult: isUlt, cells: cells, range: rch.cells, blocked: [], side: 'X', me: bc(u), target: tgt.key, pattern: skill.pattern, rv: BV, bd: 1, lx: !!u.lx });
      } else if (u.rv >= 9) {
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
        ev.push(BD ? { t: 'act', u: p.a.key, skill: '反擊', ult: false, cells: [bc(p.b)], side: 'X', me: bc(p.a), target: p.b.key, counter: true, bd: 1 } : { t: 'act', u: p.a.key, skill: '反擊', ult: false, cells: [p.b.cell], side: p.b.side, target: p.b.key, counter: true });
        ev.push({ t: 'text', to: p.a.key, s: '反擊', c: 'red' });
        hurt(p.a, p.b, { mult: 1, flat: 0 }, true);
      });
      if (skill.fx && skill.fx.buffDef) {
        U.each(alive(alliesOf(u)), function (m) { m.defBuff = skill.fx.buffDef; m.defBuffT = 2; ev.push({ t: 'text', to: m.key, s: '物防+' + Math.round(skill.fx.buffDef * 100) + '%', c: 'green' }); });
      }
    }
    var round = 0, winner = null, stale = false;
    // 連攜（B 對象：snA967／D 效果）：夥伴同時上陣，兩人攻擊 +10%
    U.each(all, function (u) {
      if (!v9(u) || !u.partner) return;
      if (U.find(alliesOf(u), function (m) { return m !== u && m.did === u.partner; })) { u.lx = true; u.patk = Math.floor(u.patk * 1.1); u.matk = Math.floor(u.matk * 1.1); u.jatk = Math.floor(u.jatk * 1.1); }
    });
    ev.push(BD ? { t: 'start', units: U.map(all, snapshot), bd: BV >= 11 ? { gap: B.BOARD.gap, cols: B.BOARD.cols, v: BV, pos: U.map(all, function (u) { return [u.key, u.br, u.bx]; }) } : { gap: B.BOARD.gap, cols: B.BOARD.cols, pos: U.map(all, function (u) { return [u.key, u.br, u.bx]; }) } } : { t: 'start', units: U.map(all, snapshot) });
    if (FI && Array.isArray(opt.fieldItems)) U.each(opt.fieldItems, function (x, i) {
      var f = B.resolveFieldItem(x.id, { side: x.side, seed: x.seed || ((opt.seed || 1) + i + 1), hits: x.hits });
      if (f) ev.push(f);
    });
    U.each(all, function (u) { if (u.lx) ev.push({ t: 'text', to: u.key, s: '連攜', c: 'green' }); });
    // WL-4：開場顯示首領詞綴（戰鬥 log 與浮字都看得到，與「連攜」提示同一位置）
    U.each(all, function (u) { if (u.affix) { var af = B.affixById(u.affix); if (af) ev.push({ t: 'text', to: u.key, s: '詞綴·' + af.name, c: 'red' }); } });
    var quiet = 0, qFrom = 0, blk11 = {}; // v11 僵局計數、上一回合緊貼敵人停下的人
    while (round < maxRounds && !winner) {
      round++;
      ev.push({ t: 'round', n: round });
      var order;
      if (BD) {
        // v11 僵局（D）：持續前進後大家每回合都在走，舊的「沒人走得動」條件不會成立；改成「連續 8 回合（走完一整排棋盤）雙方都沒有人受到傷害」
        // （例如剩下的敵我各在不同列、技能又打不到別列），就不空等到 36 回合，直接以雙方剩餘生命比例判定（我方比例較高才算勝；相同算敵方勝）
        var waited = {};
        if (BV >= 11) {
          if (round > 1) { var dmgd = false; for (var qi = qFrom; qi < ev.length; qi++) { if (ev[qi].t === 'hit' && !ev[qi].miss && ev[qi].dmg > 0) dmgd = true; if (ev[qi].t === 'wait') waited[ev[qi].u] = 1; } quiet = dmgd ? 0 : quiet + 1; }
          qFrom = ev.length;
          if (quiet >= B.BOARD.cols) {
            var qa = B.hpRatio(A), qb = B.hpRatio(Bs); stale = true; winner = qa > qb ? 'A' : 'B';
            ev.push({ t: 'stale', a: Math.round(qa * 100), b: Math.round(qb * 100), win: winner === 'A', quiet: quiet });
            break;
          }
        }
        // v10：回合開始雙方一起往前一格（C 玩家回憶 Tomas）
        var st11 = { waited: waited, blocked: blk11, next: {} };
        var mv = BV >= 11 ? B.advance11(B.turnOrder10(A, Bs), all, st11, BV >= 12) : B.advance10(B.turnOrder10(A, Bs), all);
        blk11 = st11.next;
        if (mv.length) ev.push({ t: 'adv', m: mv });
        // 僵局（D）：沒有人能再前進，且雙方都沒有任何人的主動（或已滿 100 的無雙）攻擊格碰得到敵人（例如敵人只剩在我方沒有人的那一列），
        // 不空等到時間到，直接以雙方剩餘生命比例判定（我方比例較高才算勝；相同算敵方勝）
        if (!mv.length && !U.find(all, function (u) { return u.hp > 0 && U.find(u.rage >= 100 ? [u.active, u.ult] : [u.active], function (sk) { return sk && sk.pattern !== 'healAll' && B.reach10(u, sk, foesOf(u)).hits.length; }); })) {
          var ra = B.hpRatio(A), rb = B.hpRatio(Bs); stale = true; winner = ra > rb ? 'A' : 'B';
          ev.push({ t: 'stale', a: Math.round(ra * 100), b: Math.round(rb * 100), win: winner === 'A' });
          break;
        }
        order = B.turnOrder10(A, Bs);
      } else order = B.turnOrder(A, Bs);
      // WL-4 詞綴「疾風」：先手——帶詞綴的首領排在行動順序最前（每回合都如此；本作行動順序本來只看站位，
      // 敏捷不影響順序，所以先手必須明寫在這裡。移動順序仍照站位，不動。）
      var sw = U.filter(order, function (u) { return u.affix === 'swift'; });
      if (sw.length) order = sw.concat(U.filter(order, function (u) { return sw.indexOf(u) < 0; }));
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
        if (BD) {
          // v10：不再衝刺或橫移（移除 D 橫移規則）；攻擊格內有敵人才出手，否則揮空
          var me10 = u, can10 = function (sk) { return sk && (sk.pattern === 'healAll' || B.reach10(me10, sk, foesOf(me10)).hits.length > 0); };
          if (isUlt && !can10(u.ult)) isUlt = false; // 無雙打不到：保留無雙值，改用主動技（C）
          // 攻擊格內沒有敵人：這回合不出手（等下一回合前進），不加無雙值（C）；畫面只寫戰報、不飄「揮空」
          if (!isUlt && !can10(u.active)) { var wr10 = B.reach10(u, u.active, foesOf(u)); ev.push({ t: 'wait', u: u.key, skill: u.active.name, range: wr10.cells, side: 'X', me: bc(u), bd: 1 }); }
          else {
            if (isUlt) u.rage = 0;
            useSkill(u, isUlt ? u.ult : u.active, isUlt);
            if (u.hp > 0 && !isUlt) gainRage(u, 25 + Math.floor(rng() * 11));
          }
        } else if (u.rv >= 9) {
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
        if (u.hp > 0 && has(u, 'lianzhan') && alive(foesOf(u)).length && !(u.rv >= 9 && !reachOf(u, u.active).hits.length) && rng() < Math.min(0.5, 0.2 * pmOf(u, 'lianzhan'))) {
          ev.push({ t: 'text', to: u.key, s: '2連擊', c: 'red' });
          useSkill(u, u.active, false);
        }
        if (!alive(Bs).length) winner = 'A';
        else if (!alive(A).length) winner = 'B';
      }
    }
    var win = winner === 'A';
    ev.push(stale ? { t: 'end', win: win, timeout: false, stale: true, rounds: round } : { t: 'end', win: win, timeout: !winner, rounds: round });
    var res = {
      win: win, timeout: !winner, rounds: round, events: ev,
      deadA: U.filter(A, function (u) { return u.hp <= 0; }).length,
      board: BD ? (BV >= 11 ? { gap: B.BOARD.gap, cols: B.BOARD.cols, v: BV } : { gap: B.BOARD.gap, cols: B.BOARD.cols }) : null,
      units: U.map(all, function (u) { var o = { key: u.key, side: u.side, cell: u.cell, cell0: u.cell0, name: u.name, hp: u.hp, maxHp: u.maxHp, rage: u.rage, hid: u.hid }; if (BD) { o.br = u.br; o.bx = u.bx; } return o; })
    };
    if (stale) res.stale = true;
    return res;
  };
  return B;
})();
