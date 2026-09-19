import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';

import BellIcon from '@/assets/bell.svg';
import { Colors } from '@/constants/theme';

export interface CustomTopBarProps {
  name: string;
  onNotificationsPress?: () => void;
}

export default function CustomTopBar({ name, onNotificationsPress }: CustomTopBarProps) {
  const router = useRouter();
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const handlePress = onNotificationsPress ?? (() => router.push('/modals/alerts-history' as Href));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hola, {name}</Text>
            <Text style={styles.brandName}>Ecos</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handlePress} accessibilityRole="button" accessibilityLabel="Notificaciones">
          <BellIcon />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 22,
    color: '#666',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
