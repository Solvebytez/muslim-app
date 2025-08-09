import { StyleSheet } from 'react-native';



import ProfileScreen from '@/screen/Profile/ProfileScreen';

export default function TabTwoScreen() {
  return <ProfileScreen/>
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
