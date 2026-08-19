import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PinPad } from '@/components/PinPad';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    if (!pin.trim()) {
      setError('Please enter your PIN.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = login(pin.trim());
      if (!success) {
        setError('Invalid PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      }
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 600);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>ER</Text>
            </View>
            <Text style={styles.title}>EQUIPMENT RENTAL</Text>
            <Text style={styles.subtitle}>Operator Field Application</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Operator PIN</Text>

            <PinPad
              value={pin}
              onChange={setPin}
              maxLength={4}
              onSubmit={handleLogin}
              submitLabel="Sign In"
              loading={loading}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>Demo PINs: 1234 (Juan), 5678 (Richard), 9999 (Pedro)</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Authorized personnel access only.</Text>
            <Text style={styles.footerText}>v1.0.0 • Field operations</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 36,
  },
  logoSection: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.slate900,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.slate500,
  },
  form: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate900,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.red500,
    textAlign: 'center',
  },
  hintContainer: {
    backgroundColor: colors.blue50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  hintText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.blue600,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.slate500,
    textAlign: 'center',
  },
});
