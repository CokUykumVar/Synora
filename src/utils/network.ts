import * as Network from 'expo-network';

export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected === true && networkState.isInternetReachable === true;
  } catch (error) {
    console.log('Network check error:', error);
    return false;
  }
};

// Legacy function - overlay is now handled by NetworkContext
export const showNoInternetAlert = () => {
  // No-op: NetworkContext handles the overlay automatically
};
