import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color, 
          // fontFamily: 'ZillaSlab'
         }, // 👈 Global default font
        styles[type], // 👈 Centralized styles
        style,        // 👈 Allow override
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
   
  },
  defaultSemiBold: {
    fontSize: 16,
    
    // To use actual semi-bold font, import 'ZillaSlab-SemiBold.ttf' and load it in `useFonts`
    // Then set fontFamily: 'ZillaSlab-SemiBold' here.
  },
  title: {
    fontSize: 32,
    // fontWeight removed to avoid conflicts with custom font
  },
  subtitle: {
    fontSize: 20,
  },
  link: {
    fontSize: 16,   
    color: '#0a7ea4',
  },
});
