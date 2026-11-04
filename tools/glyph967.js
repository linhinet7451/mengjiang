// snA967 格圖（● 空白對齊、■ 格）→ 本作範圍偏移 [dr, dc]（C：換算規則）
// 規則：武將所在列＝奇數列時取正中間；偶數列時取「第一格是 ■」的那一列（只有一列時）。
// 該列第一格 ■ 是武將自己；其餘每列第 j 格（j≥1）是正前方第 j−1 格。其他列第一格（武將旁的己方格）不計。
module.exports = function (rows) {
  var n = rows.length, ri = -1;
  if (n % 2) ri = (n - 1) / 2;
  else { var c0 = []; rows.forEach(function (r, i) { if (r.charAt(0) === '■') c0.push(i); }); if (c0.length === 1) ri = c0[0]; else ri = c0.length ? c0[c0.length - 1] : n - 1; }
  var out = [];
  rows.forEach(function (r, i) {
    var dr = i - ri; if (dr < -2 || dr > 2) return;
    for (var j = 1; j < r.length; j++) if (r.charAt(j) === '■') out.push([dr, j - 1]);
  });
  return { ri: ri, shape: out, ambiguous: n % 2 === 0 && rows.filter(function (r) { return r.charAt(0) === '■'; }).length !== 1 };
};
