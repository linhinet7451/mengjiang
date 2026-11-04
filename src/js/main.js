/* 啟動：載入存檔、計時器、自動存檔 */
(function () {
  var UI = MJ.UI, G = MJ.G, S = MJ.S, U = MJ.U;
  MJ.boot = function () {
    G.initData();
    UI.bind();
    if (MJ.Art.injectBg) MJ.Art.injectBg();
    if (UI.bindSound) UI.bindSound();
    var r = S.load();
    if (r.ok) {
      S.state = r.state; G.tick();
      UI.screen = 'city';
      if (r.fromBackup) setTimeout(function () { UI.toast('主存檔損壞，已自動改用備份存檔', 'bad'); }, 300);
    } else {
      if (!r.none) {
        // 存檔損壞且無可用備份：保留原文以便救援
        try { var raw = localStorage.getItem(S.KEY); if (raw) localStorage.setItem(S.KEY + '_corrupt', raw); } catch (e) { }
        setTimeout(function () { UI.toast('存檔無法讀取（' + (r.errors || []).slice(0, 2).join('；') + '），原始資料已另存為 ' + S.KEY + '_corrupt', 'bad'); }, 300);
      }
      UI.screen = 'newgame';
    }
    G.onChange = function () { if (UI.screen !== 'battle' && UI.screen !== 'newgame') UI.refresh(); };
    G.onChat = function () { var c = document.getElementById('chat'); if (c) c.innerHTML = UI.chatHtml(); };
    UI.layout();
    UI.render();
    var secs = 0;
    setInterval(function () {
      if (!S.state) return;
      secs++;
      var now = U.now();
      var cds = document.getElementsByClassName('cd');
      for (var i = 0; i < cds.length; i++) { var end = +cds[i].getAttribute('data-end'); cds[i].innerHTML = U.dur(Math.max(0, end - now)); }
      var busy = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
      var needRender = (cds.length && U.find(cds, function (c) { return +c.getAttribute('data-end') <= now; }));
      if (needRender && !busy && UI.screen !== 'battle' && UI.screen !== 'newgame') UI.render();
      if (secs % 30 === 0) S.save(false);
    }, 1000);
    function flush() { if (S.state) S.save(false); }
    window.addEventListener('pagehide', flush, false);
    window.addEventListener('beforeunload', flush, false);
    document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); }, false);
    MJ.booted = true;
    // 載入畫面：顯示進度與輪播小提示，最少停留 0.9 秒讓提示可讀
    var ld = document.getElementById('loading'), bar = document.getElementById('ldBar'), tip = document.getElementById('ldTip');
    if (ld) {
      if (bar) bar.style.width = '100%'; var lp = document.getElementById('ldPct'); if (lp) lp.innerHTML = '100%';
      var TIPS = MJ.LOAD_TIPS, ti = 0;
      var tv = setInterval(function () { ti = (ti + 1) % TIPS.length; if (tip) tip.innerHTML = TIPS[ti]; }, 2500);
      setTimeout(function () { ld.className = 'out'; clearInterval(tv); setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 450); }, 900);
    }
  };
  // 第一則：A（影片3 載入畫面原文）；其餘：D（本作撰寫）
  MJ.LOAD_TIPS = [
    '小提示：物理攻擊對體力高、法術攻擊對智力高、絕技攻擊對敏捷高的武將，裝備、屬性培養等是不一樣的。',
    '小提示：無雙值滿 100 會自動施放無雙絕技，攻擊與受擊都會累積無雙值。',
    '小提示：出手順序是雙方交替，前排先動，同一列由下往上。',
    '小提示：戰鬥超過 36 回合仍未分出勝負，進攻方判定失敗。',
    '小提示：到神武殿按「最強」可一鍵換上最好的裝備。',
    '小提示：存檔只放在這台裝置的瀏覽器裡，記得在「設置」匯出備份。',
    '小提示：通天塔戰敗沒有任何損失，每天還能領一次塔俸。',
    '小提示：無極幻境是連戰，生命與無雙值會延續到下一波。',
    '小提示：農田離線也會成長，施化肥可以縮短一半的剩餘時間。',
    '小提示：第五章起的首領有多層血條，要打掉每一層才算擊倒。',
    '小提示：右上角的喇叭可以一鍵靜音。'
  ];
})();
