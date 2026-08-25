import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import path from 'path';

import apiRouter from '../server/index.mjs';
import { makeTmpDir, writeJson, readJson, rmDir } from './helpers.mjs';

const startServer = () => {
    const app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    return new Promise((resolve) => {
        const server = app.listen(0, () => resolve(server));
    });
};

const stopServer = (server) =>
    new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
    });

describe('server API (localesPath mode)', () => {
    let dir, server, baseUrl, originalCwd;

    beforeEach(async () => {
        dir = await makeTmpDir();
        await writeJson(path.join(dir, 'locales/en.json'), { hello: 'Hello' });
        await writeJson(path.join(dir, 'locales/ru.json'), { hello: 'Привет' });
        await writeJson(path.join(dir, 'mavix.config.json'), { localesPath: 'locales' });

        originalCwd = process.cwd();
        process.chdir(dir);

        server = await startServer();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterEach(async () => {
        await stopServer(server);
        process.chdir(originalCwd);
        await rmDir(dir);
    });

    test('GET /api/translations returns merged translations', async () => {
        const res = await fetch(`${baseUrl}/api/translations`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.deepEqual(body.translations, { hello: { en: 'Hello', ru: 'Привет' } });
    });

    test('POST /api/save updates an existing key on disk', async () => {
        const res = await fetch(`${baseUrl}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes: [{ uiKey: 'hello', lang: 'en', value: 'Hi there' }] }),
        });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);

        const onDisk = await readJson(path.join(dir, 'locales/en.json'));
        assert.equal(onDisk.hello, 'Hi there');
    });

    test('POST /api/save creates a brand-new key in lang.json', async () => {
        const res = await fetch(`${baseUrl}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes: [{ uiKey: 'brandNew.key', lang: 'en', value: 'New value' }] }),
        });
        assert.equal(res.status, 200);

        const onDisk = await readJson(path.join(dir, 'locales/en.json'));
        assert.equal(onDisk.brandNew.key, 'New value');
    });
});

describe('server API (languages / namespace mode)', () => {
    let dir, server, baseUrl, originalCwd;

    beforeEach(async () => {
        dir = await makeTmpDir();
        await writeJson(path.join(dir, 'src/i18n/en/common.json'), { save: 'Save' });
        await writeJson(path.join(dir, 'src/i18n/ru/common.json'), { save: 'Сохранить' });
        await writeJson(path.join(dir, 'mavix.config.json'), {
            languages: { en: 'src/i18n/en', ru: 'src/i18n/ru' },
        });

        originalCwd = process.cwd();
        process.chdir(dir);

        server = await startServer();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterEach(async () => {
        await stopServer(server);
        process.chdir(originalCwd);
        await rmDir(dir);
    });

    test('GET /api/translations returns namespaced uiKeys', async () => {
        const res = await fetch(`${baseUrl}/api/translations`);
        const body = await res.json();
        assert.deepEqual(body.translations, { 'common:save': { en: 'Save', ru: 'Сохранить' } });
    });

    test('POST /api/save writes a new key into the correct namespace file', async () => {
        const res = await fetch(`${baseUrl}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes: [{ uiKey: 'forms:submit', lang: 'en', value: 'Submit' }] }),
        });
        assert.equal(res.status, 200);

        const onDisk = await readJson(path.join(dir, 'src/i18n/en/forms.json'));
        assert.equal(onDisk.submit, 'Submit');
    });

    test('POST /api/save rejects a new key with no namespace when target is a folder', async () => {
        const res = await fetch(`${baseUrl}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes: [{ uiKey: 'noNamespace', lang: 'en', value: 'x' }] }),
        });
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.match(body.error, /namespace/);
    });

    test('POST /api/save rejects an unknown language', async () => {
        const res = await fetch(`${baseUrl}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changes: [{ uiKey: 'common:save', lang: 'fr', value: 'x' }] }),
        });
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.match(body.error, /Unknown language/);
    });
});
