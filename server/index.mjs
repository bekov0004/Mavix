import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { flatten, unflatten } from 'flat';

const router = express.Router();
const getLocalesPath = () => path.join(process.cwd(), 'locales');

router.get('/translations', async (req, res) => {
    try {
        const dir = getLocalesPath();
        const files = (await fs.readdir(dir)).filter(f => f.endsWith('.json'));
        const data = {};
        for (const file of files) {
            const content = JSON.parse(await fs.readFile(path.join(dir, file), 'utf-8'));
            data[path.basename(file, '.json')] = flatten(content);
        }
        res.json(data);
    } catch (e) { res.status(500).send(e.message); }
});

router.post('/save', async (req, res) => {
    const { translations } = req.body;
    const dir = getLocalesPath();
    for (const [lang, content] of Object.entries(translations)) {
        const nested = unflatten(content, { object: true });
        await fs.writeFile(path.join(dir, `${lang}.json`), JSON.stringify(nested, null, 2));
    }
    res.json({ success: true });
});

export default router;