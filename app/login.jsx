import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      // Navigate to correct dashboard based on role
      switch (result.role) {
        case 'admin':
          router.replace('/(admin)');
          break;
        case 'teacher':
          router.replace('/(teacher)');
          break;
        case 'student':
          router.replace('/(student)');
          break;
        case 'parent':
          router.replace('/(parent)');
          break;
        default:
          setError('Invalid role assignment');
          setLoading(false);
      }
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#F5F7FF] justify-center px-6"
    >
      <View className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 items-center w-full max-w-md self-center">
        
        {/* Icon & Header */}
        <View className="mb-8 items-center">
          <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4 shadow-sm border border-blue-100">
            <ShieldCheck color="#4F46E5" size={32} strokeWidth={2.5} />
          </View>
          <Text className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back!</Text>
          <Text className="text-slate-400 text-sm text-center px-4">
            Login to Student Attendance System
          </Text>
        </View>

        <View className="w-full space-y-4">
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
              <Text className="text-red-500 text-center text-sm font-medium">{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View className="relative mb-4">
            <View className="absolute left-4 top-[14px] z-10">
              <Mail color="#94A3B8" size={20} />
            </View>
            <TextInput
              className="w-full bg-[#F8FAFC] text-slate-800 rounded-xl py-[14px] pl-12 pr-4 border border-slate-100 focus:border-indigo-500 focus:bg-white font-medium"
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View className="relative mb-6">
            <View className="absolute left-4 top-[14px] z-10">
              <Lock color="#94A3B8" size={20} />
            </View>
            <TextInput
              className="w-full bg-[#F8FAFC] text-slate-800 rounded-xl py-[14px] pl-12 pr-12 border border-slate-100 focus:border-indigo-500 focus:bg-white font-medium"
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              className="absolute right-4 top-[14px] z-10"
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff color="#94A3B8" size={20} />
              ) : (
                <Eye color="#94A3B8" size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            className={`w-full py-4 rounded-xl items-center justify-center shadow-sm ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Login</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
