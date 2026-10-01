import { Tabs } from 'expo-router';

import HomeIcon from '@/assets/icon-navbar/Home.svg';
import MessageIcon from '@/assets/icon-navbar/Message.svg';
import StatIcon from '@/assets/icon-navbar/Stat.svg';
import UserIcon from '@/assets/icon-navbar/User.svg';
import { useTheme } from '@/context/theme-context';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <HomeIcon width={23} height={23} color={color} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Evolución',
          tabBarIcon: ({ color }) => <StatIcon width={23} height={23} color={color} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color }) => <MessageIcon width={23} height={23} color={color} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <UserIcon width={23} height={23} color={color} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="diario"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
