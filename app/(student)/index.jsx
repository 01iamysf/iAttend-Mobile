import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentHeader from '../../components/student/StudentHeader';
import AttendanceRing from '../../components/student/AttendanceRing';
import { Calendar, Shield, Activity, Flame, Trophy } from 'lucide-react-native';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canView = user?.permissions?.includes('viewAttendance');

  const fetchData = async () => {
    try {
      const [statsRes, subjectsRes] = await Promise.all([
        canView ? api.get('/student/overview') : Promise.resolve({ data: null }),
        api.get('/student/subjects')
      ]);
      setStats(statsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canView]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const currentDay = dayNames[new Date().getDay()];
  const todaysSubjects = subjects.filter(s => s.dayOfWeek === currentDay).sort((a, b) => {
    const t = (s) => {
      if (!s) return 0;
      const [h, m] = s.split(' ')[0].split(':');
      let hh = parseInt(h);
      if (s.includes('PM') && hh !== 12) hh += 12;
      if (s.includes('AM') && hh === 12) hh = 0;
      return hh * 60 + parseInt(m);
    };
    return t(a.startTime) - t(b.startTime);
  });

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      <StudentHeader title="Overview" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Attendance Ring */}
        <View className="mb-6">
          {canView ? (
            <AttendanceRing present={stats?.totalPresent ?? 0} total={stats?.totalClasses ?? 0} />
          ) : (
            <View className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border border-slate-200 dark:border-slate-700 items-center border-dashed opacity-70">
              <Shield size={32} color="#94A3B8" className="mb-2" />
              <Text className="text-slate-500 dark:text-slate-400 text-center font-medium">Attendance reporting is disabled for your account.</Text>
            </View>
          )}
        </View>

        {/* Streaks & Stats */}
        {canView && (
          <View className="mb-6">
            <View className="flex-row justify-between">
              <View className="w-[48%] bg-white dark:bg-slate-800 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <View className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 items-center justify-center mb-2">
                  <Flame size={16} color="#EA580C" />
                </View>
                <Text className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats?.streakCount || 0}</Text>
                <Text className="text-[10px] font-black tracking-widest text-orange-800/60 dark:text-orange-200/50 uppercase mt-1">Current Streak</Text>
              </View>

              <View className="w-[48%] bg-white dark:bg-slate-800 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 items-center justify-center mb-2">
                  <Trophy size={16} color="#16A34A" />
                </View>
                <Text className="text-2xl font-black text-green-600 dark:text-green-400">{stats?.bestStreak || 0}</Text>
                <Text className="text-[10px] font-black tracking-widest text-green-800/60 dark:text-green-200/50 uppercase mt-1">Best Streak</Text>
              </View>
            </View>

            <View className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-slate-700 flex-row justify-between mt-4">
              <View className="items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                <Text className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats?.totalClasses ?? 0}</Text>
                <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Total</Text>
              </View>
              <View className="items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                <Text className="text-xl font-black text-green-600 dark:text-green-400">{stats?.totalPresent ?? 0}</Text>
                <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Present</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xl font-black text-red-600 dark:text-red-400">{stats?.totalAbsent ?? 0}</Text>
                <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">Absent</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Schedule */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700 mb-6">
          <View className="flex-row items-center mb-4">
            <Calendar size={18} color="#4F46E5" />
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100 ml-2">Today's Schedule</Text>
          </View>

          {todaysSubjects.length > 0 ? (
            <View>
              {todaysSubjects.map((s, i) => (
                <View key={s._id || i} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border-l-4 border-l-indigo-500 border border-slate-100 dark:border-slate-700 mb-3">
                  <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{s.subjectId?.subjectName || s.subjectName}</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">{s.startTime} - {s.endTime}</Text>
                  {s.teacherId?.name && (
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2">{s.teacherId.name}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="py-6 items-center justify-center opacity-60 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">No scheduled classes for today.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
