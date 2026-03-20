import { useLang } from "@/contexts/LanguageContext";
import { BASE_URL } from "@/constants/api";
import { getLocationList, getToken } from "@/services/authStorage";
import { useEffect, useState } from "react";
import {
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

const CROPS = ["Rice", "Cotton", "Wheat", "Soybean", "Sugarcane"];
const CROP_ICONS: Record<string, string> = {
  Rice: "🌾",
  Cotton: "🌿",
  Wheat: "🌻",
  Soybean: "🫘",
  Sugarcane: "🎋",
};

enum LabourSkill {
  Harvesting = "harvesting",
  Sowing = "sowing",
  Spraying = "spraying",
  Driver = "driver",
  DroneOperator = "drone_operator",
}

const SKILL_ICONS: Record<string, string> = {
  harvesting: "🌾",
  sowing: "🌱",
  spraying: "💧",
  driver: "🚜",
  drone_operator: "🚁",
};

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
  success: "#2D6A4F",
  shadow: "rgba(107,39,55,0.10)",
};

export default function AddLabourScreen() {
  const { t } = useLang();

  const SKILL_LABELS: Record<string, string> = {
    harvesting: t("addLabour.harvesting"),
    sowing: t("addLabour.sowing"),
    spraying: t("addLabour.spraying"),
    driver: t("addLabour.driver"),
    drone_operator: t("addLabour.droneOp"),
  };

  const [locations, setLocations] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [search, setSearch] = useState("");

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

  const resetForm = () => {
    setForm({
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
      crops: [],
      skills: [],
    });
    setSelectedLocation(null);
  };

  useEffect(() => {
    if (!search) {
      setFilteredLocations(locations);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredLocations(
      locations.filter((l) => l.taluka.toLowerCase().includes(lower)),
    );
  }, [search, locations]);

  const fetchLocations = async () => {
    if (locations.length) return;
    const data = await getLocationList();
    setLocations(data);
    setFilteredLocations(data);
  };

  const toggleMulti = (key: "skills" | "crops", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const submitLabour = async () => {
    if (!selectedLocation) {
      Alert.alert(t("common.error"), t("addLabour.selectLocation"));
      return;
    }
    const token = await getToken();
    const payload = {
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
    };
    const res = await fetch(`${BASE_URL}/laborProvider/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) {
      Alert.alert(t("common.error"), JSON.stringify(result));
      return;
    }
    Alert.alert(t("common.success"), t("addLabour.success"));
    resetForm();
  };

  const SectionHeader = ({
    icon,
    title,
    subtitle,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
  }) => (
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

  const FieldLabel = ({
    label,
    required,
  }: {
    label: string;
    required?: boolean;
  }) => (
    <Text style={s.label}>
      {label}
      {required && <Text style={{ color: C.accent }}> *</Text>}
    </Text>
  );

  const PricingCard = ({
    icon,
    label,
    value,
    onChangeText,
    hint,
  }: {
    icon: string;
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    hint?: string;
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
      />
    </View>
  );

  const SkillChip = ({ value }: { value: string }) => {
    const active = form.skills.includes(value);
    return (
      <TouchableOpacity
        style={[s.skillChip, active && s.skillChipActive]}
        onPress={() => toggleMulti("skills", value)}
        activeOpacity={0.75}
      >
        <Text style={s.skillChipIcon}>{SKILL_ICONS[value]}</Text>
        <Text style={[s.skillChipText, active && s.skillChipTextActive]}>
          {SKILL_LABELS[value]}
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
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
              ✓
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{t("addLabour.badge")}</Text>
          </View>
          <Text style={s.headerTitle}>{t("addLabour.title")}</Text>
          <Text style={s.headerSub}>{t("addLabour.subtitle")}</Text>
        </View>

        {/* Location Card */}
        <View style={s.card}>
          <SectionHeader
            icon="📍"
            title={t("addLabour.locationDetails")}
            subtitle={t("addLabour.locationSub")}
          />
          <FieldLabel label={t("addLabour.taluka")} required />
          <TouchableOpacity
            style={[s.dropdownBtn, selectedLocation && s.dropdownBtnFilled]}
            onPress={() => {
              fetchLocations();
              setShowLocationModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={[s.dropdownText, !form.taluka && { color: C.muted }]}>
              {form.taluka || t("addLabour.selectTaluka")}
            </Text>
            <Text style={s.dropdownChevron}>›</Text>
          </TouchableOpacity>

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FieldLabel label={t("addLabour.district")} />
              <TextInput
                style={[s.input, s.inputDisabled]}
                value={form.district}
                editable={false}
                placeholder={t("addLabour.autoFilled")}
                placeholderTextColor={C.muted}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <FieldLabel label={t("addLabour.state")} />
              <TextInput
                style={[s.input, s.inputDisabled]}
                value={form.state}
                editable={false}
                placeholder={t("addLabour.autoFilled")}
                placeholderTextColor={C.muted}
              />
            </View>
          </View>

          <FieldLabel label={t("addLabour.pincode")} />
          <TextInput
            style={s.input}
            keyboardType="number-pad"
            value={form.pincode}
            onChangeText={(v) => setForm({ ...form, pincode: v })}
            placeholder="e.g. 400001"
            placeholderTextColor={C.muted}
            maxLength={6}
          />
        </View>

        {/* Contact Card */}
        <View style={s.card}>
          <SectionHeader icon="📞" title={t("addLabour.contactDetails")} />
          <FieldLabel label={t("addLabour.ownerPhone")} required />
          <View style={s.phoneRow}>
            <View style={s.phonePrefix}>
              <Text style={s.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              keyboardType="number-pad"
              value={form.ownerPhoneno}
              onChangeText={(v) => setForm({ ...form, ownerPhoneno: v })}
              placeholder="9876543210"
              placeholderTextColor={C.muted}
              maxLength={10}
            />
          </View>

          <View style={[s.row, { marginTop: 14 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FieldLabel label={t("addLabour.noOfWorkers")} required />
              <View style={s.workerCountRow}>
                <TouchableOpacity
                  style={s.counterBtn}
                  onPress={() => {
                    const n = Math.max(0, Number(form.numberOfWorkers) - 1);
                    setForm({ ...form, numberOfWorkers: String(n) });
                  }}
                >
                  <Text style={s.counterBtnText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.counterInput}
                  keyboardType="number-pad"
                  value={form.numberOfWorkers}
                  onChangeText={(v) => setForm({ ...form, numberOfWorkers: v })}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={s.counterBtn}
                  onPress={() => {
                    const n = Number(form.numberOfWorkers) + 1;
                    setForm({ ...form, numberOfWorkers: String(n) });
                  }}
                >
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Pricing Card */}
        <View style={s.card}>
          <SectionHeader
            icon="💰"
            title={t("addLabour.pricing")}
            subtitle={t("addLabour.pricingSub")}
          />
          <PricingCard
            icon="📅"
            label={t("addLabour.perDayRate")}
            hint={t("addLabour.perDayHint")}
            value={form.pricePerDay}
            onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
          />
          <PricingCard
            icon="⏱️"
            label={t("addLabour.perHourRate")}
            hint={t("addLabour.perHourHint")}
            value={form.pricePerHour}
            onChangeText={(v) => setForm({ ...form, pricePerHour: v })}
          />
          <PricingCard
            icon="🛣️"
            label={t("addLabour.travelCharge")}
            hint={t("addLabour.travelHint")}
            value={form.deliveryChargePerKm}
            onChangeText={(v) => setForm({ ...form, deliveryChargePerKm: v })}
          />
        </View>

        {/* Skills Card */}
        <View style={s.card}>
          <SectionHeader
            icon="🛠️"
            title={t("addLabour.skills")}
            subtitle={t("addLabour.skillsSub")}
          />
          <View style={s.skillGrid}>
            {Object.values(LabourSkill).map((v) => (
              <SkillChip key={v} value={v} />
            ))}
          </View>
          {form.skills.length > 0 && (
            <View style={s.selectionPill}>
              <Text style={s.selectionPillText}>
                {form.skills.length}{" "}
                {form.skills.length > 1
                  ? t("addLabour.skillsSelected")
                  : t("addLabour.skillSelected")}
              </Text>
            </View>
          )}
        </View>

        {/* Crops Card */}
        <View style={s.card}>
          <SectionHeader
            icon="🌾"
            title={t("addLabour.supportedCrops")}
            subtitle={t("addLabour.supportedCropsSub")}
          />
          <View style={s.cropGrid}>
            {CROPS.map((c) => (
              <CropTile key={c} name={c} />
            ))}
          </View>
        </View>

        {/* Description Card */}
        <View style={s.card}>
          <SectionHeader
            icon="📝"
            title={t("addLabour.description")}
            subtitle={t("addLabour.descriptionSub")}
          />
          <TextInput
            style={s.textarea}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            placeholder={t("addLabour.descriptionPlaceholder")}
            placeholderTextColor={C.muted}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} / 500</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={s.submitBtn}
          onPress={submitLabour}
          activeOpacity={0.85}
        >
          <Text style={s.submitText}>{t("addLabour.register")}</Text>
          <Text style={s.submitArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetForm} style={s.resetBtn}>
          <Text style={s.resetText}>{t("addLabour.clearAll")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Location Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{t("addLabour.selectTalukaTitle")}</Text>
          <Text style={s.modalSub}>{t("addLabour.searchByTaluka")}</Text>
          <View style={s.searchRow}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              placeholder={t("addLabour.searchPlaceholder")}
              value={search}
              onChangeText={setSearch}
              style={s.searchInput}
              placeholderTextColor={C.muted}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text
                  style={{ color: C.muted, fontSize: 18, paddingHorizontal: 8 }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {filteredLocations.length === 0 && (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 32 }}>🗺️</Text>
              <Text style={s.emptyText}>{t("addLabour.noResults")}</Text>
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
                  setForm({
                    ...form,
                    taluka: item.taluka,
                    district: item.district,
                    state: item.state,
                  });
                  setShowLocationModal(false);
                }}
              >
                <View style={s.locationDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.locationTitle}>{item.taluka}</Text>
                  <Text style={s.locationSub}>
                    {item.district}, {item.state}
                  </Text>
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
  headerBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    marginBottom: 8,
  },
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
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
  dropdownBtnFilled: {
    borderColor: C.primary,
    backgroundColor: C.primaryFaint,
  },
  dropdownText: { fontSize: 15, color: C.ink, fontWeight: "500" },
  dropdownChevron: { fontSize: 22, color: C.muted, marginTop: -2 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  phonePrefix: {
    backgroundColor: C.primaryFaint,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "700", color: C.primary },
  workerCountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  counterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.primaryFaint,
  },
  counterBtnText: { fontSize: 20, fontWeight: "700", color: C.primary },
  counterInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: C.ink,
    paddingVertical: 10,
    backgroundColor: C.inputBg,
  },
  pricingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEFCFB",
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
    textAlign: "right",
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
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  submitArrow: {
    color: "#fff",
    fontSize: 20,
    marginLeft: 10,
    fontWeight: "700",
  },
  resetBtn: { alignItems: "center", marginTop: 16, paddingVertical: 10 },
  resetText: { color: C.muted, fontSize: 13, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 4,
  },
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
  locationRowActive: {
    backgroundColor: C.primaryFaint,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  locationTitle: { fontSize: 15, fontWeight: "600", color: C.ink },
  locationSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});
