// app/search-labour.tsx
import { BASE_URL } from "@/constants/api";
import { getLocationList } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../utils/axiosinstance";

const DEFAULT_IMAGE = require("../../assets/images/laborproovider.jpg");

const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  primaryDark: "#155C30",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
  shadow: "rgba(30,127,67,0.12)",
};

const SKILL_ICONS: Record<string, string> = {
  harvesting: "🌾",
  sowing: "🌱",
  spraying: "💧",
  driver: "🚜",
  drone_operator: "🚁",
};

interface LocationType {
  _id: string;
  district: string;
  state: string;
  taluka: string;
}

interface ProviderType {
  _id: string;
  name: string;
  experience: number;
  ownerPhoneno: string;
  numberOfWorkers: number;
  pricePerDay: number;
  skills: string[];
  crops: string[];
  description: string;
  images?: string[];
}

export default function SearchLabourScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationType[]>([]);
  const [search, setSearch] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);

  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Location search filter ───────────────────────────────────────────────
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

  // ── Fetch labor providers by locationId ─────────────────────────────────
  const fetchProviders = async (locationId: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(`${BASE_URL}/laborProvider/list`, {
        params: { locationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProviders(res.data || []);
    } catch (e) {
      console.log("Error fetching labor providers:", e);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Provider card ────────────────────────────────────────────────────────
  const ProviderCard = ({ item }: { item: ProviderType }) => {
    const imageUrl = item.images?.[0];
    return (
      <View style={s.card}>
        {/* Cover Image */}
        <Image
          source={imageUrl ? { uri: imageUrl } : DEFAULT_IMAGE}
          style={s.cardImage}
          resizeMode="cover"
          defaultSource={DEFAULT_IMAGE}
          onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
        />

        <View style={s.cardBody}>
          {/* Top row */}
          <View style={s.cardTop}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.providerName}>{item.name}</Text>
              <View style={s.metaRow}>
                <Ionicons name="people-outline" size={12} color={C.muted} />
                <Text style={s.metaText}>{item.numberOfWorkers} workers</Text>
                {item.experience > 0 && (
                  <>
                    <Text style={s.metaDot}>·</Text>
                    <Ionicons name="time-outline" size={12} color={C.muted} />
                    <Text style={s.metaText}>{item.experience}y exp</Text>
                  </>
                )}
              </View>
            </View>
            <View style={s.priceBadge}>
              <Text style={s.priceText}>₹{item.pricePerDay}</Text>
              <Text style={s.priceUnit}>/day</Text>
            </View>
          </View>

          {/* Skills */}
          {item.skills?.length > 0 && (
            <View style={s.chipsRow}>
              {item.skills.map((sk, i) => (
                <View key={i} style={s.chip}>
                  <Text style={s.chipEmoji}>{SKILL_ICONS[sk] ?? "👷"}</Text>
                  <Text style={s.chipText}>
                    {sk.charAt(0).toUpperCase() + sk.slice(1).replace("_", " ")}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {/* Description */}
          {item.description ? (
            <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={s.divider} />
          {/* Book Now — full width */}
          <TouchableOpacity
            style={s.bookBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/labor-details?machineId=${item._id}`)}
          >
            <Text style={s.bookText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={s.listHeader}>
      <Text style={s.listCount}>
        {providers.length} provider{providers.length !== 1 ? "s" : ""} found
      </Text>
      {selectedLocation && (
        <View style={s.locationChip}>
          <Ionicons name="location" size={11} color={C.primary} />
          <Text style={s.locationChipText}>{selectedLocation.taluka}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={s.screen}>
      {/* ── Hero Header ── */}
      <View style={s.hero}>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeText}>Krishidas • BUYER</Text>
        </View>
        <Text style={s.heroTitle}>Find Labor{"\n"}Providers</Text>
        <Text style={s.heroSub}>Trusted farm workers near your location 👨‍🌾</Text>

        <View style={s.statsStrip}>
          {[
            { num: "500+", label: "Workers"  },
            { num: "120+", label: "Villages" },
            { num: "4.8★", label: "Rating"   },
          ].map((st, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={s.statSep} />}
              <View style={s.statItem}>
                <Text style={s.statNum}>{st.num}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Location selector (floating card) ── */}
      <View style={s.filterCard}>
        <Text style={s.filterLabel}>
          <Ionicons name="location-outline" size={14} color={C.primary} /> Select Location
        </Text>
        <TouchableOpacity
          style={[s.dropdownBtn, selectedLocation && s.dropdownBtnFilled]}
          onPress={() => { fetchLocations(); setShowLocationModal(true); }}
          activeOpacity={0.8}
        >
          <Text style={[s.dropdownText, !selectedLocation && { color: C.muted }]}>
            {selectedLocation
              ? `${selectedLocation.taluka}, ${selectedLocation.district}`
              : "Choose Taluka"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Finding labor providers…</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item, i) => item._id ?? String(i)}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={selectedLocation ? <ListHeader /> : null}
          renderItem={({ item }) => <ProviderCard item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            selectedLocation ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🌾</Text>
                <Text style={s.emptyTitle}>No providers found</Text>
                <Text style={s.emptyText}>Try a different taluka or check back later.</Text>
              </View>
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📍</Text>
                <Text style={s.emptyTitle}>Select a location</Text>
                <Text style={s.emptyText}>Choose a taluka above to see available labor providers.</Text>
              </View>
            )
          }
        />
      )}

      {/* ─── Location Modal ──────────────────────────────────────────────── */}
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
            <View style={s.modalEmpty}>
              <Text style={{ fontSize: 30 }}>🗺️</Text>
              <Text style={{ color: C.muted, marginTop: 8 }}>No results found</Text>
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
                  setShowLocationModal(false);
                  fetchProviders(item._id);
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
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 10,
  },
  heroBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "800", lineHeight: 36, marginBottom: 6 },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 22 },

  statsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: "center" },
  statSep: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 6 },
  statNum: { color: "#fff", fontSize: 17, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600", marginTop: 2 },

  // Filter card
  filterCard: {
    marginHorizontal: 16,
    marginTop: -36,
    backgroundColor: C.card,
    borderRadius: 18, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 6,
    marginBottom: 8,
  },
  filterLabel: { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 10 },
  dropdownBtn: {
    backgroundColor: "#FAFAF9", borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  dropdownBtnFilled: { borderColor: C.primary, backgroundColor: C.primaryFaint },
  dropdownText: { fontSize: 15, color: C.ink, fontWeight: "500" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 48, paddingTop: 4 },
  listHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  listCount: { fontSize: 14, fontWeight: "700", color: C.ink },
  locationChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  locationChipText: { fontSize: 12, fontWeight: "700", color: C.primary },

  // Loading
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingTop: 60 },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: "600" },

  // Provider Card
  card: {
    backgroundColor: C.card, borderRadius: 18,
    overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: "100%", height: 180 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: C.primary },
  providerName: { fontSize: 15, fontWeight: "800", color: C.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { fontSize: 12, color: C.muted },
  metaDot: { color: C.muted, fontSize: 12 },
  priceBadge: {
    flexDirection: "row", alignItems: "baseline", gap: 2,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  priceText: { fontSize: 15, fontWeight: "900", color: C.primary },
  priceUnit: { fontSize: 11, color: C.primary, fontWeight: "600" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 12, fontWeight: "600", color: C.primary },

  desc: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 4 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  // Book Now — full width
  bookBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  bookText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Empty
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginBottom: 4 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center" },

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
    backgroundColor: "#FAFAF9", borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 12, marginBottom: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.ink },
  modalEmpty: { alignItems: "center", paddingVertical: 32 },
  locationRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F0EDE9", gap: 12,
  },
  locationRowActive: { backgroundColor: C.primaryFaint, marginHorizontal: -20, paddingHorizontal: 20 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  locationTitle: { fontSize: 15, fontWeight: "600", color: C.ink },
  locationSub: { fontSize: 12, color: C.muted, marginTop: 2 },
});