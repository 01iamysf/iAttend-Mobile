import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Modal, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { useSidebar } from './_layout';
import api from '../../services/api';
import { Users, Plus, FileText, Upload, Download, Trash2, CheckCircle, AlertCircle, X, Mail, Book, Building, Shield, Settings, Calendar, User, Check, ArrowLeft, RefreshCw, Key } from 'lucide-react-native';
import AdminHeader from '../../components/admin/AdminHeader';

const ALL_SYSTEM_PERMISSIONS = [
  { id: 'markAttendance', label: 'Mark Attendance', desc: 'Can mark attendance for classes' },
  { id: 'manualAttendance', label: 'Manual Attendance', desc: 'Can manually overwrite attendance' },
  { id: 'viewAttendance', label: 'View Attendance', desc: 'Can view attendance reports' },
  { id: 'editAttendance', label: 'Edit Attendance', desc: 'Can modify attendance records' },
  { id: 'deleteAttendance', label: 'Delete Attendance', desc: 'Can remove attendance records' },
  { id: 'exportAttendance', label: 'Export Data', desc: 'Can download attendance reports' },
  { id: 'bypassTimeRestraint', label: 'Bypass Time Limits', desc: 'Can mark attendance outside scheduled hours' },
  { id: 'applyLeave', label: 'Apply Leave', desc: 'Can request leave of absence' },
  { id: 'viewReports', label: 'View Reports', desc: 'Access to high-level analytics' },
  { id: 'manageStudents', label: 'Manage Students', desc: 'Add or modify student records' },
  { id: 'manageSystem', label: 'Manage System', desc: 'Access to system-wide configurations' }
];

