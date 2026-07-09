export const SHARED_STORAGE_KEY = 'pml_dsl_shared_state';
export function readSharedState() {
    try {
        const raw = localStorage.getItem(SHARED_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function writeSharedState(state) {
    try {
        localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(state));
    }
    catch {
        // storage full or unavailable
    }
}
export function onSharedStateChange(callback) {
    const handler = (e) => {
        if (e.key === SHARED_STORAGE_KEY && e.newValue) {
            try {
                callback(JSON.parse(e.newValue));
            }
            catch {
                // ignore corrupt data
            }
        }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
}
