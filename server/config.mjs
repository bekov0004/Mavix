import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CONFIG_FILENAME = 'mavix.config.json';

/**
 * Loads and normalizes mavix.config.json.
 * Returns either:
 *   { mode: 'languages', languages: { [lang]: absolutePath } }
 *   { mode: 'localesPath', localesPath: absolutePath }
 */
export const loadConfig = async () => {
    const configPath = path.join(process.cwd(), CONFIG_FILENAME);

    if (!existsSync(configPath)) {
        throw new Error(
            `Configuration file "${CONFIG_FILENAME}" not found. ` +
            `Please create it in the root directory and specify "languages" or "localesPath".`
        );
    }

    let config;
    try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configContent);
    } catch (e) {
        throw new Error(`Error reading config: ${e.message}`);
    }

    if (config.languages && typeof config.languages === 'object' && Object.keys(config.languages).length > 0) {
        const languages = {};
        for (const [lang, targetPath] of Object.entries(config.languages)) {
            languages[lang] = path.resolve(process.cwd(), targetPath);
        }
        return { mode: 'languages', languages };
    }

    if (config.localesPath) {
        const absolutePath = path.resolve(process.cwd(), config.localesPath);
        if (!existsSync(absolutePath)) {
            throw new Error(`The directory specified in localesPath "${config.localesPath}" does not exist.`);
        }
        return { mode: 'localesPath', localesPath: absolutePath };
    }

    throw new Error(
        `Configuration must specify either "languages" (map of lang -> path) or "localesPath" in ${CONFIG_FILENAME}.`
    );
};