export default function UserManage() {
  const { setIsSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'teachers', 'parents', 'manual', 'csv'
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);

  const [filterDept, setFilterDept] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Detail Modal States
  const [activeProfileTab, setActiveProfileTab] = useState('profile'); // 'profile', 'permissions', 'subjects'
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);
  const [allocatedSubjects, setAllocatedSubjects] = useState([]);
  const [updatingDetails, setUpdatingDetails] = useState(false);

  // Edit Mode Profile State
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    classId: '',
    section: '',
    rollNumber: '',
    parentEmail: ''
  });

  // Subjects / Schedule Assignment State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    subjectId: '',
    semester: '',
    year: '',
    classId: '',
    timeSlot: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    roomNumber: ''
  });
  const [editingAllocation, setEditingAllocation] = useState(null);

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

  const fetchUserDetails = async (userId) => {
    setFetchingDetails(true);
    try {
      const res = await api.get(`/admin/user/${userId}`);
      setProfileDetails(res.data.profile);
      setAllocatedSubjects(res.data.subjects || []);
      
      const prof = res.data.profile || {};
      setEditForm({
        name: prof.name || '',
        email: prof.email || '',
        password: '',
        departmentId: prof.departmentId?._id || prof.departmentId || '',
        classId: prof.classId?._id || prof.classId || '',
        section: prof.section || '',
        rollNumber: prof.rollNumber || '',
        parentEmail: prof.parentEmail || ''
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch user details');
    } finally {
      setFetchingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetails(selectedUser._id);
      setActiveProfileTab('profile');
      setEditMode(false);
    } else {
      setProfileDetails(null);
      setAllocatedSubjects([]);
    }
  }, [selectedUser]);

  const fetchData = async () => {
    try {
      const [deptRes, classRes, subRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/classes'),
        api.get('/admin/subjects').catch(() => ({ data: [] }))
      ]);
      setDepartments(deptRes.data);
      setClasses(classRes.data);
      setAllSubjects(subRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePermission = async (permissionId) => {
    if (updatingDetails || !profileDetails) return;
    setUpdatingDetails(true);
    try {
      const currentPerms = profileDetails.permissions || [];
      const newPerms = currentPerms.includes(permissionId)
        ? currentPerms.filter(p => p !== permissionId)
        : [...currentPerms, permissionId];

      const res = await api.put(`/admin/user/${selectedUser._id}/permissions`, { permissions: newPerms });
      setProfileDetails(prev => ({ ...prev, permissions: res.data.permissions }));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update permissions');
    } finally {
      setUpdatingDetails(false);
    }
  };

  const saveChanges = async () => {
    setUpdatingDetails(true);
    try {
      const updatePayload = {
        name: editForm.name,
        email: editForm.email,
        departmentId: editForm.departmentId || null,
        classId: editForm.classId || null,
        section: editForm.section,
        rollNumber: editForm.rollNumber,
        parentEmail: editForm.parentEmail || null
      };
      if (editForm.password) {
        updatePayload.password = editForm.password;
      }

      const res = await api.put(`/admin/update-user/${selectedUser._id}`, updatePayload);
      setProfileDetails(prev => ({ ...prev, ...res.data }));
      setEditMode(false);
      setEditForm(prev => ({ ...prev, password: '' }));
      Alert.alert('Success', 'User profile updated successfully');
      fetchUsers();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update user profile');
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleAssignSubject = async () => {
    if (!assignForm.subjectId) {
      return Alert.alert('Error', 'Please select a subject');
    }
    setUpdatingDetails(true);
    try {
      if (profileDetails.role === 'student') {
        if (editingAllocation) {
          const res = await api.put(`/admin/user/${selectedUser._id}/subjects/${assignForm.subjectId}`, {
            semester: assignForm.semester,
            year: assignForm.year
          });
          setProfileDetails(res.data);
        } else {
          const res = await api.post(`/admin/user/${selectedUser._id}/subjects`, {
            subjectId: assignForm.subjectId,
            semester: assignForm.semester,
            year: assignForm.year
          });
          setProfileDetails(res.data);
        }
      } else {
        const payload = {
          subjectId: assignForm.subjectId,
          teacherId: selectedUser._id,
          classId: assignForm.classId,
          timeSlot: assignForm.timeSlot,
          dayOfWeek: assignForm.dayOfWeek,
          startTime: assignForm.startTime,
          endTime: assignForm.endTime,
          roomNumber: assignForm.roomNumber
        };

        if (editingAllocation) {
          await api.put(`/admin/assign-subject/${editingAllocation._id}`, payload);
        } else {
          await api.post(`/admin/assign-subject`, payload);
        }

        const res = await api.get(`/admin/user/${selectedUser._id}`);
        setAllocatedSubjects(res.data.subjects || []);
      }
      setShowAssignModal(false);
      resetAssignForm();
      Alert.alert('Success', 'Subject allocated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to allocate subject');
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    Alert.alert(
      'Remove Subject',
      'Are you sure you want to remove this subject from the student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUpdatingDetails(true);
            try {
              const res = await api.delete(`/admin/user/${selectedUser._id}/subjects/${subjectId}`);
              setProfileDetails(res.data);
              Alert.alert('Success', 'Subject removed successfully');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to remove subject');
            } finally {
              setUpdatingDetails(false);
            }
          }
        }
      ]
    );
  };

  const handleRemoveAllocation = async (allocationId) => {
    Alert.alert(
      'Remove Allocation',
      'Are you sure you want to remove this teaching allocation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUpdatingDetails(true);
            try {
              await api.delete(`/admin/assign-subject/${allocationId}`);
              const res = await api.get(`/admin/user/${selectedUser._id}`);
              setAllocatedSubjects(res.data.subjects || []);
              Alert.alert('Success', 'Teaching allocation removed successfully');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to remove allocation');
            } finally {
              setUpdatingDetails(false);
            }
          }
        }
      ]
    );
  };

  const resetAssignForm = () => {
    setAssignForm({
      subjectId: '',
      semester: '',
      year: '',
      classId: '',
      timeSlot: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      roomNumber: ''
    });
    setEditingAllocation(null);
  };

  const openEditAllocation = (allocation) => {
    setEditingAllocation(allocation);
    setAssignForm({
      subjectId: allocation.subjectId?._id || allocation.subjectId,
      classId: allocation.classId?._id || allocation.classId,
      timeSlot: allocation.timeSlot || '',
      dayOfWeek: allocation.dayOfWeek || '',
      startTime: allocation.startTime || '',
      endTime: allocation.endTime || '',
      roomNumber: allocation.roomNumber || '',
      semester: '',
      year: ''
    });
    setShowAssignModal(true);
  };

  const openEditEnrolledSubject = (enrollment) => {
    setEditingAllocation(enrollment);
    setAssignForm({
      subjectId: enrollment.subject?._id || enrollment.subject || '',
      semester: enrollment.semester || '',
      year: enrollment.year || '',
      classId: '',
      timeSlot: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      roomNumber: ''
    });
    setShowAssignModal(true);
  };

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
            <View className="bg-white dark:bg-slate-900 rounded-t-[24px] p-6 h-[85%]">
              
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">User Management Actions</Text>
                <TouchableOpacity onPress={() => setSelectedUser(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {fetchingDetails ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="text-slate-500 dark:text-slate-400 mt-4">Fetching detailed profile...</Text>
                </View>
              ) : profileDetails ? (
                <View className="flex-1">
                  
                  {/* Basic Info Header */}
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full items-center justify-center mb-2">
                      <Text className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {profileDetails.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-base font-bold text-slate-800 dark:text-slate-100">{profileDetails.name}</Text>
                    <Text className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{profileDetails.role}</Text>
                  </View>

                  {/* Tabs */}
                  <View className="flex-row border-b border-slate-100 dark:border-slate-800 mb-4">
                    {[
                      { id: 'profile', label: 'Profile', icon: User },
                      { id: 'permissions', label: 'Permissions', icon: Shield },
                      ...(profileDetails.role === 'student' || profileDetails.role === 'teacher' ? [{ id: 'subjects', label: 'Subjects', icon: Book }] : [])
                    ].map(tab => {
                      const isActive = activeProfileTab === tab.id;
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          onPress={() => { setActiveProfileTab(tab.id); setEditMode(false); }}
                          className={`flex-1 flex-row justify-center items-center py-2.5 border-b-2 ${isActive ? 'border-indigo-600' : 'border-transparent'}`}
                        >
                          <tab.icon size={14} color={isActive ? '#4F46E5' : '#64748B'} />
                          <Text className={`ml-2 text-xs font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{tab.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Tab Contents */}
                  <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    
                    {/* --- PROFILE TAB --- */}
                    {activeProfileTab === 'profile' && (
                      <View className="space-y-4">
                        {!editMode ? (
                          <View className="space-y-3">
                            <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                              <Text className="text-[10px] font-bold text-slate-400 uppercase">Email Address</Text>
                              <Text className="text-sm text-slate-800 dark:text-slate-100 mt-1">{profileDetails.email}</Text>
                            </View>

                            <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                              <Text className="text-[10px] font-bold text-slate-400 uppercase">Department</Text>
                              <Text className="text-sm text-slate-800 dark:text-slate-100 mt-1">
                                {profileDetails.departmentId?.departmentName || 'Not Assigned'}
                              </Text>
                            </View>

                            {profileDetails.role === 'student' && (
                              <>
                                <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Class</Text>
                                  <Text className="text-sm text-slate-800 dark:text-slate-100 mt-1">
                                    {profileDetails.classId?.className || 'Not Assigned'}
                                  </Text>
                                </View>

                                <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Roll Number</Text>
                                  <Text className="text-sm text-slate-800 dark:text-slate-100 mt-1">
                                    {profileDetails.rollNumber || 'N/A'}
                                  </Text>
                                </View>

                                <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Parent Email</Text>
                                  <Text className="text-sm text-slate-800 dark:text-slate-100 mt-1">
                                    {profileDetails.parentEmail || 'N/A'}
                                  </Text>
                                </View>
                              </>
                            )}

                            <TouchableOpacity
                              onPress={() => setEditMode(true)}
                              className="bg-indigo-600 rounded-xl py-3 items-center mt-4 shadow-sm"
                            >
                              <Text className="text-white font-bold text-sm">Edit Profile Details</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View className="space-y-3 pb-6">
                            <Text className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">Edit User Profile</Text>

                            <View>
                              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Full Name</Text>
                              <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm" value={editForm.name} onChangeText={t => setEditForm({...editForm, name: t})} />
                            </View>

                            <View>
                              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Email</Text>
                              <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm" value={editForm.email} onChangeText={t => setEditForm({...editForm, email: t})} />
                            </View>

                            <View>
                              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Temporary Password (leave blank if unchanged)</Text>
                              <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm" secureTextEntry value={editForm.password} onChangeText={t => setEditForm({...editForm, password: t})} />
                            </View>

                            {profileDetails.role !== 'parent' && (
                              <View>
                                <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Department</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                                  {departments.map(d => (
                                    <TouchableOpacity key={d._id} onPress={() => setEditForm({...editForm, departmentId: d._id, classId: ''})} className={`mr-2 px-3 py-1.5 rounded-lg border ${editForm.departmentId === d._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                      <Text className={`text-xs ${editForm.departmentId === d._id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{d.departmentName}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}

                            {profileDetails.role === 'student' && (
                              <>
                                <View>
                                  <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Class</Text>
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                                    {classes.filter(c => c.departmentId?._id === editForm.departmentId || c.departmentId === editForm.departmentId).map(c => (
                                      <TouchableOpacity key={c._id} onPress={() => setEditForm({...editForm, classId: c._id})} className={`mr-2 px-3 py-1.5 rounded-lg border ${editForm.classId === c._id ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                        <Text className={`text-xs ${editForm.classId === c._id ? 'text-pink-600 dark:text-pink-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{c.className}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                </View>

                                <View>
                                  <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Roll Number</Text>
                                  <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm" value={editForm.rollNumber} onChangeText={t => setEditForm({...editForm, rollNumber: t})} />
                                </View>

                                <View>
                                  <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Parent Email</Text>
                                  <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-sm" keyboardType="email-address" value={editForm.parentEmail} onChangeText={t => setEditForm({...editForm, parentEmail: t})} />
                                </View>
                              </>
                            )}

                            <View className="flex-row space-x-2 pt-2">
                              <TouchableOpacity onPress={() => setEditMode(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center">
                                <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={saveChanges} disabled={updatingDetails} className="flex-1 bg-indigo-600 py-3 rounded-xl items-center">
                                <Text className="text-white font-bold text-sm">{updatingDetails ? 'Saving...' : 'Save'}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* --- PERMISSIONS TAB --- */}
                    {activeProfileTab === 'permissions' && (
                      <View className="space-y-4 pb-6">
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2">Enable or disable fine-grained system access capabilities for this user profile.</Text>
                        {ALL_SYSTEM_PERMISSIONS.map(perm => {
                          const isEnabled = profileDetails.permissions?.includes(perm.id);
                          return (
                            <View key={perm.id} className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-2">
                              <View className="flex-1 pr-4">
                                <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">{perm.label}</Text>
                                <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{perm.desc}</Text>
                              </View>
                              <Switch
                                value={isEnabled}
                                onValueChange={() => togglePermission(perm.id)}
                                disabled={updatingDetails}
                                trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                                thumbColor={isEnabled ? '#4F46E5' : '#F1F5F9'}
                              />
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* --- SUBJECTS TAB --- */}
                    {activeProfileTab === 'subjects' && (
                      <View className="space-y-4 pb-6">
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {profileDetails.role === 'student' ? 'Enrolled Subjects' : 'Teaching Schedule'}
                          </Text>
                          <TouchableOpacity
                            onPress={() => { resetAssignForm(); setShowAssignModal(true); }}
                            className="bg-indigo-600 px-3 py-1.5 rounded-lg"
                          >
                            <Text className="text-white text-xs font-bold">
                              {profileDetails.role === 'student' ? '+ Enroll Subject' : '+ Assign Schedule'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Student Subject List */}
                        {profileDetails.role === 'student' && (
                          <View className="space-y-2">
                            {profileDetails.enrolledSubjects?.length > 0 ? (
                              profileDetails.enrolledSubjects.map(es => {
                                const subId = es.subject?._id || es.subject;
                                const subName = es.subject?.subjectName || allSubjects.find(s => s._id === subId)?.subjectName || 'Unknown Subject';
                                return (
                                  <View key={subId} className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 flex-row justify-between items-center mb-2">
                                    <View className="flex-1 pr-3">
                                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">{subName}</Text>
                                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sem: {es.semester || 'N/A'} • Year: {es.year || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row space-x-2">
                                      <TouchableOpacity onPress={() => openEditEnrolledSubject(es)} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                        <Settings size={14} color="#64748B" />
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => handleRemoveSubject(subId)} className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                        <X size={14} color="#EF4444" />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                );
                              })
                            ) : (
                              <Text className="text-xs text-slate-400 text-center py-6">No subjects enrolled yet.</Text>
                            )}
                          </View>
                        )}

                        {/* Teacher Allocations List */}
                        {profileDetails.role === 'teacher' && (
                          <View className="space-y-2">
                            {allocatedSubjects.length > 0 ? (
                              allocatedSubjects.map(alloc => (
                                <View key={alloc._id} className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 flex-row justify-between items-center mb-2">
                                  <View className="flex-1 pr-3">
                                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                      {alloc.subjectId?.subjectName || 'Unknown Subject'}
                                    </Text>
                                    <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      Class: {alloc.classId?.className || 'N/A'} • Room: {alloc.roomNumber || 'N/A'}
                                    </Text>
                                    <Text className="text-[10px] text-indigo-500 mt-0.5 font-semibold">
                                      {alloc.dayOfWeek} • {alloc.startTime} - {alloc.endTime} ({alloc.timeSlot})
                                    </Text>
                                  </View>
                                  <View className="flex-row space-x-2">
                                    <TouchableOpacity onPress={() => openEditAllocation(alloc)} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                      <Settings size={14} color="#64748B" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleRemoveAllocation(alloc._id)} className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                      <X size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ))
                            ) : (
                              <Text className="text-xs text-slate-400 text-center py-6">No timetable assignments allocated yet.</Text>
                            )}
                          </View>
                        )}

                      </View>
                    )}

                  </ScrollView>

                </View>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-slate-500">Failed to load profile details.</Text>
                </View>
              )}

            </View>
          </View>
        </Modal>

        {/* --- SUBJECT / TIMETABLE ACTION MODAL (INNER MODAL) --- */}
        <Modal visible={showAssignModal} animationType="fade" transparent>
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white dark:bg-slate-900 w-full max-w-[340px] p-5 rounded-2xl shadow-lg">
              <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {editingAllocation ? 'Edit Assignment' : 'Assign Subject'}
                </Text>
                <TouchableOpacity onPress={() => { setShowAssignModal(false); resetAssignForm(); }}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView className="max-h-[350px] space-y-3 mb-4">
                
                {/* Subject Selector */}
                <View>
                  <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Subject</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                    {allSubjects.map(sub => (
                      <TouchableOpacity key={sub._id} onPress={() => setAssignForm({...assignForm, subjectId: sub._id})} className={`mr-2 px-3 py-1.5 rounded-lg border ${assignForm.subjectId === sub._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <Text className={`text-xs ${assignForm.subjectId === sub._id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{sub.subjectName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Student specific fields */}
                {profileDetails?.role === 'student' && (
                  <>
                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Semester</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" keyboardType="numeric" placeholder="e.g. 1" value={String(assignForm.semester || '')} onChangeText={t => setAssignForm({...assignForm, semester: t})} />
                    </View>
                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Year</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" keyboardType="numeric" placeholder="e.g. 2026" value={String(assignForm.year || '')} onChangeText={t => setAssignForm({...assignForm, year: t})} />
                    </View>
                  </>
                )}

                {/* Teacher specific fields */}
                {profileDetails?.role === 'teacher' && (
                  <>
                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Target Class</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                        {classes.map(cl => (
                          <TouchableOpacity key={cl._id} onPress={() => setAssignForm({...assignForm, classId: cl._id})} className={`mr-2 px-3 py-1.5 rounded-lg border ${assignForm.classId === cl._id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                            <Text className={`text-xs ${assignForm.classId === cl._id ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{cl.className}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    
                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Day of Week</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" placeholder="e.g. Monday" value={assignForm.dayOfWeek} onChangeText={t => setAssignForm({...assignForm, dayOfWeek: t})} />
                    </View>

                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Time Slot Description</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" placeholder="e.g. Morning 1" value={assignForm.timeSlot} onChangeText={t => setAssignForm({...assignForm, timeSlot: t})} />
                    </View>

                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Start Time</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" placeholder="e.g. 09:00 AM" value={assignForm.startTime} onChangeText={t => setAssignForm({...assignForm, startTime: t})} />
                    </View>

                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">End Time</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" placeholder="e.g. 10:30 AM" value={assignForm.endTime} onChangeText={t => setAssignForm({...assignForm, endTime: t})} />
                    </View>

                    <View>
                      <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Room Number</Text>
                      <TextInput className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-xs" placeholder="e.g. Lab 4" value={assignForm.roomNumber} onChangeText={t => setAssignForm({...assignForm, roomNumber: t})} />
                    </View>
                  </>
                )}

              </ScrollView>

              <TouchableOpacity
                onPress={handleAssignSubject}
                className="bg-indigo-600 py-3 rounded-xl items-center shadow-sm"
              >
                <Text className="text-white font-bold text-sm">Save Allocation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </View>
  );
}
