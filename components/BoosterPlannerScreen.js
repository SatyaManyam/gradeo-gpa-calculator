// components/BoosterPlannerScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { parseDegreeFile } from '../utils/parseDegreePlan';

// --- sample "easy" boosters dataset (customize freely) ---
const BOOSTER_POOL = [
  { code:'UNIV 1010', name:'Freshman Seminar', credits:1, tags:['seminar','light'], difficulty:1, workload:'Low' },
  { code:'ARTS 1301', name:'Intro to Visual Arts', credits:3, tags:['core-creative','online'], difficulty:2, workload:'Low' },
  { code:'HIST 1301', name:'US History I', credits:3, tags:['core-history'], difficulty:2, workload:'Med' },
  { code:'COMM 1311', name:'Intro to Communication', credits:3, tags:['presentation','core'], difficulty:2, workload:'Low' },
  { code:'MUSI 1306', name:'Music Appreciation', credits:3, tags:['core-creative'], difficulty:1, workload:'Low' },
  { code:'PHED 1100', name:'Wellness Activity', credits:1, tags:['activity'], difficulty:1, workload:'Low' },
];

export default function BoosterPlannerScreen({ navigation }) {
  const [degreePlan, setDegreePlan] = useState([]);     // array of requirements
  const [previous, setPrevious] = useState([]);         // previousCourses from storage
  const [current, setCurrent] = useState([]);           // current 'courses'
  const [wishlist, setWishlist] = useState([]);         // saved boosters

  // Load persisted data
  useEffect(() => {
    (async () => {
      const dp = await AsyncStorage.getItem('degreePlan');
      const pc = await AsyncStorage.getItem('previousCourses');
      const cc = await AsyncStorage.getItem('courses');
      const wl = await AsyncStorage.getItem('boosterWishlist');

      if (dp) setDegreePlan(JSON.parse(dp));
      if (pc) setPrevious(JSON.parse(pc));
      if (cc) setCurrent(JSON.parse(cc));
      if (wl) setWishlist(JSON.parse(wl));
    })();
  }, []);

  const takenCodes = useMemo(() => {
    const codes = new Set();
    previous?.forEach(c => c?.name && codes.add(normalizeCode(c.code || c.name)));
    current?.forEach(c => c?.name && codes.add(normalizeCode(c.code || c.name)));
    return codes;
  }, [previous, current]);

  const remainingReqs = useMemo(() => {
    if (!degreePlan?.length) return [];
    return degreePlan.filter(r => r.required && !takenCodes.has(normalizeCode(r.code || r.name)));
  }, [degreePlan, takenCodes]);

  const progress = useMemo(() => {
    if (!degreePlan?.length) return 0;
    const totalRequired = degreePlan.filter(r => r.required).length || 1;
    const completed = degreePlan.filter(r => r.required && takenCodes.has(normalizeCode(r.code || r.name))).length;
    return completed / totalRequired;
  }, [degreePlan, takenCodes]);

  const boosters = useMemo(() => {
    // Filter boosters that aren't already taken; sort by difficulty asc, then workload
    const notTaken = BOOSTER_POOL.filter(b => !takenCodes.has(normalizeCode(b.code || b.name)));
    return notTaken.sort((a,b) => a.difficulty - b.difficulty || a.credits - b.credits);
  }, [takenCodes]);

  const importDegreePlan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;

      const parsed = await parseDegreeFile(file.uri, file.name || '');
      if (!parsed.length) {
        Alert.alert('Could not read file', 'Please upload a .csv or .txt with columns: code,name,credits,category,required');
        return;
      }
      await AsyncStorage.setItem('degreePlan', JSON.stringify(parsed));
      setDegreePlan(parsed);
      Alert.alert('Degree plan imported', `Loaded ${parsed.length} rows.`);
    } catch (e) {
      console.log('Import degree error', e);
      Alert.alert('Import failed', 'Try again with a .csv or .txt.');
    }
  };

  const toggleWishlist = async (item) => {
    const exists = wishlist.find(w => normalizeCode(w.code) === normalizeCode(item.code));
    let updated;
    if (exists) updated = wishlist.filter(w => normalizeCode(w.code) !== normalizeCode(item.code));
    else updated = [...wishlist, item];
    setWishlist(updated);
    await AsyncStorage.setItem('boosterWishlist', JSON.stringify(updated));
  };

  const renderReq = ({ item }) => (
    <View style={styles.reqCard}>
      <Text style={styles.reqTitle}>{item.code || item.name}</Text>
      <Text style={styles.reqSub}>{item.name}</Text>
      <View style={styles.reqMetaRow}>
        <Chip text={`${item.credits || 3} hrs`} color="#E8F5E9" textColor="#1B5E20" />
        <Chip text={item.category || 'elective'} />
        <Chip text={item.required ? 'Required' : 'Optional'} />
      </View>
    </View>
  );

  const renderBoost = ({ item }) => {
    const saved = !!wishlist.find(w => normalizeCode(w.code) === normalizeCode(item.code));
    return (
      <View style={styles.boostCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.boostTitle}>{item.code} • {item.name}</Text>
          <Text style={styles.boostSub}>{item.credits} credits • Workload: {item.workload}</Text>
          <View style={styles.reqMetaRow}>
            {item.tags?.slice(0,4).map(t => <Chip key={t} text={t} />)}
          </View>
        </View>
        <TouchableOpacity onPress={() => toggleWishlist(item)} style={[styles.saveBtn, saved && { backgroundColor: '#1E88E5' }]}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={['#0E7A3E', '#1EA75A']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 6 }}>
            <Ionicons name="menu" size={22} color="#E8F5E9" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>
            <Text style={{ color:'#E8F5E9', fontWeight:'800' }}>UTD </Text>
            <Text style={{ color:'#FFD54F', fontWeight:'800' }}>Planner </Text>
            <Text style={{ color:'#E8F5E9', fontWeight:'800' }}>& Boosters</Text>
          </Text>

          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.heroSub}>Import your degree plan and get easy, GPA-friendly suggestions.</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={importDegreePlan} style={{ marginTop: 10 }}>
          <LinearGradient colors={['#1565C0', '#1E88E5']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.primaryBtn}>
            <Ionicons name="cloud-upload" size={18} color="#fff" />
            <Text style={styles.primaryText}>Import Degree Plan (.csv / .txt)</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(progress*100).toFixed(0)}%` }]} /></View>
          <Text style={styles.progressText}>Degree completion {(progress*100).toFixed(1)}%</Text>
        </View>
      </LinearGradient>

      {/* Remaining requirements */}
      <Text style={styles.sectionHeader}>Remaining Required Courses</Text>
      <FlatList
        data={remainingReqs}
        renderItem={renderReq}
        keyExtractor={(item, i) => item.code ? item.code : String(i)}
        contentContainerStyle={{ paddingBottom: 8 }}
        ListEmptyComponent={<Text style={styles.emptyText}>{degreePlan.length ? 'All required courses matched as taken! 🎉' : 'No degree plan yet. Import one above.'}</Text>}
      />

      {/* Booster suggestions */}
      <View style={styles.rowHeader}>
        <Text style={styles.sectionHeader}>GPA Booster Suggestions</Text>
        <View style={styles.wishlistBadge}>
          <Ionicons name="bookmark" size={12} color="#0D3B2E" />
          <Text style={styles.wishlistText}>{wishlist.length}</Text>
        </View>
      </View>
      <FlatList
        data={boosters}
        renderItem={renderBoost}
        keyExtractor={(item, i) => item.code || String(i)}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

function Chip({ text, color = '#E3F2FD', textColor = '#0D3B2E' }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

function normalizeCode(s='') {
  return String(s).replace(/\s+/g, '').toUpperCase();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },

  hero: { paddingVertical: 16, paddingHorizontal: 16, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 12 },
  heroTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  heroTitle: { fontSize: 22, letterSpacing: 0.3, color: '#E8F5E9' },
  heroSub: { color: '#E8F5E9', marginTop: 4, opacity: 0.9 },

  primaryBtn: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '800' },

  progressWrap: { marginTop: 10 },
  progressTrack: { height: 8, backgroundColor: '#C8E6C9', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#0D7A3E' },
  progressText: { color: '#E8F5E9', opacity: 0.95, marginTop: 6, fontSize: 12 },

  sectionHeader: { marginHorizontal: 16, marginTop: 10, marginBottom: 8, fontWeight: '800', color: '#263238' },
  emptyText: { marginHorizontal: 16, color: '#546E7A' },

  reqCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  reqTitle: { fontSize: 16, fontWeight: '800', color: '#263238' },
  reqSub: { color: '#546E7A', marginTop: 2 },
  reqMetaRow: { flexDirection: 'row', gap: 6, marginTop: 8 },

  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  chipText: { fontWeight: '700', fontSize: 12 },

  rowHeader: { marginHorizontal: 16, marginTop: 6, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wishlistBadge: { backgroundColor: '#DFF5E4', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  wishlistText: { color: '#0D3B2E', fontWeight: '800', fontSize: 12 },

  boostCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  boostTitle: { fontSize: 15, fontWeight: '800', color: '#263238' },
  boostSub: { color: '#546E7A', marginTop: 2 },
  saveBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center' },
});
