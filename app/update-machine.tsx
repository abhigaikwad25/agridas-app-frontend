// app/update-machine.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import api from "./utils/axiosinstance";
const BASE_URL = "https://agridas-latest.onrender.com";

const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#6B2737",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  inputBg: "#FEFCFB",
  shadow: "rgba(107,39,55,0.10)",
};

const CROPS = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane"];
const CROP_ICONS: Record<string, string> = {
  Wheat: "🌻", Rice: "🌾", Cotton: "🌿", Soybean: "🫘", Sugarcane: "🎋",
};

const MACHINE_TYPES = ["harvesting", "sowing", "transport", "drone"];
const TYPE_ICONS: Record<string, string> = {
  harvesting: "🌾", sowing: "🌱", transport: "🚛", drone: "🚁",
};
const TYPE_LABELS: Record<string, string> = {
  harvesting: "Harvesting", sowing: "Sowing", transport: "Transport", drone: "Drone",
};

export default function UpdateMachineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    pricePerDay: "",
    maxAcreCoverage: "",
    deliveryChargePerKm: "",
    ownerPhoneno: "",
    description: "",
    taluka: "",
    district: "",
    state: "",
    crops: [] as string[],
    machineType: [] as string[],
  });

  // ── Location search filter ────────────────────────────────────────────────
  useEffect(() => {
    if (!search) { setFilteredLocations(locations); return; }
    const lower = search.toLowerCase();
    setFilteredLocations(locations.filter((l) => l.taluka.toLowerCase().includes(lower)));
  }, [search, locations]);

  // ── Fetch machine details ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const [machineRes, locationRes] = await Promise.all([
          api.get(`${BASE_URL}/machine/details/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`${BASE_URL}/location/list`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const d = machineRes.data;
        setForm({
          name: d.name || "",
          pricePerDay: String(d.pricePerDay || ""),
          maxAcreCoverage: String(d.maxAcreCoverage || ""),
          deliveryChargePerKm: String(d.deliveryChargePerKm || ""),
          ownerPhoneno: d.ownerPhoneno || "",
          description: d.description || "",
          taluka: d.taluka || "",
          district: d.district || "",
          state: d.state || "",
          crops: d.crops || [],
          machineType: d.machineType || [],
        });

        setSelectedLocation({
          _id: d.machinelocation?.[0]?._id,
          taluka: d.taluka,
          district: d.district,
          state: d.state,
        });

        const locs = locationRes.data || [];
        setLocations(locs);
        setFilteredLocations(locs);
      } catch (err: any) {
        Alert.alert("Error", "Failed to load machine data");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id]);

  const toggleMulti = (key: "crops" | "machineType", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) return Alert.alert("Error", "Machine name is required");
    if (!/^\d{10}$/.test(form.ownerPhoneno)) return Alert.alert("Error", "Phone must be 10 digits");
    if (!form.crops.length || !form.machineType.length)
      return Alert.alert("Error", "Select at least one crop and machine type");
    if (!selectedLocation) return Alert.alert("Error", "Please select a location");

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      await api.put(
        `${BASE_URL}/machine/updatedetails/${id}`,
        { ...form, locationId: selectedLocation._id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      Alert.alert("Updated!", "Machine listing saved successfully ✅", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Sub-components ──────────────────────────────────────────────────────
  const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle && <Text style={s.sectionSub}>{subtitle}</Text>}
      </View>
    </View>
  );

  const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <Text style={s.label}>
      {label}{required && <Text style={{ color: C.accent }}> *</Text>}
    </Text>
  );

  const PricingCard = ({ icon, label, hint, value, onChangeText }: {
    icon: string; label: string; hint?: string;
    value: string; onChangeText: (v: string) => void;
  }) => (
    <View style={s.pricingCard}>
      <Text style={s.pricingIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.pricingLabel}>{label}</Text>
        {hint && <Text style={s.pricingHint}>{hint}</Text>}
      </View>
      <TextInput
        style={s.pricingInput}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={C.muted}
        textAlign="right"
      />
    </View>
  );

  const TypeChip = ({ value }: { value: string }) => {
    const active = form.machineType.includes(value);
    return (
      <TouchableOpacity
        style={[s.chip, active && s.chipActive]}
        onPress={() => toggleMulti("machineType", value)}
        activeOpacity={0.75}
      >
        <Text style={s.chipIcon}>{TYPE_ICONS[value]}</Text>
        <Text style={[s.chipText, active && s.chipTextActive]}>{TYPE_LABELS[value]}</Text>
        {active && <Text style={s.chipCheck}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const CropTile = ({ name }: { name: string }) => {
    const active = form.crops.includes(name);
    return (
      <TouchableOpacity
        style={[s.cropTile, active && s.cropTileActive]}
        onPress={() => toggleMulti("crops", name)}
        activeOpacity={0.75}
      >
        <Text style={s.cropIcon}>{CROP_ICONS[name]}</Text>
        <Text style={[s.cropName, active && s.cropNameActive]}>{name}</Text>
        {active && (
          <View style={s.cropCheck}>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (fetching) {
    return (
      <View style={s.loadingScreen}>
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingTitle}>Loading machine data…</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* Saving overlay */}
      {saving && (
        <View style={s.overlay}>
          <View style={s.overlayCard}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.overlayTitle}>Saving changes…</Text>
            <Text style={s.overlaySub}>Please wait</Text>
          </View>
        </View>
      )}

      <ScrollView style={s.screen} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.headerBack} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>EDITING LISTING</Text>
          </View>
          <Text style={s.headerTitle}>Update{"\n"}Machine</Text>
          <Text style={s.headerSub}>Edit the details below and save your changes</Text>
        </View>

        {/* ── Location Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📍" title="Location" subtitle="Change taluka if needed" />

          <FieldLabel label="Taluka" required />
          <TouchableOpacity
            style={[s.dropdownBtn, selectedLocation && s.dropdownBtnFilled]}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.8}
          >
            <Text style={[s.dropdownText, !form.taluka && { color: C.muted }]}>
              {form.taluka || "Select Taluka"}
            </Text>
            <Text style={s.dropdownChevron}>›</Text>
          </TouchableOpacity>

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FieldLabel label="District" />
              <TextInput style={[s.input, s.inputDisabled]} value={form.district}
                editable={false} placeholder="Auto-filled" placeholderTextColor={C.muted} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <FieldLabel label="State" />
              <TextInput style={[s.input, s.inputDisabled]} value={form.state}
                editable={false} placeholder="Auto-filled" placeholderTextColor={C.muted} />
            </View>
          </View>
        </View>

        {/* ── Basic Details Card ── */}
        <View style={s.card}>
          <SectionHeader icon="🚜" title="Machine Details" subtitle="Name and contact" />

          <FieldLabel label="Machine Name" required />
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. John Deere 5050D"
            placeholderTextColor={C.muted}
          />

          <FieldLabel label="Owner Phone" required />
          <View style={s.phoneRow}>
            <View style={s.phonePrefix}>
              <Text style={s.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              keyboardType="number-pad"
              maxLength={10}
              value={form.ownerPhoneno}
              onChangeText={(v) => setForm({ ...form, ownerPhoneno: v.replace(/[^0-9]/g, "") })}
              placeholder="9876543210"
              placeholderTextColor={C.muted}
            />
          </View>
        </View>

        {/* ── Pricing Card ── */}
        <View style={s.card}>
          <SectionHeader icon="💰" title="Pricing" subtitle="Update your rates" />
          <PricingCard
            icon="📅" label="Price Per Day" hint="₹ / acre"
            value={form.pricePerDay}
            onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
          />
          <PricingCard
            icon="🛣️" label="Delivery Charge" hint="₹ / km"
            value={form.deliveryChargePerKm}
            onChangeText={(v) => setForm({ ...form, deliveryChargePerKm: v })}
          />
          <PricingCard
            icon="🌿" label="Max Coverage" hint="acres / day"
            value={form.maxAcreCoverage}
            onChangeText={(v) => setForm({ ...form, maxAcreCoverage: v })}
          />
        </View>

        {/* ── Machine Type Card ── */}
        <View style={s.card}>
          <SectionHeader icon="⚙️" title="Machine Type" subtitle="Select all that apply" />
          <View style={s.chipRow}>
            {MACHINE_TYPES.map((v) => <TypeChip key={v} value={v} />)}
          </View>
          {form.machineType.length > 0 && (
            <View style={s.selectionPill}>
              <Text style={s.selectionPillText}>
                {form.machineType.length} type{form.machineType.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}
        </View>

        {/* ── Crops Card ── */}
        <View style={s.card}>
          <SectionHeader icon="🌾" title="Supported Crops" subtitle="Which crops does it work with?" />
          <View style={s.cropGrid}>
            {CROPS.map((c) => <CropTile key={c} name={c} />)}
          </View>
        </View>

        {/* ── Description Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📝" title="Description" subtitle="Any extra details" />
          <TextInput
            style={s.textarea}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="e.g. Well-maintained tractor, GPS-enabled, available all season…"
            placeholderTextColor={C.muted}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} / 500</Text>
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity style={s.saveBtn} onPress={handleUpdate} activeOpacity={0.85} disabled={saving}>
          <Text style={s.saveBtnText}>Save Changes</Text>
          <Text style={s.saveBtnArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={s.cancelBtn}>
          <Text style={s.cancelText}>Discard Changes</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ─── Location Modal (same pattern as AddLabourScreen) ────────────── */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Select Taluka</Text>
          <Text style={s.modalSub}>Search by taluka name</Text>

          <View style={s.searchRow}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              placeholder="e.g. Pune, Nashik…"
              value={search}
              onChangeText={setSearch}
              style={s.searchInput}
              placeholderTextColor={C.muted}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ color: C.muted, fontSize: 18, paddingHorizontal: 8 }}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredLocations.length === 0 && (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 32 }}>🗺️</Text>
              <Text style={s.emptyText}>No results found</Text>
            </View>
          )}

          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item._id}
            initialNumToRender={15}
            keyboardShouldPersistTaps="handled"
            style={{ marginTop: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  s.locationRow,
                  selectedLocation?._id === item._id && s.locationRowActive,
                ]}
                onPress={() => {
                  setSelectedLocation(item);
                  setForm({ ...form, taluka: item.taluka, district: item.district, state: item.state });
                  setShowLocationModal(false);
                }}
              >
                <View style={s.locationDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.locationTitle}>{item.taluka}</Text>
                  <Text style={s.locationSub}>{item.district}, {item.state}</Text>
                </View>
                {selectedLocation?._id === item._id && (
                  <Text style={{ color: C.primary, fontWeight: "700" }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 100 },

  loadingScreen: { flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" },
  loadingCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 32,
    alignItems: "center", gap: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 6,
  },
  loadingTitle: { fontSize: 15, fontWeight: "700", color: C.ink },

  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  overlayCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 28,
    alignItems: "center", gap: 8, minWidth: 200,
  },
  overlayTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  overlaySub: { fontSize: 12, color: C.muted },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 32, paddingHorizontal: 24,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 32, fontWeight: "800", lineHeight: 38, marginBottom: 6 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 20,
    marginHorizontal: 16, marginTop: 16, padding: 20,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  sectionIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  sectionSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  label: { fontSize: 13, fontWeight: "600", color: C.ink, marginBottom: 6 },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.ink, marginBottom: 14,
  },
  inputDisabled: { backgroundColor: "#F5F3F0", color: C.muted },
  row: { flexDirection: "row" },

  dropdownBtn: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  dropdownBtnFilled: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  dropdownText: { fontSize: 15, color: C.ink, fontWeight: "500" },
  dropdownChevron: { fontSize: 22, color: C.muted, marginTop: -2 },

  phoneRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  phonePrefix: {
    backgroundColor: C.primaryFaint, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "700", color: C.primary },

  pricingCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 10, gap: 10,
  },
  pricingIcon: { fontSize: 22 },
  pricingLabel: { fontSize: 14, fontWeight: "600", color: C.ink },
  pricingHint: { fontSize: 11, color: C.muted, marginTop: 1 },
  pricingInput: {
    width: 90, backgroundColor: C.primaryFaint, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 16, fontWeight: "700", color: C.primary,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 50,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipIcon: { fontSize: 15 },
  chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
  chipTextActive: { color: "#fff" },
  chipCheck: { color: "#fff", fontSize: 12, fontWeight: "800" },
  selectionPill: {
    marginTop: 14, alignSelf: "flex-start",
    backgroundColor: C.accentLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  selectionPillText: { color: C.accent, fontSize: 12, fontWeight: "700" },

  cropGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cropTile: {
    width: "30%", alignItems: "center", paddingVertical: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.inputBg, position: "relative",
  },
  cropTileActive: { backgroundColor: C.primaryFaint, borderColor: C.primary },
  cropIcon: { fontSize: 26, marginBottom: 6 },
  cropName: { fontSize: 12, fontWeight: "600", color: C.muted },
  cropNameActive: { color: C.primary },
  cropCheck: {
    position: "absolute", top: 7, right: 7,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.primary, justifyContent: "center", alignItems: "center",
  },

  textarea: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, padding: 14, fontSize: 14, color: C.ink,
    minHeight: 100, lineHeight: 22,
  },
  charCount: { fontSize: 11, color: C.muted, textAlign: "right", marginTop: 6 },

  saveBtn: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    backgroundColor: C.primary, marginHorizontal: 16, marginTop: 28,
    paddingVertical: 18, borderRadius: 18,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  saveBtnArrow: { color: "#fff", fontSize: 20, marginLeft: 10, fontWeight: "700" },
  cancelBtn: { alignItems: "center", marginTop: 14, paddingVertical: 10 },
  cancelText: { color: C.muted, fontSize: 13, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40, maxHeight: "80%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: "center", marginBottom: 18,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: C.ink, marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.muted, marginBottom: 16 },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 12, marginBottom: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: { color: C.muted, fontSize: 14, marginTop: 8 },
  locationRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F0EDE9", gap: 12,
  },
  locationRowActive: { backgroundColor: C.primaryFaint, marginHorizontal: -20, paddingHorizontal: 20 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  locationTitle: { fontSize: 15, fontWeight: "600", color: C.ink },
  locationSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});