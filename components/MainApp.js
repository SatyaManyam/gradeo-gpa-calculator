// components/MainApp.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import CoursesScreen from './CoursesScreen';
import GpaCalculatorScreen from './GpaCalculatorScreen';
import PreviousClassesScreen from './PreviousClassesScreen';
import BoosterPlannerScreen from './BoosterPlannerScreen';

const Drawer = createDrawerNavigator();

function BrandedDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      {/* Drawer brand header */}
      <LinearGradient
        colors={['#0E7A3E', '#1EA75A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.drawerHeader}
      >
        <Text style={styles.brandTitle}>
          <Text style={{ color: '#E8F5E9', fontWeight: '800' }}>UTD </Text>
          <Text style={{ color: '#FFD54F', fontWeight: '800' }}>GPA </Text>
          <Text style={{ color: '#E8F5E9', fontWeight: '800' }}>Booster</Text>
        </Text>
        <Text style={styles.brandSub}>Navigate your toolkit</Text>
      </LinearGradient>

      <View style={{ paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainApp() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <BrandedDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: '#F6F8FA' },
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: 280,
        },
        drawerActiveTintColor: '#0E7A3E',
        drawerInactiveTintColor: '#455A64',
        drawerActiveBackgroundColor: '#E8F5E9',
        drawerLabelStyle: { fontWeight: '700' },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          drawerLabel: 'Courses',
          drawerIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="GPA Calculator"
        component={GpaCalculatorScreen}
        options={{
          drawerLabel: 'GPA Calculator',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calculator-variant" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Previous Classes"
        component={PreviousClassesScreen}
        options={{
          drawerLabel: 'Previous Classes',
          drawerIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name = "Planner & Boosters"
        component={BoosterPlannerScreen}
        options={{
          drawerLabel: 'Planner & Boosters',
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="lightbulb-on-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    marginBottom: 6,
  },
  brandTitle: { fontSize: 22, letterSpacing: 0.3 },
  brandSub: { color: '#E8F5E9', opacity: 0.9, marginTop: 4 },
});
