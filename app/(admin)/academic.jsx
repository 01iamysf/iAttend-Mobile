import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSidebar } from './_layout';
import api from '../../services/api';
import { Menu, Plus, Trash2, Building2 } from 'lucide-react-native';

import AdminHeader from '../../components/admin/AdminHeader';

export default function AcademicManage() {
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [newDept, setNewDept] = useState('');
  const [newClass, setNewClass] = useState({ className: '', departmentId: '', year: new Date().getFullYear().toString() });

  const fetchData = async () => {
    try {
      const [deptRes, classRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/classes')
      ]);
      setDepartments(deptRes.data);
      setClasses(classRes.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch academic data');
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

  const handleCreateDept = async () => {
    if (!newDept.trim()) return Alert.alert('Error', 'Department name is required');
    try {
      await api.post('/admin/create-department', { departmentName: newDept });
      setNewDept('');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleDeleteDept = (id, name) => {
    Alert.alert(
      'Delete Department',
      `Warning: Deleting "${name}" will also delete all subjects and allocations within it. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/department/${id}`);
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete department');
            }
          }
        }
      ]
    );
  };

  const handleCreateClass = async () => {
    if (!newClass.className || !newClass.departmentId || !newClass.year) {
      return Alert.alert('Error', 'Please fill all class fields');
    }
    try {
      await api.post('/admin/create-class', {
        ...newClass,
        year: parseInt(newClass.year)
      });
      setNewClass({ className: '', departmentId: '', year: new Date().getFullYear().toString() });
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create class');
    }
  };

  const handleDeleteClass = (id, name) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete class "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/class/${id}`);
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete class');
            }
          }
        }
      ]
    );
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
      
      <AdminHeader title="Departments & Classes" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >

        {/* Departments Section */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
          <View className="flex-row items-center mb-6">
            <Building2 size={20} color="#4F46E5" />
            <Text className="ml-2 text-lg font-bold text-slate-800 dark:text-slate-100">Departments</Text>
          </View>

          {/* Add Dept Form */}
          <View className="mb-6 space-y-3">
            <TextInput
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100"
              placeholder="New Department Name"
              placeholderTextColor="#94A3B8"
              value={newDept}
              onChangeText={setNewDept}
            />
            <TouchableOpacity 
              className="bg-indigo-600 rounded-xl py-3.5 mt-2 flex-row justify-center items-center shadow-sm"
              onPress={handleCreateDept}
            >
              <Plus size={18} color="white" />
              <Text className="text-white font-bold ml-1 text-base">Add Department</Text>
            </TouchableOpacity>
          </View>

          {/* Dept List */}
          <View className="flex-row flex-wrap -mx-1">
            {departments.map((dept) => (
              <View key={dept._id} className="w-1/2 p-1">
                <View className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-3 flex-row justify-between items-center">
                  <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1" numberOfLines={1}>{dept.departmentName}</Text>
                  <TouchableOpacity onPress={() => handleDeleteDept(dept._id, dept.departmentName)} className="p-1">
                    <Trash2 size={16} color="#EF4444" opacity={0.7} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {departments.length === 0 && (
              <Text className="text-slate-400 dark:text-slate-500 text-center w-full py-4">No departments found.</Text>
            )}
          </View>
        </View>

        {/* Classes Section */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
          <View className="flex-row items-center mb-6">
            <Building2 size={20} color="#EC4899" />
            <Text className="ml-2 text-lg font-bold text-slate-800 dark:text-slate-100">Classes</Text>
          </View>

          {/* Add Class Form */}
          <View className="mb-6 space-y-3">
            <TextInput
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100"
              placeholder="Class Name (e.g. CS101-A)"
              placeholderTextColor="#94A3B8"
              value={newClass.className}
              onChangeText={text => setNewClass({...newClass, className: text})}
            />
            <View className="flex-row gap-3">
              {/* Note: In React Native, Picker is complex. We will use a simple mapping to buttons for selection or a custom modal. For simplicity in porting, we'll use a basic horizontal scroll list as a selector */}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="flex-1 py-1">
                {departments.map(d => (
                  <TouchableOpacity 
                    key={d._id}
                    className={`mr-2 px-4 py-2 rounded-xl border ${newClass.departmentId === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                    onPress={() => setNewClass({...newClass, departmentId: d._id})}
                  >
                    <Text className={`text-xs font-bold ${newClass.departmentId === d._id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {d.departmentName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100"
              placeholder="Year"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={newClass.year}
              onChangeText={text => setNewClass({...newClass, year: text})}
            />
            <TouchableOpacity 
              className="bg-pink-500 rounded-xl py-3.5 mt-2 justify-center items-center flex-row shadow-sm"
              onPress={handleCreateClass}
            >
              <Plus size={18} color="white" />
              <Text className="text-white font-bold ml-1 text-base">Add Class</Text>
            </TouchableOpacity>
          </View>

          {/* Classes List */}
          <View className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
            <View className="bg-slate-50 dark:bg-slate-800/50 flex-row px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <Text className="flex-1 text-xs font-bold text-slate-500 dark:text-slate-400">Name</Text>
              <Text className="flex-1 text-xs font-bold text-slate-500 dark:text-slate-400">Dept</Text>
              <Text className="w-10 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">Yr</Text>
              <Text className="w-10 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">Act</Text>
            </View>
            {classes.map((c) => (
              <View key={c._id} className="flex-row px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 items-center bg-white dark:bg-slate-800">
                <Text className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{c.className}</Text>
                <Text className="flex-1 text-xs text-slate-500 dark:text-slate-400">{c.departmentId?.departmentName || 'N/A'}</Text>
                <Text className="w-10 text-xs text-slate-500 dark:text-slate-400 text-center">{c.year}</Text>
                <View className="w-10 items-end">
                  <TouchableOpacity onPress={() => handleDeleteClass(c._id, c.className)}>
                    <Trash2 size={16} color="#EF4444" opacity={0.8} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {classes.length === 0 && (
              <Text className="text-center text-slate-400 dark:text-slate-500 py-6">No classes found.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
