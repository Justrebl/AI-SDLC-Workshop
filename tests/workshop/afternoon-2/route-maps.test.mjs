import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../../../', import.meta.url);

test('workshop guides and asset manifest omit retired route-map content', () => {
  for (const path of [
    'docs/afternoon-1/workshop.md',
    'docs/afternoon-2/workshop.md',
    'docs/afternoon-2/assets/README.md',
  ]) {
    const text = readFileSync(new URL(path, root), 'utf8');
    assert.doesNotMatch(text, /a2-route-map|render-route-maps|workshop route map/i, path);
  }
});

test('retired route-map sources, renderer and generated images are absent', () => {
  const paths = [
    'docs/afternoon-2/assets/a2-route-map.mmd',
    'tests/workshop/afternoon-2/render-route-maps.mjs',
    ...Array.from({ length: 7 }, (_, level) => {
      const name = level === 0 ? 'a2-route-map.png' : `a2-route-map-level-${level}.png`;
      return `docs/afternoon-2/assets/${name}`;
    }),
  ];
  for (const path of paths) {
    assert.equal(existsSync(new URL(path, root)), false, path);
  }
});
