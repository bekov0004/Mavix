import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * @typedef {Object} SourceFile
 * @property {string} filePath - absolute path on disk
 * @property {string} namespace - '' for a single file per language, otherwise the
 *   relative path (posix separators) of the file inside the language folder, without extension
 * @property {any} data - parsed JSON content (object)
 */

const readJson = async (filePath) => {
    const raw = await fs.readFile(filePath, 'utf-8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`Mavix: skipping invalid JSON file "${filePath}": ${e.message}`);
        return undefined;
    }
};

const walkJsonFiles = async (rootDir, currentDir = rootDir) => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
            results.push(...await walkJsonFiles(rootDir, fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            const relative = path.relative(rootDir, fullPath);
            const namespace = relative.slice(0, -'.json'.length).split(path.sep).join('/');
            results.push({ filePath: fullPath, namespace });
        }
    }

    return results;
};

/**
 * Scans all configured translation sources.
 * @returns {Promise<Map<string, SourceFile[]>>} lang -> list of SourceFile
 */
export const scanSources = async (config) => {
    const sourcesByLang = new Map();

    if (config.mode === 'languages') {
        for (const [lang, targetPath] of Object.entries(config.languages)) {
            if (!existsSync(targetPath)) {
                console.warn(`Mavix: language "${lang}" path "${targetPath}" does not exist, skipping.`);
                continue;
            }

            const stat = await fs.stat(targetPath);
            const files = [];

            if (stat.isFile()) {
                const data = await readJson(targetPath);
                if (data !== undefined) {
                    files.push({ filePath: targetPath, namespace: '', data });
                }
            } else if (stat.isDirectory()) {
                const found = await walkJsonFiles(targetPath);
                for (const { filePath, namespace } of found) {
                    const data = await readJson(filePath);
                    if (data !== undefined) {
                        files.push({ filePath, namespace, data });
                    }
                }
            }

            sourcesByLang.set(lang, files);
        }

        return sourcesByLang;
    }

    if (config.mode === 'namespacesPath') {
        const nsEntries = await fs.readdir(config.namespacesPath, { withFileTypes: true });
        const namespaceDirs = nsEntries.filter((e) => e.isDirectory());

        for (const nsEntry of namespaceDirs) {
            const namespace = nsEntry.name;
            const nsPath = path.join(config.namespacesPath, namespace);
            const langEntries = await fs.readdir(nsPath, { withFileTypes: true });
            const jsonFiles = langEntries.filter((e) => e.isFile() && e.name.endsWith('.json'));

            for (const entry of jsonFiles) {
                const lang = path.basename(entry.name, '.json');
                const filePath = path.join(nsPath, entry.name);
                const data = await readJson(filePath);
                if (data !== undefined) {
                    if (!sourcesByLang.has(lang)) sourcesByLang.set(lang, []);
                    sourcesByLang.get(lang).push({ filePath, namespace, data });
                }
            }
        }

        return sourcesByLang;
    }

    // localesPath mode (flat, backwards compatible)
    const dirEntries = await fs.readdir(config.localesPath, { withFileTypes: true });
    const jsonFiles = dirEntries.filter(e => e.isFile() && e.name.endsWith('.json'));

    for (const entry of jsonFiles) {
        const lang = path.basename(entry.name, '.json');
        const filePath = path.join(config.localesPath, entry.name);
        const data = await readJson(filePath);
        if (data !== undefined) {
            sourcesByLang.set(lang, [{ filePath, namespace: '', data }]);
        }
    }

    return sourcesByLang;
};
