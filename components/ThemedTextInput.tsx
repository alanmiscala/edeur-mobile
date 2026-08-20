import { useState, useRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/lib/useTheme';
import { radius } from '@/lib/theme';

interface ThemedTextInputProps extends Omit<TextInputProps, 'style'> {
  style?: TextInputProps['style'];
}

export function ThemedTextInput({ style, onFocus, onBlur, ...props }: ThemedTextInputProps) {
  const { colors: c } = useTheme();
  const [focused, setFocused] = useState(false);
  const ref = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: props.editable === false ? c.slate100 : c.inputBg, borderColor: focused ? c.inputFocusBorder : c.inputBorder },
      ]}
    >
      <TextInput
        ref={ref}
        style={[styles.input, { color: props.editable === false ? c.textMuted : c.textPrimary }]}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        placeholderTextColor={c.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    minHeight: 24,
  },
});

