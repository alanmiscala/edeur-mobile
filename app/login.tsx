import { useState } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/Button';

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
        setLoading(false);
        return;
      }
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 600);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>ER</Text>
          </View>
          <Text style={styles.title}>EQUIPMENT RENTAL</Text>
          <Text style={styles.subtitle}>Operator Field Application</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Operator PIN</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={colors.slate400} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Enter your PIN"
                placeholderTextColor={colors.slate400}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button label="Sign In" onPress={handleLogin} loading={loading} style={styles.signInButton} />

          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Demo PINs: 1234 (Juan), 5678 (Richard), 9999 (Pedro)</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Authorized personnel access only.</Text>
          <Text style={styles.footerText}>v1.0.0 • Field operations</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  paddingTop: 60,
  paddingBottom: 40,
  paddingHorizontal: spacing.xl,
  gap: 36,
  alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
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
    gap: spacing.lg,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate900,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.slate900,
    minHeight: 24,
    letterSpacing: 4,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.red500,
  },
  signInButton: {
    width: '100%',
  },
  hintContainer: {
    backgroundColor: colors.blue50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignSelf: 'center',
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
