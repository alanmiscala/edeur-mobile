import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, FileText, Clock, User } from 'lucide-react-native';
import { colors, fonts } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue600,
        tabBarInactiveTintColor: colors.slate500,
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.slate200,
          backgroundColor: colors.white,
          height: Platform.OS === 'web' ? 60 : 68,
          paddingBottom: Platform.OS === 'web' ? 8 : 20,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="deur"
        options={{
          title: 'DEUR',
          tabBarIcon: ({ size, color }) => <FileText size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => <Clock size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
