// WL-11：通天塔 150 層＋無極幻境 200 波（w4／w5）＋成長倍率（D 級原創）。node tests/unit-wl11.js
// 目的：towerScale ×1.15 自 F50 起、wujiScale ×1.08 自 W50 起（只乘攻防血＋絕技 flat，與 bossScale 互斥）；
// TOWER_MAX 150、F150 里程碑、寶石 Lv6、成就 150 階；w4／w5 定義與獎勵、敵池到第 13 章（WL-12 章池上限 min(12,…)）；
// w4 全破、w5 max@90 全破；存檔 v12 不變、零遷移。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh() { var c = load(); c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c = fresh(), M = c.MJ, G = M.G, R = M.R, U = M.U, D = M.D, S = M.S;

console.log('[成長倍率：config 與套用規則]');
ok(D.config.towerScale && D.config.towerScale.mult === 1.15 && D.config.towerScale.from === 50, 'towerScale＝×1.15 自 F50 起');
ok(D.config.wujiScale && D.config.wujiScale.mult === 1.08 && D.config.wujiScale.from === 50, 'wujiScale＝×1.08 自 W50 起');
function ratio(spec, stA, stB, k) { var a = R.enemyUnit(spec, stA), b = R.enemyUnit(spec, stB); return b[k] / a[k]; }
var spec = { e: 'zj_boss', lv: 80, leader: 1 };
var base = { kind: 'normal', ch: 1, depth: 0 };
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, floor: 50 }, 'patk') - 1) < 0.01, '塔 F50 倍率 ×1.00（起點不加倍）');
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, floor: 60 }, 'patk') - 1.15) < 0.02, '塔 F60 倍率 ×1.15');
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, floor: 100 }, 'patk') - Math.pow(1.15, 5)) < 0.03, '塔 F100 倍率 ×2.01（1.15^5）');
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, floor: 150 }, 'patk') - Math.pow(1.15, 10)) < 0.03, '塔 F150 倍率 ×4.05（1.15^10）');
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, wave: 50 }, 'patk') - 1) < 0.01, '幻境 W50 倍率 ×1.00');
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, wave: 120 }, 'patk') - Math.pow(1.08, 7)) < 0.03, '幻境 W120 倍率 ×1.71（1.08^7）');
ok(Math.abs(ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, wave: 200 }, 'patk') - Math.pow(1.08, 15)) < 0.03, '幻境 W200 倍率 ×3.17（1.08^15）');
var hpR = ratio(spec, base, { kind: 'normal', ch: 1, depth: 0, floor: 150 }, 'hp');
ok(Math.abs(hpR - Math.pow(1.15, 10)) < 0.03, '塔倍率亦乘血量（F150 ×4.05）');
var bossBase = R.enemyUnit(spec, { kind: 'boss', ch: 1, depth: 0 }), bossFloor = R.enemyUnit(spec, { kind: 'boss', ch: 1, depth: 0, floor: 60 });
ok(Math.abs(bossFloor.patk / bossBase.patk - 1.15 / 1.2) < 0.03, '塔關不套主線 bossScale（F60 王關只有塔倍率 ×1.15，不含章倍率 ×1.2）');
var mainBase = R.enemyUnit(spec, { kind: 'boss', ch: 1, depth: 0 });
ok(mainBase.patk === R.enemyUnit(spec, { kind: 'boss', ch: 1, depth: 0 }).patk, '主線王關數值不受塔／幻境倍率影響（floor／wave 為 null）');

console.log('[通天塔：上限、獎勵、成就]');
ok(G.TOWER_MAX === 150, 'TOWER_MAX＝150');
var f100 = G.towerFloor(100), f150 = G.towerFloor(150);
ok(f150.kind === 'boss' && f150.enemies.length === 9 && f150.enemies[0].lv === 91, 'F150 王關、9 人、首領 Lv91');
ok(f100.first.items.some(function (it) { return /^gem_[a-z]+_6$/.test(it.item); }), 'F100 起首通寶石為 Lv6（公式 min(6, 1+floor(f/20))，F100 即達 6）');
ok(G.towerFloor(80).first.items.every(function (it) { return !/^gem_[a-z]+_6$/.test(it.item); }), 'F80 首通寶石仍為 Lv5（未達 Lv6 門檻）');
ok(f150.first.gold === 195, 'F150 首通金 195（公式 95＋里程碑 100）');
ok(f150.first.items.some(function (it) { return it.item === G.FRAG && it.n === 15; }), 'F150 登頂里程碑：紫裝碎片 ×15');
ok(G.towerFloor(140).first.items.some(function (it) { return it.item === G.FRAG && it.n === 14; }), 'F140 每 10 層包裝：紫裝碎片 ×14（公式不變）');
var sw150 = (function () { S.state.tower.best = 150; return G.towerSweepReward(); })();
ok(sw150.silver === 22500, '塔俸 best=150 時銀 22,500（公式隨 best 自動漲）');
ok(G.ACH.filter(function (a) { return a.id === 'a_tower'; })[0].tiers.indexOf(150) >= 0, '成就凌雲之志加 150 階');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
S.state.tower.best = 100;
G.lead().lv = 22; // 須達通天塔開啟等級，否則 towerFight 會以「需要主角 N 級」拒絕（與 best 無關）
ok(G.towerFight(7).ok, '舊存檔 best=100 可繼續挑戰第 101 層（零遷移；此隊會敗，但回傳 ok）');

