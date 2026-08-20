const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Recursively flattens a parsed JSON object into leaves.
 * Yields { dotPath, jsonPath, value } for every primitive (or array) leaf.
 */
export function* flattenLeaves(obj, jsonPath = []) {
    for (const [key, value] of Object.entries(obj)) {
        const nextPath = [...jsonPath, key];
        if (isPlainObject(value)) {
            yield* flattenLeaves(value, nextPath);
        } else {
            yield { dotPath: nextPath.join('.'), jsonPath: nextPath, value };
        }
    }
}

/** Sets a value deep inside an object, creating intermediate objects as needed. */
export const setDeep = (obj, jsonPath, value) => {
    let cursor = obj;
    for (let i = 0; i < jsonPath.length - 1; i++) {
        const segment = jsonPath[i];
        if (!isPlainObject(cursor[segment])) {
            cursor[segment] = {};
        }
        cursor = cursor[segment];
    }
    cursor[jsonPath[jsonPath.length - 1]] = value;
};

export const dotPathToJsonPath = (dotPath) => dotPath.split('.');

export const buildUiKey = (namespace, dotPath) => (namespace ? `${namespace}:${dotPath}` : dotPath);

export const parseUiKey = (uiKey) => {
    const sepIndex = uiKey.indexOf(':');
    if (sepIndex === -1) {
        return { namespace: '', dotPath: uiKey };
    }
    return { namespace: uiKey.slice(0, sepIndex), dotPath: uiKey.slice(sepIndex + 1) };
};
