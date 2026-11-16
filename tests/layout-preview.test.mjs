import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutPreview } from '../mods/omarchy-settings/preview.js';

test('Settings finds preview inside a wrapped layout', () => {
  assert.equal(layoutPreview({ children: [{ id: 'root', preview: 'layouts/omarchy.svg' }] }), 'layouts/omarchy.svg');
  assert.equal(layoutPreview({ preview: 'outer.svg', children: [{ preview: 'inner.svg' }] }), 'outer.svg');
  assert.equal(layoutPreview({ preview: '', children: [{ preview: 4 }] }), null);
  assert.equal(layoutPreview(null), null);
});
