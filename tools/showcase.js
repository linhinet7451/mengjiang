// 宣傳截圖：無雙特寫、AOE 範圍、首領戰（node tools/showcase.js）→ screenshots/showcase-*.png
var pw = require('playwright'), path = require('path');
var FILE = 'file://' + path.join(__dirname, '..', 'dist', 'mengjiang.html'), SHOT = path.join(__dirname, '..', 'screenshots');
(async function () {
  var b = await pw.chromium.launch(), ctx = await b.newContext({ offline: true, viewport: { width: 1280, height: 800 } }), page = await ctx.newPage(), errs = [];
  page.on('pageerror', function (e) { errs.push(e.message); });
  await page.goto(FILE);
  await page.waitForFunction(function () { return window.MJ && MJ.booted; }, null, { timeout: 8000 });
  var info = await page.evaluate(function () {
    var G = MJ.G; G.newGame('孟德', '力耐', 'm', 7); var s = MJ.S.state;
    G.lead().lv = 60;
    ['lvbu', 'diaochan', 'zhouyu', 'zhangwuji', 'linghuchong'].forEach(function (id) { var h = G.newHero(id); h.lv = 60; s.heroes.push(h); G.addToTeam(h.uid); });
    MJ.D.stages.stages.forEach(function (x) { if (x.ch < 5 || (x.ch === 5 && x.idx < 7)) s.stages[x.id] = { stars: 3, clears: 1 }; });
    s.player.energy = 999; s.settings.speed = 1; G.commit();
    var hu = MJ.R.heroUnit; MJ.R.heroUnit = function (h) { var u = hu.apply(this, arguments); if (h.id === 'lvbu') u.curRage = 100; return u; };
    var r = G.fight('s5_8', 12345); if (!r.ok) return r.msg;
    MJ.UI.startBattle(r); return 'ok ' + G.teamCount();
  });
  console.log('battle', info);
  await page.waitForFunction(function () { var c = document.getElementById('cutin'); return c && c.className === 'cutin on'; }, null, { timeout: 30000, polling: 30 });
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(SHOT, 'showcase-2-ult-cutin.png') });
  await page.waitForSelector('.cutin.on.small', { timeout: 10000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOT, 'showcase-3-ult-aoe-total.png') });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SHOT, 'showcase-1-boss-battle.png') });
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})().catch(function (e) { console.error(e); process.exit(1); });
