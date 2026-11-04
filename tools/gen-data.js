// 產生 src/data/*.json（資料來源等級見 docs/資料考證.md）
// 本腳本只是方便維護；遊戲實際讀取的是輸出的 JSON。
var fs = require('fs');
var path = require('path');
var OUT = path.join(__dirname, '..', 'src', 'data');

// ---- 武將 ----
// q: 0黑 1白 2綠 3藍 4紫 ; t: 力敏/力耐/智敏/智耐 ; souls: 招募所需將魂數
// L: 外觀 [性別, 膚色, 髮色, 髮型, 鬍鬚, 衣色, 飾色, 武器]
// a/u: 主動技 / 無雙技  [名稱, 範圍, 倍率, 固定值, 附加效果]
// p: 被動技 ; g: 等級 (資料可信度)
var H = [
 // 黑
 ['guanhai','管亥','三國',0,'力耐',['m','#e7b98f','#2b1d14','headband','short','#8a6a2c','#e8c547','blade'],['亂斬','single',1.0,0],['黃巾怒擊','line2',1.6,30],null,'D'],
 ['dengmao','鄧茂','三國',0,'力敏',['m','#e2b089','#1d1a17','headband','none','#7b5a2a','#e8c547','spear'],['突刺','single',1.0,0],['連環刺','line2',1.6,30],null,'D'],
 ['chengyz','程遠志','三國',0,'力耐',['m','#d9a77f','#251b13','headband','long','#6c4f22','#e8c547','halberd'],['橫掃','single',1.0,0],['破陣斬','col2',1.5,30],null,'D'],
 ['ludayou','陸大有','笑傲江湖',0,'力敏',['m','#f0c49c','#1b1b1b','topknot','none','#4d6f8f','#d8d8d8','sword'],['華山劍法','single',1.0,0],['有鳳來儀','line2',1.6,30],null,'D'],
 // 白
 ['liaohua','廖化','三國',1,'力耐',['m','#e3b38c','#1e1812','topknot','goatee','#6a3b2a','#c9a24a','blade'],['先鋒斬','single',1.05,0],['蜀漢先鋒','line2',1.7,40],null,'D'],
 ['zhoucang','周倉','三國',1,'力耐',['m','#c98e65','#120d0a','bald','long','#3a3a3a','#b88b3a','blade'],['扛刀擊','single',1.05,0],['關前斬','col2',1.6,40],null,'D'],
 ['peiys','裴元紹','三國',1,'力敏',['m','#e0ad86','#2a1e15','headband','short','#5b6b3a','#e8c547','spear'],['山寨槍法','single',1.05,0],['奪命槍','line2',1.7,40],null,'D'],
 ['tianbg','田伯光','笑傲江湖',1,'力敏',['m','#efc39b','#1a1512','ponytail','short','#7a2e2e','#e0c070','blade'],['快刀','single',1.05,0],['飛沙走石十三式','line2',1.8,40],null,'D'],
 ['yucanghai','余滄海','笑傲江湖',1,'智敏',['m','#ecc29b','#2a2a2a','taoist','goatee','#2f4f6f','#c0c0c0','sword'],['松風劍法','single',1.05,0],['摧心掌','single',2.2,40],null,'D'],
 ['baobutong','包不同','天龍八部',1,'智耐',['m','#eabf98','#262626','topknot','short','#5c4a7a','#d4b36a','fan'],['非也掌','single',1.05,0],['以彼之道','col2',1.6,40],null,'D'],
 // 綠（六大天王：張角 邱處機 岳靈珊 鹿杖客 華雄 蔡文姬 —— B）
 ['zhangjiao','張角','三國',2,'力耐',['m','#e3b08a','#3a2d20','headband','long','#c9a227','#7a3b12','staff'],['黃天咒擊','single',1.1,0],['蒼天已死','col3',1.5,60],null,'B'],
 ['qiuchuji','邱處機','射鵰英雄傳',2,'力耐',['m','#efc6a2','#d9d9d9','taoist','long','#e8e2d0','#4a6a8a','sword'],['全真劍法','single',1.1,0],['天罡北斗陣','cross',1.4,60],null,'B'],
 ['yuelingshan','岳靈珊','笑傲江湖',2,'智耐',['f','#f6d3b6','#2a1a14','bun','none','#d77fb0','#f5e2a8','sword'],['玉女劍十九式','single',1.1,0],['沖靈劍法','line2',1.7,60],null,'B'],
 ['luzhangke','鹿杖客','倚天屠龍記',2,'智耐',['m','#d8a47c','#bfbfbf','bald','long','#4a3b2a','#8a8a8a','staff'],['鹿角杖擊','single',1.1,0],['玄冥神掌','col2',1.7,60],null,'B'],
 ['huaxiong','華雄','三國',2,'力耐',['m','#c88d63','#160f0b','helmet','long','#6b2a1f','#c9a24a','blade'],['西涼刀法','single',1.1,0],['汜水關斬','line2',1.8,60],'liaoshang','B'],
 ['caiwenji','蔡文姬','三國',2,'智敏',['f','#f8d8bf','#1f1a26','long','none','#7aa6c9','#f0e6c8','qin'],['胡笳音刃','line2',1.0,0],['胡笳十八拍','col3',1.45,60],null,'B'],
 ['weixiaobao','韋小寶','鹿鼎記',2,'智耐',['m','#f4cfaa','#1b1b1b','cap','none','#3e6fae','#f2d16b','dagger'],['神行百變','line2',0.95,0],['匕首亂刺','line2',1.25,80],null,'B'],
 ['jianning','建寧公主','鹿鼎記',2,'智敏',['f','#f9dac4','#120f12','crown','none','#c94a6a','#f2d16b','whip'],['金枝玉鞭','single',1.25,0],['刁蠻鞭法','single',2.0,80,{'armorBreak':0.5}],null,'B'],
 ['wangyuyan','王語嫣','天龍八部',2,'智耐',['f','#fbe0cd','#2a1b22','long','none','#e9e2f0','#a98bd8','none'],['武學指點','single',1.3,0],['神仙姊姊','col2',1.45,80],null,'B'],
 ['sunce','孫策','三國',2,'力敏',['m','#f0c7a0','#2c1a12','helmet','none','#b03a2e','#e8c547','spear'],['霸王槍','single',1.25,0],['江東小霸王','line2',1.5,80],null,'B'],
 ['taishici','太史慈','三國',2,'力敏',['m','#e7b993','#1a120d','topknot','short','#3c6e4a','#e8c547','halberd'],['雙戟擊','single',1.25,0],['神亭酣戰','line2',2.0,80],null,'B'],
 ['liqiushui','李秋水','天龍八部',2,'智敏',['f','#fde6d6','#e5e5f0','veil','none','#bfd7ef','#7f9fbf','none'],['白虹掌力','single',1.25,0],['小無相功','line2',2.0,80],null,'B'],
 // 藍（品質為推估 C）
 ['dongfang','東方不敗','笑傲江湖',3,'智敏',['f','#f7d6c4','#1a1015','long','none','#c2185b','#f2d16b','needle'],['繡花針','diag',1.3,0],['葵花寶典','diag',2.2,120],null,'C'],
 ['azi','阿紫','天龍八部',3,'智敏',['f','#fbe0cd','#2a1430','twin','none','#7b3fa0','#e6c3f0','whip'],['化功毒掌','single',1.35,0],['神木王鼎','cross',1.6,120],'xixue','C'],
 ['shuanger','雙兒','鹿鼎記',3,'力敏',['f','#fbe0cd','#1a1a1a','twin','none','#6aa384','#f5e2a8','sword'],['燕青拳','single',1.35,0],['護主心切','line2',1.9,120],null,'C'],
 ['miejue','滅絕師太','倚天屠龍記',3,'智耐',['f','#f0d0b8','#e0e0e0','hood','none','#3b3b3b','#c0c0c0','sword'],['峨嵋劍法','single',1.35,0],['倚天劍斬','line3',1.6,120],null,'C'],
 ['huangyueying','黃月英','三國',3,'智耐',['f','#f6d3b6','#3a2418','bun','none','#8a6d3b','#e8c547','fan'],['木牛流馬','single',1.35,0],['連弩機關','col3',1.5,120],null,'C'],
 ['daqiao','大喬','三國',3,'智敏',['f','#fbe0cd','#2a1a22','bun','none','#e57373','#fce4ec','fan'],['國色扇','single',1.35,0],['傾國之舞','col2',1.8,120],null,'C'],
 ['xiaoqiao','小喬','三國',3,'智敏',['f','#fbe0cd','#3a1a1a','twin','none','#f48fb1','#fff3e0','fan'],['流螢扇','single',1.35,0],['天香紅袖','col2',1.8,120],null,'C'],
 ['huangrong','黃蓉','射鵰英雄傳',3,'智敏',['f','#fbe0cd','#1f1a14','bun','none','#4fa36a','#f5e2a8','staff'],['打狗棒法','single',1.35,0],['天下無狗','line2',1.9,120],null,'C'],
 // 紫 30 魂（令狐沖 周瑜 張無忌 —— B）
 ['linghuchong','令狐沖','笑傲江湖',4,'力敏',['m','#efc6a2','#1a1512','ponytail','none','#3b5a7a','#d8d8d8','sword'],['獨孤九劍','single',1.43,0],['破劍式','line2',1.74,160],null,'B'],
 ['zhouyu','周瑜','三國',4,'智耐',['m','#f4cfaa','#1b120e','topknot','none','#c62828','#f2d16b','fan'],['羽扇綸巾','single',1.44,0],['赤壁火攻','col3',1.45,160],null,'B'],
 ['zhangwuji','張無忌','倚天屠龍記',4,'力敏',['m','#f0c7a0','#1b1b1b','topknot','none','#e0e0e0','#c62828','none'],['九陽神功','line2',1.6,0],['乾坤大挪移','line2',1.45,160],'huizhan','B'],
 // 紫 45 魂（貂蟬 呂布 小龍女 孫尚香 郭靖 諸葛亮 楊過 馬超 —— B；趙雲 關羽 張飛 劉備 —— C）
 ['diaochan','貂蟬','三國',4,'智敏',['f','#fde3d3','#1a1015','bun','none','#e91e63','#ffd54f','fan'],['閉月','line3',1.5,0,{'stun':0.3}],['傾城一舞','line3',2.2,200,{'stun':0.5}],'xinu','B'],
 ['lvbu','呂布','三國',4,'力敏',['m','#e7b993','#120c0a','helmet','none','#5d1f1f','#ffca28','halberd'],['方天畫戟','line3',1.5,0],['無雙亂舞','line3',2.3,200],'lianzhan','B'],
 ['zhurong','祝融夫人','三國',3,'力敏',['f','#e8b48a','#3a1a10','ponytail','none','#c62828','#ffb300','dagger'],['飛刀','single',1.4,0],['烈焰飛刀','line2',1.9,150],null,'C'],
 ['xiaolongnv','小龍女','神鵰俠侶',4,'智敏',['f','#fff0e6','#151515','long','none','#f5f5f5','#b3e5fc','sword'],['玉女素心劍','single',1.6,0],['玉蜂針','all',1.2,150],null,'B'],
 ['sunshangxiang','孫尚香','三國',4,'力耐',['f','#f8d8bf','#4a2a14','ponytail','none','#d84315','#ffd54f','bow'],['弓腰姬','col3',1.25,0,{'buffDef':0.2}],['梟姬亂箭','col3',1.9,200,{'buffDef':0.2}],'lianzhan','B'],
 ['guojing','郭靖','射鵰英雄傳',4,'力耐',['m','#e7b993','#1b1b1b','topknot','short','#8d6e63','#ffd54f','none'],['降龍十八掌','line2',1.45,0],['亢龍有悔','line3',2.0,200],'rexue','B'],
 ['zhugeliang','諸葛亮','三國',4,'智耐',['m','#f4cfaa','#1b1b1b','guan','long','#eceff1','#5c6bc0','fan'],['八陣圖','cross',1.3,0],['借東風','all',1.3,180],null,'B'],
 ['yangguo','楊過','神鵰俠侶',4,'力耐',['m','#f0c7a0','#151515','long','none','#455a64','#cfd8dc','sword'],['玄鐵重劍','line2',1.5,0],['黯然銷魂掌','cross',2.0,200],'suxing','B'],
 ['machao','馬超','三國',4,'力敏',['m','#f0c7a0','#2a1a12','helmet','none','#eceff1','#90a4ae','spear'],['錦馬超','line2',1.5,0],['西涼鐵騎','line3',2.0,200],'huizhan','B'],
 ['zhaoyun','趙雲','三國',4,'力敏',['m','#f4cfaa','#1b1b1b','helmet','none','#e3f2fd','#64b5f6','spear'],['龍膽槍','line3',1.45,0],['七進七出','line3',2.2,200],null,'C'],
 ['guanyu','關羽','三國',4,'力耐',['m','#b5502f','#0d0d0d','guan','long','#2e7d32','#ffd54f','blade'],['青龍偃月','line2',1.5,0],['武聖斬','col3',2.0,200],null,'C'],
 ['zhangfei','張飛','三國',4,'力耐',['m','#a8714f','#0d0d0d','headband','long','#263238','#ffca28','spear'],['丈八蛇矛','line2',1.5,0],['長坂怒吼','col3',1.8,200,{'stun':0.3}],null,'C'],
 ['renyingying','任盈盈','笑傲江湖',3,'智敏',['f','#fbe0cd','#151515','veil','none','#37474f','#b39ddb','qin'],['碧落琴音','line2',1.35,0],['清心普善咒','healAll',0.5,120],null,'A(登場) C(數值)'],
 ['hongqigong','洪七公','射鵰英雄傳',4,'力耐',['m','#e0b08a','#cfcfcf','topknot','long','#8d6e63','#c5e1a5','staff'],['打狗棒法','line2',1.45,0],['亢龍有悔','cross',2.0,200],'rexue','A(登場) C(數值)'],
 ['meichaofeng','梅超風','射鵰英雄傳',3,'力敏',['f','#e8d0c0','#151515','long','none','#4a148c','#9e9e9e','none'],['白骨抓','single',1.4,0],['九陰白骨爪','cross',1.9,120],'xixue','A(登場/技能名) C(數值)'],
 ['sunquan','孫權','三國',3,'智耐',['m','#f0c8a0','#6d2d10','crown','short','#c62828','#ffd54f','sword'],['碧眼紫髯','col2',1.3,0],['合縱聯盟','col3',1.5,100,{'buffDef':0.15}],null,'A(登場/技能名) C(技能歸屬/數值)'],
 ['weiyan','魏延','三國',3,'力敏',['m','#c98e65','#151515','helmet','short','#5d4037','#ff7043','blade'],['反骨刀','single',1.4,0],['暗天狂刃','line3',1.9,120],'lianzhan','A(登場/技能名) C(技能歸屬/數值)'],
 ['xiongmao','熊貓','原創',2,'力耐',['m','#ffffff','#1a1a1a','panda','none','#212121','#81c784','none'],['熊掌拍','single',1.2,0],['竹海狂濤','square',1.6,60],null,'A(登場/技能名) C(技能歸屬/數值)'],
 ['zixia','紫霞','大話西遊',4,'智敏',['f','#fbe0cd','#2a1a3a','long','none','#7b1fa2','#f8bbd0','sword'],['紫青寶劍','line2',1.45,0],['往昔若凝','square',2.0,180],'suxing','A(登場/技能名) C(技能歸屬/數值)'],
 ['liubei','劉備','三國',4,'智耐',['m','#f4cfaa','#1b1b1b','guan','short','#2e7d32','#ffd54f','sword'],['雙股劍','single',1.5,0],['仁德','healAll',0.6,150],null,'C'],
 // 第二階段擴充（D：原作是否收錄未確認，依同類題材合理補充；絕技型＝敏耐）
 ['xiaofeng','蕭峰','天龍八部',4,'力耐',['m','#d9a77f','#151515','long','short','#5d4037','#ffca28','none'],['擒龍功','single',1.5,0],['降龍廿八掌','line3',2.1,200],'rexue','D'],
 ['duanyu','段譽','天龍八部',3,'敏耐',['m','#f7d6c4','#1b1b1b','topknot','none','#e8eaf6','#7986cb','fan'],['一陽指','single',1.35,0],['六脈神劍','line3',1.7,120],'huizhan','D'],
 ['xuzhu','虛竹','天龍八部',3,'力耐',['m','#f0c7a0','#1b1b1b','bald','none','#8d6e63','#ffd54f','none'],['天山六陽掌','single',1.35,0],['生死符','cross',1.6,120,{'stun':0.3}],'liaoshang','D'],
 ['huangyaoshi','黃藥師','射鵰英雄傳',4,'敏耐',['m','#f4cfaa','#262626','topknot','long','#26a69a','#e0f2f1','qin'],['彈指神通','line2',1.45,0],['碧海潮生曲','col3',1.9,180],'xinu','D'],
 ['ouyangfeng','歐陽鋒','射鵰英雄傳',4,'智耐',['m','#d9a77f','#e0e0e0','long','long','#3e2723','#8bc34a','staff'],['蛤蟆功','line2',1.45,0],['逆練九陰','cross',2.0,200],'xixue','D'],
 ['zhoubotong','周伯通','射鵰英雄傳',3,'敏耐',['m','#f0c7a0','#eeeeee','topknot','long','#9e9e9e','#ffd54f','none'],['空明拳','single',1.35,0],['左右互搏','line2',1.9,120],'lianzhan','D'],
 ['dianwei','典韋','三國',3,'力耐',['m','#b98060','#0d0d0d','headband','short','#4e342e','#ff7043','halberd'],['雙鐵戟','single',1.4,0],['古之惡來','line2',1.9,120],'busi','D'],
 ['huangzhong','黃忠','三國',3,'敏耐',['m','#e0b08a','#e0e0e0','helmet','long','#bf360c','#ffd54f','bow'],['百步穿楊','col2',1.3,0],['定軍山','col3',1.6,120],'lianzhan','D'],
 ['ganning','甘寧','三國',3,'敏耐',['m','#d9a77f','#1b1b1b','headband','short','#00838f','#ffd54f','blade'],['錦帆突襲','single',1.4,0],['百騎劫營','line3',1.7,120],'lianzhan','D'],
 ['caocao','曹操','三國',4,'智耐',['m','#f0c7a0','#1b1b1b','crown','goatee','#1a237e','#ffd54f','sword'],['奸雄','col2',1.35,0],['挾天子','all',1.25,180],'liaoshang','D'],
 ['simayi','司馬懿','三國',4,'智敏',['m','#f0c7a0','#424242','guan','goatee','#311b92','#b39ddb','fan'],['鷹視狼顧','diag',1.4,0],['天命所歸','all',1.3,180],'xinu','D'],
 ['zhizunbao','至尊寶','大話西遊',3,'敏耐',['m','#f0c7a0','#1b1b1b','headband','none','#ff8f00','#ffd54f','staff'],['月光寶盒','single',1.35,0],['如意金箍','line3',1.7,120],'suxing','D'],
 ['xuchu','許褚','三國',2,'力耐',['m','#c98e65','#0d0d0d','bald','short','#5d4037','#e8c547','blade'],['裸衣鬥','single',1.2,0],['虎癡','line2',1.6,60],'rexue','D'],
 ['yuebuqun','岳不群','笑傲江湖',3,'智敏',['m','#f4cfaa','#1b1b1b','guan','goatee','#4a6a8a','#e0e0e0','sword'],['君子劍','single',1.35,0],['辟邪劍法','diag',1.9,120],'xixue','D']
];
var QBASE = [ [8,6,6,8], [9,7,7,9], [10,8,8,10], [11,9,9,11], [12,10,10,12] ];
var GROW = { // 每級 [力,智,敏,耐]（C：依神武殿截圖 Lv6 主角數值反推的比例）
 '力敏':[3.0,1.0,2.4,1.8], '力耐':[3.0,1.2,1.0,2.6], '智敏':[1.0,3.0,2.4,1.8], '智耐':[1.2,3.0,1.0,2.6], '敏耐':[1.6,1.0,2.6,2.6]
};
var SOULS = [1,1,1,5,45];
// A（官方圖）：技能面板 主動／無雙／被動 三格。未知被動依類型補（D）
var DEFPASS = { '力耐':'rexue', '力敏':'lianzhan', '智敏':'xixue', '智耐':'liaoshang', '敏耐':'huizhan' };
var ULT_NAME = { // A：影片2出現的技能名；歸屬除明顯者外為 C
  xiaolongnv:'玉女劍法', zhugeliang:'滅世奇策', dongfang:'葵花寶典', qiuchuji:'同歸劍法', guojing:'飛龍在天', diaochan:'美人一計',
  jianning:'公主鞭法', linghuchong:'孤星九劍', daqiao:'千秋蓮舞', xiaoqiao:'雪月飛花', caiwenji:'忘世天籟', wangyuyan:'口吐蓮花',
  huangyueying:'八卦玄火陣', sunce:'千軍破',
  // A：影片3（BGM集）出現的無雙名；影片2 的舊名改為主動技能名（歸屬 C）
  linghuchong:'獨孤九劍', miejue:'倡天劍法', diaochan:'千秋萬載', lvbu:'神鬼亂舞', zhugeliang:'八卦玄冰陣' };
