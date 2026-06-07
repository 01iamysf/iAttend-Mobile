import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useSidebar } from '../../app/(student)/_layout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StudentHeader({ title = 'Student Dashboard' }) {
  const { setIsSidebarOpen } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

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
          <View className="ml-2 relative">
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
          </View>
        </View>

      </View>
    </View>
  );
}
