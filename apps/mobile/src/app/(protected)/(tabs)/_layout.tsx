import { Tabs } from 'expo-router';

import HomeIcon from '@/assets/icon-navbar/Home.svg';
import MessageIcon from '@/assets/icon-navbar/Message.svg';
import StatIcon from '@/assets/icon-navbar/Stat.svg';
import UserIcon from '@/assets/icon-navbar/User.svg';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ tabBarIcon: () => <HomeIcon width="90%" height="100%" /> }} />
      <Tabs.Screen name="stats" options={{ tabBarIcon: () => <StatIcon width="90%" height="100%" /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Diario', tabBarIcon: () => <MessageIcon width="90%" height="100%" /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: () => <UserIcon width="90%" height="100%" /> }} />
    </Tabs>
  );
}
