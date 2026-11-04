// 關鍵畫面截圖（前後對照用）：node tools/shots.js <html> <輸出資料夾> [prefix]
var pw = require('playwright'), path = require('path'), fs = require('fs');
var FILE = 'file://' + path.resolve(process.argv[2] || 'dist/mengjiang.html');
var OUT = path.resolve(process.argv[3] || 'screenshots/compare'), PRE = process.argv[4] || '';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
(async function () {
  var b = await pw.webkit.launch();
  var ctx = await b.newContext(Object.assign({ offline: true }, pw.devices['iPhone 13 landscape']));
  await ctx.route('**/*', function (r) { return /^(file|data|blob|about):/.test(r.request().url()) ? r.continue() : r.abort(); });
  var p = await ctx.newPage(), errs = [];
  p.on('pageerror', function (e) { errs.push(e.message); });
  await p.goto(FILE);
  await p.waitForFunction(function () { return window.MJ && MJ.booted; }, null, { timeout: 15000 });
  await p.waitForTimeout(800);
  await p.fill('#ngName', '測試俠'); await p.locator('[data-a="ngStart"]').first().click(); await p.waitForTimeout(500);
  await p.evaluate(function () {
    var s = MJ.S.state, l = MJ.G.lead(); l.lv = 40; s.player.gold = 5000; s.player.silver = 99999;
    MJ.U.each(['zhangjiao', 'huaxiong', 'diaochan', 'lvbu', 'duanyu'], function (id) { if (MJ.D.heroIndex[id]) s.bag.stack['soul:' + id] = 12; });
    if (MJ.G.commit) MJ.G.commit(); MJ.UI.modal = null; MJ.UI.render();
  });
  var screens = [['city', null], ['recruit', null], ['hall', null], ['gate', null], ['tower', null], ['wuji', null], ['jxl', null], ['farm', null], ['shanggu', null]];
  for (var i = 0; i < screens.length; i++) {
    var ok = await p.evaluate(function (n) { if (!MJ.UI.screens[n]) return false; MJ.UI.modal = null; MJ.UI.go(n); return true; }, screens[i][0]);
    if (!ok) continue;
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, PRE + (i + 1) + '-' + screens[i][0] + '.png') });
  }
  await p.evaluate(function () { MJ.UI.go('jxl'); MJ.UI.open('codex'); });
  await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, PRE + '10-codex.png') });
  console.log('shots done', OUT, 'errors:', errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
})().catch(function (e) { console.error(e); process.exit(1); });
