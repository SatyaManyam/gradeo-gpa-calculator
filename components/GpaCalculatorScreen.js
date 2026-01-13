import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const defaultGpaTable = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.67,
  'B+': 3.33, 'B': 3.0, 'B-': 2.67,
  'C+': 2.33, 'C': 2.0, 'C-': 1.67,
  'D+': 1.33, 'D': 1.0, 'D-': 0.67,
  'F': 0.0
};

const getColor = (grade, gpaTable) => {
  const gpa = gpaTable[grade?.toUpperCase()];
  if (gpa === undefined) return '#EEF2F7';
  if (gpa >= 3.9) return '#E9F7EF';
  if (gpa >= 3.67) return '#F1F8E9';
  if (gpa >= 3.3) return '#FFFDE7';
  if (gpa >= 3.0) return '#FFF8E1';
  if (gpa >= 2.0) return '#FFF3E0';
  return '#FBE9E7';
};

export default function GpaCalculatorScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [gpaScale, setGpaScale] = useState('UTD');
  const [customGpaTable, setCustomGpaTable] = useState(defaultGpaTable);
  const [gpa, setGpa] = useState('0.00');

  const currentGpaTable = gpaScale === 'Custom' ? customGpaTable : defaultGpaTable;

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const storedCourses = await AsyncStorage.getItem('courses');
        const storedScale = await AsyncStorage.getItem('gpaScale');
        const storedCustomTable = await AsyncStorage.getItem('customGpaTable');
        if (storedCourses) setCourses(JSON.parse(storedCourses));
        if (storedScale) setGpaScale(storedScale);
        if (storedCustomTable) setCustomGpaTable(JSON.parse(storedCustomTable));
      };
      fetchData();
    }, [])
  );

  const { totalPoints, totalCredits, progress, statusLabel, statusTone } = useMemo(() => {
    let tp = 0, tc = 0;
    courses.forEach(c => {
      const letter = c.grade?.trim().toUpperCase();
      const credits = Number(c.credits ?? 3);
      const pts = currentGpaTable[letter];
      if (credits > 0 && pts !== undefined) { tp += pts * credits; tc += credits; }
    });
    const g = tc === 0 ? 0 : tp / tc;
    const label = g >= 3.5 ? 'Dean’s List Target' : g >= 2.0 ? 'Good Standing' : 'Needs Attention';
    const tone = g >= 3.5 ? 'success' : g >= 2.0 ? 'info' : 'warn';
    return { totalPoints: tp, totalCredits: tc, progress: Math.min(g / 4, 1), statusLabel: label, statusTone: tone };
  }, [courses, currentGpaTable]);

  useEffect(() => {
    const g = totalCredits === 0 ? '0.00' : (totalPoints / totalCredits).toFixed(2);
    setGpa(g);
  }, [totalPoints, totalCredits]);

  const updateGrade = async (index, newGrade) => {
    const updated = [...courses];
    updated[index].grade = newGrade;
    setCourses(updated);
    await AsyncStorage.setItem('courses', JSON.stringify(updated));
  };

  const updateCustomScale = async (grade, value) => {
    const updated = { ...customGpaTable, [grade]: parseFloat(value) || 0 };
    setCustomGpaTable(updated);
    await AsyncStorage.setItem('customGpaTable', JSON.stringify(updated));
  };

  const handleScaleChange = async (value) => {
    setGpaScale(value);
    await AsyncStorage.setItem('gpaScale', value);
  };

  const renderCourse = ({ item, index }) => {
    const gpaValue = currentGpaTable[item.grade?.toUpperCase()] ?? '—';
    return (
      <View style={[styles.courseCard, { backgroundColor: getColor(item.grade, currentGpaTable) }]}>
        <View style={styles.courseHeader}>
          <Text style={styles.courseName}>{item.name || 'Untitled Course'}</Text>
          <View style={styles.badgeSmall}><Text style={styles.badgeSmallText}>{item.credits ?? 3} hrs</Text></View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Grade</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={item.grade} onValueChange={(val) => updateGrade(index, val)} style={styles.picker} dropdownIconColor="#222">
              <Picker.Item label="Select grade" value="" />
              {Object.keys(currentGpaTable).map((grade) => (<Picker.Item key={grade} label={grade} value={grade} />))}
            </Picker>
          </View>
        </View>

        <View style={styles.courseFooter}>
          <Text style={styles.meta}>Points: {gpaValue}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0E7A3E', '#1EA75A']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 6 }}>
            <Ionicons name="menu" size={22} color="#E8F5E9" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>
            <Text style={{color:'#E8F5E9', fontWeight:'800'}}>UTD </Text>
            <Text style={{color:'#FFD54F', fontWeight:'800'}}>GPA </Text>
            <Text style={{color:'#E8F5E9', fontWeight:'800'}}>Calculator</Text>
          </Text>

          <View style={{ width: 22 }} />
        </View>
        <Text style={styles.heroSub}>Track progress, analyze trends, and stay on target.</Text>
      </LinearGradient>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calculator-variant" size={20} color="#1A2B3C" />
            <Text style={styles.cardTitle}>Current GPA</Text>
          </View>

          <View style={styles.gpaRow}><Text style={styles.gpaBig}>{gpa}</Text><Text style={styles.gpaOutOf}>/ 4.00</Text></View>

          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(progress * 100).toFixed(0)}%` }]} /></View>
          <Text style={styles.progressText}>Progress to 4.0  {(progress*100).toFixed(1)}%</Text>

          <View style={[
            styles.statusBadge,
            statusTone === 'success' ? styles.badgeSuccess :
            statusTone === 'info' ? styles.badgeInfo : styles.badgeWarn
          ]}>
            <Ionicons
              name={statusTone === 'success' ? 'trending-up' : statusTone === 'info' ? 'checkmark-circle' : 'warning'}
              size={14}
              color="#0D3B2E"
              style={{marginRight:6}}
            />
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}><Ionicons name="stats-chart" size={20} color="#1A2B3C" /><Text style={styles.cardTitle}>Statistics</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Total Credits</Text><Text style={styles.statValue}>{totalCredits || 0}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Quality Points</Text><Text style={styles.statValue}>{totalPoints.toFixed(1)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Courses</Text><Text style={styles.statValue}>{courses.length}</Text></View>
        </View>
      </View>

      <View style={styles.scaleSelectRow}>
        <Text style={styles.scaleLabel}>GPA Scale</Text>
        <View style={styles.scalePickerWrap}>
          <Picker selectedValue={gpaScale} onValueChange={(value) => handleScaleChange(value)} style={styles.scalePicker}>
            <Picker.Item label="UTD" value="UTD" />
            <Picker.Item label="Custom" value="Custom" />
          </Picker>
        </View>
      </View>

      {gpaScale === 'Custom' && (
        <View style={styles.customScaleBox}>
          {Object.keys(defaultGpaTable).map((grade) => (
            <View key={grade} style={styles.scaleInputRow}>
              <Text style={styles.scaleKey}>{grade}</Text>
              <TextInput style={styles.scaleInput} keyboardType="numeric" value={customGpaTable[grade]?.toString() || ''} onChangeText={(val) => updateCustomScale(grade, val)} placeholder="0.00" />
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={(item, index) => item?.id ?? String(index)}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={<Text style={styles.listHeader}>Current Semester</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },

  hero: { paddingVertical: 18, paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 12 },
  heroTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  heroTitle: { fontSize: 28, letterSpacing: 0.5, color: '#E8F5E9' },
  heroSub: { color: '#E8F5E9', marginTop: 4, opacity: 0.9 },

  cardsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A2B3C' },

  gpaRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  gpaBig: { fontSize: 44, fontWeight: '800', color: '#2E7D32' },
  gpaOutOf: { fontSize: 18, marginLeft: 6, color: '#90A4AE' },

  progressTrack: { height: 8, backgroundColor: '#E3F2FD', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#1565C0' },
  progressText: { marginTop: 6, fontSize: 12, color: '#607D8B' },

  statusBadge: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  badgeSuccess: { backgroundColor: '#DFF5E4' },
  badgeInfo: { backgroundColor: '#E3F2FD' },
  badgeWarn: { backgroundColor: '#FFF3E0' },
  statusBadgeText: { color: '#0D3B2E', fontWeight: '700', fontSize: 12 },

  scaleSelectRow: { marginTop: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  scaleLabel: { fontWeight: '700', color: '#263238' },
  scalePickerWrap: { flex: 1, borderWidth: 1, borderColor: '#DCE3EA', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  scalePicker: { height: 40 },

  customScaleBox: { marginTop: 10, marginHorizontal: 16, backgroundColor: '#fff', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  scaleInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  scaleKey: { fontWeight: '600', color: '#37474F' },
  scaleInput: { borderWidth: 1, borderColor: '#DCE3EA', borderRadius: 8, padding: 8, width: 80, backgroundColor: '#FAFBFC' },

  listHeader: { marginTop: 18, marginBottom: 8, marginHorizontal: 16, fontWeight: '800', color: '#263238' },

  courseCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  courseName: { fontSize: 16, fontWeight: '700', color: '#263238' },
  badgeSmall: { backgroundColor: '#E8F5E9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  badgeSmallText: { color: '#1B5E20', fontWeight: '700', fontSize: 12 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, marginRight: 10, color: '#455A64' },

  pickerWrapper: { flex: 1, borderWidth: 1, borderColor: '#DCE3EA', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  picker: { height: 40, width: '100%' },

  courseFooter: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: '#546E7A', fontWeight: '600' }
});
