/* 原版還原 P4（存檔 v7）：16 種被動技能（後天習得被動欄）、狀態抵抗／負面狀態施加機率／PVP／PVE 傷害、戰報版本。
   資料分級：A＝官方畫面 B＝攻略 C＝推論 D＝本作自訂。新被動名稱為 B，數值皆為 D（暫定）。 */
(function (G) {
  var U = MJ.U, R = MJ.R, S = MJ.S;
  function st() { return S.state; }
  function C() { return MJ.D.config; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function have(k) { return st().bag.stack[k] || 0; }
  function take(k, n) { var s = st(); s.bag.stack[k] = (s.bag.stack[k] || 0) - n; if (s.bag.stack[k] <= 0) delete s.bag.stack[k]; }

  // 16 種被動（pt12u 規格）＋高級熱血（決定 7）
  G.PASSIVE_IDS = ['busi', 'suxing', 'renai', 'huajie', 'xinu', 'xixue', 'rexue', 'gjrexue', 'gaojiyudi', 'pozhou', 'pojia', 'dunhua', 'suijia', 'lianzhan', 'huizhan', 'liaoshang', 'gjliaoshang', 'dabaodai', 'jingdian'];
  G.REC_V = 7; // 戰報版本：v7 起拜訪武將以 PVP 規則模擬

  S.extraDefaults = S.extraDefaults || [];
  S.extraDefaults.push(function (s) { U.each(s.heroes || [], function (h) { if (h.pb === undefined) h.pb = null; }); });

  G.pbCfg = function () { return C().passiveLearn || { open: 30, silver: 5000, jinengshu: 5 }; };
  G.pbOpen = function (h) { return !!h && h.lv >= G.pbCfg().open; };
  // 可習得：本身沒有的被動
  G.pbChoices = function (uid) {
    var h = G.hero(uid); if (!h) return [];
    var own = R.heroDef(h.id) && R.heroDef(h.id).passive;
    return U.filter(G.PASSIVE_IDS, function (p) { return p !== own && !(own === 'rexue' && p === 'rexue'); });
  };
  G.pbLearn = function (uid, pid) {
    var h = G.hero(uid), c = G.pbCfg(), s = st();
    if (!h) return fail('找不到武將');
    if (!G.pbOpen(h)) return fail('武將 ' + c.open + ' 級開放習得被動欄');
    if (!MJ.D.heroes.passives[pid] || G.pbChoices(uid).indexOf(pid) < 0) return fail('無法習得這個被動');
    if (h.pb === pid) return fail('已經習得');
    if (s.player.silver < c.silver) return fail('銀幣不足（需要 ' + c.silver + '）');
    if (have('jinengshu') < c.jinengshu) return fail('技能書不足（需要 ' + c.jinengshu + '）');
    s.player.silver -= c.silver; take('jinengshu', c.jinengshu);
    var old = h.pb; h.pb = pid;
    G.log((R.heroDef(h.id).name === '主角' ? (s.player.name || '主角') : R.heroDef(h.id).name) + ' 習得被動「' + MJ.D.heroes.passives[pid].name + '」' + (old ? '（取代「' + MJ.D.heroes.passives[old].name + '」）' : ''), 'lv');
    G.commit(); return ok({ pb: pid, old: old });
  };

  // 拜訪武將＝PVP：sys4 的 arenaFight 以 pvp 規則模擬並寫入 rec.v = 7、rec.pvp；舊戰報以舊規則重播

  // ================= v6 → v7 存檔升級 =================
  S.STEPS[6] = S.stepV7 = function (st0) {
    var notes = [];
    U.each(st0.heroes || [], function (h) { if (h.pb === undefined) h.pb = null; });
    if (st0.arena && st0.arena.recs) U.each(st0.arena.recs, function (r) { if (r.v == null) r.v = 6; });
    notes.push('新增後天被動欄（' + G.pbCfg().open + ' 級開放）；舊戰報標記 v6，以舊規則重播');
    st0.migrateNotes = (st0.migrateNotes || []).concat(notes);
  };
})(MJ.G);
