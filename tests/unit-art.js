// 美術素材檢查：node tests/unit-art.js
var fs = require('fs'), path = require('path'), vm = require('vm');
var R = path.join(__dirname, '..', 'src', 'js'), ctx = { MJ: {}, console: console };
vm.createContext(ctx);
['data.generated.js', 'assets.generated.js', 'assets-map.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8'), ctx, { filename: f }); });
var MJ = ctx.MJ, A = MJ.ASSETS, pass = 0, fail = 0;
function ok(c, n) { if (c) pass++; else { fail++; console.log('✗ ' + n); } }
MJ.D.heroes.list.forEach(function (h) { ok(A['h_' + h.id] && A['h_' + h.id + '_av'], '武將立繪與頭像 ' + h.id); ok(h.look.art === 'h_' + h.id, '武將 look.art ' + h.id); });
['m', 'f'].forEach(function (g) { ok(A['c_lead_' + g] && A['c_lead_' + g + '_av'], '主角 ' + g); });
Object.keys(MJ.D.stages.enemies).forEach(function (k) { var a = MJ.D.stages.enemies[k].art; ok(a && A[a] && A[a + '_av'], '敵方美術 ' + k); });
['shenwu', 'juxian', 'xukong', 'tongtian', 'shenbing', 'baifang', 'farm', 'jiangxing', 'wuji'].forEach(function (k) { ok(A['k_' + k], '建築 ' + k); });
for (var i = 1; i <= 8; i++) ok(A['bf_' + i], '戰場 bf_' + i);
['bg_city', 'bg_shenwu', 'bg_tower', 'bg_wuji', 'bg_farm', 'bg_recruit', 'bg_gate', 'bg_arena'].forEach(function (k) { ok(A[k], '背景 ' + k); });
Object.keys(A).forEach(function (k) { ok(/^data:image\/webp;base64,/.test(A[k]), 'WebP data URI ' + k); });
var sz = fs.statSync(path.join(R, 'assets.generated.js')).size;
ok(sz < 19.5 * 1024 * 1024, '內嵌素材 < 19.5MB（WL-2 上限 20MB；' + sz + '）');
// art2：無雙 cut-in 高解析半身像、UI 圖示、材質、通天塔
Object.keys(A).filter(function (k) { return /_av$/.test(k); }).forEach(function (k) { var c = k.replace(/_av$/, '_ci'); ok(A[c] && A[c].length > 6000, 'cut-in 半身像 ' + c); });
['t_wood', 't_paper', 'bg_pagoda', 'i_gold', 'i_silver', 'i_dart', 'i_book2', 'i_soul_q0', 'i_soul_q4', 'i_gem_e53935', 'i_gem_fb8c00'].forEach(function (k) { ok(A[k], 'UI 素材 ' + k); });
var raw = fs.readFileSync(path.join(R, 'assets.generated.js'), 'utf8'), nch = raw.split('/*@@CHUNK*/').length;
ok(nch >= 8 && nch <= 16, '素材分段載入（' + nch + ' 段）');
ok((raw.match(/MJ_LDP\(\d+\)/g) || []).length === nch, '每段都回報進度');
var html = fs.readFileSync(path.join(R, '..', 'index.html'), 'utf8');
ok(/DOMContentLoaded', wd/.test(html) && /8000\)/.test(html), '看門狗改在讀完檔案後才計時（8 秒）');
ok(/id="ldPct"/.test(html), '載入畫面顯示百分比');
var dist = path.join(__dirname, '..', 'dist', 'mengjiang.html');
if (fs.existsSync(dist)) ok(fs.statSync(dist).size < 20 * 1000 * 1000, '單檔 dist/mengjiang.html < 20MB（WL-2 上限；' + fs.statSync(dist).size + '）');
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
