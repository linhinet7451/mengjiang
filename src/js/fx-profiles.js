/* WL-18：武將專屬特效檔案（D 級原創設計，純表現層）
 * 90 名武將每人一組特效設定，ui-battle.js 依出招者查表渲染主動技／無雙／普攻特效。
 * 欄位：[主色 c1, 副色 c2, 彈道 proj, 爆發 burst, 位移 motion, 螢幕 screen]
 *   proj（彈道/揮灑型態）：qi 氣功波／flame 火焰／bolt 雷電／ice 冰晶／petal 花瓣／water 水流／
 *     note 音波／star 星光／poison 毒霧／holy 聖光／ring 衝擊環／claw 爪痕／wind 疾風／
 *     sand 沙塵／blood 血刃／leaf 葉刃
 *   burst（命中爆發形狀）：ring 衝擊環／cross 十字／star 星芒／splash 飛濺／bloom 綻放／
 *     spike 尖刺／globe 光球／crack 裂痕
 *   motion（出招位移風格）：dash 突進／spin 旋身／cast 原地施法／leap 躍起
 *   screen（無雙螢幕效果傾向）：quake 強震／flash 主色閃光／calm 輕
 * 唯一性硬規則：（c1, proj, burst, motion）任兩名武將不得完全相同（tests/unit-wl18.js 斷言）。
 * 本表不參與任何戰鬥計算：不讀寫戰鬥狀態、不取用戰鬥亂數；查不到的 id 一律回安全 fallback。
 */