var ACTIVE_NAME = { linghuchong:'孤星九劍', diaochan:'美人一計', zhugeliang:'滅世奇策' };
var heroes = H.map(function(h){
  var base = QBASE[h[3]];
  var g = GROW[h[4]];
  var tbias = { '力敏':[3,-2,2,-1], '力耐':[3,-2,-1,3], '智敏':[-2,3,2,-1], '智耐':[-2,3,-1,3], '敏耐':[-1,-2,3,2] }[h[4]];
  var souls = SOULS[h[3]];
  if (['linghuchong','zhouyu','zhangwuji'].indexOf(h[0])>=0) souls = 30;
  var o = {
    id: h[0], name: h[1], faction: h[2], quality: h[3], type: h[4],
    base: { str: base[0]+tbias[0], int: base[1]+tbias[1], agi: base[2]+tbias[2], con: base[3]+tbias[3] },
    growth: { str: g[0], int: g[1], agi: g[2], con: g[3] },
    look: { g:h[5][0], skin:h[5][1], hair:h[5][2], hs:h[5][3], beard:h[5][4], cloth:h[5][5], trim:h[5][6], wp:h[5][7] },
    active: { name:h[6][0], pattern:h[6][1], mult:h[6][2], flat:h[6][3], fx:h[6][4]||null },
    ult: { name:h[7][0], pattern:h[7][1], mult:h[7][2], flat:h[7][3], fx:h[7][4]||null },
    passive: h[8] || DEFPASS[h[4]], passiveGrade: h[8] ? undefined : 'D(官方每名武將皆有被動，未知者依類型補上)', souls: souls, grade: h[9]
  };
  if (ACTIVE_NAME[h[0]]) { o.active.name = ACTIVE_NAME[h[0]]; o.activeNameGrade = 'A(名稱見於影片2)，主動/無雙歸屬 C'; }
  if (h[0] === 'zhurong') o.note = 'A：影片3 出現「祝融夫人(主)」；技能名與數值 D';
  if (ULT_NAME[h[0]]) { o.ult.name = ULT_NAME[h[0]]; o.ultNameGrade = 'A(技能名見於影片' + (['linghuchong','miejue','diaochan','lvbu','zhugeliang'].indexOf(h[0])>=0 ? '3' : '2') + ') ' + (['dongfang','jianning','guojing','xiaolongnv'].indexOf(h[0])>=0 ? 'B/C(歸屬明顯)' : 'C(歸屬推定)'); }
  return o;
});
// 主角（玩家本人，B：主角可配點成力敏/力耐/敏耐；A：主角就是出戰武將之一）
var lead = {
  id:'lead', name:'主角', faction:'主角', quality:3, type:'力耐',
  base:{str:11,int:8,agi:6,con:11}, growth:{str:3,int:1.2,agi:1,con:2.6},
  look:{g:'m',skin:'#f0c7a0',hair:'#1b1b1b',hs:'topknot',beard:'none',cloth:'#b71c1c',trim:'#ffd54f',wp:'sword'},
  active:{name:'普攻',pattern:'single',mult:1.0,flat:0,fx:null},
  ult:{name:'必殺',pattern:'line2',mult:2.0,flat:50,fx:null}, passive:'liaoshang', souls:0, grade:'A'
};
var passives = {
  liaoshang:{name:'療傷',desc:'每回合行動前有 50% 機率回復 8% 生命',grade:'B(名稱/持有者) C(數值)'},
  lianzhan:{name:'連斬',desc:'攻擊後有 20% 機率再攻擊一次',grade:'B'},
  huizhan:{name:'回斬',desc:'受到攻擊後有 20% 機率立即反擊',grade:'B(名稱) C(數值)'},
  xinu:{name:'息怒',desc:'命中時降低目標 20 點無雙值',grade:'B(名稱) C(數值)'},
  xixue:{name:'吸血',desc:'造成傷害的 15% 轉為自身生命',grade:'B(名稱) C(數值)'},
  rexue:{name:'熱血',desc:'生命上限 +10%',grade:'B(名稱) C(數值)'},
  suxing:{name:'甦醒',desc:'陣亡時復活一次並回復 15% 生命',grade:'B'},
  busi:{name:'不死',desc:'陣亡時復活一次，生命 1',grade:'B'}
};
var patterns = {
  square:'2×2 方格',
  single:'單體', line2:'直線 2 格', line3:'直線 3 格', col2:'縱向 2 格', col3:'縱向 3 格',
  cross:'十字', diag:'斜向', all:'全體', healAll:'我方全體治療'
};

