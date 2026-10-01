import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

export type TextFieldProps = TextInputProps;

export function TextField({ style, placeholderTextColor, ...rest }: TextFieldProps) {
  return (
    <TextInput
      style={[styles.field, style]}
      placeholderTextColor={placeholderTextColor ?? Colors.placeholder}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.small,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: Colors.text,
    fontSize: 16,
  },
});
