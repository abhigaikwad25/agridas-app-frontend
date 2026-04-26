import { BASE_URL } from "@/constants/api";
import { useLang } from "@/contexts/LanguageContext";
import { getLocationList, getToken } from "@/services/authStorage";
import MapPickerModal from "@/components/MapPickerModal";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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

const CROPS = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane"];
const CROP_ICONS: Record<string, string> = {
  Wheat: "🌻",
  Rice: "🌾",
  Cotton: "🌿",
  Soybean: "🫘",
  Sugarcane: "🎋",
};

const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#393E46",
  primaryLight: "#9B3E52",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  inputBg: "#FEFCFB",
  shadow: "rgba(107,39,55,0.10)",
  success: "#2D6A4F",
};

// ─── Upload Stage Config ───────────────────────────────────────────────────
const UPLOAD_STAGES = [
  { icon: "📋", label: "Preparing your listing…", sub: "Getting everything ready" },
  { icon: "🖼️", label: "Uploading photos…", sub: "This may take a moment on slow networks" },
  { icon: "📍", label: "Saving location…", sub: "Almost done!" },
  { icon: "✅", label: "Registering machine…", sub: "Just a few more seconds" },
];

// ─── Animated Upload Overlay ───────────────────────────────────────────────
function UploadOverlay({ visible }: { visible: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stageAnim = useRef(new Animated.Value(1)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (!visible) {
      progressAnim.setValue(0);
      setStageIdx(0);
      return;
    }

    // Pulse ring
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulse.start();

    // Bouncing dots
    const makeDotLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -8, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
          Animated.delay(600),
        ])
      );
    const d1 = makeDotLoop(dotAnim1, 0);
    const d2 = makeDotLoop(dotAnim2, 180);
    const d3 = makeDotLoop(dotAnim3, 360);
    d1.start(); d2.start(); d3.start();

    // Progress bar over ~8 seconds (realistic for slow net)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 8000,
      useNativeDriver: false,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();

    // Stage cycling
    const stageTimer = setInterval(() => {
      Animated.timing(stageAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setStageIdx((i) => Math.min(i + 1, UPLOAD_STAGES.length - 1));
        Animated.timing(stageAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2200);

    return () => {
      pulse.stop();
      d1.stop(); d2.stop(); d3.stop();
      clearInterval(stageTimer);
    };
  }, [visible]);

  if (!visible) return null;

  const stage = UPLOAD_STAGES[stageIdx];
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["5%", "95%"] });

  return (
    <View style={ol.overlay}>
      <View style={ol.backdrop} />
      <View style={ol.sheet}>
        {/* Pulsing icon ring */}
        <View style={ol.iconWrap}>
          <Animated.View style={[ol.ring, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.Text style={[ol.stageIcon, { opacity: stageAnim }]}>{stage.icon}</Animated.Text>
        </View>

        {/* Stage label */}
        <Animated.View style={{ opacity: stageAnim, alignItems: "center" }}>
          <Text style={ol.stageLabel}>{stage.label}</Text>
          <Text style={ol.stageSub}>{stage.sub}</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={ol.progressTrack}>
          <Animated.View style={[ol.progressFill, { width: progressWidth }]} />
          <View style={ol.progressShimmer} />
        </View>

        {/* Bouncing dots */}
        <View style={ol.dotsRow}>
          {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
            <Animated.View key={i} style={[ol.dot, { transform: [{ translateY: anim }] }]} />
          ))}
        </View>

        <Text style={ol.footerNote}>📶 Large photos may take longer on slow networks — please keep the app open</Text>
      </View>
    </View>
  );
}

