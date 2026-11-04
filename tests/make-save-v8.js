// 由 web2 改版前的程式碼（backup/pre-web2-20261104）產生 v8 存檔：node tests/make-save-v8.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var ROOT = path.join(__dirname, '..', 'backup', 'pre-web2-20261104', 'src', 'js');
var store = {}, ctx = { console: console, Date: Date, Math: Math, JSON: JSON };
ctx.window = ctx; ctx.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
vm.createContext(ctx);
['util', 'data.generated', 'rules', 'battle', 'state', 'game', 'sys2', 'sys3', 'sys4', 'sys5', 'sys6', 'sys7', 'sys8'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(ROOT, f + '.js'), 'utf8'), ctx, { filename: f }); });
var M = ctx.MJ, G = M.G, S = M.S, T0 = 1767225600000; M.U.now = function () { return T0; };
G.initData(); G.newGame('存檔八', '力耐', 'm', 1);
var s = S.state, L = G.lead(); L.lv = 50; s.player.silver = 123456; s.player.gold = 789;
var ids = ['liubei', 'caocao', 'xiongmao', 'wangyuyan', 'duanyu', 'lvbu', 'zhangjiao', 'huaxiong'];
ids.forEach(function (id, i) { var h = G.newHero(id); h.lv = 30 + i; h.exp = 50; h.star = i % 3; h.sk = { a: 6, u: 2, p: 2 }; s.heroes.push(h); });
// 劉備（舊：智耐）穿法術武器，曹操（舊：智耐）穿法術武器、段譽（舊：智敏）
function wear(uid, tpl) { var e = G.addEquip(tpl, 3); e.enh = 5; e.gems = ['atk']; var r = G.equip(uid, e.uid); if (!r.ok) throw new Error(tpl + ' ' + r.msg); }
function H(id) { return s.heroes.filter(function (h) { return h.id === id; }).pop(); }
wear(H('liubei').uid, 'wm24'); wear(H('caocao').uid, 'wm30'); wear(H('duanyu').uid, 'wm24'); wear(H('lvbu').uid, 'wp30'); wear(H('xiongmao').uid, 'wp24');
H('liubei').xf = [{ id: Object.keys(M.D.config.xinfa)[0], lv: 3 }, { id: Object.keys(M.D.config.xinfa)[1], lv: 2 }, { id: Object.keys(M.D.config.xinfa)[2], lv: 1 }];
// 50 級舊規則可上 7 人
s.team.formation = 'fangyuan'; s.team.cells = {};
var cells = M.D.formIndex.fangyuan.cells; [L].concat(['liubei', 'caocao', 'xiongmao', 'wangyuyan', 'duanyu', 'lvbu'].map(H)).forEach(function (h, i) { s.team.cells[cells[i]] = h.uid; });
s.bag.stack['soul:liubei'] = 12; s.bag.stack['soul:wangyuyan'] = 3; s.bag.stack['soul:xiongmao'] = 2; s.bag.stack['xf_' + Object.keys(M.D.config.xinfa)[0]] = 1;
s.jiangxing = s.jiangxing || {}; s.jiangxing.lit = 5;
s.tower = s.tower || {}; s.tower.best = 15;
var r = G.arenaFight(G.arenaList()[0], 4242);
console.log('team', G.teamCount(), 'arena', r.ok, r.win, 'recs', s.arena.recs.length);
fs.writeFileSync(path.join(__dirname, 'fixtures', 'save-v8.json'), JSON.stringify(S.wrap(s)));
console.log('version', S.VERSION, 'heroes', s.heroes.length);
