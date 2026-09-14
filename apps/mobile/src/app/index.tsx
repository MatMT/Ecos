import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

const MIN_SPLASH_DURATION_MS = 1200;

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
  }, [opacity, scale]);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/(protected)/(tabs)/home' : '/login');
    }, MIN_SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

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
    backgroundColor: Colors.brand,
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
