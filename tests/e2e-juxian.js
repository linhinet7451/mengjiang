// 聚賢莊升級端對端測試（Tomas 2026-11-04：聚賢莊 Lv1 武將數 5/5 找不到升級）
// 介面點擊：主城 → 聚賢莊 → 我的武將 → 看到「Lv1 上限 5 → Lv2 上限 6」→ 主角 Lv1 時按鈕停用並寫原因 → 主角升級後按「升級」→ 重新整理仍保留
// node tests/e2e-juxian.js [chromium|webkit|all]
var pw = require('playwright'), path = require('path');
var FILE = 'file://' + path.join(__dirname, '..', 'dist', 'mengjiang.html');
var SHOT = path.join(__dirname, '..', 'screenshots');
var which = process.argv[2] || 'all', total = { pass: 0, fail: 0 };
async function run(label, bt, ctxOpts, prefix) {
  var pass = 0, fail = 0;
  function ok(c, n) { if (c) { pass++; console.log('  通過 [' + label + '] ' + n); } else { fail++; console.log('✗ 失敗 [' + label + '] ' + n); } }
  var browser = await bt.launch(), ctx = await browser.newContext(Object.assign({ offline: true }, ctxOpts)), errors = [];
  await ctx.route('**/*', function (r) { return /^(file|data|blob|about):/.test(r.request().url()) ? r.continue() : r.abort(); });
  var page = await ctx.newPage();
  page.on('pageerror', function (e) { errors.push(e.message); }); page.on('dialog', function (d) { d.accept(); });
  var J = function (f, a) { return page.evaluate(f, a); };
  async function act(sel) { await page.locator(sel).first().click(); await page.waitForTimeout(200); }
  async function closeModals() { for (var k = 0; k < 6; k++) { var c = page.locator('#modal [data-a="close"]:visible'); if (!(await c.count())) return; await c.last().click(); await page.waitForTimeout(150); } }
  async function boot() { await page.waitForFunction(function () { return window.MJ && MJ.booted; }, null, { timeout: 10000 }); await page.waitForSelector('#loading', { state: 'detached', timeout: 8000 }); await page.waitForTimeout(300); }
  await page.goto(FILE); await boot();
  await page.fill('#ngName', '聚賢俠'); await act('[data-a="ngStart"]'); await page.waitForTimeout(400); await closeModals();
  await act('.bld[data-a="recruit"]');
  ok(await J(function () { return MJ.UI.screen; }) === 'recruit', '從主城點聚賢莊進入');
  ok(await page.locator('.jx-link').count() === 1, '拜訪武將分頁有「升級聚賢莊」連結');
  await act('.jx-link');
  var t = await page.locator('.jx-up').innerText();
  ok(/Lv1/.test(t) && /上限\s*5/.test(t) && /Lv2/.test(t) && /上限\s*6/.test(t), '我的武將分頁顯示 目前 Lv1 上限 5 → 下一級 Lv2 上限 6（' + t.replace(/\s+/g, ' ') + '）');
  ok(/500/.test(t) && /主角 Lv2/.test(t), '顯示費用 500 銀與需要主角 Lv2');
  var dis = await page.locator('.jx-up [data-a="upBld"]').getAttribute('class');
  ok(/disabled/.test(dis), '主角 Lv1 時升級按鈕停用，並寫出原因');
  var ib = await J(function () { var r = document.querySelector('.jx-up .art.icon').getBoundingClientRect(), u = document.querySelector('.jx-up').getBoundingClientRect(), b = document.querySelector('.jx-up .btn').getBoundingClientRect(), n = document.querySelector('.recruit-scr .inner').getBoundingClientRect(); return { ic: Math.max(r.width, r.height), bt: Math.max(b.width, b.height), area: (u.width * u.height) / (n.width * n.height) }; });
  ok(ib.ic < ib.bt && ib.area < 0.4, '銀幣圖示是小圖（' + Math.round(ib.ic) + 'px，按鈕 ' + Math.round(ib.bt) + 'px），升級列只佔面板 ' + Math.round(ib.area * 100) + '%');
  await page.screenshot({ path: path.join(SHOT, prefix + 'juxian-locked.png') });
  // 模擬打完幾關：主角升到 3 級（存檔後重新整理，走正常讀檔流程）
  await J(function () { MJ.G.lead().lv = 3; MJ.S.state.player.silver = 50000; MJ.S.save(); });
  await page.reload(); await boot(); await closeModals();
  await act('.bld[data-a="recruit"]'); await act('[data-a="recTab"][data-v="roster"]');
  var silver0 = await J(function () { return MJ.S.state.player.silver; });
  await act('.jx-up [data-a="upBld"]:not(.disabled)');
  var st = await J(function () { return { lv: MJ.S.state.buildings.juxian, cap: MJ.R.rosterCap(MJ.S.state), silver: MJ.S.state.player.silver, plaque: document.querySelector('.plaque').innerText, info: document.querySelector('.roster-info').innerText }; });
  ok(st.lv === 2 && st.cap === 6 && silver0 - st.silver === 500, '按「升級」：聚賢莊 Lv2、上限 6、扣 500 銀');
  ok(/Lv2/.test(st.plaque) && /\/6/.test(st.info), '畫面立刻更新：招牌 Lv2、武將數 x/6（' + st.info.split('　')[0] + '）');
  await page.screenshot({ path: path.join(SHOT, prefix + 'juxian-upgraded.png') });
  await page.reload(); await boot(); await closeModals();
  ok(await J(function () { return MJ.S.state.buildings.juxian === 2 && MJ.R.rosterCap(MJ.S.state) === 6; }), '重新整理後仍是 Lv2／上限 6');
  ok(!errors.length, '沒有 JS 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  total.pass += pass; total.fail += fail;
}
(async function () {
  if (which === 'all' || which === 'chromium') await run('Chromium 1280', pw.chromium, { viewport: { width: 1280, height: 800 } }, 'jx-desktop-');
  if (which === 'all' || which === 'webkit') {
    await run('WebKit iPhone 直', pw.webkit, pw.devices['iPhone 13'], 'jx-iphone-p-');
    await run('WebKit iPhone 橫', pw.webkit, pw.devices['iPhone 13 landscape'], 'jx-iphone-l-');
  }
  console.log('結果：通過 ' + total.pass + '，失敗 ' + total.fail);
  process.exit(total.fail ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
