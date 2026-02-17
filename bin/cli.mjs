#!/usr/bin/env node
import express from 'express';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from '../server/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

// Отдача билда фронтенда
app.use(express.static(path.join(__dirname, '../gui/dist')));

const PORT = 4500;
app.listen(PORT, () => {
    console.log(`\x1b[32m✔ Transkit UI: http://localhost:${PORT}\x1b[0m`);
    open(`http://localhost:${PORT}`);
});