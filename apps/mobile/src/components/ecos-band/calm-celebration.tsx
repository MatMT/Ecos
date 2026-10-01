import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { CheckCircle2Icon } from '@/components/ui/app-icons';
import { Radius } from '@/constants/theme';

export interface CalmCelebrationProps {
  active: boolean;
  onFinish?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 28 balanced celebration particles in mint, sage, emerald, and stardust pearl
const PARTICLES = [
  { id: 1, x: 0.18, color: '#0F766E', size: 9, delay: 0 },
  { id: 2, x: 0.32, color: '#10B981', size: 13, delay: 60 },
  { id: 3, x: 0.45, color: '#6EE7B7', size: 8, delay: 30 },
  { id: 4, x: 0.58, color: '#A7F3D0', size: 11, delay: 100 },
  { id: 5, x: 0.72, color: '#059669', size: 10, delay: 140 },
  { id: 6, x: 0.85, color: '#FFFFFF', size: 8, delay: 180 },
  { id: 7, x: 0.25, color: '#34D399', size: 12, delay: 80 },
  { id: 8, x: 0.4, color: '#0F766E', size: 15, delay: 120 },
  { id: 9, x: 0.52, color: '#FFFFFF', size: 9, delay: 50 },
  { id: 10, x: 0.65, color: '#10B981', size: 13, delay: 160 },
  { id: 11, x: 0.78, color: '#6EE7B7', size: 8, delay: 200 },
  { id: 12, x: 0.12, color: '#059669', size: 10, delay: 70 },
  { id: 13, x: 0.28, color: '#CCFBF1', size: 12, delay: 130 },
  { id: 14, x: 0.38, color: '#14B8A6', size: 14, delay: 90 },
  { id: 15, x: 0.48, color: '#047857', size: 11, delay: 60 },
  { id: 16, x: 0.62, color: '#FFFFFF', size: 8, delay: 170 },
  { id: 17, x: 0.75, color: '#10B981', size: 10, delay: 110 },
  { id: 18, x: 0.88, color: '#6EE7B7', size: 13, delay: 190 },
  { id: 19, x: 0.22, color: '#0F766E', size: 9, delay: 150 },
  { id: 20, x: 0.55, color: '#34D399', size: 12, delay: 40 },
  { id: 21, x: 0.68, color: '#CCFBF1', size: 8, delay: 210 },
  { id: 22, x: 0.35, color: '#FFFFFF', size: 10, delay: 100 },
  { id: 23, x: 0.82, color: '#047857', size: 9, delay: 220 },
  { id: 24, x: 0.5, color: '#14B8A6', size: 15, delay: 80 },
  { id: 25, x: 0.15, color: '#34D399', size: 10, delay: 130 },
  { id: 26, x: 0.3, color: '#A7F3D0', size: 8, delay: 170 },
  { id: 27, x: 0.7, color: '#10B981', size: 11, delay: 90 },
  { id: 28, x: 0.84, color: '#CCFBF1', size: 9, delay: 150 },
];

function ParticleItem({
  p,
  progress,
}: {
  p: (typeof PARTICLES)[number];
  progress: SharedValue<number>;
}) {
  const horizontalDrift = (p.x - 0.5) * 150;
  const floatDistance = -SCREEN_HEIGHT * (0.35 + (p.id % 4) * 0.05);

  const animatedStyle = useAnimatedStyle(() => {
    // Normalise timing around particle delay
    const startProgress = Math.min(0.25, p.delay / 1500);
    const endProgress = Math.min(1, startProgress + 0.75);

    const translateY = interpolate(
      progress.value,
      [startProgress, endProgress],
      [0, floatDistance],
      'clamp'
    );

    const translateX = interpolate(
      progress.value,
      [startProgress, endProgress],
      [0, horizontalDrift],
      'clamp'
    );

    const opacity = interpolate(
      progress.value,
      [
        startProgress,
        startProgress + 0.1,
        startProgress + 0.45,
        endProgress,
      ],
      [0, 1, 0.9, 0],
      'clamp'
    );

    const scale = interpolate(
      progress.value,
      [startProgress, startProgress + 0.15, endProgress],
      [0.2, 1.3, 0.7],
      'clamp'
    );

    return {
      transform: [
        { translateY },
        { translateX },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: p.x * SCREEN_WIDTH,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          backgroundColor: p.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CalmCelebration({ active, onFinish }: CalmCelebrationProps) {
  // Stable ref for onFinish to prevent effect cancellation on parent re-renders
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Master animations driven on UI thread
  const containerOpacity = useSharedValue(0);
  const progress = useSharedValue(0);

  const handleCompletion = useCallback(() => {
    onFinishRef.current?.();
  }, []);

  useEffect(() => {
    if (!active) {
      containerOpacity.value = 0;
      progress.value = 0;
      return;
    }

    // 1. Reset shared values
    progress.value = 0;
    containerOpacity.value = 1;

    // 2. Drive master animation progress (0 -> 1 over 4800ms for a peaceful, deep cardiac celebration)
    progress.value = withTiming(1, { duration: 4800 }, (finished) => {
      if (finished) {
        containerOpacity.value = withTiming(0, { duration: 600 }, (fadeDone) => {
          if (fadeDone) {
            runOnJS(handleCompletion)();
          }
        });
      }
    });

    // 3. Physiological Heartbeat Haptic Simulation (Lub-Dub rhythm across 4 beats)
    // Beat 1: Initial Handshake Pulse (t=60ms lub, t=190ms dub)
    const b1_lub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 60);
    const b1_dub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }, 200);

    // Beat 2: Resonant Bio-Beat (t=1200ms lub, t=1340ms dub)
    const b2_lub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 1200);
    const b2_dub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }, 1340);

    // Beat 3: Harmonized Heartbeat (t=2350ms lub, t=2480ms dub)
    const b3_lub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 2350);
    const b3_dub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 2480);