console.log('[無極幻境：w4／w5 定義與獎勵]');
ok(G.WUJI.length === 5, '無極幻境共 5 檔');
var t4 = G.wujiTier('w4'), t5 = G.wujiTier('w5');
ok(t4 && t4.name === '破軍之境' && t4.open === 55 && t4.start === 121 && t4.waves === 40, 'w4 破軍之境：Lv55 開、121–160 波');
ok(t5 && t5.name === '無雙之境' && t5.open === 65 && t5.start === 161 && t5.waves === 40, 'w5 無雙之境：Lv65 開、161–200 波');
ok(t4.first.gold === 300 && t5.first.gold === 500, 'w4／w5 首破金 300／500');
ok(t4.bonus.items.some(function (it) { return it.item === 'gem_atk_4'; }) && t5.bonus.items.some(function (it) { return it.item === 'gem_hp_5'; }), 'w4／w5 全破 bonus 寶石每檔 +1（atk_4／hp_5）');
ok(G.wujiLv(200) === 90 && G.wujiLv(121) === 62, '幻境等級：W121 Lv62、W200 Lv90（封頂）');
var w200 = G.wujiWave(t5, 39, 1), w181 = G.wujiWave(t5, 20, 1), w121 = G.wujiWave(t4, 0, 1), w120 = G.wujiWave(G.wujiTier('w3'), 39, 1);
ok(w200.wave === 200 && w200.kind === 'boss' && w200.enemies.length === 9, 'W200 王波、9 人');
ok(w121.bg !== w120.bg && w181.bg !== w121.bg && w200.bg === w181.bg, '敵池隨波次推進：W120 第 8 章 → W121 第 9 章 → W181／W200 第 13 章（WL-12 章池上限 min(12,…)）');
ok(G.wujiMilestone(200).gold === 100 && G.wujiMilestone(150).gold === 75, '里程碑金：W150 75、W200 100（公式不變）');

console.log('[全程實測：w4／w5（max 隊）]');
function maxTeam(L) { // 理論最高隊伍（仿 balance.js max 檔）：最高品質、Lv54 紫裝、強化＝Lv、技能 10、圖鑑 87、培養拉滿、5 星
  var s = S.state;
  G.lead().lv = L; G.lead().sk = { a: 10, u: 10, p: 10 }; G.lead().star = 5;
  var py = Math.floor(10 + 1.5 * L); G.lead().py = { str: py, int: py, agi: py, con: py };
  s.player.leadQ = L < 20 ? 2 : L < 60 ? 3 : 4;
  s.team.cells = {}; s.team.cells[4] = G.lead().uid; // 主角放中排中間（先清空：新存檔預設 3 人在 0／3／6 格，直接覆寫會把主角擠下場）
  var order = [1, 7, 0, 6, 2, 8, 3, 5];
  ['zhaoyun', 'guanyu', 'zhangfei', 'huangzhong', 'machao', 'diaochan'].forEach(function (id, i) {
    var h = G.newHero(id, s); h.lv = L; h.sk = { a: 10, u: 10, p: 10 }; h.star = 5; h.py = { str: py, int: py, agi: py, con: py };
    s.heroes.push(h); s.team.cells[order[i]] = h.uid;
  });
  function gear(h) {
    var dt = h.id === 'lead' ? 'p' : (R.heroDef(h.id).type.charAt(0) === '力' ? 'p' : R.heroDef(h.id).type.charAt(0) === '智' ? 'm' : 'j');
    U.each(R.SLOTS, function (slot) {
      var best = null;
      U.each(D.equipment.list, function (e) { if (e.slot !== slot || e.lv > 54) return; if (slot === 'weapon' && e.id.charAt(1) !== dt) return; if (!best || e.lv > best.lv) best = e; });
      if (best) h.eq[slot] = { uid: 0, t: best.id, q: 3, plus: L, aff: [], gems: [] };
    });
  }
  s.heroes.forEach(function (h) { gear(h); });
  for (var n = 0; n < 87; n++) s.codex['sim' + n] = 1;
}
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
maxTeam(80);
var r4 = G.wujiRun('w4', 7);
ok(r4.ok && r4.full && r4.cleared === 40, 'max@80 全破 w4（40/40）');
ok(r4.firstRewards && S.state.player.gold >= 300, 'w4 首破金 300 入帳');
c = fresh(); M = c.MJ; G = M.G; R = M.R; U = M.U; D = M.D; S = M.S;
maxTeam(90);
var r5 = G.wujiRun('w5', 7);
ok(r5.ok && r5.full && r5.cleared === 40, 'max@90 全破 w5（40/40，新頂可通關）');
ok(r5.firstRewards && S.state.player.gold >= 500, 'w5 首破金 500 入帳');

console.log('[存檔相容：v12 不變]');
ok(M.S.VERSION === 12, '存檔版本仍為 v12（零遷移、零新欄位）');
var c2 = fresh();
ok(c2.MJ.S.state.wuji.first.w4 == null && c2.MJ.S.state.wuji.first.w5 == null, '新存檔無 w4／w5 首破鍵（首次通關時自動新增）');

console.log('[考證]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
ok(prov.entries.length === 313, '考證表共 313 條（310＋3）');
ok(prov.entries.filter(function (e) { return e.grade === 'D'; }).length === 147, 'D 級 147 條');
['balance.towerScale', 'balance.wujiScale', 'wuji.w4w5', 'reward.towerTop150', 'reward.towerGem6', 'reward.wujiW4W5', 'ach.tower150'].forEach(function (id) {
  var e = prov.entries.filter(function (x) { return x.id === id; })[0];
  ok(!!e && e.grade === 'D' && e.label.indexOf('原版') < 0 && e.tentative === true && e.phase === 'WL-11', '考證條目 ' + id + ' 為 D 級／暫定／WL-11／不標原版');
});
ok(M.D.provenance && M.D.provenance.entries.length === 313, 'data.generated.js 含最新考證表（313 條）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
if (fail) process.exit(1);
