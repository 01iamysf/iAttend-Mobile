import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import StudentHeader from '../../components/student/StudentHeader';
import { BookOpen, User, Calendar, Clock } from 'lucide-react-native';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/student/subjects');
      setSubjects(data || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubjects();
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
      <StudentHeader title="My Subjects" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-1">View your weekly subjects and schedule.</Text>

        {subjects.length > 0 ? (
          <View className="space-y-4">
            {subjects.map((subject, index) => {
              const isIndividual = subject.isIndividuallyAssigned;
              return (
                <View 
                  key={subject._id || index} 
                  className={`bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 overflow-hidden ${isIndividual ? 'border-t-4 border-t-green-500' : 'border-t-4 border-t-indigo-500'}`}
                >
                  <View className="p-5">
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-row items-center flex-1 pr-4">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isIndividual ? 'bg-green-50 dark:bg-green-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                          <BookOpen size={24} color={isIndividual ? '#10B981' : '#4F46E5'} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">{subject.subjectId?.subjectName || subject.subjectName}</Text>
                          <Text className={`text-xs font-bold ${isIndividual ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {isIndividual ? 'Individual Subject' : 'Class Subject'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row space-x-2 mb-4">
                      {subject.dayOfWeek && (
                        <View className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 flex-row items-center border border-slate-100 dark:border-slate-700">
                          <Calendar size={14} color="#64748B" />
                          <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">{subject.dayOfWeek}</Text>
                        </View>
                      )}
                      {(subject.startTime || subject.timeSlot) && (
                        <View className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 flex-row items-center border border-slate-100 dark:border-slate-700">
                          <Clock size={14} color="#64748B" />
                          <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                            {subject.startTime ? `${subject.startTime} - ${subject.endTime}` : subject.timeSlot}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex-row items-center border border-slate-100 dark:border-slate-700">
                      <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-3">
                        <User size={16} color="#64748B" />
                      </View>
                      <View>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Taught By</Text>
                        <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{subject.teacherId ? subject.teacherId.name : 'Unassigned'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="py-12 items-center justify-center opacity-60 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl mt-4">
            <BookOpen size={48} color="#94A3B8" className="mb-4" />
            <Text className="text-slate-500 dark:text-slate-400 font-medium">No subjects have been assigned.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
