// import { Ionicons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppScreen from "../../src/components/AppScreen";
import { useAuthStore } from "../../src/store/authStore";
import { theme } from "../../src/theme/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  // ✅ Bearer token from Zustand (replaces Firebase auth.currentUser)
  const token = useAuthStore((s) => s.token);

  // ✅ FETCH CONTACTS from PHP API
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/contacts/list.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!json.success) {
        Alert.alert("Error", json.message || "Failed to load contacts");
        return;
      }

      setContacts(json.contacts);
    } catch (err) {
      Alert.alert("Error", "Could not reach server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  // ✅ ADD CONTACT via PHP API
  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      return Alert.alert("Error", "Name and Phone are required");
    }

    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/contacts/add.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          relationship: relationship.trim(),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        Alert.alert("Error", json.message || "Failed to save contact");
        return;
      }

      // Add to local state immediately (no need to refetch)
      setContacts((prev) => {
        // If this is the first contact, mark it primary in UI
        const newContact = { ...json.contact };
        return [...prev, newContact];
      });

      setName("");
      setPhone("");
      setRelationship("");

      Alert.alert("✅ Saved", "Contact added successfully!");
    } catch (err) {
      Alert.alert("Error", "Could not reach server");
    } finally {
      setSaving(false);
    }
  };

  // ✅ DELETE CONTACT via PHP API
  const handleDeleteContact = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/contacts/delete.php`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (!json.success) {
        Alert.alert("Error", json.message || "Failed to delete contact");
        return;
      }

      // Remove from local state immediately
      setContacts((prev) => prev.filter((c) => c.id !== id));
      Alert.alert("Deleted", "Contact removed ✅");
    } catch (err) {
      Alert.alert("Error", "Could not reach server");
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
              "These contacts will be notified when SOS is triggered ✅",
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ADD FORM CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Contact</Text>

          <Label text="Full Name" />
          <TextInput
            style={styles.input}
            placeholder="Aman's Father"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={name}
            onChangeText={setName}
          />

          <Label text="Phone Number" />
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Label text="Relationship (optional)" />
          <TextInput
            style={styles.input}
            placeholder="Father / Mother / Friend"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={relationship}
            onChangeText={setRelationship}
          />

          <Pressable
            style={[styles.saveBtn, { opacity: saving ? 0.7 : 1 }]}
            onPress={handleAddContact}
            disabled={saving}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save Contact"}
            </Text>
          </Pressable>
        </View>

        {/* CONTACT LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Contacts</Text>
          <Text style={styles.sectionSmall}>
            {contacts.length} contact(s) added
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="call-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No Contacts Added</Text>
            <Text style={styles.emptySub}>
              Add emergency contacts so SOS can notify them instantly.
            </Text>
          </View>
        ) : (
          contacts.map((c) => (
            <View key={c.id} style={styles.contactCard}>
              <View style={styles.contactTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(c.name || "C").slice(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={styles.contactName}>{c.name}</Text>
                    {c.is_primary ? (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>PRIMARY</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                  {c.relationship ? (
                    <Text style={styles.contactRel}>{c.relationship}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.callBtn}
                  onPress={() =>
                    Alert.alert(
                      "Call feature",
                      "Real call + SMS coming soon ✅",
                    )
                  }
                >
                  <Ionicons name="call" size={14} color="#fff" />
                  <Text style={styles.callText}>Call</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert("Delete Contact?", `Remove ${c.name}?`, [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => handleDeleteContact(c.id),
                      },
                    ])
                  }
                >
                  <Ionicons
                    name="trash"
                    size={14}
                    color={theme.colors.danger}
                  />
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
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
