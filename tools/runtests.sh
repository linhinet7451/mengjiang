#!/bin/sh
# 單元測試全套：sh tools/runtests.sh > docs/test-log-unit.txt
cd "$(dirname "$0")/.."
F=0
for t in unit unit-extras unit-p2 unit-p3 unit-p4 unit-p5 unit-pt2 unit-pt3 unit-pt4 unit-pt5 unit-prov unit-art unit-art5 unit-web2 unit-web2-p2 unit-web2-p3 unit-web2-p3-3-5 unit-web2-p3-6 unit-web2-p4-1-2-5-6 unit-web2-p3-range unit-fix unit-board unit-wrap unit-wrap12 unit-sup unit-bagfix unit-juxian unit-web2-p4-3 unit-wulin unit-atkfx unit-stages unit-gate2 unit-affix unit-challenge unit-wl6 unit-wl7 unit-wl8 unit-wl9 unit-wl10 unit-wl11 unit-wl12 unit-wl13 unit-wl14 unit-wl15; do
  [ -f tests/$t.js ] || continue
  echo "=== $t"; nice node tests/$t.js > /tmp/ut.$$ 2>&1; r=$?; grep -E "✗|失敗|結果|FAIL|Error" /tmp/ut.$$ | tail -n 40; echo "pass-lines $(grep -c "通過\|✓" /tmp/ut.$$)"
  [ $r -ne 0 ] && F=1
done
echo "UNIT EXIT $F"
