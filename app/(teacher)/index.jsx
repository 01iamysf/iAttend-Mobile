import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Image, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LogOut, Users, BookOpen, Clock, Calendar, Check, X, Search, ShieldAlert, Award, FileText, ChevronRight, CheckCircle, XCircle, Mail, Building, User, Sun, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'attendance', 'leaves'
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [allocations, setAllocations] = useState([]);
  const [roster, setRoster] = useState([]);
  const [coordinatedRoster, setCoordinatedRoster] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendedStudents, setAttendedStudents] = useState({}); // Staging: { studentId: 'present' | 'absent' }
  const [searchTerm, setSearchTerm] = useState('');
  const [leaves, setLeaves] = useState([]);

  const isCoordinator = !!user?.classCoordinatorFor;

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Allocations
      const allocRes = await api.get('/teacher/subjects');
      setAllocations(allocRes.data || []);

      // Fetch Roster
      const rosterRes = await api.get('/teacher/roster');
      const subjectRoster = rosterRes.data?.subjectRoster || [];
      setRoster(subjectRoster);
      setCoordinatedRoster(rosterRes.data?.coordinatedRoster || null);

      if (subjectRoster.length > 0) {
        setSelectedSession(subjectRoster[0]);
      }

      // Fetch leaves if coordinator
      if (isCoordinator) {
        const leavesRes = await api.get('/leave/coordinator/all');
        setLeaves(leavesRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch teacher dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  // Check if session is active based on time slot
  const isCurrentTimeInSlot = (startTimeStr, endTimeStr, dayOfWeek) => {
    if (!startTimeStr || !endTimeStr || !dayOfWeek) return false;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();

    if (days[now.getDay()] !== dayOfWeek) return false;

    const timeToMinutes = (timeStr) => {
      const parts = timeStr.trim().split(' ');
      if (parts.length < 2) return 0;
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(startTimeStr) - 15; // 15 mins early buffer
    const endMinutes = timeToMinutes(endTimeStr) + 15;   // 15 mins late buffer

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Stage Attendance Actions
  const stageAttendance = (studentId, status) => {
    setAttendedStudents(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const unmarkAttendance = (studentId) => {
    setAttendedStudents(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const markAllStatus = (status) => {
    if (!selectedSession) return;
    const updates = {};
    selectedSession.students.forEach(s => {
      if (s.attendanceStatus !== 'leave') {
        updates[s._id] = status;
      }
    });
    setAttendedStudents(prev => ({ ...prev, ...updates }));
  };

  // Submit bulk attendance
  const submitAttendance = async () => {
    const studentIds = Object.keys(attendedStudents);
    if (studentIds.length === 0) return;

    try {
      const attendanceData = studentIds.map(id => ({
        studentId: id,
        status: attendedStudents[id]
      }));

      await api.post('/attendance/manual-bulk', {
        attendanceData,
        classId: selectedSession.class?._id,
        subjectId: selectedSession.subject?._id
      });

      Alert.alert('Success', `Submitted attendance for ${studentIds.length} students.`);
      setAttendedStudents({}); // Clear staging
      
      // Refresh roster data
      const rosterRes = await api.get('/teacher/roster');
      const subjectRoster = rosterRes.data?.subjectRoster || [];
      setRoster(subjectRoster);
      const current = subjectRoster.find(r => r.allocationId === selectedSession.allocationId);
      if (current) setSelectedSession(current);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit attendance');
    }
  };

  // Coordinator Leave Approvals
  const handleLeaveAction = async (leaveId, action) => {
    Alert.prompt(
      'Optional Note',
      `Specify a reason for ${action}ing this leave request:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async (reason) => {
            try {
              await api.put(`/leave/${action}/${leaveId}`, { reason });
              Alert.alert('Success', `Leave request ${action}ed.`);
              // Refresh leaves
              const leavesRes = await api.get('/leave/coordinator/all');
              setLeaves(leavesRes.data || []);
            } catch (err) {
              Alert.alert('Error', 'Failed to update leave request status');
            }
          }
        }
      ]
    );
  };

  const hasBypass = user?.permissions?.includes('bypassTimeRestraint');
  const isSessionActive = selectedSession ? isCurrentTimeInSlot(selectedSession.startTime, selectedSession.endTime, selectedSession.dayOfWeek) : false;
  const canMark = isSessionActive || hasBypass;

  const filteredStudents = selectedSession?.students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#5A52FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900" style={{ paddingTop: Math.max(insets.top + 8, 16) }}>
      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 mx-4 mb-4">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-black text-[#1E293B] dark:text-slate-100" numberOfLines={1}>Teacher Dashboard</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium" numberOfLines={1}>Welcome, {user?.name}</Text>
        </View>

        <View className="flex-row items-center">
          {/* Theme Toggle Button */}
          <TouchableOpacity 
            onPress={toggleColorScheme}
            className="w-10 h-10 rounded-[16px] bg-slate-50 dark:bg-slate-700/50 items-center justify-center mr-2 active:scale-95"
          >
            {colorScheme === 'dark' ? (
              <Sun size={20} color="#F59E0B" />
            ) : (
              <Moon size={20} color="#64748B" />
            )}
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity onPress={() => setIsProfileOpen(true)} className="relative">
            <View className="w-11 h-11 rounded-full bg-[#5A52FF] items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700">
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full bg-[#5A52FF] items-center justify-center">
                  <Text className="text-white text-[15px] font-black tracking-tighter">
                    {user?.name?.charAt(0).toUpperCase() || 'T'}
                  </Text>
                </View>
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-[2.5px] border-white dark:border-slate-800" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        <TouchableOpacity 
          onPress={() => setActiveTab('dashboard')} 
          className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
        >
          <Text className={`font-bold text-xs ${activeTab === 'dashboard' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('attendance')} 
          className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
        >
          <Text className={`font-bold text-xs ${activeTab === 'attendance' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>Attendance</Text>
        </TouchableOpacity>
        {isCoordinator && (
          <TouchableOpacity 
            onPress={() => setActiveTab('leaves')} 
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'leaves' ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
          >
            <Text className={`font-bold text-xs ${activeTab === 'leaves' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>Leaves ({leaves.filter(l => l.status === 'pending').length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        className="flex-1 px-4" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A52FF" />}
      >
        
        {/* OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <View>
            {/* Quick Stats */}
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%] bg-white dark:bg-slate-800 p-4 rounded-[20px] border border-slate-100 dark:border-slate-700">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 items-center justify-center mb-2">
                  <BookOpen size={16} color="#5A52FF" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-slate-100">{allocations.length}</Text>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">Assigned Classes</Text>
              </View>

              <View className="w-[48%] bg-white dark:bg-slate-800 p-4 rounded-[20px] border border-slate-100 dark:border-slate-700">
                <View className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 items-center justify-center mb-2">
                  <Award size={16} color="#10B981" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-slate-100">{isCoordinator ? 'Coordinator' : 'Teacher'}</Text>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">System Role</Text>
              </View>
            </View>

            {/* Timetable Header */}
            <Text className="text-slate-800 dark:text-slate-100 text-base font-black mb-3 ml-1">My Weekly Allocations</Text>
            
            {allocations.length > 0 ? (
              allocations.map((alloc, idx) => (
                <View key={alloc._id || idx} className="bg-white dark:bg-slate-800 rounded-[20px] p-5 border border-slate-100 dark:border-slate-700 mb-3 flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 items-center justify-center mr-4">
                    <BookOpen size={22} color="#5A52FF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-0.5">{alloc.subjectId?.subjectName}</Text>
                    <Text className="text-xs text-indigo-500 font-bold mb-2">{alloc.classId?.className} • Section {alloc.classId?.section || 'A'}</Text>
                    
                    <View className="flex-row items-center">
                      <Clock size={12} color="#94A3B8" />
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 ml-1 font-medium">{alloc.dayOfWeek} | {alloc.startTime} - {alloc.endTime}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </View>
              ))
            ) : (
              <View className="py-12 items-center justify-center bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                <BookOpen size={48} color="#94A3B8" className="mb-3" />
                <Text className="text-slate-500 dark:text-slate-400 font-medium">No schedules assigned.</Text>
              </View>
            )}
          </View>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <View>
            {/* Session Selector */}
            <Text className="text-slate-800 dark:text-slate-100 text-sm font-black mb-2 ml-1">Select Teaching Session</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {roster.map((session) => {
                const active = isCurrentTimeInSlot(session.startTime, session.endTime, session.dayOfWeek);
                const isSelected = selectedSession?.allocationId === session.allocationId;
                return (
                  <TouchableOpacity
                    key={session.allocationId}
                    onPress={() => { setSelectedSession(session); setAttendedStudents({}); }}
                    className={`px-4 py-3 rounded-2xl border mr-2 flex-row items-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                  >
                    <BookOpen size={14} color={isSelected ? '#FFFFFF' : '#5A52FF'} />
                    <Text className={`text-xs font-bold ml-1.5 ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                      {session.subject?.subjectName} ({session.class?.className})
                    </Text>
                    {active && <View className="w-2 h-2 rounded-full bg-emerald-500 ml-2" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Slot Status Banner */}
            {selectedSession && (
              <View className={`p-4 rounded-2xl border flex-row items-center justify-between mb-4 ${canMark ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'}`}>
                <View className="flex-row items-center flex-1 pr-3">
                  <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${canMark ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                    {canMark ? <Check size={18} color="#10B981" /> : <Clock size={18} color="#D97706" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {canMark ? 'Session Available for Entry' : 'Locked: Outside Scheduled Time'}
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedSession.dayOfWeek} | {selectedSession.startTime} - {selectedSession.endTime}
                    </Text>
                  </View>
                </View>
                {hasBypass && (
                  <View className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-md">
                    <Text className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">BYPASS ACTIVE</Text>
                  </View>
                )}
              </View>
            )}

            {/* Student Roster Section */}
            {selectedSession ? (
              <View className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 p-5 mb-4">
                
                {/* Search & Bulk Stage Actions */}
                <View className="flex-row items-center mb-4">
                  <View className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 flex-row items-center mr-2">
                    <Search size={14} color="#94A3B8" />
                    <TextInput 
                      placeholder="Search roster..."
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      placeholderTextColor="#94A3B8"
                      className="flex-1 ml-2 text-xs text-slate-800 dark:text-slate-100 py-0"
                    />
                  </View>
                  
                  <View className="flex-row">
                    <TouchableOpacity 
                      disabled={!canMark}
                      onPress={() => markAllStatus('present')}
                      className={`p-2 border border-emerald-200 rounded-lg mr-1 active:scale-95 ${!canMark ? 'opacity-40' : ''}`}
                    >
                      <Text className="text-[10px] font-bold text-emerald-600">All P</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      disabled={!canMark}
                      onPress={() => markAllStatus('absent')}
                      className={`p-2 border border-red-200 rounded-lg active:scale-95 ${!canMark ? 'opacity-40' : ''}`}
                    >
                      <Text className="text-[10px] font-bold text-red-600">All A</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Roster List */}
                <View className="border-t border-slate-100 dark:border-slate-700 pt-2">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const hasSubmitted = !!student.attendanceStatus;
                      const isStaged = !!attendedStudents[student._id];
                      const stagedVal = attendedStudents[student._id];
                      
                      return (
                        <View key={student._id} className="flex-row items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50">
                          <View className="flex-1 pr-3">
                            <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.name}</Text>
                            <Text className="text-xs text-slate-400 mt-0.5">{student.rollNumber || 'N/A'} • Streak: 🔥 {student.streakCount || 0}</Text>
                          </View>

                          <View className="flex-row items-center">
                            {student.attendanceStatus === 'leave' ? (
                              <View className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 rounded-lg">
                                <Text className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">ON LEAVE</Text>
                              </View>
                            ) : hasSubmitted ? (
                              <View className={`px-2.5 py-1 rounded-lg flex-row items-center ${student.attendanceStatus === 'present' ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100' : 'bg-red-50 dark:bg-red-950/40 border border-red-100'}`}>
                                <Text className={`text-[10px] font-black uppercase ${student.attendanceStatus === 'present' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {student.attendanceStatus}
                                </Text>
                              </View>
                            ) : isStaged ? (
                              <View className="flex-row items-center">
                                <View className={`px-2.5 py-1 rounded-lg mr-2 ${stagedVal === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                  <Text className="text-[10px] font-black text-white uppercase">{stagedVal}</Text>
                                </View>
                                <TouchableOpacity onPress={() => unmarkAttendance(student._id)} className="p-1">
                                  <X size={14} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <View className="flex-row">
                                <TouchableOpacity 
                                  disabled={!canMark}
                                  onPress={() => stageAttendance(student._id, 'present')}
                                  className={`px-3 py-1.5 border border-emerald-500 rounded-lg mr-1 active:scale-95 ${!canMark ? 'border-slate-200 dark:border-slate-700 opacity-40' : ''}`}
                                >
                                  <Text className={`text-[10px] font-bold ${!canMark ? 'text-slate-400' : 'text-emerald-500'}`}>Present</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  disabled={!canMark}
                                  onPress={() => stageAttendance(student._id, 'absent')}
                                  className={`px-3 py-1.5 border border-red-500 rounded-lg active:scale-95 ${!canMark ? 'border-slate-200 dark:border-slate-700 opacity-40' : ''}`}
                                >
                                  <Text className={`text-[10px] font-bold ${!canMark ? 'text-slate-400' : 'text-red-500'}`}>Absent</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-center text-slate-400 text-xs py-8">No students found in this roster.</Text>
                  )}
                </View>

              </View>
            ) : (
              <View className="py-12 items-center justify-center bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                <Users size={48} color="#94A3B8" className="mb-3" />
                <Text className="text-slate-500 dark:text-slate-400 font-medium">No teaching sessions allocated.</Text>
              </View>
            )}
          </View>
        )}

        {/* LEAVES TAB */}
        {activeTab === 'leaves' && isCoordinator && (
          <View>
            <Text className="text-slate-800 dark:text-slate-100 text-sm font-black mb-3 ml-1">Leave Requests for your Class</Text>
            {leaves.length > 0 ? (
              leaves.map((leave) => {
                const isPending = leave.status === 'pending';
                const formattedDate = new Date(leave.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                
                return (
                  <View key={leave._id} className="bg-white dark:bg-slate-800 rounded-[20px] p-5 border border-slate-100 dark:border-slate-700 mb-3">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">{leave.studentId?.name || 'Student'}</Text>
                        <Text className="text-xs text-indigo-500 font-bold mt-0.5">{leave.studentId?.rollNumber || 'N/A'}</Text>
                      </View>
                      <View className={`px-2.5 py-1 rounded-lg ${isPending ? 'bg-amber-100' : leave.status === 'approved' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        <Text className={`text-[10px] font-black uppercase ${isPending ? 'text-amber-700' : leave.status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>{leave.status}</Text>
                      </View>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
                      <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Reason</Text>
                      <Text className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{leave.reason}</Text>
                      <Text className="text-[10px] text-slate-400 mt-2 font-bold">{formattedDate}</Text>
                    </View>

                    {isPending && (
                      <View className="flex-row">
                        <TouchableOpacity 
                          onPress={() => handleLeaveAction(leave._id, 'approve')}
                          className="flex-1 bg-emerald-500 py-2.5 rounded-xl mr-2 items-center justify-center flex-row active:scale-95"
                        >
                          <CheckCircle size={14} color="white" />
                          <Text className="text-white text-xs font-bold ml-1.5">Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleLeaveAction(leave._id, 'reject')}
                          className="flex-1 bg-red-500 py-2.5 rounded-xl items-center justify-center flex-row active:scale-95"
                        >
                          <XCircle size={14} color="white" />
                          <Text className="text-white text-xs font-bold ml-1.5">Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="py-12 items-center justify-center bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                <FileText size={48} color="#94A3B8" className="mb-3" />
                <Text className="text-slate-500 dark:text-slate-400 font-medium">No leave requests found.</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Floating Staged Submit Bar for Attendance */}
      {activeTab === 'attendance' && Object.keys(attendedStudents).length > 0 && (
        <View className="absolute bottom-6 left-4 right-4 bg-indigo-600 rounded-[20px] p-4 flex-row items-center justify-between shadow-lg">
          <View>
            <Text className="text-white text-xs font-black">{Object.keys(attendedStudents).length} Students Ready</Text>
            <Text className="text-white/60 text-[9px] font-bold mt-0.5">Submit to update database</Text>
          </View>
          <TouchableOpacity onPress={submitAttendance} className="bg-white px-5 py-2.5 rounded-xl active:scale-95">
            <Text className="text-indigo-600 text-xs font-black">Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profile Detail Modal */}
      <Modal visible={isProfileOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40 dark:bg-black/60">
          <View className="bg-white dark:bg-slate-900 rounded-t-[24px] p-6 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">My Profile</Text>
              <TouchableOpacity onPress={() => setIsProfileOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}>
              
              <View className="items-center mb-6">
                <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4">
                  <Text className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {user?.name?.charAt(0).toUpperCase() || 'T'}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">{user?.name}</Text>
                <Text className="text-sm font-bold text-indigo-500 uppercase tracking-wider mt-1">{user?.role}</Text>
              </View>

              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-3">
                <Mail size={18} color="#64748B" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</Text>
                  <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{user?.email}</Text>
                </View>
              </View>

              {user?.departmentId?.departmentName ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-3">
                  <Building size={18} color="#64748B" />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Department</Text>
                    <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{user.departmentId.departmentName}</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity 
                onPress={handleLogout}
                className="flex-row items-center justify-center py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 mt-4 border border-red-100 dark:border-red-900/40"
              >
                <LogOut size={18} color="#EF4444" />
                <Text className="ml-2 text-red-500 font-bold text-sm">Sign Out</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
