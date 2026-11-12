// WL-12：虛空之門 ch11–13＋主線重調 S4b＋×2 終局門檻（D 級原創）。node tests/unit-wl12.js
// 目的：13 章 117 關（ch11 桃花島 Lv79–85、ch12 崑崙之巔 Lv85–89、ch13 天外天 Lv89–90）；
// bossScale S4b [1.22, 1.68, 2.57, 2.42, 2.78, 3.78, 3.68, 3.10, 2.73, 2.42, 2.6, 2.9, 3.0]；
// OD-5 ch9/ch10 王／隱藏掉落同步為 q2@50%＋q3@35%；s13_9 里程碑首通金 300＋紫裝碎片 ×20；
// ×2 終局門檻為帶狀 Lv78–82（max@80 能打過、max@75／max@69／vet@80 打不過）；一般模式 s13_8 門檻約 max@67；
// 存檔 v12 不變、零遷移。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh() { var c = load(); c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c = fresh(), M = c.MJ, G = M.G, R = M.R, U = M.U, D = M.D, S = M.S;

console.log('[新章結構]');
ok(D.stages.chapters.length === 16, '共 16 章（WL-15 新增 ch14–16；本檔仍測 ch11–13 內容）');
ok(D.stages.stages.length === 144, '共 144 關（117 + 27）');
var ch11 = D.stages.chapters[10], ch12 = D.stages.chapters[11], ch13 = D.stages.chapters[12];
ok(ch11.id === 11 && ch11.name === '桃花島' && ch11.lv === 79 && ch11.bg === '#3a6a5a', 'ch11 桃花島 Lv79（解鎖 Lv79）');
ok(ch12.id === 12 && ch12.name === '崑崙之巔' && ch12.lv === 80 && ch12.bg === '#7a6a4a', 'ch12 崑崙之巔 Lv80（解鎖 Lv80）');
ok(ch13.id === 13 && ch13.name === '天外天' && ch13.lv === 80 && ch13.bg === '#2a2a4a', 'ch13 天外天 Lv80（解鎖 Lv80）');
ok(JSON.stringify(ch11.pool) === JSON.stringify(['mg_qibing', 'mg_sheshou', 'mg_lama', 'mg_wushi', 'xl_qibing']), 'ch11 敵池 5 模板（含 mg_lama）');
ok(JSON.stringify(ch12.pool) === JSON.stringify(['xl_qibing', 'xl_gongshou', 'dz_qinwei', 'lj_moushi']), 'ch12 敵池 4 模板');
ok(JSON.stringify(ch13.pool) === JSON.stringify(['cj_shuibing', 'cj_hubaoqi', 'cj_moushi', 'cj_nushou', 'dz_qinwei']), 'ch13 敵池 5 模板（含 cj_shuibing）');
ok(JSON.stringify(ch11.elite) === JSON.stringify(['e_huodu', 'e_daerba']) && ch11.boss === 'b_jinlun' && ch11.hidden === 'b_dongfang', 'ch11 精英／王／隱藏：霍都／達爾巴／金輪／東方不敗');
ok(JSON.stringify(ch12.elite) === JSON.stringify(['e_huaxiong', 'e_lijue']) && ch12.boss === 'b_dongzhuo' && ch12.hidden === 'b_menge', 'ch12 精英／王／隱藏：華雄／李傕／董卓／孟獲');
ok(JSON.stringify(ch13.elite) === JSON.stringify(['e_zhangliao', 'e_caoren']) && ch13.boss === 'b_lvbu' && ch13.hidden === 'b_dugu', 'ch13 精英／王／隱藏：張遼／曹仁／呂布／獨孤求敗');
ok(JSON.stringify(ch11.souls) === JSON.stringify(['guojing', 'huangrong', 'zhoubotong', 'ouyangfeng', 'hongqigong', 'huangyaoshi']), 'ch11 將魂輪替：郭靖／黃蓉／周伯通／歐陽鋒／洪七公／黃藥師');
ok(JSON.stringify(ch12.souls) === JSON.stringify(['xiaozhao', 'wuyazi', 'tianshan', 'yangguo', 'xiaolongnv', 'zhangwuji']), 'ch12 將魂輪替：小昭／無崖子／天山童姥／楊過／小龍女／張無忌');
ok(JSON.stringify(ch13.souls) === JSON.stringify(['guanyu', 'zhangfei', 'machao', 'huangzhong', 'lvbu', 'zhaoyun']), 'ch13 將魂輪替：關羽／張飛／馬超／黃忠／呂布／趙雲');
ok(ch11.stageNames[0] === '桃花溪' && ch11.stageNames[8] === '桃花源' && ch12.stageNames[8] === '玉虛洞' && ch13.stageNames[7] === '天外天之巔' && ch13.stageNames[8] === '劍魔洞', '三章關名（桃花溪／桃花源／玉虛洞／天外天之巔／劍魔洞）');
ok(ch11.desc.indexOf('桃花') >= 0 && ch12.desc.indexOf('崑崙') >= 0 && ch13.desc.indexOf('天外') >= 0, '三章描述文案');
[11, 12, 13].forEach(function (ch) {
  var ss = D.stages.stages.filter(function (s) { return s.ch === ch; });
  ok(ss.length === 9 && ss.filter(function (s) { return s.kind === 'normal'; }).length === 5 && ss.filter(function (s) { return s.kind === 'elite'; }).length === 2 && ss.filter(function (s) { return s.kind === 'boss'; }).length === 1 && ss.filter(function (s) { return s.kind === 'hidden'; }).length === 1, 'ch' + ch + ' 共 9 關（普通 5／精英 2／王 1／隱藏 1）');
  ok(ss.every(function (s) { return s.enemies.length === 9; }), 'ch' + ch + ' 每關 9 名敵人');
});
var byId = {};
D.stages.stages.forEach(function (s) { byId[s.id] = s; });
ok(byId['s11_8'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'b_jinlun' && byId['s11_8'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 85, 's11_8 首領金輪法王 cell 4 Lv85（關卡 Lv84＋1）');
ok(byId['s13_8'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'b_lvbu' && byId['s13_8'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 91, 's13_8 首領呂布 cell 4 Lv91（關卡 Lv90＋1，金框）');
ok(byId['s13_9'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'b_dugu' && byId['s13_9'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 91, 's13_9 隱藏首領獨孤求敗 cell 4 Lv91');
ok(D.stages.stages.filter(function (s) { return s.ch >= 11; }).every(function (s) { return s.enemies.every(function (e) { return D.stages.enemies[e.e]; }); }), '新章全部敵人 id 皆存在於 enemies 表');
ok([11, 12, 13].every(function (ch) { return D.stages.chapters[ch - 1].souls.every(function (id) { return D.heroes.list.some(function (h) { return h.id === id; }); }); }), '新章全部將魂 id 皆為 90 名武將之一');

console.log('[關卡表與獎勵（設計 §2.3）]');
ok(D.stages.stages.filter(function (s) { return s.ch === 11; }).map(function (s) { return s.lv; }).join(',') === '79,80,80,81,82,82,83,84,85', 'ch11 等級 79–84、隱藏 85');
ok(D.stages.stages.filter(function (s) { return s.ch === 12; }).map(function (s) { return s.lv; }).join(',') === '85,86,86,87,87,88,88,89,89', 'ch12 等級 85–89、隱藏 89');
ok(D.stages.stages.filter(function (s) { return s.ch === 13; }).map(function (s) { return s.lv; }).join(',') === '89,89,90,90,90,90,90,90,90', 'ch13 等級 89–90、多關同 Lv90 封頂');
ok(byId['s11_1'].silver === 635 && byId['s11_1'].exp === 473 && byId['s11_1'].first.gold === 5 && byId['s11_1'].first.silver === 1407, 's11_1 獎勵：銀 635／經驗 473／首通金 5／首通銀 1407');
ok(byId['s12_8'].silver === 1668 && byId['s12_8'].exp === 1253 && byId['s12_8'].first.gold === 30 && byId['s12_8'].first.silver === 3695, 's12_8 獎勵：銀 1668／經驗 1253／首通金 30／首通銀 3695');
ok(byId['s13_8'].silver === 1687 && byId['s13_8'].exp === 1267 && byId['s13_8'].first.gold === 30 && byId['s13_8'].first.silver === 3737, 's13_8 獎勵：銀 1687／經驗 1267／首通金 30／首通銀 3737');
ok(byId['s13_9'].silver === 2082 && byId['s13_9'].exp === 1563 && byId['s13_9'].first.gold === 300 && byId['s13_9'].first.silver === 4612, 's13_9 獎勵：銀 2082／經驗 1563／首通金 300（里程碑）／首通銀 4612');
ok(byId['s13_9'].first.items.some(function (it) { return it.item === 'zizhuang_frag' && it.n === 20; }) && byId['s13_9'].first.items.some(function (it) { return it.item === 'soul:zhaoyun' && it.n === 5; }), 's13_9 首通物品：紫裝碎片 ×20＋趙雲將魂 ×5（OD-7）');
ok(byId['s11_1'].drops[0].item === 'eq:ar1' && byId['s11_1'].drops[0].q === 0 && byId['s11_1'].drops[0].chance === 0.25, 's11_1 掉落首件 ar1 白 25%（裝備欄位輪替接續 s10_9 的 wp）');
ok(byId['s12_8'].first.items.some(function (it) { return it.item === 'xf_jinzhong' && it.n === 1; }) && byId['s13_8'].first.items.some(function (it) { return it.item === 'xf_yijin' && it.n === 1; }) && byId['s11_8'].first.items.some(function (it) { return it.item === 'xf_xixing' && it.n === 1; }), '三章王首通心法：ch11 吸星／ch12 金鐘／ch13 易筋');
ok(D.stages.stages.filter(function (s) { return s.ch === 11; }).every(function (s) { return s.drops.some(function (d) { return d.item.indexOf('gem_') === 0 && /_4$/.test(d.item); }); }), 'ch11 寶石掉落皆為 Lv4');
ok(D.stages.stages.filter(function (s) { return s.ch >= 12; }).every(function (s) { return s.drops.some(function (d) { return d.item.indexOf('gem_') === 0 && /_5$/.test(d.item); }); }), 'ch12／ch13 寶石掉落皆為 Lv5');
ok(D.stages.stages.filter(function (s) { return s.ch >= 11; }).every(function (s) { return s.drops.filter(function (d) { return d.item.indexOf('eq:') === 0; }).every(function (d) { return /1$/.test(d.item); }); }), '新章 54 條裝備掉落皆為 Lv1（WL-10 規則）');

console.log('[解鎖鏈]');
ok(byId['s11_1'].unlock === 's10_8' && byId['s12_1'].unlock === 's11_8' && byId['s13_1'].unlock === 's12_8', '新章首關解鎖：s11_1←s10_8、s12_1←s11_8、s13_1←s12_8');
ok(byId['s11_9'].unlock === 'all3star' && byId['s12_9'].unlock === 'all3star' && byId['s13_9'].unlock === 'all3star', '三章隱藏關皆為 all3star');
(function () {
  var c2 = fresh(), G2 = c2.MJ.G, S2 = c2.MJ.S;
  G2.lead().lv = 80;
  S2.state.stages['s10_8'] = { stars: 3, clears: 1 };
  ok(G2.stageUnlocked('s11_1'), '主角 Lv80、通關 s10_8：s11_1 解鎖');
  ok(!G2.chapterUnlocked(13), '未通關 s12_8：ch13 仍鎖定（即使主角 Lv80）');
  S2.state.stages['s11_8'] = { stars: 3, clears: 1 };
  S2.state.stages['s12_8'] = { stars: 3, clears: 1 };
  ok(G2.chapterUnlocked(13) && G2.stageUnlocked('s13_1'), '通關 s12_8：ch13 與 s13_1 解鎖');
  ok(!G2.stageUnlocked('s13_9'), 's13_9 未全三星：仍鎖定');
  ['s13_1', 's13_2', 's13_3', 's13_4', 's13_5', 's13_6', 's13_7', 's13_8'].forEach(function (id) { S2.state.stages[id] = { stars: 3, clears: 1 }; });
  ok(G2.stageUnlocked('s13_9'), '本章其餘 8 關皆三星：s13_9 解鎖');
})();
(function () {
  var c3 = fresh(), G3 = c3.MJ.G, S3 = c3.MJ.S;
  G3.lead().lv = 79;
  S3.state.stages['s10_8'] = { stars: 3, clears: 1 };
  S3.state.stages['s11_8'] = { stars: 3, clears: 1 };
  ok(G3.chapterUnlocked(11), '主角 Lv79、通關 s10_8：ch11 解鎖（門檻 Lv79）');
  ok(!G3.chapterUnlocked(12) && !G3.chapterUnlocked(13), '主角 Lv79：ch12／ch13 仍鎖定（門檻 Lv80）');
})();

console.log('[bossScale S4b 與 OD-5]');
var bs = D.config.bossScale;
ok(bs.length === 16 && JSON.stringify(bs) === JSON.stringify([1.22, 1.68, 2.57, 2.42, 2.78, 3.78, 3.68, 3.1, 2.73, 2.42, 2.6, 2.9, 3.0, 6, 7, 16]), 'bossScale 為 S4b＋WL-15 16 章表（前 13 章不動，新章 6／7／16）');
ok(bs[10] === 2.6 && bs[11] === 2.9 && bs[12] === 3.0, '新章倍率：ch11 2.6／ch12 2.9／ch13 3.0');
ok(JSON.stringify(D.config.enemyScale) === JSON.stringify({ from: 12, atk: 0.03, def: 0.03, hp: 0.05, atk2: 0.0006, def2: 0.0006, hp2: 0.001 }), 'enemyScale 未動（S4b 只動 bossScale：from 12／atk/def 0.03／hp 0.05／二階 0.0006/0.0006/0.001）');
['s9_8', 's9_9', 's10_8', 's10_9'].forEach(function (id) {
  var d = byId[id].drops.filter(function (x) { return x.item.indexOf('eq:') === 0; });
  ok(d[0].q === 2 && d[0].chance === 0.5 && d[1].q === 3 && d[1].chance === 0.35, id + ' 王／隱藏掉落同步修正為藍 50%＋紫 35%（OD-5，與 ch1–8 一致）');
});

console.log('[×2 終局門檻：固定滿裝隊、12 種子、實戰口徑（隨機組合→×2→詞綴→增援→事件）]');
function gateTeam(kind, L, Mx, Gx, Sx) {
  var Rx = Mx.R, Ux = Mx.U, Dx = Mx.D, sx = Sx.state;
  var p = kind === 'max' ? { plus: L, codex: 90 } : { plus: 28, codex: 60 };
  Gx.lead().lv = L; Gx.lead().sk = { a: 10, u: 10, p: 10 }; Gx.lead().star = 5;
  var py = Math.floor(10 + 1.5 * L); Gx.lead().py = { str: py, int: py, agi: py, con: py };
  sx.player.leadQ = L < 20 ? 2 : L < 60 ? 3 : 4;
  sx.team.cells = {}; sx.team.cells[4] = Gx.lead().uid;
  var order = [1, 7, 0, 6, 2, 8, 3];
  ['zhaoyun', 'guanyu', 'zhangfei', 'huangzhong', 'machao', 'diaochan', 'lvbu'].forEach(function (id, i) {
    var h = Gx.newHero(id, sx); h.lv = L; h.sk = { a: 10, u: 10, p: 10 }; h.star = 5; h.py = { str: py, int: py, agi: py, con: py };
    sx.heroes.push(h); sx.team.cells[order[i]] = h.uid;
  });
  function gear(h) {
    var dt = h.id === 'lead' ? 'p' : (Rx.heroDef(h.id).type.charAt(0) === '力' ? 'p' : Rx.heroDef(h.id).type.charAt(0) === '智' ? 'm' : 'j');
    Ux.each(Rx.SLOTS, function (slot) {
      var best = null;
      Ux.each(Dx.equipment.list, function (e) { if (e.slot !== slot || e.lv > 54) return; if (slot === 'weapon' && e.id.charAt(1) !== dt) return; if (!best || e.lv > best.lv) best = e; });
      if (best) h.eq[slot] = { uid: 0, t: best.id, q: 3, plus: p.plus, aff: [], gems: [] };
    });
  }
  sx.heroes.forEach(function (h) { gear(h); });
  for (var n = 0; n < p.codex; n++) sx.codex['sim' + n] = 1;
}
function gateWins(kind, L, stageId, dbl, seeds) {
  var wins = 0;
  for (var sd = 1; sd <= seeds; sd++) {
    var cc = load(), Mx = cc.MJ, Gx = Mx.G, Sx = Mx.S, Dx = Mx.D;
    Gx.newGame('測試', '力耐', 'm', 1);
    gateTeam(kind, L, Mx, Gx, Sx);
    var team = Gx.buildTeam(), seed = sd * 977 + 3, sg = Dx.stageIndex[stageId];
    var foes = Gx.drawFoes(sg, seed);
    if (dbl) foes.forEach(function (f) { Gx.doubleUnit(f.unit); });
    Gx.applyStageAffix(sg, foes, seed);
    var reinf = Gx.drawReinforce(sg, seed);
    if (dbl && reinf) reinf.forEach(function (u) { Gx.doubleUnit(u); });
    var opt = { seed: seed, maxRounds: Dx.config.maxRounds, levelSuppression: Dx.config.levelSuppression, event: Gx.eventFor(seed) };
    if (dbl) opt.double = true;
    if (reinf && reinf.length) opt.reinforce = { units: reinf };
    var r = Mx.Battle.run(team, foes, opt);
    if (r.win) wins++;
  }
  return wins;
}
var w;
w = gateWins('max', 80, 's13_8', true, 12);
ok(w >= 3, '×2 s13_8：max@80 能打過（' + w + '/12，設計 33%／最佳抽籤 50%，門檻帶 Lv78–82）');
w = gateWins('max', 78, 's13_8', true, 12);
ok(w >= 2 && w <= 8, '×2 s13_8：max@78 帶內（' + w + '/12，設計 14%——嚴格單點門檻不可達，帶狀即驗收標準）');
w = gateWins('max', 75, 's13_8', true, 12);
ok(w === 0, '×2 s13_8：max@75 打不過（' + w + '/12，設計 0%）');
w = gateWins('max', 82, 's13_8', true, 12);
ok(w >= 6, '×2 s13_8：max@82 明顯打過（' + w + '/12，設計 72%）');
w = gateWins('max', 69, 's13_8', true, 12);
ok(w === 0, '×2 s13_8：max@69 打不過（' + w + '/12，設計 0%）');
w = gateWins('vet', 80, 's13_8', true, 12);
ok(w === 0, '×2 s13_8：vet@80（強化僅 +28）打不過（' + w + '/12，設計 0%——滿裝本身就是門檻）');
w = gateWins('max', 80, 's13_9', true, 12);
ok(w >= 2, '×2 s13_9（隱藏）：max@80 能打過但更難（' + w + '/12，設計 13%——隱藏關門檻高於 max@82，接受 OD-6）');
w = gateWins('max', 82, 's13_9', true, 12);
ok(w >= 4, '×2 s13_9：max@82 勝率上升（' + w + '/12，設計 29%）');

console.log('[一般模式門檻與 ×2 階梯]');
w = gateWins('max', 69, 's13_8', false, 12);
ok(w >= 10, '一般 s13_8：max@69 穩過（' + w + '/12，設計 100%——一般模式門檻約 max@67，故以 ×2 門檻 max@80 為準，OD-1）');
w = gateWins('max', 65, 's13_8', false, 12);
ok(w >= 2 && w <= 8, '一般 s13_8：max@65 帶內（' + w + '/12，設計 33%）');
w = gateWins('vet', 80, 's13_8', false, 12);
ok(w <= 3, '一般 s13_8：vet@80 幾乎打不過（' + w + '/12，設計 0%——滿裝本身就是一般模式的門檻）');
w = gateWins('max', 72, 's11_8', true, 12);
ok(w >= 6, '×2 s11_8：max@72 已能打過（' + w + '/12，設計階梯 ~max@72）');
w = gateWins('max', 75, 's11_8', true, 12);
ok(w >= 8, '×2 s11_8：max@75 穩過（' + w + '/12，設計 92%）');
w = gateWins('vet', 69, 's11_8', true, 12);
ok(w === 0, '×2 s11_8：vet@69 打不過（' + w + '/12）');
w = gateWins('max', 77, 's12_8', true, 12);
ok(w <= 4, '×2 s12_8：max@77 仍難（' + w + '/12，設計階梯 ~max@77）');
w = gateWins('max', 80, 's12_8', true, 12);
ok(w >= 4, '×2 s12_8：max@80 能打過（' + w + '/12，設計 42%）');

console.log('[存檔 v12 與考證]');
ok(S.VERSION === 12, '存檔版本仍為 v12（零遷移、零新欄位）');
ok(G.stageState('s13_8').stars === 0 && G.stageState('s13_8').clears === 0, '新關預設紀錄為 0（舊存檔讀取時不憑空建立）');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
ok(prov.entries.length === 334, '考證共 334 條（WL-14 ＋5）');
ok(prov.entries.filter(function (x) { return x.grade === 'D'; }).length === 168, 'D 級共 168 條（WL-15 ＋10）');
['balance.bossScale12', 'balance.doubleGate', 'stages.ch11_13'].forEach(function (id) {
  var e = prov.entries.filter(function (x) { return x.id === id; })[0];
  ok(!!e && e.grade === 'D' && e.label.indexOf('原版') < 0 && e.tentative === true && e.phase === 'WL-12', '考證條目 ' + id + ' 為 D 級／暫定／WL-12／不標原版');
});
ok(M.D.provenance && M.D.provenance.entries.length === 334, 'data.generated.js 含最新考證表（334 條）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
if (fail) process.exit(1);
