// 端對端測試（Playwright）：node tests/e2e.js [chromium|webkit-iphone|all]
// 以 file:// 開啟 dist/mengjiang.html，全程離線（阻擋所有 http/https 請求並記錄）
var pw = require('playwright'), path = require('path'), fs = require('fs');
var FILE = 'file://' + path.join(__dirname, '..', 'dist', 'mengjiang.html');
var BOOT = 'file://' + path.join(__dirname, '..', 'dist', 'boot-test.html');
var SHOT = path.join(__dirname, '..', 'screenshots');
var which = process.argv[2] || 'all';
var total = { pass: 0, fail: 0, lines: [] };

async function run(label, browserType, ctxOpts, shotPrefix) {
  var pass = 0, fail = 0;
  function ok(c, name) { if (c) { pass++; console.log('  通過 [' + label + '] ' + name); } else { fail++; console.log('✗ 失敗 [' + label + '] ' + name); } }
  var browser = await browserType.launch();
  var ctx = await browser.newContext(Object.assign({ offline: true }, ctxOpts));
  var net = [], errors = [];
  await ctx.route('**/*', function (route) { var u = route.request().url(); if (/^(file|data|blob|about):/.test(u)) return route.continue(); net.push(u); return route.abort(); });
  var page = await ctx.newPage();
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', function (d) { d.accept(); });
  async function act(sel) { await page.locator(sel).first().click(); await page.waitForTimeout(120); }
  async function closeModals() {
    for (var k = 0; k < 5; k++) {
      var c = page.locator('#modal [data-a="close"]:visible');
      if (!(await c.count())) return;
      await c.last().click(); await page.waitForTimeout(120);
    }
  }
  async function shot(name) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(SHOT, shotPrefix + name + '.png') }); }
  var J = function (fn, arg) { return page.evaluate(fn, arg); };

  // 啟動自我檢測頁
  await page.goto(BOOT);
  var bt = await J(function () { return window.BOOT_TEST_DONE; });
  ok(bt && bt.fail === 0, 'boot-test.html 全部通過（' + (bt ? bt.total + ' 項' : '未執行') + '）');

  // 新遊戲
  await page.goto(FILE);
  await page.waitForFunction(function () { return window.MJ && MJ.booted; }, null, { timeout: 8000 });
  ok(await page.locator('#loading').count() === 1, '顯示載入畫面');
  await page.waitForSelector('#loading', { state: 'detached', timeout: 5000 });
  ok(await J(function () { return MJ.UI.screen; }) === 'newgame', '首次開啟進入建立角色畫面');
  await shot('0-newgame');
  await page.fill('#ngName', '測試俠');
  await act('[data-a="ngStart"]');
  await page.waitForTimeout(400);
  ok(await J(function () { return MJ.UI.screen === 'city' && MJ.S.state.player.name; }) === '測試俠', '建立新角色並進入主城');
  // 關掉可能的新手提示
  await closeModals();
  await shot('1-main-city');

  // 招募
  await act('[data-a="recruit"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'recruit', '進入聚賢莊');
  await shot('2-recruit');
  var tt = await J(function () { var miss = [], ks = Object.keys(MJ.D.heroIndex).filter(function (k) { return MJ.D.heroIndex[k] && MJ.D.heroIndex[k].type; }); ks.forEach(function (k) { if (!MJ.UI.TYPE_TIP[MJ.D.heroIndex[k].type]) miss.push(k + ':' + MJ.D.heroIndex[k].type); }); return { n: ks.length, miss: miss, undef: /undefined|NaN/.test(document.getElementById('screen').textContent) }; });
  ok(tt.n > 0 && !tt.miss.length && !tt.undef, '聚賢莊所有武將類型都有說明、畫面沒有 undefined（' + tt.n + ' 名武將' + (tt.miss.length ? '，缺：' + tt.miss.slice(0, 3).join('、') : '') + '）');
  var n0 = await J(function () { return MJ.S.state.heroes.length; });
  var s0 = await J(function () { return MJ.S.state.player.silver; });
  await act('[data-a="doRecruit"]:not(.disabled)');
  ok(await page.locator('#confirm').innerText().then(function (t) { return t.indexOf('立即招募') >= 0; }), '跳出「招募武將／立即招募」確認');
  await shot('3-recruit-confirm');
  await act('[data-a="confirmYes"]');
  var n1 = await J(function () { return MJ.S.state.heroes.length; });
  var s1 = await J(function () { return MJ.S.state.player.silver; });
  ok(n1 === n0 + 1 && s1 < s0, '招募成功：武將 ' + n0 + '→' + n1 + '，銀幣 ' + s0 + '→' + s1);
  await shot('4-recruit-result');
  await closeModals();
  var newUid = await J(function () { var h = MJ.S.state.heroes; return h[h.length - 1].uid; });

  // 神武殿：上陣/下陣
  await act('[data-a="city"]');
  await act('[data-a="hall"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'hall', '進入神武殿');
  var other = await J(function () { return MJ.G.teamList().filter(function (x) { return x.hero.id !== 'lead'; })[0].hero.uid; });
  await J(function (u) { MJ.UI.sel.hallUid = u; MJ.UI.render(); }, other);
  await act('[data-a="hallRest"]');
  ok(await J(function (u) { return MJ.G.inTeam(u) == null; }, other), '按「休息」把武將移出出戰');
  await J(function (u) { MJ.UI.sel.hallUid = u; MJ.UI.render(); }, newUid);
  await act('[data-a="hallJoin"]');
  ok(await J(function (u) { return MJ.G.inTeam(u) != null; }, newUid), '按「出戰」把新武將加入隊伍');

  // 升級數值
  var lv = await J(function () { var l = MJ.G.lead(); var d = MJ.R.derived(l, MJ.S.state); return { lv: l.lv, hp: d.hp, atk: d.patk }; });
  await J(function () { MJ.G.addExp(MJ.G.lead(), 300); MJ.G.commit(); MJ.UI.sel.hallUid = MJ.G.lead().uid; MJ.UI.render(); });
  var lv2 = await J(function () { var l = MJ.G.lead(); var d = MJ.R.derived(l, MJ.S.state); return { lv: l.lv, hp: d.hp, atk: d.patk }; });
  var hallTxt = await page.locator('#screen').innerText();
  ok(lv2.lv > lv.lv && lv2.hp > lv.hp && lv2.atk > lv.atk && hallTxt.indexOf(String(lv2.hp)) >= 0, '升級 Lv' + lv.lv + '→' + lv2.lv + '，生命 ' + lv.hp + '→' + lv2.hp + '（畫面同步顯示）');

  // 裝備／卸下
  var eq = await J(function () { var t = MJ.D.equipment.list.filter(function (x) { return x.lv <= MJ.G.lead().lv; })[0]; var e = MJ.G.addEquip(t.id, 1); MJ.UI.sel.hallTab = 'equip'; MJ.UI.sel.hallBagType = t.slot; MJ.UI.render(); return { uid: e.uid, slot: t.slot, bagType: t.slot }; });
  // 若右側包裹分類不同，切到對應分類
  if (!(await page.locator('[data-a="bagPick"][data-v="' + eq.uid + '"]').count())) {
    var tabs = page.locator('[data-a="bagType"],[data-a="hallBag"],[data-a="etab"]');
    for (var i = 0; i < await tabs.count(); i++) { await tabs.nth(i).click(); if (await page.locator('[data-a="bagPick"][data-v="' + eq.uid + '"]').count()) break; }
  }
  await act('[data-a="bagPick"][data-v="' + eq.uid + '"]');
  await act('[data-a="doEquip"]');
  ok(await J(function (e) { var l = MJ.G.lead(); return l.eq[e.slot] && l.eq[e.slot].uid === e.uid; }, eq), '在神武殿穿上裝備');
  await shot('5-hall');
  await act('[data-a="slotClick"][data-v="' + eq.slot + '"]');
  await act('[data-a="confirmYes"]');
  ok(await J(function (e) { return !MJ.G.lead().eq[e.slot] && MJ.S.state.bag.equips.some(function (x) { return x.uid === e.uid; }); }, eq), '卸下裝備回到包裹');
  // P5：8 部位＋武器三類篩選
  ok(await page.locator('.eslot').count() === 8 && (await page.locator('.equip-wrap, #screen').first().innerText()).indexOf('項鍊') >= 0, '裝備分頁有 8 個部位（含項鍊〔W282 改名，原玉墜〕、護手）');
  await act('[data-a="bagSlot"][data-v="weapon"]');
  ok(await page.locator('.wkind .chip').count() === 4, '武器分頁有 全部／物攻／法攻／絕技 篩選');
  await act('.wkind [data-v="j"]');
  ok(await J(function () { return MJ.UI.sel.wKind; }) === 'j', '點「絕技」只顯示絕技武器');
  await act('.wkind [data-v=""]');
  await act('[data-a="bagSlot"][data-v="glove"]');
  ok(await J(function () { return MJ.UI.sel.bagSlot; }) === 'glove', '可切換到護手分頁');
  await act('[data-a="bagSlot"][data-v="weapon"]');
  await act('[data-a="hallTab"][data-v="skill"]');
  ok((await page.locator('#screen').innerText()).indexOf('無雙') >= 0, '技能分頁顯示 主動/無雙/被動');
  await shot('6-hall-skill');

  // ---------- 第二階段：養成 ----------
  await J(function () { var l = MJ.G.lead(); l.lv = Math.max(l.lv, 20); MJ.S.state.player.silver += 1e6; ['jinengshu', 'peiyangdan', 'xilianshi', 'xinfacanye'].forEach(function (k) { MJ.G.addItem(k, 20); }); MJ.G.addItem('xf_jinzhong', 1); MJ.G.addItem('gem_atk_1', 5); MJ.G.commit(); MJ.UI.sel.hallUid = l.uid; MJ.UI.sel.hallTab = 'skill'; MJ.UI.render(); });
  var sk0 = await J(function () { return MJ.R.skillLv(MJ.G.lead(), 'a'); });
  await act('[data-a="skUp"][data-v="a"]');
  ok(await J(function () { return MJ.R.skillLv(MJ.G.lead(), 'a'); }) === sk0 + 1, '技能分頁按「升級」提升主動技能');
  ok((await page.locator('.pb-row').innerText()).indexOf('30 級開放') >= 0, '技能分頁顯示後天被動欄（30 級開放）');
  await J(function () { MJ.G.lead().lv = Math.max(MJ.G.lead().lv, 30); MJ.G.commit(); MJ.UI.render(); });
  await act('.pb-list [data-v="huajie"]');
  await act('[data-a="pbLearn"]');
  ok(await J(function () { return MJ.G.lead().pb; }) === 'huajie' && (await page.locator('.pb-row').innerText()).indexOf('化解') >= 0, '習得被動「化解」並顯示在被動欄');
  ok((await page.locator('.statpanel').innerText()).indexOf('抵抗') >= 0, '屬性面板顯示狀態抵抗／施加／PVP／PVE');
  await act('[data-a="hallTab"][data-v="peiyang"]');
  await act('[data-a="pyDo"][data-v="normal"]');
  ok(await page.locator('[data-a="pyOk"]').count() === 1 && await page.locator('[data-a="pyRetry"]').count() === 1 && await page.locator('[data-a="pyNo"]').count() === 1, '培養後出現 重試／保持／替換（榮譽 ' + await J(function () { return MJ.S.state.player.honor; }) + '）');
  await act('[data-a="pyRetry"]');
  ok(await J(function () { return !!MJ.G.lead().pyPending && MJ.S.state.player.honor === 900; }), '重試再扣 50 榮譽（20 榮譽令＝1000 → 900）');
  await shot('6b-hall-peiyang');
  await act('[data-a="pyOk"]');
  ok(await J(function () { return !MJ.G.lead().pyPending; }), '替換為培養結果');
  // P5：主角升階
  ok(await page.locator('.lp-box').count() === 1, '主角培養分頁顯示「主角升階」');
  await act('[data-a="leadPromote"]');
  ok(await J(function () { return MJ.S.state.player.leadQ; }) === 3 && (await page.locator('.lp-q').innerText()).indexOf('藍') >= 0, '主角 20 級以上按「升為藍」→ 藍');
  await shot('6c-lead-promote');
  await act('[data-a="hallTab"][data-v="xinfa"]');
  await act('[data-a="xfLearn"][data-v="jinzhong"]');
  ok(await J(function () { return MJ.G.lead().xf.length === 1; }), '心法分頁修練金鐘罩');
  await act('[data-a="hallTab"][data-v="star"]');
  ok((await page.locator('#screen').innerText()).indexOf('將魂') >= 0, '升階分頁顯示將魂說明');
  // 神兵坊
  await act('[data-a="city"]');
  await act('[data-a="forge"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'forge', '進入神兵坊');
  var fu = await J(function () { return MJ.UI.sel.forgeUid; });
  var pl0 = await J(function (u) { return MJ.G.findEquip(u).e.plus || 0; }, fu);
  await act('[data-a="doEnhance"]');
  ok(await J(function (u) { return MJ.G.findEquip(u).e.plus || 0; }, fu) === pl0 + 1, '強化 +' + (pl0 + 1) + '（+5 以下必定成功）');
  await act('[data-a="forgeTab"][data-v="gem"]');
  if (await page.locator('[data-a="gemIn"]').count()) { await act('[data-a="gemIn"]'); ok(await J(function (u) { return MJ.G.findEquip(u).e.gems.length; }, fu) === 1, '鑲嵌寶石'); }
  // art4：神兵坊提示訊息移到下方金框，不蓋住左右面板
  var tov = await J(function () {
    var t = document.querySelector('#toast .toast'); if (!t || document.getElementById('toast').style.display === 'none') return { shown: false, bad: 0 };
    var a = t.getBoundingClientRect(), bad = 0;
    [].forEach.call(document.querySelectorAll('.forge .fg-list, .forge .fg-main'), function (p) { var b = p.getBoundingClientRect(); if (a.left < b.right && a.right > b.left && a.top < b.bottom - 1 && a.bottom > b.top) bad++; });
    return { shown: true, bad: bad, txt: t.textContent };
  });
  ok(tov.shown && tov.bad === 0, '神兵坊提示「' + (tov.txt || '') + '」不蓋住面板（重疊 ' + tov.bad + '）');
  await shot('6c-forge');
  await act('[data-a="forgeTab"][data-v="combine"]');
  await act('[data-a="gemComb"]');
  ok(await J(function () { return (MJ.S.state.bag.stack.gem_atk_2 || 0) === 1; }), '寶石合成 1 級→2 級');
  // 將星錄 + 圖鑑
  await act('[data-a="city"]');
  await J(function () { var l = MJ.G.lead(); MJ.S.state.player.xinghun = 50; MJ.G.commit(); MJ.UI.render(); });
  await act('[data-a="jxl"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'jxl', '進入將星錄');
  ok((await page.locator('.jx-irrev').innerText()).indexOf('無法復原') >= 0, '將星錄顯示不可逆提示');
  await act('[data-a="jxLight"]');
  ok(await J(function () { return MJ.S.state.jiangxing.lit; }) === 0 && (await page.locator('.confirm-box').innerText()).indexOf('無法復原') >= 0, '點亮前先確認（不可逆）');
  await act('[data-a="confirmYes"]');
  ok(await J(function () { return MJ.S.state.jiangxing.lit; }) === 1, '點亮第一顆將星');
  var jxTxt = await J(function () { var m = document.body.innerText.match(/獻祭將魂換星魂（([^）]*)）/); return m ? m[1] : ''; });
  ok(/^黑1 白2 綠4 藍8 紫16/.test(jxTxt), '星魂換算文字品質正確（' + jxTxt + '）');
  await shot('6d-jiangxing');
  await act('[data-a="open"][data-v="codex"]');
  ok(await page.locator('.cdx').count() > 10, '圖鑑顯示武將格');
  var cdxTabs = await J(function () { return [].map.call(document.querySelectorAll('[data-a="codexQ"]'), function (a) { return a.textContent; }).join(''); });
  ok(cdxTabs === '全部紫藍綠白黑', '圖鑑品質分頁與設定一致（' + cdxTabs + '，沒有橙）');
  await shot('6e-codex');
  await closeModals();

  // 戰鬥勝利
  await act('[data-a="city"]');
  await act('[data-a="gate"]');
  await act('[data-a="gateCh"][data-v="1"]');
  ok(await page.locator('[data-a="info"].snode, .snode.locked').count() > 0, '尚未解鎖的關卡顯示為鎖定');
  await shot('7-gate');
  ok(await J(function () { return MJ.Audio.wanted(); }) === 'gate', '關卡選擇切換為緊張的關卡配樂');
  var silverB = await J(function () { return MJ.S.state.player.silver; });
  await act('[data-a="stagePop"][data-v="s1_1"]');
  await act('[data-a="startBattle"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'battle', '進入戰鬥畫面');
  // art3：飄字取樣——出現後 0／250／600／950ms 檢查是否超出舞台或蓋到上方總生命條
  await J(function () {
    window.__ft = { n: 0, out: 0, hp: 0, bad: [] };
    var fx = document.getElementById('fx'), st = document.getElementById('stage');
    function chk(n) {
      if (!n.parentNode) return; var r = n.getBoundingClientRect(), s = st.getBoundingClientRect(), op = +getComputedStyle(n).opacity; if (op < 0.15 || !r.width) return;
      if (r.left < s.left - 1 || r.right > s.right + 1 || r.top < s.top - 1 || r.bottom > s.bottom + 1) { window.__ft.out++; window.__ft.bad.push('out:' + n.textContent); }
      [].forEach.call(document.querySelectorAll('.b-tot'), function (b) { var q = b.getBoundingClientRect(); if (r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top) { window.__ft.hp++; window.__ft.bad.push('hp:' + n.textContent); } });
    }
    if (fx && window.MutationObserver) new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (!/ftxt/.test(n.className || '')) return; window.__ft.n++; [0, 250, 600, 950].forEach(function (t) { setTimeout(function () { chk(n); }, t); }); }); }); }).observe(fx, { childList: true });
  });
  await J(function () { window.__fx = {}; var fx = document.getElementById('fx'); if (fx && window.MutationObserver) new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { var c = n.className || ''; if (/skfx/.test(c)) window.__fx.skfx = (window.__fx.skfx || 0) + 1; }); }); }).observe(fx, { childList: true }); });
  await page.waitForTimeout(2600);
  // art2：武將放大後仍完整在舞台內（直向／橫向都檢查），並出現依傷害類型的光效
  var fit = await J(function () {
    var st = document.getElementById('stage').getBoundingClientRect(), out = 0, w = 0;
    [].forEach.call(document.querySelectorAll('.bu'), function (u) { var r = u.getBoundingClientRect(); if (r.left < st.left - 1 || r.right > st.right + 1 || r.top < st.top - 1 || r.bottom > st.bottom + 1) out++; });
    var f = document.querySelector('.bu:not(.boss) .bfig'); if (f) w = f.offsetWidth;
    return { out: out, w: w };
  });
  ok(fit.out === 0 && fit.w >= 100, '放大後的戰鬥武將全部在舞台內（人物寬 ' + fit.w + 'px，超出 ' + fit.out + '）');
  ok(await page.locator('.b-tot.A .tb i').count() === 1 && await page.locator('.b-tot.B .tb i').count() === 1, '上方顯示雙方總生命條');
  await shot('8-battle');
  ok(await J(function () { return document.querySelectorAll('.bu .bcirc').length === document.querySelectorAll('.bu').length && document.querySelectorAll('.bu').length >= 2; }), '每個戰鬥單位腳下都有法陣');
  await page.waitForTimeout(1500);
  await shot('8b-battle-later');
  ok(await J(function () { return (window.__fx && window.__fx.skfx) || 0; }) > 0, '受擊時出現依傷害類型的技能光效');
  // 壓力測試：每個單位同時飄出最高的技能名、無雙+、暴擊、大數字
  await J(function () { var BT = MJ.UI._bt ? MJ.UI._bt() : null; [].forEach.call(document.querySelectorAll('.bu:not(.dead)'), function (u) { var k = u.id.slice(1); MJ.UI._floatText(k, '神鬼亂舞斬', 'skillname', 60); MJ.UI._floatText(k, '無雙+35', 'green small', 44); MJ.UI._floatText(k, '暴擊', 'critlab', 38); MJ.UI._floatText(k, '-123456', 'crit'); MJ.UI._floatText(k, '<i class="leaf"></i>+98765', 'heal'); }); });
  await page.waitForTimeout(300);
  var ftop = await J(function () { var top = 0, fade = 0; [].forEach.call(document.querySelectorAll('.bu:not(.dead)'), function (u) { if (parseFloat(u.style.top) + 130 <= 210) { top++; var n = u.querySelector('.bnm'); if (/ ftop/.test(u.className) && n && +getComputedStyle(n).opacity < 0.5) fade++; } }); return { top: top, fade: fade }; });
  ok(ftop.top === 0 || ftop.fade === ftop.top, '最上排飄字期間淡化名牌以減少重疊（最上排 ' + ftop.top + ' 人，淡化 ' + ftop.fade + '）');
  await page.waitForTimeout(800);
  var ft = await J(function () { return window.__ft; });
  ok(ft && ft.n >= 3 && ft.out === 0 && ft.hp === 0, '飄字全部在舞台內且不蓋住上方總生命條（取樣 ' + (ft ? ft.n : 0) + ' 則，超出 ' + (ft ? ft.out : '?') + '，蓋血條 ' + (ft ? ft.hp : '?') + (ft && ft.bad.length ? '：' + ft.bad.slice(0, 4).join('、') : '') + '）');
  // 第四階段：名字在血條上方，不與其他單位的血條重疊
  var ov = await J(function () {
    var nm = [].slice.call(document.querySelectorAll('.bu:not(.dead) .bnm')), hp = [].slice.call(document.querySelectorAll('.bu:not(.dead) .bhp')), bad = 0;
    nm.forEach(function (n) { var a = n.getBoundingClientRect(); hp.forEach(function (h) { if (h.parentNode === n.parentNode) return; var b = h.getBoundingClientRect(); if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) bad++; }); });
    return { n: nm.length, bad: bad };
  });
  ok(ov.n >= 2 && ov.bad === 0, '戰鬥中名字與其他單位血條沒有重疊（' + ov.n + ' 個名字）');
  // art4：下方我方頭像列（生命／無雙條）在舞台內，不蓋到按鈕與武將
  var pbar = await J(function () {
    var st = document.getElementById('stage').getBoundingClientRect(), bar = document.getElementById('bpbar'); if (!bar) return null;
    var r = bar.getBoundingClientRect(), hit = 0, rg = 0, hp = 0;
    function ov(b) { return r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top; }
    [].forEach.call(document.querySelectorAll('.b-bl > *, .b-br > *, .bu:not(.dead) .bfig'), function (e) { if (ov(e.getBoundingClientRect())) hit++; });
    [].forEach.call(bar.querySelectorAll('.pb-bar.rg i'), function (i) { if (parseFloat(i.style.width) > 0) rg++; });
    [].forEach.call(bar.querySelectorAll('.pb-bar.hp i'), function (i) { if (i.style.width) hp++; });
    return { n: bar.querySelectorAll('.pb').length, team: document.querySelectorAll('.bu.sideA').length, inside: r.left >= st.left - 1 && r.right <= st.right + 1 && r.top >= st.top - 1 && r.bottom <= st.bottom + 1, hit: hit, rg: rg, hp: hp, w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok(pbar && pbar.n === pbar.team && pbar.n >= 1 && pbar.hp === pbar.n && pbar.inside && pbar.hit === 0 && pbar.rg >= 1, '下方我方頭像列：' + (pbar ? pbar.n + '/' + pbar.team + ' 人、在舞台內 ' + pbar.inside + '、重疊 ' + pbar.hit + '、無雙條有值 ' + pbar.rg + '（' + pbar.w + 'x' + pbar.h + '）' : '不存在'));
  ok(await page.locator('.b-br .mute-btn').count() === 1, '戰鬥畫面有靜音按鈕');
  var au = await J(function () { return { sup: MJ.Audio.supported, want: MJ.Audio.wanted(), cur: MJ.Audio.current(), st: MJ.Audio.state(), played: MJ.Audio.played.slice() }; });
  ok(au.want === 'battle' || au.want === 'boss', '進入戰鬥切換為戰鬥配樂（' + au.want + '，AudioContext：' + au.st + (au.cur ? '，播放中 ' + au.cur : '') + '）');
  ok(au.played.indexOf('hit') >= 0 || au.played.indexOf('crit') >= 0 || au.played.indexOf('ult') >= 0, '戰鬥中觸發命中音效（' + au.played.slice(-4).join(',') + '）');
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  ok(await page.locator('.result.win').count() === 1, '1-1 戰鬥勝利並顯示結算');
  await shot('9-battle-win');
  ok(await J(function () { return MJ.Audio.wanted(); }) === 'victory', '勝利後切換為勝利配樂');
  var dead = await J(function () { return document.querySelectorAll('.bu.dead').length; });
  ok(dead >= 1, '陣亡單位以陣亡狀態顯示（' + dead + '）');
  ok(await J(function (b) { return MJ.S.state.player.silver > b && MJ.S.state.stages.s1_1.clears === 1; }, silverB), '勝利獲得銀幣並記錄通關');
  ok(await J(function () { return MJ.G.stageUnlocked('s1_2') && !MJ.G.stageUnlocked('s1_3'); }), '通關後解鎖 1-2（1-3 仍鎖定）');

  // 戰鬥失敗
  var before = await J(function () {
    var s = MJ.S.state; s.player.energy = 999;
    MJ.D.stages.stages.forEach(function (x) { if (x.chapter <= 4 || true) s.stages[x.id] = s.stages[x.id] || { stars: 1, clears: 1 }; });
    var hard = MJ.D.stages.stages.filter(function (x) { return MJ.G.stageUnlocked(x.id); }).pop();
    MJ.S.state.stages[hard.id] = { stars: 0, clears: 0 }; // 讓它看起來是未通關
    if (!MJ.G.stageUnlocked(hard.id)) return null;
    return { id: hard.id, silver: s.player.silver, bag: JSON.stringify(s.bag), exp: MJ.G.lead().exp, energy: s.player.energy };
  });
  await J(function (id) { MJ.UI.actions.startBattle(id); }, before.id);
  await page.waitForTimeout(800);
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  ok(await page.locator('.result.lose').count() === 1, '挑戰高難度關卡戰敗（' + before.id + '）');
  ok(await page.locator('.battle.lost').count() === 1, '戰敗畫面轉灰模糊');
  ok((await page.locator('.result').innerText()).indexOf('如何提升戰鬥力') >= 0, '戰敗顯示「如何提升戰鬥力」');
  ok(await J(function (b) { var s = MJ.S.state; return s.player.silver === b.silver && JSON.stringify(s.bag) === b.bag && MJ.G.lead().exp === b.exp && s.stages[b.id].clears === 0; }, before), '戰敗沒有任何獎勵');
  ok((await page.locator('.result').innerText()).indexOf('越戰越勇') >= 0 && await J(function (id) { return MJ.S.state.stages[id].fails === 1; }, before.id), '戰敗後提示「越戰越勇」並記錄連敗次數');
  await shot('10-battle-lose');
  ok(await J(function () { return MJ.Audio.wanted(); }) === 'defeat', '戰敗後切換為二胡式戰敗配樂');
  await J(function () { MJ.S.state.stages = { s1_1: { stars: 3, clears: 1 } }; MJ.G.commit(); MJ.UI.go('city'); });

  // ---------- 第三階段：通天塔／無極幻境／農田／任務 ----------
  await J(function () { MJ.G.teamList().forEach(function (x) { x.hero.lv = 45; }); MJ.G.lead().lv = 45; MJ.G.commit(); MJ.UI.go('city'); });
  await act('.bld[data-a="tower"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'tower', '點通天塔進入通天塔畫面');
  await shot('12-tower');
  await act('[data-a="twFight"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'battle', '通天塔進入戰鬥（不耗精力）');
  await page.waitForTimeout(600);
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  ok(await page.locator('.result.win').count() === 1 && await J(function () { return MJ.S.state.tower.best; }) === 1, '登上通天塔第 1 層並記錄');
  ok((await page.locator('.result').innerText()).indexOf('第 1 層') >= 0, '塔層結算顯示樓層與首登獎勵');
  await shot('12b-tower-win');
  await act('[data-a="bTower"]:not([data-v])');
  await act('[data-a="twSweep"]');
  await act('[data-a="confirmYes"]');
  ok(await J(function () { return MJ.S.state.tickets.tower != null && !MJ.G.ticket('tower').ready; }), '領取塔俸（之後以勝場計，不看日期）');
  await act('[data-a="city"]');
  await act('.bld[data-a="wuji"]');
  ok(await page.locator('.wj-card').count() === 3, '無極幻境顯示三欄挑戰面板');
  ok((await page.locator('.wj-tip').innerText()).indexOf('每 5 波得 1 個將魂') >= 0, '無極幻境說明無盡波次與每 5 波將魂');
  await shot('13-wuji');
  await act('[data-a="wjGo"][data-v="w1"]');
  await page.waitForTimeout(500);
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  if (await page.locator('[data-a="wjNext"]').count()) {
    await act('[data-a="wjNext"]');
    ok(await J(function () { return MJ.UI.battleState().r.idx; }) === 1, '「下一波」播放第 2 波');
    await page.waitForTimeout(400);
    await act('[data-a="bSkip"]');
    await page.waitForSelector('.result', { timeout: 15000 });
    if (await page.locator('[data-a="wjSum"]').count()) await act('[data-a="wjSum"]');
  }
  ok((await page.locator('.result').innerText()).indexOf('波') >= 0 && await J(function () { return MJ.G.wujiLeft('w1') === Infinity; }), '幻境結算顯示通過波數，次數不限');
  await shot('13b-wuji-result');
  await act('[data-a="bWuji"]');
  await act('[data-a="city"]');
  // P5：上古寶窟（單人版，K4 兩種分階都保留）
  await J(function () { var l = MJ.G.lead(); l.lv = Math.max(l.lv, 25); MJ.G.commit(); MJ.UI.render(); });
  await act('.sg-entry');
  ok(await J(function () { return MJ.UI.screen; }) === 'shanggu' && await page.locator('.sg-card').count() === 6 && await page.locator('.sg-card.v2013').count() === 2, '上古寶窟顯示 6 階（70／80 階標 2013 版）');
  await shot('13c-shanggu');
  await act('[data-a="sgGo"][data-v="s25"]');
  await page.waitForTimeout(500);
  ok(await J(function () { var b = MJ.UI.battleState(); return b && b.r.mode === 'shanggu' && b.r.idx === 0; }), '挑戰第 1 關進入戰鬥');
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  if (await page.locator('[data-a="sgSum"]').count()) await act('[data-a="sgSum"]');
  ok(/全 破|結 算|隱 藏 關 破/.test(await page.locator('.result .banner').last().innerText()), '寶窟結算畫面（' + (await page.locator('.result .banner').last().innerText()) + '）');
  await shot('13d-shanggu-result');
  await act('[data-a="bShanggu"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'shanggu', '返回寶窟');
  await act('[data-a="city"]');
  // 第四階段：拜訪武將（AI 排名賽＋重播）
  ok(await page.locator('.bld[data-a="arena"]').count() === 1 && (await page.locator('.bld[data-a="arena"]').innerText()).indexOf('階段開放') < 0, '拜訪武將建築已開放（不再顯示階段開放）');
  await act('.bld[data-a="arena"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'arena' && await page.locator('.ar-card').count() === 5, '拜訪武將顯示 5 位可挑戰的名將');
  await shot('16-arena');
  await act('[data-a="arFight"][data-v="30"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'battle', '挑戰名將進入戰鬥');
  await page.waitForTimeout(400);
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  ok(await page.locator('.result.win').count() === 1 && await J(function () { return MJ.S.state.arena.rank; }) === 30, '擊敗第 30 名後排名上升為 30');
  await act('[data-a="bArena"]');
  ok(await page.locator('.ar-rec').count() === 1 && await J(function () { return MJ.G.arenaState().tries === MJ.G.ARENA_TRIES; }), '戰報列表新增一筆，不扣次數');
  await act('[data-a="arReplay"][data-v="0"]');
  await page.waitForTimeout(400);
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 15000 });
  ok((await page.locator('.result').innerText()).indexOf('結果與當時一致') >= 0 && await J(function () { return MJ.S.state.arena.recs.length === 1; }), '重播結果與當時一致，且不新增戰報');
  await shot('16b-arena-replay');
  await act('[data-a="bArena"]');
  await act('[data-a="arDaily"]');
  if (await page.locator('[data-a="confirmYes"]').count()) await act('[data-a="confirmYes"]');
  ok(await J(function () { return MJ.S.state.tickets.arena != null; }), '領取排名獎勵（以勝場計）');
  await act('[data-a="city"]');
  await J(function () { MJ.G.addItem('seed_yin', 3); MJ.G.commit(); });
  await act('.bld[data-a="farm"]');
  ok(await page.locator('.fm-plot').count() === 9, '農田顯示 3x3 田地');
  await act('[data-a="fmPick"][data-v="0"]');
  await act('[data-a="fmPlant"]');
  ok(await J(function () { return !!MJ.S.state.farm.plots[0]; }), '選種子後種下作物');
  await shot('14-farm');
  ok(await page.locator('[data-a="fmHarvest"]').count() === 1, '種下立即成熟，可收成（不等現實時間）');
  var sv0 = await J(function () { return MJ.S.state.player.silver; });
  await act('[data-a="fmHarvest"]');
  ok(await J(function (b) { return !MJ.S.state.farm.plots[0] && MJ.S.state.player.silver > b; }, sv0), '收成獲得銀幣並清空田地');
  await act('[data-a="confirmYes"]');
  await J(function () { MJ.UI.go('city'); });
  await act('.gift[data-a="open"][data-v="tasks"]');
  ok(await page.locator('.task-p .tab').count() === 4, '任務分成 歷練／主線／成就／簽到 四個分頁');
  await shot('15-tasks-daily');
  await act('[data-a="taskTab"][data-v="sign"]');
  await act('[data-a="signDo"]');
  ok(await J(function () { return MJ.S.state.sign.days.length; }) === 1, '簽到成功');
  await act('[data-a="confirmYes"]');
  await shot('15b-sign');
  await act('[data-a="taskTab"][data-v="ach"]');
  ok(await page.locator('.ach-st').count() > 0, '成就分頁顯示星級');
  await closeModals();
  await J(function () { MJ.UI.open('settings'); });
  await act('[data-a="setEcon"][data-v="fast"]');
  ok(await J(function () { return MJ.S.state.settings.econ === 'fast' && MJ.G.econ().farm === 1; }), '設定切換「單機加速」經濟模式');
  await act('[data-a="setEcon"][data-v="std"]');
  await act('[data-a="setFx"][data-v="low"]');
  ok(await J(function () { return / lowfx|^lowfx/.test(document.body.className) && MJ.S.state.settings.fx === 'low'; }), '設置切換「省電特效」');
  await act('[data-a="setFx"][data-v="full"]');
  ok(await J(function () { return !/lowfx/.test(document.body.className); }), '切回完整特效');
  await closeModals();
  await J(function () { MJ.UI.go('city'); });
  // 第四階段：主城靜音按鈕
  ok(await J(function () { return MJ.Audio.wanted(); }) === 'city', '回主城切換為主城配樂');
  ok(await J(function () { return !MJ.Audio.muted(); }), '預設有聲音');
  await act('.hud-top .mute-btn');
  ok(await J(function () { var st = MJ.S.state.settings; return st.bgm === false && st.sfx === false && MJ.Audio.current() === null; }), '按喇叭一鍵靜音並停止音樂');
  ok(await page.locator('.hud-top .mute-btn.off').count() === 1, '喇叭圖示變為靜音狀態');
  await act('.hud-top .mute-btn');
  ok(await J(function () { return !MJ.Audio.muted(); }), '再按一次恢復聲音');

  // 加碼玩法：奇遇
  await J(function () { if (MJ.G.lead().lv < MJ.G.QIYU_OPEN) MJ.G.lead().lv = MJ.G.QIYU_OPEN; MJ.UI.go('city'); });
  ok(await page.locator('.gifts [data-v="qiyu"]').count() === 1, '主城左上出現「奇遇」入口');
  await act('.gifts [data-v="qiyu"]');
  ok(await page.locator('.qiyu-p .tab').count() === 3 && await page.locator('.hrd-pc').count() === 10, '奇遇視窗：三個分頁，華容道 10 塊棋子');
  // 選曹操以外的一塊可動棋子，點方向鍵移動一格
  var mv = await J(function () { var G = MJ.G, b = G.hrd().cur; for (var i = 0; i < b.length; i++) { var d = [[1, 0], [-1, 0], [0, 1], [0, -1]]; for (var k = 0; k < 4; k++) if (G.hrdCanMove(i, d[k][0], d[k][1])) return [i, d[k][0] + ':' + d[k][1]]; } return null; });
  await act('.hrd-pc[data-v="' + mv[0] + '"]');
  ok(await page.locator('.hrd-pc.sel').count() === 1, '點選棋子會反白');
  await act('[data-a="hrdDir"][data-v="' + mv[1] + '"]');
  ok(await J(function () { return MJ.G.hrd().moves; }) === 1 && (await page.locator('.hrd-moves').innerText()) === '1', '按方向鍵移動一格，步數 +1');
  await shot('20-qiyu-huarongdao');
  await act('[data-a="hrdUndo"]');
  ok(await J(function () { return MJ.G.hrd().hist.length; }) === 0, '悔一步');
  await act('[data-a="qyTab"][data-v="star"]');
  ok(await page.locator('.star-pt').count() === 7, '觀星台顯示北斗七星');
  await act('.star-pt[data-v="4"]');
  ok(await J(function () { return MJ.S.state.qiyu.star.draws === 1 && MJ.G.starExpBonus() > 0; }) && await page.locator('#confirm .rw').count() > 1, '免費觀星一次，得到今日星運與獎勵');
  await act('[data-a="confirmYes"]');
  await shot('21-qiyu-star');
  await act('[data-a="qyTab"][data-v="wheel"]');
  ok(await page.locator('#wheel svg path').count() === 12, '玄機盤 12 格');
  var sp0 = await J(function () { return MJ.S.state.qiyu.wheel.spins; });
  await act('[data-a="wheelSpin"]');
  await page.waitForSelector('#confirm .rw', { timeout: 4000 });
  ok(await J(function () { return MJ.S.state.qiyu.wheel.spins; }) === sp0 + 1, '免費轉動玄機盤並顯示獎勵');
  await act('[data-a="confirmYes"]');
  await shot('22-qiyu-wheel');
  await closeModals();

  // 緊急修正一：陣法與站位存檔後重新整理，戰鬥使用編好的站位
  await J(function () { MJ.UI.modal = null; MJ.UI.go('city'); });
  await page.waitForTimeout(200);
  await act('[data-a="open"][data-v="formation"]');
  var fBefore = await J(function () { return MJ.S.state.team.formation; });
  var fNew = fBefore === 'yulin' ? 'fangyuan' : 'yulin';
  await act('#modal [data-a="setForm"][data-v="' + fNew + '"]');
  ok(await J(function (f) { return MJ.S.state.team.formation === f; }, fNew) && /陣法已儲存/.test(await page.locator('#toast').innerText()), '換陣法並提示「陣法已儲存」');
  var lUid = await J(function () { return MJ.G.lead().uid; });
  var freeC = await J(function () { var oc = MJ.G.openCells(), cs = MJ.S.state.team.cells; for (var i = 0; i < oc.length; i++) if (!cs[oc[i]]) return oc[i]; return null; });
  await act('#modal [data-a="fPick"][data-v="' + lUid + '"]');
  await act('#modal [data-a="fCell"][data-v="' + freeC + '"]');
  ok(await J(function (u) { return +MJ.G.inTeam(u); }, lUid) === freeC, '主角移到第 ' + freeC + ' 格');
  ok(await page.locator('#modal .fcell .fc-rg .pgrid i.me').count() === await J(function () { return MJ.G.teamCount(); }), '陣法畫面每位上陣武將都顯示攻擊格（綠＝自己）');
  ok(!/最多 9 人/.test(await page.locator('#modal').innerText()), '陣法提示不再寫「最多 9 人」');
  await shot('23-formation-range');
  var teamSnap = await J(function () { return JSON.stringify(MJ.S.state.team); });
  await page.reload();
  await page.waitForFunction(function () { return window.MJ && MJ.booted; });
  await page.waitForSelector('#loading', { state: 'detached', timeout: 5000 });
  ok(await J(function () { return JSON.stringify(MJ.S.state.team); }) === teamSnap, '重新整理後陣法與站位不變 ' + teamSnap);
  await closeModals();
  await J(function () { MJ.UI.actions.startBattle('s1_1'); });
  await page.waitForTimeout(300);
  var posOk = await J(function () { var bad = []; MJ.G.teamList().forEach(function (x) { var e = document.getElementById('uA' + x.cell), p = MJ.UI.battlePos('A', x.cell); if (!e || parseInt(e.style.left, 10) !== p.x - 56) bad.push(x.cell); }); return bad; });
  ok(!posOk.length, '戰鬥中我方武將站在編好的格子（不符：' + (posOk.join(',') || '無') + '）');
  ok(await J(function () { return MJ.G.openCells().every(function (c) { return document.getElementById('tA' + c).className.indexOf('open') >= 0; }); }), '戰場上標出陣法開放的格子');
  // 緊急修正二：出手時壓暗戰場、紅格顯示範圍
  var seen = { aim: 0, rng: 0, warn: 0, me: 0 };
  for (var q = 0; q < 40 && !(seen.aim && seen.warn && seen.me); q++) {
    var o = await J(function () { var b = document.getElementById('bt'); return { aim: b && / aim/.test(b.className) ? 1 : 0, rng: document.querySelectorAll('.tile.rng').length, warn: document.querySelectorAll('.tile.warn').length, me: document.querySelectorAll('.tile.me').length }; });
    for (var kk in o) if (o[kk]) seen[kk]++;
    if (o.aim && o.warn && !seen.shot) { seen.shot = 1; await page.screenshot({ path: path.join(SHOT, shotPrefix + '24-battle-range.png') }); }
    await page.waitForTimeout(60);
  }
  ok(seen.aim && seen.warn && seen.me, '出手時壓暗戰場，紅格標出受擊格、綠格標出施放者（取樣 aim ' + seen.aim + '、warn ' + seen.warn + '、me ' + seen.me + '）');
  ok(await J(function () { return MJ.UI.battleState().r.battle.events.some(function (e) { return e.t === 'act' && e.rv === 9 && e.range; }); }), '戰報使用 v9 攻擊範圍');
  await J(function () { MJ.UI.actions.bSkip(); });
  await page.waitForTimeout(500);
  await J(function () { MJ.UI.actions.bCity(); });
  // 神武殿技能頁：攻擊格以自己為起點
  await J(function () { MJ.UI.sel.hallTab = 'skill'; MJ.UI.go('hall'); });
  await page.waitForTimeout(200);
  ok(await page.locator('.skill3 .pgrid.rgrid i.me').count() >= 1, '神武殿技能頁顯示攻擊格（綠＝自己、紅＝往前打到的格）');
  await shot('25-hall-range');
  await J(function () { MJ.UI.go('city'); });

  // 重新整理保留存檔
  var snap = await J(function () { return JSON.stringify({ n: MJ.S.state.player.name, h: MJ.S.state.heroes.length, s: MJ.S.state.player.silver, st: MJ.S.state.stages }); });
  await page.reload();
  await page.waitForFunction(function () { return window.MJ && MJ.booted; });
  var snap2 = await J(function () { return JSON.stringify({ n: MJ.S.state.player.name, h: MJ.S.state.heroes.length, s: MJ.S.state.player.silver, st: MJ.S.state.stages }); });
  ok(snap === snap2 && await J(function () { return MJ.UI.screen; }) === 'city', '重新整理後存檔完整保留，直接回到主城');

  // 匯出／匯入
  await page.waitForSelector('#loading', { state: 'detached', timeout: 5000 });
  await J(function () { MJ.UI.open('settings'); });
  await act('[data-a="exportSave"]');
  var txt = await page.locator('#exportText').inputValue();
  ok(txt.indexOf('"app"') >= 0 && txt.length > 500, '匯出存檔文字（' + txt.length + ' 字元）');
  await J(function () { MJ.S.reset(); });
  await page.reload();
  await page.waitForFunction(function () { return window.MJ && MJ.booted; });
  ok(await J(function () { return MJ.UI.screen; }) === 'newgame', '重置後回到建立角色畫面');
  await page.waitForSelector('#loading', { state: 'detached', timeout: 5000 });
  await act('[data-a="importOpen"]');
  await page.fill('#importText', '這不是存檔');
  await act('[data-a="importPaste"]');
  ok((await page.locator('#toast').innerText()).indexOf('匯入失敗') >= 0, '匯入錯誤內容時顯示失敗訊息');
  await page.fill('#importText', txt);
  await act('[data-a="importPaste"]');
  await act('[data-a="confirmYes"]');
  ok(await J(function () { return MJ.UI.screen === 'city' && MJ.S.state.player.name; }) === '測試俠', '匯入存檔還原角色');

  // 版面
  var lay = await J(function () { var r = document.getElementById('stage').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, sh: document.documentElement.scrollHeight, ih: window.innerHeight, rot: MJ.UI.rotated, w: Math.round(r.width), h: Math.round(r.height) }; });
  ok(lay.sw <= lay.iw && lay.sh <= lay.ih + 1, '沒有水平/垂直捲軸（視窗 ' + lay.iw + 'x' + lay.ih + '，' + (lay.rot ? '直向自動旋轉' : '橫向') + '，舞台 ' + lay.w + 'x' + lay.h + '）');
  ok(await J(function () { return getComputedStyle(document.getElementById('fatal')).display === 'none'; }), '沒有出現錯誤畫面');
  ok(errors.length === 0, '沒有 JS 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  ok(net.length === 0, '離線執行，沒有任何網路請求' + (net.length ? '：' + net.join(', ') : ''));

  // 全域錯誤處理：故意丟錯，確認顯示可讀錯誤與重新開始按鈕
  await J(function () { setTimeout(function () { throw new Error('測試用錯誤'); }, 0); });
  await page.waitForTimeout(300);
  var fatal = await J(function () { var f = document.getElementById('fatal'); return getComputedStyle(f).display !== 'none' ? f.innerText : ''; });
  // WebKit 對測試注入的程式碼只回報「Script error.」，因此只要求錯誤畫面出現且有重新開始按鈕
  ok((fatal.indexOf('測試用錯誤') >= 0 || fatal.indexOf('Script error') >= 0) && fatal.indexOf('重新開始') >= 0, '未預期錯誤會顯示可讀訊息與重新開始按鈕（不白畫面）');
  await shot('11-fatal');

  await browser.close();
  total.pass += pass; total.fail += fail; total.lines.push(label + '：通過 ' + pass + '，失敗 ' + fail);
}

(async function () {
  try {
    if (which === 'all' || which === 'chromium') await run('Chromium 桌機 1280x800', pw.chromium, { viewport: { width: 1280, height: 800 } }, 'desktop-');
    if (which === 'all' || which === 'webkit-iphone') await run('WebKit iPhone 13', pw.webkit, Object.assign({}, pw.devices['iPhone 13']), 'iphone-');
    if (which === 'all' || which === 'chromium-phone') await run('Chromium 手機橫向 844x390', pw.chromium, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, 'landscape-');
  } catch (e) { total.fail++; console.log('✗ 測試中斷：', e.message); }
  console.log('\n' + total.lines.join('\n') + '\n合計：通過 ' + total.pass + '，失敗 ' + total.fail);
  process.exit(total.fail ? 1 : 0);
})();
