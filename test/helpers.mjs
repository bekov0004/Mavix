import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/** Creates a fresh temp directory and returns its absolute path. */
export const makeTmpDir = async () => {
    return fs.mkdtemp(path.join(os.tmpdir(), 'mavix-test-'));
};

export const writeJson = async (filePath, data) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

export const readJson = async (filePath) => {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
};

export const rmDir = async (dir) => {
    await fs.rm(dir, { recursive: true, force: true });
};
