// 武林大會單元測試（8 人 AI 淘汰賽，第 41 屆，海選 Lv.70-75）＋無雙演出開關預設：node tests/unit-wulin.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function seq(vals) { var i = 0; return function () { return vals[i++ % vals.length]; }; }
var c = load(), M = c.MJ, G = M.G, R = M.R, S = M.S, U = M.U;
G.newGame('測試', '力耐', 'm', 7);
var s = S.state;

console.log('[無雙演出開關]');
ok(s.settings.musou === true, '新存檔無雙演出預設開');
ok(s.settings.speed === 1, '新存檔戰鬥速度預設 1x（1x/2x/4x 循環不變）');
var old = JSON.parse(JSON.stringify(s)); delete old.settings.musou;
var po = S.parse(JSON.stringify(S.wrap(old)));
ok(po.ok && po.state.settings.musou === true, '沒有 musou 欄位的舊存檔會自動補上（預設開）');

console.log('[玄機盤骰子]');
var dd = G.wheelDice(seq([0.5]));
ok(dd.dice.join(',') === '4,4,4,4,4' && dd.v === 4665, 'G.wheelDice：5 顆骰子 base-6 數字（0.5 → 全 4，v=4665）');
ok(G.wheelDice(seq([0])).dice.join(',') === '1,1,1,1,1' && G.wheelDice(seq([0.999])).dice.join(',') === '6,6,6,6,6', '骰面 1～6 邊界正確');

console.log('[武林大會]');
G.lead().lv = 1;
ok(!G.wulinStart().ok, '主角未滿 70 級時武林大會未開放');
G.lead().lv = 70;
var b = G.wulinBracket(12345);
ok(b.foes.length === 3 && b.qf.length === 4 && b.edition === 41, '對陣表：第 41 屆、4 場八強、玩家 3 個對手');
ok(b.foes[0] && b.foes[1] && b.foes[2] && b.foes[0].rank !== b.foes[1].rank, '三輪對手皆有且互不相同（以 rank 區分）');
var b2 = G.wulinBracket(12345);
ok(JSON.stringify(b) === JSON.stringify(b2), '同一種子產生同一對陣表（可重播）');
ok(G.wulinBracket(999).foes[0].rank === b.foes[0].rank, '八強對手固定為第 7 名 AI（種子不影響首輪對手）');
ok(G.wulinRewards(0).silver === 1000 && G.wulinRewards(1).items.length === 2 && G.wulinRewards(2).silver === 5000, '輪次獎勵：八強 1000、四強 2000、決賽 5000（遞增）');
var st1 = G.wulinStart(12345);
ok(st1.ok && G.wulinState().bracket && G.wulinState().bracket.round === 0, '開始本屆武林大會');
ok(!G.wulinStart().ok, '進行中不能重開一屆');
G.lead().lv = 80;
var guard = 0, last = null;
while (!G.wulinState().bracket.done && guard < 5) { guard++; last = G.wulinFight(1000 + guard); ok(last.ok && last.mode === 'wulin', '武林大會第 ' + guard + ' 輪出戰回傳 mode=wulin'); }
ok(G.wulinState().bracket.done, '大會結束（奪冠或止步，共 ' + guard + ' 輪）');
if (last && last.win) ok(G.wulinState().champ === true, '三輪全勝即奪冠');
else ok(G.wulinState().bracket.lost === true, '落敗即止步本輪');
if (G.wulinState().recs.length) { var rp = G.wulinReplay(0); ok(rp.ok && rp.replay && rp.consistent, '戰報重播與當時結果一致'); }
var st2 = G.wulinStart(54321);
ok(st2.ok && G.wulinState().bracket.round === 0, '結束後可以開始下一屆');
var old2 = JSON.parse(JSON.stringify(s)); delete old2.wulin;
var po2 = S.parse(JSON.stringify(S.wrap(old2)));
ok(po2.ok && po2.state.wulin && po2.state.wulin.edition === 41, '沒有武林大會欄位的舊存檔會自動補上');

console.log('[入口接線回歸：2026-11-09 當機]');
var fs = require('fs'), path = require('path');
var p1p2 = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-p1p2.js'), 'utf8');
var uijs = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui.js'), 'utf8');
var p4 = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-p4.js'), 'utf8');
// 武林大會是全屏（UI.screens.wulin），不是 modal：玩法中心按鈕必須走 data-a="wulin"（UI.actions.wulin → UI.go('wulin')），
// 不能走 data-a="open" data-v="wulin"（UI.modals 沒有 wulin，舊寫法會顯示空白 #modal 蓋住全畫面且無關閉鈕，看似當機）
ok(/'league','武林大會','單機 8 人淘汰賽：第 41 屆，海選 Lv\.70-75','wulin','進入武林大會'/.test(p1p2), '玩法中心武林大會按鈕走全屏入口 data-a="wulin"');
ok(!/'open','進入武林大會','wulin'/.test(p1p2), '玩法中心不再把武林大會當 modal 開（舊寫法已移除）');
ok(/UI\.screens\.wulin = function/.test(p4) && !/UI\.modals\.wulin = function/.test(p4), '武林大會是全屏（screens），不是 modal（modals 無 wulin）');
ok(/UI\.actions\.wulin = function \(\) \{ UI\.go\('wulin'\); \}/.test(p4), 'UI.actions.wulin 進全屏並清除 modal');
// 縱深防禦：未知 modal 名稱不得留下空白遮罩
ok(/UI\.open = function \(name, arg\) \{ if \(!UI\.modals\[name\]\) \{ UI\.toast/.test(uijs), 'UI.open 拒絕未知的 modal 名稱（不留空白遮罩）');
ok(/if \(!fn\) \{ m\.innerHTML = ''; m\.style\.display = 'none'; UI\.modal = null; return; \}/.test(uijs), 'UI.renderModal 遇未知 modal 時隱藏遮罩並清除狀態');

console.log('\n武林大會：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
