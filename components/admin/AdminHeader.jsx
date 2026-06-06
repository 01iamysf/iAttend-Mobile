import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Menu, Search } from 'lucide-react-native';
import { useSidebar } from '../../app/(admin)/_layout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlobalSearchModal from '../shared/GlobalSearchModal';

export default function AdminHeader({ title = 'Admin Control Panel' }) {
  const { setIsSidebarOpen } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { colorScheme } = useColorScheme();

  const displayTitle = title === 'Admin Control Panel' ? 'Admin' : title;

  return (
    <>
    <View className="z-50 bg-transparent" style={{ paddingTop: Math.max(insets.top + 8, 16), paddingHorizontal: 16, paddingBottom: 8 }}>
      <View className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-3 flex-row justify-between items-center">
          
          {/* Left: Menu & Title */}
          <View className="flex-row items-center flex-1 pr-3">
            <Pressable 
              onPress={() => setIsSidebarOpen(true)} 
              className="mr-3 w-12 h-12 rounded-[18px] bg-[#EEF2FF] dark:bg-indigo-500/20 active:scale-90 active:opacity-70 items-center justify-center"
            >
              <Menu color={colorScheme === 'dark' ? '#818CF8' : '#5A52FF'} size={24} />
            </Pressable>
            <Text className="text-[20px] font-black text-[#1E293B] dark:text-slate-100 flex-1 tracking-tight" numberOfLines={1}>
              {displayTitle}
            </Text>
          </View>

          {/* Right: Actions */}
          <View className="flex-row items-center">
            
            {/* Search Button */}
            <Pressable 
              onPress={() => setIsSearchOpen(true)}
              className="w-11 h-11 rounded-full border border-slate-100 dark:border-slate-700 items-center justify-center bg-slate-50 dark:bg-slate-800/50 active:scale-90 active:opacity-70"
            >
              <Search color={colorScheme === 'dark' ? '#CBD5E1' : '#334155'} size={20} strokeWidth={2.5} />
            </Pressable>



            {/* Profile Avatar Container */}
            <View className="ml-2 relative">
              <Pressable 
                onPress={() => router.push('/(admin)/profile')}
                className="w-11 h-11 rounded-full bg-[#5A52FF] items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 active:scale-90 shadow-sm"
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="w-full h-full" />
                ) : (
                  <View className="w-full h-full bg-[#5A52FF] items-center justify-center">
                    <Text className="text-white text-[15px] font-black tracking-tighter">
                      {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </Text>
                  </View>
                )}
              </Pressable>
              {/* Online Status Dot */}
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-[2.5px] border-white dark:border-slate-800" />
            </View>

          </View>
        </View>
      </View>

      <GlobalSearchModal 
        visible={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
