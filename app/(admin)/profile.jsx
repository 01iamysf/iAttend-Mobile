import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Lock, CheckCircle, AlertCircle, Save, Edit2, X, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function AdminProfile() {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const insets = useSafeAreaInsets();
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: '',
  });

  const [universityEmail, setUniversityEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        api.get('/admin/profile'),
        api.get('/admin/settings')
      ]);

      setUser(profileRes.data);
      setProfileForm({
        name: profileRes.data.name,
        email: profileRes.data.email,
        password: '',
        confirmPassword: '',
        avatar: profileRes.data.avatar || '',
      });

      const emailSetting = settingsRes.data.find(s => s.key === 'universityEmail');
      if (emailSetting) setUniversityEmail(emailSetting.value);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    setSaving(true);
    try {
      const { data } = await api.put('/admin/profile', profileForm);
      setUser(data);
      setAuthUser(prev => ({ ...prev, name: data.name, email: data.email, avatar: data.avatar })); // Update context
      
      setProfileForm(prev => ({
        ...prev,
        name: data.name,
        email: data.email,
        avatar: data.avatar || '',
        password: '',
        confirmPassword: ''
      }));
      
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditMode(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSubmit = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        settings: [{ key: 'universityEmail', value: universityEmail }]
      });
      Alert.alert('Success', 'University settings updated');
      setIsEditMode(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    if (!isEditMode) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfileForm({
        ...profileForm,
        avatar: `data:image/jpeg;base64,${result.assets[0].base64}`
      });
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
      <View className="flex-1 bg-[#F5F7FF] dark:bg-slate-900">
        
        {/* Header */}
        <View className="z-10 bg-transparent" style={{ paddingTop: Math.max(insets.top + 8, 16), paddingHorizontal: 16, paddingBottom: 8 }}>
          <View className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-3 flex-row justify-between items-center">
          <View className="flex-row items-center flex-1 pr-3">
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(admin)')} className="mr-3 p-1">
              <ChevronLeft color="#94A3B8" size={24} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-100 flex-1" numberOfLines={1}>
              Admin Profile
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl flex-row items-center ${isEditMode ? 'bg-slate-100 dark:bg-slate-700' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}
          >
            {isEditMode ? (
              <>
                <X size={14} color="#64748B" />
                <Text className="text-slate-500 dark:text-slate-400 font-bold ml-1 text-xs">Cancel</Text>
              </>
            ) : (
              <>
                <Edit2 size={14} color="#4F46E5" />
                <Text className="text-indigo-600 dark:text-indigo-400 font-bold ml-1 text-xs">Edit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          
          {/* Cover & Avatar Header */}
          <View className="bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-6 overflow-hidden">
            {/* Cover Image mock */}
            <View className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <View className="px-6 pb-6 items-center -mt-10">
              <TouchableOpacity 
                onPress={pickImage}
                disabled={!isEditMode}
                className="w-24 h-24 rounded-[24px] bg-white dark:bg-slate-800 p-1 shadow-sm mb-3"
              >
                <View className="w-full h-full rounded-[20px] bg-slate-100 dark:bg-slate-700 overflow-hidden items-center justify-center border border-slate-100 dark:border-slate-700">
                  {profileForm.avatar ? (
                    <Image source={{ uri: profileForm.avatar }} className="w-full h-full" />
                  ) : (
                    <User size={32} color="#94A3B8" />
                  )}
                  {isEditMode && (
                    <View className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 items-center">
                      <Text className="text-white text-[10px] font-bold">EDIT</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              <Text className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.name}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">System Administrator</Text>
            </View>
          </View>

          {/* Profile Form */}
          <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
            <View className="flex-row items-center mb-6">
              <User size={18} color="#4F46E5" />
              <Text className="ml-2 text-base font-bold text-slate-800 dark:text-slate-100">Personal Information</Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Full Name</Text>
                <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-3 ${isEditMode ? 'border-indigo-200 dark:border-indigo-500/50 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 opacity-70'}`}>
                  <User size={16} color="#94A3B8" />
                  <TextInput
                    className="flex-1 ml-3 text-slate-800 dark:text-slate-100"
                    placeholderTextColor="#94A3B8"
                    value={profileForm.name}
                    onChangeText={t => setProfileForm({...profileForm, name: t})}
                    editable={isEditMode}
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Email Address</Text>
                <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-3 ${isEditMode ? 'border-indigo-200 dark:border-indigo-500/50 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 opacity-70'}`}>
                  <Mail size={16} color="#94A3B8" />
                  <TextInput
                    className="flex-1 ml-3 text-slate-800 dark:text-slate-100"
                    placeholderTextColor="#94A3B8"
                    value={profileForm.email}
                    onChangeText={t => setProfileForm({...profileForm, email: t})}
                    editable={isEditMode}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {isEditMode && (
                <>
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">New Password (Optional)</Text>
                    <View className="flex-row items-center bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/50 rounded-xl px-4 py-3">
                      <Lock size={16} color="#94A3B8" />
                      <TextInput
                        className="flex-1 ml-3 text-slate-800 dark:text-slate-100"
                        placeholderTextColor="#94A3B8"
                        value={profileForm.password}
                        onChangeText={t => setProfileForm({...profileForm, password: t})}
                        secureTextEntry
                        placeholder="Leave blank to keep current"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">Confirm Password</Text>
                    <View className="flex-row items-center bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/50 rounded-xl px-4 py-3">
                      <Lock size={16} color="#94A3B8" />
                      <TextInput
                        className="flex-1 ml-3 text-slate-800 dark:text-slate-100"
                        placeholderTextColor="#94A3B8"
                        value={profileForm.confirmPassword}
                        onChangeText={t => setProfileForm({...profileForm, confirmPassword: t})}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    onPress={handleProfileSubmit}
                    disabled={saving}
                    className="bg-indigo-600 rounded-xl py-3.5 mt-2 flex-row justify-center items-center shadow-sm"
                  >
                    {saving ? <ActivityIndicator color="white" size="small" /> : (
                      <>
                        <Save size={18} color="white" />
                        <Text className="text-white font-bold ml-2 text-base">Save Profile</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* System Settings */}
          <View className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 mb-10">
            <View className="flex-row items-center mb-2">
              <Mail size={18} color="#EC4899" />
              <Text className="ml-2 text-base font-bold text-slate-800 dark:text-slate-100">University Configuration</Text>
            </View>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              This email is used as the universal sender for all student and teacher system notifications.
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 ml-1">System Sender Email</Text>
                <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-3 ${isEditMode ? 'border-pink-200 dark:border-pink-500/50 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 opacity-70'}`}>
                  <Mail size={16} color="#94A3B8" />
                  <TextInput
                    className="flex-1 ml-3 text-slate-800 dark:text-slate-100"
                    placeholderTextColor="#94A3B8"
                    value={universityEmail}
                    onChangeText={setUniversityEmail}
                    editable={isEditMode}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {isEditMode && (
                <TouchableOpacity 
                  onPress={handleSettingsSubmit}
                  disabled={saving}
                  className="bg-pink-500 rounded-xl py-3.5 mt-2 flex-row justify-center items-center shadow-sm"
                >
                  {saving ? <ActivityIndicator color="white" size="small" /> : (
                    <>
                      <Save size={18} color="white" />
                      <Text className="text-white font-bold ml-2 text-base">Update Settings</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
