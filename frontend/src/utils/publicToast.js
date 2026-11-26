let toasterActive = false;
const listeners = new Set();

export function subscribePublicToast(cb) {
    if (toasterActive) cb(true);
    listeners.add(cb);
    return () => listeners.delete(cb);
}

export async function showPublicToast(type, message) {
    if (!toasterActive) {
        toasterActive = true;
        listeners.forEach((cb) => cb(true));
    }
    try {
        const { default: toast } = await import("react-hot-toast");
        if (typeof toast[type] === "function") {
            toast[type](message);
        } else {
            toast(message);
        }
    } catch {
        // Silent fallback if toast chunk cannot load
    }
}
