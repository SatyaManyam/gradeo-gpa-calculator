// components/ClassDetailsScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const convertToLetterFromPercent = (average) => {
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

const colorForPercent = (p) => {
  const g = parseFloat(p);
  if (isNaN(g)) return '#EEF2F7';
  if (g >= 93) return '#E9F7EF';
  if (g >= 90) return '#F1F8E9';
  if (g >= 87) return '#FFFDE7';
  if (g >= 80) return '#FFF8E1';
  if (g >= 70) return '#FFF3E0';
  return '#FBE9E7';
};

export default function ClassDetailsScreen({ route, navigation }) {
  const { courseId } = route.params;

  const [assignmentName, setAssignmentName] = useState('');
  const [weight, setWeight] = useState('');
  const [grade, setGrade] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [courseName, setCourseName] = useState('Course');

  // Load course name for header + existing grades
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('courses');
        if (stored) {
          const courses = JSON.parse(stored);
          const course = courses.find((c) => c.id === courseId);
          if (course?.name) setCourseName(course.name);
        }
      } catch {}
      await loadGrades();
    })();
  }, [courseId]);

  // Save grades + push average back to courses whenever list changes
  useEffect(() => {
    (async () => {
      await saveGrades();
      const avg = calcAverageNumber();
      await updateCourseAverage(avg);
    })();
  }, [gradesList]);

  const loadGrades = async () => {
    try {
      const data = await AsyncStorage.getItem(`grades_${courseId}`);
      if (data) setGradesList(JSON.parse(data));
    } catch (err) {
      console.log('❌ Error loading grades:', err);
    }
  };

  const saveGrades = async () => {
    try {
      await AsyncStorage.setItem(`grades_${courseId}`, JSON.stringify(gradesList));
    } catch (err) {
      console.log('❌ Error saving grades:', err);
    }
  };

  const updateCourseAverage = async (avgNumberOrNull) => {
    try {
      const stored = await AsyncStorage.getItem('courses');
      if (!stored) return;
      const allCourses = JSON.parse(stored);
      const idx = allCourses.findIndex((c) => c.id === courseId);
      if (idx === -1) return;

      const avgStr = avgNumberOrNull == null ? 'N/A' : avgNumberOrNull.toFixed(2);
      allCourses[idx].average = avgStr;
      allCourses[idx].grade = convertToLetterFromPercent(avgStr);

      await AsyncStorage.setItem('courses', JSON.stringify(allCourses));
    } catch (err) {
      console.log('Error updating course average:', err);
    }
  };

  const addOrUpdateGrade = () => {
    if (!assignmentName || !weight || !grade) {
      Alert.alert('Missing info', 'Please enter name, weight, and grade.');
      return;
    }
    const w = parseFloat(weight);
    const g = parseFloat(grade);
    if (isNaN(w) || isNaN(g)) {
      Alert.alert('Invalid numbers', 'Weight and grade must be numbers.');
      return;
    }

    if (editingIndex !== null) {
      const updated = gradesList.map((item, idx) =>
        idx === editingIndex ? { assignmentName, weight, grade } : item
      );
      setGradesList(updated);
      setEditingIndex(null);
    } else {
      setGradesList((prev) => [...prev, { assignmentName, weight, grade }]);
    }
    setAssignmentName('');
    setWeight('');
    setGrade('');
  };

  const deleteGrade = (index) => {
    const updated = gradesList.filter((_, idx) => idx !== index);
    setGradesList(updated);
    if (editingIndex === index) {
      setAssignmentName('');
      setWeight('');
      setGrade('');
      setEditingIndex(null);
    }
  };

  const startEditing = (item, index) => {
    setAssignmentName(item.assignmentName);
    setWeight(item.weight);
    setGrade(item.grade);
    setEditingIndex(index);
  };

  const calcAverageNumber = () => {
    let totalWeight = 0;
    let totalScore = 0;
    gradesList.forEach((item) => {
      const w = parseFloat(item.weight);
      const g = parseFloat(item.grade);
      if (!isNaN(w) && !isNaN(g)) {
        totalWeight += w;
        totalScore += w * g;
      }
    });
    if (totalWeight <= 0) return null;
    return totalScore / totalWeight;
  };

  const totals = useMemo(() => {
    let tw = 0;
    gradesList.forEach((i) => {
      const w = parseFloat(i.weight);
      if (!isNaN(w)) tw += w;
    });
    const avgNum = calcAverageNumber();
    const avgStr = avgNum == null ? '—' : avgNum.toFixed(2);
    const remaining = Math.max(0, 100 - tw).toFixed(2);
    return { totalWeight: tw, remainingWeight: remaining, avgStr, avgNum };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradesList]);

  const renderItem = ({ item, index }) => (
    <View style={[styles.gradeCard, { backgroundColor: colorForPercent(item.grade) }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.assignName}>{item.assignmentName}</Text>
        <Text style={styles.assignMeta}>
          <Text style={{ fontWeight: '700' }}>{parseFloat(item.grade).toFixed ? parseFloat(item.grade).toFixed(2) : item.grade}%</Text>
          <Text> • Weight: {item.weight}%</Text>
        </Text>
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="sigma" size={14} color="#0D3B2E" />
            <Text style={styles.chipText}>
              +{(parseFloat(item.grade) * (parseFloat(item.weight) / 100)).toFixed(2)} pts
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => startEditing(item, index)} style={[styles.iconBtn, { backgroundColor: '#1E88E5' }]}>
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteGrade(index)} style={[styles.iconBtn, { backgroundColor: '#E53935' }]}>
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListHeader = (
    <>
      {/* Hero header */}
      <LinearGradient colors={['#0E7A3E', '#1EA75A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#E8F5E9" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle} numberOfLines={1}>{courseName}</Text>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatCard}>
            <Text style={styles.statLabel}>Current Avg</Text>
            <Text style={styles.statValue}>{totals.avgStr}%</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.statLabel}>Weight Entered</Text>
            <Text style={styles.statValue}>{totals.totalWeight.toFixed(2)}%</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>{totals.remainingWeight}%</Text>
          </View>
        </View>

        {/* Progress towards 100% weight */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, totals.totalWeight).toFixed(2)}%` }]} />
        </View>
        <Text style={styles.progressText}>Syllabus coverage {(Math.min(100, totals.totalWeight)).toFixed(1)}%</Text>
      </LinearGradient>

      {/* Add / Edit card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Grade</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Assignment (e.g., Midterm)"
            value={assignmentName}
            onChangeText={setAssignmentName}
          />
        </View>

        <View style={[styles.row, { gap: 10 }]}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Weight %"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Grade %"
            keyboardType="numeric"
            value={grade}
            onChangeText={setGrade}
          />
        </View>

        <TouchableOpacity onPress={addOrUpdateGrade} activeOpacity={0.9}>
          <LinearGradient colors={['#1565C0', '#1E88E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
            <Ionicons name={editingIndex !== null ? 'save' : 'add'} size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{editingIndex !== null ? 'Update Grade' : 'Add Grade'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Grades</Text>
    </>
  );

  const ListFooter = (
    <View style={{ height: 28 }} />
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={gradesList}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },

  hero: {
    paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 12,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#E8F5E9', fontWeight: '600' },
  heroTitle: { color: '#E8F5E9', fontSize: 20, fontWeight: '800', flex: 1, textAlign: 'right' },

  heroStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  heroStatCard: { flex: 1, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 12 },
  statLabel: { color: '#0D3B2E', fontSize: 12, opacity: 0.8 },
  statValue: { color: '#0D3B2E', fontSize: 18, fontWeight: '800', marginTop: 2 },

  progressTrack: { height: 8, backgroundColor: '#C8E6C9', borderRadius: 6, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: 8, backgroundColor: '#0D7A3E' },
  progressText: { marginTop: 6, fontSize: 11, color: '#E8F5E9' },

  card: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A2B3C', marginBottom: 10 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#DCE3EA', borderRadius: 10, padding: 10,
    backgroundColor: '#FAFBFC', color: '#263238'
  },
  inputHalf: { flex: 1 },

  primaryBtn: {
    marginTop: 4, paddingVertical: 12, borderRadius: 999,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },

  sectionHeader: { marginHorizontal: 16, marginTop: 8, marginBottom: 6, fontWeight: '800', color: '#263238' },

  gradeCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2
  },
  assignName: { fontSize: 16, fontWeight: '700', color: '#263238' },
  assignMeta: { marginTop: 2, color: '#546E7A' },

  chipsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  chip: { backgroundColor: '#DFF5E4', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { color: '#0D3B2E', fontWeight: '700', fontSize: 12 },

  cardActions: { justifyContent: 'space-between' },
  iconBtn: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});
