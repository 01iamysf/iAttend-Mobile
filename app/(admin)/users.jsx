import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { useSidebar } from './_layout';
import api from '../../services/api';
import { Users, Plus, FileText, Upload, Download, Trash2, CheckCircle, AlertCircle, X, Mail, Book, Building } from 'lucide-react-native';
import AdminHeader from '../../components/admin/AdminHeader';

export default function UserManage() {
  const { setIsSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'teachers', 'parents', 'manual', 'csv'
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);

  const [filterDept, setFilterDept] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Manual Form
  const [manualForm, setManualForm] = useState({
    name: '', email: '', password: '', role: 'student', departmentId: '', classId: '', rollNumber: '', parentEmail: ''
  });

  // CSV
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'students') {
        const res = await api.get('/admin/students', { params: { classId: filterClass || undefined } });
        let data = res.data;
        if (filterDept && !filterClass) {
          data = data.filter(s => s.departmentId?._id === filterDept || s.departmentId === filterDept);
        }
        setStudents(data);
      } else if (activeTab === 'teachers') {
        const res = await api.get('/admin/teachers', { params: { departmentId: filterDept || undefined } });
        setTeachers(res.data);
      } else if (activeTab === 'parents') {
        const res = await api.get('/admin/parents');
        setParents(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (['students', 'teachers', 'parents'].includes(activeTab)) {
      fetchUsers();
    }
  }, [activeTab, filterDept, filterClass]);

  const handleDeleteUser = (user) => {
    Alert.alert(
      `Delete ${user.role}`,
      `Permanently delete "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/user/${user._id}`);
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleManualSubmit = async () => {
    if (!manualForm.name || !manualForm.email || !manualForm.password || !manualForm.role) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    try {
      const payload = { ...manualForm };
      if (!payload.departmentId) delete payload.departmentId;
      if (!payload.classId) delete payload.classId;
      if (!payload.rollNumber) delete payload.rollNumber;
      if (!payload.parentEmail) delete payload.parentEmail;

      await api.post('/admin/create-user', payload);
      Alert.alert('Success', `Created ${manualForm.role} successfully`);
      setManualForm({ name: '', email: '', password: '', role: 'student', departmentId: '', classId: '', rollNumber: '', parentEmail: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create user');
    }
  };

  const pickCsvDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCsvFile(file);
        
        // In RN, we need to fetch the local file URI content to pass to PapaParse
        const fileUri = file.uri;
        const fetchResponse = await fetch(fileUri);
        const textData = await fetchResponse.text();
        
        Papa.parse(textData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setCsvHeaders(results.meta.fields || []);
            setCsvPreview(results.data.slice(0, 3)); // show max 3 rows preview
          }
        });
        setUploadResult(null);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick CSV file');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return Alert.alert('Error', 'Please select a file first.');
    setUploading(true);
    setUploadResult(null);

    try {
      const fetchResponse = await fetch(csvFile.uri);
      const textData = await fetchResponse.text();
      
      Papa.parse(textData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const response = await api.post('/admin/create-users-bulk', { users: results.data });
            setUploadResult({ success: true, message: response.data.message });
            setCsvFile(null);
            setCsvPreview([]);
          } catch (err) {
            setUploadResult({ success: false, message: err.response?.data?.message || err.message });
          } finally {
            setUploading(false);
          }
        }
      });
    } catch (err) {
       setUploading(false);
       Alert.alert('Error', 'Failed to process file');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const filteredClasses = classes.filter(c => c.departmentId?._id === manualForm.departmentId || c.departmentId === manualForm.departmentId);

  return (
    <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
      
      <AdminHeader title="User Management" />

      {/* Tabs */}
      <View className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'students', label: 'Students', icon: Users },
            { id: 'teachers', label: 'Teachers', icon: Users },
            { id: 'parents', label: 'Parents', icon: Users },
            { id: 'manual', label: 'Manual Entry', icon: Plus },
            { id: 'csv', label: 'Bulk Upload', icon: FileText }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-row items-center px-4 py-2 mr-2 rounded-full ${isActive ? 'bg-indigo-600' : 'bg-slate-50 dark:bg-slate-700'}`}
              >
                <tab.icon size={14} color={isActive ? 'white' : '#64748B'} />
                <Text className={`ml-2 text-sm font-bold ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchUsers} tintColor="#4F46E5" />}
      >

        {/* LIST VIEWS (Students, Teachers, Parents) */}
        {['students', 'teachers', 'parents'].includes(activeTab) && (
          <View className="pb-10">
            {activeTab !== 'parents' && (
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-4">
                <TouchableOpacity onPress={() => setFilterDept('')} className={`mr-2 px-4 py-2 rounded-xl border ${!filterDept ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <Text className={!filterDept ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>All Depts</Text>
                </TouchableOpacity>
                {departments.map(d => (
                  <TouchableOpacity key={d._id} onPress={() => {setFilterDept(d._id); setFilterClass('');}} className={`mr-2 px-4 py-2 rounded-xl border ${filterDept === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <Text className={filterDept === d._id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>{d.departmentName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {activeTab === 'students' && filterDept ? (
               <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4">
                 <TouchableOpacity onPress={() => setFilterClass('')} className={`mr-2 px-4 py-2 rounded-xl border ${!filterClass ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                   <Text className={!filterClass ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>All Classes</Text>
                 </TouchableOpacity>
                 {classes.filter(c => c.departmentId?._id === filterDept || c.departmentId === filterDept).map(c => (
                   <TouchableOpacity key={c._id} onPress={() => setFilterClass(c._id)} className={`mr-2 px-4 py-2 rounded-xl border ${filterClass === c._id ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                     <Text className={filterClass === c._id ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>{c.className}</Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            ) : null}

            {/* List */}
            {(() => {
              const list = activeTab === 'students' ? students : activeTab === 'teachers' ? teachers : parents;
              if (list.length === 0) return <Text className="text-center text-slate-400 py-10">No users found.</Text>;
              
              return list.map(u => (
                <TouchableOpacity key={u._id} onPress={() => setSelectedUser(u)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-3 flex-row justify-between items-center">
                  <View className="flex-1 pr-4">
                    <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{u.name}</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</Text>
                    {u.rollNumber ? <Text className="text-[10px] font-bold text-indigo-500 mt-1 uppercase">Roll: {u.rollNumber}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteUser(u)} className="bg-red-50 dark:bg-red-900/20 p-2 rounded-full border border-red-100 dark:border-red-900/50">
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ));
            })()}
          </View>
        )}

        {/* MANUAL ENTRY */}
        {activeTab === 'manual' && (
          <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Create New User</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Role</Text>
                <View className="flex-row">
                  {['student', 'teacher', 'parent'].map(role => (
                    <TouchableOpacity key={role} onPress={() => setManualForm({...manualForm, role})} className={`mr-2 px-4 py-2 rounded-xl border ${manualForm.role === role ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                      <Text className={`capitalize font-bold ${manualForm.role === role ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Full Name</Text>
                <TextInput className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100" placeholderTextColor="#94A3B8" value={manualForm.name} onChangeText={t => setManualForm({...manualForm, name: t})} />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Email</Text>
                <TextInput className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100" placeholderTextColor="#94A3B8" keyboardType="email-address" value={manualForm.email} onChangeText={t => setManualForm({...manualForm, email: t})} />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Temporary Password</Text>
                <TextInput className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100" placeholderTextColor="#94A3B8" secureTextEntry value={manualForm.password} onChangeText={t => setManualForm({...manualForm, password: t})} />
              </View>

              {/* Department & Class visible if not parent */}
              {manualForm.role !== 'parent' && (
                <View>
                  <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Department</Text>
                  <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    {departments.map(d => (
                      <TouchableOpacity key={d._id} onPress={() => setManualForm({...manualForm, departmentId: d._id, classId: ''})} className={`mr-2 px-4 py-2 rounded-xl border ${manualForm.departmentId === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <Text className={manualForm.departmentId === d._id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>{d.departmentName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {manualForm.role === 'student' && (
                <>
                  {manualForm.departmentId ? (
                    <View>
                      <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Class</Text>
                      <ScrollView contentContainerStyle={{ paddingHorizontal: 0 }} horizontal showsHorizontalScrollIndicator={false} className="py-1">
                        {filteredClasses.map(c => (
                          <TouchableOpacity key={c._id} onPress={() => setManualForm({...manualForm, classId: c._id})} className={`mr-2 px-4 py-2 rounded-xl border ${manualForm.classId === c._id ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            <Text className={manualForm.classId === c._id ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-slate-600 dark:text-slate-300'}>{c.className}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Roll Number</Text>
                    <TextInput className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100" placeholderTextColor="#94A3B8" value={manualForm.rollNumber} onChangeText={t => setManualForm({...manualForm, rollNumber: t})} />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Parent Email</Text>
                    <TextInput className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100" placeholderTextColor="#94A3B8" keyboardType="email-address" value={manualForm.parentEmail} onChangeText={t => setManualForm({...manualForm, parentEmail: t})} />
                  </View>
                </>
              )}

              <TouchableOpacity onPress={handleManualSubmit} className="bg-indigo-600 rounded-xl py-4 items-center mt-6 shadow-sm">
                <Text className="text-white font-bold text-base">Create User</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* BULK UPLOAD CSV */}
        {activeTab === 'csv' && (
          <View className="mb-10">
            <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 items-center">
              <View className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Upload size={32} color="#4F46E5" />
              </View>
              <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Bulk Upload CSV</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">Select a .csv file containing multiple user records. Make sure it follows the required format.</Text>
              
              <View className="flex-row gap-4 w-full">
                <TouchableOpacity className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 flex-row justify-center items-center">
                  <Download size={16} color="#64748B" />
                  <Text className="text-slate-600 dark:text-slate-300 font-bold ml-2">Template</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickCsvDocument} className="flex-1 bg-indigo-600 rounded-xl py-3 flex-row justify-center items-center shadow-sm">
                  <FileText size={16} color="white" />
                  <Text className="text-white font-bold ml-2">Browse</Text>
                </TouchableOpacity>
              </View>
            </View>

            {csvFile && (
              <View className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mt-4 border border-indigo-100 dark:border-slate-700 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>{csvFile.name}</Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Ready to import</Text>
                </View>
                <TouchableOpacity onPress={handleCsvUpload} disabled={uploading} className={`px-4 py-2 rounded-xl ${uploading ? 'bg-indigo-400' : 'bg-indigo-600'}`}>
                  <Text className="text-white font-bold text-xs">{uploading ? 'Uploading...' : 'Process'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {uploadResult && (
              <View className={`mt-4 p-4 rounded-xl border ${uploadResult.success ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} flex-row items-center`}>
                {uploadResult.success ? <CheckCircle color="#10B981" /> : <AlertCircle color="#EF4444" />}
                <Text className={`ml-3 text-sm font-bold flex-1 ${uploadResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {uploadResult.message}
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

        {/* User Profile Modal */}
        <Modal visible={!!selectedUser} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/40 dark:bg-black/60">
            <View className="bg-white dark:bg-slate-900 rounded-t-[24px] p-6 pb-10">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">User Profile</Text>
                <TouchableOpacity onPress={() => setSelectedUser(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {selectedUser && (
                <View className="items-center mb-6">
                  <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-4">
                    <Text className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedUser.name}</Text>
                  <Text className="text-sm font-bold text-indigo-500 uppercase tracking-wider mt-1">{selectedUser.role}</Text>
                </View>
              )}

              {selectedUser && (
                <View className="space-y-4 pb-10">
                  <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Mail size={18} color="#64748B" />
                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</Text>
                      <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">{selectedUser.email}</Text>
                    </View>
                  </View>

                  {(selectedUser.department?.departmentName || selectedUser.departmentId?.departmentName) ? (
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <Building size={18} color="#64748B" />
                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Department</Text>
                        <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">
                          {selectedUser.department?.departmentName || selectedUser.departmentId?.departmentName}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedUser.class ? (
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <Book size={18} color="#64748B" />
                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Class</Text>
                        <Text className="text-sm text-slate-800 dark:text-slate-100 mt-0.5">
                          {selectedUser.class.className} - {selectedUser.class.section || 'General'}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedUser.rollNumber ? (
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <Users size={18} color="#64748B" />
                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Roll Number</Text>
                        <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedUser.rollNumber}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </Modal>

    </View>
  );
}
