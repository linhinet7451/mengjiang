/* 網路資料搜查-2 還原（存檔 v9）：P1 武將品質／類型／魂量、上陣人數；P2 被動兩格、陣法 8 陣＋錐行陣、連攜、補將；
   P3 倍率、開放等級、經驗表、將星錄組合；P4 寶石、心法 2 格、生死劫、合成公式、六等範圍。
   分級見 provenance.json（A 官方畫面、B 攻略、C 推論、D 本作設計）。舊戰報（無 rv）沿用舊規則重播。 */
(function (G) {
  var U = MJ.U, R = MJ.R, S = MJ.S;
  function st() { return S.state; }
  function C() { return MJ.D.config; }
  // 修正前的武將定義（品質、類型、魂量），只給存檔升級寫說明與換武器用
  G.V8_HERO = {"weixiaobao":[2,"智耐",1],"jianning":[2,"智敏",1],"wangyuyan":[2,"智耐",1],"sunce":[2,"力敏",1],"taishici":[2,"力敏",1],"liqiushui":[2,"智敏",1],"dongfang":[3,"智敏",5],"azi":[3,"智敏",5],"shuanger":[3,"力敏",5],"miejue":[3,"智耐",5],"huangyueying":[3,"智耐",5],"daqiao":[3,"智敏",5],"xiaoqiao":[3,"智敏",5],"huangrong":[3,"智敏",5],"lvbu":[4,"力敏",45],"sunshangxiang":[4,"力耐",45],"renyingying":[3,"智敏",5],"sunquan":[3,"智耐",5],"xiongmao":[2,"力耐",1],"liubei":[4,"智耐",45],"duanyu":[3,"智敏",5],"xuzhu":[3,"力耐",5],"zhoubotong":[3,"力敏",5],"dianwei":[3,"力耐",5],"caocao":[4,"智耐",45],"xuchu":[2,"力耐",1]};
  G.V9_EXTRA = []; // 之後各階段追加的升級步驟：function (st0, notes)

  function qn(q) { return C().qualityNames[q]; }
  // 讓隊伍符合新的上陣人數與陣法格：多出的武將回到待命區（武將不會消失）
  G.fixTeam9 = function (st0, notes) {
    if (!st0.team || !st0.team.cells) return;
    var L = U.find(st0.heroes || [], function (h) { return h.id === 'lead'; }), lv = L ? L.lv : 1;
    var f = MJ.D.formIndex[st0.team.formation] || MJ.D.formations[0];
    if (!MJ.D.formIndex[st0.team.formation]) { notes.push('陣法「' + st0.team.formation + '」已不存在，改為' + f.name); st0.team.formation = f.id; }
    var slots = Math.min(R.teamSlots(lv), f.cells.length), open = f.cells.slice(0); // P2：每陣 8 格（A：sn77）
    var list = []; U.each(U.keys(st0.team.cells), function (c) { list.push({ c: +c, uid: st0.team.cells[c] }); });
    list.sort(function (a, b) { return a.c - b.c; });
    var leadUid = L && L.uid, keep = [], bench = [];
    U.each(list, function (x) { if (x.uid === leadUid) keep.unshift(x); else keep.push(x); });
    while (keep.length > slots) bench.push(keep.pop());
    var cells = {}, used = {};
    U.each(keep, function (x) { if (open.indexOf(x.c) >= 0 && !used[x.c]) { cells[x.c] = x.uid; used[x.c] = 1; x.done = 1; } });
    U.each(keep, function (x) { if (x.done) return; var fr = U.find(open, function (c) { return !used[c]; }); if (fr == null) { bench.push(x); return; } cells[fr] = x.uid; used[fr] = 1; });
    st0.team.cells = cells;
    if (bench.length) {
      var names = U.map(bench, function (x) { var h = U.find(st0.heroes, function (y) { return y.uid === x.uid; }); var d = h && R.heroDef(h.id); return d ? d.name : '?'; });
      notes.push('上陣人數改為原版（' + lv + ' 級可上 ' + slots + ' 人）：' + names.join('、') + ' 回到待命區（武將與裝備都保留）');
    }
  };

  // ================= v8 → v9 存檔升級 =================
  S.STEPS[8] = S.stepV9 = function (st0) {
    var notes = [];
    U.each(st0.heroes || [], function (h) {
      var o = G.V8_HERO[h.id], d = R.heroDef(h.id); if (!o || !d) return;
      var ch = [];
      if (o[0] !== d.quality) ch.push(qn(o[0]) + '→' + qn(d.quality));
      if (o[1] !== d.type) ch.push(o[1] + '→' + d.type);
      if (o[2] !== d.souls) ch.push('招募將魂 ' + o[2] + '→' + d.souls);
      if (ch.length) notes.push(d.name + '：' + ch.join('、') + '（依原版攻略修正；等級、星級、技能、裝備都保留）');
      var w = h.eq && h.eq.weapon, od = R.dtypeOf(o[1]), nd = R.dtypeOf(d.type);
      if (w && od !== nd && /^w[pm]/.test(w.t)) {
        var nt = (nd === 'm' ? 'wm' : 'wp') + w.t.slice(2), t0 = R.equipTpl(w.t), t1 = R.equipTpl(nt);
        if (t1) { notes.push(d.name + ' 的武器 ' + (t0 ? t0.name : w.t) + ' → ' + t1.name + '（改為' + (nd === 'm' ? '法術' : '物理') + '武器，保留品質／強化／寶石）'); w.t = nt; }
      }
    });
    G.fixTeam9(st0, notes);
    U.each(G.V9_EXTRA, function (fn) { try { fn(st0, notes); } catch (e) { notes.push('（升級步驟略過：' + e.message + '）'); } });
    st0.migrateNotes = (st0.migrateNotes || []).concat(notes);
  };
  // ================= v9 → v10 存檔升級（P2：陣法改 8 格、八卦陣中宮虛位、被動兩格、連攜、補將） =================
  S.STEPS[9] = S.stepV10 = function (st0) {
    var notes = [];
    if (st0.team && st0.team.cells) {
      var before = U.keys(st0.team.cells).length;
      G.fixTeam9(st0, notes);
      if (U.keys(st0.team.cells).length === before && st0.team.formation === 'bagua' && !st0.team.cells[4]) notes.push('八卦陣改為 8 格（中宮虛位）');
    }
    notes.push('武將被動改為原版兩格（舊被動資料保留於說明）；新增連攜、錐行陣與 21 名武將；已擁有的武將、將魂、裝備都不變');
    st0.migrateNotes = (st0.migrateNotes || []).concat(notes);
  };
  // P2：開放格＝陣法的 8 格（上陣人數最多 8，不再改開 9 格）
  G.openCells = function () { return G.formation().cells; };
})(MJ.G);

/* v9 攻擊範圍：新建的戰鬥單位帶規則版本 rv，戰鬥引擎依 rv 選用新／舊範圍規則（舊戰報沒有 rv，照舊重播） */
(function () {
  var R = MJ.R;
  var hu0 = R.heroUnit, eu0 = R.enemyUnit;
  R.heroUnit = function (h, st) {
    var u = hu0.apply(R, arguments); if (!u) return u;
    u.rv = R.RV;
    if (R.RV >= 9) {
      // P2：第二個被動、連攜對象、被動等級、錐行陣（減 NPC 傷害，A：sn77）
      var def = R.heroDef(h.id) || {};
      u.did = h.id; u.passive2 = def.passive2 || null; u.partner = def.partner || null; u.plv = R.skillLv(h, 'p');
      var f = st && st.team && MJ.D.formIndex && MJ.D.formIndex[st.team.formation];
      if (f && f.bonus && f.bonus.npcCut) u.npcCut = f.bonus.npcCut;
    }
    return u;
  };
  R.enemyUnit = function () { var u = eu0.apply(R, arguments); if (u) u.rv = R.RV; return u; };
})();
