import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react-native';

export default function ParentDashboard() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 bg-gray-900 p-6 pt-16">
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-white text-2xl font-bold">Parent Dashboard</Text>
          <Text className="text-gray-400">Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout} className="p-2 bg-gray-800 rounded-full">
          <LogOut color="#F87171" size={24} />
        </TouchableOpacity>
      </View>
      
      <View className="bg-gray-800 p-6 rounded-[24px]">
        <Text className="text-white text-lg">Parent modules will be implemented in Phase 5.</Text>
      </View>
    </View>
  );
}
