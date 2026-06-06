import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useSidebar } from './_layout';
import api from '../../services/api';
import { Menu, Activity, ChevronRight, User, Search, Clock, CheckCircle, AlertCircle, ChevronLeft, BookOpen, Users } from 'lucide-react-native';
import AdminHeader from '../../components/admin/AdminHeader';
export default function SystemActivity() {
  const { setIsSidebarOpen } = useSidebar();
  
  // Explorer State
  const [view, setView] = useState('explorer'); // 'explorer' or 'profile'
  const [selection, setSelection] = useState({ departmentId: '', role: 'student', classId: '' });

  // Data State
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [userSubjects, setUserSubjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (view === 'profile') {
        setView('explorer');
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [view]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selection.departmentId) {
      fetchClasses(selection.departmentId);
    } else {
      setClasses([]);
      setSelection(prev => ({ ...prev, classId: '' }));
    }
  }, [selection.departmentId]);

  useEffect(() => {
    if (selection.departmentId && (selection.role === 'teacher' || (selection.role === 'student' && selection.classId))) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [selection.departmentId, selection.role, selection.classId]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchClasses = async (deptId) => {
    try {
      const res = await api.get('/admin/classes');
      const filtered = res.data.filter(c => c.departmentId?._id === deptId || c.departmentId === deptId);
      setClasses(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let res;
      if (selection.role === 'student') {
        res = await api.get('/admin/students', { params: { classId: selection.classId } });
      } else {
        res = await api.get('/admin/teachers', { params: { departmentId: selection.departmentId } });
      }
      setUsers(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user) => {
    setLoading(true);
    setView('profile');
    try {
      const res = await api.get(`/admin/user-details/${user._id}`);
      setSelectedUser(res.data.profile);
      setActivityStats(res.data.stats);
      setUserSubjects(res.data.subjects || res.data.profile.enrolledSubjects || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch activity profile');
      setView('explorer');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (view === 'profile' && selectedUser && activityStats) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        {/* Profile Header */}
        <View className="bg-indigo-600 pb-6 px-6 rounded-b-[40px] z-10 shadow-sm">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => setView('explorer')} className="mr-4 p-2 bg-white/20 rounded-full">
              <ChevronLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>{selectedUser.name}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">{selectedUser.role}</Text>
            </View>
            <Text className="text-indigo-100 text-xs ml-3">{selectedUser.department?.departmentName}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          
          {/* Stats Overview */}
          <View className="flex-row justify-between mb-6">
            {selectedUser.role === 'student' ? (
              <>
                <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 items-center justify-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">Attendance</Text>
                  <Text className="text-3xl font-black text-indigo-600">
                    {Math.round((activityStats.totalPresent / (activityStats.totalClasses || 1)) * 100)}%
                  </Text>
                </View>
                <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 items-center justify-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">Classes</Text>
                  <Text className="text-2xl font-black text-slate-800 dark:text-slate-100">{activityStats.totalPresent} / {activityStats.totalClasses}</Text>
                </View>
              </>
            ) : (
              <>
                <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 items-center justify-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 text-center">Sessions</Text>
                  <Text className="text-3xl font-black text-indigo-600">{activityStats.totalClassesConducted}</Text>
                </View>
                <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 items-center justify-center">
                  <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 text-center">Subjects</Text>
                  <Text className="text-3xl font-black text-slate-800 dark:text-slate-100">{userSubjects?.length || 0}</Text>
                </View>
              </>
            )}
          </View>

          {/* Activity Timeline */}
          <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
            <View className="flex-row items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <Clock size={20} color="#4F46E5" />
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Activity Timeline</Text>
            </View>

            {activityStats.history.length > 0 ? (
              <View className="space-y-4">
                {activityStats.history.map((record, i) => (
                  <View key={i} className="flex-row items-start">
                    <View className="items-center mr-4">
                      <View className={`w-8 h-8 rounded-full items-center justify-center ${record.status === 'present' || selectedUser.role === 'teacher' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {selectedUser.role === 'teacher' || record.status === 'present' ? <CheckCircle size={14} color="#10B981" /> : <AlertCircle size={14} color="#EF4444" />}
                      </View>
                      {i !== activityStats.history.length - 1 && <View className="w-0.5 h-10 bg-slate-100 dark:bg-slate-700 my-1" />}
                    </View>
                    <View className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <View className="flex-row justify-between mb-1">
                        <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {selectedUser.role === 'student' ? `Marked ${record.status}` : 'Class Conducted'}
                        </Text>
                        <Text className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{new Date(record.date).toLocaleDateString()}</Text>
                      </View>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {record.subjectId?.subjectName} | {record.classId?.className}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-center text-slate-400 dark:text-slate-500 py-6">No recent activity.</Text>
            )}
          </View>

        </ScrollView>
      </View>
    );
  }

  // Explorer View
  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      
      <AdminHeader title="Activity Explorer" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Selection Flow */}
        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-[10px] font-black text-indigo-500 tracking-widest mb-2 ml-2">STEP 1: DEPARTMENT</Text>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} horizontal showsHorizontalScrollIndicator={false} className="py-1 -mx-4">
              {departments.map(d => (
                <TouchableOpacity 
                  key={d._id}
                  onPress={() => setSelection({ ...selection, departmentId: d._id, classId: '' })}
                  className={`mr-2 px-5 py-3 rounded-xl border ${selection.departmentId === d._id ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                >
                  <Text className={`font-bold ${selection.departmentId === d._id ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{d.departmentName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selection.departmentId ? (
            <View>
              <Text className="text-[10px] font-black text-pink-500 tracking-widest mb-2 ml-2">STEP 2: ROLE</Text>
              <View className="flex-row">
                {['student', 'teacher'].map(role => (
                  <TouchableOpacity 
                    key={role}
                    onPress={() => setSelection({ ...selection, role })}
                    className={`mr-2 px-5 py-3 rounded-xl border ${selection.role === role ? 'bg-pink-500 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                  >
                    <Text className={`font-bold capitalize ${selection.role === role ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {selection.departmentId && selection.role === 'student' ? (
            <View>
              <Text className="text-[10px] font-black text-emerald-500 tracking-widest mb-2 ml-2">STEP 3: CLASS</Text>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} horizontal showsHorizontalScrollIndicator={false} className="py-1 -mx-4">
                {classes.map(c => (
                  <TouchableOpacity 
                    key={c._id}
                    onPress={() => setSelection({ ...selection, classId: c._id })}
                    className={`mr-2 px-5 py-3 rounded-xl border ${selection.classId === c._id ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                  >
                    <Text className={`font-bold ${selection.classId === c._id ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{c.className}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* Results List */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Users size={20} color="#94A3B8" />
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Results ({users.length})</Text>
            </View>
            {loading && <ActivityIndicator color="#4F46E5" size="small" />}
          </View>

          {!selection.departmentId ? (
            <View className="items-center justify-center py-10">
              <Search size={40} color="#CBD5E1" />
              <Text className="text-slate-400 dark:text-slate-500 mt-4 font-semibold">Select a department to explore</Text>
            </View>
          ) : users.length > 0 ? (
            <View className="space-y-3">
              {users.map(u => (
                <TouchableOpacity 
                  key={u._id}
                  onPress={() => handleUserClick(u)}
                  className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"
                >
                  <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center">
                    <User size={18} color="#4F46E5" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">{u.name}</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">{u.email}</Text>
                  </View>
                  <ChevronRight size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-slate-400 dark:text-slate-500 mt-4 font-semibold">No {selection.role}s found.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
