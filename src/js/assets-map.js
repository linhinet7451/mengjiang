/* 角色美術對應：武將 h_id、主角 c_lead_m 或 c_lead_f、敵方雜兵 g_ 與首領 b_（原創 AI 生成，見 docs/美術素材來源.md） */
(function () {
  var E = {
    hj_bing: 'g_ytsoldier', hj_lishi: 'g_ytbrute', hj_shushi: 'g_ytsorcerer', zhangbao: 'g_ytgeneral', zhangliang: 'g_ytgeneral', zj_boss: 'h_zhangjiao', nanhua: 'g_elder',
    mt_jiading: 'g_guard', mr_jiachen: 'g_guard', xx_dizi: 'g_assassin', ry_anqi: 'g_assassin', hs_baituo: 'g_assassin', mt_shinv: 'g_maid',
    e_dingchunqiu: 'b_dingchunqiu', e_jiumozhi: 'b_jiumozhi', murongfu: 'b_murongfu', duanyanqing: 'b_duanyanqing',
    xl_qibing: 'g_cavalry', mg_qibing: 'g_cavalry', cj_hubaoqi: 'g_cavalry', e_lijue: 'g_cavalry',
    xl_gongshou: 'g_archer', mg_sheshou: 'g_archer', cj_nushou: 'g_archer',
    dz_qinwei: 'g_halberd', ry_hufa: 'g_halberd', e_caoren: 'g_halberd',
    lj_moushi: 'g_strategist', cj_moushi: 'g_strategist', e_yanglianting: 'g_strategist', e_huodu: 'g_strategist', e_ouyangke: 'g_strategist',
    cj_shuibing: 'g_spearman', e_huaxiong: 'h_huaxiong', b_lvbu: 'h_lvbu', b_dongzhuo: 'b_dongzhuo',
    mj_jiaozhong: 'g_cultist', ry_jiaozhong: 'g_cultist', hs_tiezhang: 'g_cultist', e_xiangwentian: 'g_cultist',
    em_dizi: 'g_discf', kl_dizi: 'g_discm', wd_dizi: 'g_discm', hs_jianke: 'g_discm',
    e_luzhangke: 'h_luzhangke', e_hebiweng: 'h_luzhangke', b_miejue: 'h_miejue', xiexun: 'b_xiexun',
    mg_lama: 'g_lama', e_daerba: 'g_lama', mg_wushi: 'g_mongol', b_menge: 'g_mongol', b_jinlun: 'b_jinlun',
    e_zhangliao: 'b_zhangliao', b_caocao: 'h_caocao', b_simayi: 'h_simayi', b_renwoxing: 'b_renwoxing', b_dongfang: 'h_dongfang',
    ry_zhanglao: 'g_elder', hs_yinshi: 'g_elder', e_qiuqianren: 'g_elder', b_ouyangfeng: 'h_ouyangfeng', b_dugu: 'b_dugu'
  };
  MJ.ART_ENEMY = E;
  if (!MJ.D) return;
  var A = MJ.ASSETS || {}, i, k, L = MJ.D.heroes && MJ.D.heroes.list;
  // web2-P2：與既有首領同一人的新武將（董卓、張遼、任我行）沿用首領立繪（同一份原創圖，不重複打包）
  if (L) for (i = 0; i < L.length; i++) if (L[i].artAlias && A[L[i].artAlias] && !A['h_' + L[i].id]) U3(L[i].id, L[i].artAlias);
  function U3(id, al) { A['h_' + id] = A[al]; if (A[al + '_av']) A['h_' + id + '_av'] = A[al + '_av']; if (A[al + '_ci']) A['h_' + id + '_ci'] = A[al + '_ci']; }
  if (L) for (i = 0; i < L.length; i++) if (A['h_' + L[i].id] && L[i].look && !L[i].look.art) L[i].look.art = 'h_' + L[i].id;
  var en = MJ.D.stages && MJ.D.stages.enemies;
  if (en) for (k in en) if (en.hasOwnProperty(k) && E[k] && A[E[k]]) en[k].art = E[k];
})();
