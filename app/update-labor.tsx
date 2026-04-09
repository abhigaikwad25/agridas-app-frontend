// app/update-labor-provider.tsx
import { BASE_URL } from "@/constants/api";
import { getToken } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

const CROPS = ["Rice", "Cotton", "Wheat", "Soybean", "Sugarcane"];
const CROP_ICONS: Record<string, string> = {
  Rice: "🌾", Cotton: "🌿", Wheat: "🌻", Soybean: "🫘", Sugarcane: "🎋",
};

enum LabourSkill {
  Harvesting = "harvesting",
  Sowing = "sowing",
  Spraying = "spraying",
  Driver = "driver",
  DroneOperator = "drone_operator",
}

const SKILL_ICONS: Record<string, string> = {
  harvesting: "🌾", sowing: "🌱", spraying: "💧", driver: "🚜", drone_operator: "🚁",
};
const SKILL_LABELS: Record<string, string> = {
  harvesting: "Harvesting", sowing: "Sowing", spraying: "Spraying",
  driver: "Driver", drone_operator: "Drone Op.",
};

const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#393E46",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  inputBg: "#FEFCFB",
  success: "#2D6A4F",
  successLight: "#E8F5E9",
  shadow: "rgba(107,39,55,0.10)",
};

export default function UpdateLaborProviderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const [form, setForm] = useState({
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    description: "",
    ownerPhoneno: "",
    numberOfWorkers: "",
    pricePerDay: "",
    pricePerHour: "",
    deliveryChargePerKm: "",
    crops: [] as string[],
    skills: [] as string[],
  });

  useEffect(() => {
    if (!search) { setFilteredLocations(locations); return; }
    const lower = search.toLowerCase();
    setFilteredLocations(locations.filter((l) => l.taluka.toLowerCase().includes(lower)));
  }, [search, locations]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const [entryRes, locationRes] = await Promise.all([
          api.get(`${BASE_URL}/laborProvider/details/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`${BASE_URL}/location/list`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const d = entryRes.data;
        setForm({
          taluka: d.taluka || "",
          district: d.district || "",
          state: d.state || "",
          pincode: d.pincode || "",
          description: d.description || "",
          ownerPhoneno: d.ownerPhoneno || "",
          numberOfWorkers: String(d.numberOfWorkers || ""),
          pricePerDay: String(d.pricePerDay || ""),
          pricePerHour: String(d.pricePerHour || ""),
          deliveryChargePerKm: String(d.deliveryChargePerKm || ""),
          crops: d.crops || [],
          skills: d.skills || [],
        });
        setIsActive(d.isActive !== false);
        setSelectedLocation({
          _id: d.laborlocation?.[0]?._id,
          taluka: d.taluka,
          district: d.district,
          state: d.state,
        });
        const locs = locationRes.data || [];
        setLocations(locs);
        setFilteredLocations(locs);
      } catch (err: any) {
        Alert.alert("Error", "Failed to load labor provider data");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id]);

  const toggleMulti = (key: "skills" | "crops", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleUpdate = async () => {
    if (!selectedLocation) return Alert.alert("Error", "Please select a location");
    if (!/^\d{10}$/.test(form.ownerPhoneno)) return Alert.alert("Error", "Phone must be 10 digits");
    if (!form.skills.length) return Alert.alert("Error", "Select at least one skill");
    if (!form.crops.length) return Alert.alert("Error", "Select at least one crop");

    setSaving(true);
    try {
      const token = await getToken();
      await api.put(
        `${BASE_URL}/laborProvider/updatedetails/${id}`,
        {
          taluka: form.taluka,
          district: form.district,
          state: form.state,
          pincode: form.pincode,
          description: form.description,
          ownerPhoneno: form.ownerPhoneno,
          numberOfWorkers: Number(form.numberOfWorkers),
          pricePerDay: Number(form.pricePerDay),
          pricePerHour: form.pricePerHour ? Number(form.pricePerHour) : undefined,
          deliveryChargePerKm: Number(form.deliveryChargePerKm),
          skills: form.skills,
          crops: form.crops,
          locationId: selectedLocation._id,
          isActive,
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      Alert.alert("Updated!", "Labor provider listing saved successfully ✅", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Sub-components ───────────────────────────────────────────────────────
  const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}><Text style={s.sectionIcon}>{icon}</Text></View>
      <View>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle && <Text style={s.sectionSub}>{subtitle}</Text>}
      </View>
    </View>
  );

  const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
    <Text style={s.label}>{label}{required && <Text style={{ color: C.accent }}> *</Text>}</Text>
  );

  const PricingCard = ({ icon, label, value, onChangeText, hint }: {
    icon: string; label: string; value: string; onChangeText: (v: string) => void; hint?: string;
  }) => (
    <View style={s.pricingCard}>
      <Text style={s.pricingIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.pricingLabel}>{label}</Text>
        {hint && <Text style={s.pricingHint}>{hint}</Text>}
      </View>
      <TextInput
        style={s.pricingInput} keyboardType="number-pad" value={value}
        onChangeText={onChangeText} placeholder="0" placeholderTextColor={C.muted} textAlign="right"
      />
    </View>
  );

  const SkillChip = ({ value }: { value: string }) => {
    const active = form.skills.includes(value);
    return (
      <TouchableOpacity style={[s.skillChip, active && s.skillChipActive]}
        onPress={() => toggleMulti("skills", value)} activeOpacity={0.75}>
        <Text style={s.skillChipIcon}>{SKILL_ICONS[value]}</Text>
        <Text style={[s.skillChipText, active && s.skillChipTextActive]}>{SKILL_LABELS[value]}</Text>
        {active && <Text style={s.skillCheck}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const CropTile = ({ name }: { name: string }) => {
    const active = form.crops.includes(name);
    return (
      <TouchableOpacity style={[s.cropTile, active && s.cropTileActive]}
        onPress={() => toggleMulti("crops", name)} activeOpacity={0.75}>
        <Text style={s.cropIcon}>{CROP_ICONS[name]}</Text>
        <Text style={[s.cropName, active && s.cropNameActive]}>{name}</Text>
        {active && (
          <View style={s.cropCheckDot}>
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
          <Text style={s.loadingTitle}>Loading listing data…</Text>
        </View>
      </View>
    );
  }

  return (
    <>
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
          <Text style={s.headerTitle}>Update Labour{"\n"}Provider</Text>
          <Text style={s.headerSub}>Edit the details below and save your changes</Text>
        </View>

        {/* ── Listing Status Card ── */}
        <View style={s.card}>
          <SectionHeader icon="✅" title="Listing Status" subtitle="Control visibility to farmers" />
          <TouchableOpacity
            style={[s.availabilityRow, isActive ? s.availabilityActive : s.availabilityInactive]}
            onPress={() => setIsActive((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={s.availabilityLeft}>
              <Text style={s.availabilityIcon}>{isActive ? "🟢" : "🔴"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.availabilityTitle, isActive ? s.availabilityTitleActive : s.availabilityTitleInactive]}>
                  {isActive ? "Active — Accepting Bookings" : "Inactive — Not Accepting Bookings"}
                </Text>
                <Text style={s.availabilitySub}>
                  {isActive ? "Farmers can see and book your listing" : "Your listing is hidden from farmers"}
                </Text>
              </View>
            </View>
            <View style={[s.checkbox, isActive && s.checkboxChecked]}>
              {isActive && <Text style={s.checkboxTick}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Location Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📍" title="Location Details" subtitle="Where are the workers based?" />
          <FieldLabel label="Taluka" required />
          <TouchableOpacity
            style={[s.dropdownBtn, selectedLocation && s.dropdownBtnFilled]}
            onPress={() => setShowLocationModal(true)} activeOpacity={0.8}
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
          <FieldLabel label="Pincode" />
          <TextInput
            style={s.input} keyboardType="number-pad" value={form.pincode}
            onChangeText={(v) => setForm({ ...form, pincode: v })}
            placeholder="e.g. 400001" placeholderTextColor={C.muted} maxLength={6}
          />
        </View>

        {/* ── Contact Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📞" title="Contact Details" />
          <FieldLabel label="Owner Phone Number" required />
          <View style={s.phoneRow}>
            <View style={s.phonePrefix}>
              <Text style={s.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              keyboardType="number-pad" value={form.ownerPhoneno}
              onChangeText={(v) => setForm({ ...form, ownerPhoneno: v.replace(/[^0-9]/g, "") })}
              placeholder="9876543210" placeholderTextColor={C.muted} maxLength={10}
            />
          </View>
          <View style={[s.row, { marginTop: 14 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FieldLabel label="No. of Workers" required />
              <View style={s.workerCountRow}>
                <TouchableOpacity style={s.counterBtn}
                  onPress={() => setForm({ ...form, numberOfWorkers: String(Math.max(0, Number(form.numberOfWorkers) - 1)) })}>
                  <Text style={s.counterBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.counterInput} keyboardType="number-pad" value={form.numberOfWorkers}
                  onChangeText={(v) => setForm({ ...form, numberOfWorkers: v })}
                  placeholder="0" placeholderTextColor={C.muted} textAlign="center"
                />
                <TouchableOpacity style={s.counterBtn}
                  onPress={() => setForm({ ...form, numberOfWorkers: String(Number(form.numberOfWorkers) + 1) })}>
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── Pricing Card ── */}
        <View style={s.card}>
          <SectionHeader icon="💰" title="Pricing" subtitle="Update rates for your workers" />
          <PricingCard icon="📅" label="Per Day Rate" hint="₹ / day"
            value={form.pricePerDay} onChangeText={(v) => setForm({ ...form, pricePerDay: v })} />
          <PricingCard icon="⏱️" label="Per Hour Rate" hint="₹ / hr (optional)"
            value={form.pricePerHour} onChangeText={(v) => setForm({ ...form, pricePerHour: v })} />
          <PricingCard icon="🛣️" label="Travel Charge" hint="₹ / km"
            value={form.deliveryChargePerKm} onChangeText={(v) => setForm({ ...form, deliveryChargePerKm: v })} />
        </View>

        {/* ── Skills Card ── */}
        <View style={s.card}>
          <SectionHeader icon="🛠️" title="Skills" subtitle="Select all that apply" />
          <View style={s.skillGrid}>
            {Object.values(LabourSkill).map((v) => <SkillChip key={v} value={v} />)}
          </View>
          {form.skills.length > 0 && (
            <View style={s.selectionPill}>
              <Text style={s.selectionPillText}>
                {form.skills.length} skill{form.skills.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}
        </View>

        {/* ── Crops Card ── */}
        <View style={s.card}>
          <SectionHeader icon="🌾" title="Supported Crops" subtitle="Which crops can your team work with?" />
          <View style={s.cropGrid}>
            {CROPS.map((c) => <CropTile key={c} name={c} />)}
          </View>
        </View>

        {/* ── Description Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📝" title="Description" subtitle="Any additional info about your team" />
          <TextInput
            style={s.textarea} multiline numberOfLines={4} value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="e.g. Experienced team of harvesters, available throughout Kharif season..."
            placeholderTextColor={C.muted} textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} / 500</Text>
        </View>

        {/* ── Save / Cancel ── */}
        <TouchableOpacity style={s.saveBtn} onPress={handleUpdate} activeOpacity={0.85} disabled={saving}>
          <Text style={s.saveBtnText}>Save Changes</Text>
          <Text style={s.saveBtnArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={s.cancelBtn}>
          <Text style={s.cancelText}>Discard Changes</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ─── Location Modal ───────────────────────────────────────────────── */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowLocationModal(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Select Taluka</Text>
          <Text style={s.modalSub}>Search by taluka name</Text>
          <View style={s.searchRow}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput placeholder="e.g. Pune, Nashik…" value={search} onChangeText={setSearch}
              style={s.searchInput} placeholderTextColor={C.muted} autoFocus />
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
            data={filteredLocations} keyExtractor={(item) => item._id}
            initialNumToRender={15} keyboardShouldPersistTaps="handled" style={{ marginTop: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.locationRow, selectedLocation?._id === item._id && s.locationRowActive]}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 100 },

  loadingScreen: { flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" },
  loadingCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 32, alignItems: "center", gap: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 6,
  },
  loadingTitle: { fontSize: 15, fontWeight: "700", color: C.ink },

  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  overlayCard: { backgroundColor: C.card, borderRadius: 20, padding: 28, alignItems: "center", gap: 8, minWidth: 200 },
  overlayTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  overlaySub: { fontSize: 12, color: C.muted },

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
    backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 32, fontWeight: "800", lineHeight: 38, marginBottom: 6 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  card: {
    backgroundColor: C.card, borderRadius: 20, marginHorizontal: 16, marginTop: 16, padding: 20,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  sectionIconWrap: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  sectionSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  // Availability
  availabilityRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, borderWidth: 1.5, padding: 14,
  },
  availabilityActive: { backgroundColor: C.successLight, borderColor: "#A5D6A7" },
  availabilityInactive: { backgroundColor: "#FFF3F3", borderColor: "#FFCDD2" },
  availabilityLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  availabilityIcon: { fontSize: 22 },
  availabilityTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  availabilityTitleActive: { color: C.success },
  availabilityTitleInactive: { color: "#C0392B" },
  availabilitySub: { fontSize: 12, color: C.muted },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.border,
    backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
  },
  checkboxChecked: { backgroundColor: C.success, borderColor: C.success },
  checkboxTick: { color: "#fff", fontSize: 13, fontWeight: "800" },

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
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
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

  workerCountRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12, overflow: "hidden",
  },
  counterBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.primaryFaint },
  counterBtnText: { fontSize: 20, fontWeight: "700", color: C.primary },
  counterInput: {
    flex: 1, fontSize: 18, fontWeight: "700", color: C.ink,
    paddingVertical: 10, backgroundColor: C.inputBg,
  },

  pricingCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, gap: 10,
  },
  pricingIcon: { fontSize: 22 },
  pricingLabel: { fontSize: 14, fontWeight: "600", color: C.ink },
  pricingHint: { fontSize: 11, color: C.muted, marginTop: 1 },
  pricingInput: {
    width: 90, backgroundColor: C.primaryFaint, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 16, fontWeight: "700", color: C.primary, textAlign: "right",
  },

  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skillChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 50,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg,
  },
  skillChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  skillChipIcon: { fontSize: 15 },
  skillChipText: { fontSize: 13, fontWeight: "600", color: C.muted },
  skillChipTextActive: { color: "#fff" },
  skillCheck: { color: "#fff", fontSize: 12, fontWeight: "800" },
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
  cropCheckDot: {
    position: "absolute", top: 7, right: 7,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.primary, justifyContent: "center", alignItems: "center",
  },

  textarea: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, padding: 14, fontSize: 14, color: C.ink, minHeight: 100, lineHeight: 22,
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