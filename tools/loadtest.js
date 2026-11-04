// 節流載入測試：node tools/loadtest.js [Mbps...]
// 以本機 HTTP 伺服器限速送出 dist/mengjiang.html，用 WebKit iPhone 13 模擬開啟，量測進度條與啟動時間
var http = require('http'), fs = require('fs'), path = require('path'), pw = require('playwright');
var buf = fs.readFileSync(path.join(__dirname, '..', 'dist', 'mengjiang.html'));
var rates = process.argv.slice(2).map(Number); if (!rates.length) rates = [40, 12, 5];
var MBPS = 12, RTT = 150;
var srv = http.createServer(function (req, res) {
  setTimeout(function () {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': buf.length });
    var i = 0, per = Math.round(MBPS * 1e6 / 8 / 20);
    (function send() { if (i >= buf.length) return res.end(); res.write(buf.slice(i, i + per)); i += per; setTimeout(send, 50); })();
  }, RTT);
}).listen(0, async function () {
  var port = srv.address().port, browser = await pw.webkit.launch();
  for (var r = 0; r < rates.length; r++) {
    MBPS = rates[r];
    var ctx = await browser.newContext(Object.assign({}, pw.devices['iPhone 13']));
    var page = await ctx.newPage(), t0 = Date.now(), errs = [];
    page.on('pageerror', function (e) { errs.push(e.message); });
    await page.addInitScript(function () { window.__ld = []; var t0 = Date.now(); var iv = setInterval(function () { var b = document.getElementById('ldBar'); if (b) window.__ld.push([Date.now() - t0, b.style.width]); if (window.MJ && MJ.booted) clearInterval(iv); }, 100); });
    await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'commit' });
    var tLoad = -1;
    try { await page.waitForSelector('#loading', { timeout: 15000 }); tLoad = Date.now() - t0; } catch (e) {}
    await page.waitForFunction(function () { return window.MJ && MJ.booted; }, null, { timeout: 180000 });
    var tBoot = Date.now() - t0;
    var ld = await page.evaluate(function () { return window.__ld; });
    var seen = {}; ld.forEach(function (x) { seen[x[1] || '0'] = seen[x[1] || '0'] || x[0]; });
    var fatal = await page.evaluate(function () { var f = document.getElementById('fatal'); return f && f.style.display === 'block'; });
    console.log(MBPS + ' Mbps（RTT ' + RTT + 'ms）：載入畫面出現 ' + tLoad + 'ms，完成啟動 ' + tBoot + 'ms，進度值 ' + JSON.stringify(seen) + '，錯誤畫面 ' + (fatal ? '有' : '無') + '，JS 錯誤 ' + errs.length);
    await ctx.close();
  }
  await browser.close(); srv.close();
});