// ---- 裝備 ----（槽位：武器 盔甲 披風 腰帶 —— A 截圖）
var TIERS = [1,6,12,18,24,30,36,42,48,54];
var NAMES = {
  weaponP:['鐵劍','青鋼刀','寒鐵槍','精鋼戟','玄鐵劍','龍吟刀'],
  weaponM:['桃木杖','青竹扇','白玉笛','紫檀杖','玄冰扇','鳳鳴琴'],
  armor:['布衣','皮甲','鎖子甲','魚鱗甲','明光鎧','龍鱗鎧'],
  cape:['麻布披風','青布披風','錦緞披風','雲紋披風','玄羽披風','鳳翎披風'],
  belt:['麻繩腰帶','皮革腰帶','銅扣腰帶','銀扣腰帶','金絲腰帶','玉帶'],
  weaponJ:['飛鏢','柳葉刀','袖箭','梅花針','流星錘','奪魄環'],
  helm:['布巾','皮盔','鐵盔','虎頭盔','紫金冠','鳳翅盔'],
  ring:['銅戒','銀戒','玉佩','翡翠戒','龍紋佩','乾坤戒']
};
var SUFFIX = ['','·精','·極','·聖']; // 第 7~10 階以前六階名稱加字尾（D）
function nm(list, i){ return i < 6 ? list[i] : list[i-4] + SUFFIX[Math.min(3, i-5)]; }
var equipment = [];
TIERS.forEach(function(lv,i){
  var k = 1 + i*0.9;
  equipment.push({id:'wp'+lv, slot:'weapon', name:nm(NAMES.weaponP,i), lv:lv, icon:'sword', stats:{patk:Math.round(18*k*k)}, sec:'hit'});
  equipment.push({id:'wm'+lv, slot:'weapon', name:nm(NAMES.weaponM,i), lv:lv, icon:'staff', stats:{matk:Math.round(18*k*k)}, sec:'crit'});
  equipment.push({id:'wj'+lv, slot:'weapon', name:nm(NAMES.weaponJ,i), lv:lv, icon:'dart', stats:{jatk:Math.round(18*k*k)}, sec:'crit'});
  equipment.push({id:'hm'+lv, slot:'helm', name:nm(NAMES.helm,i), lv:lv, icon:'helm', stats:{pdef:Math.round(4*k*k), mdef:Math.round(4*k*k), jdef:Math.round(3*k*k)}, sec:'hit'});
  equipment.push({id:'ar'+lv, slot:'armor', name:nm(NAMES.armor,i), lv:lv, icon:'armor', stats:{pdef:Math.round(8*k*k), hp:Math.round(40*k*k)}, sec:'dodge'});
  equipment.push({id:'cp'+lv, slot:'cape', name:nm(NAMES.cape,i), lv:lv, icon:'cape', stats:{mdef:Math.round(9*k*k), jdef:Math.round(5*k*k)}, sec:'dodge'});
  equipment.push({id:'bt'+lv, slot:'belt', name:nm(NAMES.belt,i), lv:lv, icon:'belt', stats:{hp:Math.round(70*k*k), pdef:Math.round(3*k*k)}, sec:'crit'});
  equipment.push({id:'rg'+lv, slot:'ring', name:nm(NAMES.ring,i), lv:lv, icon:'ring', stats:{hp:Math.round(30*k*k), jdef:Math.round(4*k*k)}, sec:'crit'});
});
var items = {
  jinglitang:{name:'精力湯',icon:'potion',desc:'使用後回復 20 點精力',use:{energy:20},sell:50,grade:'B(名稱) D(數值)'},
  dabuwan:{name:'大補丸',icon:'pill',desc:'使用後回復 50 點精力',use:{energy:50},sell:100,grade:'B(名稱) D(數值)'},
  tufeiling:{name:'突飛令',icon:'token',desc:'對一名非主角武將使用，立即獲得經驗（等級 × 40）',use:{heroExp:40},sell:80,grade:'B(名稱/不可對主角使用) D(數值)'},
  yinbidai:{name:'銀幣袋',icon:'bag',desc:'打開後獲得 500 銀幣',use:{silver:500},sell:0,grade:'D'},
  // 第二階段：養成材料（名稱 B 者見於攻略；數值皆 D）
  jinengshu:{name:'技能書',icon:'book',desc:'升級武將的主動／無雙／被動技能',sell:60,grade:'D'},
  shenjishu:{name:'神技卷',icon:'book2',desc:'技能 9 級後突破為「·神」所需',sell:300,grade:'D'},
  peiyangdan:{name:'培養丹',icon:'pill2',desc:'神武殿．培養：隨機提升四維屬性',sell:40,grade:'B(培養功能) D(道具名/數值)'},
  xinfacanye:{name:'心法殘頁',icon:'scroll',desc:'升級已修練的心法',sell:40,grade:'D'},
  xilianshi:{name:'洗煉石',icon:'stone',desc:'神兵坊．洗煉：重新隨機裝備附加屬性',sell:50,grade:'B(洗煉功能) D(道具名)'},
  zhaochufu:{name:'摘除符',icon:'token2',desc:'摘除寶石時保留寶石（沒有則寶石碎裂）',sell:100,grade:'B'},
  // 第三階段：農田（B：種植/澆水/施肥/升級；種子名與時間 D）
  seed_yin:{name:'搖錢樹苗',icon:'seed',desc:'農田種植：收成銀幣',sell:10,grade:'D'},
  seed_exp:{name:'悟道竹種',icon:'seed',desc:'農田種植：收成經驗（給主角）',sell:10,grade:'D'},
  seed_gem:{name:'靈石花種',icon:'seed',desc:'農田種植：收成寶石',sell:20,grade:'D'},
  seed_soul:{name:'英魂草種',icon:'seed',desc:'農田種植：收成隨機將魂',sell:30,grade:'D'},
  huafei:{name:'化肥',icon:'potion',desc:'施肥：剩餘成長時間減半',sell:20,grade:'B(施肥) D(效果)'}
};
// 寶石（B：寶石合成 4 合 1；種類/數值 D）
var GEMS = { atk:{name:'攻擊石',stats:{patk:12,matk:12,jatk:12},color:'#e53935'}, hp:{name:'生命石',stats:{hp:90},color:'#43a047'},
  pdef:{name:'護體石',stats:{pdef:8},color:'#8d6e63'}, mdef:{name:'靈犀石',stats:{mdef:8},color:'#1e88e5'}, jdef:{name:'身法石',stats:{jdef:8},color:'#8e24aa'},
  crit:{name:'暴擊石',stats:{crit:0.5},color:'#fb8c00'} };
