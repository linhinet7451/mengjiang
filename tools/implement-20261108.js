const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
function read(p){ return JSON.parse(fs.readFileSync(path.join(root,p),'utf8')); }
function write(p,v){ fs.writeFileSync(path.join(root,p), JSON.stringify(v,null,2)+'\n'); }

// 1. 寶石 B 級數值：已知台版 Lv1~5 寫入道具資料；未知的 Lv6／絕技攻不外推。
const eq = read('src/data/equipment.json');
const gemValues = {
  atk: [17,58,164,324,665],
  hp: [54,177,495,975,1998],
  pdef: [9,29,82,162,333],
  mdef: [10,30,83,163,334],
  crit: [55,182,345,545,1000,1636]
};
Object.keys(gemValues).forEach(k => gemValues[k].forEach((v,i) => {
  const item = eq.items['gem_'+k+'_'+(i+1)];
  if (!item || !item.gem) return;
  if (k === 'atk') {
    item.gem.stats.patk = v;
    item.gem.stats.matk = v;
    item.gem.stats.jatk = v;
    // 舊存檔與既有遊戲規格要求攻擊石三種攻擊同步，維持 W84 主攻擊曲線。
    item.grade = 'B（攻擊三項同步：W84，Lv1-5）D（Lv6）';
  } else if (k === 'crit') {
    item.gem.stats.crit = v;
    item.grade = 'B（W84，Lv1-6；原始點數，不換算百分比）';
  } else {
    const stat = k === 'hp' ? 'hp' : k;
    item.gem.stats[stat] = v;
    item.grade = 'B（W84，Lv1-5）D（Lv6）';
  }
}));
write('src/data/equipment.json',eq);
// 寶石來源表補上明確 provenance，避免 UI／工具只看到舊有 sourceLevels。
const cfg = read('src/data/config.json');
cfg.gems.source = 'W84';
cfg.gems.sourceRegion = '台版';
cfg.gems.sourceGrade = 'B';
cfg.gems.sourceNote = 'W84 Lv1-Lv5 攻防／生命，暴擊 Lv1-Lv6；未列數值維持 D，不自動插值。';
// 2. 原版建築開放資料卡：衝突門檻並列，不覆蓋本作目前可玩門檻。
cfg.originalBuildings = [
  {id:'honor',name:'榮譽試煉',open:[8,10],openText:'Lv8（精華攻略）／Lv10（百科衝突）',feature:'挑戰對手取得榮譽；失敗不扣次數',region:'台版',grade:'B',source:'S1',status:'替代／部分實作'},
  {id:'wuji',name:'無極幻境',open:[12],openText:'Lv12',feature:'連續波次取得將魂與經驗，每 5 波多 1 將魂',region:'台版',grade:'B',source:'S1,S2',status:'已實作'},
  {id:'guild',name:'公會',open:[15],openText:'Lv15',feature:'公會科技、幫貢、公會神獸與幫戰',region:'台版',grade:'B',source:'S1',status:'未重建（離線）'},
  {id:'league',name:'聯賽／圖騰柱',open:[20],openText:'Lv20',feature:'聯賽競技與圖騰柱資源',region:'台版',grade:'B',source:'S1,S2',status:'未重建（離線）'},
  {id:'tongtian',name:'通天塔',open:[22],openText:'Lv22',feature:'逐層挑戰，每 10 層寶箱',region:'台版',grade:'B',source:'S1,S2',status:'已實作'},
  {id:'shanggu',name:'上古寶窟',open:[25],openText:'Lv25',feature:'3 人、3 關＋隱藏關、每次 5 精力',region:'台版',grade:'B',source:'S1,S2',status:'單機替代'},
  {id:'jiangxing',name:'將星錄',open:[30],openText:'Lv30',feature:'將魂合成與武將組合',region:'台版',grade:'B',source:'S1,S2',status:'已實作'},
  {id:'huarong',name:'華容道',open:[30],openText:'Lv30',feature:'原版社群／活動功能',region:'台版',grade:'B',source:'S1',status:'未重建'},
  {id:'wulin',name:'武林大會',open:[30,35],openText:'Lv30（FAQ）／Lv35（精華攻略）',feature:'每週報名、預測與榮譽',region:'台版',grade:'B',source:'S1,S2',status:'未重建（離線）'},
  {id:'copper',name:'銅雀台',open:[35],openText:'Lv35',feature:'真人房間與掛機獎勵',region:'台版',grade:'B',source:'FAQ',status:'未重建（離線）'},
  {id:'starwatch',name:'觀星台',open:[40],openText:'Lv40',feature:'原版後期功能',region:'台版',grade:'B',source:'S1',status:'未重建'},
  {id:'mystery',name:'玄機盤',open:[50],openText:'Lv50',feature:'原版後期功能',region:'台版',grade:'B',source:'S1',status:'未重建'},
  {id:'exorcism',name:'除魔殿',open:[65],openText:'Lv65',feature:'公開來源僅確認開放線索',region:'台版',grade:'B/C',source:'S1',status:'未重建（資料不足）'}
];
cfg.uiGolden = {
  version:'2026-11-08-ui-golden-v1', region:'台版', grade:'B',
  targets:[
    {id:'city-hud',name:'主城 HUD',check:'左側角色卡、右上金幣／銀幣／訊息、底部功能列'},
    {id:'shenwu-tabs',name:'神武殿分頁',check:'裝備／技能／訓練／培養層級與金邊宣紙面板'},
    {id:'juxian-quality',name:'聚賢莊品質色',check:'黑／白／綠／藍／紫統一用於卡片、框線與文字'},
    {id:'stage-panels',name:'副本面板',check:'虛空、無極、通天的木框、金邊、返回層級'},
    {id:'battle-hud',name:'戰鬥 HUD',check:'我方頭像列、血條、無雙條與技能格預覽'}
  ],
  note:'依 S1/S2/W967 公開台版截圖校正相對比例與欄位順序；沒有公開原版色碼、音樂或動畫時間軸，不宣稱像素級原檔。'
};
write('src/data/config.json',cfg);

