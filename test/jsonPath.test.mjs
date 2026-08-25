import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { flattenLeaves, setDeep, dotPathToJsonPath, buildUiKey, parseUiKey } from '../src/server/jsonPath.mjs';

describe('jsonPath.mjs', () => {
    test('flattenLeaves yields dot paths for nested objects', () => {
        const obj = { a: { b: 'x', c: { d: 'y' } }, e: 'z' };
        const leaves = [...flattenLeaves(obj)];

        assert.deepEqual(
            leaves.map((l) => l.dotPath).sort(),
            ['a.b', 'a.c.d', 'e']
        );
        assert.deepEqual(
            leaves.find((l) => l.dotPath === 'a.c.d').jsonPath,
            ['a', 'c', 'd']
        );
    });

    test('flattenLeaves treats arrays as leaf values', () => {
        const obj = { list: [1, 2, 3] };
        const leaves = [...flattenLeaves(obj)];
        assert.equal(leaves.length, 1);
        assert.deepEqual(leaves[0].value, [1, 2, 3]);
    });

    test('setDeep creates intermediate objects as needed', () => {
        const obj = {};
        setDeep(obj, ['a', 'b', 'c'], 'value');
        assert.deepEqual(obj, { a: { b: { c: 'value' } } });
    });

    test('setDeep overwrites a non-object in the path', () => {
        const obj = { a: 'not an object' };
        setDeep(obj, ['a', 'b'], 'value');
        assert.deepEqual(obj, { a: { b: 'value' } });
    });

    test('dotPathToJsonPath splits on dots', () => {
        assert.deepEqual(dotPathToJsonPath('a.b.c'), ['a', 'b', 'c']);
    });

    test('buildUiKey / parseUiKey round-trip with a namespace', () => {
        const key = buildUiKey('common', 'a.b');
        assert.equal(key, 'common:a.b');
        assert.deepEqual(parseUiKey(key), { namespace: 'common', dotPath: 'a.b' });
    });

    test('buildUiKey / parseUiKey round-trip without a namespace', () => {
        const key = buildUiKey('', 'a.b');
        assert.equal(key, 'a.b');
        assert.deepEqual(parseUiKey(key), { namespace: '', dotPath: 'a.b' });
    });
});
