import { Platform } from 'react-native';

// RevenueCat'i sadece development build'de import et
let Purchases = null;
try {
  Purchases = require('react-native-purchases').default;
} catch (error) {
  console.log('RevenueCat not available in Expo Go - using test mode');
}

// RevenueCat API Keys
// iOS ve Android için farklı API keys gerekiyor
const API_KEYS = {
  ios: 'test_nxknjfGgrLYeFWdHacLJUKQebnC', // RevenueCat dashboard'dan alınacak
  android: 'test_nxknjfGgrLYeFWdHacLJUKQebnC', // RevenueCat dashboard'dan alınacak
};

// RevenueCat'i başlat
export const initializePurchases = async () => {
  // Expo Go'da çalışmıyorsa skip et
  if (!Purchases) {
    console.log('Running in Expo Go - RevenueCat disabled');
    return;
  }
  
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

// Kullanıcının Pro durumunu kontrol et
export const checkProStatus = async () => {
  if (!Purchases) return false;
  
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // "pro" entitlement'ı kontrol et
    // RevenueCat dashboard'da "pro" adında bir entitlement oluşturmalısınız
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    
    return isPro;
  } catch (error) {
    console.error('Error checking pro status:', error);
    return false;
  }
};

// Mevcut ürünleri (packages) getir
export const getOfferings = async () => {
  if (!Purchases) return [];
  
  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current.availablePackages;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting offerings:', error);
    return [];
  }
};

// Satın alma işlemi
export const purchasePro = async () => {
  if (!Purchases) {
    return {
      success: false,
      error: 'RevenueCat not available - running in Expo Go',
    };
  }
  
  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      // İlk paketi al (Lifetime)
      const lifetimePackage = offerings.current.availablePackages[0];
      
      const { customerInfo } = await Purchases.purchasePackage(lifetimePackage);
      
      // Pro aktif mi kontrol et
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
  } catch (error) {
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

// Satın almaları geri yükle (Restore Purchases)
export const restorePurchases = async () => {
  if (!Purchases) {
    return {
      success: false,
      error: 'RevenueCat not available - running in Expo Go',
    };
  }
  
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    
    return {
      success: true,
      isPro: isPro,
    };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
