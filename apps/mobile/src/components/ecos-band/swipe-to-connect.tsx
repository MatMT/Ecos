import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { BluetoothIcon, CheckCircle2Icon, WatchIcon } from '@/components/ui/app-icons';
import { Colors, Radius } from '@/constants/theme';

export interface SwipeToConnectProps {
  onConfirm: () => void;
  isConnecting?: boolean;
  disabled?: boolean;
}

const BUTTON_SIZE = 52;
const TRACK_HEIGHT = 60;
const HAPTIC_STEP_INTERVAL = 16; // Rich granular vibration every 16px dragged

export function SwipeToConnect({
  onConfirm,
  isConnecting = false,
  disabled = false,
}: SwipeToConnectProps) {
  const [trackWidth, setTrackWidth] = useState(
    Math.min(320, Dimensions.get('window').width - 64)
  );
  const [isCompleted, setIsCompleted] = useState(false);

  const maxTranslateShared = useSharedValue(
    Math.max(0, trackWidth - BUTTON_SIZE - 8)
  );
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const detent1Fired = useSharedValue(false);
  const detent2Fired = useSharedValue(false);

  // Prime/warm up native haptic engine immediately on mount so the very first touch has zero engine startup latency
  React.useEffect(() => {
    void Haptics.selectionAsync();
  }, []);

  React.useEffect(() => {
    maxTranslateShared.value = Math.max(0, trackWidth - BUTTON_SIZE - 8);
  }, [trackWidth, maxTranslateShared]);

  const triggerStepHaptic = () => {
    void Haptics.selectionAsync();
  };

  const triggerSuccessHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const notifyConfirm = () => {
    setIsCompleted(true);
    triggerSuccessHaptic();
    // Immediate handshake transition - zero artificial delay
    onConfirm();
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !isConnecting && !isCompleted)
    .activeOffsetX([-3, 3]) // Instantly claims gesture from parent ScrollView
    .failOffsetY([-20, 20]) // Tolerates natural thumb curvature without failing
    .onBegin(() => {
      isDragging.value = true;
      detent1Fired.value = false;
      detent2Fired.value = false;
    })
    .onStart(() => {
      detent1Fired.value = false;
      detent2Fired.value = false;
    })
    .onUpdate((event) => {
      'worklet';
      const maxT = maxTranslateShared.value;
      const clampedX = Math.max(0, Math.min(event.translationX, maxT));
      translateX.value = clampedX;

      // Clean milestone physical detents (35% and 70%) - avoids flooding JS bridge
      if (clampedX >= maxT * 0.35 && !detent1Fired.value) {
        detent1Fired.value = true;
        runOnJS(triggerStepHaptic)();
      } else if (clampedX < maxT * 0.35 && detent1Fired.value) {
        detent1Fired.value = false;
      }

      if (clampedX >= maxT * 0.7 && !detent2Fired.value) {
        detent2Fired.value = true;
        runOnJS(triggerStepHaptic)();
      } else if (clampedX < maxT * 0.7 && detent2Fired.value) {
        detent2Fired.value = false;
      }
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      const maxT = maxTranslateShared.value;
      // If dragged at least 85% of track, complete
      if (translateX.value >= maxT * 0.85) {
        translateX.value = withSpring(maxT, { damping: 18, stiffness: 220 });
        runOnJS(notifyConfirm)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const trackFillStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + BUTTON_SIZE + 4,
    };
  });

  const textGuideStyle = useAnimatedStyle(() => {
    const maxT = maxTranslateShared.value;
    const opacity = maxT > 0 ? 1 - (translateX.value / maxT) * 1.5 : 1;
    return {
      opacity: Math.max(0, opacity),
    };
  });

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setTrackWidth(w);
      }}
    >
      {/* Background Track */}
      <View style={styles.track}>
        {/* Animated fill as user swipes */}
        <Animated.View style={[styles.trackFill, trackFillStyle]} />

        {/* Guiding Text */}
        <Animated.View style={[styles.textWrap, textGuideStyle]}>
          <Text style={styles.guideText}>
            {isConnecting ? 'Conectando pulsera...' : 'Desliza para conectar →'}
          </Text>
        </Animated.View>

        {/* Draggable Capsule / Button */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.capsuleButton,
              buttonAnimatedStyle,
              (isCompleted || isConnecting) && styles.capsuleButtonSuccess,
            ]}
          >
            {isCompleted ? (
              <CheckCircle2Icon size={24} color="#FFFFFF" strokeWidth={2.5} />
            ) : isConnecting ? (
              <BluetoothIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
            ) : (
              <WatchIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#CCFBF1',
    borderRadius: Radius.pill,
  },
  textWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 36,
  },
  guideText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F766E',
    letterSpacing: 0.2,
  },
  capsuleButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  capsuleButtonSuccess: {
    backgroundColor: '#15803D',
    shadowColor: '#15803D',
  },
});
