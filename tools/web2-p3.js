// 網路資料搜查-2 P3：技能倍率與來源明確的傷害上限。由 tools/web2-data.js 呼叫。
// 來源列只提供基準點；中間等級插值與 cap 套用範圍另列 C/D，不冒充原始證據。
var fs = require('fs'), path = require('path');
module.exports = function (o) {
  var H = o.H, C = o.C, T = o.T, entry = o.entry, conflict = o.conflict, LB = o.LB;
  var sourcePath = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-snA967-skills.json');
  var rows = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  var gridPath = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-snA967-grids.json');
  var grids = JSON.parse(fs.readFileSync(gridPath, 'utf8'));
  var heroPath = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-snA967-heroes.json');
  var sourceHeroes = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  var lv6Path = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-snA282-lv6.json');
  var lv6Rows = JSON.parse(fs.readFileSync(lv6Path, 'utf8')).heroes;
  var byName = {}, aliases = {
    '建甯公主': '建寧公主',
    '丘處機': '邱處機',
    '無涯子': '無崖子',
    '喬峰': '蕭峰'
  };
  H.list.forEach(function (h) { byName[h.name] = h; });
  function readPair(text, fixed) {
    var re = new RegExp('([0-9]+(?:\\.[0-9]+)?)\\s*\\+\\s*' + fixed + '\\b');
    var m = String(text || '').match(re);
    return m ? Number(m[1]) : null;
  }
  var mapped = 0, skipped = [], used = {};
  Object.keys(rows).forEach(function (name) {
    var displayName = aliases[name] || name, h = byName[displayName], row = rows[name];
    if (!h) { skipped.push(name); return; }
    if (!h.active || !h.ult || row.length < 4) throw new Error('P3 技能資料缺欄位：' + name);
    var lv1 = readPair(row[1], 5), lv6 = readPair(row[2], 125), ult = readPair(row[3], 10);
    if (lv1 == null || lv6 == null || ult == null) throw new Error('P3 倍率無法無歧義解析：' + name + ' / ' + row.slice(1, 4).join(' | '));
    h.active.p3 = { lv1Mult: lv1, lv6Mult: lv6, source: 'W967' };
    h.ult.p3 = { mult: ult, flat: 10, source: 'W967' };
    used[h.id] = true; mapped++;
  });
  if (skipped.length) throw new Error('P3 技能來源有武將未映射：' + skipped.join('、'));
  if (mapped !== Object.keys(rows).length) throw new Error('P3 技能列數不一致：' + mapped + '/' + Object.keys(rows).length);

  // snA282 tooltip 明確記錄的兩個上限；劉備無雙為對敵傷害，不是治療技能。
  var yg = H.list.filter(function (h) { return h.id === 'yangguo'; })[0];
  var lb = H.list.filter(function (h) { return h.id === 'liubei'; })[0];
  if (!yg || !lb) throw new Error('P3 cap 對應武將不存在');
  yg.active.p3.maxDamage = 6000;
  lb.ult.p3.maxDamage = 3000;
  lb.ult.p3.pattern = 'all';

  // P3-2：將既有武將的 snA967 格圖轉成可執行範圍。若 W282 有直接 Lv6 截圖，
  // 優先採用該格位；W967 的 ●/■ 錨點轉換仍標 C，來源缺列者維持既有 D pattern。
  var glyph967 = require('./glyph967.js'), byId = {}, gridById = {}, heroMeta = {}, lv6ById = {};
  H.list.forEach(function (h) { byName[h.name] = h; byId[h.id] = h; });
  sourceHeroes.forEach(function (h) { if (h.color && h.color !== '-') heroMeta[h.name] = h; });
  function sourceDisplay(name) { return aliases[name] || name; }
  Object.keys(grids).forEach(function (name) {
    var display = sourceDisplay(name), h = byName[display];
    if (!h) throw new Error('P3-2 W967 格圖未映射：' + name);
    if (gridById[h.id]) throw new Error('P3-2 W967 格圖重複映射：' + h.id);
    gridById[h.id] = { name: name, rows: grids[name] };
  });
  Object.keys(lv6Rows).forEach(function (name) {
    var display = sourceDisplay(name), h = byName[display], row = lv6Rows[name];
    if (row.shape) {
      if (!h) throw new Error('P3-2 W282 Lv6 格圖未映射：' + name);
      lv6ById[h.id] = { name: name, row: row };
    }
  });
  function shapeKey(shape) {
    return JSON.stringify((shape || []).map(function (p) { return [p[0], p[1]]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; }));
  }
  function checkShape(shape, label) {
    var seen = {};
    if (!Array.isArray(shape) || !shape.length) throw new Error('P3-2 空範圍：' + label);
    shape.forEach(function (p) {
      if (!Array.isArray(p) || p.length !== 2 || Math.floor(p[0]) !== p[0] || Math.floor(p[1]) !== p[1] || p[0] < -2 || p[0] > 2 || p[1] < 0) throw new Error('P3-2 無效 offset：' + label);
      var k = p[0] + ',' + p[1]; if (seen[k]) throw new Error('P3-2 重複 offset：' + label); seen[k] = true;
    });
  }
  var sixKings = ['岳靈珊', '鹿杖客', '蔡文姬', '張角', '丘處機', '華雄'];
  var purpleUnchanged = ['趙雲', '呂布'];
  var rangeConflicts = [], ranges = 0, fallbackRanges = 0, w282ShapeRows = 0, w282HighRows = 0;
  function recordConflict(c) { if (o.conflict) o.conflict(c); rangeConflicts.push(c.id); }
  function addFallback(h) {
    var id = 'web2.range.hero.' + h.id;
    delete h.active.range14; delete h.ult.range14;
    entry({ id: id, cat: '技能範圍', item: h.name + '技能範圍', spec: '未列來源', current: '未列來源；RV14 保留原 pattern。', grade: 'D', label: LB.D, sources: [], phase: 'web2-P3-2' });
    fallbackRanges++;
  }
  Object.keys(gridById).forEach(function (id) {
    var h = byId[id], srcRow = gridById[id], row = srcRow.rows, meta = heroMeta[srcRow.name];
    if (!meta || !h.active || !h.ult || !Array.isArray(row) || row.length !== 3) throw new Error('P3-2 W967 缺技能／色階欄：' + srcRow.name);
    var basic = glyph967(row[0]), ult = glyph967(row[2]), w282 = lv6ById[id], rawLv6 = row[1] === 'same' ? basic : glyph967(row[1]);
    var level6Shape = w282 ? w282.row.shape : rawLv6.shape;
    checkShape(basic.shape, srcRow.name + ' Lv1'); checkShape(level6Shape, srcRow.name + ' Lv6'); checkShape(ult.shape, srcRow.name + ' ult');
    var changed = shapeKey(basic.shape) !== shapeKey(level6Shape), lv6Source = w282 ? 'W282' : 'W967';
    var lv6Ambiguous = w282 ? !!w282.row.q : (row[1] !== 'same' && rawLv6.ambiguous);
    var heroConflicts = [];
    if (row[1] === 'same' && w282 && changed) {
      var sameConflict = 'P3R-SHAPE-' + h.id.toUpperCase();
      recordConflict({ id: sameConflict, item: h.name + ' Lv6 範圍', sides: [{ claim: 'W967 格圖標註 same', sources: ['W967'] }, { claim: 'W282 直接 Lv' + w282.row.lv + ' 截圖格位與 W967 基礎格位不同', sources: ['W282'] }], handling: '以 W282 直接截圖格位為 Lv6 shape；W967 same 記錄保留作為來源差異。', status: '已處理（web2-P3-2）' });
      heroConflicts.push(sameConflict);
    }
    if (meta.color === '綠' && sixKings.indexOf(srcRow.name) < 0) throw new Error('P3-2 未知綠魂將：' + srcRow.name);
    if (meta.color === '綠' && changed) throw new Error('P3-2 sn8 六大天王範圍應不變：' + srcRow.name);
    if (meta.color === '藍' && !changed) throw new Error('P3-2 sn8 藍將範圍應改變：' + srcRow.name);
    if (meta.color === '紫' && purpleUnchanged.indexOf(srcRow.name) >= 0 && changed) throw new Error('P3-2 sn8 紫將例外應不變：' + srcRow.name);
    if (meta.color === '紫' && purpleUnchanged.indexOf(srcRow.name) < 0 && !changed) {
      var ruleConflict = 'P3R-SN8-' + h.id.toUpperCase();
      recordConflict({ id: ruleConflict, item: h.name + ' Lv6 範圍', sides: [{ claim: 'sn8 規則：除趙雲、呂布外紫將六等範圍會變', sources: ['W8'] }, { claim: 'W967 基礎與 Lv6 格圖相同；W282 只記 4 個目標、未記格位', sources: ['W967', 'W282'] }], handling: '沒有直接替代格位可採；保留 W967 shape 並標 C，待取得清晰 Lv6 格圖再解決。', status: '保留（待補直接範圍格圖）' });
      heroConflicts.push(ruleConflict);
    }
    var pid = 'web2.range.hero.' + h.id;
    h.active.range14 = [basic.shape, level6Shape];
    h.ult.range14 = ult.shape;
    var srcs = [{ s: 'W967', q: '技能格圖' }];
    if (w282) srcs.push({ s: 'W282', q: 'Lv' + w282.row.lv + ' 直接格圖' });
    var detailNote = '';
    if (lv6Ambiguous) detailNote += (w282 ? 'W282' : 'W967') + ' shape? 模糊格位，C。';
    if (basic.ambiguous || ult.ambiguous) detailNote += 'W967 基礎／無雙格圖讀圖有歧義，C。';
    if (w282 && w282.row.lv > 6) detailNote += '採 Lv' + w282.row.lv + ' 圖推用於 Lv6，C。';
    if (heroConflicts.length) detailNote += '來源差異：' + heroConflicts.join('、') + '。';
    entry({ id: pid, cat: '技能範圍', item: h.name + '技能範圍', spec: '格圖', current: '普攻／無雙 W967；Lv6 ' + lv6Source + (w282 && w282.row.lv > 6 ? '（Lv' + w282.row.lv + ' 推用）' : '') + '。', grade: 'C', label: LB.C, sources: srcs, conflicts: heroConflicts, phase: 'web2-P3-2', note: detailNote || '●／■ 轉相對位移依 web2.range.glyph，規則為 C。' });
    ranges++;
    if (w282) { w282ShapeRows++; if (w282.row.lv > 6) w282HighRows++; }
  });
  H.list.forEach(function (h) { if (!gridById[h.id]) addFallback(h); });
  addFallback(H.lead);
  if (ranges !== Object.keys(grids).length || ranges !== 61 || w282ShapeRows !== 49 || w282HighRows !== 15 || fallbackRanges !== H.list.length + 1 - ranges) throw new Error('P3-2 範圍筆數不一致：來源 ' + Object.keys(grids).length + '，映射 ' + ranges + '，W282 格位 ' + w282ShapeRows + '（Lv6 ' + (w282ShapeRows - w282HighRows) + '、Lv7+ ' + w282HighRows + '），fallback ' + fallbackRanges);
  var allConflictIds = rangeConflicts.slice();
  entry({ id: 'web2.skill.rangeShapes', cat: '技能範圍', item: '既有武將普攻／六等／無雙格圖', spec: 'snA967／snA282／sn8', current: '61 名 W967 武將已映射；49 名有 W282 直接格位截圖（' + (w282ShapeRows - w282HighRows) + ' 張 Lv6、' + w282HighRows + ' 張 Lv7+ 推用），其餘使用 W967 六等格圖。另 ' + fallbackRanges + ' 名（含主角）未列來源，保留原 pattern。每名均有 web2.range.hero.* provenance；格圖轉位依賴 C 級錨點推定。', grade: 'C', label: LB.C, sources: [{ s: 'W967', q: '61 名普攻／六等普攻／無雙格圖' }, { s: 'W282', q: '34 張 Lv6 格位圖、15 張 Lv7+ 推用；模糊形狀 C' }, { s: 'W8', q: '六等範圍變化規則' }], conflicts: allConflictIds, phase: 'web2-P3', note: '有 W282 格位圖時優先；Lv7+ 推用及模糊格位標 C；缺來源者不作推測。' });
  entry({ id: 'web2.skill.rangeLv6Rules', cat: '技能範圍', item: '六等範圍變化與無雙不變', spec: 'sn8', current: '六大天王（六名綠魂將）不變；紫將趙雲、呂布不變；藍將全部改變；無雙範圍不隨等級改變。紫雲依 W282 Lv6 直接圖採改變；熊貓 W967 基礎／Lv6 格圖相同，W282 未提供形狀，保留 C 級衝突。', grade: 'B', label: LB.B, sources: [{ s: 'W8', q: '初期六天王六等不變、紫將只有趙雲／呂布不變、藍將全變、無雙不變' }, { s: 'W282', q: 'Lv6 技能截圖格位；紫雲三格範圍' }, { s: 'W967', q: '表 5 格圖' }], conflicts: allConflictIds, phase: 'web2-P3', note: '來源衝突不以臆測補格：紫雲採用直接 Lv6 圖；熊貓暫保留 W967 明確格圖，待清晰截圖。' });

  var detail = (o.P.entries || []).filter(function (e) { return e.id === 'web2.hero.new.detail'; })[0];
  if (detail) detail.current = '21 名新增武將的名稱／外觀仍屬 D；技能倍率改由 web2.skill.rates 分開記錄，未列來源者保留本作倍率。';
  entry({ id: 'web2.skill.rates', cat: '技能', item: '技能倍率基準', spec: 'snA967 表 5：普攻、六等普攻、無雙', current: '61 名武將的 Lv1 普攻、Lv6 普攻與無雙基準採來源表；88 名中其餘未列者維持原本 D 級倍率。', grade: 'B', label: LB.B, sources: [{ s: 'W967', q: '表 5：武將普攻、六等普攻與無雙倍率' }], phase: 'web2-P3' });
  entry({ id: 'web2.skill.activeCurve', cat: '技能', item: '普攻技能等級曲線', spec: 'Lv1 a+5、Lv6 b+125；Lv6 後固定值每級 +50', current: 'Lv1 倍率 a、Lv6 倍率 b；Lv1 固定值 +5、Lv5 +75、Lv6 +125、Lv7 起每級 +50。Lv2–5 倍率依 Lv1/Lv6 線性插值，Lv2–4 固定值依 Lv1/Lv5 線性插值，均為推估。', grade: 'C', label: LB.C, sources: [{ s: 'W967', q: '表 5：普攻與六等普攻基準' }, { s: 'W282', q: '小昭 tooltip 可見 Lv5 +75、Lv6 +125、Lv7 +175、Lv9 +275' }], phase: 'web2-P3', note: '中間等級為明示的線性插值政策，非逐級截圖值；Lv5 固定值節點取小昭截圖。' });
  entry({ id: 'web2.skill.ultProgression', cat: '技能', item: '無雙技能升級曲線', spec: '無雙基準 c+10', current: '來源替換無雙基準倍率與固定值；升級時沿用既有 6% 倍率／10% 固定值成長，因來源未提供完整逐級表，仍屬本作 D 級曲線。', grade: 'D', label: LB.D, sources: [{ s: 'W967', q: '表 5：無雙技能倍率基準' }], phase: 'web2-P3' });
  entry({ id: 'web2.skill.capObserved', cat: '技能', item: '截圖可見的技能傷害上限', spec: '楊過普攻 Lv6 上限 6000；劉備無雙 Lv1 上限 3000', current: '只套用到楊過 active 與劉備 ult；劉備無雙按截圖恢復為對敵全體攻擊。', grade: 'A', label: LB.A, sources: [{ s: 'W282', q: '楊過 Lv6 傷害上限 6000；劉備無雙 Lv1 傷害上限 3000、9 個目標' }], phase: 'web2-P3' });
  entry({ id: 'web2.skill.capRule', cat: '技能', item: '傷害上限引擎解讀', spec: '依截圖上限', current: '上限按每一目標的單次最終傷害套用（防禦、暴擊與增減傷計算後）；不跨目標累加，也不套用於治療／持續傷害。', grade: 'C', label: LB.C, sources: [{ s: 'W282', q: '截圖有上限數值，但未說明是單次、總傷害或計算階段；此為引擎解讀' }], phase: 'web2-P3', note: '上限作用範圍是明確的本作解讀，不聲稱原作證據已定義。' });

  // P3-3～P3-5：僅把可取得的原始資料寫入 runtime；不替缺值補算。
  var p3facts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-p3-3-5.json'), 'utf8'));
  var openRows = p3facts.buildingOpenLevels.filter(function (x) { return x.implemented; });
  openRows.forEach(function (x) { if (!C.buildings[x.key]) throw new Error('P3-3 找不到建築設定：' + x.key); C.buildings[x.key].open = x.level; });
  entry({ id: 'web2.building.openLevels', cat: '建築', item: '已實作建築開放等級', spec: 'G2 sn=41', current: '無極幻境 12、通天塔 22、將星錄 30；其他原版社群／尚未實作建築僅記於來源摘錄，不新增入口。', grade: 'B', label: LB.B, sources: [{ s: 'S1', q: '無極幻境 12、通天塔 22、將星錄 30 級開放' }], phase: 'web2-P3-3', note: '舊存檔曾依本作舊門檻開放的將星錄，由 v10→v11 遷移保留存取。' });
  entry({ id: 'web2.building.jiangxingStages', cat: '建築', item: '將星錄分段', spec: '30/45/60/75/80', current: '門檻表記為 30、45、60、75、80；原文只說每到一階段可多開將星錄，本作未據此猜測每段數量或效果。', grade: 'B', label: LB.B, sources: [{ s: 'S1', q: '30,45,60,75,80 為一個階段；等級未到開了也多不了一個將星錄' }], phase: 'web2-P3-3' });

  C.expTable = { minLevel: p3facts.experience.minLevel, maxLevel: p3facts.experience.maxLevel, values: p3facts.experience.values.slice(), tailRate: 0.05 };
  if (C.expTable.values.length !== 73 || C.expTable.values[65] !== C.expTable.values[66]) throw new Error('P3-4 經驗表長度／Lv72-73 原文值不一致');
  entry({ id: 'web2.exp.levels', cat: '經驗', item: '逐級升級經驗 Lv7–79', spec: 'G2 sn=6', current: '73 級直接採表；原文 Lv72 與 Lv73 都是 892766，照錄，不修正。', grade: 'B', label: LB.B, sources: [{ s: 'W6', q: '每等級升級所需經驗值 7–79' }], phase: 'web2-P3-4', note: '原文另列 7 至若干等級的階級累計值；遊戲使用逐級表，不把兩種欄位混用。' });
  entry({ id: 'web2.exp.edges', cat: '經驗', item: '來源表外等級經驗', spec: 'Lv1–6、Lv80–90', current: 'Lv1–6 沿用既有低階公式；Lv80–90 以 Lv79 原表值為錨，每級 ×1.05。均標 D，不冒充原版逐級值。', grade: 'D', label: LB.D, sources: [], phase: 'web2-P3-4', note: '尾段採單調遞增的暫定外插政策；若找到原表，直接替換並保留舊存檔等級。' });

  C.jiangxing = { soulCostsByLevel: p3facts.jiangxing.soulCostsByLevel, combos: p3facts.jiangxing.combinations };
  entry({ id: 'web2.jiangxing.comboNames', cat: '將星錄', item: '原版組合名稱', spec: 'G2 sn=41/47/60', current: p3facts.jiangxing.combinations.map(function (x) { return x.name; }).join('、'), grade: 'B', label: LB.B, sources: [{ s: 'S1', q: '將星錄段落列出推薦組合名稱' }, { s: 'W47', q: '新增之將星錄組合名稱' }, { s: 'W60', q: '曹魏英豪、嵩山劍氣、世外高人、妻妾成群等相關將魂記載' }], phase: 'web2-P3-5' });
  entry({ id: 'web2.jiangxing.comboDetails', cat: '將星錄', item: '組合條件與效果文字', spec: 'G2 sn=47/41/60', current: '傲血忠魂、天山霜雪有可直接抄錄的條件與效果；其他組合只有部分條件、推薦或名稱，缺項留白。效果文字只供參考，本版不套入戰鬥。', grade: 'C', label: LB.C, sources: [{ s: 'W47', q: '部分新增組合含條件與效果' }, { s: 'S1', q: '組合名稱及分段說明' }, { s: 'W60', q: '部分組合所需武將／不可合成提示' }], phase: 'web2-P3-5', note: '只有完整列明的兩組條件才判斷進度；組合效果的受益角色與屬性套用時點未充分說明。' });
  entry({ id: 'web2.jiangxing.combatEffects', cat: '將星錄', item: '原版組合效果戰鬥套用', spec: 'P3-5', current: '來源效果字串只在組合卡片呈現；本版所有組合效果均未加進戰鬥屬性，避免自行推斷受益角色、屬性累加時點或效果持續規則。', grade: 'D', label: LB.D, sources: [{ s: 'W47', q: '列出部分效果數值，但未完整描述戰鬥屬性的對應欄位、受益範圍與套用時點' }], phase: 'web2-P3-5', note: '若取得直接玩法證據，再以結構化 bonus 欄位實作並補戰鬥快照測試。' });
  entry({ id: 'web2.jiangxing.soulCosts', cat: '將星錄', item: '白／綠／藍／30 紫／45 紫升至 Lv18 所需魂', spec: 'G2 sn=53，對照 sn=48', current: '逐級資料照錄；空白保持 null。綠魂資料列到 Lv18，其他品階只到原表有值的等級。', grade: 'B', label: LB.B, sources: [{ s: 'W53', q: '白／綠／藍／30 紫／45 紫逐級所需魂數表' }, { s: 'W48', q: '1-2、2-3 等升級區間所需魂數；局部對照' }], conflicts: ['P3R-JX-WHITE-L10'], phase: 'web2-P3-5', note: '升至該級的消耗；空白不外推。白魂 Lv10 來源差異另留 C 級欄位。' });
  conflict({ id: 'P3R-JX-WHITE-L10', item: '白魂升到 Lv10 所需魂數', sides: [{ claim: '11 魂', sources: ['W53'], date: '2012-12-16' }, { claim: '10 魂（9-10 升級）', sources: ['W48'], date: '2012-11-26' }], handling: 'runtime 表留 null，暫不允許依猜值升至白魂 Lv10；兩個原值與來源均保留。', status: '待補原圖或直接證據（web2-P3-5）' });
  entry({ id: 'web2.jiangxing.soulCosts.white10', cat: '將星錄', item: '白魂 Lv10 所需魂數', spec: 'W48／W53', current: 'null（衝突未裁決，升級不猜值）', grade: 'C', label: LB.C, sources: [{ s: 'W53', q: 'Lv10 欄 11 魂' }, { s: 'W48', q: '9-10 欄 10 魂' }], conflicts: ['P3R-JX-WHITE-L10'], phase: 'web2-P3-5' });
  entry({ id: 'web2.jiangxing.legacyRefund', cat: '存檔', item: '舊二十八宿星盤遷移', spec: 'v10→v11', current: '將舊星盤已點亮顆數依舊本作成本全數折回星魂餘額；原有餘額保留，舊星盤加成停止套用。', grade: 'D', label: LB.D, sources: [], phase: 'web2-P3-5', note: '這是存檔相容政策，不是原作規則。' });

  // P3-6：保存來源明示的戰場道具圖形與效果欄；傷害係數、灼傷數值及旗幟受益對象不推測。
  var p36facts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-p3-6.json'), 'utf8'));
  C.battleItems = p36facts.battleItems;
  var bombText = C.battleItems.bombs.map(function (x) { return x.name + ' ' + x.rows.join('/'); }).join('；');
  entry({ id: 'web2.battleItems.bombs', cat: '戰場道具', item: '炸彈範圍與威力級距', spec: 'G2 sn=51', current: bombText + '；大／中／小威力依序低／中／高，命中目標隨機。', grade: 'B', label: LB.B, sources: [{ s: 'W51', q: '炸彈三種 X/O 圖格及大小範圍／威力級距；命中隨機' }], phase: 'web2-P3-6', note: 'O 表示來源明確標示的爆炸格；沒有傷害係數，沿用呼叫者的技能傷害，不另造數值。' });
  entry({ id: 'web2.battleItems.flag', cat: '戰場道具', item: '旗幟增益級距', spec: 'G2 sn=51', current: '命中 1 次 8%×1；2 次 7%×2＝14%；3 次 6%×3＝18%。可辨識例子為物攻、法攻、命中、法防；屬性隨機。', grade: 'B', label: LB.B, sources: [{ s: 'W51', q: '旗幟變色、隨機 BUFF 屬性及 1～3 次級距' }], phase: 'web2-P3-6', note: '來源稱還有其他屬性且次數越多效果越大，但未列完整屬性池／受益對象，也未列第 4 次起級距；引擎只解析已列級距，不套戰鬥屬性。' });
  entry({ id: 'web2.battleItems.flame', cat: '戰場道具', item: '噴火槍範圍與灼傷', spec: 'G2 sn=51', current: '依左右方向發射 4 格斜線；附帶灼傷，傷害定性高於炸彈。', grade: 'B', label: LB.B, sources: [{ s: 'W51', q: '左右兩種噴火槍四格斜線示意、灼傷及相對傷害描述' }], phase: 'web2-P3-6', note: '沒有傷害係數、灼傷機率或持續回合數；保留形狀與狀態名稱，不臆造數值。' });
  entry({ id: 'web2.honorTrial.frames', cat: '榮譽試煉', item: 'BOSS／精英外框', spec: 'G2 sn=17', current: 'BOSS 金框；精英銀框。已用於現有對應關卡的敵方首領辨識。', grade: 'B', label: LB.B, sources: [{ s: 'W17', q: '榮譽試煉 BOSS 周圍金框、精英周圍銀邊' }], phase: 'web2-P3-6', note: '只重用身分框色；不宣稱榮譽試煉多人棋盤玩法已實作。' });
  entry({ id: 'web2.battleItems.applicationLimits', cat: '戰場道具', item: '未明示道具戰鬥數值', spec: 'W51', current: '旗幟只呈現已知隨機級距；炸彈／噴火槍只呈現格形與定性效果，不套用未記載的戰鬥數值。', grade: 'D', label: LB.D, sources: [], phase: 'web2-P3-6', note: '來源未說明旗幟完整受益對象、燒傷數值與炸彈倍率；此為避免推測的本作政策。' });
  var frameCount = 0;
  if (T && Array.isArray(T.stages)) T.stages.forEach(function (stage) {
    (stage.enemies || []).forEach(function (enemy) {
      if (!enemy.leader) return;
      if (stage.kind === 'boss') enemy.honorFrame = 'gold';
      else if (stage.kind === 'elite') enemy.honorFrame = 'silver';
      else delete enemy.honorFrame;
      if (enemy.honorFrame) frameCount++;
    });
  });

  // P4-1～P4-2、P4-5～P4-6：只把來源明列的資料寫入 runtime；缺少機率／數值的欄位保留既有本作政策。
  var p4facts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-p4-1-2-5-6.json'), 'utf8'));
  C.gems = C.gems || {};
  C.gems.sourceLevels = p4facts.gems.levels;
  C.gems.source = 'W84';
  C.xinfaSlots = [1, p4facts.xinfa.openLevel];
  C.xinfaSlotTypes = p4facts.xinfa.slotTypes.slice();
  C.xinfaSoulExp = p4facts.xinfa.soulExp;
  C.xinfaMax = p4facts.xinfa.maxLevel;
  entry({ id: 'web2.gems.levels', cat: '裝備', item: '寶石逐級數值', spec: 'G2 sn=84', current: 'W84 表套用至 gem_* ID；缺少 Lv6 不外推，舊存檔照等級讀新值。', grade: 'B', label: LB.B, sources: [{ s: 'W84', q: '逐級值及百分比說明' }], phase: 'web2-P4-1', note: '使用原始數值，不重算百分點。' });
  entry({ id: 'web2.xinfa.slots', cat: '心法', item: '心法兩格與魂經驗', spec: 'G2 sn=86/91', current: '60 級開第二格；普通／特殊分格；白1、綠10、藍50、紫100；上限100。', grade: 'B', label: LB.B, sources: [{ s: 'W86', q: '欄位與魂經驗' }, { s: 'W91', q: '屬性套用' }], phase: 'web2-P4-2', note: '舊第三格退回秘笈，原資料留 xfOverflow。' });
  function effectTags(text) {
    var s = String(text || ''), out = [];
    function add(id) { if (out.indexOf(id) < 0) out.push(id); }
    if (/眩暈/.test(s)) add('stun'); if (/灼傷|熾焰/.test(s)) add('burn'); if (/流血/.test(s)) add('bleed');
    if (/防[禦－-]/.test(s)) add('defDown'); if (/攻擊[－-]/.test(s)) add('atkDown'); if (/敏捷|敏[－-]/.test(s)) add('agi');
    if (/命中/.test(s)) add('hit'); if (/閃避/.test(s)) add('dodge'); if (/暴擊/.test(s)) add('crit'); if (/無雙/.test(s)) add('rage');
    return out;
  }
  var effectMapped = 0;
  Object.keys(rows).forEach(function (name) {
    var h = byName[aliases[name] || name], row = rows[name]; if (!h) return;
    // 逐技能原文與 tags 保留於 c-snA967-skills.json／provenance；不把大段重複資料塞入離線 runtime。
    delete h.active.sourceEffects; delete h.active.sourceFx; delete h.ult.sourceEffects; delete h.ult.sourceFx;
    effectMapped++;
  });
  entry({ id: 'web2.skill.sourceEffects', cat: '技能', item: 'W967 附加狀態', spec: 'snA967', current: effectMapped + ' 名武將效果保留於來源摘錄；未明機率／持續回合不外推。', grade: 'B', label: LB.B, sources: [{ s: 'W967', q: '技能效果欄' }], phase: 'web2-P4-5', note: '既有明確 fx 才進戰鬥。' });
  var newIds = p4facts.unverifiedHeroes.ids, foundNew = 0;
  newIds.forEach(function (id) { if (byId[id]) { delete byId[id].sourceStatus; foundNew++; } });
  entry({ id: 'web2.hero.unverifiedRoster', cat: '武將', item: '未充分來源武將', spec: 'W967', current: foundNew + ' 名保留現有登場／數值分級，不改未知倍率。', grade: 'C', label: LB.C, sources: [{ s: 'W967', q: '武將技能欄' }], phase: 'web2-P4-6', note: '待補直接數值。' });
  return { mapped: mapped, rows: Object.keys(rows).length, ids: used, ranges: ranges, fallbackRanges: fallbackRanges, openLevels: openRows.length, expLevels: C.expTable.values.length, combos: C.jiangxing.combos.length, fieldItems: C.battleItems.bombs.length + 2, frames: frameCount, p4Effects: effectMapped, p4Heroes: foundNew };
};
