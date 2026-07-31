const storage = {
    set: (key, value) => {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
        } catch (err) {
            console.error("Storage set error:", err);
        }
    },

    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (err) {
            console.error("Storage get error:", err);
            return null;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (err) {
            console.error("Storage remove error:", err);
        }
    },

    clear: () => {
        try {
            localStorage.clear();
        } catch (err) {
            console.error("Storage clear error:", err);
        }
    },
};

export default storage;