// ─── Pricing Card ──────────────────────────────────────────────────────────
function PricingCard({
  icon, label, hint, value, onChangeText,
}: {
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

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function AddMachineScreen() {
  const { t } = useLang();

  const USE_CASE_LABELS: Record<string, string> = {
    harvesting: t("addMachine.harvesting"),
    sowing: t("addMachine.sowing"),
    transport: t("addMachine.transport"),
    drone: t("addMachine.drone"),
  };

  const [images, setImages] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Map picker state
  const [mapVisible, setMapVisible] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("");

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
        Alert.alert(t("addMachine.permissionRequired"), t("addMachine.permissionMsg"));
    })();
  }, []);

  const pickImage = async () => {
    Alert.alert(t("addMachine.uploadImage"), t("addMachine.chooseOption"), [
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
          const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.7 });
          if (!res.canceled) setImages((p) => [...p, ...res.assets]);
        },
      },
      { text: t("common.cancel"), style: "cancel" },
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
      crops: [],
      machineType: [],
    });
    setSelectedLocation(null);
    setImages([]);
    setCoords(null);
    setAddress("");
  };

  const submitMachine = async () => {
    if (loading) return;

    // Validations
    if (!selectedLocation)
      return Alert.alert(t("common.error"), t("addMachine.selectLocation"));

    if (!coords || !address)
      return Alert.alert(
        t("common.error"),
        "Please select exact location on map before submitting."
      );

    const required: [keyof typeof form, string][] = [
      ["name", t("addMachine.machineName")],
      ["pincode", t("addMachine.pincode")],
      ["pricePerDay", t("addMachine.pricePerDay")],
      ["ownerPhoneno", t("addMachine.ownerPhone")],
      ["maxAcreCoverage", t("addMachine.maxAcre")],
    ];
    for (const [key, label] of required) {
      if (!form[key])
        return Alert.alert(t("common.error"), `Please fill ${label}`);
    }
    if (!form.crops.length || !form.machineType.length)
      return Alert.alert(t("common.error"), t("addMachine.selectCropType"));
    if (images.length < 2)
      return Alert.alert(t("common.error"), t("addMachine.uploadMin"));

    try {
      setLoading(true);
      const token = await getToken();
      const data = new FormData();

      // Scalar form fields
      Object.entries(form).forEach(([k, v]: any) => {
        if (!Array.isArray(v)) data.append(k, String(v));
      });

      // Arrays
      data.append("machineType", JSON.stringify(form.machineType));
      data.append("crops", JSON.stringify(form.crops));

      // Location
      data.append("locationId", selectedLocation._id);

      // Coordinates as flat strings (backend handles Point construction)
      data.append("latitude", String(coords.latitude));
      data.append("longitude", String(coords.longitude));

      // Address from map picker
      data.append("address", address);

      // Images
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
      if (!res.ok) throw new Error(result.message || t("addMachine.uploadFailed"));

      Alert.alert(t("common.success"), t("addMachine.success"));
      resetForm();
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message || t("addMachine.uploadFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ─── Sub-components ──────────────────────────────────────────────────────
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
      {label}
      {required && <Text style={{ color: C.accent }}> *</Text>}
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
        <Text style={[s.skillChipText, active && s.skillChipTextActive]}>{USE_CASE_LABELS[value]}</Text>
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Animated upload overlay */}
      <UploadOverlay visible={loading} />

      <ScrollView
        style={s.screen}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{t("addMachine.badge")}</Text>
          </View>
          <Text style={s.headerTitle}>{t("addMachine.title")}</Text>
          <Text style={s.headerSub}>{t("addMachine.subtitle")}</Text>
        </View>

        {/* ── Location Card ── */}
        <View style={s.card}>
          <SectionHeader
            icon="📍"
            title={t("addMachine.locationDetails")}
            subtitle={t("addMachine.locationSub")}
          />

          <FieldLabel label={t("addMachine.taluka")} required />
          <TouchableOpacity
            style={[s.dropdownBtn, selectedLocation && s.dropdownBtnFilled]}
            onPress={() => { fetchLocations(); setShowLocationModal(true); }}
            activeOpacity={0.8}
          >
            <Text style={[s.dropdownText, !form.taluka && { color: C.muted }]}>
              {form.taluka || t("addMachine.selectTaluka")}
            </Text>
            <Text style={s.dropdownChevron}>›</Text>
          </TouchableOpacity>

          {/* Map picker button */}
          <TouchableOpacity
            style={[s.mapBtn, coords && s.mapBtnFilled]}
            onPress={() => setMapVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={s.mapBtnIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.mapBtnText, coords && { color: "#fff" }]}>
                {coords ? "Location Selected on Map" : "Select Exact Location on Map"}
              </Text>
              {coords ? (
                <Text style={s.mapBtnAddr} numberOfLines={1}>{address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}</Text>
              ) : (
                <Text style={[s.mapBtnAddr, { color: C.muted }]}>Required *</Text>
              )}
            </View>
            {coords ? (
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>✓</Text>
            ) : (
              <Text style={{ color: C.primary, fontSize: 20, fontWeight: "300" }}>›</Text>
            )}
          </TouchableOpacity>

          {/* Auto-filled district / state */}
          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FieldLabel label={t("addMachine.district")} />
              <TextInput style={[s.input, s.inputDisabled]} value={form.district} editable={false} placeholder={t("addMachine.autoFilled")} placeholderTextColor={C.muted} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <FieldLabel label={t("addMachine.state")} />
              <TextInput style={[s.input, s.inputDisabled]} value={form.state} editable={false} placeholder={t("addMachine.autoFilled")} placeholderTextColor={C.muted} />
            </View>
          </View>

          <FieldLabel label={t("addMachine.pincode")} required />
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
          <SectionHeader icon="🚜" title={t("addMachine.machineDetails")} subtitle={t("addMachine.machineDetailsSub")} />
          <FieldLabel label={t("addMachine.machineName")} required />
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder={t("addMachine.machineNamePlaceholder")}
            placeholderTextColor={C.muted}
          />
          <FieldLabel label={t("addMachine.ownerPhone")} required />
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
          <SectionHeader icon="💰" title={t("addMachine.pricing")} subtitle={t("addMachine.pricingSub")} />
          <PricingCard
            icon="📅"
            label={t("addMachine.pricePerDay")}
            hint={t("addMachine.pricePerDayHint")}
            value={form.pricePerDay}
            onChangeText={useCallback((v: string) => setForm((f) => ({ ...f, pricePerDay: v })), [])}
          />
          <PricingCard
            icon="🛣️"
            label={t("addMachine.deliveryCharge")}
            hint={t("addMachine.deliveryChargeHint")}
            value={form.deliveryChargePerKm}
            onChangeText={useCallback((v: string) => setForm((f) => ({ ...f, deliveryChargePerKm: v })), [])}
          />
          <PricingCard
            icon="🌿"
            label={t("addMachine.maxAcre")}
            hint={t("addMachine.maxAcreHint")}
            value={form.maxAcreCoverage}
            onChangeText={useCallback((v: string) => setForm((f) => ({ ...f, maxAcreCoverage: v })), [])}
          />
        </View>

        {/* ── Machine Type Card ── */}
        <View style={s.card}>
          <SectionHeader icon="⚙️" title={t("addMachine.machineType")} subtitle={t("addMachine.machineTypeSub")} />
          <View style={s.skillGrid}>
            {Object.values(UseCase).map((v) => <MachineTypeChip key={v} value={v} />)}
          </View>
          {form.machineType.length > 0 && (
            <View style={s.selectionPill}>
              <Text style={s.selectionPillText}>
                {form.machineType.length}{" "}
                {form.machineType.length > 1 ? t("addMachine.typesSelected") : t("addMachine.typeSelected")}
              </Text>
            </View>
          )}
        </View>

        {/* ── Crops Card ── */}
        <View style={s.card}>
          <SectionHeader icon="🌾" title={t("addMachine.supportedCrops")} subtitle={t("addMachine.supportedCropsSub")} />
          <View style={s.cropGrid}>
            {CROPS.map((c) => <CropTile key={c} name={c} />)}
          </View>
        </View>

        {/* ── Images Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📸" title={t("addMachine.photos")} subtitle={t("addMachine.photosSub")} />
          <TouchableOpacity style={s.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
            <Text style={s.uploadBtnIcon}>+</Text>
            <View>
              <Text style={s.uploadBtnText}>{t("addMachine.uploadPhotos")}</Text>
              <Text style={s.uploadBtnSub}>{t("addMachine.uploadPhotosSub")}</Text>
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
            <Text style={[s.imageCountText, images.length >= 2 && { color: C.success }]}>
              {images.length} / 2 {t("addMachine.photosAdded")}
            </Text>
            {images.length >= 2 && <Text style={{ color: C.success }}>✓</Text>}
          </View>
        </View>

        {/* ── Description Card ── */}
        <View style={s.card}>
          <SectionHeader icon="📝" title={t("addMachine.description")} subtitle={t("addMachine.descriptionSub")} />
          <TextInput
            style={s.textarea}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder={t("addMachine.descriptionPlaceholder")}
            placeholderTextColor={C.muted}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} / 500</Text>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity style={s.submitBtn} onPress={submitMachine} activeOpacity={0.85}>
          <Text style={s.submitText}>{t("addMachine.register")}</Text>
          <Text style={s.submitArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetForm} style={s.resetBtn}>
          <Text style={s.resetText}>{t("addMachine.clearAll")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Map Picker Modal ── */}
      <MapPickerModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={(c: { latitude: number; longitude: number }, addr: string) => {
          setCoords(c ?? null);
          setAddress(addr ?? "");
          setMapVisible(false);
        }}
      />

      {/* ── Location List Modal ── */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowLocationModal(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{t("addMachine.selectTalukaTitle")}</Text>
          <Text style={s.modalSub}>{t("addMachine.searchByTaluka")}</Text>
          <View style={s.searchRow}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              placeholder={t("addMachine.searchPlaceholder")}
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
              <Text style={s.emptyText}>{t("addMachine.noResults")}</Text>
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

// ─── Upload Overlay Styles ─────────────────────────────────────────────────
const ol = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28,25,23,0.72)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 32,
    marginHorizontal: 28,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 20,
  },
  iconWrap: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  ring: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.primary,
    opacity: 0.3,
  },
  stageIcon: { fontSize: 38 },
  stageLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
  },
  stageSub: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    marginTop: 2,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#EDE8E3",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 99,
  },
  progressShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 99,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    height: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  footerNote: {
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
});

