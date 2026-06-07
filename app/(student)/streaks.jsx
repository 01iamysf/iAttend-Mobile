import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentHeader from '../../components/student/StudentHeader';
import { Flame, Trophy } from 'lucide-react-native';

export default function StreaksPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/student/leaderboard');
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      <StudentHeader title="Streaks" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Current Streak Card */}
        <View className="bg-[#4F46E5] dark:bg-indigo-600 rounded-[24px] p-6 mb-6 flex-row items-center overflow-hidden">
          <View className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
            <Flame size={140} color="white" />
          </View>
          <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
            <Flame size={32} color="#FBBF24" />
          </View>
          <View>
            <Text className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">My Current Streak</Text>
            <Text className="text-white text-4xl font-black">{user?.streakCount || 0} <Text className="text-lg">Days</Text></Text>
            <Text className="text-indigo-200 text-xs font-medium mt-1">Best Streak: {user?.bestStreak || 0} Days</Text>
          </View>
        </View>

        {/* Leaderboard Card */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
          <View className="p-5 border-b border-slate-100 dark:border-slate-700 flex-row items-center">
            <Trophy size={20} color="#F59E0B" />
            <Text className="text-lg font-black text-slate-800 dark:text-slate-100 ml-2">Class Leaderboard</Text>
          </View>

          {leaderboard.length > 0 ? (
            <View className="p-4 space-y-3">
              {leaderboard.map((student, index) => {
                const isFirst = index === 0;
                const isMe = student._id === user?._id;
                return (
                  <View 
                    key={student._id || index} 
                    className={`p-4 rounded-xl flex-row items-center border ${isFirst ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isFirst ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <Text className={`font-black text-sm ${isFirst ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold ${isFirst ? 'text-amber-900 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {student.name} {isMe && <Text className="text-indigo-500 text-xs">(You)</Text>}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className={`font-black mr-1 ${isFirst ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>{student.streakCount}</Text>
                      <Flame size={16} color={isFirst ? '#EA580C' : '#94A3B8'} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="p-8 items-center justify-center">
              <Text className="text-slate-500 dark:text-slate-400 font-medium">Leaderboard empty or unavailable.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
