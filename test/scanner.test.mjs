import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';

import { scanSources } from '../server/scanner.mjs';
import { makeTmpDir, writeJson, rmDir } from './helpers.mjs';

describe('scanner.mjs scanSources', () => {
    test('localesPath mode reads flat lang.json files', async () => {
        const dir = await makeTmpDir();
        try {
            await writeJson(path.join(dir, 'en.json'), { hello: 'Hello' });
            await writeJson(path.join(dir, 'ru.json'), { hello: 'Привет' });

            const sources = await scanSources({ mode: 'localesPath', localesPath: dir });

            assert.deepEqual([...sources.keys()].sort(), ['en', 'ru']);
            assert.equal(sources.get('en')[0].namespace, '');
            assert.deepEqual(sources.get('en')[0].data, { hello: 'Hello' });
        } finally {
            await rmDir(dir);
        }
    });

    test('languages mode with a single file per language', async () => {
        const dir = await makeTmpDir();
        try {
            const enFile = path.join(dir, 'en.json');
            await writeJson(enFile, { greeting: 'Hi' });

            const sources = await scanSources({ mode: 'languages', languages: { en: enFile } });

            assert.equal(sources.get('en').length, 1);
            assert.equal(sources.get('en')[0].namespace, '');
            assert.deepEqual(sources.get('en')[0].data, { greeting: 'Hi' });
        } finally {
            await rmDir(dir);
        }
    });

    test('languages mode recursively scans namespace folders', async () => {
        const dir = await makeTmpDir();
        try {
            const enDir = path.join(dir, 'en');
            await writeJson(path.join(enDir, 'common.json'), { save: 'Save' });
            await writeJson(path.join(enDir, 'nested', 'forms.json'), { submit: 'Submit' });

            const sources = await scanSources({ mode: 'languages', languages: { en: enDir } });
            const files = sources.get('en');
            const namespaces = files.map((f) => f.namespace).sort();

            assert.deepEqual(namespaces, ['common', 'nested/forms']);
        } finally {
            await rmDir(dir);
        }
    });

    test('skips invalid JSON files instead of throwing', async () => {
        const dir = await makeTmpDir();
        try {
            const fs = await import('fs/promises');
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(path.join(dir, 'en.json'), '{ broken');

            const sources = await scanSources({ mode: 'localesPath', localesPath: dir });

            assert.equal(sources.size, 0);
        } finally {
            await rmDir(dir);
        }
    });

    test('namespacesPath mode reads {namespace}/{lang}.json files', async () => {
        const dir = await makeTmpDir();
        try {
            await writeJson(path.join(dir, 'common', 'en.json'), { welcome: 'Welcome' });
            await writeJson(path.join(dir, 'common', 'ru.json'), { welcome: 'Привет' });
            await writeJson(path.join(dir, 'forms', 'en.json'), { submit: 'Submit' });

            const sources = await scanSources({ mode: 'namespacesPath', namespacesPath: dir });

            assert.deepEqual([...sources.keys()].sort(), ['en', 'ru']);
            const enFiles = sources.get('en');
            assert.deepEqual(
                enFiles.map((f) => f.namespace).sort(),
                ['common', 'forms']
            );
            assert.deepEqual(
                enFiles.find((f) => f.namespace === 'common').data,
                { welcome: 'Welcome' }
            );
            assert.equal(sources.get('ru').length, 1);
        } finally {
            await rmDir(dir);
        }
    });

    test('missing language path is skipped, not fatal', async () => {
        const dir = await makeTmpDir();
        try {
            const sources = await scanSources({
                mode: 'languages',
                languages: { en: path.join(dir, 'nope') },
            });
            assert.equal(sources.has('en'), false);
        } finally {
            await rmDir(dir);
        }
    });
});
