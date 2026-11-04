/* 第四階段：原創程序化音樂與音效（WebAudio 即時合成，不含任何音檔）
   - 每個場景一首以五聲音階自動編排的循環曲（主城／關卡選擇／戰鬥／首領戰／勝利／戰敗／通天塔與幻境／聚賢莊／農田）
   - 音色：古箏式撥弦、嗩吶式簧管、鐘鈴、二胡式滑音、笛子式氣聲
   - 音效：點擊、命中、暴擊、無雙、治療、陣亡、勝利、戰敗、獲得、招募
   - 瀏覽器規定須在使用者第一次點擊後才能發聲；不支援 WebAudio 時全部靜默略過 */
(function () {
  var MJ = window.MJ, A = MJ.Audio = {};
  // ---------- 純資料：曲目設定與旋律產生（可在 Node 測試） ----------
  // 音高以「距 A4 的半音數」表示
  var SCALES = { gong: [0, 2, 4, 7, 9], yu: [0, 3, 5, 7, 10], shang: [0, 2, 5, 7, 10] };
  A.SONGS = {
    city:    { bpm: 84,  root: -2, mode: 'gong',  seed: 11, lead: 'pluck', drums: 0, pad: 1, bass: 1, density: 0.55 },
    battle:  { bpm: 132, root: -5, mode: 'yu',    seed: 23, lead: 'reed',  drums: 2, pad: 0, bass: 2, density: 0.8 },
    boss:    { bpm: 144, root: -7, mode: 'yu',    seed: 37, lead: 'reed',  drums: 3, pad: 1, bass: 2, density: 0.9 },
    mystic:  { bpm: 70,  root: -4, mode: 'shang', seed: 41, lead: 'bell',  drums: 1, pad: 1, bass: 1, density: 0.45 },
    recruit: { bpm: 100, root: 0,  mode: 'gong',  seed: 53, lead: 'bell',  drums: 1, pad: 1, bass: 1, density: 0.6 },
    farm:    { bpm: 92,  root: 3,  mode: 'gong',  seed: 67, lead: 'pluck', drums: 0, pad: 0, bass: 1, density: 0.5 },
    title:   { bpm: 76,  root: -2, mode: 'yu',    seed: 79, lead: 'pluck', drums: 1, pad: 1, bass: 1, density: 0.5, lead2: 'dizi' },
    // 關卡選擇：緊張的行軍感（羽調、低音雙拍、輕鼓）
    gate:    { bpm: 112, root: -6, mode: 'yu',    seed: 89, lead: 'reed',  drums: 1, pad: 1, bass: 2, density: 0.6 },
    // 勝利：明亮的宮調、鑼鼓、鈴聲
    victory: { bpm: 120, root: 0,  mode: 'gong',  seed: 97, lead: 'bell',  drums: 2, pad: 1, bass: 1, density: 0.85, lead2: 'dizi' },
    // 戰敗：緩慢的二胡式滑音（羽調）
    defeat:  { bpm: 60,  root: -5, mode: 'yu',    seed: 103, lead: 'erhu', drums: 0, pad: 1, bass: 1, density: 0.45 }
  };
  // 主城：古箏（撥弦）主旋律＋笛子副旋律
  A.SONGS.city.lead2 = 'dizi';
  A.SCENE_OF = { newgame: 'title', city: 'city', battle: 'battle', tower: 'mystic', wuji: 'mystic', juxian: 'recruit', recruit: 'recruit', farm: 'farm', arena: 'mystic', gate: 'gate' };
  function rng(seed) { var x = seed * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  // 產生 64 步（4 小節×16 分音符）的旋律、低音、鼓點
  A.pattern = function (name) {
    var sg = A.SONGS[name] || A.SONGS.city, r = rng(sg.seed), sc = SCALES[sg.mode];
    var steps = 64, mel = [], bass = [], drum = [], deg = 5, motif = [];
    // 先產生 1 小節動機，第 2、4 小節變奏重複，第 3 小節自由發展（傳統「起承轉合」的簡化）
    for (var i = 0; i < 16; i++) {
      var on = i % 4 === 0 ? r() < 0.9 : (i % 2 === 0 ? r() < sg.density : r() < sg.density * 0.35);
      if (on) { deg += Math.floor(r() * 5) - 2; if (deg < 2) deg = 2 + Math.floor(r() * 2); if (deg > 10) deg = 9 - Math.floor(r() * 2); }
      motif.push(on ? deg : null);
    }
    for (var b = 0; b < 4; b++) for (var j = 0; j < 16; j++) {
      var d = motif[j];
      if (b === 1 && d !== null && j >= 8) d = d + (j % 4 === 0 ? 1 : 0);
      if (b === 2) { d = (j % 2 === 0 && r() < sg.density) ? 3 + Math.floor(r() * 7) : null; if (j === 0) d = 7; }
      if (b === 3 && j >= 12) d = j === 12 ? 5 : null; // 收束到主音
      mel.push(d === null || d === undefined ? null : sg.root + 12 + sc[d % 5] + 12 * Math.floor(d / 5) - 12);
    }
    var prog = [0, 3, 4, 0]; // 以音階度數表示的低音進行
    for (var k = 0; k < steps; k++) {
      var bar = Math.floor(k / 16), st = k % 16, root = sg.root - 24 + sc[prog[bar] % 5];
      bass.push(sg.bass === 2 ? (st % 2 === 0 ? root + (st % 8 === 6 ? 7 : 0) : null) : (st % 8 === 0 ? root : null));
      var dr = null;
      if (sg.drums >= 1 && st % 8 === 0) dr = 'taiko';
      if (sg.drums >= 2 && (st === 4 || st === 12)) dr = 'snare';
      if (sg.drums >= 2 && st % 2 === 1 && r() < 0.35) dr = 'tick';
      if (sg.drums >= 3 && (st === 14 || st === 15) && bar === 3) dr = 'taiko';
      if (sg.drums === 1 && st !== 0) dr = st === 8 && r() < 0.5 ? 'tick' : null;
      drum.push(dr);
    }
    // 副旋律（笛子）：在第 2、4 小節的強拍上，取主旋律高八度長音，形成呼應
    var mel2 = [];
    for (var m = 0; m < steps; m++) {
      var bb = Math.floor(m / 16), ss = m % 16, src = null;
      if (sg.lead2 && (bb === 1 || bb === 3) && ss % 8 === 0) { for (var q = m; q >= m - 3 && q >= 0; q--) if (mel[q] !== null) { src = mel[q]; break; } if (src === null) src = sg.root + 12 + sc[(bb + ss) % 5]; src += 12; }
      mel2.push(src);
    }
    return { bpm: sg.bpm, steps: steps, mel: mel, mel2: mel2, bass: bass, drum: drum, lead: sg.lead, lead2: sg.lead2 || null, pad: sg.pad, padRoot: sg.root - 12, sc: sc, prog: prog };
  };
  // result：戰鬥結束後 'win'／'lose'，切換為勝利／戰敗曲
  A.sceneFor = function (screen, bossFight, result) {
    if (screen === 'battle') return result === 'win' ? 'victory' : result === 'lose' ? 'defeat' : bossFight ? 'boss' : 'battle';
    return A.SCENE_OF[screen] || 'city';
  };

  // ---------- 引擎 ----------
  var ctx = null, master = null, musicBus = null, sfxBus = null, cur = null, want = null, timer = null, noiseBuf = null;
  var nextT = 0, stepI = 0, pat = null;
  // 音訊裝置啟動失敗（無喇叭、系統限制）時 Promise 會被拒絕：吞掉，只是沒有聲音，不能讓遊戲進錯誤畫面
  function quiet(p) { if (p && p.then) p.then(null, function () { A.failed = true; }); }
  A.supported = !!(window.AudioContext || window.webkitAudioContext);
  function prefs() { var s = MJ.S && MJ.S.state; return s && s.settings ? s.settings : { bgm: true, sfx: true }; }
  A.bgmOn = function () { return prefs().bgm !== false; };
  A.sfxOn = function () { return prefs().sfx !== false; };
  A.muted = function () { return !A.bgmOn() && !A.sfxOn(); };
  function hz(semi) { return 440 * Math.pow(2, semi / 12); }
  function ensure() {
    if (ctx || !A.supported) return ctx;
    try {
      var C = window.AudioContext || window.webkitAudioContext; ctx = new C();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      var len = ctx.sampleRate * 0.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; A.supported = false; }
    return ctx;
  }
  A.unlock = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended' && ctx.resume) {
      try { var p = ctx.resume(); if (p && p.then) p.then(function () { if (!cur) A.refresh(); }, function () { A.failed = true; }); } catch (e) { A.failed = true; }
    }
    if (want && !cur) A.scene(want, true);
  };
  function env(g, t, a, peak, dec, sus) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + dec);
  }
  function tone(bus, type, f, t, dur, vol, opt) {
    opt = opt || {};
    var o = ctx.createOscillator(), g = ctx.createGain(), out = g;
    o.type = type;
    if (opt.from) { o.frequency.setValueAtTime(f * opt.from, t); o.frequency.linearRampToValueAtTime(f, t + 0.12); } else o.frequency.setValueAtTime(f, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * opt.slide), t + dur);
    if (opt.vib) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.08); l.stop(t + dur + 0.05); }
    if (opt.lp) { var fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = opt.lp; o.connect(fl); fl.connect(g); } else o.connect(g);
    env(g, t, opt.a || 0.005, vol, dur, opt.sus);
    out.connect(bus); o.start(t); o.stop(t + dur + 0.1);
  }
  function noise(bus, t, dur, vol, ftype, freq) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = ftype || 'bandpass'; f.frequency.value = freq || 1500;
    s.connect(f); f.connect(g); g.connect(bus); env(g, t, 0.002, vol, dur);
    s.start(t); s.stop(t + dur + 0.05);
  }
  function voice(kind, semi, t, dur, vol) {
    var f = hz(semi);
    if (kind === 'pluck') { tone(musicBus, 'triangle', f, t, Math.min(1.2, dur * 2.5), vol, { a: 0.003 }); tone(musicBus, 'sine', f * 2, t, 0.25, vol * 0.25); }
    else if (kind === 'reed') tone(musicBus, 'sawtooth', f, t, dur * 0.95, vol * 0.55, { a: 0.03, lp: 1800, vib: 1, sus: vol * 0.3 });
    else if (kind === 'bell') { tone(musicBus, 'sine', f, t, 1.4, vol * 0.8); tone(musicBus, 'sine', f * 2.76, t, 0.5, vol * 0.18); }
    // 二胡式：鋸齒波＋低通，慢起音，從略低的音滑上來並帶揉弦
    else if (kind === 'erhu') tone(musicBus, 'sawtooth', f, t, dur * 0.98, vol * 0.5, { a: 0.09, lp: 1400, vib: 1, from: 0.97, sus: vol * 0.35 });
    // 笛子式：正弦＋三角，帶揉音與氣聲
    else if (kind === 'dizi') { tone(musicBus, 'sine', f, t, dur * 0.95, vol * 0.7, { a: 0.05, vib: 1, sus: vol * 0.4 }); tone(musicBus, 'triangle', f * 2, t, dur * 0.6, vol * 0.08, { a: 0.05 }); noise(musicBus, t, 0.12, vol * 0.15, 'bandpass', Math.min(8000, f * 3)); }
  }
  function drum(kind, t) {
    if (kind === 'taiko') { tone(musicBus, 'sine', 110, t, 0.35, 0.9, { slide: 0.45 }); noise(musicBus, t, 0.08, 0.25, 'lowpass', 600); }
    else if (kind === 'snare') noise(musicBus, t, 0.14, 0.35, 'bandpass', 2200);
    else if (kind === 'tick') noise(musicBus, t, 0.03, 0.12, 'highpass', 6000);
  }
  function schedule() {
    if (!ctx || !pat) return;
    var spb = 60 / pat.bpm / 4;
    while (nextT < ctx.currentTime + 0.25) {
      var i = stepI % pat.steps;
      if (pat.mel[i] !== null) {
        var len = 1; while (len < 4 && pat.mel[(i + len) % pat.steps] === null) len++;
        voice(pat.lead, pat.mel[i], nextT, spb * len, 0.22);
      }
      if (pat.lead2 && pat.mel2[i] !== null) voice(pat.lead2, pat.mel2[i], nextT, spb * 7, 0.12);
      if (pat.bass[i] !== null) tone(musicBus, 'triangle', hz(pat.bass[i]), nextT, spb * 3, 0.3, { lp: 500 });
      if (pat.drum[i]) drum(pat.drum[i], nextT);
      if (pat.pad && i % 16 === 0) {
        var bar = Math.floor(i / 16), base = pat.padRoot + pat.sc[pat.prog[bar] % 5];
        U_each([0, 7, 12], function (iv) { tone(musicBus, 'sine', hz(base + iv), nextT, spb * 16, 0.05, { a: 0.6, sus: 0.03 }); });
      }
      nextT += spb; stepI++;
    }
  }
  function U_each(a, f) { for (var i = 0; i < a.length; i++) f(a[i], i); }
  function stopMusic() { if (timer) { clearInterval(timer); timer = null; } pat = null; cur = null; }
  A.current = function () { return cur; };
  A.wanted = function () { return want; };
  A.state = function () { return ctx ? ctx.state : 'none'; };
  A.scene = function (name, force) {
    want = name;
    if (!force && cur === name) return;
    if (!ctx || !A.bgmOn() || (document.hidden)) { stopMusic(); return; }
    stopMusic();
    if (ctx.state === 'suspended') return; // 等待使用者點擊解鎖
    cur = name; pat = A.pattern(name); stepI = 0; nextT = ctx.currentTime + 0.12;
    // 短暫淡入
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime); musicBus.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.8);
    schedule(); timer = setInterval(schedule, 90);
  };
  A.refresh = function () { var w = want; cur = null; if (w) A.scene(w, true); else stopMusic(); };
  // ---------- 音效 ----------
  A.played = []; // 供測試檢查（只保留最後 20 個）
  A.sfx = function (n) {
    A.played.push(n); if (A.played.length > 20) A.played.shift();
    if (!ctx || !A.sfxOn() || ctx.state !== 'running') return;
    var t = ctx.currentTime + 0.005;
    try {
      switch (n) {
        case 'click': tone(sfxBus, 'triangle', 880, t, 0.06, 0.18); break;
        case 'hit': noise(sfxBus, t, 0.09, 0.35, 'bandpass', 900); tone(sfxBus, 'square', 160, t, 0.08, 0.12, { slide: 0.5, lp: 900 }); break;
        case 'crit': noise(sfxBus, t, 0.2, 0.5, 'bandpass', 1400); tone(sfxBus, 'sawtooth', 300, t, 0.22, 0.25, { slide: 0.3, lp: 2000 }); tone(sfxBus, 'sine', 70, t, 0.3, 0.6, { slide: 0.5 }); break;
        case 'ult': tone(sfxBus, 'sawtooth', 220, t, 0.5, 0.18, { slide: 3, lp: 3000 }); tone(sfxBus, 'sine', 55, t, 0.6, 0.7, { slide: 0.6 }); noise(sfxBus, t + 0.05, 0.4, 0.2, 'highpass', 3000); break;
        case 'heal': U_each([0, 4, 7, 12], function (s, i) { tone(sfxBus, 'sine', hz(s + 3), t + i * 0.06, 0.3, 0.16); }); break;
        case 'dead': tone(sfxBus, 'triangle', 220, t, 0.45, 0.25, { slide: 0.4 }); break;
        case 'win': U_each([0, 4, 7, 12, 16], function (s, i) { tone(sfxBus, 'triangle', hz(s + 3), t + i * 0.11, 0.5, 0.25); }); drum('taiko', t); break;
        case 'lose': U_each([7, 3, 0, -5], function (s, i) { tone(sfxBus, 'triangle', hz(s - 2), t + i * 0.22, 0.6, 0.22); }); break;
        case 'coin': tone(sfxBus, 'square', 1320, t, 0.08, 0.1, { lp: 4000 }); tone(sfxBus, 'square', 1760, t + 0.07, 0.15, 0.1, { lp: 4000 }); break;
        case 'reveal': U_each([0, 7, 12, 19, 24], function (s, i) { tone(sfxBus, 'sine', hz(s), t + i * 0.07, 0.9, 0.16); }); noise(sfxBus, t, 0.6, 0.1, 'highpass', 5000); break;
        case 'fail': tone(sfxBus, 'square', 180, t, 0.18, 0.12, { lp: 800 }); break;
      }
    } catch (e) { }
  };
  A.toggle = function (which) {
    var st = prefs();
    if (which === 'bgm') st.bgm = !A.bgmOn();
    else if (which === 'sfx') st.sfx = !A.sfxOn();
    else { var m = !A.muted(); st.bgm = !m ? true : false; st.sfx = st.bgm; }
    A.refresh();
    return st;
  };
  // 頁面隱藏時暫停
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      try { if (document.hidden) { stopMusic(); quiet(ctx.suspend && ctx.suspend()); } else { quiet(ctx.resume && ctx.resume()); A.refresh(); } } catch (e) { }
    }, false);
  }
})();
