import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DevServerBanner } from '@/components/dev-server-banner';
import { TextField } from '@/components/ui/text-field';
import { Colors, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function Login() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // error message is already surfaced via useAuth().error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Image source={require('@/assets/logo_nexo_ecos.png')} style={styles.image} resizeMode="contain" />
      <View style={styles.card}>
        <DevServerBanner />
        <TextField
          placeholder="Ingrese su correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextField
          placeholder="Ingrese su contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          label="INICIAR SESIÓN"
          onPress={() => void handleLogin()}
          loading={isSubmitting}
          disabled={!email || !password}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '80%',
    height: 120,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    width: '90%',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: Radius.large,
    gap: 16,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: Colors.danger,
    textAlign: 'center',
    fontSize: 13,
  },
});
