/* 向量美術（程式繪製）。經原公司同意（依倉庫擁有者說明），可參考或直接使用原作的美術、音樂等素材，目標是盡量貼近原作。使用原作素材時需在 docs/美術素材來源.md 記錄來源。若無原始檔案，可依 reference/ 的截圖與影片重繪貼近原版的素材。 */
MJ.Art = (function () {
  var A = {};
  var uidc = 0;
  function uid(p) { uidc++; return p + uidc; }
  function svg(vb, body, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' + body + '</svg>';
  }
  function shade(hex, amt) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    function f(c) { c = Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt); return (c < 16 ? '0' : '') + Math.max(0, Math.min(255, c)).toString(16); }
    return '#' + f(r) + f(g) + f(b);
  }
  A.shade = shade;

  // ---------- 頭部（100x100 座標，臉中心 50,54） ----------
  function head(L, opt) {
    opt = opt || {};
    var s = '', skin = L.skin, hair = L.hair, dk = shade(hair, -0.35), tr = L.trim, cl = L.cloth;
    var f = L.g === 'f';
    // 後髮
    if (L.hs === 'long' || L.hs === 'veil') s += '<path d="M24 50 Q22 92 34 98 L66 98 Q78 92 76 50 Q74 22 50 22 Q26 22 24 50Z" fill="' + hair + '"/>';
    if (L.hs === 'ponytail') s += '<path d="M66 34 Q90 40 84 80 Q80 70 72 62Z" fill="' + hair + '"/>';
    if (L.hs === 'twin') s += '<path d="M24 46 Q8 60 14 84 Q20 72 28 64Z M76 46 Q92 60 86 84 Q80 72 72 64Z" fill="' + hair + '"/>';
    if (L.hs === 'bun' && f) s += '<circle cx="50" cy="20" r="11" fill="' + hair + '"/><circle cx="50" cy="20" r="11" fill="none" stroke="' + dk + '" stroke-width="1.5"/><rect x="40" y="18" width="20" height="3" rx="1.5" fill="' + tr + '"/>';
    // 耳
    s += '<ellipse cx="27" cy="56" rx="4" ry="6" fill="' + shade(skin, -0.08) + '"/><ellipse cx="73" cy="56" rx="4" ry="6" fill="' + shade(skin, -0.08) + '"/>';
    // 臉
    s += '<path d="M28 48 Q28 80 50 84 Q72 80 72 48 Q72 28 50 28 Q28 28 28 48Z" fill="' + skin + '" stroke="' + shade(skin, -0.3) + '" stroke-width="1"/>';
    // 眼
    var ey = 57, er = f ? 5.2 : 4.4;
    var eyeCol = opt.enemy ? '#5a1010' : '#1d1410';
    s += '<ellipse cx="40" cy="' + ey + '" rx="' + (er * 0.85) + '" ry="' + er + '" fill="' + eyeCol + '"/><ellipse cx="60" cy="' + ey + '" rx="' + (er * 0.85) + '" ry="' + er + '" fill="' + eyeCol + '"/>';
    s += '<circle cx="41.5" cy="' + (ey - 2) + '" r="1.6" fill="#fff"/><circle cx="61.5" cy="' + (ey - 2) + '" r="1.6" fill="#fff"/>';
    if (f) s += '<path d="M33 52 L36 51 M67 52 L64 51" stroke="#1d1410" stroke-width="1.6"/><ellipse cx="34" cy="66" rx="4" ry="2" fill="#ff8a80" opacity=".45"/><ellipse cx="66" cy="66" rx="4" ry="2" fill="#ff8a80" opacity=".45"/>';
    // 眉
    var bw = f ? 1.4 : 2.6;
    var angry = (L.beard !== 'none' && !f) || opt.enemy;
    s += angry ? '<path d="M33 47 L46 50 M67 47 L54 50" stroke="' + dk + '" stroke-width="' + bw + '" stroke-linecap="round"/>'
      : '<path d="M34 49 Q40 46 46 49 M54 49 Q60 46 66 49" stroke="' + dk + '" stroke-width="' + bw + '" fill="none" stroke-linecap="round"/>';
    // 嘴
    s += f ? '<path d="M46 72 Q50 75 54 72" stroke="#b5485a" stroke-width="1.6" fill="none"/>' : '<path d="M45 72 Q50 74 55 72" stroke="#7a3b2a" stroke-width="1.6" fill="none"/>';
    // 鬍
    if (L.beard === 'short') s += '<path d="M34 68 Q50 90 66 68 Q62 80 50 82 Q38 80 34 68Z" fill="' + dk + '" opacity=".85"/>';
    if (L.beard === 'long') s += '<path d="M33 66 Q50 76 67 66 Q66 92 50 104 Q34 92 33 66Z" fill="' + hair + '"/><path d="M44 72 Q50 70 56 72" stroke="' + skin + '" stroke-width="2" fill="none"/>';
    if (L.beard === 'goatee') s += '<path d="M44 76 Q50 92 56 76Z M42 70 Q50 68 58 70" fill="' + hair + '" stroke="' + hair + '" stroke-width="2"/>';
    // 前髮 / 頭飾
    var hs = L.hs;
    if (hs === 'panda') {
      s += '<circle cx="30" cy="32" r="9" fill="#1a1a1a"/><circle cx="70" cy="32" r="9" fill="#1a1a1a"/>';
      s += '<ellipse cx="40" cy="57" rx="8" ry="9" fill="#1a1a1a" transform="rotate(-20 40 57)"/><ellipse cx="60" cy="57" rx="8" ry="9" fill="#1a1a1a" transform="rotate(20 60 57)"/>';
      s += '<circle cx="41" cy="56" r="2.6" fill="#fff"/><circle cx="59" cy="56" r="2.6" fill="#fff"/><ellipse cx="50" cy="68" rx="4" ry="3" fill="#1a1a1a"/>';
    } else if (hs === 'bald') {
      s += '<path d="M28 50 Q30 30 50 28 Q70 30 72 50" fill="none" stroke="' + shade(skin, -0.2) + '" stroke-width="1"/>';
      s += '<path d="M27 52 Q26 42 30 40 L32 54Z M73 52 Q74 42 70 40 L68 54Z" fill="' + hair + '"/>';
    } else if (hs === 'helmet') {
      s += '<path d="M24 50 Q24 18 50 16 Q76 18 76 50 L70 50 Q70 36 50 36 Q30 36 30 50Z" fill="#9aa3ad" stroke="#4b5560" stroke-width="1.5"/>';
      s += '<path d="M26 46 L74 46 L72 52 L28 52Z" fill="' + tr + '" stroke="#5a4210" stroke-width="1"/>';
      s += '<path d="M50 16 Q44 2 58 -2 Q52 8 56 16Z" fill="' + shade(cl, 0.1) + '"/><circle cx="50" cy="40" r="4" fill="' + tr + '" stroke="#5a4210"/>';
    } else if (hs === 'crown') {
      s += '<path d="M28 50 Q26 26 50 24 Q74 26 72 50 Q66 38 56 36 Q50 44 40 38 Q32 42 28 50Z" fill="' + hair + '"/>';
      s += '<path d="M36 28 L40 16 L45 24 L50 12 L55 24 L60 16 L64 28Z" fill="#ffd54f" stroke="#a06a00" stroke-width="1"/><circle cx="50" cy="20" r="2.4" fill="#e53935"/>';
    } else if (hs === 'headband') {
      s += '<path d="M27 50 Q24 24 50 22 Q76 24 73 50 Q68 36 50 34 Q32 36 27 50Z" fill="' + hair + '"/>';
      s += '<path d="M26 40 Q50 32 74 40 L74 47 Q50 39 26 47Z" fill="#f2c94c" stroke="#9a7a10" stroke-width="1"/><path d="M73 42 L86 48 L80 54 L72 46Z" fill="#f2c94c"/>';
    } else if (hs === 'taoist') {
      s += '<path d="M27 50 Q24 26 50 24 Q76 26 73 50 Q66 38 50 36 Q34 38 27 50Z" fill="' + hair + '"/>';
      s += '<ellipse cx="50" cy="20" rx="9" ry="7" fill="' + hair + '"/><rect x="41" y="12" width="18" height="8" rx="2" fill="' + tr + '" stroke="' + shade(tr, -0.4) + '"/><path d="M38 17 L62 17" stroke="#d6b04a" stroke-width="2"/>';
    } else if (hs === 'guan') {
      s += '<path d="M27 50 Q24 26 50 24 Q76 26 73 50 Q66 38 50 36 Q34 38 27 50Z" fill="' + hair + '"/>';
      s += '<path d="M38 26 L40 8 L60 8 L62 26Z" fill="#222" stroke="' + tr + '" stroke-width="2"/><path d="M30 12 L70 12" stroke="' + tr + '" stroke-width="3"/>';
    } else if (hs === 'cap') {
      s += '<path d="M24 46 Q24 20 50 20 Q76 20 76 46Z" fill="#3a2a20"/><path d="M22 44 L78 44 L76 50 L24 50Z" fill="' + tr + '"/><circle cx="50" cy="18" r="4" fill="#e53935"/>';
    } else if (hs === 'hood') {
      s += '<path d="M20 60 Q18 18 50 16 Q82 18 80 60 L74 58 Q74 34 50 32 Q26 34 26 58Z" fill="' + cl + '" stroke="' + shade(cl, -0.4) + '" stroke-width="1.5"/>';
    } else if (hs === 'veil') {
      s += '<path d="M28 48 Q26 24 50 22 Q74 24 72 48 Q64 34 50 34 Q36 34 28 48Z" fill="' + hair + '"/>';
      s += '<path d="M30 30 Q50 18 70 30 L70 34 Q50 26 30 34Z" fill="' + tr + '"/><path d="M30 62 Q50 72 70 62 L70 78 Q50 88 30 78Z" fill="#ffffff" opacity=".55"/>';
    } else {
      // topknot / long / bun / twin / ponytail 前髮
      s += '<path d="M27 52 Q22 22 50 22 Q78 22 73 52 Q70 40 62 36 Q58 44 48 40 Q40 46 32 40 Q28 46 27 52Z" fill="' + hair + '"/>';
      s += '<path d="M40 26 Q50 22 60 26" stroke="' + shade(hair, 0.25) + '" stroke-width="2" fill="none"/>';
      if (hs === 'topknot') s += '<ellipse cx="50" cy="18" rx="8" ry="7" fill="' + hair + '"/><rect x="44" y="16" width="12" height="3" fill="' + tr + '"/><path d="M50 10 L50 2" stroke="' + tr + '" stroke-width="2"/>';
      if (f && (hs === 'long' || hs === 'twin')) s += '<circle cx="66" cy="32" r="3.5" fill="' + tr + '"/><circle cx="70" cy="36" r="2.2" fill="' + shade(tr, 0.3) + '"/>';
    }
    return s;
  }

  // ---------- 頭像 ----------
  A.portraitSvg = function (L, q, opt) {
    opt = opt || {};
    var qc = ['#5a5a5a', '#c8c8c8', '#4caf50', '#2f8fff', '#b44cff'][q || 0];
    var g = uid('pg');
    var bg = '<defs><radialGradient id="' + g + '" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="' + shade(qc, 0.55) + '"/><stop offset="1" stop-color="' + shade(qc, -0.35) + '"/></radialGradient></defs>';
    bg += '<rect x="0" y="0" width="100" height="100" fill="url(#' + g + ')"/>';
    bg += '<path d="M0 82 Q20 70 40 80 T80 76 T100 80 L100 100 L0 100Z" fill="#ffffff" opacity=".18"/>';
    var body = '<path d="M14 100 Q16 82 36 80 L64 80 Q84 82 86 100Z" fill="' + L.cloth + '" stroke="' + shade(L.cloth, -0.45) + '" stroke-width="1.2"/>';
    body += '<path d="M40 80 L50 96 L60 80" fill="none" stroke="' + L.trim + '" stroke-width="3"/>';
    body += '<rect x="44" y="74" width="12" height="9" fill="' + shade(L.skin, -0.1) + '"/>';
    return svg('0 0 100 100', bg + body + '<g transform="translate(0,-4)">' + head(L, opt) + '</g>', 'art portrait');
  };

  // ---------- 武器 ----------
  function weapon(type, tr) {
    switch (type) {
      case 'sword': return '<g><rect x="-2" y="-46" width="4" height="44" fill="#dfe6ee" stroke="#7a8794"/><path d="M-2 -46 L0 -52 L2 -46Z" fill="#dfe6ee"/><rect x="-7" y="-3" width="14" height="3" fill="' + tr + '"/><rect x="-1.5" y="0" width="3" height="9" fill="#5a3a1a"/></g>';
      case 'blade': return '<g><path d="M-2 0 L-2 -44 Q10 -50 8 -36 L4 0Z" fill="#dfe6ee" stroke="#6a7784"/><rect x="-6" y="-2" width="12" height="3" fill="' + tr + '"/><rect x="-1.5" y="0" width="3" height="16" fill="#5a3a1a"/></g>';
      case 'spear': return '<g><rect x="-1.5" y="-60" width="3" height="78" fill="#7a4a1a"/><path d="M0 -74 L5 -60 L-5 -60Z" fill="#e8eef4" stroke="#6a7784"/><path d="M-4 -60 L4 -60 L0 -54Z" fill="#d32f2f"/></g>';
      case 'halberd': return '<g><rect x="-1.5" y="-60" width="3" height="80" fill="#5d2f12"/><path d="M0 -76 L4 -60 L-4 -60Z" fill="#eef"/><path d="M2 -62 Q16 -66 14 -50 Q8 -56 2 -54Z" fill="#eef" stroke="#6a7784"/><path d="M-2 -62 Q-16 -66 -14 -50 Q-8 -56 -2 -54Z" fill="#eef" stroke="#6a7784"/><path d="M-4 -56 L4 -56 L0 -50Z" fill="' + tr + '"/></g>';
      case 'staff': return '<g><rect x="-1.8" y="-52" width="3.6" height="70" fill="#8d5a2b"/><circle cx="0" cy="-56" r="6" fill="' + tr + '" stroke="#5a3a10"/><circle cx="0" cy="-56" r="2.5" fill="#fff" opacity=".7"/></g>';
      case 'fan': return '<g><path d="M0 0 L-16 -26 Q0 -36 16 -26Z" fill="#fff8e1" stroke="' + tr + '" stroke-width="1.5"/><path d="M0 0 L-8 -30 M0 0 L0 -32 M0 0 L8 -30" stroke="' + tr + '" stroke-width="1"/></g>';
      case 'whip': return '<g><rect x="-1.5" y="-8" width="3" height="12" fill="#5a3a1a"/><path d="M0 -8 Q-20 -30 6 -40 Q24 -46 10 -60" stroke="' + tr + '" stroke-width="2.5" fill="none"/></g>';
      case 'bow': return '<g><path d="M-4 -40 Q16 -18 -4 6" stroke="#8d5a2b" stroke-width="3.5" fill="none"/><path d="M-4 -40 L-4 6" stroke="#eee" stroke-width="1"/></g>';
      case 'dagger': return '<g><path d="M-2 0 L-2 -20 L0 -26 L2 -20 L2 0Z" fill="#dfe6ee" stroke="#6a7784"/><rect x="-5" y="-1" width="10" height="2.5" fill="' + tr + '"/></g>';
      case 'qin': return '<g transform="rotate(60)"><rect x="-6" y="-34" width="12" height="40" rx="5" fill="#6d4c41" stroke="#3e2723"/><path d="M-3 -32 L-3 4 M0 -32 L0 4 M3 -32 L3 4" stroke="#ffe0b2" stroke-width=".6"/></g>';
      case 'needle': return '<g><path d="M0 -24 L0 0" stroke="#fff" stroke-width="1"/><path d="M0 -24 Q10 -10 0 0" stroke="#e91e63" stroke-width="1" fill="none"/></g>';
      default: return '<g><circle cx="0" cy="-4" r="5" fill="' + tr + '" opacity=".5"/></g>';
    }
  }

  // ---------- 戰鬥全身 Q 版角色（100x140，面向右） ----------
  A.figureSvg = function (L, opt) {
    opt = opt || {};
    var cl = L.cloth, dk = shade(cl, -0.4), tr = L.trim, f = L.g === 'f';
    var s = '<ellipse cx="50" cy="134" rx="26" ry="5" fill="#000" opacity=".25"/>';
    // 腿
    s += '<rect x="38" y="112" width="9" height="18" rx="3" fill="' + shade(cl, -0.5) + '"/><rect x="53" y="112" width="9" height="18" rx="3" fill="' + shade(cl, -0.5) + '"/>';
    s += '<path d="M36 128 L48 128 L48 133 L34 133Z M52 128 L64 128 L66 133 L52 133Z" fill="#2b1d14"/>';
    // 披風（王/英雄）
    if (opt.cape) s += '<path d="M32 76 Q20 110 26 124 L74 124 Q80 110 68 76Z" fill="' + shade(tr, -0.3) + '"/>';
    // 身體
    s += f ? '<path d="M36 74 Q30 100 28 122 L72 122 Q70 100 64 74Z" fill="' + cl + '" stroke="' + dk + '" stroke-width="1.2"/>'
      : '<path d="M34 74 Q30 96 32 118 L68 118 Q70 96 66 74Z" fill="' + cl + '" stroke="' + dk + '" stroke-width="1.2"/>';
    s += '<path d="M42 74 L50 92 L58 74" fill="none" stroke="' + tr + '" stroke-width="3"/>';
    s += '<rect x="33" y="96" width="34" height="6" rx="2" fill="' + tr + '" stroke="' + shade(tr, -0.4) + '"/>';
    if (L.hs === 'helmet') s += '<path d="M30 74 Q22 78 24 88 L36 84Z M70 74 Q78 78 76 88 L64 84Z" fill="#9aa3ad" stroke="#4b5560"/>';
    // 後手
    s += '<path d="M36 78 Q26 90 30 100" stroke="' + cl + '" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="30" cy="101" r="4.5" fill="' + L.skin + '"/>';
    // 頭
    s += '<g transform="translate(14,-6) scale(0.72)">' + head(L, opt) + '</g>';
    // 前手 + 武器
    s += '<path d="M64 78 Q76 88 74 98" stroke="' + cl + '" stroke-width="8" fill="none" stroke-linecap="round"/>';
    s += '<g transform="translate(76,100) rotate(' + (L.wp === 'bow' ? 0 : 20) + ')">' + weapon(L.wp, tr) + '</g>';
    s += '<circle cx="75" cy="99" r="4.5" fill="' + L.skin + '"/>';
    return svg('0 -20 100 160', s, 'art figure');
  };

  // ---------- 圖示 ----------
  // 原創 AI 生成圖示（i_*）；gem/soul 依顏色挑預先染色的版本；無圖時退回 SVG
  var GEMC = ['e53935', '43a047', '8d6e63', '1e88e5', '8e24aa', 'fb8c00'], SOULC = ['e0e0e0', '66bb6a', '42a5f5', 'ba68c8', 'ffb300'];
  function nearest(hex, list) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0;
    var v = parseInt(m[1], 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255, bi = 0, bd = 1e9;
    for (var i = 0; i < list.length; i++) {
      var w = parseInt(list[i], 16), d = Math.pow(r - (w >> 16), 2) + Math.pow(g - ((w >> 8) & 255), 2) + Math.pow(b - (w & 255), 2);
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  }
  A.iconKey = function (name, q) {
    if (name === 'gem') return 'i_gem_' + GEMC[nearest(typeof q === 'string' ? q : '', GEMC)];
    if (name === 'soul') return 'i_soul_q' + (typeof q === 'string' ? nearest(q, SOULC) : Math.max(0, Math.min(4, q || 0)));
    return 'i_' + name;
  };
  A.icon = function (name, q) {
    var ik = A.iconKey(name, q);
    if (A.has(ik)) return '<span class="art icon iimg" data-ic="' + name + '"><img src="' + A.url(ik) + '" alt="" draggable="false"></span>';
    return A.iconSvg(name, q);
  };
  A.iconSvg = function (name, q) {
    var qc = typeof q === 'string' ? q : ['#e0e0e0', '#66bb6a', '#42a5f5', '#ba68c8', '#ffb300'][q || 0];
    var s = '';
    switch (name) {
      case 'silver': s = '<path d="M10 40 Q8 26 22 28 Q32 18 42 28 Q56 26 54 40 Q32 52 10 40Z" fill="#dfe6ee" stroke="#6b7785" stroke-width="2"/><ellipse cx="32" cy="30" rx="9" ry="5" fill="#fff"/>'; break;
      case 'gold': s = '<path d="M8 38 Q6 24 20 26 Q32 14 44 26 Q58 24 56 38 Q32 52 8 38Z" fill="#ffd54f" stroke="#a06a00" stroke-width="2"/><ellipse cx="32" cy="28" rx="9" ry="6" fill="#fff59d"/>'; break;
      case 'energy': s = '<path d="M36 4 L14 36 L30 36 L24 60 L50 24 L34 24 L42 4Z" fill="#ffeb3b" stroke="#a06a00" stroke-width="2" stroke-linejoin="round"/>'; break;
      case 'soul': s = '<path d="M32 6 Q50 24 46 42 Q42 58 32 58 Q22 58 18 42 Q14 24 32 6Z" fill="' + qc + '" stroke="#fff" stroke-width="2" opacity=".9"/><circle cx="28" cy="40" r="5" fill="#fff" opacity=".8"/>'; break;
      case 'sword': s = '<path d="M46 8 L54 10 L56 18 L24 50 L14 40Z" fill="#e8eef4" stroke="#56636f" stroke-width="2"/><path d="M12 36 L28 52 L24 56 L8 40Z" fill="#c9a24a" stroke="#6a4a10"/><path d="M14 50 L6 58" stroke="#5a3a1a" stroke-width="5" stroke-linecap="round"/>'; break;
      case 'staff': s = '<path d="M14 56 L46 14" stroke="#8d5a2b" stroke-width="5" stroke-linecap="round"/><circle cx="48" cy="12" r="8" fill="' + qc + '" stroke="#5a3a10" stroke-width="2"/>'; break;
      case 'armor': s = '<path d="M14 14 L24 8 L32 14 L40 8 L50 14 L54 30 L46 30 L46 56 L18 56 L18 30 L10 30Z" fill="#9aa3ad" stroke="#3e4a56" stroke-width="2"/><path d="M18 30 L46 30 M18 40 L46 40 M18 48 L46 48" stroke="#5f6b77" stroke-width="1.5"/>'; break;
      case 'cape': s = '<path d="M20 8 L44 8 L52 56 Q32 50 12 56Z" fill="#c62828" stroke="#5d1010" stroke-width="2"/><path d="M20 8 Q32 18 44 8" fill="none" stroke="#ffd54f" stroke-width="3"/>'; break;
      case 'belt': s = '<rect x="6" y="24" width="52" height="14" rx="3" fill="#8d5a2b" stroke="#3e2310" stroke-width="2"/><rect x="24" y="20" width="16" height="22" rx="3" fill="#ffd54f" stroke="#a06a00" stroke-width="2"/>'; break;
      case 'potion': s = '<path d="M26 6 L38 6 L38 18 Q54 26 50 44 Q46 58 32 58 Q18 58 14 44 Q10 26 26 18Z" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/><path d="M15 38 Q32 46 49 38 Q48 56 32 56 Q16 56 15 38Z" fill="#43a047"/>'; break;
      case 'pill': s = '<circle cx="32" cy="34" r="20" fill="#d84315" stroke="#5d1a05" stroke-width="2"/><circle cx="26" cy="26" r="6" fill="#ffab91"/>'; break;
      case 'token': s = '<rect x="14" y="6" width="36" height="52" rx="4" fill="#ffca28" stroke="#8d5a00" stroke-width="2"/><text x="32" y="40" font-size="22" text-anchor="middle" fill="#6d3d00" font-weight="bold">令</text>'; break;
      case 'bag': s = '<path d="M20 16 L44 16 L40 24 Q58 34 52 50 Q46 58 32 58 Q18 58 12 50 Q6 34 24 24Z" fill="#a1887f" stroke="#4e342e" stroke-width="2"/><text x="32" y="48" font-size="16" text-anchor="middle" fill="#fff" font-weight="bold">銀</text>'; break;
      case 'mail': s = '<rect x="6" y="14" width="52" height="36" rx="3" fill="#fff8e1" stroke="#8d6e63" stroke-width="2"/><path d="M6 16 L32 36 L58 16" fill="none" stroke="#8d6e63" stroke-width="2"/>'; break;
      case 'gift': s = '<rect x="10" y="26" width="44" height="30" fill="#e53935" stroke="#7f1010" stroke-width="2"/><rect x="6" y="18" width="52" height="10" fill="#ef5350" stroke="#7f1010" stroke-width="2"/><rect x="28" y="18" width="8" height="38" fill="#ffd54f"/><path d="M32 18 Q20 2 14 14 Q20 20 32 18 Q44 20 50 14 Q44 2 32 18Z" fill="#ffd54f" stroke="#a06a00"/>'; break;
      case 'scroll': s = '<rect x="12" y="10" width="40" height="44" fill="#f3e0b5" stroke="#8d6e63" stroke-width="2"/><rect x="8" y="6" width="48" height="6" rx="3" fill="#8d5a2b"/><rect x="8" y="52" width="48" height="6" rx="3" fill="#8d5a2b"/><path d="M18 22 L46 22 M18 30 L46 30 M18 38 L40 38" stroke="#8d6e63" stroke-width="2"/>'; break;
      case 'flag': s = '<path d="M16 6 L16 58" stroke="#5a3a1a" stroke-width="4"/><path d="M18 8 L52 14 L40 22 L52 32 L18 30Z" fill="#c62828" stroke="#5d1010" stroke-width="2"/>'; break;
      case 'formation': s = '<circle cx="32" cy="32" r="24" fill="#3e6b5a" stroke="#ffd54f" stroke-width="3"/><circle cx="32" cy="32" r="14" fill="none" stroke="#b2ebf2" stroke-width="2"/><path d="M32 8 L32 56 M8 32 L56 32" stroke="#b2ebf2" stroke-width="1.5"/>'; break;
      case 'gear': s = '<circle cx="32" cy="32" r="18" fill="#90a4ae" stroke="#37474f" stroke-width="3" stroke-dasharray="7 4"/><circle cx="32" cy="32" r="8" fill="#eceff1" stroke="#37474f" stroke-width="2"/>'; break;
      case 'book': s = '<path d="M8 12 L30 16 L30 56 L8 52Z" fill="#5c6bc0" stroke="#1a237e" stroke-width="2"/><path d="M56 12 L34 16 L34 56 L56 52Z" fill="#7986cb" stroke="#1a237e" stroke-width="2"/>'; break;
      case 'shop': s = '<path d="M8 38 Q6 24 20 26 Q32 14 44 26 Q58 24 56 38 Q32 52 8 38Z" fill="#ffd54f" stroke="#a06a00" stroke-width="2"/><rect x="14" y="40" width="36" height="16" fill="#c62828" stroke="#5d1010" stroke-width="2"/>'; break;
      case 'chest': s = '<rect x="8" y="24" width="48" height="30" rx="3" fill="#8d5a2b" stroke="#3e2310" stroke-width="2"/><path d="M8 26 Q32 6 56 26Z" fill="#a1683a" stroke="#3e2310" stroke-width="2"/><rect x="28" y="30" width="8" height="10" fill="#ffd54f"/>'; break;
      case 'quest': s = '<rect x="12" y="8" width="40" height="50" rx="3" fill="#fff3e0" stroke="#8d6e63" stroke-width="2"/><path d="M20 22 L28 30 L44 14" stroke="#2e7d32" stroke-width="4" fill="none"/><path d="M20 40 L44 40 M20 48 L38 48" stroke="#8d6e63" stroke-width="2"/>'; break;
      case 'helm': s = '<path d="M12 40 Q12 12 32 10 Q52 12 52 40 L46 40 L46 50 L18 50 L18 40Z" fill="#9aa3ad" stroke="#3e4a56" stroke-width="2"/><path d="M32 4 L36 14 L28 14Z" fill="#c62828"/><path d="M18 34 L46 34" stroke="#ffd54f" stroke-width="3"/>'; break;
      case 'ring': s = '<circle cx="32" cy="38" r="16" fill="none" stroke="#ffca28" stroke-width="6"/><path d="M24 18 L32 8 L40 18 L32 26Z" fill="' + qc + '" stroke="#fff" stroke-width="2"/>'; break;
      case 'jade': s = '<path d="M32 4 L32 18" stroke="#c62828" stroke-width="3"/><circle cx="32" cy="20" r="3" fill="#ffd54f"/><path d="M32 24 Q52 30 48 44 Q44 58 32 58 Q20 58 16 44 Q12 30 32 24Z" fill="#7ed6a8" stroke="#1b5e40" stroke-width="2"/><circle cx="32" cy="42" r="6" fill="none" stroke="' + qc + '" stroke-width="3"/>'; break;
      case 'glove': s = '<path d="M16 58 L16 30 Q16 22 22 22 L22 12 Q22 8 26 8 Q30 8 30 12 L30 20 L34 20 L34 10 Q34 6 38 6 Q42 6 42 10 L42 22 L46 22 Q50 22 50 26 L50 40 Q50 50 44 58Z" fill="#8d6e63" stroke="#3e2723" stroke-width="2"/><rect x="14" y="46" width="34" height="8" fill="' + qc + '" stroke="#3e2723" stroke-width="2"/>'; break;
      case 'pill2': s = '<circle cx="22" cy="36" r="12" fill="#8e24aa" stroke="#3e0a4a" stroke-width="2"/><circle cx="42" cy="30" r="12" fill="#ab47bc" stroke="#3e0a4a" stroke-width="2"/><circle cx="38" cy="25" r="4" fill="#e1bee7"/>'; break;
      case 'stone': s = '<path d="M14 40 L22 16 L44 12 L54 34 L40 54 L20 52Z" fill="#80deea" stroke="#006064" stroke-width="2"/><path d="M22 16 L32 34 L44 12 M32 34 L40 54 M32 34 L14 40" stroke="#e0f7fa" stroke-width="1.5" fill="none"/>'; break;
      case 'token2': s = '<rect x="14" y="6" width="36" height="52" rx="4" fill="#ffecb3" stroke="#8d5a00" stroke-width="2"/><text x="32" y="40" font-size="22" text-anchor="middle" fill="#b71c1c" font-weight="bold">符</text>'; break;
      case 'seed': s = '<ellipse cx="32" cy="44" rx="16" ry="10" fill="#8d6e63" stroke="#3e2723" stroke-width="2"/><path d="M32 40 Q30 22 18 16 Q30 14 34 30 Q38 12 50 14 Q38 22 34 40Z" fill="#66bb6a" stroke="#1b5e20" stroke-width="1.5"/>'; break;
      case 'gem': s = '<path d="M16 24 L24 12 L40 12 L48 24 L32 54Z" fill="' + qc + '" stroke="#fff" stroke-width="2"/><path d="M16 24 L48 24 M24 12 L32 24 L40 12 M32 24 L32 54" stroke="#fff" stroke-width="1" opacity=".7" fill="none"/>'; break;
      case 'scroll2': s = '<rect x="12" y="10" width="40" height="44" fill="#ffe0b2" stroke="#6d4c41" stroke-width="2"/><rect x="8" y="6" width="48" height="6" rx="3" fill="#4e342e"/><rect x="8" y="52" width="48" height="6" rx="3" fill="#4e342e"/><text x="32" y="40" font-size="20" text-anchor="middle" fill="#b71c1c" font-weight="bold">秘</text>'; break;
      case 'star': s = '<path d="M32 6 L39 24 L58 24 L43 36 L49 56 L32 44 L15 56 L21 36 L6 24 L25 24Z" fill="#ffd54f" stroke="#a06a00" stroke-width="2"/>'; break;
      default: s = '<circle cx="32" cy="32" r="20" fill="#bcaaa4"/>';
    }
    return svg('0 0 64 64', s, 'art icon');
  };

  // ---------- 浮空島 + 建築 ----------
  function island(w, grass, waterfall) {
    var s = '<path d="M10 120 Q100 100 190 120 Q176 150 150 162 Q130 196 104 200 Q80 190 60 166 Q24 150 10 120Z" fill="#8a6a4a" stroke="#4e3a26" stroke-width="2"/>';
    s += '<path d="M40 140 Q70 150 90 172 M120 140 Q130 160 116 184 M150 132 Q160 146 148 156" stroke="#5e4630" stroke-width="2" fill="none"/>';
    s += '<path d="M60 166 Q80 190 104 200 Q96 176 84 168Z" fill="#6d5236"/>';
    s += '<ellipse cx="100" cy="118" rx="92" ry="20" fill="' + grass + '" stroke="#3f6b2a" stroke-width="2"/>';
    s += '<ellipse cx="100" cy="114" rx="80" ry="13" fill="' + shade(grass, 0.2) + '"/>';
    if (waterfall) s += '<rect x="150" y="124" width="10" height="70" fill="#b3e5fc" opacity=".85"/><rect x="153" y="124" width="3" height="70" fill="#fff" opacity=".8"/>';
    return s;
  }
  function roof(x, y, w, h, col, curl) {
    var d = shade(col, -0.35);
    return '<path d="M' + (x - curl) + ' ' + (y + h - 6) + ' Q' + x + ' ' + (y + h) + ' ' + (x + 6) + ' ' + (y + h) + ' L' + (x + w - 6) + ' ' + (y + h) + ' Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w + curl) + ' ' + (y + h - 6) + ' L' + (x + w - w * 0.2) + ' ' + y + ' L' + (x + w * 0.2) + ' ' + y + 'Z" fill="' + col + '" stroke="' + d + '" stroke-width="2"/>' +
      '<path d="M' + (x + w * 0.2) + ' ' + y + ' L' + (x + w - w * 0.2) + ' ' + y + '" stroke="#ffd54f" stroke-width="3"/>';
  }
  A.buildingSvg = function (kind) {
    var s = '', g = '#7cb342';
    var g1 = uid('bg');
    switch (kind) {
      case 'shenwu': // 神武殿：紫頂宮殿
        s += island(200, g, true);
        s += '<rect x="44" y="70" width="112" height="44" fill="#f3e0b5" stroke="#6d4c41" stroke-width="2"/>';
        s += '<rect x="52" y="78" width="10" height="36" fill="#b71c1c"/><rect x="138" y="78" width="10" height="36" fill="#b71c1c"/><rect x="86" y="84" width="28" height="30" fill="#4e342e"/>';
        s += roof(30, 46, 140, 28, '#7b4bc4', 12) + roof(54, 22, 92, 26, '#8e5cd9', 10);
        s += '<path d="M100 6 L106 22 L94 22Z" fill="#ffd54f"/>';
        s += '<rect x="78" y="56" width="44" height="12" fill="#2b1d14" stroke="#ffd54f"/>';
        break;
      case 'juxian': // 聚賢莊：紅頂樓閣
        s += island(200, g, false);
        s += '<rect x="40" y="76" width="120" height="38" fill="#f6e7c8" stroke="#6d4c41" stroke-width="2"/>';
        s += '<rect x="56" y="84" width="16" height="30" fill="#8d2b1f"/><rect x="128" y="84" width="16" height="30" fill="#8d2b1f"/><rect x="88" y="86" width="24" height="28" fill="#5d4037"/>';
        s += roof(26, 52, 148, 26, '#c62828', 14) + '<rect x="70" y="36" width="60" height="18" fill="#f6e7c8" stroke="#6d4c41"/>' + roof(56, 14, 88, 24, '#d84315', 12);
        s += '<circle cx="40" cy="96" r="7" fill="#ff7043" stroke="#7f1010"/><circle cx="160" cy="96" r="7" fill="#ff7043" stroke="#7f1010"/>';
        break;
      case 'shenbing': // 神兵坊：鐵匠舖
        s += island(200, '#8bc34a', false);
        s += '<rect x="50" y="68" width="100" height="46" fill="#d7ccc8" stroke="#4e342e" stroke-width="2"/>';
        s += roof(36, 40, 128, 30, '#1e88e5', 12);
        s += '<rect x="132" y="18" width="14" height="34" fill="#6d4c41" stroke="#3e2723"/><circle cx="140" cy="12" r="7" fill="#9e9e9e" opacity=".7"/><circle cx="148" cy="2" r="9" fill="#bdbdbd" opacity=".55"/>';
        s += '<path d="M70 100 L96 100 L92 108 L74 108Z" fill="#455a64"/><rect x="80" y="108" width="6" height="8" fill="#455a64"/><rect x="108" y="80" width="30" height="30" fill="#ff7043" opacity=".85"/><rect x="112" y="86" width="22" height="18" fill="#ffcc80"/>';
        break;
      case 'xukong': // 虛空之門：發光藍色傳送門
        s += '<defs><radialGradient id="' + g1 + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e1f5fe"/><stop offset=".45" stop-color="#4fc3f7"/><stop offset="1" stop-color="#5e35b1"/></radialGradient></defs>';
        s += island(200, '#9ccc65', true);
        s += '<ellipse cx="100" cy="62" rx="44" ry="54" fill="#6d6d7d" stroke="#37374a" stroke-width="3"/>';
        s += '<ellipse cx="100" cy="64" rx="32" ry="42" fill="url(#' + g1 + ')"><animate attributeName="rx" values="32;35;32" dur="2.4s" repeatCount="indefinite"/></ellipse>';
        s += '<path d="M100 30 Q124 54 100 64 Q76 74 100 98" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>';
        s += '<path d="M56 34 L48 18 L62 26Z M144 34 L152 18 L138 26Z" fill="#9575cd"/><rect x="62" y="104" width="76" height="10" fill="#5d5d6d"/>';
        break;
      case 'tongtian': // 通天塔
        s += island(200, '#7cb342', false);
        var y = 108, w = 70;
        for (var i = 0; i < 6; i++) {
          s += '<rect x="' + (100 - w / 2 + 6) + '" y="' + (y - 14) + '" width="' + (w - 12) + '" height="14" fill="#f3e0b5" stroke="#6d4c41"/>';
          s += roof(100 - w / 2, y - 24, w, 12, '#2e7d32', 6);
          y -= 18; w -= 8;
        }
        s += '<path d="M100 ' + (y - 10) + ' L100 ' + (y + 6) + '" stroke="#ffd54f" stroke-width="3"/>';
        break;
      case 'wuji': // 無極幻境：綠色水晶
        s += island(200, '#81c784', false);
        s += '<path d="M100 8 L124 58 L112 112 L88 112 L76 58Z" fill="#69f0ae" stroke="#1b5e20" stroke-width="2" opacity=".9"/>';
        s += '<path d="M100 8 L100 112 M76 58 L124 58" stroke="#e8f5e9" stroke-width="1.5" opacity=".8"/>';
        s += '<path d="M70 112 L60 74 L78 90Z M130 112 L140 74 L122 90Z" fill="#a5d6a7" stroke="#1b5e20"/>';
        break;
      case 'jiangxing': // 將星錄：觀星台
        s += island(200, '#7cb342', false);
        s += '<rect x="62" y="80" width="76" height="34" fill="#b0bec5" stroke="#37474f" stroke-width="2"/>';
        s += '<path d="M56 80 L144 80 L134 70 L66 70Z" fill="#78909c" stroke="#37474f"/>';
        s += '<circle cx="100" cy="44" r="22" fill="#283593" stroke="#ffd54f" stroke-width="3"/><path d="M90 40 L94 44 L100 36 L106 46 L112 40" stroke="#fff59d" stroke-width="2" fill="none"/><rect x="96" y="64" width="8" height="8" fill="#37474f"/>';
        break;
      case 'farm': // 農田
        s += island(200, '#9ccc65', true);
        for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
          var fx = 40 + c * 42, fy = 92 + r * 16;
          s += '<path d="M' + fx + ' ' + fy + ' L' + (fx + 36) + ' ' + fy + ' L' + (fx + 30) + ' ' + (fy + 12) + ' L' + (fx - 6) + ' ' + (fy + 12) + 'Z" fill="#6d4c41" stroke="#3e2723"/>';
          s += '<path d="M' + (fx + 6) + ' ' + (fy + 8) + ' l2 -8 l2 8 M' + (fx + 16) + ' ' + (fy + 8) + ' l2 -8 l2 8 M' + (fx + 26) + ' ' + (fy + 8) + ' l2 -8 l2 8" stroke="#aeea00" stroke-width="2" fill="none"/>';
        }
        s += '<rect x="130" y="54" width="34" height="30" fill="#f3e0b5" stroke="#6d4c41"/>' + roof(124, 38, 46, 18, '#8d6e63', 5);
        break;
      case 'baifang': // 拜訪武將：雕像台
        s += island(200, '#7cb342', false);
        s += '<rect x="66" y="96" width="68" height="18" fill="#bcaaa4" stroke="#5d4037" stroke-width="2"/>';
        s += '<path d="M86 96 L86 60 Q100 40 114 60 L114 96Z" fill="#b39ddb" stroke="#4527a0" stroke-width="2"/><circle cx="100" cy="44" r="12" fill="#b39ddb" stroke="#4527a0" stroke-width="2"/>';
        s += '<path d="M114 60 L132 30" stroke="#7e57c2" stroke-width="5"/>';
        break;
    }
    return svg('0 0 200 200', s, 'art building');
  };

  // ---------- 主城背景（天空、雲、遠山） ----------
  // 金色法陣 + 高品質武將光暈（風格參考官方圖：立繪站在發光金色法陣上，紫將有紫色光焰；圖形為本作原創繪製）
  A.magicCircle = function (q) {
    var s = '<svg class="art mcircle" viewBox="0 0 200 80"><defs><radialGradient id="mcg"><stop offset="0" stop-color="#fff6c0" stop-opacity=".9"/><stop offset=".6" stop-color="#e8b830" stop-opacity=".45"/><stop offset="1" stop-color="#a06a10" stop-opacity="0"/></radialGradient></defs>';
    s += '<ellipse cx="100" cy="40" rx="98" ry="36" fill="url(#mcg)"/>';
    s += '<ellipse cx="100" cy="40" rx="86" ry="30" fill="none" stroke="#ffe07a" stroke-width="2.5"/><ellipse cx="100" cy="40" rx="70" ry="24" fill="none" stroke="#ffd04a" stroke-width="1.5" stroke-dasharray="6 4"/>';
    s += '<ellipse cx="100" cy="40" rx="50" ry="17" fill="none" stroke="#fff1a8" stroke-width="2"/>';
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, x = 100 + Math.cos(a) * 78, y = 40 + Math.sin(a) * 27; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="#fff4b0"/>'; }
    s += '<path d="M100 18 L150 52 L50 52Z M100 62 L150 28 L50 28Z" fill="none" stroke="#ffe58a" stroke-width="1.2" opacity=".8"/></svg>';
    return s;
  };
  A.aura = function (q) {
    if (q < 3) return '';
    var c1 = q >= 4 ? '#d070ff' : '#60b0ff', c2 = q >= 4 ? '#7a20c0' : '#2050c0';
    return '<svg class="art aura" viewBox="0 0 100 160"><defs><radialGradient id="aur' + q + '" cx=".5" cy=".6" r=".55"><stop offset="0" stop-color="' + c1 + '" stop-opacity=".0"/><stop offset=".55" stop-color="' + c1 + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c2 + '" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="M50 4 C62 30 92 40 88 90 C86 130 70 150 50 154 C30 150 14 130 12 90 C8 40 38 30 50 4Z" fill="url(#aur' + q + ')"/>' +
      '<path d="M30 40 C26 20 34 12 38 6 M70 40 C74 22 66 12 62 4 M50 20 C48 10 52 4 50 0" stroke="' + c1 + '" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/></svg>';
  };
  A.skySvg = function () {
    var g = uid('sky');
    var s = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ec8f2"/><stop offset=".6" stop-color="#b8ecff"/><stop offset="1" stop-color="#e6fbff"/></linearGradient></defs>';
    s += '<rect width="960" height="600" fill="url(#' + g + ')"/>';
    s += '<path d="M0 470 Q120 420 240 460 T480 450 T720 470 T960 440 L960 600 L0 600Z" fill="#9fd9e8" opacity=".6"/>';
    s += '<path d="M600 330 Q700 250 800 330" stroke="#ff8a80" stroke-width="5" fill="none" opacity=".35"/><path d="M600 338 Q700 258 800 338" stroke="#fff176" stroke-width="5" fill="none" opacity=".35"/><path d="M600 346 Q700 266 800 346" stroke="#81d4fa" stroke-width="5" fill="none" opacity=".35"/>';
    function cloud(x, y, k) { return '<g transform="translate(' + x + ',' + y + ') scale(' + k + ')" fill="#fff" opacity=".85"><ellipse cx="0" cy="0" rx="60" ry="20"/><ellipse cx="-30" cy="-10" rx="30" ry="22"/><ellipse cx="20" cy="-16" rx="34" ry="26"/></g>'; }
    s += cloud(120, 90, 1) + cloud(780, 70, 1.2) + cloud(480, 540, 1.6) + cloud(60, 520, 1.1) + cloud(900, 520, 1.3);
    // 遠處小浮島
    s += '<path d="M30 300 Q60 290 90 300 Q78 320 60 330 Q42 320 30 300Z" fill="#8a6a4a"/><ellipse cx="60" cy="298" rx="32" ry="7" fill="#7cb342"/>';
    s += '<path d="M860 220 Q890 210 920 220 Q908 240 890 248 Q872 240 860 220Z" fill="#8a6a4a"/><ellipse cx="890" cy="218" rx="32" ry="7" fill="#7cb342"/>';
    return svg('0 0 960 600', s, 'art sky');
  };

  // ---------- 戰場背景 ----------
  A.battlefieldSvg = function (tint) {
    var g = uid('bf'), sk = uid('sk'), t = tint || '#7a9a4a', i;
    var s = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(t, 0.3) + '"/><stop offset=".4" stop-color="' + shade(t, 0.08) + '"/><stop offset="1" stop-color="' + shade(t, -0.38) + '"/></linearGradient>' +
      '<linearGradient id="' + sk + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#f4e6c0"/></linearGradient></defs>';
    // 天空與遠山（兩層）
    s += '<rect width="960" height="160" fill="url(#' + sk + ')"/>';
    s += '<circle cx="780" cy="52" r="26" fill="#fff4c8" opacity=".75"/>';
    s += '<path d="M0 120 L90 70 L170 108 L260 58 L360 112 L470 66 L560 104 L660 52 L760 100 L860 64 L960 98 L960 160 L0 160Z" fill="#8aa0b8" opacity=".55"/>';
    s += '<path d="M0 150 L120 104 L220 140 L340 96 L470 142 L600 100 L720 138 L840 106 L960 140 L960 165 L0 165Z" fill="' + shade(t, -0.3) + '" opacity=".75"/>';
    // 遠方城關（中央）
    s += '<g opacity=".55" fill="' + shade(t, -0.55) + '"><rect x="410" y="120" width="140" height="30"/><rect x="440" y="100" width="80" height="20"/><path d="M432 100 L480 82 L528 100Z"/>';
    for (i = 0; i < 7; i++) s += '<rect x="' + (410 + i * 20) + '" y="114" width="10" height="7"/>';
    s += '<rect x="470" y="132" width="20" height="18" fill="#2a1a0a"/></g>';
    // 地面
    s += '<rect y="155" width="960" height="445" fill="url(#' + g + ')"/>';
    s += '<path d="M0 158 L960 158" stroke="#000" opacity=".12"/>';
    for (i = 0; i < 22; i++) s += '<ellipse cx="' + ((i * 137) % 960) + '" cy="' + (190 + (i * 71) % 390) + '" rx="' + (10 + i % 4 * 6) + '" ry="4" fill="#000" opacity=".07"/>';
    // 草叢
    for (i = 0; i < 26; i++) { var gx = (i * 211 + 37) % 960, gy = 176 + (i * 97) % 410; s += '<path d="M' + gx + ' ' + gy + ' l-4 -9 M' + gx + ' ' + gy + ' l1 -12 M' + gx + ' ' + gy + ' l6 -8" stroke="' + shade(t, -0.45) + '" stroke-width="2" opacity=".45"/>'; }
    // 兩側陣營旗幟與營帳（左我方藍、右敵方紅）
    function flag(x, y, col, flip) {
      var d = flip ? -1 : 1;
      return '<g><path d="M' + x + ' ' + y + ' L' + x + ' ' + (y - 92) + '" stroke="#5a3a1a" stroke-width="4"/><path d="M' + x + ' ' + (y - 90) + ' L' + (x + 46 * d) + ' ' + (y - 82) + ' L' + (x + 40 * d) + ' ' + (y - 64) + ' L' + (x + 46 * d) + ' ' + (y - 46) + ' L' + x + ' ' + (y - 52) + 'Z" fill="' + col + '" stroke="#2a1a0a" stroke-width="1.5"/><circle cx="' + (x + 20 * d) + '" cy="' + (y - 70) + '" r="9" fill="#f7e7b0" opacity=".9"/></g>';
    }
    s += flag(22, 250, '#3a6ac8', false) + flag(30, 520, '#3a6ac8', false) + flag(938, 250, '#c83a2a', true) + flag(930, 520, '#c83a2a', true);
    s += '<path d="M40 210 L80 170 L120 210Z" fill="#e8dcc0" stroke="#6a5030" stroke-width="2" opacity=".85"/><path d="M840 210 L880 170 L920 210Z" fill="#e8d0c0" stroke="#6a3020" stroke-width="2" opacity=".85"/>';
    // 石塊
    s += '<path d="M60 590 Q80 560 112 572 Q130 590 120 600 L50 600Z" fill="' + shade(t, -0.5) + '" opacity=".6"/><path d="M850 600 Q860 566 900 570 Q930 586 924 600Z" fill="' + shade(t, -0.5) + '" opacity=".6"/>';
    return svg('0 0 960 600', s, 'art field');
  };

  // ---------- 原創 AI 生成點陣美術（MJ.ASSETS，WebP 內嵌）；沒有圖時回退向量版 ----------
  var urlCache = {}, webpOk = null;
  function hasWebp() {
    if (webpOk !== null) return webpOk;
    webpOk = false;
    try { var c = document.createElement('canvas'); c.width = c.height = 1; webpOk = c.toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { webpOk = false; }
    // iOS 14+ Safari 可顯示 WebP 但 toDataURL 不支援輸出：以 UA 版本判斷
    if (!webpOk) { var m = /OS (\d+)_\d+.* like Mac OS X/.exec(navigator.userAgent || '') || /Version\/(\d+).*Safari/.exec(navigator.userAgent || ''); if (m && +m[1] >= 14) webpOk = true; }
    return webpOk;
  }
  A.enabled = function () { return !!(MJ.ASSETS && !(MJ.S && MJ.S.state && MJ.S.state.settings && MJ.S.state.settings.vectorArt) && hasWebp()); };
  // data URI 轉 blob URL（只轉一次；innerHTML 重繪時字串短、解碼快取共用）
  A.url = function (key) {
    if (!MJ.ASSETS || !MJ.ASSETS[key]) return null;
    if (urlCache[key]) return urlCache[key];
    var d = MJ.ASSETS[key], u = d;
    if (d.indexOf('data:') !== 0) { urlCache[key] = d; return d; }
    try {
      if (window.Blob && window.URL && URL.createObjectURL && window.atob && window.Uint8Array) {
        var b = atob(d.slice(d.indexOf(',') + 1)), n = b.length, a = new Uint8Array(n), i;
        for (i = 0; i < n; i++) a[i] = b.charCodeAt(i);
        u = URL.createObjectURL(new Blob([a], { type: 'image/webp' }));
      }
    } catch (e) { u = d; }
    urlCache[key] = u;
    return u;
  };
  A.has = function (key) { return !!(key && A.enabled() && MJ.ASSETS[key]); };
  function img(key, cls) { return '<img class="' + cls + '" src="' + A.url(key) + '" alt="" draggable="false" decoding="async" loading="lazy">'; }
  // 角色美術 key：look.art；主角依性別
  A.keyOf = function (L) {
    if (!L) return null;
    if (L.art) return L.art;
    var st = MJ.S && MJ.S.state;
    if (st && st.player && L === st.player.look) return 'c_lead_' + (L.g === 'f' ? 'f' : 'm');
    return null;
  };
  A.portrait = function (L, q, opt) {
    var k = A.keyOf(L);
    if (!A.has(k + '_av')) return A.portraitSvg(L, q, opt);
    return '<div class="art portrait pimg q' + (q || 0) + '">' + img(k + '_av', 'pimg-i') + '</div>';
  };
  // art2：無雙 cut-in 用高解析半身像（<key>_ci，288px）；沒有時退回一般頭像
  A.hasCutin = function (L) { return A.has(A.keyOf(L) + '_ci'); };
  A.cutin = function (L, q, opt) {
    var k = A.keyOf(L);
    if (!A.has(k + '_ci')) return A.portrait(L, q, opt);
    return '<div class="art cimg q' + (q || 0) + (opt && opt.enemy ? ' en' : '') + '">' + img(k + '_ci', 'cimg-i') + '</div>';
  };
  A.figure = function (L, opt) {
    var k = A.keyOf(L);
    if (!A.has(k)) return A.figureSvg(L, opt);
    return '<div class="art figure fimg' + (opt && opt.enemy ? ' en' : '') + '">' + img(k, 'fimg-i') + '</div>';
  };
  A.building = function (kind) {
    if (!A.has('k_' + kind)) return A.buildingSvg(kind);
    return '<div class="art building kimg k-' + kind + '">' + img('k_' + kind, 'kimg-i') + '</div>';
  };
  A.bgDiv = function (key, cls) {
    return '<div class="art ' + cls + ' bgimg" style="background-image:url(' + A.url(key) + ')"></div>';
  };
  A.sky = function () { return A.has('bg_city') ? A.bgDiv('bg_city', 'sky') : A.skySvg(); };
  // 戰場：依章節底色對應 bf_1..bf_8；其他模式依關卡 id 平均分配
  A.fieldKey = function (tint, sid) {
    var ch = MJ.D && MJ.D.stages && MJ.D.stages.chapters, i, n = 0;
    if (ch && tint) for (i = 0; i < ch.length; i++) if (ch[i].bg === tint) return 'bf_' + ((i % 8) + 1);
    sid = String(sid || tint || '');
    for (i = 0; i < sid.length; i++) n = (n * 31 + sid.charCodeAt(i)) & 0xffff;
    return 'bf_' + ((n % 8) + 1);
  };
  A.battlefield = function (tint, sid) {
    var k = A.fieldKey(tint, sid);
    return A.has(k) ? A.bgDiv(k, 'field') : A.battlefieldSvg(tint);
  };
  // 畫面背景（以 <style> 注入，避免 CSS 檔內嵌大圖）
  A.injectBg = function () {
    if (!A.enabled() || document.getElementById('mjArtBg')) return;
    var dim = 'linear-gradient(rgba(10,8,20,.42),rgba(10,8,20,.42)),';
    var R = [
      ['.voidbg', 'bg_gate', ''],
      ['.hall-scr', 'bg_city', 'linear-gradient(rgba(10,8,30,.55),rgba(10,8,30,.55)),'],
      ['.recruit-scr', 'bg_recruit', 'linear-gradient(rgba(10,6,4,.25),rgba(10,6,4,.25)),'],
      ['.hall-center .starry', 'bg_shenwu', ''],
      ['.towerf', 'bg_tower', dim],
      ['.wujif', 'bg_wuji', dim],
      ['.farmf', 'bg_farm', 'linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.12)),'],
      ['.arenaf', 'bg_arena', dim],
      ['.jxl', 'bg_shenwu', 'linear-gradient(rgba(10,8,30,.5),rgba(10,8,30,.5)),'],
      ['.forge', 'bg_recruit', 'linear-gradient(rgba(20,10,4,.55),rgba(20,10,4,.55)),']
    ], css = '', i;
    // 面板材質（原創 AI 生成木紋、宣紙），放在各畫面背景規則之前，讓畫面背景可以覆蓋
    if (A.has('t_wood')) {
      css += '.frame{background-image:linear-gradient(rgba(118,128,46,.80),rgba(72,82,22,.90)),url(' + A.url('t_wood') + ');background-size:auto,256px}\n';
      css += '.frame-s,.tab:not(.on){background-image:linear-gradient(rgba(96,62,20,.55),rgba(44,26,6,.72)),url(' + A.url('t_wood') + ');background-size:auto,256px}\n';
    }
    if (A.has('t_paper')) css += '.parch,.panel-body{background-image:linear-gradient(rgba(250,238,204,.45),rgba(226,204,148,.62)),url(' + A.url('t_paper') + ');background-size:auto,256px}\n';
    for (i = 0; i < R.length; i++) if (A.has(R[i][1])) css += R[i][0] + '{background-image:' + R[i][2] + 'url(' + A.url(R[i][1]) + ');background-size:cover;background-position:center;background-repeat:no-repeat}\n';
    css += '.hall-center .starry{opacity:1;background-position:center 70%}.hall-center .rock{display:none}\n';
    var st = document.createElement('style'); st.id = 'mjArtBg'; st.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(st);
  };
  return A;
})();