(function () {
  var P = {
    // —— 蜀漢／關聯 ——
    liubei: ['#f9e79f', '#fef9e0', 'holy', 'ring', 'dash', 'calm'],
    guanyu: ['#2fae5f', '#b8ffd9', 'qi', 'ring', 'dash', 'flash'],
    zhangfei: ['#f9e04b', '#fdf3b0', 'bolt', 'crack', 'dash', 'quake'],
    zhaoyun: ['#cfd8dc', '#f4f7f8', 'qi', 'spike', 'dash', 'flash'],
    machao: ['#76d7c4', '#d2f4ec', 'wind', 'cross', 'dash', 'flash'],
    huangzhong: ['#d98880', '#f6d5cf', 'wind', 'spike', 'cast', 'calm'],
    weiyan: ['#922b21', '#e0a49c', 'blood', 'splash', 'spin', 'calm'],
    huangyueying: ['#ff9f43', '#ffdfba', 'flame', 'ring', 'cast', 'flash'],
    zhugeliang: ['#a9cce3', '#e6f0f8', 'ice', 'star', 'cast', 'flash'],
    liaohua: ['#4e9b47', '#bfe6bb', 'qi', 'ring', 'dash', 'flash'],
    zhoucang: ['#d2691e', '#ffc79a', 'qi', 'splash', 'dash', 'quake'],
    // —— 曹魏／關聯 ——
    caocao: ['#6c3483', '#c9a8dc', 'star', 'crack', 'cast', 'quake'],
    simayi: ['#566573', '#c9d1d7', 'ice', 'globe', 'cast', 'calm'],
    xiahoudun: ['#943126', '#dba49c', 'blood', 'spike', 'dash', 'flash'],
    zhangliao: ['#2e4053', '#aeb9c4', 'wind', 'cross', 'dash', 'flash'],
    xuchu: ['#ca6f1e', '#f2cda3', 'sand', 'crack', 'dash', 'quake'],
    dianwei: ['#b03a2e', '#eda79e', 'blood', 'cross', 'dash', 'quake'],
    caobao: ['#9a7d0a', '#ddd09a', 'qi', 'spike', 'dash', 'calm'],
    caode: ['#b7950b', '#e8d48a', 'note', 'globe', 'cast', 'calm'],
    caoang: ['#f0e68c', '#faf5cd', 'holy', 'cross', 'dash', 'flash'],
    caojie: ['#f5b7b1', '#fdeae8', 'petal', 'ring', 'cast', 'calm'],
    zhenji: ['#5dade2', '#c4e4f7', 'water', 'bloom', 'leap', 'flash'],
    // —— 孫吳／關聯 ——
    sunquan: ['#af7ac5', '#e2ccf0', 'holy', 'ring', 'cast', 'calm'],
    sunce: ['#ff7f2a', '#ffd2a8', 'flame', 'cross', 'dash', 'quake'],
    sunshangxiang: ['#f06292', '#ffd0e0', 'wind', 'spike', 'dash', 'flash'],
    zhouyu: ['#ff5722', '#ffc4b0', 'flame', 'splash', 'cast', 'quake'],
    taishici: ['#48c9b0', '#c4f0e6', 'qi', 'spike', 'spin', 'flash'],
    daqiao: ['#ffb7d5', '#ffe6f1', 'petal', 'bloom', 'cast', 'calm'],
    xiaoqiao: ['#ffe082', '#fff6cf', 'star', 'bloom', 'leap', 'calm'],
    ganning: ['#2e86c1', '#b3d7ef', 'water', 'splash', 'dash', 'flash'],
    // —— 黃巾／群雄 ——
    zhangjiao: ['#ffd21f', '#fff3a0', 'bolt', 'crack', 'cast', 'quake'],
    guanhai: ['#c9a227', '#f7e08a', 'sand', 'crack', 'dash', 'quake'],
    dengmao: ['#9fb86a', '#dce8b8', 'wind', 'spike', 'dash', 'calm'],
    chengyz: ['#b0763a', '#e8c39a', 'sand', 'cross', 'spin', 'quake'],
    huaxiong: ['#c0392b', '#f5a49c', 'blood', 'crack', 'dash', 'quake'],
    lvbu: ['#e53935', '#ffb3ae', 'blood', 'crack', 'dash', 'quake'],
    dongzhuo: ['#a93226', '#e6b0aa', 'flame', 'splash', 'dash', 'quake'],
    yuanshao: ['#d4af37', '#f2e2ac', 'holy', 'ring', 'cast', 'calm'],
    yanliang: ['#784212', '#cba87e', 'qi', 'cross', 'dash', 'quake'],
    aobai: ['#935116', '#dcb58e', 'sand', 'globe', 'dash', 'quake'],
    dingguan: ['#a1887f', '#ddd2cc', 'sand', 'splash', 'dash', 'calm'],
    hantiemo: ['#8d6e63', '#d3c0b8', 'claw', 'splash', 'dash', 'calm'],
    peiys: ['#8a7f5c', '#d8d0b0', 'sand', 'spike', 'leap', 'calm'],
    // —— 武俠群像 ——
    guojing: ['#f4d03f', '#fbeec0', 'qi', 'ring', 'dash', 'quake'],
    huangrong: ['#7cb342', '#d3ecb8', 'leaf', 'cross', 'spin', 'calm'],
    hongqigong: ['#d4ac0d', '#f2e2a0', 'qi', 'cross', 'spin', 'quake'],
    yangguo: ['#5d6d7e', '#c3ccd4', 'water', 'splash', 'dash', 'calm'],
    xiaolongnv: ['#d6eaf8', '#f4faff', 'ice', 'bloom', 'leap', 'calm'],
    huangyaoshi: ['#ec87bf', '#fadcf0', 'leaf', 'bloom', 'cast', 'flash'],
    ouyangfeng: ['#52be80', '#c4eed6', 'poison', 'globe', 'cast', 'quake'],
    zhoubotong: ['#a3e4db', '#e6f8f5', 'wind', 'splash', 'spin', 'calm'],
    meichaofeng: ['#e8e8e8', '#ffffff', 'claw', 'crack', 'leap', 'flash'],
    xiaofeng: ['#e67e22', '#ffd2a3', 'qi', 'cross', 'dash', 'quake'],
    duanyu: ['#f5b041', '#fce3b3', 'star', 'spike', 'cast', 'flash'],
    xuzhu: ['#90caf9', '#dceefc', 'ice', 'cross', 'cast', 'calm'],
    wuyazi: ['#1a5276', '#a8c8de', 'water', 'ring', 'cast', 'calm'],
    tianshan: ['#76b7b2', '#d2edeb', 'ice', 'spike', 'cast', 'flash'],
    liqiushui: ['#85c1e9', '#d9ecfa', 'water', 'ring', 'cast', 'calm'],
    zhangwuji: ['#ff8f00', '#ffd9a0', 'flame', 'globe', 'cast', 'flash'],
    xiaozhao: ['#f8c471', '#fdecc8', 'holy', 'bloom', 'spin', 'calm'],
    linghuchong: ['#4dd0e1', '#c6f2f8', 'wind', 'star', 'leap', 'flash'],
    renyingying: ['#7fb3d5', '#d4e8f5', 'note', 'globe', 'cast', 'calm'],
    renwoxing: ['#4a235a', '#b39dc4', 'star', 'globe', 'dash', 'quake'],
    dongfang: ['#ff2e88', '#ffb3d4', 'petal', 'bloom', 'leap', 'flash'],
    yuebuqun: ['#95a5a6', '#dde3e4', 'wind', 'star', 'leap', 'calm'],
    zuolengchan: ['#7fb3d5', '#d4e8f5', 'ice', 'crack', 'cast', 'flash'],
    miejue: ['#e8c547', '#f9ecb8', 'qi', 'cross', 'dash', 'flash'],
    qiuchuji: ['#f2e6c9', '#fffaf0', 'holy', 'cross', 'dash', 'flash'],
    luzhangke: ['#7fd4ff', '#d8f4ff', 'ice', 'spike', 'cast', 'flash'],
    wangyuyan: ['#aed6f1', '#eaf4fd', 'star', 'globe', 'cast', 'calm'],
    ludayou: ['#7ec8e3', '#d8f2fa', 'wind', 'star', 'leap', 'calm'],
    yuelingshan: ['#f6a8c1', '#ffe0ec', 'petal', 'bloom', 'leap', 'calm'],
    yucanghai: ['#5f9ea0', '#c4e3e4', 'wind', 'cross', 'cast', 'calm'],
    tianbg: ['#e0c060', '#fbeec0', 'sand', 'splash', 'spin', 'calm'],
    baobutong: ['#b565a7', '#ecc2e4', 'note', 'globe', 'cast', 'calm'],
    weixiaobao: ['#58d68d', '#c2f2d8', 'wind', 'splash', 'leap', 'calm'],
    jianning: ['#f1948a', '#ffd9d4', 'wind', 'crack', 'spin', 'flash'],
    azi: ['#9acd32', '#dcf0b0', 'poison', 'splash', 'cast', 'calm'],
    shuanger: ['#66bb6a', '#cdeccd', 'leaf', 'ring', 'leap', 'calm'],
    ake: ['#82e0aa', '#d8f7e6', 'leaf', 'bloom', 'leap', 'calm'],
    limochou: ['#e74c3c', '#fbb3a7', 'poison', 'spike', 'cast', 'flash'],
    caiwenji: ['#c39bd3', '#ecd9f5', 'note', 'ring', 'cast', 'calm'],
    diaochan: ['#ff6fb5', '#ffd2e8', 'petal', 'bloom', 'spin', 'flash'],
    zixia: ['#ba68c8', '#eacdf2', 'star', 'star', 'leap', 'flash'],
    ziyun: ['#bb8fce', '#e8dcf5', 'water', 'ring', 'spin', 'calm'],
    zhizunbao: ['#f39c12', '#fbd9a0', 'star', 'ring', 'spin', 'flash'],
    xiongmao: ['#558b2f', '#c2dcb0', 'leaf', 'splash', 'dash', 'calm'],
    zhurong: ['#ff7043', '#ffd0bd', 'flame', 'spike', 'leap', 'calm'],
    // —— 特殊 ——
    doraemon: ['#29b6f6', '#b3e5fc', 'ring', 'ring', 'cast', 'flash'],
    pikachu: ['#ffeb3b', '#fff9c4', 'bolt', 'star', 'leap', 'flash'],
    // 主角（非 90 將，額外一組）
    lead: ['#ffd54f', '#ffedb0', 'qi', 'star', 'dash', 'flash']
  };
  // 敵方具名首領（以立繪 key 對應；與武將同人者沿用該武將設定，不另列）
  var E = {
    b_zhangbao: ['#b7950b', '#e8d48a', 'sand', 'globe', 'cast', 'quake'],
    b_zhangliang: ['#a67c00', '#dec887', 'sand', 'splash', 'dash', 'quake'],
    b_nanhua: ['#d2b4de', '#f2e6f7', 'star', 'globe', 'cast', 'calm'],
    b_dingchunqiu: ['#76c442', '#d2efb8', 'poison', 'splash', 'cast', 'flash'],
    b_jiumozhi: ['#ff7043', '#ffd0bd', 'flame', 'ring', 'cast', 'flash'],
    b_murongfu: ['#7e8aa2', '#ccd3dd', 'star', 'cross', 'cast', 'calm'],
    b_duanyanqing: ['#616a6b', '#c3c9ca', 'claw', 'crack', 'leap', 'calm'],
    b_lijue: ['#935116', '#dcb58e', 'sand', 'cross', 'dash', 'quake'],
    b_caoren: ['#707b7c', '#ccd1d1', 'qi', 'ring', 'dash', 'calm'],
    b_yanglianting: ['#f1948a', '#ffd9d4', 'petal', 'bloom', 'cast', 'calm'],
    b_huodu: ['#a3b18a', '#dde5cf', 'wind', 'spike', 'leap', 'flash'],
    b_ouyangke: ['#f8bbd0', '#fdeef4', 'petal', 'bloom', 'leap', 'calm'],
    b_dongzhuo: ['#a93226', '#e6b0aa', 'flame', 'splash', 'dash', 'quake'],
    b_hebiweng: ['#7fb3d5', '#d4e8f5', 'ice', 'crack', 'cast', 'flash'],
    b_xiexun: ['#d4ac0d', '#f2e2a0', 'note', 'crack', 'dash', 'quake'],
    b_daerba: ['#b9770e', '#e8cfa0', 'qi', 'globe', 'dash', 'quake'],
    b_menge: ['#808b96', '#d5d9dd', 'wind', 'cross', 'dash', 'quake'],
    b_jinlun: ['#f1c40f', '#fae7a0', 'star', 'ring', 'spin', 'flash'],
    b_zhangliao: ['#2e4053', '#aeb9c4', 'wind', 'cross', 'dash', 'flash'],
    b_renwoxing: ['#4a235a', '#b39dc4', 'star', 'globe', 'dash', 'quake'],
    b_qiuqianren: ['#2471a3', '#aed0e8', 'water', 'splash', 'dash', 'calm'],
    b_dugu: ['#641e16', '#c89a92', 'wind', 'star', 'leap', 'flash']
  };
  var FB = ['#ffd76a', '#fff3c4', 'qi', 'ring', 'dash', 'flash'];
  function norm(a) { return { c1: a[0], c2: a[1], proj: a[2], burst: a[3], motion: a[4], screen: a[5] }; }
  MJ.FX = {
    P: P, E: E,
    // 依武將 id 查表；未知 id 回安全 fallback（金色氣功，絕不回 null、不丟例外）
    of: function (id) { return norm((id && P[id]) || FB); },
    // 依敵方立繪 key（b_*）查表；非具名敵人回 null（呼叫端維持既有模板特效）
    ofArt: function (art) { return (art && E[art]) ? norm(E[art]) : null; },
    fallback: function () { return norm(FB); }
  };
})();
