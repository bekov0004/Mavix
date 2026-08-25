import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildIndex } from '../server/indexBuilder.mjs';

describe('indexBuilder.mjs buildIndex', () => {
    test('builds flat translations keyed by uiKey -> lang -> value', () => {
        const sourcesByLang = new Map([
            ['en', [{ filePath: '/en.json', namespace: '', data: { hello: 'Hello' } }]],
            ['ru', [{ filePath: '/ru.json', namespace: '', data: { hello: 'Привет' } }]],
        ]);

        const { translations, index, dataCache } = buildIndex(sourcesByLang);

        assert.deepEqual(translations, { hello: { en: 'Hello', ru: 'Привет' } });
        assert.deepEqual(index.get('hello').get('en'), { filePath: '/en.json', jsonPath: ['hello'] });
        assert.equal(dataCache.get('/en.json').hello, 'Hello');
    });

    test('namespaces prefix the uiKey', () => {
        const sourcesByLang = new Map([
            ['en', [{ filePath: '/en/common.json', namespace: 'common', data: { save: 'Save' } }]],
        ]);

        const { translations } = buildIndex(sourcesByLang);

        assert.deepEqual(translations, { 'common:save': { en: 'Save' } });
    });

    test('merges multiple namespace files for the same language', () => {
        const sourcesByLang = new Map([
            [
                'en',
                [
                    { filePath: '/en/common.json', namespace: 'common', data: { save: 'Save' } },
                    { filePath: '/en/forms.json', namespace: 'forms', data: { submit: 'Submit' } },
                ],
            ],
        ]);

        const { translations } = buildIndex(sourcesByLang);

        assert.deepEqual(translations, {
            'common:save': { en: 'Save' },
            'forms:submit': { en: 'Submit' },
        });
    });

    test('nested keys within a file flatten to dot paths', () => {
        const sourcesByLang = new Map([
            ['en', [{ filePath: '/en.json', namespace: '', data: { a: { b: 'x' } } }]],
        ]);

        const { translations, index } = buildIndex(sourcesByLang);

        assert.deepEqual(translations, { 'a.b': { en: 'x' } });
        assert.deepEqual(index.get('a.b').get('en').jsonPath, ['a', 'b']);
    });
});
