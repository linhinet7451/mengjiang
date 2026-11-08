/* 存檔：LocalStorage 自動存檔、手動存檔、匯出/匯入（含驗證）、重置、版本遷移 */
MJ.S = (function () {
  var S = {}, U = MJ.U;
  S.KEY = 'mjws_save';
  S.BACKUP_KEY = 'mjws_save_backup';
  S.VERSION = 12; // v12=P4-3 生死劫進度；v11=P3-3～P3-5（開放等級、經驗來源表、將星組合／魂量與舊星盤退款）；v10=網路資料搜查-2 P2（陣法 8 格、被動兩格、連攜、補將） v9=網路資料搜查-2 還原（品質類型修正、被動兩格、陣法、連攜、經驗表、合成公式、六等範圍） v8=P5（8 部位、主角升階、上古寶窟、等級上限 90） v7=P4（被動擴充、新屬性、PVP 戰報） v6=P3（將魂合成、榮譽培養、敏耐轉型） v1=第一階段 v2=第二階段養成 v3=第三階段副本與經濟 v4=第四階段音效與拜訪武將 v5=原版還原 P2（取消精力與現實時間等待）
  S.RELEASE = '正式版（第五階段＋奇遇）';
  S.APP = 'mengjiang-remake';
  S.state = null;
  S.lastSave = 0;
  S.storageOk = true;

  function ls() { try { return window.localStorage; } catch (e) { return null; } }
  S.storageAvailable = function () {
    var s = ls(); if (!s) return false;
    try { s.setItem('__mj_t', '1'); s.removeItem('__mj_t'); return true; } catch (e) { return false; }
  };
  // 驗證：回傳錯誤訊息陣列，空陣列代表通過
  S.validate = function (st) {
    var err = [];
    function need(cond, msg) { if (!cond) err.push(msg); }
    need(st && typeof st === 'object', '存檔不是物件');
    if (err.length) return err;
    need(typeof st.version === 'number', '缺少版本號 version');
    need(st.version <= S.VERSION, '存檔版本 ' + st.version + ' 比遊戲新，無法讀取');
    need(st.player && typeof st.player.name === 'string', '缺少玩家資料');
    if (st.player) {
      need(typeof st.player.gold === 'number' && st.player.gold >= 0, '金幣數值錯誤');
      need(typeof st.player.silver === 'number' && st.player.silver >= 0, '銀幣數值錯誤');
      need(typeof st.player.energy === 'number' && st.player.energy >= 0, '精力數值錯誤');
    }
    need(U.isArray(st.heroes) && st.heroes.length > 0, '武將列表錯誤');
    if (U.isArray(st.heroes)) {
      var hasLead = false, uids = {};
      U.each(st.heroes, function (h) {
        if (!h || typeof h.uid !== 'number' || typeof h.lv !== 'number' || h.lv < 1) { err.push('武將資料格式錯誤'); return; }
        if (uids[h.uid]) err.push('武將編號重複'); uids[h.uid] = 1;
        if (h.id === 'lead') hasLead = true;
        else if (MJ.D && !MJ.D.heroIndex[h.id]) err.push('未知武將：' + h.id);
      });
      need(hasLead, '缺少主角');
    }
    need(st.team && st.team.cells && typeof st.team.formation === 'string', '陣容資料錯誤');
    need(st.bag && U.isArray(st.bag.equips) && st.bag.stack && typeof st.bag.stack === 'object', '包裹資料錯誤');
    need(st.stages && typeof st.stages === 'object', '關卡資料錯誤');
    return err;
  };
  // 預設欄位（可重複呼叫、不覆蓋既有值）
  function def(o, k, v) { if (o[k] == null) o[k] = v; return o[k]; }
  S.equipDefaults = function (e) { if (!e) return e; def(e, 'plus', 0); def(e, 'aff', []); def(e, 'gems', []); return e; };
  S.heroDefaults = function (h) {
    def(h, 'eq', {}); def(h, 'sk', { a: 1, u: 1, p: 1 }); def(h, 'py', { str: 0, int: 0, agi: 0, con: 0 }); def(h, 'xf', []); def(h, 'star', 0); def(h, 'jxLevel', 0);
    U.each(U.keys(h.eq), function (k) { S.equipDefaults(h.eq[k]); });
    return h;
  };
  S.applyDefaults = function (st) {
    def(st, 'codex', {}); def(st, 'jiangxing', { lit: 0, pts: 0 }); def(st, 'buildingUnlocks', {});
    def(st, 'counters', {});
    if (st.player) def(st.player, 'xinghun', 0);
    if (st.settings) def(st.settings, 'econ', st.settings.energyMode === 'fast' ? 'fast' : 'std');
    if (st.buildings) def(st.buildings, 'shenbing', 1);
    U.each(st.heroes || [], function (h) {
      if (!h) return;
      if (U.isArray(h.xf) && h.xf.length > 2 && !h.xfOverflowReturned) {
        var old = h.xf.splice(2), returned = 0;
        h.xfOverflow = (h.xfOverflow || []).concat(old);
        st.bag = st.bag || { stack: {}, equips: [] }; st.bag.stack = st.bag.stack || {};
        U.each(old, function (x) { if (x && x.id) { st.bag.stack['xf_' + x.id] = (st.bag.stack['xf_' + x.id] || 0) + 1; returned++; } });
        h.xfOverflowReturned = true;
        st.migrateNotes = (st.migrateNotes || []).concat(['P4-2：' + (h.name || h.id) + ' 的舊第三格心法已退回秘笈 ×' + returned + '，原資料保留於 xfOverflow。']);
      }
      S.heroDefaults(h); if (h.id !== 'lead') st.codex[h.id] = 1;
    });
    if (st.bag && st.bag.equips) U.each(st.bag.equips, S.equipDefaults);
    U.each(st.mail || [], function (m) { if (m && m.att && m.att.equips) U.each(m.att.equips, S.equipDefaults); });
    if (S.extraDefaults) U.each(S.extraDefaults, function (f) { f(st); });
    return st;
  };
  // 版本升級步驟：S.STEPS[n] 把 vn 轉成 vn+1
  S.STEPS = {
    1: function (st) { if (st.settings && st.settings.energyMode == null) st.settings.energyMode = 'original'; },
    2: function (st) { if (st.settings && st.settings.econ == null) st.settings.econ = st.settings.energyMode === 'fast' ? 'fast' : 'std'; },
    3: function (st) { if (st.settings) { if (st.settings.bgm == null) st.settings.bgm = true; if (st.settings.sfx == null) st.settings.sfx = true; } },
    4: S.stepV5 = function (st) { // v4→v5：取消精力、冷卻、每日次數與現實時間等待
      if (st.recruit) { st.recruit.cd = {}; st.recruit.normalUsed = 0; }
      st.tickets = st.tickets || {}; // 空白＝所有「歷練點」獎勵立刻可領
      // 訓練中的武將：依已經過時間（最多 8 小時，舊規則）直接結算經驗
      if (st.training && st.heroes) {
        var tr = st.training, h = null, lead = null, R = MJ.R;
        U.each(st.heroes, function (x) { if (x.uid === tr.uid) h = x; if (x.id === 'lead') lead = x; });
        if (h && R) {
          var nw = U.now ? U.now() : Date.now(), min = Math.max(0, Math.min(480, Math.floor((nw - (tr.ts || nw)) / 60000)));
          var rate = Math.floor((h.lv * 2 + 4) * (1 + 0.1 * (((st.buildings && st.buildings.shenwu) || 1) - 1)));
          var cap = h.id === 'lead' ? R.maxLevel : Math.min(R.maxLevel, lead ? lead.lv : R.maxLevel);
          h.exp = (h.exp || 0) + min * rate;
          while (h.lv < cap && h.exp >= R.expNeed(h.lv)) { h.exp -= R.expNeed(h.lv); h.lv++; }
          if (h.lv >= cap && h.exp >= R.expNeed(h.lv)) h.exp = R.expNeed(h.lv) - 1;
          st.migrateNotes = (st.migrateNotes || []).concat(['訓練結算：經驗 +' + (min * rate)]);
        }
        st.training = null;
      }
      // 簽到改為依序計次
      if (st.sign && st.sign.days) { var n = st.sign.days.length, d = []; for (var i = 1; i <= n; i++) d.push(i); st.sign.days = d; }
      if (st.daily && st.daily.round == null) st.daily.round = 1;
    },
    10: function (st) { // v10→v11：原版組合資料、將星魂等級與舊二十八宿餘額退款
      var j = st.jiangxing || { lit: 0, pts: 0 }, rawLit = j.lit || 0, lit = Math.floor(rawLit), refund = 0, lead = null;
      if (lit < 0 || lit > 56 || lit !== rawLit) throw new Error('舊星盤點亮數超出 0–56，停止升版以免退款錯誤');
      if (lit > 0 && !st.player) throw new Error('舊存檔缺少玩家資源欄位，停止升版以免遺失星魂退款');
      if (!j.migratedV11) {
        for (var i = 0; i < lit; i++) refund += 10 + 8 * i; // v10 舊本作：costBase 10 + costStep 8 × index
        if (st.player) st.player.xinghun = (st.player.xinghun || 0) + refund;
        j.legacyStarsRefunded = lit; j.legacySoulRefunded = refund; j.migratedV11 = true;
        if (lit || refund) st.migrateNotes = (st.migrateNotes || []).concat(['P3-5：舊二十八宿已點亮 ' + lit + ' 顆，依原本作成本退回 ' + refund + ' 星魂；既有星魂餘額保留。']);
      }
      j.lit = 0;
      U.each(st.heroes || [], function (h) { if (h && h.id === 'lead') lead = h; });
      st.buildingUnlocks = st.buildingUnlocks || {};
      if (lit > 0 || (lead && lead.lv >= 16)) st.buildingUnlocks.jiangxing = true; // 舊版 16 級門檻下已能進入者不被新門檻鎖回
      st.jiangxing = j;
      U.each(st.heroes || [], function (h) { if (h) { if (h.jxLevel == null) h.jxLevel = 0; } });
      st.migrateNotes = (st.migrateNotes || []).concat(['P3-3：已保留舊版將星錄存取權；既有主角等級／經驗不降級或清除。']);
    }
  };
  // 遷移：舊版本存檔逐步升級
  S.migrate = function (st) {
    if (!st || typeof st !== 'object') return st;
    if (!st.version) st.version = 1;
    if (st.version > S.VERSION) return st; // 交給 validate 回報
    if (st.version < S.VERSION && !st.migratedFrom) st.migratedFrom = st.version;
    // 逐版升級步驟（每一步只做該版本需要的轉換；欄位補齊統一交給 applyDefaults）
    for (var v = st.version; v < S.VERSION; v++) {
      if (S.STEPS[v]) {
        try { S.STEPS[v](st); }
        catch (e) { st.version = v; throw new Error('v' + v + '→v' + (v + 1) + ' 存檔遷移失敗：' + (e && e.message || e)); }
      }
      st.version = v + 1;
    }
    try { S.applyDefaults(st); }
    catch (e2) { throw new Error('存檔欄位補齊失敗：' + (e2 && e2.message || e2)); }
    st.version = S.VERSION;
    return st;
  };
  S.wrap = function (st) {
    return { app: S.APP, version: S.VERSION, savedAt: Date.now(), data: st };
  };
  S.parse = function (text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, errors: ['不是有效的 JSON 檔案'] }; }
    if (!obj || obj.app !== S.APP || !obj.data) return { ok: false, errors: ['不是《猛將無雙》重製版的存檔'] };
    var st;
    try { st = S.migrate(obj.data); }
    catch (e) { return { ok: false, errors: [e && e.message || '存檔遷移失敗'] }; }
    var errs = S.validate(st);
    if (errs.length) return { ok: false, errors: errs };
    return { ok: true, state: st, savedAt: obj.savedAt };
  };
  S.save = function (manual) {
    if (!S.state) return false;
    var s = ls();
    if (!s) { S.storageOk = false; return false; }
    try {
      var text = JSON.stringify(S.wrap(S.state));
      if (manual) { var old = s.getItem(S.KEY); if (old) s.setItem(S.BACKUP_KEY, old); }
      s.setItem(S.KEY, text);
      S.lastSave = Date.now(); S.storageOk = true;
      return true;
    } catch (e) { S.storageOk = false; return false; }
  };
  S.load = function () {
    var s = ls(); if (!s) return { ok: false, none: true };
    var text = null;
    try { text = s.getItem(S.KEY); } catch (e) { }
    if (!text) return { ok: false, none: true };
    var r = S.parse(text);
    if (!r.ok) {
      // 主存檔損壞時嘗試備份
      var b = null; try { b = s.getItem(S.BACKUP_KEY); } catch (e2) { }
      if (b) { var rb = S.parse(b); if (rb.ok) { rb.fromBackup = true; return rb; } }
    }
    return r;
  };
  S.exportText = function () { return JSON.stringify(S.wrap(S.state), null, 1); };
  S.reset = function () {
    var s = ls();
    if (s) { try { s.removeItem(S.KEY); s.removeItem(S.BACKUP_KEY); } catch (e) { } }
    S.state = null;
  };
  return S;
})();
