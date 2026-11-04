/* 加碼玩法（原創，全部 D 級）：華容道（滑塊解謎）、觀星台（每日觀星運勢）、玄機盤（轉盤）
   華容道使用的是公有領域的傳統益智遊戲規則與經典「橫刀立馬」布局；其餘關卡布局由本作以程式搜尋產生並驗證可解。 */
(function (G) {
  var U = MJ.U;
  function st() { return MJ.S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function def(o, k, v) { if (o[k] == null) o[k] = v; return o[k]; }
  function today() { return U.dayKey(); }
  function rnd(rng) { return rng ? rng() : Math.random(); }
  function lvl() { return G.lead().lv; }
  G.QIYU_OPEN = 5;

  MJ.S.extraDefaults = MJ.S.extraDefaults || [];
  MJ.S.extraDefaults.push(function (s) {
    def(s, 'qiyu', {});
    var q = s.qiyu;
    def(q, 'hrd', {}); def(q.hrd, 'lv', 0); def(q.hrd, 'cur', null); def(q.hrd, 'moves', 0); def(q.hrd, 'hist', []); def(q.hrd, 'best', {}); def(q.hrd, 'day', ''); def(q.hrd, 'solves', 0);
    def(q, 'star', {}); def(q.star, 'day', ''); def(q.star, 'draws', 0); def(q.star, 'luck', null); def(q.star, 'last', null); def(q.star, 'total', 0);
    def(q, 'wheel', {}); def(q.wheel, 'day', ''); def(q.wheel, 'free', 0); def(q.wheel, 'pity', 0); def(q.wheel, 'spins', 0); def(q.wheel, 'last', null);
  });
  function Q() { return st().qiyu; }
  G.qiyuOpen = function () { return lvl() >= G.QIYU_OPEN; };

  // =================== 華容道 ===================
  // 棋盤 4 欄 × 5 列；C＝曹操 2×2、H＝關羽 1×2（橫）、V＝直立武將 2×1、S＝兵 1×1。曹操移到底部中央（第 4 列第 2 欄起）即從出口脫身。
  G.HRD_SIZE = { C: [2, 2], H: [1, 2], V: [2, 1], S: [1, 1] };
  G.HRD_NAMES = { C: ['曹操'], H: ['關羽'], V: ['張飛', '趙雲', '馬超', '黃忠'], S: ['兵', '兵', '兵', '兵'] };
  // min：以 tools/hrd-solve.js 廣度優先搜尋算出的最少「格步」（每移動一格算一步）
  G.HRD = [
    { id: 'h1', name: '初出許都', min: 12, p: [['V', 0, 3], ['C', 2, 0], ['V', 0, 2], ['V', 0, 1], ['H', 3, 2], ['V', 0, 0], ['S', 2, 2], ['S', 4, 0], ['S', 4, 2], ['S', 2, 3]] },
    { id: 'h2', name: '曹營夜走', min: 30, p: [['V', 0, 1], ['C', 2, 2], ['V', 2, 1], ['V', 0, 0], ['H', 4, 2], ['V', 2, 0], ['S', 1, 3], ['S', 4, 0], ['S', 4, 1], ['S', 0, 3]] },
    { id: 'h3', name: '雲長截道', min: 50, p: [['V', 1, 1], ['C', 0, 2], ['V', 3, 1], ['V', 1, 0], ['H', 2, 2], ['V', 3, 0], ['S', 0, 0], ['S', 3, 2], ['S', 3, 3], ['S', 0, 1]] },
    { id: 'h4', name: '狹路相逢', min: 70, p: [['V', 1, 0], ['C', 0, 2], ['V', 2, 1], ['V', 3, 0], ['H', 3, 2], ['V', 0, 1], ['S', 0, 0], ['S', 4, 1], ['S', 2, 3], ['S', 4, 3]] },
    { id: 'h5', name: '兵臨絕境', min: 90, p: [['V', 0, 1], ['C', 0, 2], ['V', 3, 3], ['V', 1, 0], ['H', 2, 2], ['V', 3, 1], ['S', 3, 0], ['S', 3, 2], ['S', 4, 0], ['S', 4, 2]] },
    { id: 'h6', name: '橫刀立馬', min: 116, p: [['V', 0, 0], ['C', 0, 1], ['V', 0, 3], ['V', 2, 0], ['H', 2, 1], ['V', 2, 3], ['S', 3, 1], ['S', 3, 2], ['S', 4, 0], ['S', 4, 3]] }
  ];
  G.hrdFirstReward = function (i) { return { gold: 10 + i * 10, items: [{ item: 'jinengshu', n: 1 + i }, { item: 'peiyangdan', n: 2 + i * 2 }] }; };
  G.hrdDailyReward = function () { return { silver: 300 * lvl(), items: [{ item: 'jinglitang', n: 1 }] }; };
  function boardOf(i) {
    var cnt = {};
    return U.map(G.HRD[i].p, function (x) { var k = x[0]; cnt[k] = (cnt[k] || 0); var n = G.HRD_NAMES[k][cnt[k]++] || ''; return { t: k, r: x[1], c: x[2], n: n }; });
  }
  G.hrdGrid = function (b) {
    var g = []; for (var i = 0; i < 20; i++) g.push(-1);
    U.each(b, function (p, i) { var z = G.HRD_SIZE[p.t]; for (var r = 0; r < z[0]; r++) for (var c = 0; c < z[1]; c++) g[(p.r + r) * 4 + p.c + c] = i; });
    return g;
  };
  G.hrdUnlocked = function (i) { var h = Q().hrd; return i === 0 || !!h.best[G.HRD[i - 1].id]; };
  G.hrd = function () { var h = Q().hrd; if (!h.cur) { h.cur = boardOf(h.lv); h.moves = 0; h.hist = []; } return h; };
  G.hrdStart = function (i) {
    if (!G.qiyuOpen()) return fail('主角 ' + G.QIYU_OPEN + ' 級開放');
    if (!G.HRD[i]) return fail('沒有這個布局');
    if (!G.hrdUnlocked(i)) return fail('先破解上一關「' + G.HRD[i - 1].name + '」');
    var h = Q().hrd; h.lv = i; h.cur = boardOf(i); h.moves = 0; h.hist = []; G.commit(); return ok();
  };
  G.hrdCanMove = function (pi, dr, dc) {
    var h = G.hrd(), b = h.cur, p = b[pi]; if (!p) return false;
    var z = G.HRD_SIZE[p.t], nr = p.r + dr, nc = p.c + dc;
    if (nr < 0 || nc < 0 || nr + z[0] > 5 || nc + z[1] > 4) return false;
    var g = G.hrdGrid(b);
    for (var r = 0; r < z[0]; r++) for (var c = 0; c < z[1]; c++) { var v = g[(nr + r) * 4 + nc + c]; if (v !== -1 && v !== pi) return false; }
    return true;
  };
  G.hrdSolved = function (b) { return !!U.find(b || G.hrd().cur, function (p) { return p.t === 'C' && p.r === 3 && p.c === 1; }); };
  G.hrdMove = function (pi, dr, dc) {
    if (!G.qiyuOpen()) return fail('主角 ' + G.QIYU_OPEN + ' 級開放');
    if (Math.abs(dr) + Math.abs(dc) !== 1) return fail('一次只能移動一格');
    var h = G.hrd();
    if (G.hrdSolved(h.cur)) return fail('已經破解，請重來或挑戰下一關');
    if (!G.hrdCanMove(pi, dr, dc)) return fail('那裡被擋住了');
    var p = h.cur[pi]; h.hist.push([pi, p.r, p.c]); if (h.hist.length > 300) h.hist.shift();
    p.r += dr; p.c += dc; h.moves++;
    var out = { moved: true, solved: false };
    if (G.hrdSolved(h.cur)) {
      var lvd = G.HRD[h.lv], id = lvd.id, first = !h.best[id];
      out.solved = true; out.moves = h.moves; out.min = lvd.min;
      out.stars = h.moves <= Math.ceil(lvd.min * 1.3) ? 3 : (h.moves <= lvd.min * 2 ? 2 : 1);
      if (!h.best[id] || h.moves < h.best[id]) h.best[id] = h.moves;
      h.solves++;
      out.rewards = [];
      if (first) out.rewards = out.rewards.concat(G.grant(G.hrdFirstReward(h.lv)));
      if (G.ticket('hrd').ready) { G.useTicket('hrd'); out.rewards = out.rewards.concat(G.grant(G.hrdDailyReward())); out.daily = true; }
      out.first = first;
      G.log('華容道「' + lvd.name + '」' + h.moves + ' 步破解', 'sys');
    }
    G.commit(); return ok(out);
  };
  G.hrdUndo = function () {
    var h = G.hrd(); if (!h.hist.length) return fail('沒有可以還原的步數');
    if (G.hrdSolved(h.cur)) return fail('已經破解');
    var x = h.hist.pop(), p = h.cur[x[0]]; p.r = x[1]; p.c = x[2]; h.moves++; // 悔棋也算一步
    G.commit(); return ok();
  };
  G.hrdReset = function () { return G.hrdStart(G.hrd().lv); };

  // =================== 觀星台 ===================
  // P2：沒有每日次數。每贏 5 場可免費觀星 1 次，其餘每次 10 金。星運持續 20 場虛空之門勝利，期間取最好的一次（D）。
  G.STAR_NAMES = ['天樞', '天璇', '天璣', '天權', '玉衡', '開陽', '搖光'];
  G.STAR_LUCK = [
    { id: 'daji', name: '大吉', w: 8, exp: 20, poem: '紫微高照，所向披靡。' },
    { id: 'zhongji', name: '中吉', w: 22, exp: 12, poem: '將星明亮，宜出征。' },
    { id: 'xiaoji', name: '小吉', w: 35, exp: 8, poem: '雲開見月，步步為營。' },
    { id: 'ping', name: '平', w: 25, exp: 5, poem: '星象平穩，勤練不輟。' },
    { id: 'moji', name: '末吉', w: 10, exp: 3, poem: '晦中有明，厚積薄發。' }
  ];
  G.STAR_MAX = 3; G.STAR_GOLD = 10;
  G.STAR_LAST = 20;
  function starDay() { var x = Q().star; if (x.luckLeft == null) x.luckLeft = x.luck && x.day === today() ? G.STAR_LAST : 0; if (x.luckLeft <= 0) x.luck = null; return x; }
  G.starState = function () { var x = starDay(), fr = G.ticket('star').ready; return { draws: x.draws, left: Infinity, free: fr, cost: fr ? 0 : G.STAR_GOLD, luck: x.luck ? G.starLuck(x.luck) : null, luckLeft: x.luckLeft, last: x.last, winsLeft: G.ticket('star').left }; };
  G.starLuck = function (id) { return U.find(G.STAR_LUCK, function (l) { return l.id === id; }); };
  G.starReward = function (l) {
    var k = G.STAR_LUCK.indexOf(l), L = lvl();
    var rw = { silver: (5 - k) * 100 * L, items: [] };
    if (k <= 1) rw.items.push({ item: 'peiyangdan', n: 3 - k });
    if (k === 0) rw.gold = 20;
    rw.items.push({ item: ['jinengshu', 'xilianshi', 'xinfacanye', 'huafei', 'jinglitang'][k], n: 1 });
    return rw;
  };
  G.starDraw = function (starIdx, rng) {
    if (!G.qiyuOpen()) return fail('主角 ' + G.QIYU_OPEN + ' 級開放');
    var x = starDay(), s = st();
    var free = G.ticket('star').ready, cost = free ? 0 : G.STAR_GOLD;
    if (s.player.gold < cost) return fail('金幣不足（需要 ' + cost + '）');
    if (free) G.useTicket('star'); else s.player.gold -= cost;
    var tot = 0, r, l = null; U.each(G.STAR_LUCK, function (a) { tot += a.w; });
    r = rnd(rng) * tot; U.each(G.STAR_LUCK, function (a) { if (!l) { r -= a.w; if (r < 0) l = a; } }); l = l || G.STAR_LUCK[G.STAR_LUCK.length - 1];
    x.draws++; x.total++;
    var prev = x.luck ? G.starLuck(x.luck) : null;
    if (!prev || l.exp > prev.exp) x.luck = l.id;
    x.luckLeft = G.STAR_LAST;
    var rewards = G.grant(G.starReward(l));
    x.last = { star: G.STAR_NAMES[starIdx] || G.STAR_NAMES[0], luck: l.id };
    G.log('觀星台：' + x.last.star + '星 ' + l.name, 'sys');
    G.commit();
    return ok({ luck: l, star: x.last.star, rewards: rewards, cost: cost, todayLuck: G.starLuck(x.luck) });
  };
  G.starExpBonus = function () { var s = st(); if (!s || !s.qiyu) return 0; var x = s.qiyu.star; if (!x.luck || !(x.luckLeft > 0)) return 0; var l = G.starLuck(x.luck); return l ? l.exp : 0; };
  // 虛空之門勝利時套用星運經驗加成
  var fight0 = G.fight;
  G.fight = function (id, seed) {
    var out = fight0.apply(G, arguments);
    if (out && out.win && out.exp) {
      var pct = G.starExpBonus();
      if (pct > 0) {
        var extra = Math.floor(out.exp * pct / 100);
        if (extra > 0) { U.each(G.teamList(), function (x) { G.addExp(x.hero, extra); }); out.starExp = extra; out.starPct = pct; }
        var sx = st().qiyu.star; sx.luckLeft--; if (sx.luckLeft <= 0) sx.luck = null; G.commit();
      }
    }
    return out;
  };

  // =================== 玄機盤 ===================
  // 12 格轉盤；每贏 5 場可免費轉 1 次（P2，不看日期），其餘花銀幣（隨主角等級）。保底：連續 10 次沒有轉到「玄機大獎」，第 10 次必中。
  G.WHEEL = [
    { id: 'big', name: '玄機大獎', w: 2, rw: function (L) { return { gold: 100, items: [{ item: 'gem_atk_3', n: 1 }, { item: 'shenjishu', n: 1 }] }; } },
    { id: 'gold', name: '金幣 30', w: 6, rw: function () { return { gold: 30 }; } },
    { id: 'silverL', name: '大筆銀幣', w: 8, rw: function (L) { return { silver: 1500 * L }; } },
    { id: 'silverS', name: '銀幣', w: 16, rw: function (L) { return { silver: 400 * L }; } },
    { id: 'energy', name: '小銀袋 ×2', w: 10, rw: function () { return { items: [{ item: 'jinglitang', n: 2 }] }; } },
    { id: 'book', name: '技能書 ×2', w: 10, rw: function () { return { items: [{ item: 'jinengshu', n: 2 }] }; } },
    { id: 'pill', name: '培養丹 ×5', w: 10, rw: function () { return { items: [{ item: 'peiyangdan', n: 5 }] }; } },
    { id: 'stone', name: '洗煉石 ×2', w: 9, rw: function () { return { items: [{ item: 'xilianshi', n: 2 }] }; } },
    { id: 'gem', name: '2 級寶石', w: 7, rw: function (L, rng) { var k = ['atk', 'hp', 'pdef', 'mdef', 'jdef', 'crit'][Math.floor(rnd(rng) * 6)]; return { items: [{ item: 'gem_' + k + '_2', n: 1 }] }; } },
    { id: 'page', name: '心法殘頁 ×3', w: 8, rw: function () { return { items: [{ item: 'xinfacanye', n: 3 }] }; } },
    { id: 'token', name: '突飛令', w: 6, rw: function () { return { items: [{ item: 'tufeiling', n: 1 }] }; } },
    { id: 'seed', name: '靈石花種 ×2', w: 8, rw: function () { return { items: [{ item: 'seed_gem', n: 2 }] }; } }
  ];
  G.WHEEL_PITY = 10;
  function wheelDay() { var w = Q().wheel; w.free = G.ticket('wheel').ready ? 1 : 0; return w; }
  G.wheelCost = function () { return 500 + 100 * lvl(); };
  G.wheelState = function () { var w = wheelDay(); return { free: w.free > 0, cost: w.free > 0 ? 0 : G.wheelCost(), pity: w.pity, pityLeft: G.WHEEL_PITY - w.pity, spins: w.spins, last: w.last }; };
  G.wheelOdds = function () { var tot = 0; U.each(G.WHEEL, function (a) { tot += a.w; }); return U.map(G.WHEEL, function (a) { return { id: a.id, name: a.name, pct: Math.round(a.w / tot * 1000) / 10 }; }); };
  G.wheelSpin = function (rng) {
    if (!G.qiyuOpen()) return fail('主角 ' + G.QIYU_OPEN + ' 級開放');
    var w = wheelDay(), s = st(), free = w.free > 0, cost = free ? 0 : G.wheelCost();
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    if (free) { w.free = 0; G.useTicket('wheel'); } else s.player.silver -= cost;
    var idx;
    if (w.pity >= G.WHEEL_PITY - 1) idx = 0;
    else { var tot = 0; U.each(G.WHEEL, function (a) { tot += a.w; }); var r = rnd(rng) * tot; idx = G.WHEEL.length - 1; for (var i = 0; i < G.WHEEL.length; i++) { r -= G.WHEEL[i].w; if (r < 0) { idx = i; break; } } }
    var pz = G.WHEEL[idx];
    w.pity = idx === 0 ? 0 : w.pity + 1; w.spins++; w.last = idx;
    var rewards = G.grant(pz.rw(lvl(), rng));
    G.log('玄機盤轉到「' + pz.name + '」', 'sys');
    G.commit();
    return ok({ idx: idx, prize: pz, rewards: rewards, cost: cost, free: free, pity: idx === 0 && w.spins > 0 });
  };
})(MJ.G);
