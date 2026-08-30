import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BellIcon from '@/assets/bell.svg';

export default function CustomTopBar() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: 'https://testingbot.com/free-online-tools/random-avatar/45' }} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>Hola, Laura</Text>
            <Text style={styles.brandName}>NeuroSync</Text>
          </View>
        </View>
        
        <TouchableOpacity>
            <BellIcon/>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14, // Espacio entre imagen y texto
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
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