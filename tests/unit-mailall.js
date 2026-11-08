// Mail claim-all test. Run: node tests/unit-mailall.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  ok', name); } else { fail++; console.log('FAIL', name); } }
var c = load(), M = c.MJ, G = M.G, S = M.S; M.U.now = function () { return 1767225600000; };
G.newGame('t', 'm', 'm', 1);
var s = S.state; s.mail = [];
var g0 = s.gold || 0;
s.mail.push({ id: 9001, title: 'a', text: 'a', att: { gold: 10 }, claimed: false, read: false });
s.mail.push({ id: 9002, title: 'b', text: 'b', att: { silver: 20 }, claimed: false, read: false });
s.mail.push({ id: 9003, title: 'c', text: 'c', claimed: false, read: false });
var r = G.claimAllMail();
ok(r.ok && r.n === 2, 'claims all mails with attachments');
ok(s.mail[0].claimed && s.mail[1].claimed && !s.mail[2].claimed, 'only attachment mails marked claimed');
ok(!G.claimAllMail().ok, 'second call reports nothing to claim');
console.log('pass ' + pass + ' fail ' + fail);
process.exit(fail ? 1 : 0);
