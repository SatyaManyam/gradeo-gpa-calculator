// components/CourseContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CourseContext = createContext();

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);

  // Load courses and backfill missing IDs
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const stored = await AsyncStorage.getItem('courses');
        if (!stored) return;

        const parsed = JSON.parse(stored);
        const withIds = parsed.map(c => (c?.id ? c : { ...c, id: newId() }));

        setCourses(withIds);

        // If we added any IDs, persist the normalized array
        const changed = withIds.some((c, i) => c.id !== parsed[i]?.id);
        if (changed) {
          await AsyncStorage.setItem('courses', JSON.stringify(withIds));
        }
      } catch (e) {
        console.error('Failed to load courses:', e);
      }
    };
    loadCourses();
  }, []);

  // Persist on any change
  useEffect(() => {
    const saveCourses = async () => {
      try {
        await AsyncStorage.setItem('courses', JSON.stringify(courses));
      } catch (e) {
        console.error('Failed to save courses:', e);
      }
    };
    if (courses) saveCourses();
  }, [courses]);

  return (
    <CourseContext.Provider value={{ courses, setCourses }}>
      {children}
    </CourseContext.Provider>
  );
};
