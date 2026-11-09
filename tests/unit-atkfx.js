// 全身動作攻擊動畫單元測試（2026-11-09，實機回饋跟進）：node tests/unit-atkfx.js
// ui-battle.js 是 UI 模組，Node 測試載入器不載入它；本檔以靜態契約測試守住規格
// （特效尺寸／時長／頓停／省電抑制／還原），執行期行為由 E2E（tests/e2e.js）以真實 DOM 驗證。
var fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var js = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-battle.js'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'style.css'), 'utf8');
var dist = fs.readFileSync(path.join(__dirname, '..', 'dist', 'mengjiang.html'), 'utf8');

// ---- 規格表 ATK_SPEC：尺寸與基準時長 ----
var spec = /var ATK_SPEC = \{ slash: (\d+), fist: (\d+), wave: (\d+), dur: (\d+), slashDur: (\d+), hitstop: (\d+) \}/.exec(js);
ok(!!spec, 'ATK_SPEC 規格表存在');
if (spec) {
  ok(+spec[1] === 200 && +spec[2] === 160 && +spec[3] === 120, '特效尺寸：揮刀 200px／出拳 160px／氣功 120px');
  ok(+spec[4] === 380 && +spec[5] === 500 && +spec[6] === 60, '基準時長：攻擊 380ms／揮刀 500ms／頓停 60ms');
  // 時長隨速度等比縮短（與 UI._atkDur / UI._hitstopMs 的公式一致）
  ok(Math.round(+spec[4] / 1) === 380 && Math.round(+spec[4] / 2) === 190 && Math.round(+spec[4] / 4) === 95, '攻擊時長 1x/2x/4x = 380/190/95ms');
  ok(Math.round(+spec[5] / 1) === 500 && Math.round(+spec[5] / 2) === 250 && Math.round(+spec[5] / 4) === 125, '揮刀時長 1x/2x/4x = 500/250/125ms');
  ok(Math.round(+spec[6] / 1) === 60 && Math.round(+spec[6] / 2) === 30 && Math.round(+spec[6] / 4) === 15, '頓停 1x/2x/4x = 60/30/15ms');
}
ok(/UI\._atkDur = function \(sp\) \{ return Math\.round\(ATK_SPEC\.dur \/ \(sp \|\| 1\)\); \}/.test(js), 'UI._atkDur 依速度等比縮短');
ok(/UI\._hitstopMs = function \(sp\) \{ return Math\.round\(ATK_SPEC\.hitstop \/ \(sp \|\| 1\)\); \}/.test(js), 'UI._hitstopMs 依速度等比縮短');
ok(/UI\._atkDir = function/.test(js) && /b\.x > a\.x \? 1 : -1/.test(js), 'UI._atkDir 朝目標 x 方向（A 向右／B 向左）');
ok(/UI\._atkSpec = ATK_SPEC/.test(js), 'UI._atkSpec 對外暴露（供 E2E 驗證）');

// ---- 攻擊種類對應不變 ----
ok(/if \(u\.dtype === 'm' \|\| u\.dtype === 'j'\) return 'wave'/.test(js), '法術／絕技 → wave（氣功）');
ok(/if \(!u\.look \|\| !u\.look\.wp \|\| u\.look\.wp === 'none'\) return 'fist'/.test(js), '徒手 → fist（出拳）');

