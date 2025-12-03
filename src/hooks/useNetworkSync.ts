import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { runFullSync } from "../services/SyncService";

export function useNetworkSync() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      
      // If we just came online (and we weren't null before), trigger sync
      if (online && isConnected === false) {
        console.log("📶 Network Restored: Triggering Auto-Sync...");
        runFullSync().catch(err => console.error("Auto-sync failed:", err));
      }

      setIsConnected(!!online);
    });

    return () => unsubscribe();
  }, [isConnected]);

  return isConnected;
}