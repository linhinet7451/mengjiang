// 網路資料搜查-2 P2：被動兩格、陣法 8 陣（8 格）＋錐行陣、連攜、補將 21 名、宣傳片無雙名、項鍊
// 由 tools/web2-data.js 呼叫：require('./web2-p2.js')(ctx)
module.exports = function (X) {
  var H = X.H, C = X.C, F = X.F, byId = X.byId, entry = X.entry, conflict = X.conflict, LB = X.LB, src = X.src;
  var fs = require('fs'), path = require('path'), cv = require('./glyph967.js');
  var SD = path.join(__dirname, '..', 'docs', 'sources', 'web2'); if (!fs.existsSync(path.join(SD, 'c-snA967-heroes.json'))) SD = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2');
  var HJ = JSON.parse(fs.readFileSync(path.join(SD, 'c-snA967-heroes.json'), 'utf8'));
  var SJ = JSON.parse(fs.readFileSync(path.join(SD, 'c-snA967-skills.json'), 'utf8'));
  var GJ = JSON.parse(fs.readFileSync(path.join(SD, 'c-snA967-grids.json'), 'utf8'));
  var NAME = { '祝融': '祝融夫人', '喬峰': '蕭峰', '丘處機': '邱處機', '建甯公主': '建寧公主' };
  function idOf(n) { n = NAME[n] || n; var h = H.list.filter(function (x) { return x.name === n; })[0]; return h ? h.id : null; }
  var Q = function (q) { return { s: 'W967', q: q }; };

  // ---------- 被動 ----------
  var PN = { '殺氣訣': 'shaqi', '強刃': 'qiangren', '強甲': 'qiangjia', '熱血': 'rexue', '息怒': 'xinu', '連斬': 'lianzhan', '不死': 'busi', '破咒': 'pozhou', '吸血': 'xixue', '化解': 'huajie', '忍耐': 'renai', '療傷': 'liaoshang', '復甦': 'suxing', '回斬': 'huizhan', '奪魂': 'duohun', '清心': 'qingxin', '虛弱': 'xuruo', '焚心': 'fenxin', '辟邪': 'bixie', '還施彼身': 'huanshi', '凝心': 'ningxin', '飄忽若神': 'piaohu' };
  var PS = H.passives;
  function P9(id, o) { PS[id] = Object.assign(PS[id] || {}, o); }
  P9('shaqi', { name: '殺氣訣', desc: '法攻 +10（×被動等級加成）', grade: 'B' });
  P9('qiangren', { name: '強刃', desc: '物攻 +10（×被動等級加成）', grade: 'B' });
  P9('qiangjia', { name: '強甲', desc: '物防／法防／絕技防 +10（×被動等級加成）', grade: 'B' });
  P9('piaohu', { name: '飄忽若神', desc: '閃避 +5%（機率增加自身閃避率；數值 D）', grade: 'B(效果) D(數值)' });
  P9('duohun', { name: '奪魂', desc: '攻擊時 12% 機率使對方 2 回合無法使用無雙技', grade: 'B(效果/回合) C(機率)' });
  P9('qingxin', { name: '清心', desc: '行動時 30% 機率清除自身負面狀態', grade: 'B(效果) D(機率)' });
  P9('xuruo', { name: '虛弱', desc: '攻擊時 31% 機率使對手治療效果 −24%，持續 5 回合', grade: 'B' });
  P9('fenxin', { name: '焚心', desc: '攻擊時 20% 機率以最大攻擊 20% 造成燒傷，持續 2 回合', grade: 'B(效果) D(機率)' });
  P9('bixie', { name: '辟邪', desc: '自身所受持續傷害 −50%', grade: 'B' });
  P9('huanshi', { name: '還施彼身', desc: '被攻擊後反彈 50% 傷害（每次最多 300 點）', grade: 'B(數值) C(讀法)' });
  P9('ningxin', { name: '凝心', desc: '附加負面狀態機率 +1%，每級再 +2%', grade: 'B' });
  // v9（rv≥9 的戰鬥）改用 snA967 的被動數值；舊戰報照舊規則重播
  P9('rexue', { desc: '生命上限 +5%（v9；舊版 +10%）', grade: 'B' });
  P9('xinu', { desc: '攻擊時 30% 機率減少對方 20 點無雙值', grade: 'B(機率) D(點數)' });
  P9('lianzhan', { desc: '攻擊後 20% 機率再打一次', grade: 'B' });
  P9('busi', { desc: '被擊倒時 15% 機率生命剩 1（每場 1 次）', grade: 'B(機率) D(次數)' });
  P9('pozhou', { desc: '30% 機率抵抗負面狀態（狀態抵抗 +30）', grade: 'B' });
  P9('xixue', { desc: '攻擊時 12% 機率把 10% 傷害轉為自身生命', grade: 'B' });
  P9('huajie', { desc: '攻擊時 30% 機率偷取對方 10 點無雙值', grade: 'B' });
  P9('renai', { desc: '行動時 30% 機率增加自身 15 點無雙值', grade: 'B(機率) D(點數)' });
  P9('liaoshang', { desc: '行動時 50% 機率恢復攻擊 20% 的生命', grade: 'B' });
  P9('suxing', { name: '復甦', desc: '陣亡後 5% 機率以 15% 生命復活（每場最多 2 次）', grade: 'B' });
  P9('huizhan', { desc: '被攻擊時 15% 機率反擊', grade: 'B' });
  function parsePassives(t) {
    var out = []; String(t || '').replace(/([^\s(（]+)[(（]/g, function (m, n) { if (PN[n]) out.push(PN[n]); return m; });
    return out;
  }

  // ---------- 補將 ----------
  var QI = { '白': 1, '綠': 2, '藍': 3, '紫': 4 };
  var NEW = [
    // id, 名, 勢力, 性別, 武器, 衣色, 主動名, 無雙名, 立繪別名, 描述（給 GenerateImage）
    ['yuanshao', '袁紹', '三國', 'm', 'sword', '#c9a227', '河北號令', '四世三公', null],
    ['ake', '阿珂', '武俠', 'f', 'sword', '#f48fb1', '拂柳劍', '傾城一笑', null],
    ['tianshan', '天山童姥', '武俠', 'f', 'fan', '#e1f5fe', '天山折梅手', '生死符', null],
    ['dongzhuo', '董卓', '三國', 'm', 'blade', '#4e342e', '西涼鐵騎', '焚城', 'b_dongzhuo'],
    ['aobai', '鰲拜', '武俠', 'm', 'blade', '#37474f', '擒拿摔', '巴圖魯怒擊', null],
    ['zhangliao', '張遼', '三國', 'm', 'spear', '#1565c0', '突騎', '威震逍遙津', 'b_zhangliao'],
    ['zuolengchan', '左冷禪', '武俠', 'm', 'sword', '#263238', '寒冰掌', '五嶽併派', null],
    ['yanliang', '顏良', '三國', 'm', 'blade', '#795548', '河北斬', '萬軍突擊', null],
    ['limochou', '李莫愁', '武俠', 'f', 'fan', '#b71c1c', '赤練神掌', '冰魄銀針', null],
    ['wuyazi', '無崖子', '武俠', 'm', 'staff', '#eceff1', '北冥掌', '逍遙傳功', null],
    ['renwoxing', '任我行', '武俠', 'm', 'blade', '#212121', '吸星掌', '日月神功', 'b_renwoxing'],
    ['xiahoudun', '夏侯惇', '三國', 'm', 'blade', '#283593', '獨眼斬', '拔矢啖睛', null],
    ['xiaozhao', '小昭', '武俠', 'f', 'staff', '#4fc3f7', '乾坤挪移', '聖火令', null],
    ['ziyun', '紫雲', '武俠', 'f', 'fan', '#9575cd', '雲袖', '往昔若凝', null],
    ['zhenji', '甄姬', '三國', 'f', 'fan', '#80cbc4', '洛神凌波', '驚鴻月斬', null]
  ];
  var WHITE = [ // sn60 白將名單（B）；類型、技能、被動無資料（D）
    ['caobao', '曹豹', '力耐', 'm', 'spear', '#8d6e63', '槍刺', '猛突'],
    ['caode', '曹德', '智耐', 'm', 'staff', '#90a4ae', '書卷擊', '智計'],
    ['caoang', '曹昂', '力敏', 'm', 'sword', '#5c6bc0', '突刺', '護父'],
    ['caojie', '曹節', '智敏', 'f', 'fan', '#ce93d8', '扇擊', '鳳儀'],
    ['dingguan', '丁管', '力耐', 'm', 'blade', '#a1887f', '刀擊', '亂斬'],
    ['hantiemo', '汗貼摩', '力敏', 'm', 'blade', '#6d4c41', '鐵掌', '蠻勁']
  ];
  var TPL = {}; H.list.forEach(function (h) { var k = h.quality + h.type; if (!TPL[k]) TPL[k] = h; });
  function tplOf(q, t) { return TPL[q + t] || TPL[(q + 1) + t] || TPL[(q - 1) + t] || TPL['3' + t]; }
  function mult(s) { var x = /([0-9.]+)\+([0-9]+)/.exec(s || ''); return x ? +x[1] : null; }
  var KA = 1.6, KU = 2.9; // 本作倍率 ÷ snA967 倍率 的中位數（P2 估；P3 依表校準）
  function fxOf(t) {
    t = String(t || '');
    if (/眩暈/.test(t)) return { stun: 0.25 };
    if (/防/.test(t) && /目標/.test(t)) return { armorBreak: 0.3 };
    if (/灼傷|熾焰/.test(t)) return { burn: 0.3 };
    if (/流血/.test(t)) return { bleed: 0.3 };
    return null;
  }
  function look(g, wp, cloth) { return { g: g, skin: g === 'f' ? '#fbe0cd' : '#e8b98f', hair: '#1b1b1b', hs: g === 'f' ? 'long' : 'topknot', beard: 'none', cloth: cloth, trim: '#ffd54f', wp: wp }; }
  function gstr(b) { return b === 'same' ? null : b.join('/'); }
  var made = [];
  NEW.forEach(function (n) {
    var nm = n[1] === '無崖子' ? '無涯子' : n[1];
    var hj = HJ.filter(function (x) { return x.name === nm; })[0], sj = SJ[nm] || null, gj = GJ[nm] || null;
    if (!hj) throw new Error('snA967 沒有 ' + nm);
    var q = QI[hj.color], t = hj.type, tp = tplOf(q, t);
    var a = gj && gj[0] !== 'same' ? cv(gj[0]).shape : [[0, 0]], u = gj && gj[2] ? cv(gj[2]).shape : [[0, 0]];
    var a6 = gj && gj[1] && gj[1] !== 'same' ? cv(gj[1]).shape : null;
    var heal = sj && /治療/.test(sj[3]);
    var h = {
      id: n[0], name: n[1], faction: n[2], quality: q, type: t,
      base: JSON.parse(JSON.stringify(tp.base)), growth: { str: C.grow[t][0], int: C.grow[t][1], agi: C.grow[t][2], con: C.grow[t][3] },
      look: look(n[3], n[4], n[5]),
      active: { name: n[6], pattern: 'shape', shape: a, shape6: a6, mult: Math.round((mult(sj && sj[1]) || 0.9) * KA * 100) / 100, flat: 0, fx: fxOf(sj && sj[0]), g967: gj ? gstr(gj[0]) : null },
      ult: heal ? { name: n[7], pattern: 'healAll', mult: 0.6, flat: 40, fx: null, g967: gj ? gstr(gj[2]) : null } :
        { name: n[7], pattern: 'shape', shape: u, mult: Math.round((mult(sj && sj[3]) || 0.6) * KU * 100) / 100, flat: q === 4 ? 180 : 120, fx: fxOf(sj && sj[3]), g967: gj ? gstr(gj[2]) : null },
      passive: null, passive2: null, souls: q === 4 ? (['renwoxing', 'wuyazi'].indexOf(n[0]) >= 0 ? 30 : 45) : 5,
      grade: 'B(名稱/品質/類型/被動/連攜：snA967、sn60) C(範圍：格圖換算) D(技能名/倍率/外觀)', web2: 'P2'
    };
    if (n[8]) h.artAlias = n[8];
    var ps = parsePassives(hj.passive); h.passive = ps[0] || ({ '力': 'qiangren', '智': 'shaqi' })[t.charAt(0)]; h.passive2 = ps[1] || null;
    if (!ps.length) h.passiveGrade = 'D（snA967「未定」）';
    if (n[0] === 'xiahoudun') h.soulsGrade = 'C';
    var ex = byId[n[0]]; if (ex) Object.assign(ex, h); else { H.list.push(h); byId[n[0]] = h; }
    made.push(n[0]);
  });
  WHITE.forEach(function (n) {
    var t = n[2], tp = tplOf(1, t);
    var h = {
      id: n[0], name: n[1], faction: '三國', quality: 1, type: t,
      base: JSON.parse(JSON.stringify(tp.base)), growth: { str: C.grow[t][0], int: C.grow[t][1], agi: C.grow[t][2], con: C.grow[t][3] },
      look: look(n[3], n[4], n[5]),
      active: { name: n[6], pattern: 'single', mult: 1.1, flat: 0, fx: null }, ult: { name: n[7], pattern: 'line2', mult: 1.4, flat: 40, fx: null },
      passive: t.charAt(0) === '力' ? 'qiangren' : 'shaqi', passiveGrade: 'D', souls: 1,
      grade: 'B(名稱/白品：sn60) D(類型/技能/被動/外觀)', web2: 'P2'
    };
    var ex = byId[n[0]]; if (ex) Object.assign(ex, h); else { H.list.push(h); byId[n[0]] = h; }
    made.push(n[0]);
  });

  // ---------- 既有武將：被動兩格、連攜、格圖原始資料 ----------
  var nP = 0, nL = 0;
  HJ.forEach(function (x) {
    var id = idOf(x.name); if (!id) return; var h = byId[id];
    var ps = parsePassives(x.passive);
    if (ps.length && made.indexOf(id) < 0) {
      if (!h.passive0) h.passive0 = h.passive || null;
      h.passive = ps[0]; h.passive2 = ps[1] || null; h.passiveGrade = 'B（snA967 被動技能欄）'; nP++;
    }
    var pid = x.partner && x.partner !== '-' ? idOf(x.partner.replace(/[*＊].*$/, '')) : null;
    if (pid) { h.partner = pid; nL++; } else delete h.partner;
    var gj = GJ[x.name];
    if (gj && made.indexOf(id) < 0) h.g967 = { a: gstr(gj[0]), a6: gstr(gj[1]), u: gstr(gj[2]) };
  });
  H.patterns.shape = '原版格圖';

  // ---------- 宣傳片無雙名（A：直書金字） ----------
  var PV = [['guanyu', '義薄雲天', 'A'], ['huangyaoshi', '落英神劍', 'C'], ['zhangfei', '雷霆震怒', 'C']];
  PV.forEach(function (x) { var h = byId[x[0]]; if (!h.ultName0) h.ultName0 = h.ult.name; h.ult.name = x[1]; h.ultNameGrade = x[2] + (x[2] === 'A' ? '（宣傳片：義薄雲天(關羽)）' : '（宣傳片出現技名，未標武將；依招式出處推定）'); });

  // ---------- 陣法：每陣 8 格（A：sn77「允許 8 個武將出戰」）、加成種類（A）、數值（D） ----------
  var FD = {
    fangyuan: { cells: [0, 1, 3, 4, 5, 6, 7, 8], bonus: { pdef: 6 }, kind: 'D（sn77 未列方圓陣加成）' },
    yulin: { cells: [0, 3, 4, 5, 6, 1, 2, 7], bonus: { pdef: 5, mdef: 5 }, kind: 'A：物理＋法術防禦' },
    yanyue: { cells: [0, 1, 2, 3, 6, 7, 8, 4], bonus: { dodge: 3, def: 4 }, kind: 'A：閃避＋防' },
    fengshi: { cells: [3, 1, 4, 7, 2, 5, 8, 0], bonus: { hit: 3, atk: 3 }, kind: 'A：命中＋攻擊' },
    qixing: { cells: [0, 3, 6, 1, 4, 7, 5, 2], bonus: { crit: 3, atk: 3 }, kind: 'A：暴擊＋攻擊' },
    yanxing: { cells: [1, 3, 5, 7, 0, 6, 4, 8], bonus: { agi: 6 }, kind: 'A：敏捷' },
    bagua: { cells: [0, 1, 2, 3, 5, 6, 7, 8], bonus: { patk: 5, matk: 5 }, kind: 'A：物理＋法術攻擊', desc: '八門環列、中宮虛位' }
  };
  var FL = F.list || F;
  FL.forEach(function (f) { var d = FD[f.id]; if (!d) return; f.cells = d.cells; f.bonus = d.bonus; f.bonusKind = d.kind; f.grade = 'A(8 格/加成種類) D(格位/數值)'; if (d.desc) f.desc = d.desc; });
  var zx = { id: 'zhuixing', name: '錐行陣', cells: [0, 3, 6, 4, 1, 7, 5, 2], desc: '減少受到 NPC 的傷害（對玩家無效）', bonus: { def: 4, npcCut: 16 }, open: 20, bonusKind: 'A：減少 NPC 傷害 16%（對玩家無效）＋防', grade: 'A(16%/對玩家無效) D(格位/防禦%/開放等級)' };
  var zi = FL.findIndex(function (f) { return f.id === 'zhuixing'; }); if (zi >= 0) FL[zi] = zx; else FL.push(zx);

  // ---------- 裝備部位顯示名 ----------
  C.slotNames = Object.assign(C.slotNames || {}, { jade: '項鍊' });

  // ---------- 出處 ----------
  var QP = Q('武將一覽「被動技能」欄，例：段譽「飄忽若神(機率增加自身閃避率) 化解(攻擊有30%機率偷取對方無雙值10點)」');
  var QL = Q('武將一覽「連攜」欄，例：段譽→喬峰（紫）');
  entry({ id: 'web2.passive.two', cat: '被動', item: '每將兩個被動', spec: 'snA967', current: nP + ' 名既有武將改為 snA967 的 1～2 個被動（新武將 15 名同）；舊被動記在 passive0；沒在表上的 10 名＋主角照舊（D）', grade: 'B', label: LB.B, sources: [QP], phase: 'web2-P2' });
  entry({ id: 'web2.passive.values', cat: '被動', item: '被動數值（v9）', spec: 'snA967 括號內說明', current: '熱血 +5%、息怒 30%、連斬 20%、不死 15%、破咒 30%、吸血 12%/10%、化解 30% 偷 10、忍耐 30%、療傷 50% 攻擊×20%、復甦 5%/15%/2 次、回斬 15%、虛弱 31%/−24%/5 回合、辟邪 −50%、還施彼身 50%/300、凝心 +1%+2%/級、殺氣訣／強刃／強甲 +10', grade: 'B', label: LB.B, sources: [QP], phase: 'web2-P2' });
  entry({ id: 'web2.passive.unwritten', cat: '被動', item: '表上沒寫的被動數字', spec: '—', current: '息怒減 20 點、忍耐加 15 點、清心 30%、焚心 20%、奪魂 12%、飄忽若神閃避 +5%、不死每場 1 次', grade: 'D', label: LB.D, sources: [], phase: 'web2-P2' });
  conflict({ id: 'K11', item: '吸血機率', sides: [{ claim: '攻擊有 12% 機率轉化 10% 傷害', sources: ['W967'], date: '2012-06' }, { claim: 'Lv1 10% 機率／10%（技能說明圖）', sources: ['W282'], date: '2012-05' }], chosen: '採 12%（snA967 較晚、為被動一覽）', handling: '採 12%、標 B；10% 說法保留', status: '已處理（web2-P2）', grade: 'B' });
  conflict({ id: 'K12', item: '紫霞與紫雲的「往昔若凝」', sides: [{ claim: '往昔若凝是紫雲的無雙（治療）', sources: ['W967', 'W282'], date: '2012–2013' }, { claim: '本作原有紫霞無雙「往昔若凝」（登場資料）', sources: ['S1'], date: '—' }], chosen: '兩邊都保留：新增紫雲（往昔若凝＝治療）；紫霞照舊', handling: '兩邊都保留：新增紫雲（往昔若凝＝治療）；紫霞照舊，標 C', status: '已處理（web2-P2）', grade: 'C' });
  entry({ id: 'web2.partner', cat: '連攜', item: '連攜對象', spec: 'snA967', current: nL + ' 名武將有連攜對象', grade: 'B', label: LB.B, sources: [QL], phase: 'web2-P2' });
  entry({ id: 'web2.partner.effect', cat: '連攜', item: '連攜效果', spec: '—', current: '兩人同時上陣：雙方攻擊 +10%，無雙時夥伴 +20 無雙值', grade: 'D', label: LB.D, sources: [], phase: 'web2-P2' });
  entry({ id: 'web2.hero.new15', cat: '武將', item: '補上 15 名武將', spec: 'snA967', current: made.slice(0, 15).map(function (i) { return byId[i].name; }).join('、') + '（名稱／品質／類型／被動／連攜 B；技能名／倍率／外觀 D）', grade: 'B', label: LB.B, sources: [Q('武將一覽列出袁紹、阿珂、天山童姥、董卓、鰲拜、張遼、左冷禪、顏良、李莫愁、無涯子、任我行、夏侯惇、小昭、紫雲、甄姬')], phase: 'web2-P2' });
  entry({ id: 'web2.hero.white6', cat: '武將', item: '6 名白將', spec: 'sn60', current: '曹豹、曹德、曹昂、曹節、丁管、汗貼摩（白品 B；其餘全 D）', grade: 'B', label: LB.B, sources: [{ s: 'W60', q: '白：曹豹、曹德、曹昂、曹節、丁管、汗貼摩' }], phase: 'web2-P2' });
  entry({ id: 'web2.hero.new.detail', cat: '武將', item: '新武將技能名、倍率、外觀', spec: '—', current: '技能名本作自訂；倍率＝snA967 倍率 × 本作換算（主動 ×1.6、無雙 ×2.9）', grade: 'D', label: LB.D, sources: [], phase: 'web2-P2' });
  entry({ id: 'web2.range.glyph', cat: '戰鬥', item: '新武將攻擊範圍', spec: 'snA967 格圖', current: '格圖換算：● 是空白對齊；武將所在列（奇數列取中間）第一格 ■ 是自己，往右是前方第 1、2…格；7 列無雙圖只取上下 2 列', grade: 'C', label: LB.C, sources: [Q('天山童姥 無雙「●■ ●■ ■■■■ ●■ ●■」')], phase: 'web2-P2' });
  entry({ id: 'web2.formation.cells8', cat: '陣法', item: '每陣 8 格', spec: 'sn77', current: '8 陣都是 8 格（八卦陣中宮虛位）；哪一格空著是本作設計', grade: 'A', label: LB.A, sources: [{ s: 'W77', q: '陣法面板「允許 8 個武將出戰」' }], phase: 'web2-P2' });
  entry({ id: 'web2.formation.kinds', cat: '陣法', item: '陣法加成種類', spec: 'sn77', current: '八卦 物+法攻、鋒矢 命中+攻、七星 暴擊+攻、雁行 敏捷、偃月 閃避+防、魚鱗 物+法防、錐行 減 NPC 傷害 16%（對玩家無效）+防', grade: 'A', label: LB.A, sources: [{ s: 'W77', q: '錐行陣：減少NPC傷害16%（對玩家無效）' }], phase: 'web2-P2' });
  entry({ id: 'web2.formation.values', cat: '陣法', item: '陣法加成數字（%）', spec: 'sn77 為 Lv11 固定值（如八卦 +1453）', current: '本作用百分比：攻 3～5%、防 4～6%、命中/暴擊/閃避 +3、敏捷 +6%', grade: 'D', label: LB.D, sources: [], phase: 'web2-P2' });
  entry({ id: 'web2.ultname.pv', cat: '技能', item: '宣傳片無雙名', spec: '宣傳片', current: '關羽 義薄雲天（A）；落英神劍→黃藥師、雷霆震怒→張飛、日月神功→任我行、驚鴻月斬→甄姬（C：片中未標武將）', grade: 'A', label: LB.A, sources: [{ s: 'WPV', q: '直書金字：義薄雲天(關羽)、落英神劍、雷霆震怒、驚鴻月斬、日月神功' }], phase: 'web2-P2' });
  entry({ id: 'web2.slot.necklace', cat: '裝備', item: '玉墜部位改稱項鍊', spec: '—', current: '只改顯示名稱，存檔欄位 jade 不變', grade: 'A', label: LB.A, sources: [{ s: 'W282', q: '裝備截圖部位名稱為「項鍊」' }], phase: 'web2-P2' });
  // 我方有、所有來源都查不到的 10 名（Tomas 18:39 指示：保留並標 D）
  var U10 = ['hongqigong', 'zixia', 'huangyaoshi', 'ouyangfeng', 'simayi', 'zhizunbao', 'yuebuqun', 'weiyan', 'huangzhong', 'ganning'];
  entry({ id: 'web2.hero.unsourced10', cat: '武將', item: '查無來源的 10 名武將（洪七公、紫霞、黃藥師、歐陽鋒、司馬懿、至尊寶、岳不群、魏延、黃忠、甘寧）', spec: '—', current: '保留在遊戲中；品質、類型、技能、魂量都是本作設定。若日後找到來源再升級：' + U10.join(','), grade: 'D', label: LB.D, sources: [], phase: 'web2-P2' });
  return { made: made, nP: nP, nL: nL };
};
