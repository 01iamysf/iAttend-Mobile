import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut, X, Mail, Building, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900" style={{ paddingTop: Math.max(insets.top + 8, 16) }}>
      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 mx-4 mb-6">
        <View>
          <Text className="text-lg font-black text-[#1E293B] dark:text-slate-100">Teacher Dashboard</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">Welcome, {user?.name}</Text>
        </View>

        {/* Profile Avatar Button */}
        <TouchableOpacity onPress={() => setIsProfileOpen(true)} className="relative">
          <View className="w-11 h-11 rounded-full bg-[#5A52FF] items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full bg-[#5A52FF] items-center justify-center">
                <Text className="text-white text-[15px] font-black tracking-tighter">
                  {user?.name?.charAt(0).toUpperCase() || 'T'}
                </Text>
              </View>
            )}
          </View>
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-[2.5px] border-white dark:border-slate-800" />
        </TouchableOpacity>
      </View>

      <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 mx-4">
        <Text className="text-slate-800 dark:text-slate-100 text-base font-bold">Teacher modules will be implemented in Phase 5.</Text>
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
                    {user?.name?.charAt(0).toUpperCase() || 'T'}
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
