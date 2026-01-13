import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const GPA_TABLE = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.67,
  'B+': 3.33, 'B': 3.0, 'B-': 2.67,
  'C+': 2.33, 'C': 2.0, 'C-': 1.67,
  'D+': 1.33, 'D': 1.0, 'D-': 0.67,
  'F': 0.0
};

export default function HomeScreen({ navigation, route }) {
  const name   = route?.params?.userName  ?? 'there';
  const school = route?.params?.userSchool ?? '';
  const degree = route?.params?.userDegree ?? '';
  const major  = route?.params?.userMajor  ?? '';

  const [courses, setCourses] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const data = await AsyncStorage.getItem('courses');
        if (data) setCourses(JSON.parse(data));
      };
      load();
    }, [])
  );

  const stats = useMemo(() => {
    let credits = 0, qp = 0;
    courses.forEach(c => {
      const letter = c?.grade?.trim()?.toUpperCase();
      const pts = GPA_TABLE[letter];
      const cr = Number(c?.credits ?? 3);
      if (cr > 0 && pts !== undefined) { credits += cr; qp += pts * cr; }
    });
    const gpa = credits === 0 ? 0 : qp / credits;
    return {
      totalCredits: credits,
      qualityPoints: qp,
      currentGpa: gpa.toFixed(2),
      coursesCount: courses.length
    };
  }, [courses]);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0E7A3E', '#1EA75A']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 6 }}>
            <Ionicons name="menu" size={22} color="#E8F5E9" />
          </TouchableOpacity>

          <Text style={styles.title}>
            <Text style={{ color:'#E8F5E9', fontWeight:'800' }}>UTD </Text>
            <Text style={{ color:'#FFD54F', fontWeight:'800' }}>GPA </Text>
            <Text style={{ color:'#E8F5E9', fontWeight:'800' }}>Booster</Text>
          </Text>

          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.welcome}>
          Hi {name}{school ? ` from ${school}` : ''}! 🎓
        </Text>
        <Text style={styles.sub}>
          {degree || 'Your degree'} in {major || 'your major'} — let’s level up your term.
        </Text>
      </LinearGradient>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calculator-variant" size={20} color="#1A2B3C" />
            <Text style={styles.cardTitle}>Current GPA</Text>
          </View>
          <View style={styles.gpaRow}>
            <Text style={styles.gpaBig}>{stats.currentGpa}</Text>
            <Text style={styles.gpaOutOf}>/ 4.00</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min((Number(stats.currentGpa) / 4) * 100, 100).toFixed(0)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Progress to 4.0 {(Math.min((Number(stats.currentGpa) / 4) * 100, 100)).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={20} color="#1A2B3C" />
            <Text style={styles.cardTitle}>Statistics</Text>
          </View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Total Credits</Text><Text style={styles.statValue}>{stats.totalCredits}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Quality Points</Text><Text style={styles.statValue}>{stats.qualityPoints.toFixed(1)}</Text></View>
          <View style={styles.statRow}><Text style={styles.statLabel}>Courses</Text><Text style={styles.statValue}>{stats.coursesCount}</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },
  hero: { paddingVertical: 18, paddingHorizontal: 16, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 12 },
  heroTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  title: { fontSize: 26, letterSpacing: 0.3 },
  welcome: { color: '#E8F5E9', marginTop: 8, fontWeight: '700' },
  sub: { color: '#E8F5E9', opacity: 0.9, marginTop: 2 },

  cardsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A2B3C' },
  gpaRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  gpaBig: { fontSize: 42, fontWeight: '800', color: '#2E7D32' },
  gpaOutOf: { fontSize: 18, marginLeft: 6, color: '#90A4AE' },
  progressTrack: { height: 8, backgroundColor: '#E3F2FD', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#1565C0' },
  progressText: { marginTop: 6, fontSize: 12, color: '#607D8B' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statLabel: { color: '#546E7A' },
  statValue: { color: '#263238', fontWeight: '800' },
});
