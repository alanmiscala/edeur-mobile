import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Navigation, MapPin, Crosshair } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { mockRepository } from '@/lib/mockRepository';
import type { TravelLocation, GPSCoordinates, LocationSource } from '@/lib/types';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';

export default function DeurTravelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deur = mockRepository.getDeurById(id);

  const existing = deur?.travelLocation;
  const [pointA, setPointA] = useState(existing?.pointA ?? '');
  const [pointB, setPointB] = useState(existing?.pointB ?? '');
  const [gpsA, setGpsA] = useState<GPSCoordinates | undefined>(existing?.gpsA);
  const [gpsB, setGpsB] = useState<GPSCoordinates | undefined>(existing?.gpsB);
  const [source, setSource] = useState<LocationSource>(existing?.source ?? 'Manual');
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState<'A' | 'B' | null>(null);

  const captureGps = (point: 'A' | 'B') => {
    setCapturing(point);
    setError('');

    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('GPS is not available on this device. Please enter the location manually.');
      setCapturing(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: GPSCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        if (point === 'A') setGpsA(coords);
        else setGpsB(coords);
        setSource('GPS');
        setCapturing(null);
      },
      () => {
        setError('Could not capture GPS. Please enter the location manually.');
        setCapturing(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSave = () => {
    setError('');
    if (!pointA.trim() && !pointB.trim()) {
      setError('Please enter at least Point A or Point B.');
      return;
    }
    const location: TravelLocation = {
      pointA: pointA.trim(),
      pointB: pointB.trim(),
      source,
      gpsA,
      gpsB,
    };
    mockRepository.updateTravelLocation(id, location);
    router.back();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <PageHeader title="Travel Log" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Navigation size={28} color={colors.blue600} strokeWidth={2} />
          </View>
          <Text style={styles.iconTitle}>Travel Location</Text>
          <Text style={styles.iconSubtitle}>Record travel points for this shift</Text>
        </View>

        <Card style={styles.card}>
          {/* Point A */}
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <MapPin size={16} color={colors.blue600} strokeWidth={2} />
              <Text style={styles.label}>Point A (Origin)</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={pointA}
                onChangeText={(v) => { setPointA(v); setSource('Manual'); }}
                placeholder="e.g. Main Yard"
                placeholderTextColor={colors.slate400}
              />
            </View>
            {gpsA && (
              <Text style={styles.gpsText}>GPS: {gpsA.lat.toFixed(5)}, {gpsA.lng.toFixed(5)}</Text>
            )}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={() => captureGps('A')}
              disabled={capturing === 'A'}
              activeOpacity={0.7}
            >
              <Crosshair size={14} color={colors.blue600} strokeWidth={2} />
              <Text style={styles.gpsButtonText}>
                {capturing === 'A' ? 'Capturing...' : 'Capture GPS for Point A'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Point B */}
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <MapPin size={16} color={colors.blue600} strokeWidth={2} />
              <Text style={styles.label}>Point B (Destination)</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={pointB}
                onChangeText={(v) => { setPointB(v); setSource('Manual'); }}
                placeholder="e.g. Site B - North Gate"
                placeholderTextColor={colors.slate400}
              />
            </View>
            {gpsB && (
              <Text style={styles.gpsText}>GPS: {gpsB.lat.toFixed(5)}, {gpsB.lng.toFixed(5)}</Text>
            )}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={() => captureGps('B')}
              disabled={capturing === 'B'}
              activeOpacity={0.7}
            >
              <Crosshair size={14} color={colors.blue600} strokeWidth={2} />
              <Text style={styles.gpsButtonText}>
                {capturing === 'B' ? 'Capturing...' : 'Capture GPS for Point B'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Source indicator */}
          <View style={styles.sourceRow}>
            <Text style={styles.sourceLabel}>Location Source:</Text>
            <View style={[styles.sourceChip, { backgroundColor: source === 'GPS' ? colors.emerald50 : colors.slate100 }]}>
              <Text style={[styles.sourceChipText, { color: source === 'GPS' ? colors.emerald500 : colors.slate500 }]}>
                {source === 'GPS' ? 'GPS' : 'Manual'}
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Card>

        <Button label="Save Travel Log" onPress={handleSave} style={styles.saveButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  iconHeader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.slate900,
  },
  iconSubtitle: {
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
    gap: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate900,
  },
  inputContainer: {
    backgroundColor: colors.slate50,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.slate900,
    minHeight: 24,
  },
  gpsText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.emerald500,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.blue50,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  gpsButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.blue600,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.slate700,
  },
  sourceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  sourceChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.red500,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
});
