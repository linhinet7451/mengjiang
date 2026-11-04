/* 猛將無雙 單機復刻 — 工具函式（ES5） */
var MJ = window.MJ || {};
window.MJ = MJ;
MJ.U = (function () {
  var U = {};
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.isArray = function (a) { return Object.prototype.toString.call(a) === '[object Array]'; };
  U.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  U.now = function () { return Date.now ? Date.now() : new Date().getTime(); };
  U.extend = function (a, b) { for (var k in b) { if (b.hasOwnProperty(k)) a[k] = b[k]; } return a; };
  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.each = function (arr, fn) { for (var i = 0; i < arr.length; i++) fn(arr[i], i); };
  U.find = function (arr, fn) { for (var i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return arr[i]; } return null; };
  U.filter = function (arr, fn) { var o = []; for (var i = 0; i < arr.length; i++) { if (fn(arr[i], i)) o.push(arr[i]); } return o; };
  U.map = function (arr, fn) { var o = []; for (var i = 0; i < arr.length; i++) o.push(fn(arr[i], i)); return o; };
  U.keys = function (o) { var r = []; for (var k in o) { if (o.hasOwnProperty(k)) r.push(k); } return r; };
  U.fmt = function (n) {
    n = Math.floor(n || 0);
    var s = String(Math.abs(n)), out = '';
    while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (n < 0 ? '-' : '') + s + out;
  };
  U.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  U.dur = function (ms) {
    if (ms < 0) ms = 0;
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return U.pad2(h) + ':' + U.pad2(m) + ':' + U.pad2(x);
  };
  U.dayKey = function (t) {
    var d = new Date(t || U.now());
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };
  // 可重現的亂數（mulberry32）
  U.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul ? Math.imul(t ^ (t >>> 15), t | 1) : U._imul(t ^ (t >>> 15), t | 1);
      t ^= t + (Math.imul ? Math.imul(t ^ (t >>> 7), t | 61) : U._imul(t ^ (t >>> 7), t | 61));
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U._imul = function (a, b) {
    var ah = (a >>> 16) & 0xffff, al = a & 0xffff, bh = (b >>> 16) & 0xffff, bl = b & 0xffff;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
  };
  U.rand = Math.random;
  U.pickWeighted = function (weights, r) {
    var sum = 0, i;
    for (i = 0; i < weights.length; i++) sum += weights[i];
    var x = r * sum;
    for (i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0) return i; }
    return weights.length - 1;
  };
  return U;
})();
