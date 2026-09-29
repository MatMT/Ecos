import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface CalmCelebrationProps {
  active: boolean;
  onFinish?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 12 gentle particles in sage, mint, and pearl white tones
const PARTICLES = [
  { id: 1, x: 0.2, color: '#0F766E', size: 8, delay: 0 },
  { id: 2, x: 0.35, color: '#14B8A6', size: 10, delay: 100 },
  { id: 3, x: 0.5, color: '#99F6E4', size: 7, delay: 50 },
  { id: 4, x: 0.65, color: '#CCFBF1', size: 11, delay: 150 },
  { id: 5, x: 0.8, color: '#0F766E', size: 9, delay: 200 },
  { id: 6, x: 0.25, color: '#FFFFFF', size: 6, delay: 250 },
  { id: 7, x: 0.42, color: '#14B8A6', size: 10, delay: 180 },
  { id: 8, x: 0.58, color: '#99F6E4', size: 8, delay: 80 },
  { id: 9, x: 0.72, color: '#FFFFFF', size: 7, delay: 300 },
  { id: 10, x: 0.15, color: '#CCFBF1', size: 9, delay: 120 },
  { id: 11, x: 0.85, color: '#14B8A6', size: 8, delay: 220 },
  { id: 12, x: 0.48, color: '#0F766E', size: 12, delay: 160 },
];

function ParticleItem({
  xRatio,
  color,
  size,
  delayMs,
  active,
}: {
  xRatio: number;
  color: string;
  size: number;
  delayMs: number;
  active: boolean;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (active) {
      translateY.value = withDelay(
        delayMs,
        withTiming(-SCREEN_HEIGHT * 0.45, { duration: 1800 })
      );
      opacity.value = withDelay(
        delayMs,
        withSequence(
          withTiming(0.85, { duration: 300 }),
          withDelay(900, withTiming(0, { duration: 600 }))
        )
      );
      scale.value = withDelay(
        delayMs,
        withSequence(
          withSpring(1.2),
          withTiming(0.8, { duration: 1200 })
        )
      );
    } else {
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [active, delayMs, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: xRatio * SCREEN_WIDTH,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CalmCelebration({ active, onFinish }: CalmCelebrationProps) {
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      ringScale.value = withTiming(2.4, { duration: 1400 });
      ringOpacity.value = withSequence(
        withTiming(0.6, { duration: 300 }),
        withTiming(0, { duration: 1100 })
      );

      const timer = setTimeout(() => {
        onFinish?.();
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      ringScale.value = 0.3;
      ringOpacity.value = 0;
    }
  }, [active, onFinish, ringOpacity, ringScale]);

  const ringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
      opacity: ringOpacity.value,
    };
  });

  if (!active) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Central Expanding Glow Ripple */}
      <Animated.View style={[styles.glowRing, ringStyle]} />

      {/* Floating Stardust Particles */}
      {PARTICLES.map((p) => (
        <ParticleItem
          key={p.id}
          xRatio={p.x}
          color={p.color}
          size={p.size}
          delayMs={p.delay}
          active={active}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#14B8A6',
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
  },
  particle: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.35,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
