import React from 'react';
import { Platform, StatusBar, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const Index = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor: 'red' }}>
      {/* Status bar spacer with proper height calculation */}
      <View
        style={{
          height: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
          backgroundColor: '#000',
        }}
      />
      
      {/* StatusBar configuration */}
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#fff" // Should match the spacer background
        translucent={false}
        hidden={false}
      />
      
      {/* Content area with bottom safe area only */}
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <Text style={{ color: 'white', padding: 10 }}>Index Content</Text>
      </SafeAreaView>
    </View>
  );
};

export default Index;