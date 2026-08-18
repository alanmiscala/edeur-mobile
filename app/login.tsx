import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, User } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    if (!loginName.trim() || !password.trim()) {
      setError('Please enter your login name and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = login(loginName.trim(), password);
      if (!success) {
        setError('Invalid login name or password. Please try again.');
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
            <Text style={styles.label}>Login Name</Text>
            <View style={styles.inputContainer}>
              <User size={18} color={colors.slate400} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Enter login name"
                placeholderTextColor={colors.slate400}
                value={loginName}
                onChangeText={setLoginName}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={colors.slate400} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.slate400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.slate400} strokeWidth={2} />
                ) : (
                  <Eye size={18} color={colors.slate400} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button label="Sign In" onPress={handleLogin} loading={loading} style={styles.signInButton} />

          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Demo credentials: jcruz / operator123</Text>
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
    fontSize: 14,
    color: colors.slate900,
    minHeight: 24,
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
