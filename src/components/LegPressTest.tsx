import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';


export function LegPressTest() {
  const simpleTestHtml = `
<!DOCTYPE html>
<html><head><style>
body { margin:0; background:#000; display:flex; justify-content:center; align-items:center; height:100vh; }
svg { width:200px; height:200px; }
circle { fill:#00ff00; stroke:#8ce63d; stroke-width:10; }
</style></head><body>
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40"/>
  <text x="50" y="55" fill="white" text-anchor="middle" font-size="20">TEST OK</text>
</svg>
</body></html>`;

  return (
    <View style={styles.container}>
      <WebView source={{ html: simpleTestHtml }} style={styles.webview} scrollEnabled={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
});
