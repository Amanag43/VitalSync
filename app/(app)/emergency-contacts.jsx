// app/(app)/emergency-contacts.jsx
// Manage and test emergency contacts

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../../src/store/authStore";
import {
  getEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact,
  sendSOSAlert,
} from "../../src/services/emergencyservice";

const C = {
  bg: "#0A0E17",
  card: "#111827",
  border: "#1F2D45",
  text: "#F0F4FF",
  muted: "#6B7B9A",
  red: "#FF3B5C",
  green: "#22C55E",
};

export default function EmergencyContactsScreen() {
  const userId = useAuthStore((s) => s.user?._id ?? s.user?.id);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await getEmergencyContacts(userId);
    setContacts(data || []);
    setLoading(false);
  };

  const handleAddContact = async () => {
    if (!name || !phone) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    const success = await saveEmergencyContact(userId, {
      name,
      phone,
      relation: relation || "Friend",
    });

    if (success) {
      setName("");
      setPhone("");
      setRelation("");
      await loadContacts();
      alert("Contact added!");
    } else {
      alert("Failed to add contact");
    }
    setSaving(false);
  };

  const handleDeleteContact = async (contactId) => {
    setSaving(true);
    const success = await deleteEmergencyContact(userId, contactId);
    if (success) {
      await loadContacts();
      alert("Contact deleted");
    }
    setSaving(false);
  };

  const handleTestSOS = async () => {
    if (contacts.length === 0) {
      alert("Add at least one emergency contact first");
      return;
    }

    setSaving(true);
    const result = await sendSOSAlert(userId, null, {
      vital: "Test Alert - No actual emergency",
      severity: "warning",
    });

    if (result.sent > 0) {
      alert(`✅ Test SMS sent to ${result.sent} contacts`);
    } else {
      alert(`❌ Failed: ${result.reason}`);
    }
    setSaving(false);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>🆘 Emergency Contacts</Text>

      {/* Add Contact Form */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Add Emergency Contact</Text>

        <TextInput
          style={s.input}
          placeholder="Name (e.g., Mom)"
          placeholderTextColor={C.muted}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={s.input}
          placeholder="Phone (e.g., +1234567890)"
          placeholderTextColor={C.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={s.input}
          placeholder="Relation (e.g., Mother)"
          placeholderTextColor={C.muted}
          value={relation}
          onChangeText={setRelation}
        />

        <TouchableOpacity
          style={[s.btn, { borderColor: C.green + "88" }]}
          onPress={handleAddContact}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={C.green} />
          ) : (
            <Text style={[s.btnText, { color: C.green }]}>+ Add Contact</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      <View style={s.card}>
        <Text style={s.cardTitle}>
          Your Contacts ({contacts.length})
        </Text>

        {loading ? (
          <ActivityIndicator color={C.green} size="large" />
        ) : contacts.length === 0 ? (
          <Text style={s.empty}>No emergency contacts yet. Add one above.</Text>
        ) : (
          contacts.map((contact) => (
            <View key={contact._id} style={s.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.contactName}>
                  {contact.name} ({contact.relation})
                </Text>
                <Text style={s.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (
                    confirm(
                      `Delete ${contact.name}? They won't receive SOS alerts.`
                    )
                  ) {
                    handleDeleteContact(contact._id);
                  }
                }}
              >
                <Text style={{ color: C.red, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Test SOS */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Test SOS System</Text>
        <Text style={s.note}>
          Send a test SMS to all your emergency contacts. They will receive a
          message that this is a test.
        </Text>

        <TouchableOpacity
          style={[s.btn, { borderColor: C.red + "88", marginTop: 12 }]}
          onPress={handleTestSOS}
          disabled={saving || contacts.length === 0}
        >
          {saving ? (
            <ActivityIndicator color={C.red} />
          ) : (
            <Text style={[s.btnText, { color: C.red }]}>📱 Send Test SOS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={s.card}>
        <Text style={s.cardTitle}>How It Works</Text>
        <Text style={s.info}>
          1️⃣ Add your emergency contacts above{"\n"}
          2️⃣ When your vitals reach CRITICAL:{"\n"}
          — Red alert banner appears{"\n"}
          — Map opens with hospitals{"\n"}
          — SOS SMS sent to all contacts{"\n"}
          3️⃣ Your contacts receive your location & alert
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: 60 },
  title: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 16 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  cardTitle: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 },
  input: {
    backgroundColor: "#0A0E17",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    color: C.text,
    marginBottom: 10,
    fontSize: 13,
  },
  btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  btnText: { fontSize: 13, fontWeight: "700" },
  contactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.border },
  contactName: { color: C.text, fontSize: 14, fontWeight: "600" },
  contactPhone: { color: C.muted, fontSize: 12, marginTop: 2 },
  empty: { color: C.muted, fontSize: 13, fontStyle: "italic" },
  note: { color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  info: { color: C.text, fontSize: 12, lineHeight: 20 },
});