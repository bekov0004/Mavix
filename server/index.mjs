import express from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

import { loadConfig } from './config.mjs';
import { scanSources } from './scanner.mjs';
import { buildIndex } from './indexBuilder.mjs';
import { setDeep, dotPathToJsonPath, parseUiKey } from './jsonPath.mjs';

const router = express.Router();

const loadFreshIndex = async () => {
    const config = await loadConfig();
    const sourcesByLang = await scanSources(config);
    return { config, ...buildIndex(sourcesByLang) };
};

router.get('/translations', async (req, res) => {
    try {
        const { translations } = await loadFreshIndex();
        res.json({ translations });
    } catch (e) {
        console.error("Mavix Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Determines the file a new key should be written to, creating the file
 * (and any missing parent directories) with an empty object if it doesn't exist yet.
 */
const resolveTargetFile = async (config, lang, namespace, dataCache) => {
    if (config.mode === 'localesPath') {
        const filePath = path.join(config.localesPath, `${lang}.json`);
        if (!dataCache.has(filePath)) {
            const data = existsSync(filePath) ? JSON.parse(await fs.readFile(filePath, 'utf-8')) : {};
            dataCache.set(filePath, data);
        }
        return filePath;
    }

    const targetBase = config.languages[lang];
    if (!targetBase) {
        const err = new Error(`Unknown language "${lang}": no entry in config.languages.`);
        err.status = 400;
        throw err;
    }

    let isDirectory;
    if (existsSync(targetBase)) {
        isDirectory = (await fs.stat(targetBase)).isDirectory();
    } else {
        isDirectory = !targetBase.endsWith('.json');
    }

    let filePath;
    if (isDirectory) {
        if (!namespace) {
            const err = new Error(
                `Cannot add key for language "${lang}": target is a folder, key must specify a namespace (e.g. "common:my.key").`
            );
            err.status = 400;
            throw err;
        }
        filePath = path.join(targetBase, `${namespace}.json`);
    } else {
        filePath = targetBase;
    }

    if (!dataCache.has(filePath)) {
        if (existsSync(filePath)) {
            dataCache.set(filePath, JSON.parse(await fs.readFile(filePath, 'utf-8')));
        } else {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            dataCache.set(filePath, {});
        }
    }

    return filePath;
};

router.post('/save', async (req, res) => {
    try {
        const { changes } = req.body;
        if (!Array.isArray(changes)) {
            return res.status(400).json({ error: '"changes" must be an array of { uiKey, lang, value }.' });
        }

        const { config, index, dataCache } = await loadFreshIndex();
        const dirtyFiles = new Set();

        for (const { uiKey, lang, value } of changes) {
            const existing = index.get(uiKey)?.get(lang);

            if (existing) {
                setDeep(dataCache.get(existing.filePath), existing.jsonPath, value);
                dirtyFiles.add(existing.filePath);
                continue;
            }

            const { namespace, dotPath } = parseUiKey(uiKey);
            const filePath = await resolveTargetFile(config, lang, namespace, dataCache);
            setDeep(dataCache.get(filePath), dotPathToJsonPath(dotPath), value);
            dirtyFiles.add(filePath);
        }

        for (const filePath of dirtyFiles) {
            await fs.writeFile(filePath, JSON.stringify(dataCache.get(filePath), null, 2));
        }

        res.json({ success: true, filesWritten: [...dirtyFiles] });
    } catch (e) {
        console.error("Mavix Error:", e.message);
        res.status(e.status || 500).json({ error: e.message });
    }
});

export default router;
