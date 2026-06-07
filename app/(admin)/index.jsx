import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useSidebar } from './_layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Menu, Search, Bell, Users, UserCheck, School, BookOpen, TrendingUp, Clock, ShieldCheck } from 'lucide-react-native';
import { 
  StatCard, 
  AttendanceSnapshot, 
  TrendChart, 
  ActivityLogItem, 
  TeacherPerformanceItem 
} from '../../components/admin/DashboardComponents';

import AdminHeader from '../../components/admin/AdminHeader';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'teachers'

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-slate-500 font-medium">Loading System Overview...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <Text className="text-red-500 font-bold">Failed to load statistics.</Text>
      </View>
    );
  }

  const { counts, todayAttendance, teacherAttendance, trend, teacherTrend, recentActivities, teacherPerformance } = stats;
  const activeData = activeTab === 'students' ? todayAttendance : teacherAttendance;
  const activeTrend = activeTab === 'students' ? trend : teacherTrend;
  const attendanceRate = activeData.total > 0 ? Math.round((activeData.present / activeData.total) * 100) : 0;

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      
      <AdminHeader title="Admin Control Panel" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* School Identity Banner */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] mb-8 overflow-hidden border border-slate-100 dark:border-slate-700">
          <View className="h-48 w-full bg-white dark:bg-slate-800 items-center justify-center overflow-hidden">
            <Image 
              source={require('../../assets/images/school_illustration.jpg')} 
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View className="px-6 py-5 items-center justify-center">
            <Text className="text-[#5A52FF] dark:text-indigo-400 font-bold text-[15px] mb-2">
              Welcome back in
            </Text>
            <View className="flex-row items-center">
              <View className="bg-indigo-50 dark:bg-indigo-500/20 p-1.5 rounded-full mr-2">
                <ShieldCheck size={18} color="#5A52FF" />
              </View>
              <Text className="text-[20px] font-black text-slate-800 dark:text-white tracking-tight">
                {user?.schoolName || user?.organization?.name || "Sunrise International School"}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 tracking-tight">System Overview</Text>

        {/* 4 Stat Cards */}
        <View className="flex-row flex-wrap justify-between -mx-2">
          <StatCard title="Total Students" value={counts.students} icon={Users} color="#3B82F6" />
          <StatCard title="Faculty Members" value={counts.teachers} icon={UserCheck} color="#EC4899" />
        </View>
        <View className="flex-row flex-wrap justify-between -mx-2 mb-2">
          <StatCard title="Active Classes" value={counts.classes} icon={School} color="#10B981" />
          <StatCard title="Total Subjects" value={counts.subjects} icon={BookOpen} color="#F59E0B" />
        </View>

        {/* Attendance Snapshot Card */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-100 dark:border-slate-700 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <TrendingUp size={18} color="#4F46E5" />
              <Text className="ml-2 text-base font-bold text-slate-800 dark:text-slate-100">Today's Attendance Snapshot</Text>
            </View>
          </View>

          {/* Toggle Students/Teachers */}
          <View className="flex-row bg-slate-50 dark:bg-slate-900/50 rounded-xl p-1 mb-4 self-start">
            <TouchableOpacity 
              onPress={() => setActiveTab('students')}
              className={`px-4 py-1.5 rounded-lg ${activeTab === 'students' ? 'bg-indigo-500' : 'bg-transparent'}`}
              style={activeTab === 'students' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {}}
            >
              <Text className={`text-xs font-bold ${activeTab === 'students' ? 'text-white' : 'text-slate-500'}`}>Students</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('teachers')}
              className={`px-4 py-1.5 rounded-lg ${activeTab === 'teachers' ? 'bg-indigo-500' : 'bg-transparent'}`}
              style={activeTab === 'teachers' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {}}
            >
              <Text className={`text-xs font-bold ${activeTab === 'teachers' ? 'text-white' : 'text-slate-500'}`}>Teachers</Text>
            </TouchableOpacity>
          </View>

          <AttendanceSnapshot attendanceRate={attendanceRate} activeData={activeData} activeTab={activeTab} />
          <TrendChart activeTrend={activeTrend} activeTab={activeTab} teacherCount={counts.teachers} />
        </View>

        {/* Recent System Logs */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-100 dark:border-slate-700 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Clock size={18} color="#4F46E5" />
              <Text className="ml-2 text-base font-bold text-slate-800 dark:text-slate-100">Recent System Logs</Text>
            </View>
            <TouchableOpacity>
              <Text className="text-sm font-bold text-indigo-600">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View>
            {recentActivities?.length > 0 ? (
               recentActivities.slice(0, 5).map(activity => (
                 <ActivityLogItem key={activity._id} activity={activity} />
               ))
            ) : (
               <Text className="text-center text-slate-400 py-4">No recent activities.</Text>
            )}
          </View>
        </View>

        {/* Teacher Performance */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-100 dark:border-slate-700 mb-10">
          <View className="flex-row items-center mb-1">
            <TrendingUp size={18} color="#4F46E5" />
            <Text className="ml-2 text-base font-bold text-slate-800 dark:text-slate-100">Teacher Activity Overview</Text>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-6">Top Performers</Text>
          
          <View>
            {teacherPerformance?.length > 0 ? (
               teacherPerformance.map((teacher, idx) => (
                 <TeacherPerformanceItem key={teacher._id} teacher={teacher} isTopRank={idx === 0} />
               ))
            ) : (
               <Text className="text-center text-slate-400 py-4">No performance data yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
