import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';

// RevenueCat API Keys
const API_KEYS = {
  ios: 'test_nxknjfGgrLYeFWdHacLJUKQebnC', // Replace with your actual iOS RevenueCat API key
  android: 'test_nxknjfGgrLYeFWdHacLJUKQebnC', // Replace with your actual Android RevenueCat API key
};

// Initialize RevenueCat
export const initializePurchases = async () => {
  try {
    if (Platform.OS === 'ios') {
      await Purchases.configure({ apiKey: API_KEYS.ios });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: API_KEYS.android });
    }
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

// Check user's Pro status
export const checkProStatus = async (): Promise<boolean> => {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();

    // Check for the "pro" entitlement
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;

    return isPro;
  } catch (error) {
    console.error('Error checking pro status:', error);
    return false;
  }
};

// Get available products (packages)
export const getOfferings = async (): Promise<PurchasesPackage[]> => {
  try {
    const offerings: any = await Purchases.getOfferings();

    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current.availablePackages;
    }

    return [];
  } catch (error) {
    console.error('Error getting offerings:', error);
    return [];
  }
};

interface PurchaseResult {
  success: boolean;
  isPro?: boolean;
  cancelled?: boolean;
  error?: string;
}

// Perform a purchase
export const purchasePro = async (): Promise<PurchaseResult> => {
  try {
    const offerings: any = await Purchases.getOfferings();

    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      // Get the first package (assuming it's the Lifetime)
      const lifetimePackage: PurchasesPackage = offerings.current.availablePackages[0];

      const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);

      // Check if Pro is active
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;

      return {
        success: true,
        isPro: isPro,
      };
    }

    return {
      success: false,
      error: 'No packages available',
    };
  } catch (error: any) {
    if (error.userCancelled) {
      return {
        success: false,
        cancelled: true,
      };
    }

    console.error('Error purchasing:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<PurchaseResult> => {
  try {
    const customerInfo: CustomerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;

    return {
      success: true,
      isPro: isPro,
    };
  } catch (error: any) {
    console.error('Error restoring purchases:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/*
IMPORTANT:
For RevenueCat to work correctly, you need to perform native setup steps for both iOS and Android.
This typically involves:
- Adding API keys to your `Info.plist` (iOS) and `AndroidManifest.xml`/`strings.xml` (Android).
- Configuring App Store Connect and Google Play Console for in-app purchases/subscriptions.
- Linking the native modules (if auto-linking doesn't work).

Please refer to the official react-native-purchases documentation for detailed native setup instructions:
https://docs.revenuecat.com/docs/react-native
*/
