import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '@/lib/auth';
import { PinPad } from '@/components/PinPad';
import { spacing, radius } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    if (!pin.trim()) { setError('Please enter your PIN.'); return; }
    setLoading(true);
    setTimeout(() => {
      const success = login(pin.trim());
      if (!success) { setError('Invalid PIN. Please try again.'); setPin(''); setLoading(false); return; }
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 600);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 60), paddingBottom: Math.max(insets.bottom, 40) }]} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/psc-equipment-logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
              accessible
              accessibilityLabel="PSC Equipment Department logo"
            />
            <Text style={[styles.subtitle, { color: c.textMuted }]}>Operator Field Application</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: c.textPrimary }]}>Operator Access</Text>
            <PinPad
              value={pin}
              onChange={setPin}
              maxLength={4}
              onSubmit={handleLogin}
              submitLabel="Sign In"
              loading={loading}
            />
            {error ? <Text style={[styles.errorText, { color: c.red500 }]}>{error}</Text> : null}
            <View style={[styles.hintContainer, { backgroundColor: c.blue50 }]}>
              <Text style={[styles.hintText, { color: c.blue600 }]}>
                Demo PINs: 1234 (Juan), 5678 (Richard), 9999 (Pedro) • Reliever PIN: 1234
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textMuted }]}>Authorized personnel access only.</Text>
            <Text style={[styles.footerText, { color: c.textMuted }]}>v2.0.0 • Field operations</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 360, alignSelf: 'center', alignItems: 'center', gap: 36 },
  logoSection: { alignItems: 'center', gap: spacing.lg },
  logoImage: { width: 180, height: 180, borderRadius: 90, overflow: 'hidden' },
  title: { fontFamily: 'Manrope-ExtraBold', fontSize: 22, textAlign: 'center' },
  subtitle: { fontFamily: 'Manrope-Medium', fontSize: 14 },
  form: { width: '100%', alignItems: 'center', gap: spacing.lg },
  label: { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  errorText: { fontFamily: 'Manrope-Medium', fontSize: 13, textAlign: 'center' },
  hintContainer: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.sm },
  hintText: { fontFamily: 'Manrope-Medium', fontSize: 12 },
  footer: { alignItems: 'center', gap: 4 },
  footerText: { fontFamily: 'Manrope-Regular', fontSize: 11, textAlign: 'center' },
});
