import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import AppScreen from "../../src/components/AppScreen";
import { useAuthStore } from "../../src/store/authStore";
import { theme } from "../../src/theme/theme";

const BASE_URL = "http://YOUR_IP:5000/api/contacts";

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const getUserId = () => useAuthStore.getState().getUserId();

  // ✅ FETCH CONTACTS (MONGO BACKEND)
  const fetchContacts = useCallback(async () => {
    try {
      const userId = getUserId();
      if (!userId) return;

      const res = await fetch(`${BASE_URL}/${userId}`);
      const data = await res.json();

      setContacts(data || []);
    } catch (err) {
      Alert.alert("Error", "Could not load contacts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  // ✅ ADD CONTACT
  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      return Alert.alert("Error", "Name and Phone are required");
    }

    try {
      setSaving(true);

      const userId = getUserId();

      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship.trim(),
        }),
      });

      const newContact = await res.json();

      setContacts((prev) => [...prev, newContact]);

      setName("");
      setPhone("");
      setRelationship("");

      Alert.alert("✅ Saved", "Contact added successfully!");
    } catch (err) {
      Alert.alert("Error", "Could not save contact");
    } finally {
      setSaving(false);
    }
  };

  // ✅ DELETE CONTACT
  const handleDeleteContact = async (id) => {
    try {
      await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
      });

      setContacts((prev) => prev.filter((c) => c._id !== id));

      Alert.alert("Deleted", "Contact removed ✅");
    } catch (err) {
      Alert.alert("Error", "Could not delete contact");
    }
  };

  return (
    <AppScreen>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subTitle}>Emergency people to notify</Text>
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              "SOS Contacts",
              "These contacts will be notified when SOS is triggered ✅"
            )
          }
          style={styles.iconBtn}
        >
          <Ionicons
            name="information-circle"
            size={18}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ADD FORM */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Contact</Text>

          <Label text="Full Name" />
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Label text="Phone Number" />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
          />

          <Label text="Relationship" />
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
          />

          <Pressable
            style={styles.saveBtn}
            onPress={handleAddContact}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save Contact"}
            </Text>
          </Pressable>
        </View>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : contacts.length === 0 ? (
          <Text style={{ color: "#fff", textAlign: "center" }}>
            No contacts added
          </Text>
        ) : (
          contacts.map((c) => (
            <View key={c._id} style={styles.contactCard}>
              <Text style={styles.contactName}>{c.name}</Text>

              <Pressable onPress={() => handleDeleteContact(c._id)}>
                <Text style={{ color: "red" }}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </AppScreen>
  );
}

function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { color: theme.colors.text, fontSize: 20, fontWeight: "900" },
  subTitle: {
    marginTop: 2,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  cardTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 12,
  },

  label: {
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: theme.colors.chip,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    fontWeight: "800",
  },

  saveBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  sectionHeader: { marginTop: 4, marginBottom: 10 },
  sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  sectionSmall: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  emptyBox: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  emptySub: {
    marginTop: 6,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },

  contactCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginBottom: 12,
  },

  contactTop: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },

  contactName: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
  contactPhone: {
    marginTop: 4,
    color: theme.colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },
  contactRel: {
    marginTop: 3,
    color: theme.colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },

  primaryBadge: {
    backgroundColor: theme.colors.successSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  primaryText: { color: theme.colors.success, fontWeight: "900", fontSize: 10 },

  actionRow: { marginTop: 14, flexDirection: "row", gap: 10 },

  callBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  callText: { color: "#fff", fontWeight: "900" },

  deleteBtn: {
    flex: 1,
    backgroundColor: theme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  deleteText: { color: theme.colors.danger, fontWeight: "900" },
});
