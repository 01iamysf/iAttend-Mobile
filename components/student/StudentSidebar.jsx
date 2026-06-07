import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Calendar, History, Shield, Flame, BookOpen } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function StudentSidebar({ isOpen, onClose }) {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start();
    }
  }, [isOpen]);

  const navItems = [
    { name: 'Dashboard', path: '/(student)', icon: LayoutDashboard },
    { name: 'My Schedule', path: '/(student)/subjects', icon: BookOpen },
    { name: 'History', path: '/(student)/history', icon: History },
    { name: 'Streaks', path: '/(student)/streaks', icon: Flame },
    { name: 'Leave Requests', path: '/(student)/leaves', icon: Calendar },
  ];

  const handleNavigate = (path) => {
    onClose();
    setTimeout(() => {
      router.replace(path);
    }, 150);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      logout();
    }, 150);
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        {/* Backdrop */}
        <Animated.View style={{ opacity: fadeAnim }} className="absolute inset-0 bg-black/60 dark:bg-black/80" />
        <Pressable className="absolute inset-0 z-0" onPress={onClose} />

        {/* Sidebar */}
        <Animated.View 
          style={{ transform: [{ translateX: slideAnim }], backgroundColor: '#1e1b4b' }} 
          className="absolute top-0 bottom-0 left-0 w-[80%] max-w-[320px] dark:bg-slate-900 z-10"
        >
          {/* Header */}
          <View className="p-6 pt-16 pb-8 bg-[#312e81] dark:bg-slate-800">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center mr-3">
                  <Shield size={24} color="white" />
                </View>
                <Text className="text-2xl font-black text-white tracking-tight">Student</Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2 bg-white/10 rounded-full">
                <Text className="text-white font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <Text className="text-white font-bold text-lg">{user?.name || 'Student'}</Text>
              <Text className="text-indigo-200 text-xs font-medium uppercase tracking-wider mt-1">{user?.role || 'Student'}</Text>
            </View>
          </View>

          {/* Navigation Links */}
          <View className="flex-1 p-4 pt-6 space-y-2">
            <Text className="text-indigo-300/60 text-[10px] font-black tracking-widest uppercase mb-2 ml-4">Main Menu</Text>
            {navItems.map((item, index) => {
              const isActive = pathname === item.path || (item.path === '/(student)' && pathname === '/(student)/index');
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleNavigate(item.path)}
                  className={`flex-row items-center p-4 rounded-2xl mb-2 ${isActive ? 'bg-indigo-500' : 'active:bg-white/5'}`}
                >
                  <item.icon size={20} color={isActive ? "white" : "#a5b4fc"} />
                  <Text className={`ml-4 font-bold ${isActive ? 'text-white' : 'text-indigo-200'}`}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View className="p-6 border-t border-white/10 pb-12">
            <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-4 rounded-2xl bg-white/5 active:bg-red-500/20">
              <Text className="ml-4 font-bold text-red-400">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
