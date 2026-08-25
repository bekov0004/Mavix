import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';

import { loadConfig } from '../server/config.mjs';
import { makeTmpDir, writeJson, rmDir } from './helpers.mjs';

const withCwd = async (dir, fn) => {
    const original = process.cwd();
    process.chdir(dir);
    try {
        return await fn();
    } finally {
        process.chdir(original);
    }
};

describe('config.mjs loadConfig', () => {
    test('throws when mavix.config.json is missing', async () => {
        const dir = await makeTmpDir();
        try {
            await withCwd(dir, async () => {
                await assert.rejects(() => loadConfig(), /not found/);
            });
        } finally {
            await rmDir(dir);
        }
    });

    test('throws on invalid JSON', async () => {
        const dir = await makeTmpDir();
        try {
            const fs = await import('fs/promises');
            await fs.writeFile(path.join(dir, 'mavix.config.json'), '{ not valid json');
            await withCwd(dir, async () => {
                await assert.rejects(() => loadConfig(), /Error reading config/);
            });
        } finally {
            await rmDir(dir);
        }
    });

    test('resolves "languages" mode with absolute paths', async () => {
        const dir = await makeTmpDir();
        try {
            await writeJson(path.join(dir, 'mavix.config.json'), {
                languages: { en: 'src/i18n/en', ru: 'src/i18n/ru' },
            });
            const config = await withCwd(dir, () => loadConfig());
            assert.equal(config.mode, 'languages');
            assert.equal(config.languages.en, path.resolve(dir, 'src/i18n/en'));
            assert.equal(config.languages.ru, path.resolve(dir, 'src/i18n/ru'));
        } finally {
            await rmDir(dir);
        }
    });

    test('resolves "localesPath" mode when the directory exists', async () => {
        const dir = await makeTmpDir();
        try {
            const localesDir = path.join(dir, 'locales');
            await (await import('fs/promises')).mkdir(localesDir);
            await writeJson(path.join(dir, 'mavix.config.json'), { localesPath: 'locales' });
            const config = await withCwd(dir, () => loadConfig());
            assert.equal(config.mode, 'localesPath');
            assert.equal(config.localesPath, localesDir);
        } finally {
            await rmDir(dir);
        }
    });

    test('throws when localesPath directory does not exist', async () => {
        const dir = await makeTmpDir();
        try {
            await writeJson(path.join(dir, 'mavix.config.json'), { localesPath: 'does-not-exist' });
            await withCwd(dir, async () => {
                await assert.rejects(() => loadConfig(), /does not exist/);
            });
        } finally {
            await rmDir(dir);
        }
    });

    test('throws when neither "languages" nor "localesPath" is present', async () => {
        const dir = await makeTmpDir();
        try {
            await writeJson(path.join(dir, 'mavix.config.json'), { foo: 'bar' });
            await withCwd(dir, async () => {
                await assert.rejects(() => loadConfig(), /must specify either/);
            });
        } finally {
            await rmDir(dir);
        }
    });

    test('an empty "languages" object falls back to "localesPath"', async () => {
        const dir = await makeTmpDir();
        try {
            const localesDir = path.join(dir, 'locales');
            await (await import('fs/promises')).mkdir(localesDir);
            await writeJson(path.join(dir, 'mavix.config.json'), { languages: {}, localesPath: 'locales' });
            const config = await withCwd(dir, () => loadConfig());
            assert.equal(config.mode, 'localesPath');
        } finally {
            await rmDir(dir);
        }
    });
});