// ─── Screen Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 100 },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 34, fontWeight: "800", lineHeight: 40, marginBottom: 8 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  sectionSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  label: { fontSize: 13, fontWeight: "600", color: C.ink, marginBottom: 6 },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.ink,
    marginBottom: 14,
  },
  inputDisabled: { backgroundColor: "#F5F3F0", color: C.muted },
  row: { flexDirection: "row" },
  dropdownBtn: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  dropdownBtnFilled: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  dropdownText: { fontSize: 15, color: C.ink, fontWeight: "500" },
  dropdownChevron: { fontSize: 22, color: C.muted, marginTop: -2 },

  // Map button
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.primaryFaint,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  mapBtnFilled: { backgroundColor: C.primary },
  mapBtnIcon: { fontSize: 22 },
  mapBtnText: { fontSize: 14, fontWeight: "700", color: C.primary },
  mapBtnAddr: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  phoneRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 0 },
  phonePrefix: {
    backgroundColor: C.primaryFaint,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "700", color: C.primary },
  pricingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
  },
  pricingIcon: { fontSize: 22 },
  pricingLabel: { fontSize: 14, fontWeight: "600", color: C.ink },
  pricingHint: { fontSize: 11, color: C.muted, marginTop: 1 },
  pricingInput: {
    width: 90,
    backgroundColor: C.primaryFaint,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "700",
    color: C.primary,
  },
  skillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  skillChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  skillChipIcon: { fontSize: 15 },
  skillChipText: { fontSize: 13, fontWeight: "600", color: C.muted },
  skillChipTextActive: { color: "#fff" },
  skillCheck: { color: "#fff", fontSize: 12, fontWeight: "800" },
  selectionPill: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: C.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  selectionPillText: { color: C.accent, fontSize: 12, fontWeight: "700" },
  cropGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cropTile: {
    width: "30%",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
    position: "relative",
  },
  cropTileActive: { backgroundColor: C.primaryFaint, borderColor: C.primary },
  cropIcon: { fontSize: 26, marginBottom: 6 },
  cropName: { fontSize: 12, fontWeight: "600", color: C.muted },
  cropNameActive: { color: C.primary },
  cropCheckDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.primaryFaint,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 14,
    borderStyle: "dashed",
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  uploadBtnIcon: { fontSize: 28, fontWeight: "300", color: C.primary },
  uploadBtnText: { fontSize: 15, fontWeight: "700", color: C.primary },
  uploadBtnSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  imageWrapper: { position: "relative" },
  preview: { width: 88, height: 88, borderRadius: 12 },
  removeImgBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: C.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImgText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  imageCountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  imageCountText: { fontSize: 12, color: C.muted, fontWeight: "600" },
  textarea: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: C.ink,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: { fontSize: 11, color: C.muted, textAlign: "right", marginTop: 6 },
  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.primary,
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  submitArrow: { color: "#fff", fontSize: 20, marginLeft: 10, fontWeight: "700" },
  resetBtn: { alignItems: "center", marginTop: 16, paddingVertical: 10 },
  resetText: { color: C.muted, fontSize: 13, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: C.ink, marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.muted, marginBottom: 16 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: { color: C.muted, fontSize: 14, marginTop: 8 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F0EDE9",
    gap: 12,
  },
  locationRowActive: { backgroundColor: C.primaryFaint, marginHorizontal: -20, paddingHorizontal: 20 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  locationTitle: { fontSize: 15, fontWeight: "600", color: C.ink },
  locationSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});