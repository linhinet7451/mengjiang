// Node 測試載入器：以 vm 載入瀏覽器模組，提供假的 localStorage
var fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = function load(opts) {
  opts = opts || {};
  var store = {};
  var ctx = { console: console, Date: Date, Math: Math, JSON: JSON };
  ctx.window = ctx;
  ctx.localStorage = { getItem: function (k) { return store.hasOwnProperty(k) ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
  vm.createContext(ctx);
  ['util', 'data.generated', 'rules', 'battle', 'state', 'game', 'sys2', 'sys3', 'sys4', 'sys5', 'sys6', 'sys7', 'sys8', 'sys9', 'sys10', 'audio'].forEach(function (f) {
    var fp = (f === 'data.generated' && opts.data) ? opts.data : path.join(__dirname, '..', 'src', 'js', f + '.js');
    vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f + '.js' });
  });
  if (opts.legacy) ctx.MJ.R.RV = opts.legacy;
  ctx.MJ.G.initData();
  ctx._store = store;
  return ctx;
};