for (var gk in GEMS) for (var gl=1; gl<=6; gl++) {
  var gst = {}; for (var sk in GEMS[gk].stats) gst[sk] = Math.round(GEMS[gk].stats[sk] * Math.pow(2.2, gl-1) * 100)/100;
  items['gem_'+gk+'_'+gl] = {name: gl+'級'+GEMS[gk].name, icon:'gem', color:GEMS[gk].color, desc:'鑲嵌於裝備', gem:{k:gk, lv:gl, stats:gst}, sell: 30*Math.pow(4,gl-1), grade:'B(鑲嵌/合成) D(數值)'};
}
// 心法（D：名稱取自武俠作品常見內功，效果自訂）
var xinfa = {
  jinzhong:{name:'金鐘罩',stat:'pdef',pct:4,desc:'物防 +4%/級'}, yijin:{name:'易筋經',stat:'hp',pct:4,desc:'生命 +4%/級'},
  jiuyang:{name:'九陽神功',stat:'mdef',pct:4,desc:'法防 +4%/級'}, kuangfeng:{name:'狂風刀訣',stat:'patk',pct:3,desc:'物攻 +3%/級'},
  beiming:{name:'北冥神功',stat:'matk',pct:3,desc:'法攻 +3%/級'}, kuihua:{name:'葵花心經',stat:'jatk',pct:3,desc:'絕技攻擊 +3%/級'},
  lingbo:{name:'凌波微步',stat:'dodge',flat:0.6,desc:'閃避 +0.6/級'}, xixing:{name:'吸星大法',stat:'crit',flat:0.6,desc:'暴擊 +0.6/級'},
  zhanzhuang:{name:'站樁功',stat:'hit',flat:0.6,desc:'命中 +0.6/級'}, shenxing:{name:'神行百變',stat:'jdef',pct:4,desc:'絕技防禦 +4%/級'},
  jiuyin:{name:'九陰真經',stat:'all',pct:1.5,desc:'四維屬性 +1.5%/級'}
};
for (var xk in xinfa) items['xf_'+xk] = {name:'心法·'+xinfa[xk].name, icon:'scroll2', desc:'修練心法：'+xinfa[xk].desc, xinfa:xk, sell:80, grade:'D'};

// ---- 陣法 ----（名稱 B；可站格位 C/D）格位編號：row*3+col，col0 為最前排
var formations = [
  {id:'fangyuan',name:'方圓陣',cells:[0,1,3,4,5,6,7],desc:'前中排穩固，新手首選（攻略推薦前期使用）',bonus:{pdef:6},open:1},
  {id:'yulin',name:'魚鱗陣',cells:[0,3,4,5,6,1,2],desc:'中路縱深',bonus:{hp:5},open:1},
  {id:'yanyue',name:'偃月陣',cells:[0,1,2,3,6,7,8],desc:'上下兩翼展開',bonus:{mdef:6},open:1},
  {id:'fengshi',name:'鋒矢陣',cells:[3,1,4,7,2,5,8],desc:'中路突出，後排厚實',bonus:{patk:5},open:1},
  {id:'qixing',name:'七星陣',cells:[0,3,6,1,4,7,5],desc:'前兩排全開，利於大範圍攻擊者',bonus:{matk:5},open:1},
  {id:'yanxing',name:'雁行陣',cells:[1,3,5,7,0,6,4],desc:'交錯站位，原版多用於玩家對戰',bonus:{jatk:5},open:1},
  {id:'bagua',name:'八卦陣',cells:[0,1,2,3,4,5,6,7,8],desc:'九宮全開，可上陣 9 名武將（需 9 人出戰上限）',bonus:{pdef:4,mdef:4,jdef:4},open:55}
];

