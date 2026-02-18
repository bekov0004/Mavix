#!/usr/bin/env node
import express from 'express';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import apiRouter from '../server/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.use('/api', apiRouter);

const distPath = path.join(__dirname, '../gui/dist');

if (existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.warn('\x1b[33m⚠ Warning: gui/dist not found. Run "npm run gui:build" first.\x1b[0m');
}

const PORT = 4500;
app.listen(PORT, async () => {
    console.log(`\x1b[32m✔ Mavix UI: http://localhost:${PORT}\x1b[0m`);
    try {
        await open(`http://localhost:${PORT}`);
    } catch (err) {
        console.log('Browser could not be opened automatically.');
    }
});