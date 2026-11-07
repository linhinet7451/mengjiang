// 網路資料搜查-2 P3：技能倍率與來源明確的傷害上限。由 tools/web2-data.js 呼叫。
// 來源列只提供基準點；中間等級插值與 cap 套用範圍另列 C/D，不冒充原始證據。
var fs = require('fs'), path = require('path');
module.exports = function (o) {
  var H = o.H, entry = o.entry, LB = o.LB;
  var sourcePath = path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-snA967-skills.json');
  var rows = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
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

  var detail = (o.P.entries || []).filter(function (e) { return e.id === 'web2.hero.new.detail'; })[0];
  if (detail) detail.current = '21 名新增武將的名稱／外觀仍屬 D；技能倍率改由 web2.skill.rates 分開記錄，未列來源者保留本作倍率。';
  entry({ id: 'web2.skill.rates', cat: '技能', item: '技能倍率基準', spec: 'snA967 表 5：普攻、六等普攻、無雙', current: '61 名武將的 Lv1 普攻、Lv6 普攻與無雙基準採來源表；88 名中其餘未列者維持原本 D 級倍率。', grade: 'B', label: LB.B, sources: [{ s: 'W967', q: '表 5：武將普攻、六等普攻與無雙倍率' }], phase: 'web2-P3' });
  entry({ id: 'web2.skill.activeCurve', cat: '技能', item: '普攻技能等級曲線', spec: 'Lv1 a+5、Lv6 b+125；Lv6 後固定值每級 +50', current: 'Lv1 倍率 a、Lv6 倍率 b；Lv1 固定值 +5、Lv5 +75、Lv6 +125、Lv7 起每級 +50。Lv2–5 倍率依 Lv1/Lv6 線性插值，Lv2–4 固定值依 Lv1/Lv5 線性插值，均為推估。', grade: 'C', label: LB.C, sources: [{ s: 'W967', q: '表 5：普攻與六等普攻基準' }, { s: 'W282', q: '小昭 tooltip 可見 Lv5 +75、Lv6 +125、Lv7 +175、Lv9 +275' }], phase: 'web2-P3', note: '中間等級為明示的線性插值政策，非逐級截圖值；Lv5 固定值節點取小昭截圖。' });
  entry({ id: 'web2.skill.ultProgression', cat: '技能', item: '無雙技能升級曲線', spec: '無雙基準 c+10', current: '來源替換無雙基準倍率與固定值；升級時沿用既有 6% 倍率／10% 固定值成長，因來源未提供完整逐級表，仍屬本作 D 級曲線。', grade: 'D', label: LB.D, sources: [{ s: 'W967', q: '表 5：無雙技能倍率基準' }], phase: 'web2-P3' });
  entry({ id: 'web2.skill.capObserved', cat: '技能', item: '截圖可見的技能傷害上限', spec: '楊過普攻 Lv6 上限 6000；劉備無雙 Lv1 上限 3000', current: '只套用到楊過 active 與劉備 ult；劉備無雙按截圖恢復為對敵全體攻擊。', grade: 'A', label: LB.A, sources: [{ s: 'W282', q: '楊過 Lv6 傷害上限 6000；劉備無雙 Lv1 傷害上限 3000、9 個目標' }], phase: 'web2-P3' });
  entry({ id: 'web2.skill.capRule', cat: '技能', item: '傷害上限引擎解讀', spec: '依截圖上限', current: '上限按每一目標的單次最終傷害套用（防禦、暴擊與增減傷計算後）；不跨目標累加，也不套用於治療／持續傷害。', grade: 'C', label: LB.C, sources: [{ s: 'W282', q: '截圖有上限數值，但未說明是單次、總傷害或計算階段；此為引擎解讀' }], phase: 'web2-P3', note: '上限作用範圍是明確的本作解讀，不聲稱原作證據已定義。' });
  return { mapped: mapped, rows: Object.keys(rows).length, ids: used };
};
