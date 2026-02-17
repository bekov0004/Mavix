import express from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { flatten, unflatten } from 'flat';

const router = express.Router();
const CONFIG_FILENAME = 'transkit.config.json';

const loadConfig = async () => {
    const configPath = path.join(process.cwd(), CONFIG_FILENAME);

    if (!existsSync(configPath)) {
        throw new Error(
            `Configuration file "${CONFIG_FILENAME}" not found. ` +
            `Please create it in the root directory and specify "localesPath".`
        );
    }

    try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (!config.localesPath) {
            throw new Error(`Field "localesPath" is missing in ${CONFIG_FILENAME}`);
        }

        const absolutePath = path.resolve(process.cwd(), config.localesPath);

        if (!existsSync(absolutePath)) {
            throw new Error(`The directory specified in localesPath "${config.localesPath}" does not exist.`);
        }

        return absolutePath;
    } catch (e) {
        throw new Error(`Error reading config: ${e.message}`);
    }
};

router.get('/translations', async (req, res) => {
    try {
        const dir = await loadConfig();
        const files = (await fs.readdir(dir)).filter(f => f.endsWith('.json'));
        const data = {};

        for (const file of files) {
            const content = JSON.parse(await fs.readFile(path.join(dir, file), 'utf-8'));
            data[path.basename(file, '.json')] = flatten(content);
        }
        res.json(data);
    } catch (e) {
        console.error("Transkit Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

router.post('/save', async (req, res) => {
    try {
        const { translations } = req.body;
        const dir = await loadConfig();

        for (const [lang, content] of Object.entries(translations)) {
            const nested = unflatten(content, { object: true });
            await fs.writeFile(
                path.join(dir, `${lang}.json`),
                JSON.stringify(nested, null, 2)
            );
        }
        res.json({ success: true });
    } catch (e) {
        console.error("Transkit Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

export default router;