    // Beat 4: Gentle Calming Settle (t=3500ms lub, t=3620ms dub)
    const b4_lub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }, 3500);
    const b4_dub = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }, 3620);

    // 4. Guaranteed fallback completion timer (5600ms)
    const safetyTimer = setTimeout(() => {
      handleCompletion();
    }, 5600);

    return () => {
      clearTimeout(b1_lub);
      clearTimeout(b1_dub);
      clearTimeout(b2_lub);
      clearTimeout(b2_dub);
      clearTimeout(b3_lub);
      clearTimeout(b3_dub);
      clearTimeout(b4_lub);
      clearTimeout(b4_dub);
      clearTimeout(safetyTimer);
    };
  }, [active, containerOpacity, progress, handleCompletion]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.06, 0.88, 1],
      [0, 1, 1, 0],
      'clamp'
    );
    return {
      opacity,
    };
  });

  const ringStyle1 = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.55], [0.3, 3.8], 'clamp');
    const opacity = interpolate(
      progress.value,
      [0, 0.08, 0.42, 0.6],
      [0, 0.85, 0.22, 0],
      'clamp'
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const ringStyle2 = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0.22, 0.75], [0.3, 3.5], 'clamp');
    const opacity = interpolate(
      progress.value,
      [0.22, 0.3, 0.6, 0.75],
      [0, 0.7, 0.16, 0],
      'clamp'
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const badgeStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // Entrance spring
    let cardiacScale = 1.0;
    if (p < 0.1) {
      cardiacScale = interpolate(p, [0, 0.1], [0.35, 1.05], 'clamp');
    } else if (p >= 0.22 && p <= 0.28) {
      // Cardiac Beat 2 pulse bump
      cardiacScale = interpolate(p, [0.22, 0.25, 0.28], [1.0, 1.08, 1.0], 'clamp');
    } else if (p >= 0.46 && p <= 0.52) {
      // Cardiac Beat 3 pulse bump
      cardiacScale = interpolate(p, [0.46, 0.49, 0.52], [1.0, 1.06, 1.0], 'clamp');
    } else if (p >= 0.70 && p <= 0.76) {
      // Cardiac Beat 4 pulse bump
      cardiacScale = interpolate(p, [0.70, 0.73, 0.76], [1.0, 1.04, 1.0], 'clamp');
    } else if (p > 0.88) {
      cardiacScale = interpolate(p, [0.88, 1.0], [1.0, 0.88], 'clamp');
    }

    const opacity = interpolate(
      progress.value,
      [0, 0.06, 0.88, 0.98],
      [0, 1, 1, 0],
      'clamp'
    );
    return {
      transform: [{ scale: cardiacScale }],
      opacity,
    };
  });

  if (!active) return null;

  return (
    <Animated.View
      style={[styles.overlay, containerStyle]}
      pointerEvents="none"
    >
      {/* Darkened Black Dimming Backdrop */}
      <Animated.View style={[styles.darkBackdrop, backdropStyle]} />

      {/* Primary Expanding Bio-Glow Ripple */}
      <Animated.View style={[styles.glowRingPrimary, ringStyle1]} />

      {/* Secondary Staggered Bio-Glow Ripple */}
      <Animated.View style={[styles.glowRingSecondary, ringStyle2]} />

      {/* Central Confirmation Card */}
      <Animated.View style={[styles.centralBadge, badgeStyle]}>
        <View style={styles.badgeIconWrap}>
          <CheckCircle2Icon size={34} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Text style={styles.badgeTitle}>¡Pulsera Sincronizada!</Text>
        <Text style={styles.badgeSubtitle}>Monitoreo cardíaco y descanso activos</Text>
      </Animated.View>

      {/* Stardust Calm Confetti Particles */}
      {PARTICLES.map((p) => (
        <ParticleItem key={p.id} p={p} progress={progress} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 23, 0.74)', // Darkened obsidian backdrop
  },
  glowRingPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3.5,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  glowRingSecondary: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2.5,
    borderColor: '#6EE7B7',
    backgroundColor: 'rgba(110, 231, 183, 0.08)',
  },
  centralBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingVertical: 18,
    paddingHorizontal: 26,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    gap: 4,
  },
  badgeIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: -0.2,
  },
  badgeSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  particle: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.44,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

