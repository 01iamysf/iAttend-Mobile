import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import React, { createContext, useState, useContext } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

// Context to control the sidebar from any screen in the admin module
const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Redirect href="/login" />;
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        {/* Main Stack Content */}
        <Stack
          screenOptions={{
            headerShown: false, // Hide default headers for custom UI
            contentStyle: { backgroundColor: 'transparent' } // Let the parent View handle background color
          }}
        />
        
        {/* Global Sidebar Overlay for Admin Module */}
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </View>
    </SidebarContext.Provider>
  );
}
