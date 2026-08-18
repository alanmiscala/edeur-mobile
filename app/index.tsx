import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function IndexScreen() {
  const { operator } = useAuth();

  if (operator === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.blue600} />
      </View>
    );
  }

  if (!operator) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate50,
  },
});
