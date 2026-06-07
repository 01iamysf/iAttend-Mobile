import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentHeader from '../../components/student/StudentHeader';
import { Calendar, AlertCircle, UploadCloud, CheckCircle2, XCircle, Clock } from 'lucide-react-native';

export default function LeavePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [leaveData, setLeaveData] = useState({ leaveType: 'Casual', startDate: '', endDate: '', reason: '', document: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/leave/my-leaves');
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch leave history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLeaveData({ ...leaveData, document: result.assets[0] });
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const handleSubmit = async () => {
    if (!leaveData.startDate || !leaveData.endDate || !leaveData.reason) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // Basic date parsing validation YYYY-MM-DD
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    
    if (isNaN(start) || isNaN(end)) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD.');
      return;
    }
    if (end < start) {
      Alert.alert('Error', 'End date cannot be before start date.');
      return;
    }

    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (['Casual', 'Other'].includes(leaveData.leaveType) && diffDays > 3) {
      Alert.alert('Error', 'Casual leaves cannot exceed 3 days.');
      return;
    }

    if (leaveData.leaveType === 'Medical' && !leaveData.document) {
      Alert.alert('Error', 'Document upload is mandatory for Medical leave.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('leaveType', leaveData.leaveType);
    formData.append('startDate', leaveData.startDate);
    formData.append('endDate', leaveData.endDate);
    formData.append('reason', leaveData.reason);
    
    if (leaveData.document) {
      formData.append('document', {
        uri: leaveData.document.uri,
        name: leaveData.document.name,
        type: leaveData.document.mimeType || 'application/octet-stream'
      });
    }

    try {
      const { data } = await api.post('/leave/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Alert.alert('Success', data.message || 'Leave request submitted.');
      setLeaveData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '', document: null });
      fetchHistory();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === 'approved') return <CheckCircle2 size={16} color="#16A34A" />;
    if (status === 'pending') return <Clock size={16} color="#F59E0B" />;
    return <XCircle size={16} color="#DC2626" />;
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
      <StudentHeader title="Leave Requests" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }} 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        {/* Apply Leave Form */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Apply for Leave</Text>

          <View className="mb-4 flex-row space-x-2">
            {['Casual', 'Medical', 'Emergency'].map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setLeaveData({ ...leaveData, leaveType: type })}
                className={`px-3 py-2 rounded-full border ${leaveData.leaveType === type ? 'bg-indigo-50 border-indigo-500' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}
              >
                <Text className={`font-bold text-xs ${leaveData.leaveType === type ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'}`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Start Date</Text>
              <TextInput 
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={leaveData.startDate}
                onChangeText={t => setLeaveData({ ...leaveData, startDate: t })}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-medium"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">End Date</Text>
              <TextInput 
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={leaveData.endDate}
                onChangeText={t => setLeaveData({ ...leaveData, endDate: t })}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-medium"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Reason</Text>
            <TextInput 
              placeholder="State your reason..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={leaveData.reason}
              onChangeText={t => setLeaveData({ ...leaveData, reason: t })}
              style={{ textAlignVertical: 'top' }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 font-medium"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest flex-row items-center">
              Supporting Document {leaveData.leaveType === 'Medical' && <Text className="text-red-500">*</Text>}
            </Text>
            <TouchableOpacity 
              onPress={handleDocumentPick}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 items-center justify-center bg-slate-50 dark:bg-slate-900/50"
            >
              <UploadCloud size={24} color={leaveData.document ? '#4F46E5' : '#94A3B8'} />
              <Text className={`mt-2 font-medium ${leaveData.document ? 'text-indigo-600' : 'text-slate-500'}`}>
                {leaveData.document ? leaveData.document.name : 'Upload PDF/JPG (Max 5MB)'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={submitting}
            className={`py-4 rounded-xl items-center justify-center ${submitting ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Submit Request</Text>}
          </TouchableOpacity>
        </View>

        {/* Leave History */}
        <View className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <View className="flex-row items-center mb-4">
            <Calendar size={18} color="#4F46E5" />
            <Text className="text-lg font-black text-slate-800 dark:text-slate-100 ml-2">History</Text>
          </View>

          {history.length > 0 ? (
            <View className="space-y-4">
              {history.map((item, index) => {
                const s = new Date(item.startDate).toLocaleDateString('default', { day: 'numeric', month: 'short' });
                const e = new Date(item.endDate).toLocaleDateString('default', { day: 'numeric', month: 'short' });
                return (
                  <View key={item._id || index} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="font-bold text-slate-800 dark:text-slate-100 text-base">{s} - {e}</Text>
                        <Text className="text-xs text-indigo-500 font-bold uppercase mt-1">{item.leaveType} Leave</Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full flex-row items-center ${item.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' : item.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <StatusIcon status={item.status} />
                        <Text className={`ml-1 text-xs font-bold capitalize ${item.status === 'approved' ? 'text-green-700 dark:text-green-400' : item.status === 'pending' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-slate-600 dark:text-slate-400 mt-2">{item.reason}</Text>
                    
                    {item.status === 'revoked' && (
                      <View className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex-row items-start">
                        <AlertCircle size={14} color="#DC2626" className="mt-0.5" />
                        <Text className="text-xs text-red-600 dark:text-red-400 ml-2 flex-1"><Text className="font-bold">Revocation Reason: </Text>{item.revocationReason}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="py-6 items-center justify-center opacity-60 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <Text className="text-slate-500 dark:text-slate-400 font-medium">No leave history found.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
