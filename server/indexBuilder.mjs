import { flattenLeaves, buildUiKey } from './jsonPath.mjs';

/**
 * @typedef {Object} TranslationIndex
 * @property {Object<string, Object<string, any>>} translations - uiKey -> lang -> value
 * @property {Map<string, Map<string, {filePath: string, jsonPath: string[]}>>} index - uiKey -> lang -> location
 * @property {Map<string, any>} dataCache - filePath -> parsed JSON object (mutable reference)
 */

/**
 * Builds a translation index from scanned sources.
 * @param {Map<string, import('./scanner.mjs').SourceFile[]>} sourcesByLang
 * @returns {TranslationIndex}
 */
export const buildIndex = (sourcesByLang) => {
    const translations = {};
    const index = new Map();
    const dataCache = new Map();

    for (const [lang, files] of sourcesByLang.entries()) {
        for (const file of files) {
            dataCache.set(file.filePath, file.data);

            for (const { dotPath, jsonPath, value } of flattenLeaves(file.data)) {
                const uiKey = buildUiKey(file.namespace, dotPath);

                if (!translations[uiKey]) translations[uiKey] = {};
                translations[uiKey][lang] = value;

                if (!index.has(uiKey)) index.set(uiKey, new Map());
                index.get(uiKey).set(lang, { filePath: file.filePath, jsonPath });
            }
        }
    }

    return { translations, index, dataCache };
};
