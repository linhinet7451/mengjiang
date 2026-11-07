/* 數值規則：所有公式集中於此。等級標註見 docs/資料考證.md */
MJ.R = (function () {
  var R = {}, U = MJ.U;
  function C() { return MJ.D.config; }
  R.heroDef = function (id) {
    if (id === 'lead') return MJ.D.heroes.lead;
    return MJ.D.heroIndex[id] || null;
  };
  // C：經驗公式，與截圖 Lv6 = 125 吻合（10 級以內維持原公式）
  // D（第五階段平衡）：10 級以上乘上 1＋(Lv−10)×0.6，依 tools/progress-sim.js 30 天模擬調整，避免一天練滿
  R.EXP_K = 0.6;
  R.expNeed = function (lv) { var b = 3 * lv * lv + 2 * lv + 5; return lv <= 10 ? b : Math.round(b * (1 + (lv - 10) * R.EXP_K)); };
  R.maxLevel = 90; // P5：B（90 級主角升橙）；原為 80（D）
  R.RV = 13; // v13：技能倍率來源校準；舊版戰報保留快照倍率，rv<13 的重建測試仍走舊曲線
  // D：精力上限（截圖可見精力條，宣傳片 156/156；上限公式為推定）
  R.energyMax = function (lv) { return 100 + lv * 2; };
  R.teamSlots = function (lv) {
    var t = C().teamSlotsByLevel, n = t[0][1];
    for (var i = 0; i < t.length; i++) if (lv >= t[i][0]) n = t[i][1];
    return n;
  };
  R.moraleBonus = function (fails) { return Math.min(fails || 0, 10) * 0.08; };
  R.rosterCap = function (st) { return C().rosterBase + ((st.buildings && st.buildings.juxian || 1) - 1); };
  // A（讀取畫面提示）：傷害分物理、法術、絕技三種。第二階段起敏耐型改為絕技（C：依提示「絕技攻擊對敏捷高的武將」推論）
  R.dtypeOf = function (type) { var c = type.charAt(0); return c === '力' ? 'p' : (c === '智' ? 'm' : 'j'); };
  R.isPhys = function (type) { return R.dtypeOf(type) === 'p'; };
  R.SLOTS = ['weapon', 'helm', 'armor', 'cape', 'belt', 'ring', 'jade', 'glove']; // P5：8 部位（A 規格），玉墜／護手為新增
  R.leadTypeOf = function (st) { return (st && st.player && st.player.leadType) || '力耐'; };

  // 主屬性（力量/智力/敏捷/耐力）
  R.primary = function (h, st) {
    var def = R.heroDef(h.id), base, gr, mult;
    if (h.id === 'lead') {
      var lt = C().leadTypes[R.leadTypeOf(st)];
      base = lt.base; gr = lt.growth; mult = R.leadMult(st);
    } else { base = def.base; gr = def.growth; mult = C().qualityStatMult[def.quality]; }
    var k = h.lv - 1, o = {};
    U.each(['str', 'int', 'agi', 'con'], function (a) { o[a] = Math.floor((base[a] + gr[a] * k) * mult); });
    return o;
  };
  R.equipTpl = function (t) { return MJ.D.equipIndex[t] || null; };
  // D：副屬性（命中/暴擊/閃避，百分點）只來自裝備（A：截圖 Lv6 皆為 0.00）
  function r2(v) { return Math.round(v * 100) / 100; }
  // 第二階段：強化 +N（主屬性 +7%/級）、洗煉附加屬性、鑲嵌寶石（D）
  R.equipBase = function (e) {
    var tpl = R.equipTpl(e.t), m = C().equipQualityMult[e.q] || 1, o = {};
    if (!tpl) return o;
    U.each(U.keys(tpl.stats), function (k) { o[k] = Math.round(tpl.stats[k] * m); });
    if (e.q > 0 && tpl.sec) o[tpl.sec] = r2([0, 1, 2, 3.5][e.q] + tpl.lv / 12);
    return o;
  };
  R.equipStats = function (e) {
    var o = R.equipBase(e), tpl = R.equipTpl(e.t), plus = e.plus || 0;
    if (!tpl) return o;
    if (plus) U.each(U.keys(tpl.stats), function (k) { o[k] = Math.round(o[k] * (1 + C().enhance.perPlus * plus)); });
    U.each(e.aff || [], function (a) { o[a.k] = r2((o[a.k] || 0) + a.v); });
    U.each(e.gems || [], function (g) { var it = g && MJ.D.equipment.items[g]; if (it && it.gem) U.each(U.keys(it.gem.stats), function (k) { o[k] = r2((o[k] || 0) + it.gem.stats[k]); }); });
    return o;
  };
  R.sockets = function (e) { return C().sockets[e.q] || 1; };
  R.enhanceCap = function (st) { return (st.buildings && st.buildings.shenbing) || 1; }; // B：神兵坊等級＝可強化上限
  R.enhanceCost = function (e) { var tpl = R.equipTpl(e.t); return Math.floor((tpl.lv + 5) * ((e.plus || 0) + 1) * C().enhance.silverK); };
  R.enhanceChance = function (e) { var c = C().enhance, p = e.plus || 0; return p < c.freeBelow ? 1 : Math.max(c.chanceMin, 1 - (p - c.freeBelow + 1) * c.chanceStep); };
  // 技能等級（A：「·神」階）：無來源倍率沿用 D；v13 有 W967 資料者採來源曲線
  R.skillLv = function (h, w) { return (h.sk && h.sk[w]) || 1; };
  R.skillOf = function (h, w) {
    var def = R.heroDef(h.id), base = w === 'a' ? def.active : def.ult, lv = R.skillLv(h, w), c = C().skill;
    if (!base) return null;
    var shen = lv > c.maxLv, k = (1 + c.multPerLv * (Math.min(lv, c.maxLv) - 1)) * (shen ? 1 + c.shenBonus : 1);
    var o = U.extend({}, base);
    var p3 = base.p3; delete o.p3;
    if (R.RV >= 13 && p3) {
      if (w === 'a' && p3.lv1Mult != null && p3.lv6Mult != null) {
        if (lv <= 6) {
          var pos = (lv - 1) / 5;
          o.mult = p3.lv1Mult + (p3.lv6Mult - p3.lv1Mult) * pos;
          o.flat = lv <= 5 ? Math.round(5 + 70 * (lv - 1) / 4) : 125;
        } else {
          o.mult = p3.lv6Mult;
          o.flat = 125 + 50 * (lv - 6);
        }
      } else {
        // 無雙來源只列基準值；升級倍率與固定值成長仍沿用既有 D 級曲線。
        o.mult = (p3.mult != null ? p3.mult : base.mult) * (1 + c.multPerLv * (Math.min(lv, c.maxLv) - 1));
        o.flat = Math.round((p3.flat != null ? p3.flat : (base.flat || 0)) * (1 + 0.1 * (lv - 1)));
      }
      if (shen) o.mult *= 1 + c.shenBonus;
      if (p3.pattern) o.pattern = p3.pattern;
      if (p3.maxDamage != null) o.maxDamage = p3.maxDamage;
    } else {
      o.mult = base.mult * k; o.flat = Math.round((base.flat || 0) * (1 + 0.1 * (lv - 1)));
    }
    o.mult = Math.round(o.mult * 1000) / 1000;
    o.name = base.name + (shen ? '·神' : ''); o.lv = lv; o.shen = shen;
    return o;
  };
  R.passiveMul = function (h) { var lv = R.skillLv(h, 'p'), c = C().skill; return (1 + c.passivePerLv * (Math.min(lv, c.maxLv) - 1)) * (lv > c.maxLv ? 1 + c.shenBonus : 1); };
  // 培養上限（D）
  R.peiyangCap = function (h) { var c = C().peiyang; return Math.floor(c.capBase + c.capPerLv * h.lv); };
  R.xinfaSlots = function (h) { var n = 0; U.each(C().xinfaSlots, function (lv) { if (h.lv >= lv) n++; }); return n; };
  R.starCost = function (h) { var def = R.heroDef(h.id); return C().star.cost[def.quality] * ((h.star || 0) + 1); };
  // 將星錄：第 i 顆星（0 起算）
  R.jxStar = function (i) {
    var j = C().jiangxing, cy = j.cycle[i % j.cycle.length];
    return { i: i, name: j.names[i % 28] + '宿' + (i >= 28 ? '·' + (Math.floor(i / 28) + 1) + '重' : ''), k: cy[0], pct: cy[1], cost: j.costBase + j.costStep * i };
  };
  R.jxMax = 56;
  // P5 主角品質：綠 2 → 藍 3（20 級）→ 紫 4（60 級）→ 橙 5（90 級）；屬性倍率 D
  R.leadQ = function (st) { var q = st && st.player && st.player.leadQ; return q == null ? 3 : q; };
  R.leadMult = function (st) { var c = C().leadPromote, q = st && st.player && st.player.leadQ; return (q != null && c && c.statMult[String(q)]) || 1; }; // 未設定＝舊行為（倍率 1）
  R.typeOf = function (h, st) { return h.id === 'lead' ? R.leadTypeOf(st) : R.heroDef(h.id).type; };
  // 衍生屬性（C：依 A 截圖反推，Lv6 主角完全吻合）
  R.STATS = ['patk', 'matk', 'jatk', 'pdef', 'mdef', 'jdef', 'hp', 'hit', 'crit', 'dodge'];
  R.derived = function (h, st) {
    var p = R.primary(h, st), type = R.typeOf(h, st), dt = R.dtypeOf(type), xf = {}, xflat = {};
    // 心法（D）
    U.each(h.xf || [], function (x) {
      var c = x && MJ.D.config.xinfa && MJ.D.config.xinfa[x.id]; if (!c) return;
      if (c.flat) xflat[c.stat] = (xflat[c.stat] || 0) + c.flat * x.lv; else xf[c.stat] = (xf[c.stat] || 0) + c.pct * x.lv;
    });
    // 培養（B 功能／D 數值）、升階（D）、九陰真經
    var pm = (1 + C().star.perStar * (h.star || 0)) * (1 + (xf.all || 0) / 100);
    U.each(['str', 'int', 'agi', 'con'], function (a) { p[a] = Math.floor((p[a] + ((h.py && h.py[a]) || 0)) * pm); });
    var d = {
      str: p.str, int: p.int, agi: p.agi, con: p.con,
      patk: dt === 'p' ? p.str * 5 + 5 : p.str * 2 + 3,
      matk: dt === 'm' ? p.int * 5 + 5 : p.int * 2 + 3,
      jatk: dt === 'j' ? p.agi * 5 + 5 : p.agi * 2 + 3,
      pdef: Math.floor(p.str * 0.5 + p.con * 0.67),
      mdef: Math.floor(p.int * 0.5 + p.con * 0.42),
      jdef: Math.floor(p.agi * 0.6 + p.con * 0.3), // D：絕技防禦以敏捷為主
      hp: p.con * 20 + h.lv * 13,
      hit: 0, crit: 0, dodge: 0,
      res: 0, dbf: 0, pvp: 0, pve: 0 // P4 新屬性（A 名稱：狀態抵抗、負面狀態施加機率、PVP／PVE 傷害；數值 D）
    };
    var def = R.heroDef(h.id);
    if (def && (def.passive === 'rexue' || (R.RV >= 9 && def.passive2 === 'rexue'))) d.hp = Math.floor(d.hp * (1 + (R.RV >= 9 ? 0.05 : 0.1) * R.passiveMul(h))); // v9 熱血 +5%（B：snA967）
    if (h.pb === 'rexue' && !(def && (def.passive === 'rexue' || (R.RV >= 9 && def.passive2 === 'rexue')))) d.hp = Math.floor(d.hp * 1.1); // P4 習得熱血（D）
    if (h.pb === 'gjrexue') d.hp = Math.floor(d.hp * 1.2); // 高級熱血（B 名稱效果／D 數值）
    if (h.eq) U.each(R.SLOTS, function (slot) {
      var e = h.eq[slot]; if (!e) return;
      var s = R.equipStats(e);
      U.each(U.keys(s), function (k) { d[k] = r2((d[k] || 0) + s[k]); });
    });
    U.each(U.keys(xf), function (k) { if (k !== 'all' && d[k] != null) d[k] = Math.floor(d[k] * (1 + xf[k] / 100)); });
    U.each(U.keys(xflat), function (k) { d[k] = r2((d[k] || 0) + xflat[k]); });
    d.phys = dt === 'p'; d.dtype = dt;
    return d;
  };
  // 全隊加成（%）：將星錄＋圖鑑＋陣法（D）
  R.teamBonus = function (st) {
    var o = {}, cfg = C();
    function add(k, v) { if (k === 'npcCut') return; if (k === 'atk' || k === 'def') { U.each(k === 'atk' ? ['patk', 'matk', 'jatk'] : ['pdef', 'mdef', 'jdef'], function (x) { add(x, v); }); return; } if (k === 'all') { U.each(['patk', 'matk', 'jatk', 'pdef', 'mdef', 'jdef', 'hp'], function (x) { add(x, v); }); return; } o[k] = (o[k] || 0) + v; }
    var n = (st.jiangxing && st.jiangxing.lit) || 0;
    for (var i = 0; i < n; i++) { var s = R.jxStar(i); add(s.k, s.pct); }
    var cn = st.codex ? U.keys(st.codex).length : 0;
    if (cn) add('all', Math.min(cfg.codexMax, cn * cfg.codexPer));
    var f = st.team && MJ.D.formIndex && MJ.D.formIndex[st.team.formation];
    if (f && f.bonus) U.each(U.keys(f.bonus), function (k) { add(k, f.bonus[k]); });
    U.each(U.keys(o), function (k) { o[k] = r2(o[k]); });
    return o;
  };
  R.battleStats = function (h, st) {
    var d = R.derived(h, st), b = R.teamBonus(st);
    U.each(U.keys(b), function (k) { if (d[k] != null) d[k] = k === 'hit' || k === 'crit' || k === 'dodge' ? r2(d[k] + b[k]) : Math.floor(d[k] * (1 + b[k] / 100)); });
    return d;
  };
  // D：戰鬥力（原作有顯示但公式未知，此為自訂估算）
  R.power = function (h, st) {
    var d = R.battleStats(h, st);
    return Math.floor(Math.max(d.patk, d.matk, d.jatk) * 1.6 + (d.pdef + d.mdef + d.jdef) * 1.0 + d.hp * 0.25 + d.agi * 3 + (d.hit + d.crit + d.dodge) * 10);
  };
  R.equipScore = function (e) {
    var s = R.equipStats(e);
    return ((s.patk || 0) + (s.matk || 0) + (s.jatk || 0)) * 1.6 + ((s.pdef || 0) + (s.mdef || 0) + (s.jdef || 0)) * 1.0 + (s.hp || 0) * 0.25 + ((s.hit || 0) + (s.crit || 0) + (s.dodge || 0)) * 10;
  };
  R.equipSell = function (e) { var tpl = R.equipTpl(e.t); return Math.floor((tpl ? tpl.lv * 20 + 40 : 40) * (1 + e.q)); }; // D

  // 敵方屬性（D：以品質綠的基礎值與類型成長計算，另加等級加成模擬裝備）
  R.enemyUnit = function (spec, stage) {
    var tpl = MJ.D.stages.enemies[spec.e], cfg = C();
    var g = cfg.grow[tpl.type], b = cfg.qbase[2], lv = spec.lv, k = lv - 1;
    var bias = { '力敏': [3, -2, 2, -1], '力耐': [3, -2, -1, 3], '智敏': [-2, 3, 2, -1], '智耐': [-2, 3, -1, 3], '敏耐': [-1, -2, 3, 2] }[tpl.type];
    var p = { str: Math.floor(b[0] + bias[0] + g[0] * k), int: Math.floor(b[1] + bias[1] + g[1] * k), agi: Math.floor(b[2] + bias[2] + g[2] * k), con: Math.floor(b[3] + bias[3] + g[3] * k) };
    var dt = R.dtypeOf(tpl.type), phys = dt === 'p', mag = dt === 'm';
    var m = tpl.boss ? (stage.kind === 'normal' ? 1.1 : 1.2) : 0.75;
    var u = {
      name: tpl.name, lv: lv, phys: phys, dtype: dt, agi: p.agi,
      jatk: Math.floor((dt === 'j' ? p.agi * 5 + 5 : p.agi * 2 + 3) * m * 0.8 + lv * 4),
      jdef: Math.floor((p.agi * 0.6 + p.con * 0.3) * m + lv * 1.5),
      patk: Math.floor((phys ? p.str * 5 + 5 : p.str * 2 + 3) * m * 0.8 + lv * 4),
      matk: Math.floor((mag ? p.int * 5 + 5 : p.int * 2 + 3) * m * 0.8 + lv * 4),
      pdef: Math.floor((p.str * 0.5 + p.con * 0.67) * m + lv * 1.5),
      mdef: Math.floor((p.int * 0.5 + p.con * 0.42) * m + lv * 1.5),
      hp: Math.floor((p.con * 20 + lv * 13) * m * 0.8),
      hit: 0, crit: tpl.boss ? 5 : 0, dodge: 0,
      layers: 1, boss: !!tpl.boss,
      look: { g: tpl.look[0], skin: tpl.look[1], hair: tpl.look[2], hs: tpl.look[3], beard: tpl.look[4], cloth: tpl.look[5], trim: tpl.look[6], wp: tpl.look[7], art: tpl.art },
      active: { name: tpl.boss ? tpl.name.split('·').pop() + '之擊' : '攻擊', pattern: tpl.pattern, mult: 1, flat: 0 },
      ult: { name: tpl.boss ? '絕技·' + tpl.name.split('·').pop() : '奮力一擊', pattern: tpl.ult, mult: tpl.boss ? 1.6 : 1.4, flat: lv * 4 },
      passive: null
    };
    // A：宣傳片 Boss 有多層血條；倍數為 D
    // 第三階段：第 5～8 章與高層通天塔的 Boss 血條層數增加（D）
    var deep = (stage.ch || 0) >= 5 || (stage.depth || 0) >= 5;
    if (spec.leader && (stage.kind === 'boss' || stage.kind === 'hidden')) { u.hp = Math.floor(u.hp * (deep ? 3 : 2.4)); u.layers = deep ? ((stage.ch || stage.depth) >= 7 ? 5 : 4) : 3; }
    else if (spec.leader && stage.kind === 'elite') { u.hp = Math.floor(u.hp * (deep ? 2 : 1.7)); u.layers = deep ? 3 : 2; }
    else if (spec.leader) { u.hp = Math.floor(u.hp * 1.3); }
    // 第五階段平衡：中後期敵人成長曲線（D，依 tools/balance.js 模擬調整，玩家裝備成長為二次曲線，敵人原為線性）
    var es = cfg.enemyScale;
    if (es && lv > es.from) {
      var x = lv - es.from, fa = 1 + es.atk * x + (es.atk2 || 0) * x * x, fd = 1 + es.def * x + (es.def2 || 0) * x * x, fh = 1 + es.hp * x + (es.hp2 || 0) * x * x;
      U.each(['patk', 'matk', 'jatk'], function (k) { u[k] = Math.floor(u[k] * fa); });
      U.each(['pdef', 'mdef', 'jdef'], function (k) { u[k] = Math.floor(u[k] * fd); });
      u.hp = Math.floor(u.hp * fh); u.ult.flat = Math.floor(u.ult.flat * fa);
    }
    return u;
  };

  // 戰鬥單位（我方）
  R.heroUnit = function (h, st) {
    var def = R.heroDef(h.id), d = R.battleStats(h, st);
    var name = h.id === 'lead' ? (st.player.name || '主角') : def.name;
    var look = def.look;
    if (h.id === 'lead' && st.player.look) look = st.player.look;
    return {
      name: name, lv: h.lv, phys: d.phys, dtype: d.dtype, agi: d.agi, patk: d.patk, matk: d.matk, jatk: d.jatk, pdef: d.pdef, mdef: d.mdef, jdef: d.jdef,
      hp: d.hp, hit: d.hit, crit: d.crit, dodge: d.dodge, res: d.res, dbf: d.dbf, pvp: d.pvp, pve: d.pve, pb: h.pb || null, look: look, quality: h.id === 'lead' ? R.leadQ(st) : def.quality,
      active: R.skillOf(h, 'a'), ult: R.skillOf(h, 'u'), passive: def.passive, pm: R.passiveMul(h), layers: 1, hid: h.uid, star: h.star || 0
    };
  };
  return R;
})();
