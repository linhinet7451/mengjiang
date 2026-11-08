/* P2 單機替代玩法：公會、銅雀台、除魔殿。原版線上社交／排行不冒充成真實伺服器。 */
(function (G) {
  var U = MJ.U;
  function st() { return MJ.S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function day() { return U.dayKey(); }
  MJ.S.extraDefaults = MJ.S.extraDefaults || [];
  MJ.S.extraDefaults.push(function (s) {
    s.p2Modes = s.p2Modes || {};
    s.p2Modes.guild = s.p2Modes.guild || { lv: 1, contrib: 0, donated: 0 };
    s.p2Modes.copper = s.p2Modes.copper || { day: '', claimed: false, total: 0 };
    s.p2Modes.exorcism = s.p2Modes.exorcism || { clears: 0, best: 0 };
  });
  G.p2ModeState = function () { var s = st(), p = s.p2Modes; if (p.copper.day !== day()) p.copper.day = day(), p.copper.claimed = false; return p; };
  G.guildDonate = function () { var s = st(), p = G.p2ModeState().guild, cost = 1000; if (s.player.silver < cost) return fail('銀幣不足（需要 ' + cost + '）'); s.player.silver -= cost; p.contrib += 100; p.donated++; if (p.contrib >= p.lv * 1000) p.lv++; G.commit(); return ok({ lv: p.lv, contrib: p.contrib, reward: '幫貢 +100' }); };
  G.copperClaim = function () { var s = st(), p = G.p2ModeState().copper; if (p.claimed) return fail('今日已領取，明日再來'); p.claimed = true; p.total++; var got = G.grant({ silver: 500 * G.lead().lv, items: [{ item: 'jinglitang', n: 1 }] }); G.commit(); return ok({ got: got }); };
  G.exorcismFight = function () { var s = st(), p = G.p2ModeState().exorcism, cost = 5; if ((s.player.energy || 0) < cost) return fail('精力不足（需要 ' + cost + '）'); s.player.energy -= cost; p.clears++; p.best = Math.max(p.best, p.clears); var got = G.grant({ exp: 20 * G.lead().lv, silver: 300 * G.lead().lv }); G.commit(); return ok({ got: got, clears: p.clears }); };
})(MJ.G);
