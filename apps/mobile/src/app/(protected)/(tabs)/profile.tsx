import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Mi perfil</Text>
          <Text style={styles.email}>{user?.email ?? 'Sesión activa'}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Prototipo ESP32"
            onPress={() => router.push('/esp32-prototype')}
            style={styles.prototypeButton}
          />
          <Button label="Cerrar sesión" variant="danger" onPress={() => void logout()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.two,
  },
  email: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  actions: {
    gap: Spacing.two,
  },
  prototypeButton: {
    backgroundColor: Colors.brand,
  },
});

