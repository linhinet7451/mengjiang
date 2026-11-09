/* 遊戲動作：所有會改變存檔的操作都在這裡，UI 只呼叫這些函式 */
MJ.G = (function () {
  var G = {}, U = MJ.U, R = MJ.R;
  var SLOTS = R.SLOTS; // 第二階段：6 部位（A：影片中裝備欄位多於 4 格；C：部位名稱）
  G.SLOTS = SLOTS;
  // P5：8 部位（pt12u 規格：武器、盔甲、披風、腰帶、帽子、玉墜、戒指、護手）
  G.SLOT_NAMES = { weapon: '武器', helm: '帽子', armor: '盔甲', cape: '披風', belt: '腰帶', ring: '戒指', jade: '玉墜', glove: '護手' };
  G.BAG_CAP = Infinity; // 包裹無上限（2026-11-05：永遠不會滿；舊版 60 格 D）
  G.TIANWANG = ['zhangjiao', 'qiuchuji', 'yuelingshan', 'luzhangke', 'huaxiong', 'caiwenji']; // B：六大天王

  G.initData = function () {
    var D = MJ.D;
    D.heroIndex = {}; U.each(D.heroes.list, function (h) { D.heroIndex[h.id] = h; });
    D.equipIndex = {}; U.each(D.equipment.list, function (e) { D.equipIndex[e.id] = e; });
    D.stageIndex = {}; U.each(D.stages.stages, function (s) { D.stageIndex[s.id] = s; });
    D.formIndex = {}; U.each(D.formations, function (f) { D.formIndex[f.id] = f; });
    // 原版考證表（src/data/provenance.json，可整檔替換；缺少時不影響遊戲）
    D.provIndex = {}; if (D.provenance && D.provenance.entries) U.each(D.provenance.entries, function (e) { D.provIndex[e.id] = e; });
  };
  function C() { return MJ.D.config; }
  function st() { return MJ.S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  G.lead = function (s) { s = s || st(); return U.find(s.heroes, function (h) { return h.id === 'lead'; }); };
  G.hero = function (uid, s) { s = s || st(); return U.find(s.heroes, function (h) { return h.uid === uid; }); };
  G.buildingOpen = function (key) {
    var b = C().buildings && C().buildings[key], state = st(), lead = G.lead();
    return !!b && !!lead && (lead.lv >= b.open || !!(state.buildingUnlocks && state.buildingUnlocks[key]));
  };
  G.nameOf = function (h) { return h.id === 'lead' ? st().player.name : R.heroDef(h.id).name; };
  G.log = function (text, kind) {
    var s = st(); s.log.unshift({ t: U.now(), text: text, k: kind || '' });
    if (s.log.length > 80) s.log.length = 80;
    G.chat(text);
  };
  G.chatLines = [];
  G.chat = function (text) { G.chatLines.unshift(text); if (G.chatLines.length > 6) G.chatLines.length = 6; if (G.onChat) G.onChat(); };
  G.commit = function () { MJ.S.save(false); if (G.onChange) G.onChange(); };

  // ---------- 新遊戲 ----------
  G.newGame = function (name, leadType, gender, seed) {
    var rng = U.rng(seed || (U.now() & 0x7fffffff));
    name = String(name || '').replace(/^\s+|\s+$/g, '').slice(0, 8) || '無名俠客';
    if (!C().leadTypes[leadType]) leadType = '力耐';
    var look = U.clone(MJ.D.heroes.lead.look);
    if (gender === 'f') { look.g = 'f'; look.hs = 'long'; look.cloth = '#ad1457'; look.trim = '#ffd54f'; }
    var s = {
      version: MJ.S.VERSION, created: U.now(),
      player: { name: name, gender: gender === 'f' ? 'f' : 'm', leadType: leadType, gold: 50, silver: 3000, energy: R.energyMax(1), energyTs: U.now(), look: look },
      heroes: [], team: { formation: 'fangyuan', cells: {} },
      bag: { stack: {}, equips: [] }, stages: {}, firstClaimed: {},
      recruit: { cands: [], normalUsed: 0, normalDay: U.dayKey(), cd: {}, firstDone: {} },
      buildings: { shenwu: 1, juxian: 1, xukong: 1 },
      training: null, mail: [], tasksClaimed: {}, gifts: { opening: false, sevenDay: [], lastDay: '' },
      stats: { recruits: 0, battles: 0, wins: 0 }, log: [], settings: { speed: 1, rotate: true, energyMode: 'original', musou: true },
      nextUid: 1, freeGiftTs: U.now()
    };
    MJ.S.state = s;
    MJ.S.applyDefaults(s);
    var lead = G.newHero('lead', s);
    s.heroes.push(lead);
    // B：新手教學贈送 2 名隨機六大天王
    var pool = G.TIANWANG.slice(), picks = [];
    while (picks.length < 2) { var i = Math.floor(rng() * pool.length); picks.push(pool.splice(i, 1)[0]); }
    U.each(picks, function (id) { s.heroes.push(G.newHero(id, s)); });
    s.team.cells = { 3: s.heroes[0].uid, 0: s.heroes[1].uid, 6: s.heroes[2].uid };
    // 新手白裝
    G.addEquip('wp1', 0, true); G.addEquip('ar1', 0, true);
    G.rerollCands('init', rng);
    G.log('歡迎來到猛將無雙！' + R.heroDef(picks[0]).name + '、' + R.heroDef(picks[1]).name + ' 前來投奔。', 'sys');
    s.mail.push({ id: 1, title: '江湖新人禮', text: '少俠初入江湖，略備薄禮。', att: { silver: 1000, items: [{ item: 'tufeiling', n: 2 }] }, read: false, claimed: false, t: U.now() });
    G.commit();
    return s;
  };

  G.newHero = function (id, s) {
    s = s || st();
    if (id !== 'lead') { s.codex = s.codex || {}; s.codex[id] = 1; }
    return { uid: s.nextUid++, id: id, lv: 1, exp: 0, eq: {}, sk: { a: 1, u: 1, p: 1 }, py: { str: 0, int: 0, agi: 0, con: 0 }, xf: [], star: 0, jxLevel: 0 };
  };

  // ---------- 精力（P2 起取消：規格書「完全取消精力」；存檔欄位保留但不再使用） ----------
  G.tick = function () {};

  // ---------- 歷練點：取代「現實時間／每日一次」的領取條件（D：本作改編，單機版不等待現實時間） ----------
  // 每項獎勵記住上次領取時的勝場數；再贏 every 場就能再領，不用等時間，也沒有每日上限
  G.TICKET = { free: 3, sign: 5, tower: 10, arena: 10, star: 5, wheel: 5, hrd: 5 };
  G.ticket = function (k) {
    var s = st(), every = G.TICKET[k] || 5; s.tickets = s.tickets || {};
    var last = s.tickets[k] == null ? -every : s.tickets[k], w = s.stats.wins || 0;
    return { ready: w - last >= every, left: Math.max(0, every - (w - last)), every: every };
  };
  G.useTicket = function (k) { var s = st(); s.tickets = s.tickets || {}; s.tickets[k] = s.stats.wins || 0; };

  // ---------- 包裹 ----------
  G.bagUsed = function () { var s = st(); return s.bag.equips.length + U.filter(U.keys(s.bag.stack), function (k) { return s.bag.stack[k] > 0 && k.indexOf('soul:') !== 0; }).length; };
  G.addEquip = function (t, q, silent) {
    var s = st(), e = { uid: s.nextUid++, t: t, q: q || 0, plus: 0, aff: [], gems: [] };
    if (G.bagUsed() >= G.BAG_CAP) { G.mailOverflow({ equips: [e] }); return e; }
    s.bag.equips.push(e);
    return e;
  };
  G.HONOR_PER_TOKEN = 50; // B：培養一次 50 榮譽；榮譽令＝舊「培養丹」，入袋即換成 50 榮譽（D）
  G.addItem = function (key, n) {
    var s = st();
    if (key === 'peiyangdan') { s.player.honor = (s.player.honor || 0) + n * G.HONOR_PER_TOKEN; return; }
    if (key.indexOf('soul:') !== 0 && !s.bag.stack[key] && G.bagUsed() >= G.BAG_CAP) { G.mailOverflow({ items: [{ item: key, n: n }] }); return; }
    s.bag.stack[key] = (s.bag.stack[key] || 0) + n;
  };
  G.mailOverflow = function (att) {
    var s = st();
    s.mail.push({ id: s.nextUid++, title: '包裹已滿', text: '包裹空間不足，物品已轉寄郵件。', att: att, read: false, claimed: false, t: U.now() });
  };
  G.itemName = function (key) {
    if (key.indexOf('soul:') === 0) { var d = R.heroDef(key.slice(5)); return (d ? d.name : '?') + '將魂'; }
    if (key.indexOf('eq:') === 0) { var t = R.equipTpl(key.slice(3)); return t ? t.name : key; }
    var it = MJ.D.equipment.items[key]; return it ? it.name : key;
  };
  // 發放獎勵 {gold, silver, items:[{item,n,q}]}，回傳文字列表
  G.grant = function (rw) {
    var s = st(), out = [];
    if (rw.gold) { s.player.gold += rw.gold; out.push('金幣 ×' + rw.gold); }
    if (rw.silver) { s.player.silver += rw.silver; out.push('銀幣 ×' + rw.silver); }
    if (rw.honor) { s.player.honor = (s.player.honor || 0) + rw.honor; out.push('榮譽 +' + rw.honor); }
    if (rw.energy) { var ev2 = rw.energy * 25; s.player.silver += ev2; out.push('銀幣 +' + U.fmt(ev2)); } // 精力已取消：舊資料的精力獎勵改給銀幣（D）
    U.each(rw.items || [], function (it) {
      if (it.item.indexOf('eq:') === 0) { G.addEquip(it.item.slice(3), it.q || 0); out.push(C().equipQualityNames[it.q || 0] + '·' + G.itemName(it.item)); }
      else if (it.item === 'peiyangdan') { G.addItem(it.item, it.n || 1); out.push('榮譽 +' + (it.n || 1) * G.HONOR_PER_TOKEN + '（榮譽令 ×' + (it.n || 1) + '）'); }
      else { G.addItem(it.item, it.n || 1); out.push(G.itemName(it.item) + ' ×' + (it.n || 1)); }
    });
    U.each(rw.equips || [], function (e) { if (G.bagUsed() < G.BAG_CAP) s.bag.equips.push(e); else G.mailOverflow({ equips: [e] }); out.push(G.itemName('eq:' + e.t)); });
    return out;
  };

  // ---------- 經驗 / 升級 ----------
  G.addExp = function (h, n) {
    var s = st(), lead = G.lead(), ups = 0;
    if (h.lv >= R.maxLevel) return 0;
    h.exp += n;
    while (h.exp >= R.expNeed(h.lv) && h.lv < R.maxLevel) {
      if (h.id !== 'lead' && h.lv >= lead.lv) { h.exp = Math.min(h.exp, R.expNeed(h.lv) - 1); break; } // B：武將不可超過主角等級
      h.exp -= R.expNeed(h.lv); h.lv++; ups++;
      if (h.id === 'lead') G.log('主角升到 ' + h.lv + ' 級！', 'lv');
    }
    return ups;
  };

  // ---------- 陣容 ----------
  G.formation = function () { return MJ.D.formIndex[st().team.formation] || MJ.D.formations[0]; };
  G.teamList = function () {
    var s = st(), out = [];
    U.each(U.keys(s.team.cells), function (c) { var h = G.hero(s.team.cells[c]); if (h) out.push({ cell: +c, hero: h }); });
    out.sort(function (a, b) { return a.cell - b.cell; });
    return out;
  };
  // 第二階段：上陣人數超過陣法格數時開放全部 9 格（A：後期 9 人上陣；D：解鎖方式）
  G.openCells = function () {
    var f = G.formation();
    return R.teamSlots(G.lead().lv) > f.cells.length ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : f.cells;
  };
  G.inTeam = function (uid) { var s = st(); return U.find(U.keys(s.team.cells), function (c) { return s.team.cells[c] === uid; }); };
  G.teamCount = function () { return G.teamList().length; };
  G.setCell = function (cell, uid) {
    var s = st(), f = G.formation();
    if (G.openCells().indexOf(cell) < 0) return fail('此陣法不開放這個位置');
    var h = G.hero(uid); if (!h) return fail('找不到武將');
    var cur = G.inTeam(uid);
    if (cur != null) delete s.team.cells[cur];
    var occupant = s.team.cells[cell];
    if (occupant && cur != null) s.team.cells[cur] = occupant; // 互換
    else if (!occupant && cur == null && G.teamCount() >= R.teamSlots(G.lead().lv)) return fail('出戰人數已達上限（' + R.teamSlots(G.lead().lv) + ' 人）');
    s.team.cells[cell] = uid;
    G.commit(); return ok();
  };
  G.addToTeam = function (uid) {
    var f = G.formation(), s = st();
    if (G.inTeam(uid) != null) return fail('已在陣中');
    if (G.teamCount() >= R.teamSlots(G.lead().lv)) return fail('出戰人數已達上限（' + R.teamSlots(G.lead().lv) + ' 人）');
    var free = U.find(G.openCells(), function (c) { return !s.team.cells[c]; });
    if (free == null) return fail('陣法沒有空位');
    return G.setCell(free, uid);
  };
  G.removeFromTeam = function (uid) {
    var s = st(), c = G.inTeam(uid);
    if (c == null) return fail('不在陣中');
    if (G.hero(uid).id === 'lead') return fail('主角必須出戰');
    delete s.team.cells[c]; G.commit(); return ok();
  };
  G.setFormation = function (fid) {
    var s = st(), f = MJ.D.formIndex[fid]; if (!f) return fail('未知陣法');
    if (f.open && G.lead().lv < f.open) return fail('主角 ' + f.open + ' 級開放此陣法');
    // 修正（Tomas 2026-11-04 回報：換陣法後角色不換位、進虛空之門也沒換）：
    // 舊版只把「新陣法不開放的格子」上的人移走；但八個陣法彼此有 7～8 格重疊，所以幾乎沒有人會動，戰鬥（讀 team.cells）也就維持舊站位。
    // 現在：依舊陣法的格位順序排出隊伍順序，再依新陣法的格位順序（formations.json cells，D：本作設定的陣形順序）重新排入，武將跟著陣形換位。
    var old = G.formation(), oldCells = (old && old.cells) || [], list = G.teamList();
    if (old && old.id === fid) { G.commit(); var o0 = ok(); o0.moved = []; return o0; }
    var rank = function (c) { var k = oldCells.indexOf(c); return k < 0 ? 100 + c : k; };
    list = list.slice().sort(function (a, b) { return rank(a.cell) - rank(b.cell); });
    s.team.formation = fid; s.team.cells = {};
    var nc = f.cells || [], moved = [], i2 = 0;
    U.each(list, function (x) {
      while (i2 < nc.length && s.team.cells[nc[i2]]) i2++;
      var c = i2 < nc.length ? nc[i2] : null;
      if (c == null) return;
      s.team.cells[c] = x.hero.uid; i2++;
      if (c !== x.cell) moved.push(G.nameOf ? G.nameOf(x.hero) : x.hero.name);
    });
    G.commit(); var o = ok(); o.moved = moved; return o;
  };

  // ---------- 聚賢莊 ----------
  G.recruitKinds = ['normal', 'baijin', 'zijin', 'zhizun'];
  G.rerollCands = function (kind, rng) {
    var s = st(), cfg = C().recruit[kind === 'init' ? 'normal' : kind];
    rng = rng || U.rng((U.now() ^ (s.nextUid * 7919)) >>> 0);
    var owned = {}; U.each(s.heroes, function (h) { owned[h.id] = 1; });
    var out = [], used = {};
    for (var i = 0; i < 4; i++) {
      var q = U.pickWeighted(cfg.odds, rng());
      if (i === 0 && cfg.firstMin && !s.recruit.firstDone[kind]) q = Math.max(q, cfg.firstMin); // B：首次紫金/至尊保底
      var pool = [];
      for (var qq = q; qq >= 0 && !pool.length; qq--) {
        pool = U.filter(MJ.D.heroes.list, function (h) { return h.quality === qq && !owned[h.id] && !used[h.id]; });
      }
      if (!pool.length) break;
      var pick = pool[Math.floor(rng() * pool.length)];
      used[pick.id] = 1; out.push(pick.id);
    }
    if (cfg.firstMin) s.recruit.firstDone[kind] = true;
    s.recruit.cands = out;
    return out;
  };
  G.recruitStatus = function (kind) {
    // P2：沒有冷卻、沒有每日次數；普通免費，白金／紫金／至尊每次付金幣（Tomas 決定，本作改編）
    var cfg = C().recruit[kind];
    return { cfg: cfg, cdLeft: 0, left: null, cost: cfg ? (cfg.cost || 0) : 0 };
  };
  G.refresh = function (kind, payGold) {
    var s = st(), stt = G.recruitStatus(kind);
    if (!stt.cfg) return fail('未知刷新方式');
    var cost = stt.cost;
    if (s.player.gold < cost) return fail('金幣不足（' + stt.cfg.name + '每次 ' + cost + ' 金）');
    s.player.gold -= cost;
    G.rerollCands(kind);
    G.commit();
    return ok({ cost: cost, cands: s.recruit.cands });
  };
  G.recruitCost = function (id) { return C().recruitCost[R.heroDef(id).quality]; };
  G.recruit = function (id) {
    var s = st(), def = R.heroDef(id);
    if (!def || s.recruit.cands.indexOf(id) < 0) return fail('此武將不在拜訪名單中');
    if (U.find(s.heroes, function (h) { return h.id === id; })) return fail('已擁有此武將');
    if (s.heroes.length >= R.rosterCap(s)) return fail('武將數已滿（' + s.heroes.length + '/' + R.rosterCap(s) + '），請先解僱，或到聚賢莊「我的武將」分頁升級聚賢莊');
    var cost = G.recruitCost(id);
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    s.player.silver -= cost;
    var h = G.newHero(id, s);
    s.heroes.push(h);
    s.recruit.cands.splice(s.recruit.cands.indexOf(id), 1);
    s.stats.recruits++;
    G.log('你在聚賢莊招募了【' + C().qualityNames[def.quality] + '】' + def.name + '！', 'recruit');
    G.commit();
    return ok({ hero: h });
  };
  G.dismiss = function (uid) {
    var s = st(), h = G.hero(uid);
    if (!h) return fail('找不到武將');
    if (h.id === 'lead') return fail('主角不能解僱');
    var def = R.heroDef(h.id), n = C().dismissSouls[def.quality];
    // 卸下裝備回包裹
    U.each(SLOTS, function (sl) { if (h.eq[sl]) { if (G.bagUsed() < G.BAG_CAP) s.bag.equips.push(h.eq[sl]); else G.mailOverflow({ equips: [h.eq[sl]] }); } });
    var c = G.inTeam(uid); if (c != null) delete s.team.cells[c];
    s.heroes.splice(s.heroes.indexOf(h), 1);
    if (s.training && s.training.uid === uid) s.training = null;
    if (n > 0) G.addItem('soul:' + h.id, n);
    G.log('解僱了 ' + def.name + (n > 0 ? '，獲得將魂 ×' + n + '。' : '。黑色武將不能遣散成將魂（B：攻略）。'), 'sys');
    G.commit();
    return ok({ souls: n });
  };
  G.summon = function (id) {
    var s = st(), def = R.heroDef(id), have = s.bag.stack['soul:' + id] || 0;
    if (!def) return fail('未知武將');
    if (U.find(s.heroes, function (h) { return h.id === id; })) return fail('已擁有此武將');
    if (have < def.souls) return fail('將魂不足（' + have + '/' + def.souls + '）');
    if (s.heroes.length >= R.rosterCap(s)) return fail('武將數已滿（' + s.heroes.length + '/' + R.rosterCap(s) + '），請先解僱或升級聚賢莊');
    s.bag.stack['soul:' + id] = have - def.souls;
    if (!s.bag.stack['soul:' + id]) delete s.bag.stack['soul:' + id];
    s.heroes.push(G.newHero(id, s));
    G.log('以將魂召喚了 ' + def.name + '！', 'recruit');
    G.commit(); return ok();
  };

  // ---------- 裝備 ----------
  G.equip = function (heroUid, equipUid) {
    var s = st(), h = G.hero(heroUid);
    var e = U.find(s.bag.equips, function (x) { return x.uid === equipUid; });
    if (!h || !e) return fail('找不到武將或裝備');
    var tpl = R.equipTpl(e.t);
    if (h.lv < tpl.lv) return fail('需要等級 ' + tpl.lv);
    s.bag.equips.splice(s.bag.equips.indexOf(e), 1);
    var old = h.eq[tpl.slot];
    h.eq[tpl.slot] = e;
    if (old) s.bag.equips.push(old);
    G.commit(); return ok({ old: old });
  };
  G.unequip = function (heroUid, slot) {
    var s = st(), h = G.hero(heroUid);
    if (!h || !h.eq[slot]) return fail('此部位沒有裝備');
    if (G.bagUsed() >= G.BAG_CAP) return fail('包裹已滿');
    s.bag.equips.push(h.eq[slot]); delete h.eq[slot];
    G.commit(); return ok();
  };
  G.autoEquip = function (heroUid) { // 「最強」按鈕
    var s = st(), h = G.hero(heroUid), changed = 0;
    if (!h) return fail('找不到武將');
    var d = R.derived(h, s);
    U.each(SLOTS, function (slot) {
      var best = h.eq[slot], bestScore = best ? R.equipScore(best) : -1;
      U.each(s.bag.equips, function (e) {
        var tpl = R.equipTpl(e.t);
        if (tpl.slot !== slot || tpl.lv > h.lv) return;
        if (slot === 'weapon') { var wk = { p: 'patk', m: 'matk', j: 'jatk' }[d.dtype]; if (!tpl.stats[wk]) return; }
        var sc = R.equipScore(e);
        if (sc > bestScore) { best = e; bestScore = sc; }
      });
      if (best && best !== h.eq[slot]) {
        s.bag.equips.splice(s.bag.equips.indexOf(best), 1);
        if (h.eq[slot]) s.bag.equips.push(h.eq[slot]);
        h.eq[slot] = best; changed++;
      }
    });
    G.commit(); return ok({ changed: changed });
  };
  G.sellEquip = function (uid) {
    var s = st(), e = U.find(s.bag.equips, function (x) { return x.uid === uid; });
    if (!e) return fail('找不到裝備');
    var p = R.equipSell(e); s.bag.equips.splice(s.bag.equips.indexOf(e), 1); s.player.silver += p;
    G.commit(); return ok({ silver: p });
  };

  // ---------- 道具 ----------
  G.useItem = function (key, heroUid) {
    var s = st(), it = MJ.D.equipment.items[key];
    if (!it || !s.bag.stack[key]) return fail('沒有這個道具');
    var u = it.use, msg = '';
    if (u.energy) { s.player.energy += u.energy; msg = '精力 +' + u.energy; }
    else if (u.silver) { s.player.silver += u.silver; msg = '銀幣 +' + u.silver; }
    else if (u.heroExp) {
      var h = G.hero(heroUid);
      if (!h) return fail('請選擇武將');
      if (h.id === 'lead') return fail('突飛令不能對主角使用');
      var lead = G.lead();
      if (h.lv >= lead.lv && h.exp >= R.expNeed(h.lv) - 1) return fail('武將等級不能超過主角');
      var n = h.lv * u.heroExp; G.addExp(h, n); msg = G.nameOf(h) + ' 經驗 +' + n;
    }
    s.bag.stack[key]--; if (!s.bag.stack[key]) delete s.bag.stack[key];
    G.commit(); return ok({ msg: msg });
  };

  // ---------- 商城 ----------
  G.buy = function (sid) {
    var s = st(), e = U.find(MJ.D.shop, function (x) { return x.id === sid; });
    if (!e) return fail('商品不存在');
    var cur = e.price.silver ? 'silver' : 'gold', p = e.price[cur];
    if (s.player[cur] < p) return fail((cur === 'silver' ? '銀幣' : '金幣') + '不足');
    if (G.bagUsed() >= G.BAG_CAP && (e.item.indexOf('eq:') === 0 || !s.bag.stack[e.item])) return fail('包裹已滿');
    s.player[cur] -= p;
    var got = G.grant({ items: [{ item: e.item, q: e.q, n: e.n || 1 }] });
    G.commit(); return ok({ got: got });
  };

  // ---------- 虛空之門 ----------
  G.stageState = function (id) { return st().stages[id] || { stars: 0, clears: 0 }; };
  G.chapterUnlocked = function (ch) {
    var c = U.find(MJ.D.stages.chapters, function (x) { return x.id === ch; });
    return c && G.lead().lv >= c.lv && G.stageUnlocked('s' + ch + '_1', true);
  };
  G.stageUnlocked = function (id, skipCh) {
    var sg = MJ.D.stageIndex[id]; if (!sg) return false;
    if (!skipCh && !G.chapterUnlocked(sg.ch)) return false;
    if (!sg.unlock) return true;
    if (sg.unlock === 'all3star') {
      return U.filter(MJ.D.stages.stages, function (x) { return x.ch === sg.ch && x.kind !== 'hidden' && G.stageState(x.id).stars >= 3; }).length === 8;
    }
    return G.stageState(sg.unlock).clears > 0;
  };
  G.lockReason = function (id) {
    var sg = MJ.D.stageIndex[id], c = U.find(MJ.D.stages.chapters, function (x) { return x.id === sg.ch; });
    if (G.lead().lv < c.lv) return '需要主角等級 ' + c.lv;
    if (sg.unlock === 'all3star') return '本章其他關卡全部三星後開啟';
    if (sg.unlock) return '需先通關「' + MJ.D.stageIndex[sg.unlock].name + '」';
    return '';
  };
  G.buildEnemy = function (sg) {
    return U.map(sg.enemies, function (e) { var u = R.enemyUnit(e, sg); u.honorFrame = e.honorFrame || null; return { cell: e.cell, unit: u }; });
  };
  G.buildTeam = function () {
    var s = st();
    return U.map(G.teamList(), function (x) { return { cell: x.cell, unit: R.heroUnit(x.hero, s) }; });
  };
  // ---------- WL-4 首領詞綴（D 級原創）----------
  // 待用戰鬥種子（執行期狀態，不寫入存檔）：詞綴由戰鬥種子派生，但種子在開戰那一刻才產生，
  // 關卡面板要戰前就顯示詞綴，所以開啟王關／隱藏關面板時先把「下一場的種子」定下來存在這裡，
  // 面板用同一顆種子算詞綴顯示，G.fight 開戰時用同一顆種子，顯示與實戰保證一致。
  // 只有王關／隱藏關面板會產生待用種子；直接呼叫 G.fight（重打、測試、平衡量測）時沒有待用種子，就照舊公式現場產生。
  G.pendingSeed = null;
  // 取某關的詞綴（回傳詞綴物件或 null；非王關／隱藏關一定回傳 null）。面板顯示用。
  G.stageAffix = function (id) {
    var sg = MJ.D.stageIndex[id];
    if (!sg || (sg.kind !== 'boss' && sg.kind !== 'hidden')) return null;
    if (!G.pendingSeed || G.pendingSeed.id !== id) {
      var s = st();
      G.pendingSeed = { id: id, seed: ((U.now() ^ (s.stats.battles * 2654435761)) >>> 0) || 1 };
    }
    return MJ.Battle.affixById(MJ.Battle.pickAffix(G.pendingSeed.seed));
  };
  // 把詞綴套到敵軍上（只動該關的首領本人，不動小兵；非王關／隱藏關不套用）。
  // forcedId 供單元測試與平衡量測指定詞綴；實戰不傳，由種子派生。
  // 立即生效的屬性（疾風敏捷、堅岩防禦）直接寫進單位數值；動態效果（嗜血、荊棘、狂怒）由 battle.js 讀 u.affix 生效。
  G.applyStageAffix = function (sg, foes, seed, forcedId) {
    if (!sg || (sg.kind !== 'boss' && sg.kind !== 'hidden')) return null;
    var affix = forcedId || MJ.Battle.pickAffix(seed);
    if (!MJ.Battle.affixById(affix)) return null;
    var lead = U.find(sg.enemies, function (e) { return e.leader; });
    if (!lead) return null;
    var foe = U.find(foes, function (f) { return f.cell === lead.cell; });
    if (!foe) return null;
    var u = foe.unit;
    u.affix = affix;
    // 疾風：敏捷 +30%（絕技攻防由敏捷衍生，一併 +30%，否則敏捷在戰鬥中不起作用；先手由 battle.js 行動順序處理）
    if (affix === 'swift') { u.agi = Math.floor(u.agi * 1.3); u.jatk = Math.floor(u.jatk * 1.3); u.jdef = Math.floor(u.jdef * 1.3); }
    // 堅岩：物防法防 +20%
    if (affix === 'rock') { u.pdef = Math.floor(u.pdef * 1.2); u.mdef = Math.floor(u.mdef * 1.2); }
    return affix;
  };
  G.fight = function (id, seed) {
    var s = st(), sg = MJ.D.stageIndex[id];
    if (!sg) return fail('關卡不存在');
    if (!G.stageUnlocked(id)) return fail('關卡未解鎖：' + G.lockReason(id));
    if (!G.teamCount()) return fail('沒有出戰武將');
    // 明確傳入的種子優先；否則用面板先定下的待用種子（同一關才用，用完清除）；都沒有才現場產生。
    if (!seed && G.pendingSeed && G.pendingSeed.id === id) { seed = G.pendingSeed.seed; G.pendingSeed = null; }
    seed = seed || ((U.now() ^ (s.stats.battles * 2654435761)) >>> 0) || 1;
    var team = G.buildTeam(), foes = G.buildEnemy(sg);
    var affix = G.applyStageAffix(sg, foes, seed);
    // D（原創防卡關）：越戰越勇——同一關每連敗一次，我方生命與攻擊 +8%，最多 +80%，通關後歸零
    var morale = R.moraleBonus(G.stageState(id).fails || 0);
    if (morale > 0) U.each(team, function (t) { var u = t.unit; u.hp = Math.round(u.hp * (1 + morale)); u.patk = Math.round(u.patk * (1 + morale)); u.matk = Math.round(u.matk * (1 + morale)); u.jatk = Math.round(u.jatk * (1 + morale)); });
    var res = MJ.Battle.run(team, foes, { seed: seed, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression, fieldItems: sg.fieldItems || [] });
    s.stats.battles++;
    var out = { win: res.win, battle: res, stage: sg, team: team, foes: foes, rewards: [], levelUps: [], seed: seed, energyCost: 0, morale: morale, affix: affix };
    var lead = G.lead();
    if (res.win) {
      s.stats.wins++;
      var stars = res.deadA === 0 ? 3 : (res.deadA === 1 ? 2 : 1); // D：星級規則
      var ss = s.stages[id] || { stars: 0, clears: 0 };
      var first = ss.clears === 0;
      ss.clears++; ss.stars = Math.max(ss.stars, stars); ss.fails = 0; s.stages[id] = ss;
      out.stars = stars; out.first = first;
      var rng = U.rng(seed ^ 0x5bd1e995);
      var rw = { silver: Math.floor(sg.silver * (G.econ ? G.econ().reward : 1)), items: [] };
      U.each(sg.drops, function (d) { if (rng() < d.chance) rw.items.push({ item: d.item, q: d.q, n: d.n }); });
      out.rewards = G.grant(rw);
      if (first && !s.firstClaimed[id]) {
        s.firstClaimed[id] = true;
        out.firstRewards = G.grant(sg.first);
      }
      // 經驗：全隊獲得（含陣亡）
      U.each(G.teamList(), function (x) {
        var before = x.hero.lv; G.addExp(x.hero, sg.exp);
        if (x.hero.lv > before) out.levelUps.push(G.nameOf(x.hero) + ' Lv' + before + '→' + x.hero.lv);
      });
      out.exp = sg.exp;
      G.log('通關「' + sg.name + '」' + stars + '星' + (first ? '（首通）' : ''), 'battle');
    } else {
      var fs = s.stages[id] || { stars: 0, clears: 0 }; fs.fails = (fs.fails || 0) + 1; s.stages[id] = fs;
      out.nextMorale = R.moraleBonus(fs.fails);
      G.log('挑戰「' + sg.name + '」失敗' + (res.timeout ? '（超過 ' + C().maxRounds + ' 回合）' : ''), 'battle');
    }
    G.commit();
    return ok(out);
  };

  // ---------- 訓練（神武殿） ----------
  G.trainRate = function (h) { return Math.floor((h.lv * 2 + 4) * (1 + 0.1 * ((st().buildings.shenwu || 1) - 1))); }; // D：每分鐘經驗
  // P2：訓練改成「付銀幣立即完成」，一次等於原本 60 分鐘的經驗，可重複；不再等現實時間（D）
  G.TRAIN_MIN = 60;
  G.trainCost = function (h) { return 100 + h.lv * 20; }; // D
  G.trainNow = function (uid) {
    var s = st(), h = G.hero(uid); if (!h) return fail('找不到武將');
    if (h.lv >= R.maxLevel) return fail('已達等級上限');
    if (h.id !== 'lead' && h.lv >= G.lead().lv && h.exp >= R.expNeed(h.lv) - 1) return fail('武將等級不能超過主角');
    var cost = G.trainCost(h);
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    s.player.silver -= cost;
    var n = G.TRAIN_MIN * G.trainRate(h), b = h.lv; G.addExp(h, n);
    G.commit(); return ok({ exp: n, cost: cost, name: G.nameOf(h), up: h.lv > b ? h.lv : 0 });
  };
  G.startTrain = function (uid) { return G.trainNow(uid); };
  G.trainGain = function () { return 0; };
  G.stopTrain = function () { var s = st(); if (!s.training) return fail('沒有訓練中的武將'); s.training = null; G.commit(); return ok({ exp: 0, name: '' }); };

  // ---------- 建築升級 ----------
  G.buildingCost = function (k, lv) { return Math.floor(500 * lv * lv); }; // D
  // 聚賢莊升級（Tomas 2026-11-04 回報：聚賢莊 Lv1 武將數 5/5 卡住、畫面沒有升級按鈕）
  // B（S1 sn41）：「建築升級可以提升武將欄位」；每級 +1 欄、費用 500×Lv² 銀、不能超過主角等級為本作設計（D）。
  // 引擎早就有 G.upgradeBuilding('juxian') 與 R.rosterCap，只是聚賢莊畫面沒放按鈕。
  G.buildingCheck = function (k) {
    var s = st(), lv = s.buildings[k] || 1, bc = C().buildings[k], cost = G.buildingCost(k, lv);
    var why = !bc || bc.phase || k === 'xukong' ? '此建築不能升級' : (bc.open && G.lead().lv < bc.open) ? '主角 ' + bc.open + ' 級開放' :
      lv >= G.lead().lv ? '需要主角 Lv' + (lv + 1) + '（建築等級不能超過主角等級）' : s.player.silver < cost ? '銀幣不足（需要 ' + U.fmt(cost) + '）' : '';
    return { lv: lv, next: lv + 1, cost: cost, needLead: lv + 1, ok: !why, why: why };
  };
  G.juxianInfo = function () {
    var s = st(), c = G.buildingCheck('juxian'), cap = R.rosterCap(s);
    c.cap = cap; c.nextCap = cap + 1; c.heroes = s.heroes.length; return c;
  };
  G.upgradeBuilding = function (k) {
    var s = st(), lv = s.buildings[k] || 1;
    var bc = C().buildings[k];
    if (!bc || bc.phase || k === 'xukong') return fail('此建築不能升級');
    if (bc.open && G.lead().lv < bc.open) return fail('主角 ' + bc.open + ' 級開放');
    if (lv >= G.lead().lv) return fail('建築等級不能超過主角等級');
    var cost = G.buildingCost(k, lv);
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    s.player.silver -= cost; s.buildings[k] = lv + 1;
    G.log(C().buildings[k].name + ' 升到 ' + (lv + 1) + ' 級', 'sys');
    G.commit(); return ok();
  };

  // ---------- 禮包 / 任務 / 郵件 ----------
  // P2：免費禮物不再每 30 分鐘一次，改成每贏 3 場可領一次（D）
  G.freeGiftLeft = function () { return 0; };
  G.freeGiftState = function () { return G.ticket('free'); };
  G.claimFreeGift = function () {
    var s = st(), t = G.ticket('free'); if (!t.ready) return fail('再贏 ' + t.left + ' 場戰鬥就能領取');
    G.useTicket('free');
    var got = G.grant({ silver: 200 + G.lead().lv * 20, items: Math.random() < 0.3 ? [{ item: 'jinglitang', n: 1 }] : [] });
    G.commit(); return ok({ got: got });
  };
  G.claimOpening = function () { // B：首日送藍裝一套與 50 金
    var s = st(); if (s.gifts.opening) return fail('已領取');
    s.gifts.opening = true;
    var got = G.grant({ gold: 50, items: [{ item: 'eq:wp1', q: 2 }, { item: 'eq:ar1', q: 2 }, { item: 'eq:cp1', q: 2 }, { item: 'eq:bt1', q: 2 }] });
    G.commit(); return ok({ got: got });
  };
  G.SEVEN = [{ silver: 1000 }, { gold: 20 }, { items: [{ item: 'dabuwan', n: 1 }] }, { silver: 3000 }, { items: [{ item: 'tufeiling', n: 3 }] }, { gold: 50 }, { items: [{ item: 'eq:wp6', q: 3 }] }]; // D
  G.sevenDayState = function () {
    // P2：七日禮包不用等七天，七份可以依序立即領取（D）
    var s = st(), days = s.gifts.sevenDay.length;
    return { claimed: days, canClaim: days < 7 };
  };
  G.claimSevenDay = function () {
    var s = st(), x = G.sevenDayState(); if (!x.canClaim) return fail('七日禮包已全部領取');
    s.gifts.sevenDay.push(U.dayKey()); s.gifts.lastDay = U.dayKey();
    var got = G.grant(G.SEVEN[x.claimed]); G.commit(); return ok({ got: got, day: x.claimed + 1 });
  };
  G.taskDone = function (t) {
    var s = st(), c = t.cond;
    if (c.recruits) return s.stats.recruits >= c.recruits;
    if (c.team) return G.teamCount() >= c.team;
    if (c.clear) return G.stageState(c.clear).clears > 0;
    if (c.level) return G.lead().lv >= c.level;
    if (c.heroes) return s.heroes.length >= c.heroes;
    if (c.equipped) return !!U.find(s.heroes, function (h) { return U.keys(h.eq).length >= c.equipped; });
    return false;
  };
  G.claimTask = function (id) {
    var s = st(), t = U.find(MJ.D.tasks, function (x) { return x.id === id; });
    if (!t) return fail('任務不存在'); if (s.tasksClaimed[id]) return fail('已領取');
    if (!G.taskDone(t)) return fail('任務尚未完成');
    s.tasksClaimed[id] = true; var got = G.grant(t.reward); G.commit(); return ok({ got: got });
  };
  G.claimMail = function (id) {
    var s = st(), m = U.find(s.mail, function (x) { return x.id === id; });
    if (!m) return fail('郵件不存在'); if (m.claimed) return fail('已領取');
    if (m.att && (m.att.equips || (m.att.items && m.att.items.length)) && G.bagUsed() >= G.BAG_CAP) return fail('包裹已滿');
    m.claimed = true; m.read = true; var got = m.att ? G.grant(m.att) : [];
    G.commit(); return ok({ got: got });
  };
  G.claimAllMail = function () {
    var s = st(), got = [], n = 0, skipped = 0;
    U.each(s.mail.slice(), function (m) {
      if (m.claimed || !m.att) return;
      var r = G.claimMail(m.id);
      if (r && r.ok !== false && r.got) { n++; got = got.concat(r.got); } else skipped++;
    });
    if (!n) return fail(skipped ? '包裹已滿，無法領取附件' : '沒有可領取的郵件');
    return ok({ got: got, n: n, skipped: skipped });
  };
  return G;
})();
