import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../services/api';
import { Plus, Trash2, Edit2, BookOpen, Layers, X, ChevronRight, Search } from 'lucide-react-native';
import AdminHeader from '../../components/admin/AdminHeader';

export default function Subjects() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDeptId, setActiveDeptId] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ subjectName: '', subjectCode: '', credits: '', type: 'theory', departmentId: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [deptRes, subRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/subjects')
      ]);
      setDepartments(deptRes.data);
      setSubjects(subRes.data);
      if (!activeDeptId && deptRes.data.length > 0) {
        setActiveDeptId(deptRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch data');
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

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        credits: (subject.credits || 0).toString(),
        type: subject.type,
        departmentId: subject.departmentId?._id || subject.departmentId
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({ subjectName: '', subjectCode: '', credits: '', type: 'theory', departmentId: activeDeptId || '' });
    }
    setModalVisible(true);
  };

  const saveSubject = async () => {
    if (!subjectForm.subjectName || !subjectForm.subjectCode || !subjectForm.departmentId) {
      return Alert.alert('Error', 'Please fill required fields');
    }
    setSaving(true);
    try {
      const payload = { ...subjectForm, credits: parseInt(subjectForm.credits) || 0 };
      if (editingSubject) {
        await api.put(`/admin/subject/${editingSubject._id}`, payload);
      } else {
        await api.post('/admin/create-subject', payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = (id, name) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/subject/${id}`);
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
        }
      ]
    );
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/admin/subject/${id}`);
        fetchData();
      }}
    ]);
  };

  const departmentStats = departments.map(d => ({
    ...d,
    subjectCount: subjects.filter(s => (s.departmentId?._id || s.departmentId) === d._id).length
  }));

  const activeDept = departments.find(d => d._id === selectedDeptId);
  const filteredSubjects = subjects
    .filter(s => (s.departmentId?._id || s.departmentId) === selectedDeptId)
    .filter(s => s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      
      <AdminHeader title={selectedDeptId ? activeDept?.departmentName : 'Manage Subjects'} />

      {selectedDeptId && (
        <View className="px-4 ">
          <View className="bg-slate-50 dark:bg-slate-900/50 flex-row items-center px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <Search size={18} color="#94A3B8" />
            <TextInput 
              className="flex-1 ml-2 text-slate-800 dark:text-slate-100"
              placeholder="Search subjects..."
              placeholderTextColor="#94A3B8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        
        {!selectedDeptId ? (
          // Department Cards View
          <View className="flex-row flex-wrap justify-between">
            {departmentStats.map(dept => (
              <TouchableOpacity 
                key={dept._id}
                className="w-[48%] bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-700"
                onPress={() => setSelectedDeptId(dept._id)}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl">
                    <Layers size={20} color="#4F46E5" />
                  </View>
                  <ChevronRight size={18} color="#CBD5E1" />
                </View>
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1" numberOfLines={1}>{dept.departmentName}</Text>
                <View className="flex-row items-center">
                  <BookOpen size={12} color="#94A3B8" />
                  <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">{dept.subjectCount} Subjects</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Subject List View
          <View className="pb-10">
            {filteredSubjects.map(subject => (
              <View key={subject._id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-700 flex-row justify-between items-center">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-bold text-indigo-600 dark:text-indigo-400 mb-1">{subject.subjectName}</Text>
                  <Text className="text-[10px] text-slate-400 font-black tracking-widest uppercase">
                    {activeDept?.departmentName}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity 
                    className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 items-center justify-center border border-slate-200 dark:border-slate-600"
                    onPress={() => openModal(subject)}
                  >
                    <Edit2 size={14} color="#64748B" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center border border-red-100 dark:border-red-900/50"
                    onPress={() => handleDelete(subject._id)}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {filteredSubjects.length === 0 && (
              <View className="items-center justify-center py-10 opacity-50">
                <BookOpen size={48} color="#94A3B8" />
                <Text className="text-slate-500 dark:text-slate-400 font-bold mt-4">No Subjects Found</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40 dark:bg-black/60">
          <View className="bg-white dark:bg-slate-900 rounded-t-[24px] p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {!!editingSubject ? 'Edit Subject' : 'New Subject'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <Text className="font-bold text-slate-500 dark:text-slate-400">X</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Subject Name *</Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-800 dark:text-slate-100"
                  placeholder="e.g. Mobile Development"
                  placeholderTextColor="#94A3B8"
                  value={subjectForm.subjectName}
                  onChangeText={text => setSubjectForm({...subjectForm, subjectName: text})}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Department *</Text>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                  {departments.map(d => (
                    <TouchableOpacity 
                      key={d._id}
                      className={`mr-2 px-4 py-2.5 rounded-xl border ${subjectForm.departmentId === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      onPress={() => setSubjectForm({...subjectForm, departmentId: d._id})}
                    >
                      <Text className={`text-sm font-bold ${subjectForm.departmentId === d._id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {d.departmentName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity 
                className="bg-indigo-600 rounded-xl py-4 items-center mt-4 shadow-sm shadow-indigo-200"
                onPress={saveSubject}
              >
                <Text className="text-white font-bold text-base">
                  {!!editingSubject ? 'Update Subject' : 'Create Subject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
