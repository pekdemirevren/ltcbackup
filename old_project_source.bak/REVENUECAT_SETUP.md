# RevenueCat Kurulum Rehberi

## 1. RevenueCat Hesabı Oluşturma

1. [RevenueCat](https://www.revenuecat.com/) sitesine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'a giriş yapın

## 2. Uygulama Oluşturma

1. RevenueCat Dashboard'da "Projects" → "Create new app" tıklayın
2. App Store ve Google Play bilgilerinizi girin:
   - **iOS Bundle ID**: `com.ledcountdowntimer` (veya kendi bundle ID'niz)
   - **Android Package Name**: `com.ledcountdowntimer` (veya kendi package name'iniz)

## 3. API Keys

1. Dashboard'da "API Keys" sekmesine gidin
2. iOS ve Android için API keys'leri kopyalayın
3. `RevenueCatConfig.js` dosyasındaki API_KEYS'e yapıştırın:

```javascript
const API_KEYS = {
  ios: 'BURAYA_IOS_API_KEY',
  android: 'BURAYA_ANDROID_API_KEY',
};
```

## 4. Entitlement Oluşturma

1. Dashboard'da "Entitlements" sekmesine gidin
2. "Create Entitlement" butonuna tıklayın
3. Entitlement ID: **"pro"** (önemli: tam olarak "pro" olmalı)
4. Display Name: "Pro Features"

## 5. Ürün (Product) Oluşturma

### App Store Connect (iOS):
1. [App Store Connect](https://appstoreconnect.apple.com/) giriş yapın
2. "My Apps" → Uygulamanız → "Features" → "In-App Purchases"
3. Yeni In-App Purchase oluşturun:
   - Type: **Non-Consumable** (Tek seferlik satın alma)
   - Product ID: `led_timer_pro_lifetime`
   - Display Name: "LED Timer Pro - Lifetime"
   - Price: İstediğiniz fiyat (örn: $4.99)

### Google Play Console (Android):
1. [Google Play Console](https://play.google.com/console/) giriş yapın
2. Uygulamanız → "Monetize" → "Products" → "In-app products"
3. Yeni ürün oluşturun:
   - Product ID: `led_timer_pro_lifetime`
   - Name: "LED Timer Pro - Lifetime"
   - Type: **Managed product** (one-time purchase)
   - Price: İstediğiniz fiyat

## 6. RevenueCat'te Ürün Bağlama

1. RevenueCat Dashboard → "Products" sekmesine gidin
2. "Add Product" tıklayın
3. Product ID'leri girin:
   - iOS: `led_timer_pro_lifetime`
   - Android: `led_timer_pro_lifetime`
4. "pro" entitlement'ına bağlayın

## 7. Offering Oluşturma

1. RevenueCat Dashboard → "Offerings" sekmesine gidin
2. Default offering'e tıklayın (veya yeni oluşturun)
3. "Add Package" → "Lifetime" seçin
4. Ürününüzü (`led_timer_pro_lifetime`) seçin

## 8. Test Etme

### iOS Test:
1. Xcode'da uygulama açın
2. Development Build oluşturun (Expo Go değil!)
3. TestFlight veya simulator'da test edin
4. Sandbox test kullanıcısı oluşturun (App Store Connect → Users and Access)

### Android Test:
1. Development Build oluşturun
2. Google Play Console'da test kullanıcısı ekleyin
3. Internal test track'e yükleyin

## 9. Development Build Oluşturma

Expo Go, native modüller içeren uygulamaları çalıştıramaz. Development Build gerekli:

```bash
# iOS için
npx expo run:ios

# Android için
npx expo run:android

# Veya EAS Build ile
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

## 10. Test Modu

API keys eklenmemiş veya RevenueCat yapılandırılmamışsa, uygulama "Test Modu" ile çalışır:
- Pro özellikleri sadece local storage ile aktif edilir
- Gerçek satın alma yapılmaz
- Geliştirme sırasında hızlı test için kullanılır

## Önemli Notlar

- RevenueCat, native kod içerdiği için **Expo Go'da ÇALIŞMAZ**
- Development Build veya Production Build gereklidir
- Sandbox/Test modunda satın almalar gerçek para kullanmaz
- Production'a çıkmadan önce mutlaka test edin!

## Yararlı Linkler

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [React Native Integration](https://docs.revenuecat.com/docs/reactnative)
- [Testing Guide](https://docs.revenuecat.com/docs/sandbox)
- [Expo & RevenueCat](https://docs.revenuecat.com/docs/reactnative#expo)
