import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagramForLevel } from './render-route-maps.mjs';

const guide = readFileSync(new URL('../../../docs/afternoon-2/workshop.md', import.meta.url), 'utf8');

test('route maps highlight only the current level without marking work completed', () => {
  assert.doesNotMatch(diagramForLevel(0), /class l\d current/);
  for (let level = 1; level <= 6; level++) {
    const source = diagramForLevel(level);
    assert.deepEqual([...source.matchAll(/class (l\d) current/g)].map(match => match[1]), [`l${level}`]);
    const inactive = source.match(/class ([\w,]+) upcoming/)[1].split(',');
    assert.equal(inactive.length, 6);
    assert.ok(!inactive.includes(`l${level}`));
    assert.ok(inactive.includes('recap'));
    assert.doesNotMatch(source, /completed|done/i);
  }
  assert.throws(() => diagramForLevel(7), RangeError);
});

test('each guide level embeds a generated PNG route map in its own page', () => {
  for (let level = 0; level <= 6; level++) {
    const name = level === 0 ? 'a2-route-map.png' : `a2-route-map-level-${level}.png`;
    const image = readFileSync(new URL(`../../../docs/afternoon-2/assets/${name}`, import.meta.url));
    assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(image.readUInt32BE(16) >= 1200);
    const start = level === 0 ? 0 : guide.indexOf(`# Level ${level}:`);
    const end = guide.indexOf(level === 6 ? '# Recap:' : `# Level ${level + 1}:`, start);
    assert.ok(guide.slice(start, end).includes(`](assets/${name})`), name);
  }
  const discovery = guide.slice(guide.indexOf('# Level 2:'), guide.indexOf('# Level 3:'));
  const image = '](assets/a2-route-map-level-2.png)';
  assert.equal(discovery.split(image).length - 1, 1);
  assert.doesNotMatch(discovery, /l2-dt-coach-framing\.png/);
  assert.ok(discovery.indexOf(image) > discovery.indexOf('</details>'));
  assert.ok(discovery.indexOf(image) < discovery.indexOf('## Start a DT project'));
});
