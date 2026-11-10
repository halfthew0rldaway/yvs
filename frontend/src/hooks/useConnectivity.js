import { useState, useEffect } from "react";
import connectivity from "../services/connectivity";

/**
 * React hook to observe online / offline / reconnecting state in any component
 */
export function useConnectivity() {
    const [status, setStatus] = useState(() => connectivity.status);

    useEffect(() => {
        return connectivity.subscribe((newStatus) => {
            setStatus(newStatus);
        });
    }, []);

    return {
        status,
        isOnline: status === "online",
        isOffline: status === "offline",
        isReconnecting: status === "reconnecting",
        checkNow: () => connectivity.verifyConnectivity()
    };
}

export default useConnectivity;
