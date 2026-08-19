import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { PinPad } from '@/components/PinPad';

export default function RelieverLoginScreen() {
  const router = useRouter();
  const { deurId } = useLocalSearchParams<{ deurId?: string }>();
  const { loginReliever } = useAuth();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your PIN.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const success = loginReliever(name.trim(), pin.trim(), deurId);
      if (!success) {
        setError('Invalid name or PIN. Please try again.');
        setPin('');
        setLoading(false);
        return;
      }
      setLoading(false);
      router.replace('/(tabs)/deur');
    }, 400);
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Reliever Login" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Users size={32} color={colors.blue600} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Reliever Operator</Text>
          <Text style={styles.subtitle}>Enter your name and PIN to continue the active DEUR</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Operator Name</Text>
            <View style={styles.inputContainer}>
              <Users size={18} color={colors.slate400} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={colors.slate400}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>
        </Card>

        <View style={styles.pinSection}>
          <Text style={styles.label}>PIN</Text>
          <PinPad
            value={pin}
            onChange={setPin}
            maxLength={4}
            onSubmit={handleLogin}
            submitLabel="Continue"
            loading={loading}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Demo reliever: Pedro Reyes / PIN 9999</Text>
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
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  iconHeader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.slate900,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    gap: spacing.md,
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
    backgroundColor: colors.slate50,
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
  },
  pinSection: {
    alignItems: 'center',
    gap: spacing.md,
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
    alignSelf: 'center',
  },
  hintText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.blue600,
  },
});
