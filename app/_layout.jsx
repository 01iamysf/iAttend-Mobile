import { Stack } from 'expo-router';
import '../global.css';
import { AuthProvider, useAuth } from '../context/AuthContext';
import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { loading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) {
      setAppReady(true);
      // Wait slightly to let underlying routes mount before easing out
      setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {}
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95, // slight scale down for "ease out" effect
            duration: 800,
            useNativeDriver: true,
          })
        ]).start(() => {
          setAnimationFinished(true);
        });
      }, 300);
    }
  }, [loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="(parent)" />
      </Stack>

      {!animationFinished && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
          pointerEvents={appReady ? "none" : "auto"}
        >
          <Image 
            source={require('../assets/images/logo.png')} 
            style={{ width: 160, height: 160 }} 
            resizeMode="contain" 
          />
        </Animated.View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
