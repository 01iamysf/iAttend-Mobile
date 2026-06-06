import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { X, Moon, Sun, LogOut, LayoutDashboard, Building2, BookOpen, Users, ClipboardList, ShieldAlert, Activity } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AdminSidebar({ isOpen, onClose }) {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null; // Avoid rendering when fully closed, wait! Modal needs to render to animate out? Actually, Modal's visible prop handles it. Let's keep it simple.

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, route: '/(admin)', active: true },
    { name: 'Departments & Classes', icon: Building2, route: '/(admin)/academic' },
    { name: 'Manage Subjects', icon: BookOpen, route: '/(admin)/subjects' },
    { name: 'Manage Users', icon: Users, route: '/(admin)/users' },
    { name: 'Assignments', icon: ClipboardList, route: '/(admin)/assignments' },
    { name: 'Permissions', icon: ShieldAlert, route: '/(admin)/permissions' },
    { name: 'System Activity', icon: Activity, route: '/(admin)/activity' },
  ];

  return (
    <Modal visible={isOpen} transparent={true} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Sidebar Drawer */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          
          <View className="flex-1 bg-white dark:bg-slate-900">
            
            {/* Header */}
            <View className="px-6 pb-6 border-b border-gray-100 dark:border-slate-800 flex-row justify-between items-start" style={{ paddingTop: Math.max(insets.top + 16, 24) }}>
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center">
                  <Text className="text-white font-bold text-lg">A</Text>
                </View>
                <View>
                  <Text className="text-indigo-600 dark:text-indigo-400 font-extrabold text-lg leading-tight">Admin{'\n'}Portal</Text>
                  <Text className="text-gray-400 dark:text-slate-400 text-xs mt-1">System Admin</Text>
                </View>
              </View>

              <View className="flex-row items-center space-x-2">
                <TouchableOpacity 
                  className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 items-center justify-center"
                  onPress={toggleColorScheme}
                >
                  {colorScheme === 'dark' ? (
                    <Sun size={16} color="#94A3B8" />
                  ) : (
                    <Moon size={16} color="#64748B" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center"
                  onPress={onClose}
                >
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation Links */}
            <View className="flex-1 px-4 py-6">
              {navItems.map((item, index) => {
                const routeWithoutGroup = item.route.replace('/(admin)', '');
                const targetPath = routeWithoutGroup === '' ? '/' : routeWithoutGroup;
                const isActive = pathname === targetPath || pathname === item.route;
                
                return (
                  <TouchableOpacity 
                    key={index}
                    className={`flex-row items-center px-4 py-3.5 mb-2 rounded-xl ${isActive ? 'bg-indigo-500' : ''}`}
                    onPress={() => {
                      onClose();
                      router.push(item.route);
                    }}
                  >
                    <item.icon size={20} color={isActive ? '#FFFFFF' : (colorScheme === 'dark' ? '#94A3B8' : '#64748B')} strokeWidth={isActive ? 2.5 : 2} />
                    <Text className={`ml-4 text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer / Logout */}
            <View className="p-6 border-t border-gray-50 dark:border-slate-800">
              <TouchableOpacity 
                className="flex-row items-center justify-center py-3 rounded-xl bg-red-50 dark:bg-red-900/20"
                onPress={handleLogout}
              >
                <LogOut size={18} color="#EF4444" />
                <Text className="ml-2 text-red-500 font-bold text-sm">Logout</Text>
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    width: width * 0.75, // 75% of screen width
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#fff',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  }
});