// 3/4. provenance matrix：每欄位獨立標示，缺口不以 runtime 推算填補。
const prov = read('src/data/provenance.json');
prov.matrix = prov.matrix || {};
prov.matrix.version = 1;
prov.matrix.updated = '2026-11-08';
prov.matrix.fieldPolicy = ['quality','type','activeName','activeLv1','activeLv6','activeRange','ultName','ultRange','passive','partner'];
prov.matrix.heroGapSource = 'W967（https://forum.gamer.com.tw/C.php?bsn=22512&snA=967）／W282（https://forum.gamer.com.tw/C.php?bsn=22512&snA=282）';
const gapIds = ['guanhai','dengmao','chengyz','ludayou','liaohua','zhoucang','peiys','tianbg','yucanghai','baobutong','zhurong','hongqigong','weiyan','zixia','huangyaoshi','ouyangfeng','huangzhong','ganning','simayi','zhizunbao','yuebuqun','caobao','caode','caoang','caojie','dingguan','hantiemo'];
const heroById = {};
(heroById.lead = {id:'lead',name:'主角'});
read('src/data/heroes.json').list.forEach(h=>heroById[h.id]=h);
prov.matrix.heroGaps = gapIds.map(id => {
  const h = heroById[id] || {id,name:id};
  return {id,name:h.name,region:'台版待補',grade:'D',status:'未列直接技能來源',fields:{quality:'待補',type:'待補',activeName:'待補',activeLv1:'待補',activeLv6:'待補',activeRange:'待補',ultName:'待補',ultRange:'待補',passive:'待補',partner:'待補'}};
});
prov.matrix.lead = {id:'lead',name:'主角',region:'台版',grade:'B/C/D',status:'僅有類型與 Lv1/Lv6 普攻最小證據',fields:{quality:'待補',type:'B：可選力敏／力耐／敏耐',activeName:'待補',activeLv1:'B：向前一格',activeLv6:'B：向前兩格',activeRange:'B：最小範圍；完整格圖待補',ultName:'待補',ultRange:'待補',passive:'待補',partner:'待補'}};
prov.matrix.buildingSource = 'S1/S2：台版玩家攻略；門檻衝突並列，不自動覆寫 runtime。';
write('src/data/provenance.json',prov);

// 5. Correct source-aware gem calculation: physical/magic attack are separate; jatk stays unverified.
const rulesPath = path.join(root,'src/js/rules.js');
let rules = fs.readFileSync(rulesPath,'utf8');
const old = "var stat = {}; stat[kind === 'atk' ? 'patk' : kind === 'hp' ? 'hp' : kind === 'pdef' ? 'pdef' : kind === 'mdef' ? 'mdef' : kind === 'jdef' ? 'jdef' : kind] = src[lv - 1];\n        if (kind === 'atk') { stat.matk = src[lv - 1]; stat.jatk = src[lv - 1]; }";
const neu = "var stat = {};\n        if (kind === 'atk') {\n          stat.patk = src[lv - 1]; stat.matk = src[lv - 1]; stat.jatk = src[lv - 1];\n        } else {\n          stat[kind === 'hp' ? 'hp' : kind === 'pdef' ? 'pdef' : kind === 'mdef' ? 'mdef' : kind === 'jdef' ? 'jdef' : kind] = src[lv - 1];\n        }";
if (rules.includes(old)) rules = rules.replace(old, neu);
rules = rules.replace("U.each(U.keys(stat), function (k) { o[k] = r2((o[k] || 0) + stat[k]); });", "if (stat) U.each(U.keys(stat), function (k) { if (stat[k] != null) o[k] = r2((o[k] || 0) + stat[k]); });");
fs.writeFileSync(rulesPath,rules);

