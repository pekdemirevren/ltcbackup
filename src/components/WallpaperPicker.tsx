import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { wallpapers } from '../constants/wallpapers';

interface WallpaperPickerProps {
  selectedWallpaper: string;
  onWallpaperSelect: (wallpaperId: string) => void;
}

const WallpaperPicker: React.FC<WallpaperPickerProps> = ({
  selectedWallpaper,
  onWallpaperSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Wallpaper</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {wallpapers.map((wallpaper) => (
          <TouchableOpacity
            key={wallpaper.id}
            style={[
              styles.wallpaperItem,
              selectedWallpaper === wallpaper.id && styles.selectedItem,
            ]}
            onPress={() => onWallpaperSelect(wallpaper.id)}
          >
            <Image source={wallpaper.source} style={styles.wallpaperImage} />
            <Text style={styles.wallpaperName}>{wallpaper.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginLeft: 20,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  wallpaperItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  wallpaperImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 5,
  },
  wallpaperName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
});

export default WallpaperPicker;