import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSidebar } from './_layout';
import api from '../../services/api';
import { Menu, Shield, User, Layers, Search, Check } from 'lucide-react-native';
import AdminHeader from '../../components/admin/AdminHeader';
const ALL_PERMISSIONS = [
  { id: 'markAttendance', label: 'Mark Attendance', category: 'General' },
  { id: 'manualAttendance', label: 'Manual Attendance', category: 'General' },
  { id: 'viewAttendance', label: 'View Attendance', category: 'General' },
  { id: 'editAttendance', label: 'Edit Attendance', category: 'Security' },
  { id: 'deleteAttendance', label: 'Delete Attendance', category: 'Security' },
  { id: 'exportAttendance', label: 'Export Data', category: 'General' },
  { id: 'bypassTimeRestraint', label: 'Bypass Time Limits', category: 'Security' },
  { id: 'applyLeave', label: 'Apply Leave', category: 'General' },
  { id: 'viewReports', label: 'View Reports', category: 'General' },
  { id: 'manageStudents', label: 'Manage Students', category: 'Management' },
  { id: 'manageSystem', label: 'Manage System', category: 'Management' }
];

export default function Permissions() {
  const { setIsSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'bulk'

  // Individual State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [individualPerms, setIndividualPerms] = useState([]);
  const [searching, setSearching] = useState(false);

  // Bulk State
  const [departments, setDepartments] = useState([]);
  const [bulkConfig, setBulkConfig] = useState({ department: '', role: 'teacher', permissions: [] });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const [students, teachers, parents] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/teachers'),
        api.get('/admin/parents')
      ]);

      const combined = [...students.data, ...teachers.data, ...parents.data].filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(combined);
    } catch (err) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setIndividualPerms(user.permissions || []);
  };

  const togglePermission = (permId, isBulk = false) => {
    if (isBulk) {
      setBulkConfig(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permId)
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      }));
    } else {
      setIndividualPerms(prev =>
        prev.includes(permId)
          ? prev.filter(p => p !== permId)
          : [...prev, permId]
      );
    }
  };

  const saveIndividualPermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.put(`/admin/user/${selectedUser._id}/permissions`, { permissions: individualPerms });
      Alert.alert('Success', `Permissions updated for ${selectedUser.name}`);
      setSearchResults(prev => prev.map(u => u._id === selectedUser._id ? { ...u, permissions: individualPerms } : u));
    } catch (err) {
      Alert.alert('Error', 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const applyBulkPermissions = async () => {
    if (!bulkConfig.role) return;
    setSaving(true);
    try {
      await api.post('/admin/assign-permissions', bulkConfig);
      Alert.alert('Success', 'Bulk permissions applied successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to apply bulk permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        
        <AdminHeader title="Access Control" />

        {/* Tabs */}
        <View className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex-row">
          <TouchableOpacity 
            onPress={() => { setActiveTab('individual'); setSelectedUser(null); }}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl mr-2 ${activeTab === 'individual' ? 'bg-indigo-600' : 'bg-slate-50 dark:bg-slate-900/50'}`}
          >
            <User size={16} color={activeTab === 'individual' ? 'white' : '#64748B'} />
            <Text className={`ml-2 text-sm font-bold ${activeTab === 'individual' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Individual</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('bulk')}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ml-2 ${activeTab === 'bulk' ? 'bg-indigo-600' : 'bg-slate-50 dark:bg-slate-900/50'}`}
          >
            <Layers size={16} color={activeTab === 'bulk' ? 'white' : '#64748B'} />
            <Text className={`ml-2 text-sm font-bold ${activeTab === 'bulk' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Bulk Update</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          
          {activeTab === 'individual' ? (
            <View className="space-y-6 pb-10">
              
              {/* Search User */}
              <View className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700">
                <Text className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">Search User</Text>
                <View className="flex-row bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 items-center">
                  <Search size={18} color="#94A3B8" />
                  <TextInput 
                    className="flex-1 ml-3 text-slate-800 dark:text-slate-100"
                    placeholder="Name or Email..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                  />
                  <TouchableOpacity onPress={handleSearch} className="bg-indigo-600 px-3 py-1.5 rounded-xl">
                    <Text className="text-white font-bold text-xs">Search</Text>
                  </TouchableOpacity>
                </View>

                {searching ? (
                  <View className="py-6 items-center"><ActivityIndicator color="#4F46E5" /></View>
                ) : searchResults.length > 0 ? (
                  <ScrollView style={{ maxHeight: 200 }} className="mt-4 border-t border-slate-100 dark:border-slate-700" nestedScrollEnabled>
                    {searchResults.map(u => (
                      <TouchableOpacity 
                        key={u._id} 
                        onPress={() => selectUser(u)}
                        className={`p-3 rounded-xl mb-2 border ${selectedUser?._id === u._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                      >
                        <Text className={`font-bold ${selectedUser?._id === u._id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>{u.name}</Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 uppercase">{u.role} | {u.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : searchQuery ? (
                  <Text className="text-center text-slate-400 dark:text-slate-500 py-4 mt-2">No users found</Text>
                ) : null}
              </View>

              {/* Permissions Editor */}
              {selectedUser && (
                <View className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700">
                  <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedUser.name}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={saveIndividualPermissions}
                      disabled={saving}
                      className="bg-indigo-600 px-4 py-2 rounded-xl flex-row items-center shadow-sm"
                    >
                      {saving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold text-sm">Save</Text>}
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap justify-between">
                    {ALL_PERMISSIONS.map(perm => {
                      const isSelected = individualPerms.includes(perm.id);
                      return (
                        <TouchableOpacity 
                          key={perm.id} 
                          onPress={() => togglePermission(perm.id)}
                          className={`w-[48%] p-3 rounded-xl border mb-3 flex-row items-center ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}
                        >
                          <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                          </View>
                          <View className="flex-1">
                            <Text className={`text-xs font-bold ${isSelected ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`} numberOfLines={1}>{perm.label}</Text>
                            <Text className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">{perm.category}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

            </View>
          ) : (
            <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">Bulk Role Configuration</Text>

              <View className="space-y-5">
                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">TARGET DEPARTMENT</Text>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity 
                      onPress={() => setBulkConfig({...bulkConfig, department: ''})} 
                      className={`mr-2 px-4 py-2.5 rounded-xl border ${!bulkConfig.department ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                    >
                      <Text className={!bulkConfig.department ? 'text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>All Departments</Text>
                    </TouchableOpacity>
                    {departments.map(d => (
                      <TouchableOpacity 
                        key={d._id} 
                        onPress={() => setBulkConfig({...bulkConfig, department: d._id})} 
                        className={`mr-2 px-4 py-2.5 rounded-xl border ${bulkConfig.department === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={bulkConfig.department === d._id ? 'text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{d.departmentName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">TARGET ROLE</Text>
                  <View className="flex-row">
                    {['teacher', 'student', 'parent'].map(role => (
                      <TouchableOpacity 
                        key={role} 
                        onPress={() => setBulkConfig({...bulkConfig, role})} 
                        className={`mr-2 px-4 py-2.5 rounded-xl border ${bulkConfig.role === role ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        <Text className={`capitalize font-bold ${bulkConfig.role === role ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mt-4 border-t border-slate-100 dark:border-slate-700">
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4">ASSIGN PERMISSIONS</Text>
                  <View className="flex-row flex-wrap justify-between">
                    {ALL_PERMISSIONS.map(perm => {
                      const isSelected = bulkConfig.permissions.includes(perm.id);
                      return (
                        <TouchableOpacity 
                          key={perm.id} 
                          onPress={() => togglePermission(perm.id, true)}
                          className={`w-[48%] p-3 rounded-xl border mb-3 flex-row items-center ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}
                        >
                          <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                          </View>
                          <Text className={`flex-1 text-xs font-bold ${isSelected ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`} numberOfLines={2}>{perm.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={applyBulkPermissions} 
                  disabled={saving}
                  className="bg-indigo-600 rounded-xl py-4 items-center mt-2 shadow-sm flex-row justify-center"
                >
                  {saving ? <ActivityIndicator color="white" /> : (
                    <>
                      <Layers size={18} color="white" />
                      <Text className="text-white font-bold text-base ml-2">Apply Bulk Update</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                  Warning: This overwrites existing permissions for all selected users.
                </Text>

              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