// ---- 虛空之門 關卡 ----
var enemies = {
  // 第一章 黃巾之亂
  hj_bing:{name:'黃巾賊兵',type:'力敏',look:['m','#e0ad86','#2a1e15','headband','none','#9a7b3a','#e8c547','spear'],pattern:'single',ult:'line2'},
  hj_lishi:{name:'黃巾力士',type:'力耐',look:['m','#c98e65','#120d0a','headband','short','#7a5a22','#e8c547','blade'],pattern:'single',ult:'line2'},
  hj_shushi:{name:'黃巾術士',type:'智敏',look:['m','#e3b38c','#3a2a1a','headband','goatee','#c9a227','#6b3a1a','staff'],pattern:'col2',ult:'col3'},
  zhangbao:{name:'地公將軍·張寶',type:'智耐',look:['m','#d9a77f','#2a1e15','headband','long','#a0782a','#4a2a10','staff'],pattern:'col2',ult:'col3',boss:1},
  zhangliang:{name:'人公將軍·張梁',type:'力耐',look:['m','#c98e65','#1a120d','headband','long','#8a5a22','#e8c547','halberd'],pattern:'line2',ult:'line3',boss:1},
  zj_boss:{name:'天公將軍·張角',type:'智耐',look:['m','#e3b08a','#3a2d20','headband','long','#c9a227','#7a3b12','staff'],pattern:'col3',ult:'all',boss:1},
  nanhua:{name:'南華老仙',type:'智耐',look:['m','#f0d6bc','#f0f0f0','taoist','long','#eeeeee','#7aa6c9','staff'],pattern:'cross',ult:'all',boss:1},
  // 第二章 曼陀山莊（章節名 A：宣傳影片）
  mt_jiading:{name:'曼陀山莊家丁',type:'力敏',look:['m','#efc39b','#1a1512','topknot','none','#5d6d7e','#d0d0d0','blade'],pattern:'single',ult:'line2'},
  xx_dizi:{name:'星宿派弟子',type:'智敏',look:['m','#ecc29b','#2a2a2a','hood','none','#4a6b2f','#c0d080','dagger'],pattern:'diag',ult:'diag'},
  mr_jiachen:{name:'慕容家臣',type:'力耐',look:['m','#e3b38c','#151515','topknot','short','#2f4f6f','#c9a24a','sword'],pattern:'single',ult:'line2'},
  mt_shinv:{name:'山莊侍女',type:'智耐',look:['f','#fbe0cd','#2a1a22','bun','none','#e57373','#fce4ec','fan'],pattern:'col2',ult:'col3'},
  e_dingchunqiu:{name:'星宿老怪·丁春秋',type:'智敏',look:['m','#ecc29b','#e8e8e8','long','long','#4a6b2f','#c0d080','fan'],pattern:'diag',ult:'cross',boss:1},
  e_jiumozhi:{name:'大輪明王·鳩摩智',type:'力耐',look:['m','#c98e65','#151515','bald','none','#c62828','#ffca28','none'],pattern:'line2',ult:'line3',boss:1},
  murongfu:{name:'姑蘇慕容·慕容復',type:'力敏',look:['m','#f4cfaa','#1b1b1b','guan','none','#eceff1','#5c6bc0','sword'],pattern:'col3',ult:'all',boss:1},
  duanyanqing:{name:'惡貫滿盈·段延慶',type:'智耐',look:['m','#d9a77f','#555555','hood','long','#263238','#8a8a8a','staff'],pattern:'line3',ult:'all',boss:1},
  // 第三章 虎牢關
  xl_qibing:{name:'西涼鐵騎',type:'力耐',look:['m','#c88d63','#160f0b','helmet','short','#6b2a1f','#9e9e9e','spear'],pattern:'line2',ult:'line3'},
  xl_gongshou:{name:'西涼弓手',type:'力敏',look:['m','#d9a77f','#1b1b1b','helmet','none','#795548','#c9a24a','bow'],pattern:'col2',ult:'col3'},
  dz_qinwei:{name:'董卓親衛',type:'力耐',look:['m','#c98e65','#120d0a','helmet','long','#3e2723','#ffca28','halberd'],pattern:'single',ult:'line2'},
  lj_moushi:{name:'西涼謀士',type:'智敏',look:['m','#f0c49c','#1b1b1b','guan','goatee','#4e342e','#d7ccc8','fan'],pattern:'cross',ult:'col3'},
  e_huaxiong:{name:'驍將·華雄',type:'力耐',look:['m','#c88d63','#160f0b','helmet','long','#6b2a1f','#c9a24a','blade'],pattern:'line2',ult:'line3',boss:1},
  e_lijue:{name:'西涼將·李傕',type:'力敏',look:['m','#d9a77f','#1a120d','helmet','short','#5d4037','#c9a24a','spear'],pattern:'line2',ult:'col3',boss:1},
  b_lvbu:{name:'飛將·呂布',type:'力敏',look:['m','#e7b993','#120c0a','helmet','none','#5d1f1f','#ffca28','halberd'],pattern:'line3',ult:'all',boss:1},
  b_dongzhuo:{name:'魔王·董卓',type:'力耐',look:['m','#c98e65','#120d0a','guan','long','#311b92','#ffca28','blade'],pattern:'col3',ult:'all',boss:1},
  // 第四章 光明頂
  mj_jiaozhong:{name:'明教教眾',type:'力耐',look:['m','#d9a77f','#1b1b1b','headband','short','#b71c1c','#ffab00','blade'],pattern:'single',ult:'line2'},
  em_dizi:{name:'峨嵋弟子',type:'智敏',look:['f','#fbe0cd','#151515','bun','none','#90a4ae','#eceff1','sword'],pattern:'line2',ult:'line3'},
  kl_dizi:{name:'崑崙弟子',type:'力敏',look:['m','#efc39b','#1b1b1b','topknot','none','#4e6e5d','#d0d0d0','sword'],pattern:'diag',ult:'cross'},
  wd_dizi:{name:'武當弟子',type:'智耐',look:['m','#f0c7a0','#1b1b1b','taoist','none','#eceff1','#37474f','sword'],pattern:'col2',ult:'col3'},
  e_luzhangke:{name:'玄冥二老·鹿杖客',type:'智耐',look:['m','#d8a47c','#bfbfbf','bald','long','#4a3b2a','#8a8a8a','staff'],pattern:'col2',ult:'col3',boss:1},
  e_hebiweng:{name:'玄冥二老·鶴筆翁',type:'智敏',look:['m','#d8a47c','#d0d0d0','topknot','long','#263238','#8a8a8a','staff'],pattern:'diag',ult:'cross',boss:1},
  b_miejue:{name:'峨嵋掌門·滅絕師太',type:'智耐',look:['f','#f0d0b8','#e0e0e0','hood','none','#3b3b3b','#c0c0c0','sword'],pattern:'line3',ult:'all',boss:1},
  xiexun:{name:'金毛獅王·謝遜',type:'力耐',look:['m','#d9a77f','#ffcc33','long','long','#6d4c41','#ffd54f','blade'],pattern:'col3',ult:'all',boss:1},
  // 第五章 襄陽城（第三階段擴充，D）
  mg_qibing:{name:'蒙古騎兵',type:'力耐',look:['m','#c98e65','#1a1a1a','cap','short','#6d4c41','#ffb300','blade'],pattern:'line2',ult:'line3'},
  mg_sheshou:{name:'射鵰手',type:'敏耐',look:['m','#d9a77f','#1a1a1a','cap','none','#8d6e63','#ffd54f','bow'],pattern:'col2',ult:'col3'},
  mg_lama:{name:'密宗喇嘛',type:'智耐',look:['m','#c98e65','#151515','bald','none','#c62828','#ffca28','staff'],pattern:'cross',ult:'col3'},
  mg_wushi:{name:'蒙古武士',type:'力敏',look:['m','#d9a77f','#1a1a1a','helmet','short','#5d4037','#bdbdbd','spear'],pattern:'single',ult:'line2'},
  e_huodu:{name:'王子·霍都',type:'智敏',look:['m','#f0c7a0','#1b1b1b','topknot','none','#283593','#ffd54f','fan'],pattern:'diag',ult:'cross',boss:1},
  e_daerba:{name:'金剛·達爾巴',type:'力耐',look:['m','#b98060','#0d0d0d','bald','none','#c62828','#ffd54f','staff'],pattern:'line2',ult:'line3',boss:1},
  b_jinlun:{name:'國師·金輪法王',type:'力耐',look:['m','#c98e65','#151515','bald','none','#ffb300','#c62828','none'],pattern:'cross',ult:'all',boss:1},
  b_menge:{name:'大汗·蒙哥',type:'敏耐',look:['m','#c98e65','#1b1b1b','crown','long','#4e342e','#ffd54f','bow'],pattern:'col3',ult:'all',boss:1},
  // 第六章 赤壁
  cj_shuibing:{name:'曹軍水兵',type:'力敏',look:['m','#e0ad86','#1b1b1b','helmet','none','#1565c0','#bdbdbd','spear'],pattern:'single',ult:'line2'},
  cj_hubaoqi:{name:'虎豹騎',type:'力耐',look:['m','#c98e65','#120d0a','helmet','short','#212121','#ffca28','halberd'],pattern:'line2',ult:'line3'},
  cj_moushi:{name:'曹營謀士',type:'智敏',look:['m','#f0c49c','#1b1b1b','guan','goatee','#283593','#d7ccc8','fan'],pattern:'cross',ult:'col3'},
  cj_nushou:{name:'曹軍弩手',type:'敏耐',look:['m','#d9a77f','#1b1b1b','helmet','none','#455a64','#c9a24a','bow'],pattern:'col2',ult:'col3'},
  e_zhangliao:{name:'威震逍遙津·張遼',type:'力敏',look:['m','#e7b993','#120c0a','helmet','short','#1a237e','#ffca28','halberd'],pattern:'line3',ult:'line3',boss:1},
  e_caoren:{name:'鐵壁·曹仁',type:'力耐',look:['m','#c98e65','#120d0a','helmet','long','#37474f','#ffca28','blade'],pattern:'line2',ult:'col3',boss:1},
  b_caocao:{name:'魏武·曹操',type:'智耐',look:['m','#f0c7a0','#1b1b1b','crown','goatee','#1a237e','#ffd54f','sword'],pattern:'col3',ult:'all',boss:1},
  b_simayi:{name:'冢虎·司馬懿',type:'智敏',look:['m','#f0c7a0','#424242','guan','goatee','#311b92','#b39ddb','fan'],pattern:'diag',ult:'all',boss:1},
  // 第七章 黑木崖
  ry_jiaozhong:{name:'日月神教教眾',type:'力敏',look:['m','#e0ad86','#1b1b1b','headband','none','#4a148c','#ffd54f','blade'],pattern:'single',ult:'line2'},
  ry_zhanglao:{name:'神教長老',type:'智耐',look:['m','#e0b08a','#bdbdbd','topknot','long','#311b92','#ffd54f','staff'],pattern:'col2',ult:'col3'},
  ry_anqi:{name:'暗器堂殺手',type:'敏耐',look:['m','#e0ad86','#1b1b1b','hood','none','#212121','#9e9e9e','dagger'],pattern:'diag',ult:'diag'},
  ry_hufa:{name:'神教護法',type:'力耐',look:['m','#c98e65','#120d0a','bald','short','#4a148c','#ffca28','halberd'],pattern:'line2',ult:'line3'},
  e_xiangwentian:{name:'天王老子·向問天',type:'力敏',look:['m','#d9a77f','#424242','topknot','short','#3e2723','#ffd54f','blade'],pattern:'line3',ult:'line3',boss:1},
  e_yanglianting:{name:'總管·楊蓮亭',type:'智敏',look:['m','#f0c7a0','#1b1b1b','guan','none','#880e4f','#ffd54f','fan'],pattern:'diag',ult:'cross',boss:1},
  b_renwoxing:{name:'吸星大法·任我行',type:'智耐',look:['m','#e0b08a','#e0e0e0','long','long','#212121','#c62828','sword'],pattern:'cross',ult:'all',boss:1},
  b_dongfang:{name:'日出東方·東方不敗',type:'敏耐',look:['f','#f7d6c4','#1a1015','long','none','#c2185b','#f2d16b','needle'],pattern:'diag',ult:'all',boss:1},
  // 第八章 華山論劍
  hs_jianke:{name:'華山劍客',type:'力敏',look:['m','#efc39b','#1b1b1b','topknot','none','#4a6a8a','#e0e0e0','sword'],pattern:'line2',ult:'line3'},
  hs_baituo:{name:'白駝山蛇奴',type:'智敏',look:['m','#d9a77f','#1b1b1b','hood','none','#f5f5f5','#8bc34a','staff'],pattern:'diag',ult:'cross'},
  hs_tiezhang:{name:'鐵掌幫眾',type:'力耐',look:['m','#c98e65','#120d0a','headband','short','#3e2723','#9e9e9e','none'],pattern:'single',ult:'line2'},
  hs_yinshi:{name:'隱世高手',type:'敏耐',look:['m','#f0c7a0','#9e9e9e','taoist','long','#607d8b','#cfd8dc','sword'],pattern:'cross',ult:'col3'},
  e_ouyangke:{name:'白駝少主·歐陽克',type:'智敏',look:['m','#f4cfaa','#1b1b1b','topknot','none','#f5f5f5','#8bc34a','fan'],pattern:'diag',ult:'cross',boss:1},
  e_qiuqianren:{name:'鐵掌水上飄·裘千仞',type:'力耐',look:['m','#d9a77f','#bdbdbd','topknot','long','#3e2723','#ffd54f','none'],pattern:'line2',ult:'col3',boss:1},
  b_ouyangfeng:{name:'西毒·歐陽鋒',type:'智耐',look:['m','#d9a77f','#e0e0e0','long','long','#3e2723','#8bc34a','staff'],pattern:'cross',ult:'all',boss:1},
  b_dugu:{name:'劍魔·獨孤求敗',type:'敏耐',look:['m','#f0c7a0','#e0e0e0','long','long','#263238','#cfd8dc','sword'],pattern:'line3',ult:'all',boss:1}
};
var chapters = [
  {id:1,name:'黃巾之亂',lv:1,desc:'蒼天已死，黃天當立。平定黃巾賊亂。',bg:'#7a9a4a',
    pool:['hj_bing','hj_lishi','hj_shushi'],elite:['zhangbao','zhangliang'],boss:'zj_boss',hidden:'nanhua',
    stageNames:['涿郡郊外','黃巾營寨','鉅鹿荒村','地公壇','廣宗城外','曲陽古道','人公壇','廣宗決戰','南華仙洞'],
    souls:['zhangjiao','huaxiong','caiwenji','guanhai','dengmao','qiuchuji']},
  {id:2,name:'曼陀山莊',lv:8,desc:'太湖之畔，曼陀花開。姑蘇慕容，以彼之道還施彼身。',bg:'#5a7a8a',
    pool:['mt_jiading','xx_dizi','mr_jiachen','mt_shinv'],elite:['e_dingchunqiu','e_jiumozhi'],boss:'murongfu',hidden:'duanyanqing',
    stageNames:['太湖小舟','琴韻小築','聽香水榭','星宿海','曼陀花徑','還施水閣','燕子塢','參合莊','擂鼓山'],
    souls:['wangyuyan','liqiushui','baobutong','azi','yuelingshan','renyingying']},
  {id:3,name:'虎牢關',lv:15,desc:'十八路諸侯討董卓，三英戰呂布。',bg:'#8a5a3a',
    pool:['xl_qibing','xl_gongshou','dz_qinwei','lj_moushi'],elite:['e_huaxiong','e_lijue'],boss:'b_lvbu',hidden:'b_dongzhuo',
    stageNames:['酸棗大營','汜水關前','汜水關','西涼營地','虎牢關外','洛陽古道','長安郊外','虎牢關','郿塢'],
    souls:['sunce','taishici','liaohua','weiyan','xiongmao','lvbu']},
  {id:4,name:'光明頂',lv:22,desc:'六大派圍攻光明頂，明教存亡一線。',bg:'#6a4a7a',
    pool:['mj_jiaozhong','em_dizi','kl_dizi','wd_dizi'],elite:['e_luzhangke','e_hebiweng'],boss:'b_miejue',hidden:'xiexun',
    stageNames:['崑崙山麓','蝴蝶谷','綠柳山莊','萬安寺','光明頂山道','秘道','光明頂廣場','光明頂之巔','冰火島'],
    souls:['luzhangke','miejue','shuanger','hongqigong','zhangwuji','meichaofeng']},
  {id:5,name:'襄陽城',lv:29,desc:'蒙古鐵騎南下，郭靖黃蓉死守襄陽。',bg:'#6a7a5a',
    pool:['mg_qibing','mg_sheshou','mg_lama','mg_wushi'],elite:['e_huodu','e_daerba'],boss:'b_jinlun',hidden:'b_menge',
    stageNames:['終南山下','絕情谷','英雄大會','襄陽城郊','百花谷','古墓','襄陽城頭','襄陽之戰','釣魚城'],
    souls:['huangrong','yangguo','xiaolongnv','zhoubotong','huangyaoshi','guojing']},
  {id:6,name:'赤壁',lv:36,desc:'孫劉聯軍，火燒連環船。',bg:'#7a4a3a',
    pool:['cj_shuibing','cj_hubaoqi','cj_moushi','cj_nushou'],elite:['e_zhangliao','e_caoren'],boss:'b_caocao',hidden:'b_simayi',
    stageNames:['長坂坡','當陽橋','柴桑','群英會','草船借箭','七星壇','連環船','赤壁之戰','華容道'],
    souls:['huangyueying','daqiao','xiaoqiao','ganning','zhouyu','caocao']},
  {id:7,name:'黑木崖',lv:43,desc:'日月神教總壇，千古一戰。',bg:'#4a3a5a',
    pool:['ry_jiaozhong','ry_zhanglao','ry_anqi','ry_hufa'],elite:['e_xiangwentian','e_yanglianting'],boss:'b_renwoxing',hidden:'b_dongfang',
    stageNames:['西湖梅莊','孤山','地牢','平定州','風雷堂','黑木崖下','成德殿','黑木崖頂','繡房'],
    souls:['renyingying','yuebuqun','tianbg','zhizunbao','linghuchong','dongfang']},
  {id:8,name:'華山論劍',lv:50,desc:'天下五絕，華山之巔一決高下。',bg:'#4a5a6a',
    pool:['hs_jianke','hs_baituo','hs_tiezhang','hs_yinshi'],elite:['e_ouyangke','e_qiuqianren'],boss:'b_ouyangfeng',hidden:'b_dugu',
    stageNames:['蒼龍嶺','玉女峰','思過崖','鐵掌峰','白駝山','落雁峰','朝陽峰','華山之巔','劍塚'],
    souls:['duanyu','xuzhu','ouyangfeng','simayi','hongqigong','xiaofeng']}
];
// 章節內順序：普1 普2 普3 精英1 普4 普5 精英2 王 隱藏（關卡種類 B；順序 D）
var KINDS = ['normal','normal','normal','elite','normal','normal','elite','boss','hidden'];
var stages = [];
function cellsFor(n, seed){
  var pref = [[1,4,7],[0,4,8,1,7],[0,3,6,4,1,7],[3,0,6,4,2,8,5]][Math.min(3, Math.floor(seed%4))];
  var all = [0,3,6,1,4,7,2,5,8], out = [];
  pref.concat(all).forEach(function(c){ if (out.length<n && out.indexOf(c)<0) out.push(c); });
  return out;
}
chapters.forEach(function(ch, ci){
  KINDS.forEach(function(kind, si){
    var lv = ch.lv + Math.round(si * (ci===0?1:0.9));
    if (kind==='hidden') lv = ch.lv + 9;
    var en = [];
    var count = kind==='normal' ? Math.min(3+Math.floor(si/2)+ci, ci>=4?8:6) : (kind==='elite'?4+ci:5+ci);
    count = Math.min(count, 9); // 第三階段：後期章節敵方可達 9 人（A：原作後期每方 9 人）
    var cells;
    if (kind==='normal'){
      cells = cellsFor(count, si+ci);
      for (var k=0;k<count;k++){ en.push({e: ch.pool[(si+k)%ch.pool.length], cell: cells[k], lv: lv}); }
    } else {
      var leader = kind==='elite' ? ch.elite[si===3?0:1] : (kind==='boss'?ch.boss:ch.hidden);
      cells = cellsFor(count, si+ci+1);
      en.push({e: leader, cell: 4, lv: lv + (kind==='normal'?0:1), leader:1});
      var rest = cells.filter(function(c){return c!==4;});
      for (var j=0;j<count-1;j++){ en.push({e: ch.pool[(j+si)%ch.pool.length], cell: rest[j], lv: lv}); }
    }
    var energy = {normal:1, elite:2, boss:3, hidden:3}[kind]; // A：宣傳片關卡消耗體力 1
    var expBase = 8 + lv*6;
    var mult = {normal:1, elite:1.5, boss:2.2, hidden:2.6}[kind];
    var tierIdx = 0; for (var t=0;t<TIERS.length;t++){ if (TIERS[t] <= lv+2) tierIdx = t; }
    var tier = TIERS[tierIdx];
    var slotsCycle = ['wp','ar','cp','bt','wm','hm','rg','wj'];
    var drops = [
      {item:'eq:'+slotsCycle[(si+ci)%8]+tier, q: kind==='normal'?0:(kind==='elite'?1:2), chance: kind==='normal'?0.25:0.5},
      {item:'eq:'+slotsCycle[(si+ci+2)%8]+tier, q: kind==='normal'?1:(kind==='elite'?2:3), chance: kind==='normal'?0.08:(kind==='elite'?0.2:0.35)},
      {item:'soul:'+ch.souls[si%ch.souls.length], n:1, chance: kind==='normal'?0.3:0.6},
      {item:'jinglitang', n:1, chance: 0.08},
      // 第二階段：養成材料（D）
      {item:'jinengshu', n:1, chance: kind==='normal'?0.12:0.35},
      {item:'peiyangdan', n:1, chance: kind==='normal'?0.15:0.4},
      {item:'xinfacanye', n:1, chance: kind==='normal'?0.06:0.25},
      {item:'gem_'+['atk','hp','pdef','mdef','jdef','crit'][(si+ci)%6]+'_'+Math.min(3, 1+Math.floor(ci/3)), n:1, chance: kind==='normal'?0.05:0.2}
    ];
    if (kind!=='normal') drops.push({item:'xilianshi', n:1, chance:0.3});
    if (kind==='boss'||kind==='hidden') drops.push({item:'xf_'+['jinzhong','yijin','jiuyang','kuangfeng','beiming','kuihua','lingbo','xixing'][ci%8], n:1, chance:0.15});
    if (kind==='boss' || kind==='hidden') drops.push({item:'soul:'+ch.souls[5], n:kind==='hidden'?3:1, chance:kind==='hidden'?0.8:0.25});
    var first = {gold: {normal:5, elite:15, boss:30, hidden:50}[kind], silver: Math.round(expBase*mult*3), items: []};
    if (kind==='elite') first.items.push({item:'eq:'+slotsCycle[(si)%8]+tier, q:2});
    if (kind==='boss') first.items.push({item:'tufeiling', n:2}, {item:'shenjishu', n:1}, {item:'xf_'+['jinzhong','yijin','jiuyang','kuangfeng','beiming','kuihua','lingbo','xixing'][(ci+3)%8], n:1});
    if (kind==='elite') first.items.push({item:'jinengshu', n:2}, {item:'peiyangdan', n:3});
    if (kind==='hidden') first.items.push({item:'soul:'+ch.souls[5], n:5});
    stages.push({
      id: 's'+ch.id+'_'+(si+1), ch: ch.id, idx: si, kind: kind, name: ch.stageNames[si], lv: lv,
      energy: energy, exp: Math.round(expBase*mult), silver: Math.round((20+lv*8)*mult),
      enemies: en, drops: drops, first: first,
      unlock: kind==='hidden' ? 'all3star' : (si===0 ? (ci===0?null:'s'+(ci)+'_8') : 's'+ch.id+'_'+si)
    });
  });
});
var config = {
  grow: GROW, qbase: QBASE,
  leadTypes: { // B：主角可選力敏/力耐/敏耐；力耐數值 A（截圖反推），其餘 C
    '力耐': {base:{str:11,int:8,agi:6,con:11}, growth:{str:3,int:1.2,agi:1,con:2.6}, grade:'A(Lv6 數值吻合) C(公式)'},
    '力敏': {base:{str:11,int:8,agi:9,con:8}, growth:{str:3,int:1.2,agi:2.4,con:1.6}, grade:'C'},
    '敏耐': {base:{str:9,int:8,agi:9,con:10}, growth:{str:2.2,int:1.2,agi:2.4,con:2.4}, grade:'C'}
  },
  version: 1,
  qualityNames:['黑','白','綠','藍','紫'],
  qualityColors:['#6b6b6b','#f2f2f2','#4caf50','#2f8fff','#b44cff'],
  qualityStatMult:[0.85,0.92,1.0,1.12,1.25],
  equipQualityMult:[1.0,1.3,1.7,2.2],
  equipQualityNames:['白','綠','藍','紫'],
  teamSlotsByLevel:[[1,3],[15,4],[25,5],[35,6],[45,7],[55,8],[65,9]], // 第二階段改為最多 9 人（A：後期 9 人）；門檻 C/D
  rosterBase:5,
  energyRegenMinutes:{original:6, fast:1},
  freeGiftMinutes:30,
  noEnergyLossBelowLevel:30,
  levelSuppression:10,
  enemyScale:{from:12, atk:0.03, def:0.03, hp:0.05, atk2:0.0006, def2:0.0006, hp2:0.001}, // D：第五階段平衡模擬後加入的中後期敵人成長（tools/balance.js）
  maxRounds:36, // A：影片2 回合倒數 x 36
  recruit:{
    normal:{name:'普通刷新',cdMin:10,daily:10,skipGold:10,odds:[0.30,0.42,0.22,0.055,0.005]},
    baijin:{name:'白金刷新',cdMin:1440,skipGold:50,odds:[0,0.25,0.5,0.22,0.03],firstMin:2},
    zijin:{name:'紫金刷新',cdMin:2880,skipGold:200,odds:[0,0,0.45,0.45,0.10],firstMin:3},
    zhizun:{name:'至尊刷新',cdMin:10080,skipGold:500,odds:[0,0,0.2,0.5,0.30],firstMin:4}
  },
  recruitCost:[100,300,1000,5000,20000],
  dismissSouls:[0,1,1,2,5],
  damageTypes:{p:'物理',m:'法術',j:'絕技'},
  xinfa: xinfa, gems: GEMS,
  // ---- 第二階段養成（全部 D，除非另註）----
  skill:{maxLv:9, multPerLv:0.06, shenBonus:0.2, passivePerLv:0.08, silverBase:200, shenBooks:1}, // A：技能「·神」階見於影片3
  peiyang:{normal:{dan:1,silver:300,lo:-2,hi:3}, strong:{dan:3,silver:1500,lo:-1,hi:5}, capBase:10, capPerLv:1.5},
  xinfaSlots:[1,20,40], xinfaMax:10, xinfaSilver:300,
  enhance:{silverK:12, chanceMin:0.35, chanceStep:0.04, perPlus:0.07, freeBelow:5},
  wash:{counts:[0,1,2,3], silver:200, pool:{patk:[0.6,1.4],matk:[0.6,1.4],jatk:[0.6,1.4],pdef:[0.3,0.8],mdef:[0.3,0.8],jdef:[0.3,0.8],hp:[3,8],hit:[0.03,0.08],crit:[0.03,0.08],dodge:[0.03,0.08]}},
  sockets:[1,1,2,3],
  gemCombine:{n:4, silver:[100,300,900,2700,8100]},
  gemMaxLv:6,
  star:{cost:[2,2,3,5,15], perStar:0.06, max:5},
  soulValue:[1,2,4,8,16],
  jiangxing:{names:['角','亢','氐','房','心','尾','箕','斗','牛','女','虛','危','室','壁','奎','婁','胃','昴','畢','觜','參','井','鬼','柳','星','張','翼','軫'],
    cycle:[['patk',2],['matk',2],['jatk',2],['hp',3],['pdef',2],['mdef',2],['jdef',2]], costBase:10, costStep:8},
  codexPer:0.2, codexMax:15,
  buildings:{
    shenwu:{name:'神武殿',open:1}, juxian:{name:'聚賢莊',open:1}, shenbing:{name:'神兵坊',open:5},
    xukong:{name:'虛空之門',open:1}, farm:{name:'農田',open:1}, wuji:{name:'無極幻境',open:12},
    tongtian:{name:'通天塔',open:22}, jiangxing:{name:'將星錄',open:16}, baifang:{name:'拜訪武將',open:8}
  }
};
var shop = [
  {id:'shop_w1', item:'eq:wp1', q:0, price:{silver:200}}, {id:'shop_m1', item:'eq:wm1', q:0, price:{silver:200}},
  {id:'shop_a1', item:'eq:ar1', q:0, price:{silver:200}}, {id:'shop_c1', item:'eq:cp1', q:0, price:{silver:200}},
  {id:'shop_b1', item:'eq:bt1', q:0, price:{silver:200}},
  {id:'shop_w6', item:'eq:wp6', q:0, price:{silver:800}}, {id:'shop_m6', item:'eq:wm6', q:0, price:{silver:800}},
  {id:'shop_a6', item:'eq:ar6', q:0, price:{silver:800}}, {id:'shop_c6', item:'eq:cp6', q:0, price:{silver:800}},
  {id:'shop_b6', item:'eq:bt6', q:0, price:{silver:800}},
  {id:'shop_w12', item:'eq:wp12', q:0, price:{silver:2500}}, {id:'shop_m12', item:'eq:wm12', q:0, price:{silver:2500}},
  {id:'shop_tang', item:'jinglitang', n:1, price:{gold:10}}, {id:'shop_wan', item:'dabuwan', n:1, price:{gold:20}},
  {id:'shop_tfl', item:'tufeiling', n:1, price:{gold:15}},
  // 第二／三階段新增（D）
  {id:'shop_h1', item:'eq:hm1', q:0, price:{silver:200}}, {id:'shop_r1', item:'eq:rg1', q:0, price:{silver:300}},
  {id:'shop_j1', item:'eq:wj1', q:0, price:{silver:200}}, {id:'shop_j6', item:'eq:wj6', q:0, price:{silver:800}},
  {id:'shop_h6', item:'eq:hm6', q:0, price:{silver:800}}, {id:'shop_r6', item:'eq:rg6', q:0, price:{silver:1000}},
  {id:'shop_jns', item:'jinengshu', n:1, price:{silver:1500}}, {id:'shop_pyd', item:'peiyangdan', n:1, price:{silver:800}},
  {id:'shop_xls', item:'xilianshi', n:1, price:{silver:1200}}, {id:'shop_xfc', item:'xinfacanye', n:1, price:{silver:2000}},
  {id:'shop_zcf', item:'zhaochufu', n:1, price:{gold:5}}, {id:'shop_sjs', item:'shenjishu', n:1, price:{gold:60}},
  {id:'shop_gem1', item:'gem_atk_1', n:1, price:{silver:600}}, {id:'shop_gem2', item:'gem_hp_1', n:1, price:{silver:600}},
  {id:'shop_gem3', item:'gem_pdef_1', n:1, price:{silver:600}}, {id:'shop_gem4', item:'gem_mdef_1', n:1, price:{silver:600}},
  {id:'shop_gem5', item:'gem_jdef_1', n:1, price:{silver:600}}, {id:'shop_gem6', item:'gem_crit_1', n:1, price:{silver:900}},
  {id:'shop_xf1', item:'xf_zhanzhuang', n:1, price:{silver:3000}}, {id:'shop_xf2', item:'xf_yijin', n:1, price:{silver:3000}},
  {id:'shop_sd1', item:'seed_yin', n:1, price:{silver:300}}, {id:'shop_sd2', item:'seed_exp', n:1, price:{silver:500}},
  {id:'shop_sd3', item:'seed_gem', n:1, price:{silver:1200}}, {id:'shop_sd4', item:'seed_soul', n:1, price:{gold:10}},
  {id:'shop_hf', item:'huafei', n:1, price:{silver:400}}
];
var tasks = [
  {id:'t1',name:'初入江湖',desc:'在聚賢莊招募 1 名武將',cond:{recruits:1},reward:{silver:500}},
  {id:'t2',name:'排兵布陣',desc:'出戰隊伍達到 3 名武將',cond:{team:3},reward:{silver:300,gold:10}},
  {id:'t3',name:'首戰告捷',desc:'通關虛空之門「涿郡郊外」',cond:{clear:'s1_1'},reward:{silver:500,items:[{item:'jinglitang',n:1}]}},
  {id:'t4',name:'披堅執銳',desc:'為任一武將穿上 3 件裝備',cond:{equipped:3},reward:{silver:800}},
  {id:'t5',name:'精益求精',desc:'主角等級達到 5 級',cond:{level:5},reward:{gold:20,items:[{item:'tufeiling',n:1}]}},
  {id:'t6',name:'地公授首',desc:'通關精英關「地公壇」',cond:{clear:'s1_4'},reward:{silver:1500}},
  {id:'t7',name:'平定黃巾',desc:'擊敗王關「廣宗決戰」',cond:{clear:'s1_8'},reward:{gold:50,items:[{item:'dabuwan',n:1}]}},
  {id:'t8',name:'群英薈萃',desc:'擁有 5 名武將',cond:{heroes:5},reward:{silver:2000}},
  {id:'t9',name:'聲名鵲起',desc:'主角等級達到 10 級',cond:{level:10},reward:{gold:50}},
  {id:'t10',name:'以彼之道',desc:'擊敗王關「參合莊」',cond:{clear:'s2_8'},reward:{gold:80,items:[{item:'tufeiling',n:3}]}},
  {id:'t11',name:'三英戰呂布',desc:'擊敗王關「虎牢關」',cond:{clear:'s3_8'},reward:{gold:100,items:[{item:'soul:lvbu',n:5}]}},
  {id:'t12',name:'力戰群雄',desc:'擊敗王關「光明頂之巔」',cond:{clear:'s4_8'},reward:{gold:150}},
  {id:'t13',name:'名揚天下',desc:'主角等級達到 20 級',cond:{level:20},reward:{gold:100}},
  {id:'t14',name:'三星大俠',desc:'第一章全部關卡三星，開啟隱藏關',cond:{clear:'s1_9'},reward:{gold:60}},
  {id:'t15',name:'神兵初成',desc:'將任一裝備強化到 +5',cond:{plus:5},reward:{silver:3000,items:[{item:'xilianshi',n:2}]}},
  {id:'t16',name:'武學精進',desc:'將任一技能升到 3 級',cond:{skill:3},reward:{items:[{item:'jinengshu',n:3}]}},
  {id:'t17',name:'脫胎換骨',desc:'完成 1 次培養',cond:{peiyang:1},reward:{items:[{item:'peiyangdan',n:5}]}},
  {id:'t18',name:'將星閃耀',desc:'點亮 1 顆將星',cond:{stars:1},reward:{gold:30}},
  {id:'t19',name:'鎮守襄陽',desc:'擊敗王關「襄陽之戰」',cond:{clear:'s5_8'},reward:{gold:150,items:[{item:'shenjishu',n:1}]}},
  {id:'t20',name:'火燒赤壁',desc:'擊敗王關「赤壁之戰」',cond:{clear:'s6_8'},reward:{gold:200}},
  {id:'t21',name:'笑傲江湖',desc:'擊敗王關「黑木崖頂」',cond:{clear:'s7_8'},reward:{gold:250}},
  {id:'t22',name:'天下五絕',desc:'擊敗王關「華山之巔」',cond:{clear:'s8_8'},reward:{gold:300,items:[{item:'xf_jiuyin',n:1}]}},
  {id:'t23',name:'登高望遠',desc:'通天塔到達第 10 層',cond:{tower:10},reward:{gold:50}},
  {id:'t24',name:'圖鑑收藏家',desc:'圖鑑收錄 20 名武將',cond:{codex:20},reward:{gold:80}}
];

function w(name, obj){ fs.writeFileSync(path.join(OUT, name+'.json'), JSON.stringify(obj, null, 1)); }
w('heroes', {lead: lead, list: heroes, passives: passives, patterns: patterns});
w('equipment', {list: equipment, items: items});
w('stages', {chapters: chapters, enemies: enemies, stages: stages});
w('formations', formations);
w('config', config);
w('shop', shop);
w('tasks', tasks);
console.log('heroes', heroes.length, 'stages', stages.length, 'equip', equipment.length);
