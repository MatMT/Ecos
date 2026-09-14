import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View>
          <Text style={styles.title}>Mi perfil</Text>
          <Text style={styles.email}>{user?.email ?? 'Sesión activa'}</Text>
        </View>

        <Button label="Cerrar sesión" variant="danger" onPress={() => void logout()} />
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
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
