import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSidebar } from './_layout';
import api from '../../services/api';
import { Menu, BookOpen, UserCheck, Plus, Check, Calendar, Clock, MapPin, Building2, LayoutGrid } from 'lucide-react-native';
import AdminHeader from '../../components/admin/AdminHeader';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM'
];

export default function Assignments() {
  const { setIsSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('subject'); // 'subject' or 'coordinator'

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [subjectForm, setSubjectForm] = useState({ departmentId: '', classId: '', teacherId: '', subjectId: '', timeSlot: '', roomNumber: '', dayOfWeek: '', startTime: '', endTime: '' });
  const [coordinatorForm, setCoordinatorForm] = useState({ departmentId: '', classId: '', teacherId: '' });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [deptRes, teacherRes, subjectRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/teachers'),
        api.get('/admin/subjects')
      ]);
      setDepartments(deptRes.data);
      setTeachers(teacherRes.data);
      setSubjects(subjectRes.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClasses = async (deptId) => {
      if (!deptId) return setClasses([]);
      try {
        const res = await api.get(`/admin/classes?departmentId=${deptId}`);
        setClasses(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    const activeDeptId = activeTab === 'subject' ? subjectForm.departmentId : coordinatorForm.departmentId;
    fetchClasses(activeDeptId);
  }, [subjectForm.departmentId, coordinatorForm.departmentId, activeTab]);

  const handleSubjectSubmit = async () => {
    if (!subjectForm.departmentId || !subjectForm.classId || !subjectForm.subjectId || !subjectForm.teacherId || !selectedDay || !selectedTime) {
      return Alert.alert('Error', 'Please fill all required fields including schedule');
    }

    setSubmitting(true);
    let startTime = '';
    let endTime = '';
    if (selectedTime) {
      const parts = selectedTime.split(' - ');
      startTime = parts[0];
      endTime = parts[1];
    }

    const payload = {
      ...subjectForm,
      dayOfWeek: selectedDay,
      startTime,
      endTime
    };

    try {
      await api.post('/admin/assign-subject', payload);
      Alert.alert('Success', 'Subject assigned successfully!');
      setSubjectForm({ ...subjectForm, subjectId: '', teacherId: '' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoordinatorSubmit = async () => {
    if (!coordinatorForm.departmentId || !coordinatorForm.classId || !coordinatorForm.teacherId) {
      return Alert.alert('Error', 'Please fill all fields');
    }

    setSubmitting(true);
    try {
      await api.post('/admin/assign-class-coordinator', coordinatorForm);
      Alert.alert('Success', 'Class Coordinator appointed successfully!');
      setCoordinatorForm({ ...coordinatorForm, teacherId: '' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to appoint coordinator');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        
        <AdminHeader title="Academic Assignments" />

        {/* Tabs */}
        <View className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex-row">
          <TouchableOpacity 
            onPress={() => setActiveTab('subject')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mr-2 ${activeTab === 'subject' ? 'bg-indigo-600' : 'bg-slate-50 dark:bg-slate-900/50'}`}
          >
            <BookOpen size={16} color={activeTab === 'subject' ? 'white' : '#64748B'} />
            <Text className={`ml-2 text-sm font-bold ${activeTab === 'subject' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Subjects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('coordinator')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ml-2 ${activeTab === 'coordinator' ? 'bg-indigo-600' : 'bg-slate-50 dark:bg-slate-900/50'}`}
          >
            <UserCheck size={16} color={activeTab === 'coordinator' ? 'white' : '#64748B'} />
            <Text className={`ml-2 text-sm font-bold ${activeTab === 'coordinator' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Coordinators</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          
          {activeTab === 'subject' ? (
            <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Assign Subject to Faculty</Text>

              <View className="space-y-4">
                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Department</Text>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    {departments.map(d => (
                      <TouchableOpacity 
                        key={d._id} 
                        onPress={() => setSubjectForm({...subjectForm, departmentId: d._id, classId: '', subjectId: ''})} 
                        className={`mr-2 px-4 py-2 rounded-xl border ${subjectForm.departmentId === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={subjectForm.departmentId === d._id ? 'text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{d.departmentName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {subjectForm.departmentId ? (
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Class & Section</Text>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                      {classes.map(c => (
                        <TouchableOpacity 
                          key={c._id} 
                          onPress={() => setSubjectForm({...subjectForm, classId: c._id})} 
                          className={`mr-2 px-4 py-2 rounded-xl border ${subjectForm.classId === c._id ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                        >
                          <Text className={subjectForm.classId === c._id ? 'text-pink-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{c.className}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {subjectForm.departmentId ? (
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Subject</Text>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                      {subjects.filter(s => s.departmentId === subjectForm.departmentId || s.departmentId?._id === subjectForm.departmentId).map(s => (
                        <TouchableOpacity 
                          key={s._id} 
                          onPress={() => setSubjectForm({...subjectForm, subjectId: s._id})} 
                          className={`mr-2 px-4 py-2 rounded-xl border ${subjectForm.subjectId === s._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                        >
                          <Text className={subjectForm.subjectId === s._id ? 'text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{s.subjectName}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Room No.</Text>
                  <TextInput 
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100" 
                    placeholder="e.g. Hall 402"
                    placeholderTextColor="#94A3B8"
                    value={subjectForm.roomNumber}
                    onChangeText={t => setSubjectForm({...subjectForm, roomNumber: t})}
                  />
                </View>

                {/* Schedule Picker */}
                <View className="mt-4 border-t border-slate-100 dark:border-slate-700 ">
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex-row items-center">
                    Weekly Schedule
                  </Text>
                  
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Day</Text>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {DAYS.map(day => (
                      <TouchableOpacity 
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        className={`mr-2 px-4 py-2 rounded-xl border ${selectedDay === day ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={selectedDay === day ? 'text-indigo-600 font-bold' : 'text-slate-500 dark:text-slate-400'}>{day.substring(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Time Slot</Text>
                  <View className="flex-row flex-wrap -mx-1">
                    {TIMES.map(time => (
                      <TouchableOpacity 
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        className={`w-1/2 p-1`}
                      >
                        <View className={`rounded-xl py-3 items-center justify-center border ${selectedTime === time ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                          <Text className={`text-[10px] font-bold ${selectedTime === time ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>{time}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Faculty */}
                <View className="mt-4 border-t border-slate-100 dark:border-slate-700 ">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Faculty Member</Text>
                  {/* Using horizontal scroll for faculty to avoid complex pickers on mobile */}
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    {teachers.map(t => (
                      <TouchableOpacity 
                        key={t._id} 
                        onPress={() => setSubjectForm({...subjectForm, teacherId: t._id})} 
                        className={`mr-2 px-4 py-3 rounded-xl border ${subjectForm.teacherId === t._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={subjectForm.teacherId === t._id ? 'text-indigo-600 font-bold' : 'text-slate-800 dark:text-slate-100 font-semibold'}>{t.name}</Text>
                        <Text className={`text-[10px] ${subjectForm.teacherId === t._id ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{t.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity 
                  onPress={handleSubjectSubmit} 
                  disabled={submitting}
                  className="bg-indigo-600 rounded-xl py-4 items-center mt-4 shadow-sm flex-row justify-center"
                >
                  {submitting ? <ActivityIndicator color="white" /> : (
                    <>
                      <Plus size={18} color="white" />
                      <Text className="text-white font-bold text-base ml-2">Assign Subject</Text>
                    </>
                  )}
                </TouchableOpacity>

              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Appoint Coordinator</Text>

              <View className="space-y-4">
                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Department</Text>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    {departments.map(d => (
                      <TouchableOpacity 
                        key={d._id} 
                        onPress={() => setCoordinatorForm({...coordinatorForm, departmentId: d._id, classId: ''})} 
                        className={`mr-2 px-4 py-2 rounded-xl border ${coordinatorForm.departmentId === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={coordinatorForm.departmentId === d._id ? 'text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{d.departmentName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {coordinatorForm.departmentId ? (
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Class & Section</Text>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                      {classes.map(c => (
                        <TouchableOpacity 
                          key={c._id} 
                          onPress={() => setCoordinatorForm({...coordinatorForm, classId: c._id})} 
                          className={`mr-2 px-4 py-2 rounded-xl border ${coordinatorForm.classId === c._id ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                        >
                          <Text className={coordinatorForm.classId === c._id ? 'text-pink-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{c.className}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Appoint Faculty</Text>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    {teachers.map(t => (
                      <TouchableOpacity 
                        key={t._id} 
                        onPress={() => setCoordinatorForm({...coordinatorForm, teacherId: t._id})} 
                        className={`mr-2 px-4 py-3 rounded-xl border ${coordinatorForm.teacherId === t._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={coordinatorForm.teacherId === t._id ? 'text-indigo-600 font-bold' : 'text-slate-800 dark:text-slate-100 font-semibold'}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 mt-4">
                  <Text className="text-amber-700 dark:text-amber-500 font-bold text-xs mb-1">Elevated Privileges</Text>
                  <Text className="text-amber-600 dark:text-amber-400/80 text-[10px]">Appointing a Class Coordinator grants this faculty member the authority to oversee leaf approvals, monitor class-wide attendance, and manage student performance metrics.</Text>
                </View>

                <TouchableOpacity 
                  onPress={handleCoordinatorSubmit} 
                  disabled={submitting}
                  className="bg-indigo-600 rounded-xl py-4 items-center mt-2 shadow-sm flex-row justify-center"
                >
                  {submitting ? <ActivityIndicator color="white" /> : (
                    <>
                      <UserCheck size={18} color="white" />
                      <Text className="text-white font-bold text-base ml-2">Appoint Coordinator</Text>
                    </>
                  )}
                </TouchableOpacity>

              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
