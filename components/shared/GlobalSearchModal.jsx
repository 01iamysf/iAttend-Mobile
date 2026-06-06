import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, ChevronRight, BookOpen, Users, Building2, LayoutGrid, CheckCircle } from 'lucide-react-native';
import api from '../../services/api';
import { useRouter } from 'expo-router';

export default function GlobalSearchModal({ visible, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Debounced live search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (val) => {
    setIsSearching(true);
    try {
      const { data } = await api.get(`/search?q=${val}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (path) => {
    onClose();
    setQuery('');
    setResults(null);
    router.push(path);
  };

  const getCategorizedData = () => {
    if (!results) return [];
    
    const sections = [];
    
    if (results.departments?.length > 0) {
      sections.push({ title: 'Departments', data: results.departments, type: 'department', icon: Building2 });
    }
    if (results.students?.length > 0) {
      sections.push({ title: 'Students', data: results.students, type: 'student', icon: Users });
    }
    if (results.teachers?.length > 0) {
      sections.push({ title: 'Teachers', data: results.teachers, type: 'teacher', icon: CheckCircle });
    }
    if (results.classes?.length > 0) {
      sections.push({ title: 'Classes', data: results.classes, type: 'class', icon: LayoutGrid });
    }
    if (results.subjects?.length > 0) {
      sections.push({ title: 'Subjects', data: results.subjects, type: 'subject', icon: BookOpen });
    }
    
    return sections;
  };

  const renderItem = ({ item, section }) => {
    let title, subtitle, extra;
    
    switch (section.type) {
      case 'department':
        title = item.departmentName;
        break;
      case 'student':
        title = item.name;
        subtitle = `${item.class?.className || 'N/A'}-${item.section || 'N/A'}`;
        extra = item.department?.departmentName;
        break;
      case 'teacher':
        title = item.name;
        subtitle = item.department?.departmentName || 'Faculty';
        break;
      case 'class':
        title = `${item.className} - ${item.section}`;
        subtitle = item.departmentId?.departmentName;
        break;
      case 'subject':
        title = item.subjectName;
        subtitle = item.departmentId?.departmentName;
        break;
    }

    const routeMap = {
      'department': '/(admin)/academic',
      'student': '/(admin)/users',
      'teacher': '/(admin)/users',
      'class': '/(admin)/academic',
      'subject': '/(admin)/subjects'
    };

    return (
      <TouchableOpacity 
        className="flex-row items-center py-3 border-b border-slate-50 dark:border-slate-700/50"
        onPress={() => handleResultClick(routeMap[section.type])}
      >
        <View className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 items-center justify-center mr-3">
          <section.icon size={16} color="#64748B" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm">{title}</Text>
          {subtitle && <Text className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</Text>}
        </View>
        <View className="items-end">
          {extra && <Text className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-1">{extra}</Text>}
          <ChevronRight size={16} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-1 bg-black/40">
          
          {/* Card exactly overlays the floating header */}
          <View style={{ paddingTop: Math.max(insets.top + 8, 16), paddingHorizontal: 16, paddingBottom: 8 }}>
            
            <View className="bg-white dark:bg-slate-800 rounded-[24px] shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden" style={{ maxHeight: '95%' }}>
              
              {/* Search Bar Input Row */}
              <View className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 mr-3 shadow-sm">
                  <Search size={18} color="#94A3B8" />
                  <TextInput
                    className="flex-1 ml-2 text-slate-800 dark:text-slate-100 text-base"
                    placeholder="Search..."
                    placeholderTextColor="#94A3B8"
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                    autoCapitalize="none"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <X size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90">
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Dynamic Results List */}
              <View className="px-4 pb-4">
                {isSearching ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text className="text-slate-400 mt-4 font-medium text-sm">Searching records...</Text>
                  </View>
                ) : results ? (
                  getCategorizedData().length > 0 ? (
                    <FlatList
                      data={getCategorizedData()}
                      keyExtractor={(item) => item.type}
                      renderItem={({ item: section }) => (
                        <View className="mb-4 mt-2">
                          <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                            {section.title}
                          </Text>
                          <View className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-4">
                            {section.data.map((item, index) => (
                              <View key={item._id || index}>
                                {renderItem({ item, section })}
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 20 }}
                      style={{ maxHeight: 450 }}
                    />
                  ) : (
                    <View className="py-8 items-center">
                      <Search size={32} color="#CBD5E1" opacity={0.5} />
                      <Text className="text-slate-400 mt-4 font-medium text-sm">No results found</Text>
                    </View>
                  )
                ) : (
                  <View className="py-8 items-center">
                    <Search size={32} color="#CBD5E1" opacity={0.5} />
                    <Text className="text-slate-400 mt-4 font-medium text-sm text-center px-4">
                      Type to search across departments, students, teachers, classes, and subjects.
                    </Text>
                  </View>
                )}
              </View>

            </View>
          </View>
          
          {/* Dimmed backdrop area (closes modal when tapped) */}
          <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
