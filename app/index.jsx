import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <Redirect href="/(admin)" />;
    case 'teacher':
      return <Redirect href="/(teacher)" />;
    case 'student':
      return <Redirect href="/(student)" />;
    case 'parent':
      return <Redirect href="/(parent)" />;
    default:
      return <Redirect href="/login" />;
  }
}
