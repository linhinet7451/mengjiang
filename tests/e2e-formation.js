// 換陣法端對端測試（Tomas 2026-11-04 回報：換陣法角色不換位、文字黏在一起、進虛空之門也沒換）
// 全程用介面點擊：主城「陣法」→ 選新陣法 → 檢查 3×3 格子與武將位置 → 重新整理 → 再檢查 → 虛空之門 1-1 → 檢查戰場站位與前進
// node tests/e2e-formation.js [chromium|webkit|all]
var pw = require('playwright'), path = require('path'), fs = require('fs');
var FILE = 'file://' + path.join(__dirname, '..', 'dist', 'mengjiang.html');
var SHOT = path.join(__dirname, '..', 'screenshots');
var which = process.argv[2] || 'all';
var total = { pass: 0, fail: 0, lines: [] };
function fx(v) { return fs.readFileSync(path.join(__dirname, 'fixtures', 'save-' + v + '.json'), 'utf8'); }

async function run(label, bt, ctxOpts, prefix, src) {
  var pass = 0, fail = 0, L = label + '／' + src;
  function ok(c, name) { if (c) { pass++; console.log('  通過 [' + L + '] ' + name); } else { fail++; console.log('✗ 失敗 [' + L + '] ' + name); } }
  var browser = await bt.launch(), ctx = await browser.newContext(Object.assign({ offline: true }, ctxOpts));
  var errors = [];
  await ctx.route('**/*', function (r) { return /^(file|data|blob|about):/.test(r.request().url()) ? r.continue() : r.abort(); });
  var page = await ctx.newPage();
  page.on('pageerror', function (e) { errors.push(e.message); });
  page.on('dialog', function (d) { d.accept(); });
  var J = function (f, a) { return page.evaluate(f, a); };
  async function act(sel) { await page.locator(sel).first().click(); await page.waitForTimeout(150); }
  async function closeModals() { for (var k = 0; k < 6; k++) { var c = page.locator('#modal [data-a="close"]:visible'); if (!(await c.count())) return; await c.last().click(); await page.waitForTimeout(150); } }
  async function boot() { await page.waitForFunction(function () { return window.MJ && MJ.booted; }, null, { timeout: 10000 }); await page.waitForSelector('#loading', { state: 'detached', timeout: 8000 }); await page.waitForTimeout(300); }
  function grid() {
    var cells = [].map.call(document.querySelectorAll('#modal .fgrid .fcell'), function (e) {
      var q = e.getBoundingClientRect(), a = e.querySelector('.fc-e'), n = e.querySelector('.fc-n'), ov = false;
      if (a && n) { var A = a.getBoundingClientRect(), N = n.getBoundingClientRect(); ov = !(A.right <= N.left || N.right <= A.left || A.bottom <= N.top || N.bottom <= A.top); }
      return { cell: +e.dataset.cell, cx: Math.round(q.left + q.width / 2), cy: Math.round(q.top + q.height / 2), uid: e.dataset.uid ? +e.dataset.uid : null, ov: ov };
    });
    var xs = {}, ys = {}; cells.forEach(function (c) { xs[c.cx] = 1; ys[c.cy] = 1; });
    var map = {}; cells.forEach(function (c) { if (c.uid != null) map[c.cell] = c.uid; });
    return { n: cells.length, nx: Object.keys(xs).length, ny: Object.keys(ys).length, overlap: cells.filter(function (c) { return c.ov; }).length, dom: map, state: MJ.S.state.team.cells, form: MJ.S.state.team.formation };
  }
  function same(a, b) { var ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.join() === kb.join() && ka.every(function (k) { return +a[k] === +b[k]; }); }

  await page.goto(FILE); await boot();
  if (src === 'fresh') { await page.fill('#ngName', '換陣俠'); await act('[data-a="ngStart"]'); await page.waitForTimeout(400); }
  else { await J(function (t) { localStorage.clear(); localStorage.setItem('mjws_save', t); }, fx(src)); await page.reload(); await boot(); }
  await closeModals();
  ok(await J(function () { return MJ.UI.screen; }) === 'city', '進入主城（' + (src === 'fresh' ? '新存檔' : src + ' 存檔升級') + '，存檔格式 v' + (await J(function () { return MJ.S.state.version; })) + '）');

  // 1) 主城下方「陣法」按鈕
  await act('.bb[data-a="open"][data-v="formation"]');
  var g0 = await J(grid);
  ok(g0.n === 9 && g0.nx === 3 && g0.ny === 3, '陣法格子是 3×3（9 格；' + g0.nx + ' 欄 × ' + g0.ny + ' 列）');
  ok(g0.overlap === 0, '「空位／未開放」文字與前中後標籤沒有重疊（重疊 ' + g0.overlap + ' 格）');
  ok(same(g0.dom, g0.state), '畫面上的武將位置＝存檔站位 ' + JSON.stringify(g0.state));
  await page.screenshot({ path: path.join(SHOT, prefix + src + '-formation-before.png') });
  var target = g0.form === 'yanxing' ? 'fangyuan' : 'yanxing';
  var want = await J(function (a) { var f = MJ.D.formations.filter(function (x) { return x.id === a.t; })[0], n = Object.keys(MJ.S.state.team.cells).length; return f.cells.slice(0, n).map(String).sort().join(','); }, { t: target });
  // 2) 點新陣法
  await act('#modal [data-a="setForm"][data-v="' + target + '"]');
  var g1 = await J(grid);
  var movedDom = Object.keys(g0.dom).filter(function (k) { var u = g0.dom[k]; return !Object.keys(g1.dom).some(function (k2) { return k2 === k && g1.dom[k2] === u; }); }).length;
  ok(g1.form === target, '點選後陣法變成 ' + target);
  ok(Object.keys(g1.dom).sort().join(',') === want, '武將站到新陣法的格子（畫面：' + Object.keys(g1.dom).sort().join(',') + '；陣法前 N 格：' + want + '）');
  ok(movedDom > 0, '畫面上確實有武將換位（' + movedDom + ' 人）');
  ok(same(g1.dom, g1.state) && Object.keys(g1.dom).length === Object.keys(g0.dom).length, '換陣後畫面＝存檔，人數不變（' + Object.keys(g1.dom).length + ' 人）');
  ok(g1.nx === 3 && g1.ny === 3 && g1.overlap === 0, '換陣後仍是 3×3、文字不重疊');
  var toast = await page.locator('#toast').innerText().catch(function () { return ''; });
  ok(toast.indexOf('依新陣形換位') >= 0, '提示「' + toast.replace(/\s+/g, ' ').slice(0, 40) + '」');
  await page.screenshot({ path: path.join(SHOT, prefix + src + '-formation-after.png') });
  var saved = g1.state;
  // 3) 重新整理
  await page.reload(); await boot(); await closeModals();
  await act('.bb[data-a="open"][data-v="formation"]');
  var g2 = await J(grid);
  ok(g2.form === target && same(g2.dom, saved), '重新整理後陣法與畫面站位都保留 ' + JSON.stringify(g2.dom));
  await closeModals();
  // 4) 虛空之門 1-1
  await act('[data-a="gate"]');
  await act('[data-a="gateCh"][data-v="1"]');
  await act('[data-a="stagePop"][data-v="s1_1"]');
  await act('[data-a="startBattle"]');
  var b0 = await J(function () {
    var keys = [].map.call(document.querySelectorAll('.bu.sideA'), function (e) { return e.id.slice(1); });
    var bad = [];
    keys.forEach(function (k) { var c = +k.slice(1), r = Math.floor(c / 3), p = MJ.UI.boardPos(r, 2 - c % 3), e = document.getElementById('u' + k); if (parseFloat(e.style.left) !== p.x - 56 || parseFloat(e.style.top) !== p.y - 130) bad.push(k); });
    return { keys: keys.map(function (k) { return k.slice(1); }).sort().join(','), bad: bad, screen: MJ.UI.screen, tiles: document.querySelectorAll('.tile.bd').length, rule: !!document.querySelector('.b-rule') };
  });
  ok(b0.screen === 'battle', '進入虛空之門 1-1 戰鬥');
  ok(b0.keys === Object.keys(saved).sort().join(','), '戰場上我方站位＝新陣法（' + b0.keys + '）');
  ok(b0.bad.length === 0, '每位武將畫在自己格子的棋盤位置（錯位 ' + b0.bad.length + '）');
  ok(b0.tiles === 24 && b0.rule, '大棋盤 3 列 × 8 格，顯示「每回合雙方前進一格」說明');
  await page.screenshot({ path: path.join(SHOT, prefix + src + '-battle-start.png') });
  await page.waitForFunction(function () { return document.querySelector('.bu.moving'); }, null, { timeout: 8000 }).catch(function () {});
  await page.waitForTimeout(180);
  var mv = await J(function () { var m = [].map.call(document.querySelectorAll('.bu.moving'), function (e) { return e.id; }); return { m: m.length, log: (document.querySelector('.b-log') || document.body).innerText.indexOf('雙方前進一格') >= 0 }; });
  ok(mv.m > 0, '戰鬥中看得到雙方往前走（同時移動 ' + mv.m + ' 人）');
  await page.screenshot({ path: path.join(SHOT, prefix + src + '-battle-advance.png') });
  var rows = await J(function () { var bad = 0; [].forEach.call(document.querySelectorAll('.bu'), function (e) { var k = e.id.slice(2), r = Math.floor(+k / 3); if (Math.abs(parseFloat(e.style.top) - ([206, 336, 466][r] - 130)) > 1) bad++; }); return bad; });
  ok(rows === 0, '前進後每個人都還在自己那一列（換列 ' + rows + '）');
  await act('[data-a="bSkip"]');
  await page.waitForSelector('.result', { timeout: 20000 });
  ok(await page.locator('.result').count() === 1, '戰鬥打完並顯示結算（' + ((await page.locator('.result.win').count()) ? '勝利' : '失敗') + '）');
  ok(errors.length === 0, '沒有 JS 錯誤' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  total.pass += pass; total.fail += fail; total.lines.push(L + '：通過 ' + pass + '，失敗 ' + fail);
}

(async function () {
  var srcs = ['fresh', 'v8', 'v9', 'v10'];
  try {
    for (var s of srcs) {
      if (which === 'all' || which === 'chromium') await run('Chromium 1280x800', pw.chromium, { viewport: { width: 1280, height: 800 } }, 'form-desktop-', s);
      if (which === 'all' || which === 'webkit') await run('WebKit iPhone 13 直向', pw.webkit, Object.assign({}, pw.devices['iPhone 13']), 'form-iphone-', s);
      if (which === 'all' || which === 'webkit') await run('WebKit iPhone 13 橫向', pw.webkit, Object.assign({}, pw.devices['iPhone 13 landscape']), 'form-iphoneL-', s);
    }
  } catch (e) { total.fail++; console.log('✗ 測試中斷：', e.message); }
  console.log('\n' + total.lines.join('\n') + '\n合計：通過 ' + total.pass + '，失敗 ' + total.fail);
  process.exit(total.fail ? 1 : 0);
})();
