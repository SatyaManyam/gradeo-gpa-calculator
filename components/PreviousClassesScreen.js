import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { parseTranscriptFile, parseTranscriptPDF } from '../utils/parseTranscript';

export default function PreviousClassesScreen({ navigation }) {
  const [previousCourses, setPreviousCourses] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('previousCourses');
      if (data) setPreviousCourses(JSON.parse(data));
    })();
  }, []);

  const importTranscript = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/csv'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file?.uri) return;

      let parsed = [];
      const mime = file.mimeType || '';
      const name = file.name || '';

      if (mime.includes('pdf') || /\.pdf$/i.test(name)) {
        parsed = await parseTranscriptPDF(file.uri);
        if (!parsed.length) {
          Alert.alert('PDF not supported yet', 'Please upload a .txt or .csv transcript for now.');
        }
      } else {
        parsed = await parseTranscriptFile(file.uri, name);
      }

      await AsyncStorage.setItem('previousCourses', JSON.stringify(parsed));
      setPreviousCourses(parsed);
    } catch (e) {
      console.log('Import error', e);
      Alert.alert('Import failed', 'Could not read that file. Try a .txt or .csv transcript.');
    }
  };

  const renderCourse = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>
        {item.name || 'Unknown Course'} {item.semester ? `(${item.semester})` : ''}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.badge}><Text style={styles.badgeText}>Grade: {item.grade ?? 'N/A'}</Text></View>
        <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.badgeText, { color: '#1B5E20' }]}>{item.credits ?? 'N/A'} hrs</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0E7A3E', '#1EA75A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 6 }}>
            <Ionicons name="menu" size={22} color="#E8F5E9" />
          </TouchableOpacity>

          <Text style={styles.heroTitle}>
            <Text style={{ color: '#E8F5E9', fontWeight: '800' }}>UTD </Text>
            <Text style={{ color: '#FFD54F', fontWeight: '800' }}>Previous </Text>
            <Text style={{ color: '#E8F5E9', fontWeight: '800' }}>Classes</Text>
          </Text>

          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.heroSub}>Import your past coursework to inform planning.</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={importTranscript} style={{ marginTop: 12 }}>
          <LinearGradient colors={['#1565C0', '#1E88E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
            <Ionicons name="cloud-upload" size={18} color="#fff" />
            <Text style={styles.primaryText}>Import Transcript (.txt / .csv / .pdf*)</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.note}>* PDF parsing is coming soon—use .txt or .csv for now.</Text>
      </LinearGradient>

      <Text style={styles.sectionHeader}>Imported Courses</Text>
      <FlatList
        data={previousCourses}
        renderItem={renderCourse}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No previous classes yet. Import a transcript to get started.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8FA' },

  hero: { paddingVertical: 16, paddingHorizontal: 16, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 12 },
  heroTopRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  heroTitle: { fontSize: 24, letterSpacing: 0.3, color: '#E8F5E9' },
  heroSub: { color: '#E8F5E9', marginTop: 4, opacity: 0.9 },
  primaryBtn: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '800' },
  note: { color: '#E8F5E9', opacity: 0.85, marginTop: 6, fontSize: 12 },

  sectionHeader: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, fontWeight: '800', color: '#263238' },

  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  name: { fontSize: 16, fontWeight: '800', color: '#263238' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { backgroundColor: '#E3F2FD', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  badgeText: { color: '#0D3B2E', fontWeight: '700', fontSize: 12 },

  emptyText: { marginHorizontal: 16, color: '#546E7A' }
});