// ---- 安全：省電模式抑制、治療跳過、只觸發一次、還原 ----
ok(/function attackAnim\(me, e\) \{\n    if \(!me \|\| e\.heal \|\| \(UI\.lowFx && UI\.lowFx\(\)\)\) return;/.test(js), 'attackAnim：治療跳過、省電模式不產生新特效');
ok(/impactFlash\(p, when\)/.test(js) && /if \(UI\.lowFx && UI\.lowFx\(\)\) return;\n    setTimeout\(function \(\) \{\n      var fx = el\('fx'\)/.test(js), 'impactFlash：省電模式不加閃光');
// 回歸（2026-11-09 WebKit E2E）：impactFlash 每擊呼叫 shake(false) 會讓整個 #bt（含跳過按鈕）
// 每擊震動 0.3s，忙碌戰鬥中 Playwright 等不到按鈕穩定而逾時；全屏震動只留給暴擊／無雙
var impBody = js.slice(js.indexOf('function impactFlash'), js.indexOf('function bodyThrust'));
ok(impBody.indexOf('shake(') < 0, 'impactFlash 本體不震動舞台（每擊全屏震動會讓跳過按鈕點不到）');
ok((js.match(/shake\(/g) || []).length === 5, 'shake() 只剩定義＋其內部 / shake(big)?\/g 正則＋暴擊／無雙／重踏 3 處呼叫（不在每擊路徑上）');
ok(/function bodyThrust\(ue, kind, dir, impact\)/.test(js), 'bodyThrust（非近戰全身動作）存在');
ok(/ue\.style\.webkitTransform = ue\.style\.transform = '';\n      ue\.className = ue\.className\.replace\(\/ atk-\(raise\|thrust\|hit\|cast\)\/g, ''\);/.test(js), 'bodyThrust 結束時清除 inline transform 與動作 class（不漂移）');
ok(/ue\.className\.replace\(\/ \(acting\|lunge\|windup\|atk-raise\|atk-thrust\|atk-hit\|atk-cast\)\/g, ''\)/.test(js), 'step() 還原時一併清除新動作 class');
ok(/var hs = \(!e\.heal && !\(UI\.lowFx && UI\.lowFx\(\)\)\) \? UI\._hitstopMs\(BT\.speed\) : 0;/.test(js), '命中頓停：省電模式與治療不頓停，否則依速度取 60ms 基準');
ok(/btEl\.className \+= ' hitstop'/.test(js) && /btEl\.className = btEl\.className\.replace\(\/ hitstop\/g, ''\)/.test(js), '命中頓停以 .hitstop class 凍結動畫，結束後清除');
ok(/if \(!BT \|\| BT\.done\) return;/.test(js), '頓停後檢查 BT.done（跳過戰鬥不結算傷害）');
// 還原排在 BT.done 檢查之前：跳過戰鬥時攻擊者仍回位（原版 step() 也是無條件還原）
var hsBlock = js.slice(js.indexOf('var hs = (!e.heal'));
var restoreAt = hsBlock.indexOf('replace(/ (acting|lunge|windup|atk-raise|atk-thrust|atk-hit|atk-cast)/g,');
var doneAt = hsBlock.indexOf('if (!BT || BT.done) return;');
ok(restoreAt > 0 && doneAt > 0 && restoreAt < doneAt, '跳過戰鬥時仍還原攻擊者位置（還原排在 BT.done 檢查之前）');
// 頓停只包 setTimeout，不改傷害：applyEv 呼叫點仍是原樣，且 battle.js / rules.js 本輪未改
ok(/setTimeout\(function \(\) \{ if \(BT && !BT\.done\) applyEv\(g\); \}, T\(k2? \* 45\)\)/.test(js), '傷害結算仍經原 applyEv，頓停只延後顯示時序');
ok(!/applyEv\(g, /.test(js) && !/dmg \*=/.test(js), '本輪未改傷害數值（無額外倍率或參數）');

// ---- 特效行為：揮刀雙弧／拳影飛行／氣功球飛行 ----
ok(/d\.className = 'atkfx slash'/.test(js) && /viewBox="0 0 200 200"/.test(js), '揮刀：200px 雙弧刀光（主弧＋殘影弧）');
ok(/d\.style\.webkitAnimationDuration = d\.style\.animationDuration = Math\.round\(ATK_SPEC\.slashDur \/ sp\)/.test(js), '揮刀弧光時長隨速度縮放');
ok(/if \(dir < 0\) \{ var sv = d\.getElementsByTagName\('svg'\)\[0\];/.test(js), 'B 方刀光鏡像（揮向左）');
ok(/fb\.className = 'atkfx fistfly'/.test(js) && /bb\.className = 'atkfx fistburst'/.test(js), '出拳：拳影飛行（fistfly）＋抵達爆開（fistburst）');
ok(/fb\.style\.webkitTransitionDuration = fb\.style\.transitionDuration = T\(220\)/.test(js), '拳影飛行時間隨速度縮放');
ok(/o\.style\.webkitTransitionDuration = o\.style\.transitionDuration = T\(300\)/.test(js), '投射光球飛行時間隨速度縮放（原寫死 .3s）');
ok(/var ob = document\.createElement\('div'\); ob\.className = 'hitflash'/.test(js), '光球抵達時在目標處爆開（hitflash）');
ok(/if \(!melee && ue\) bodyThrust\(ue, kind, dir, impact\)/.test(js), '非近戰補全身動作；近戰由 step() windup/lunge 處理，不重複');

// ---- CSS：加大加亮、身體轉動、受擊後仰、頓停凍結、省電抑制 ----
ok(/\.atkfx\{position:absolute;width:200px;height:200px/.test(css), 'CSS：.atkfx 200px（舊 120px）');
ok(/\.atkfx\.slash\{-webkit-animation:atkslash \.5s/.test(css), 'CSS：揮刀動畫 .5s（舊 .38s）');
ok(/\.atkfx\.slash svg\{-webkit-filter:drop-shadow\(0 0 10px rgba\(255,220,120,\.95\)\)/.test(css), 'CSS：刀光更亮（雙層 drop-shadow）');
ok(/\.atkfx\.fistfly\{width:60px;height:60px/.test(css), 'CSS：拳影 60px 飛行體');
ok(/\.atkfx\.fistburst\{width:160px;height:160px/.test(css), 'CSS：拳爆 160px（光球＋衝擊環）');
ok(/\.atkfx\.charge\{width:120px;height:120px/.test(css), 'CSS：聚氣光球 120px（舊 80px）');
ok(/\.orb\.wave\{width:52px;height:52px/.test(css), 'CSS：氣功光球 52px（舊 40px）');
ok(/\.hitflash\{position:absolute;width:120px;height:120px/.test(css), 'CSS：命中閃光 .hitflash');
ok(/\.battle\.hitstop \.bfig,\.battle\.hitstop \.atkfx/.test(css) && /animation-play-state:paused/.test(css), 'CSS：命中頓停凍結動畫（animation-play-state:paused）');
ok(/\.bu\.windup \.bfig\{-webkit-transform:translateX\(-18px\) rotate\(-5deg\)/.test(css), 'CSS：蓄力後仰 -18px＋傾斜 -5°（舊 -8px 無傾斜）');
ok(/\.bu\.lunge \.bfig\{-webkit-transform:rotate\(12deg\)/.test(css), 'CSS：前衝轉身揮砍 rotate(12deg)');
ok(/\.bu\.sideB\.lunge \.bfig\{-webkit-transform:scaleX\(-1\) rotate\(12deg\)/.test(css), 'CSS：B 方前衝鏡像正確');
ok(/\.bu\.atk-thrust \.bfig\{-webkit-transform:translateX\(-10px\) rotate\(-4deg\)/.test(css), 'CSS：出拳蓄力後仰');
ok(/\.bu\.atk-hit \.bfig\{-webkit-transform:translateX\(12px\) rotate\(5deg\)/.test(css), 'CSS：出拳前頂');
ok(/\.bu\.atk-raise \.bfig\{-webkit-transform:translateY\(-8px\)/.test(css), 'CSS：氣功蓄力抬手');
ok(/\.bu\.atk-cast \.bfig\{-webkit-transform:translateX\(6px\) rotate\(4deg\)/.test(css), 'CSS：氣功前推');
ok(/25%\{-webkit-transform:translateX\(-20px\) rotate\(-3deg\)/.test(css) && /20%\{-webkit-transform:translate\(-30px,-6px\) rotate\(-6deg\)/.test(css), 'CSS：受擊後仰加大（-20px/-3°，無雙 -30px/-6°）');
ok(/\.lowfx \.hitflash,\.lowfx \.atkfx\.fistfly,\.lowfx \.atkfx\.fistburst\{display:none\}/.test(css), 'CSS：省電模式隱藏新特效');
ok(/\.lowfx \.bu\.sideA\.lunge \.bfig\{-webkit-transform:none;transform:none\}/.test(css), 'CSS：省電模式取消前衝轉身（A 方）');
ok(/\.lowfx \.bu\.sideB\.lunge \.bfig\{-webkit-transform:scaleX\(-1\);transform:scaleX\(-1\)\}/.test(css), 'CSS：省電模式取消前衝轉身仍保留 B 方鏡像');
ok(/\.lowfx \.atkfx\.slash svg\{-webkit-filter:none;filter:none\}/.test(css), 'CSS：省電模式取消刀光光暈');

// ---- 建置產物：單檔包含新程式碼且未超限 ----
var distPath = path.join(__dirname, '..', 'dist', 'mengjiang.html');
var distBytes = fs.statSync(distPath).size;
ok(dist.indexOf('hitstop') >= 0 && dist.indexOf('fistburst') >= 0 && dist.indexOf('ATK_SPEC') >= 0, 'dist/mengjiang.html 包含新攻擊動畫程式碼');
ok(distBytes < 12000000, '單檔 ' + distBytes + ' bytes，未超過 12,000,000 上限');
ok(dist.indexOf('musou:true') >= 0 && dist.indexOf('musou:0') >= 0, '無雙演出開關仍在（與攻擊動畫獨立）');

console.log('結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
