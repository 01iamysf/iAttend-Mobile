import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentHeader from '../../components/student/StudentHeader';
import { CalendarDays, Shield } from 'lucide-react-native';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'present', 'absent'

  const canView = user?.permissions?.includes('viewAttendance');

  const fetchHistory = async () => {
    try {
      if (!canView) return;
      const { data } = await api.get('/student/overview');
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [canView]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredHistory = history.filter(record => {
    if (filter === 'all') return true;
    return record.status === filter;
  });

  if (!canView) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        <StudentHeader title="Attendance History" />
        <View className="flex-1 items-center justify-center p-6">
          <Shield size={48} color="#94A3B8" className="mb-4" />
          <Text className="text-slate-500 dark:text-slate-400 text-center font-medium">Attendance reporting is disabled for your account.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      <StudentHeader title="History" />

      {/* Filters */}
      <View className="px-4 py-3 flex-row space-x-2">
        {['all', 'present', 'absent'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border ${filter === f ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
          >
            <Text className={`font-bold capitalize ${filter === f ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        <View className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
          <View className="p-4 border-b border-slate-100 dark:border-slate-700 flex-row items-center bg-slate-50 dark:bg-slate-800/50">
            <CalendarDays size={18} color="#4F46E5" />
            <Text className="font-bold ml-2 text-slate-800 dark:text-slate-100">Attendance Records</Text>
            <Text className="ml-auto text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{filteredHistory.length}</Text>
          </View>

          {filteredHistory.length > 0 ? (
            <View>
              {filteredHistory.map((record, index) => {
                const isPresent = record.status === 'present';
                return (
                  <View 
                    key={record._id || index} 
                    className={`p-4 border-b border-slate-100 dark:border-slate-700 flex-row justify-between items-center ${index === filteredHistory.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800 dark:text-slate-100 mb-1">{record.subjectId?.subjectName || 'Unknown Subject'}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {record.time || 'N/A'}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${isPresent ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <Text className={`text-xs font-bold capitalize ${isPresent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {record.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="p-8 items-center justify-center">
              <Text className="text-slate-500 dark:text-slate-400 font-medium">No records found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
