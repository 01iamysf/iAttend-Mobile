import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CleanCircle = React.forwardRef(({ collapsable, ...props }, ref) => (
  <Circle ref={ref} {...props} />
));
const AnimatedCircle = Animated.createAnimatedComponent(CleanCircle);

export default function AttendanceRing({ present, total }) {
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  
  const radius = 60;
  const stroke = 11;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1400,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Tiers
  let tier = 'warning';
  if (percentage >= 90) tier = 'excellent';
  else if (percentage >= 75) tier = 'good';

  const TIERS = {
    excellent: {
      color: '#16a34a',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      label: '✦ Excellent',
      icon: '🌟'
    },
    good: {
      color: '#f59e0b',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      label: '◈ Good',
      icon: '✅'
    },
    warning: {
      color: '#ef4444',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      label: '⚠ Warning',
      icon: '⚠️'
    }
  };

  const cfg = TIERS[tier];

  // Smart calculations
  const classesTo75 = total > 0 && percentage < 75 ? Math.ceil((0.75 * total - present) / 0.25) : 0;
  const classesTo90 = total > 0 && percentage < 90 ? Math.ceil((0.90 * total - present) / 0.10) : 0;

  const insights = (() => {
    if (tier === 'excellent') return [
      { icon: '🌟', text: 'Excellent Standing!', sub: 'Top-tier performance.' },
      { icon: '🎯', text: `${present} of ${total} attended`, sub: `Great buffer zone.` },
    ];
    if (tier === 'good') return [
      { icon: '✅', text: 'Good Standing', sub: 'Above 75% minimum.' },
      { icon: '📈', text: `${classesTo90} more to reach 90%`, sub: 'Aim higher for Excellent.' },
    ];
    return [
      { icon: '⚠️', text: `Need ${classesTo75} to reach 75%`, sub: 'Attend upcoming classes.' },
      { icon: '📉', text: 'Below safe threshold', sub: 'Risk of shortage.' },
    ];
  })();

  return (
    <View className={`w-full p-6 rounded-[24px] border items-center ${cfg.bg} ${cfg.border}`}>
      <Text className={`text-xs font-black uppercase tracking-widest mb-4 ${cfg.text}`}>Attendance Performance</Text>
      
      <View className="relative items-center justify-center mb-4">
        <Svg height={radius * 2} width={radius * 2} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            stroke="rgba(0,0,0,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <AnimatedCircle
            stroke={cfg.color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View className="absolute items-center justify-center">
          <Text style={{ color: cfg.color }} className="text-3xl font-black">{percentage}%</Text>
          <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">OVERALL</Text>
        </View>
      </View>

      <View className={`px-4 py-1.5 rounded-full border mb-6 bg-white dark:bg-slate-800 ${cfg.border}`}>
        <Text className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</Text>
      </View>

      <View className="w-full space-y-2">
        {insights.map((ins, i) => (
          <View key={i} className="flex-row items-start p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <Text className="text-base mr-3">{ins.icon}</Text>
            <View className="flex-1">
              <Text className={`text-sm font-bold ${cfg.text}`}>{ins.text}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ins.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
