import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing
} from 'react-native-reanimated';

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Start animation
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });

    // Navigate to login after animation + short delay
    const timer = setTimeout(() => {
      // Use replace to prevent going back to the splash screen
      router.replace('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('@/assets/logo_nexo_ecos.png')} 
        style={[styles.logo, animatedStyle]} 
        resizeMode="contain"
      />
      <Animated.View style={[styles.loaderContainer, animatedStyle]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#47ACA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '70%',
    height: 180,
  },
  loaderContainer: {
    marginTop: 50,
  },
});
