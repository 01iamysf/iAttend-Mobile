import React, { createContext, useContext, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import StudentSidebar from '../../components/student/StudentSidebar';

// Context to control the sidebar from any screen in the student module
const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

export default function StudentLayout() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user || user.role !== 'student') {
    return <Redirect href="/login" />;
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        {/* Main Stack Content */}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' }
          }}
        />
        
        {/* Global Sidebar Overlay for Student Module */}
        <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </View>
    </SidebarContext.Provider>
  );
}
