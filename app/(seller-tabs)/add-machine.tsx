import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { BASE_URL } from "@/constants/api";
import { getLocationList, getToken } from "@/services/authStorage";

const API_URL = `${BASE_URL}/machine/register`;

enum UseCase {
  Harvesting = "harvesting",
  Sowing = "sowing",
  Transport = "transport",
  Drone = "drone",
}

const USE_CASE_ICONS: Record<string, string> = {
  harvesting: "🌾",
  sowing: "🌱",
  transport: "🚛",
  drone: "🚁",
};

const USE_CASE_LABELS: Record<string, string> = {
  harvesting: "Harvesting",
  sowing: "Sowing",
  transport: "Transport",
  drone: "Drone",
};

const CROPS = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane"];

const CROP_ICONS: Record<string, string> = {
  Wheat: "🌻",
  Rice: "🌾",
  Cotton: "🌿",
  Soybean: "🫘",
  Sugarcane: "🎋",
};

// ─── Palette (same as AddLabourScreen) ───────────────────────────────────────
const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#6B2737",
  primaryLight: "#9B3E52",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  inputBg: "#FEFCFB",
  shadow: "rgba(107,39,55,0.10)",
};

// ── Standalone PricingCard — must be outside the screen component
// so React never unmounts/remounts the TextInput on re-render
function PricingCard({ icon, label, hint, value, onChangeText }: {
  icon: string; label: string; hint?: string; value: string; onChangeText: (v: string) => void;
}) {
  return (
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
}

export default function AddMachineScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    pricePerDay: "",
    ownerPhoneno: "",
    description: "",
    deliveryChargePerKm: "",
    maxAcreCoverage: "",
    crops: [] as string[],
    machineType: [] as string[],
  });

  // ── Same location logic as AddLabourScreen ──
  useEffect(() => {
    if (!search) { setFilteredLocations(locations); return; }
    const lower = search.toLowerCase();
    setFilteredLocations(locations.filter((l) => l.taluka.toLowerCase().includes(lower)));
  }, [search, locations]);

  const fetchLocations = async () => {
    if (locations.length) return;
    const data = await getLocationList();
    setLocations(data);
    setFilteredLocations(data);
  };

  useEffect(() => {
    (async () => {
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      if (!media.granted || !camera.granted)
        Alert.alert("Permission required", "Camera & gallery permission required");
    })();
  }, []);

  const pickImage = async () => {
    Alert.alert("Upload Image", "Choose option", [
      {
        text: "📷  Camera",
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!res.canceled) setImages((p) => [...p, ...res.assets]);
        },
      },
      {
        text: "🖼️  Gallery",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.7,
          });
          if (!res.canceled) setImages((p) => [...p, ...res.assets]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const toggleMulti = (key: "crops" | "machineType", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const resetForm = () => {
    setForm({
      name: "", taluka: "", district: "", state: "", pincode: "",
      pricePerDay: "", ownerPhoneno: "", description: "",
      deliveryChargePerKm: "", maxAcreCoverage: "", crops: [], machineType: [],
    });
    setSelectedLocation(null);
    setImages([]);
  };

  const submitMachine = async () => {
    if (loading) return;
    if (!selectedLocation) return Alert.alert("Error", "Please select location");

    const required: [keyof typeof form, string][] = [
      ["name", "Machine Name"],
      ["pincode", "Pincode"],
      ["pricePerDay", "Price Per Day"],
      ["ownerPhoneno", "Owner Phone"],
      ["maxAcreCoverage", "Max Acre Coverage"],
    ];
    for (const [key, label] of required) {
      if (!form[key]) return Alert.alert("Error", `Please fill ${label}`);
    }
    if (!form.crops.length || !form.machineType.length)
      return Alert.alert("Error", "Select at least one crop & machine type");
    if (images.length < 2)
      return Alert.alert("Error", "Upload at least 2 images");

    try {
      setLoading(true);
      const token = await getToken();
      const loc = await Location.getCurrentPositionAsync({});

      const data = new FormData();
      Object.entries(form).forEach(([k, v]: any) => {
        if (!Array.isArray(v)) data.append(k, String(v));
      });
      data.append("machineType", JSON.stringify(form.machineType));
      data.append("crops", JSON.stringify(form.crops));
      data.append("locationId", selectedLocation._id);
      data.append("geoLocation", JSON.stringify({
        type: "Point",
        coordinates: [loc.coords.longitude, loc.coords.latitude],
      }));
      images.forEach((img, i) =>
        data.append("images", {
          uri: img.uri,
          name: `img_${Date.now()}_${i}.jpg`,
          type: "image/jpeg",
        } as any)
      );

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      Alert.alert("Success", "Machine added successfully! 🎉");
      resetForm();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── Sub-components ──────────────────────────────────────────────────────────

  const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Text style={s.sectionIcon}>{icon}</Text>
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



  const MachineTypeChip = ({ value }: { value: string }) => {
    const active = form.machineType.includes(value);
    return (
      <TouchableOpacity
        style={[s.skillChip, active && s.skillChipActive]}
        onPress={() => toggleMulti("machineType", value)}
        activeOpacity={0.75}
      >
        <Text style={s.skillChipIcon}>{USE_CASE_ICONS[value]}</Text>
        <Text style={[s.skillChipText, active && s.skillChipTextActive]}>
          {USE_CASE_LABELS[value]}
        </Text>
        {active && <Text style={s.skillCheck}>✓</Text>}
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
          <View style={s.cropCheckDot}>
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* ── Loading Overlay ── */}
      {loading && (
        <View style={s.loaderOverlay}>
          <View style={s.loaderCard}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loaderText}>Uploading machine…</Text>
            <Text style={s.loaderSub}>Please don't close the app</Text>
          </View>
        </View>
      )}

      <ScrollView style={s.screen} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <View style={s.header}>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>MACHINE REGISTRATION</Text>
          </View>
          <Text style={s.headerTitle}>Add Your{"\n"}Machine</Text>
          <Text style={s.headerSub}>Earn by renting your agricultural equipment</Text>
        </View>

        {/* ── Location Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📍" title="Location Details" subtitle="Where is the machine based?" />

          <FieldLabel label="Taluka" required />
          <TouchableOpacity
            style={[s.dropdownBtn, selectedLocation && s.dropdownBtnFilled]}
            onPress={() => { fetchLocations(); setShowLocationModal(true); }}
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

          <FieldLabel label="Pincode" required />
          <TextInput
            style={s.input}
            keyboardType="number-pad"
            maxLength={6}
            value={form.pincode}
            onChangeText={(v) => setForm({ ...form, pincode: v.replace(/[^0-9]/g, "") })}
            placeholder="e.g. 400001"
            placeholderTextColor={C.muted}
          />
        </View>

        {/* ── Machine Details Card ── */}
        <View style={s.card}>
          <SectionHeader icon="🚜" title="Machine Details" subtitle="Basic info about your equipment" />

          <FieldLabel label="Machine Name" required />
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. John Deere 5050D"
            placeholderTextColor={C.muted}
          />

          <FieldLabel label="Owner Phone Number" required />
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
          <SectionHeader icon="💰" title="Pricing" subtitle="Set rates for your machine" />
          <PricingCard
            icon="📅" label="Price Per Day" hint="₹ / day"
            value={form.pricePerDay}
            onChangeText={useCallback((v: string) => setForm((f) => ({ ...f, pricePerDay: v })), [])}
          />
          <PricingCard
            icon="🛣️" label="Delivery Charge" hint="₹ / km"
            value={form.deliveryChargePerKm}
            onChangeText={useCallback((v: string) => setForm((f) => ({ ...f, deliveryChargePerKm: v })), [])}
          />
          <PricingCard
            icon="🌿" label="Max Acre Coverage" hint="acres / day"
            value={form.maxAcreCoverage}
            onChangeText={useCallback((v: string) => setForm((f) => ({ ...f, maxAcreCoverage: v })), [])}
          />
        </View>

        {/* ── Machine Type Card ── */}
        <View style={s.card}>
          <SectionHeader icon="⚙️" title="Machine Type" subtitle="Select all that apply" />
          <View style={s.skillGrid}>
            {Object.values(UseCase).map((v) => <MachineTypeChip key={v} value={v} />)}
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
          <SectionHeader icon="🌾" title="Supported Crops" subtitle="Which crops can your machine work with?" />
          <View style={s.cropGrid}>
            {CROPS.map((c) => <CropTile key={c} name={c} />)}
          </View>
        </View>

        {/* ── Images Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📸" title="Machine Photos" subtitle="Upload at least 2 clear photos" />

          <TouchableOpacity style={s.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
            <Text style={s.uploadBtnIcon}>+</Text>
            <View>
              <Text style={s.uploadBtnText}>Upload Photos</Text>
              <Text style={s.uploadBtnSub}>Camera or Gallery</Text>
            </View>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={s.imageGrid}>
              {images.map((img, idx) => (
                <View key={idx} style={s.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={s.preview} />
                  <TouchableOpacity
                    style={s.removeImgBtn}
                    onPress={() => setImages((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Text style={s.removeImgText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={s.imageCountRow}>
            <Text style={[s.imageCountText, images.length >= 2 && { color: "#1A7F5A" }]}>
              {images.length} / 2 minimum photos added
            </Text>
            {images.length >= 2 && <Text style={{ color: "#1A7F5A" }}>✓</Text>}
          </View>
        </View>

        {/* ── Description Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📝" title="Description" subtitle="Any extra details about your machine" />
          <TextInput
            style={s.textarea}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder="e.g. Well-maintained tractor with GPS, available during Rabi season…"
            placeholderTextColor={C.muted}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} / 500</Text>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity style={s.submitBtn} onPress={submitMachine} activeOpacity={0.85}>
          <Text style={s.submitText}>Register Machine</Text>
          <Text style={s.submitArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetForm} style={s.resetBtn}>
          <Text style={s.resetText}>Clear all fields</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ─── Location Modal (same pattern as AddLabourScreen) ──────────────── */}
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

  // ── Loader
  loaderOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
  loaderCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 28,
    alignItems: "center", gap: 10, minWidth: 200,
  },
  loaderText: { fontSize: 16, fontWeight: "700", color: C.ink },
  loaderSub: { fontSize: 12, color: C.muted },

  // ── Header
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 12,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 34, fontWeight: "800", lineHeight: 40, marginBottom: 8 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },

  // ── Card
  card: {
    backgroundColor: C.card, borderRadius: 20,
    marginHorizontal: 16, marginTop: 16, padding: 20,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },

  // ── Section Header
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  sectionIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  sectionSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  // ── Label / Input
  label: { fontSize: 13, fontWeight: "600", color: C.ink, marginBottom: 6 },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.ink, marginBottom: 14,
  },
  inputDisabled: { backgroundColor: "#F5F3F0", color: C.muted },
  row: { flexDirection: "row" },

  // ── Dropdown
  dropdownBtn: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  dropdownBtnFilled: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  dropdownText: { fontSize: 15, color: C.ink, fontWeight: "500" },
  dropdownChevron: { fontSize: 22, color: C.muted, marginTop: -2 },

  // ── Phone
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 0 },
  phonePrefix: {
    backgroundColor: C.primaryFaint, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "700", color: C.primary },

  // ── Pricing
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

  // ── Skills / Machine Type
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

  // ── Crops
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

  // ── Images
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.primaryFaint, borderWidth: 1.5,
    borderColor: C.primary, borderRadius: 14, borderStyle: "dashed",
    paddingVertical: 16, paddingHorizontal: 18, marginBottom: 16,
  },
  uploadBtnIcon: { fontSize: 28, fontWeight: "300", color: C.primary },
  uploadBtnText: { fontSize: 15, fontWeight: "700", color: C.primary },
  uploadBtnSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  imageWrapper: { position: "relative" },
  preview: { width: 88, height: 88, borderRadius: 12 },
  removeImgBtn: {
    position: "absolute", top: -6, right: -6,
    backgroundColor: C.primary, width: 22, height: 22, borderRadius: 11,
    justifyContent: "center", alignItems: "center",
  },
  removeImgText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  imageCountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  imageCountText: { fontSize: 12, color: C.muted, fontWeight: "600" },

  // ── Textarea
  textarea: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, padding: 14, fontSize: 14, color: C.ink,
    minHeight: 100, lineHeight: 22,
  },
  charCount: { fontSize: 11, color: C.muted, textAlign: "right", marginTop: 6 },

  // ── Submit
  submitBtn: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    backgroundColor: C.primary, marginHorizontal: 16, marginTop: 28,
    paddingVertical: 18, borderRadius: 18,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  submitArrow: { color: "#fff", fontSize: 20, marginLeft: 10, fontWeight: "700" },
  resetBtn: { alignItems: "center", marginTop: 16, paddingVertical: 10 },
  resetText: { color: C.muted, fontSize: 13, fontWeight: "600" },

  // ── Modal (identical to AddLabourScreen)
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