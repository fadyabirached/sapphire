// =============================
//  SettingsScreen (final version)
// =============================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { BASE_URL } from '../config';

// --- notifications config (show alert in foreground) ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  // auth
  const [userId, setUserId] = useState(null);
  const [token,  setToken]  = useState(null);
  const [email,  setEmail]  = useState('');

  // UI state
  const [isEmailModal, setEmailModal] = useState(false);
  const [tempEmail,    setTempEmail]  = useState('');

  const [isPwModal, setPwModal] = useState(false);
  const [oldPw, setOldPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [isReminderModal, setReminderModal] = useState(false);
  const [intervalLabel,  setIntervalLabel]  = useState('Off');
  const [notifId,        setNotifId]        = useState(null);

  // bootstrap: load userId, token, and current email
  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem('userId');
      const tok = await AsyncStorage.getItem('authToken');
      if (uid) setUserId(uid);
      if (tok) setToken(tok);

      if (uid && tok) {
        try {
          const res = await fetch(`${BASE_URL}/profile/${uid}`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const json = await res.json();
            setEmail(json.Email);
          }
        } catch {
          console.warn('Could not load profile');
        }
      }
    })();
  }, []);

  // helpers: headers, updateEmail, updatePassword, scheduleBreak
  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const updateEmail = async () => {
    try {
      const res = await fetch(`${BASE_URL}/profile/${userId}/email`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ newEmail: tempEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Server error');
      setEmail(tempEmail);
      setEmailModal(false);
      Alert.alert('Done', 'E‑mail updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const updatePassword = async () => {
    if (newPw !== confirmPw) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    try {
      const res = await fetch(`${BASE_URL}/profile/${userId}/password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Server error');
      setPwModal(false);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      Alert.alert('Done', 'Password updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const scheduleBreak = async (ms, label) => {
    try {
      // Cancel previous notification
      if (notifId) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
      }
      // Handle 'Off' case
      if (!ms) {
        setIntervalLabel('Off');
        setNotifId(null);
        return;
      }
      // Schedule new notification (repeat for any non-zero interval)
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to stretch!',
          body: 'Take a quick break 🤸',
        },
        trigger: {
          seconds: ms / 1000,
          repeats: true, // Always repeat for selected intervals
        },
      });
  
      setIntervalLabel(label);
      setNotifId(id);
    } catch (e) {
      console.warn('Notification error', e);
    }
  };
  // request notification permission once
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  // UI
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Account Settings */}
      <Text style={styles.header}>Account Settings</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setTempEmail(email);
          setEmailModal(true);
        }}
      >
        <Text style={styles.buttonText}>Change E‑mail</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => setPwModal(true)}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>

      {/* Well-being Reminder */}
      <Text style={styles.header}>Well‑being</Text>
      <TouchableOpacity
        style={styles.reminderRow}
        onPress={() => setReminderModal(true)}
      >
        <Text style={styles.reminderText}>Remind me to take a break</Text>
        <Text style={styles.reminderText}>{intervalLabel}</Text>
      </TouchableOpacity>

      {/* Email Modal */}
      <Modal visible={isEmailModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Change E‑mail</Text>
            <TextInput
              style={styles.input}
              placeholder="new@email.com"
              placeholderTextColor="#555"
              value={tempEmail}
              onChangeText={setTempEmail}
            />
            <View style={styles.row}>
              <PressBtn text="Save" onPress={updateEmail} />
              <PressBtn text="Cancel" red onPress={() => setEmailModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={isPwModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="old password"
              placeholderTextColor="#555"
              secureTextEntry
              value={oldPw}
              onChangeText={setOldPw}
            />
            <TextInput
              style={styles.input}
              placeholder="new password"
              placeholderTextColor="#555"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={styles.input}
              placeholder="confirm new password"
              placeholderTextColor="#555"
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <View style={styles.row}>
              <PressBtn text="Save" onPress={updatePassword} />
              <PressBtn text="Cancel" red onPress={() => setPwModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Modal */}
      <Modal visible={isReminderModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Break interval</Text>
            {[
              { label: 'Off', ms: 0 },
              { label: '5 sec', ms: 5000 },
              { label: '10 min', ms: 600000 },
              { label: '30 min', ms: 1800000 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.intervalBtn}
                onPress={() => {
                  scheduleBreak(opt.ms, opt.label);
                  setReminderModal(false);
                }}
              >
                <Text style={styles.intervalTxt}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// small button used in modals
const PressBtn = ({ text, onPress, red }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.modalBtn, red && { backgroundColor: '#A52A2A' }]}
  >
    <Text style={styles.modalBtnTxt}>{text}</Text>
  </TouchableOpacity>
);

// styles
const styles = StyleSheet.create({
  container:     { padding: 20 },
  header:        { fontSize: 20, fontWeight: 'bold', color: '#2C4F83', marginVertical: 10 },
  button:        { backgroundColor: '#2C4F83', borderRadius: 20, padding: 15, marginVertical: 10, alignItems: 'center' },
  buttonText:    { color: '#fff', fontWeight: 'bold' },

  reminderRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingVertical: 15, borderBottomWidth: 1, borderColor: '#D9D9D9' },
  reminderText:  { fontSize: 16, color: '#2C4F83' },

  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modal:         { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  title:         { fontSize: 22, fontWeight: 'bold', color: '#2C4F83', marginBottom: 15 },

  input:         { borderWidth: 1, borderColor: '#ccc', borderRadius: 7, padding: 10, marginVertical: 7 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },

  modalBtn:      { backgroundColor: '#2C4F83', borderRadius: 7, paddingVertical: 10, paddingHorizontal: 25, marginHorizontal: 5 },
  modalBtnTxt:   { color: '#fff', fontWeight: 'bold' },

  intervalBtn:   { padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2C4F83',
                   borderRadius: 10, marginVertical: 6 },
  intervalTxt:   { color: '#2C4F83', fontWeight: 'bold' },
});
