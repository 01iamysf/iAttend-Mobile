import React, { useState } from 'react';
import { View, Text, Pressable, Image, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Menu, X, Mail, User, Book, Building, LogOut } from 'lucide-react-native';
import { useSidebar } from '../../app/(student)/_layout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StudentHeader({ title = 'Student Dashboard' }) {
  const { setIsSidebarOpen } = useSidebar();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  return (
    <View className="z-50 bg-transparent" style={{ paddingTop: Math.max(insets.top + 8, 16), paddingHorizontal: 16, paddingBottom: 8 }}>
      <View className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 px-4 py-3 flex-row justify-between items-center">
        
        {/* Left: Menu & Title */}
        <View className="flex-row items-center flex-1 pr-3">
          <Pressable 
            onPress={() => setIsSidebarOpen(true)} 
            className="mr-3 w-12 h-12 rounded-[18px] bg-[#EEF2FF] dark:bg-indigo-500/20 active:scale-90 active:opacity-70 items-center justify-center"
          >
            <Menu color={colorScheme === 'dark' ? '#818CF8' : '#5A52FF'} size={24} />
          </Pressable>
          <Text className="text-[20px] font-black text-[#1E293B] dark:text-slate-100 flex-1 tracking-tight" numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right: Actions */}
        <View className="flex-row items-center">
          {/* Profile Avatar Container */}
          <TouchableOpacity onPress={() => setIsProfileOpen(true)} className="ml-2 relative">
            <View className="w-11 h-11 rounded-full bg-[#5A52FF] items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700">
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full bg-[#5A52FF] items-center justify-center">
                  <Text className="text-white text-[15px] font-black tracking-tighter">
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
              )}
            </View>
            {/* Online Status Dot */}
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-[2.5px] border-white dark:border-slate-800" />
          </TouchableOpacity>
        </View>

      </View>

      {/* Profile Detail Modal */}
      <Modal visible={isProfileOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40 dark:bg-black/60">
          <View className="bg-white dark:bg-slate-900 rounded-t-[24px] p-6 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">My Profile</Text>
              <TouchableOpacity onPress={() => setIsProfileOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              
              <View className="items-center mb-6">
                <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4">
                  <Text className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">{user?.name}</Text>
                <Text className="text-sm font-bold text-indigo-500 uppercase tracking-wider mt-1">{user?.role}</Text>
              </View>

              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <Mail size={18} color="#64748B" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</Text>
                  <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{user?.email}</Text>
                </View>
              </View>

              {user?.departmentId?.departmentName ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Building size={18} color="#64748B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Department</Text>
                    <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{user.departmentId.departmentName}</Text>
                  </View>
                </View>
              ) : null}

              {user?.classId?.className ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Book size={18} color="#64748B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Class</Text>
                    <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{user.classId.className}</Text>
                  </View>
                </View>
              ) : null}

              {user?.rollNumber ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <User size={18} color="#64748B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Roll Number</Text>
                    <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{user.rollNumber}</Text>
                  </View>
                </View>
              ) : null}

              {user?.parentEmail ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <Mail size={18} color="#64748B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Parent Email</Text>
                    <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{user.parentEmail}</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity 
                onPress={handleLogout}
                className="flex-row items-center justify-center py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 mt-6 border border-red-100 dark:border-red-900/40"
              >
                <LogOut size={18} color="#EF4444" />
                <Text className="ml-2 text-red-500 font-bold text-sm">Sign Out</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