// Create a compact, source-labelled UI for the matrix/cards.
const ui = `(function () {\n  var UI = MJ.UI, U = MJ.U;\n  function grade(g) { return '<span class="prov-grade prov-' + String(g).replace(/[^A-D]/g, '').charAt(0) + '">' + U.esc(g) + '</span>'; }\n  function sourceLink(k) { var s = MJ.D.provenance.sources && MJ.D.provenance.sources[k]; return s ? '<a class="prov-source" href="' + U.esc(s.url) + '" target="_blank" rel="noopener">' + U.esc(k) + '</a>' : U.esc(k || '未列來源'); }\n  function tabs(cur) { return '<div class="tabs prov-tabs"><a class="tab' + (cur === 'buildings' ? ' on' : '') + '" data-a="provTab" data-v="buildings">原版建築</a><a class="tab' + (cur === 'heroes' ? ' on' : '') + '" data-a="provTab" data-v="heroes">武將缺口</a><a class="tab' + (cur === 'ui' ? ' on' : '') + '" data-a="provTab" data-v="ui">UI Golden</a><a class="tab' + (cur === 'gems' ? ' on' : '') + '" data-a="provTab" data-v="gems">寶石證據</a></div>'; }\n  function buildings() { var a = MJ.D.config.originalBuildings || [], h = '<div class="prov-note">台版原版開放資料卡。衝突門檻並列；未重建功能只顯示資料，不建立假入口。</div><div class="prov-table"><table><tr><th>功能</th><th>開放</th><th>原版功能</th><th>目前</th><th>證據</th></tr>'; U.each(a,function(x){ h += '<tr><td><b>' + U.esc(x.name) + '</b></td><td>' + U.esc(x.openText) + '</td><td>' + U.esc(x.feature) + '</td><td>' + U.esc(x.status) + '</td><td>' + grade(x.grade) + ' ' + U.map(String(x.source).split(','),sourceLink).join(' ') + '</td></tr>'; }); return h + '</table></div>'; }\n  function heroRow(x) { var f=x.fields||{}; return '<tr><td><b>' + U.esc(x.name) + '</b><br><small>' + U.esc(x.id) + '</small></td><td>' + grade(x.grade) + '<br><small>' + U.esc(x.status) + '</small></td><td>' + U.esc(f.quality||'待補') + '</td><td>' + U.esc(f.type||'待補') + '</td><td>' + U.esc(f.activeName||'待補') + '<br>' + U.esc(f.activeLv1||'待補') + '／' + U.esc(f.activeLv6||'待補') + '</td><td>' + U.esc(f.activeRange||'待補') + '</td><td>' + U.esc(f.ultName||'待補') + '<br>' + U.esc(f.ultRange||'待補') + '</td><td>' + U.esc(f.passive||'待補') + '</td><td>' + U.esc(f.partner||'待補') + '</td></tr>'; }\n  function heroes() { var m=MJ.D.provenance.matrix||{}, a=(m.heroGaps||[]).slice(); a.unshift(m.lead); var h='<div class="prov-note">逐欄位缺口矩陣：沒有直接 tooltip／截圖／影片證據的欄位維持「待補」，不以 runtime 推算。來源：' + sourceLink('W967') + ' ' + sourceLink('W282') + '</div><div class="prov-table prov-heroes"><table><tr><th>武將</th><th>狀態</th><th>品質</th><th>類型</th><th>主動名稱／等級</th><th>主動範圍</th><th>無雙</th><th>被動</th><th>連攜</th></tr>'; U.each(a, function(x){h+=heroRow(x);}); return h+'</table></div>'; }\n  function uiGolden() { var g=MJ.D.config.uiGolden||{}, h='<div class="prov-note">' + U.esc(g.note||'') + '</div><div class="golden-grid">'; U.each(g.targets||[],function(x){h+='<div class="golden-card"><b>' + U.esc(x.name) + '</b><small>' + U.esc(x.check) + '</small><span>' + grade(g.grade||'B') + ' 台版</span></div>';}); return h+'</div><div class="prov-note">校色原則：欄位順序與相對比例優先；原版色碼、音效與 cut-in 時序未有公開直接證據，不自行臆測。</div>'; }\n  function gems() { var g=MJ.D.config.gems||{}, m=g.sourceLevels||{}, h='<div class="prov-note">來源：' + sourceLink(g.source||'W84') + '；台版攻略 B。缺少的數值維持未驗證，不自動插值。</div><div class="gem-source-grid">'; U.each([['patk','物攻'],['matk','法攻'],['pdef','物防'],['mdef','法防'],['hp','生命'],['crit','暴擊'],['dodge','閃避'],['hit','命中']],function(x){h+='<div class="golden-card"><b>' + x[1] + '</b><small>Lv：' + U.esc((m[x[0]]||[]).join('／')) + '</small><span>' + grade('B') + ' W84</span></div>';}); return h+'</div><div class="prov-note">本作為舊存檔相容，攻擊石三種攻擊同步採用 W84 主攻擊曲線；物防／法防／生命／命中缺少的 Lv6，以及未列原版欄位，不由其他曲線推算。</div>'; }\n  UI.modals.provenance = function () { var t=UI.sel.provTab||'buildings', body=t==='buildings'?buildings():t==='heroes'?heroes():t==='ui'?uiGolden():gems(); return UI.panel('原版資料考證',tabs(t)+body,{cls:'wide prov-panel'}); };\n  UI.actions.provTab=function(v){UI.sel.provTab=v;UI.renderModal();};\n})();\n`;
fs.writeFileSync(path.join(root,'src/js/ui-provenance.js'),ui);
let index=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
if (!index.includes('js/ui-provenance.js')) index=index.replace('<script src="js/ui-misc.js"></script>','<script src="js/ui-misc.js"></script>\n<script src="js/ui-provenance.js"></script>');
fs.writeFileSync(path.join(root,'src/index.html'),index);
// Add an always-visible evidence entry to the main city menu.
const cityPath=path.join(root,'src/js/ui-city.js'); let city=fs.readFileSync(cityPath,'utf8');
if (!city.includes("['provenance', '考證', 'scroll2']")) city=city.replace("['settings', '設置', 'gear']", "['provenance', '考證', 'scroll2'], ['settings', '設置', 'gear']");
fs.writeFileSync(cityPath,city);
// Add readable evidence-board styles while preserving the existing classic palette.
const cssPath=path.join(root,'src/css/style.css'); let css=fs.readFileSync(cssPath,'utf8');
css += '\n/* 2026-11-08 台版 UI golden reference／資料考證面板 */\n.prov-panel .panel-body{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 12px;font-size:12px}.prov-tabs{margin-bottom:8px}.prov-note{padding:6px 8px;margin:4px 0 8px;background:rgba(255,249,215,.55);border-left:4px solid #a87924;color:#5b431d;line-height:1.5}.prov-table{overflow:auto;max-height:430px;-webkit-overflow-scrolling:touch}.prov-table table{border-collapse:collapse;min-width:900px;color:#4a3514}.prov-table th,.prov-table td{border:1px solid #b89a58;padding:4px 5px;vertical-align:top;line-height:1.35}.prov-table th{background:#7b4d1e;color:#fff2c2;position:sticky;top:0;z-index:2}.prov-table tr:nth-child(even){background:rgba(255,255,255,.25)}.prov-source{display:inline-block;color:#75451a;text-decoration:underline;margin-right:4px}.prov-grade{display:inline-block;padding:0 4px;border-radius:3px;font-weight:bold;font-size:10px}.prov-A{background:#d7aa2d;color:#fff}.prov-B{background:#4f8f55;color:#fff}.prov-C{background:#b97935;color:#fff}.prov-D{background:#777;color:#fff}.golden-grid,.gem-source-grid{display:flex;display:-webkit-flex;flex-wrap:wrap;-webkit-flex-wrap:wrap;gap:7px}.golden-card{flex:1 1 180px;min-height:66px;padding:8px;background:linear-gradient(#fff6d5,#e7d19a);border:2px solid #bd9140;border-radius:7px;box-shadow:inset 0 0 8px rgba(120,80,20,.18)}.golden-card b{display:block;color:#5a2a00;font-size:14px}.golden-card small{display:block;margin:4px 0;color:#6d542b;line-height:1.4}.golden-card span{display:block}\n';
fs.writeFileSync(cssPath,css);
console.log('implemented data/UI changes');
