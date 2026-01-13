// App.js
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import WelcomeScreen from './components/WelcomeScreen';
import SignUpScreen from './components/SignUpScreen';
import EducationScreen from './components/EducationScreen';
import ConfirmScreen from './components/ConfirmScreen';
import ClassDetailsScreen from './components/ClassDetailsScreen';
import MainApp from './components/MainApp';

// Context
import { CourseProvider } from './components/CourseContext';

const Stack = createNativeStackNavigator();

// App-wide theme to match the new UI
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0E7A3E',
    background: '#F6F8FA',
    card: '#FFFFFF',
    text: '#263238',
    border: '#DCE3EA',
    notification: '#1E88E5',
  },
};

export default function App() {
  return (
    <CourseProvider>
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F6F8FA' },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Education" component={EducationScreen} />
          <Stack.Screen name="Confirm" component={ConfirmScreen} />
          <Stack.Screen name="MainApp" component={MainApp} />
          <Stack.Screen name="ClassDetails" component={ClassDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CourseProvider>
  );
}
