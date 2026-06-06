import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// 1. StatCard
export const StatCard = ({ title, value, icon: Icon, color }) => (
  <View className="bg-white dark:bg-slate-800 rounded-[24px] p-5 flex-1 min-w-[150px] shadow-sm border border-slate-100 dark:border-slate-700 mb-4 mx-2">
    <View className="flex-row justify-between items-start">
      <View>
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">{title}</Text>
        <Text className="text-slate-800 dark:text-slate-100 text-2xl font-black">{value}</Text>
      </View>
      <View style={{ backgroundColor: `${color}15` }} className="p-2.5 rounded-xl">
        <Icon size={20} color={color} strokeWidth={2.5} />
      </View>
    </View>
  </View>
);

// 2. AttendanceSnapshot SVG Circle
export const AttendanceSnapshot = ({ attendanceRate, activeData, activeTab }) => {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  
  // Reanimated props for strokeDashoffset
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = withTiming(
      circumference - (attendanceRate / 100) * circumference,
      { duration: 1500, easing: Easing.out(Easing.ease) }
    );
    return { strokeDashoffset };
  });

  return (
    <View className="flex-row items-center justify-between mt-4">
      {/* Circle Graph */}
      <View className="relative items-center justify-center w-[120px] h-[120px]">
        <Svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx="60"
            cy="60"
            r={radius}
            stroke="#4F46E5"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        <View className="absolute items-center justify-center">
          <Text className="text-xl font-black text-slate-800 dark:text-slate-100">{attendanceRate}%</Text>
        </View>
      </View>

      {/* Legend Stats */}
      <View className="flex-1 ml-6 space-y-3">
        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-slate-500 font-medium">Present</Text>
            <Text className="text-xs font-bold text-emerald-500">{activeData.present}</Text>
          </View>
          <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <View style={{ width: `${activeData.total > 0 ? (activeData.present / activeData.total) * 100 : 0}%` }} className="h-full bg-emerald-500 rounded-full" />
          </View>
        </View>

        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-slate-500 font-medium">Absent</Text>
            <Text className="text-xs font-bold text-red-500">
              {activeTab === 'students' ? activeData.absent : (activeData.total - activeData.present)}
            </Text>
          </View>
          <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <View style={{ width: `${activeData.total > 0 ? (((activeTab === 'students' ? activeData.absent : (activeData.total - activeData.present)) / activeData.total) * 100) : 0}%` }} className="h-full bg-red-500 rounded-full" />
          </View>
        </View>

        {activeTab === 'students' && (
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500 font-medium">On Leave</Text>
              <Text className="text-xs font-bold text-indigo-500">{activeData.leave}</Text>
            </View>
            <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <View style={{ width: `${activeData.total > 0 ? (activeData.leave / activeData.total) * 100 : 0}%` }} className="h-full bg-indigo-500 rounded-full" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// 3. Trend Bar Chart
export const TrendChart = ({ activeTrend, activeTab, teacherCount }) => {
  if (!activeTrend || activeTrend.length === 0) {
    return <Text className="text-center text-slate-400 text-sm mt-4">No trend data available yet.</Text>;
  }

  return (
    <View className="flex-row items-end justify-between h-[120px] mt-6">
      {activeTrend.map((day, idx) => {
        const dayTotal = activeTab === 'students' ? (day.present + day.absent + day.leave) : teacherCount;
        const rate = dayTotal > 0 ? (day.present / dayTotal) * 100 : 0;
        const date = new Date(day._id);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const isToday = idx === activeTrend.length - 1;

        return (
          <View key={day._id} className="items-center flex-1">
            <View className={`w-8 h-[90px] rounded-lg overflow-hidden justify-end ${isToday ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
              <View 
                style={{ height: `${rate}%` }} 
                className={`w-full rounded-md ${isToday ? 'bg-indigo-500' : 'bg-indigo-300'}`} 
              />
            </View>
            <Text className={`text-[10px] mt-2 ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'font-medium text-slate-400 dark:text-slate-500'}`}>
              {dayName}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// 4. Activity Log List Item
export const ActivityLogItem = ({ activity }) => {
  const isPresent = activity.status === 'present';
  const isAbsent = activity.status === 'absent';
  
  return (
    <View className={`flex-row items-center p-3 mb-3 bg-slate-50 dark:bg-slate-800/50 border-l-4 rounded-2xl ${isPresent ? 'border-emerald-500' : isAbsent ? 'border-red-500' : 'border-indigo-500'}`}>
      <View className="w-8 items-center">
        <ShieldCheck size={16} color="#94A3B8" />
      </View>
      <View className="flex-1 ml-2">
        <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {activity.studentId?.name} <Text className="font-normal text-slate-500 dark:text-slate-400">- {activity.subjectId?.subjectName}</Text>
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-xs text-slate-400">Marked as </Text>
          <Text className={`text-xs font-bold uppercase ${isPresent ? 'text-emerald-500' : isAbsent ? 'text-red-500' : 'text-indigo-500'}`}>
            {activity.status}
          </Text>
          <Text className="text-xs text-slate-400"> • {new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
          
          {activity.studentId?.departmentId?.departmentName && (
            <View className="ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
              <Text className="text-[9px] font-bold text-slate-500">{activity.studentId.departmentId.departmentName}</Text>
            </View>
          )}
        </View>
      </View>
      <ChevronRight size={16} color="#CBD5E1" />
    </View>
  );
};

// 5. Teacher Performance List Item
export const TeacherPerformanceItem = ({ teacher, isTopRank }) => {
  return (
    <View className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700/50 relative">
      {isTopRank && (
        <View className="absolute -top-3 right-4 bg-[#FFD700] px-2 py-1 rounded-md z-10 shadow-sm">
          <Text className="text-[10px] font-black text-slate-900">#1 Rank</Text>
        </View>
      )}
      
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center shadow-sm">
          <Text className="text-white text-lg font-bold">{teacher.name.charAt(0)}</Text>
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">{teacher.name}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{teacher.email}</Text>
            </View>
            <View className="bg-indigo-50 px-2 py-1 rounded">
              <Text className="text-[10px] font-bold text-indigo-600">{teacher.department || 'No Dept'}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center mt-3">
            <View className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-3">
              <View 
                style={{ width: `${Math.min((teacher.markingCount / 50) * 100, 100)}%` }} 
                className="h-full bg-indigo-500 rounded-full" 
              />
            </View>
            <Text className="text-xs font-black text-slate-800 dark:text-slate-100">{teacher.markingCount} marks</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
