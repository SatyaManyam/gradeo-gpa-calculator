import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const convertToLetterGrade = (average) => {
  const g = parseFloat(average);
  if (isNaN(g)) return 'N/A';
  if (g >= 97) return 'A+';
  if (g >= 93) return 'A';
  if (g >= 90) return 'A-';
  if (g >= 87) return 'B+';
  if (g >= 83) return 'B';
  if (g >= 80) return 'B-';
  if (g >= 77) return 'C+';
  if (g >= 73) return 'C';
  if (g >= 70) return 'C-';
  if (g >= 67) return 'D+';
  if (g >= 63) return 'D';
  if (g >= 60) return 'D-';
  return 'F';
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const colorForPercent = (avg) => {
  const g = parseFloat(avg);
  if (isNaN(g)) return '#EEF2F7';
  if (g >= 93) return '#E9F7EF';
  if (g >= 90) return '#F1F8E9';
  if (g >= 87) return '#FFFDE7';
  if (g >= 80) return '#FFF8E1';
  if (g >= 70) return '#FFF3E0';
  return '#FBE9E7';
};

export default function CoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadAndFixCourses = async () => {
        try {
          const data = await AsyncStorage.getItem('courses');
          if (!data) return;

          const parsed = JSON.parse(data);
          const withIds = parsed.map((c) => (c?.id ? c : { ...c, id: newId() }));
          const fixed = withIds.map((course) => ({
            ...course,
            grade: convertToLetterGrade(course.average),
            credits: Number.isFinite(Number(course.credits)) ? Number(course.credits) : 3,
          }));

          setCourses(fixed);
          await AsyncStorage.setItem('courses', JSON.stringify(fixed));
        } catch (err) {
          console.log('Error loading courses:', err);
        }
      };
      loadAndFixCourses();
    }, [])
  );

  useEffect(() => {
    const save = async () => {
      try { await AsyncStorage.setItem('courses', JSON.stringify(courses)); }
      catch (err) { console.log('Error saving courses:', err); }
    };
    if (courses) save();
  }, [courses]);

  const addCourse = () => {
    setCourses((prev) => [...prev, { id: newId(), name: '', average: '', grade: '', credits: 3 }]);
  };

  const deleteCourse = async (index) => {
    try {
      const target = courses[index];
      if (target?.id) await AsyncStorage.removeItem(`grades_${target.id}`);
      const updated = [...courses];
      updated.splice(index, 1);
      setCourses(updated);
      if (editingIndex === index) setEditingIndex(null);
    } catch (e) {
      console.log('Delete course error:', e);
    }
  };

  const updateCourseField = (index, key, value) => {
    const updated = [...courses];
    if (key === 'average') {
      updated[index].average = value;
      updated[index].grade = convertToLetterGrade(value);
    } else if (key === 'grade') {
      updated[index].grade = value.toUpperCase();
    } else if (key === 'credits') {
      updated[index].credits = parseFloat(value) || 0;
    } else {
      updated[index][key] = value;
    }
    setCourses(updated);
  };

  const renderCourse = ({ item, index }) => {
    const isEditing = editingIndex === index;
    return (
      <View style={[styles.card, { backgroundColor: colorForPercent(item.average) }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courseName}>{item.name || 'Untitled Course'}</Text>
            <Text style={styles.meta}>
              <Text style={{ fontWeight: '700' }}>Grade:</Text> {item.grade || 'N/A'}  •  <Text style={{ fontWeight: '700' }}>Avg:</Text> {item.average ? `${item.average}%` : 'N/A'}
            </Text>
            <View style={styles.chip}>
              <Ionicons name="time" size={12} color="#1B5E20" />
              <Text style={styles.chipText}>{item.credits || 3} hrs</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#1E88E5' }]} onPress={() => setEditingIndex(isEditing ? null : index)}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#E53935' }]} onPress={() => deleteCourse(index)}>
              <MaterialIcons name="delete" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.openBtn} onPress={() => navigation.navigate('ClassDetails', { courseId: item.id })}>
          <Text style={styles.openBtnText}>Open Grade Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#0D3B2E" />
        </TouchableOpacity>

        {isEditing && (
          <View style={{ marginTop: 10 }}>
            <TextInput style={styles.input} placeholder="Course Name" value={item.name} onChangeText={(t) => updateCourseField(index, 'name', t)} />
            <TextInput style={styles.input} placeholder="Letter Grade (optional)" value={item.grade} onChangeText={(t) => updateCourseField(index, 'grade', t)} />
            <TextInput style={styles.input} placeholder="Credit Hours" keyboardType="numeric" value={(item.credits ?? 3).toString()} onChangeText={(t) => updateCourseField(index, 'credits', t)} />
            <TouchableOpacity onPress={() => setEditingIndex(null)} style={styles.doneBtn}><Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const ListHeader = (
    <>
      <LinearGradient colors={['#0E7A3E', '#1EA75A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 6 }}>
            <Ionicons name="menu" size={22} color="#E8F5E9" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>
            <Text style={{ color: '#E8F5E9', fontWeight: '800' }}>UTD </Text>
            <Text style={{ color: '#FFD54F', fontWeight: '800' }}>Courses</Text>
          </Text>

          <View style={{ width: 22 }} />
        </View>
        <Text style={styles.heroSub}>Manage classes, credits, and drill into grade details.</Text>
      </LinearGradient>

      <Text style={styles.sectionHeader}>My Courses</Text>
    </>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={(item, i) => item?.id ?? String(i)}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
      <TouchableOpacity activeOpacity={0.9} onPress={addCourse} style={styles.fabWrap}>
        <LinearGradient colors={['#1565C0', '#1E88E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.fabText}>Add New Course</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },

  hero: { paddingVertical: 16, paddingHorizontal: 16, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 12 },
  heroTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  heroTitle: { fontSize: 24, letterSpacing: 0.3, color: '#E8F5E9' },
  heroSub: { color: '#E8F5E9', marginTop: 4, opacity: 0.9 },

  sectionHeader: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, fontWeight: '800', color: '#263238' },

  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  courseName: { fontSize: 16, fontWeight: '800', color: '#263238' },
  meta: { color: '#546E7A', marginTop: 2 },
  chip: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#E8F5E9', borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: '#1B5E20', fontWeight: '800', fontSize: 12 },

  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  openBtn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFFB3', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  openBtnText: { color: '#0D3B2E', fontWeight: '700' },

  input: { borderWidth: 1, borderColor: '#DCE3EA', borderRadius: 10, padding: 10, backgroundColor: '#FAFBFC', color: '#263238', marginTop: 8 },
  doneBtn: { marginTop: 10, backgroundColor: '#1E88E5', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },

  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 20 },
  fab: { borderRadius: 999, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  fabText: { color: '#fff', fontWeight: '800' }
});
