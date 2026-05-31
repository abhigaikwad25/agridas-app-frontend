import { useLang } from "@/contexts/LanguageContext";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "./utils/axiosinstance";
import { BASE_URL } from "@/constants/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const IMAGE_HEIGHT = 200;

const C = {
  bg: "#F2F5F2",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  primaryMid: "#197A3F",
  primaryDark: "#155C30",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  ink: "#1A1A1A",
  ink2: "#2D3330",
  muted: "#6B7280",
  muted2: "#9CA3AF",
  border: "#E0EAE2",
  shadow: "rgba(20,80,40,0.13)",
  distanceBg: "#0F172A",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

const formatPrice = (price: string | number): string =>
  `₹${Number(price).toLocaleString("en-IN")}`;

// ─── Types ────────────────────────────────────────────────────────────────────
type Cursor = { lastDistance: number; lastId: string } | null;

interface Machine {
  _id: string;
  name: string;
  machineType: string[];
  taluka: string;
  district: string;
  state: string;
  crops: string[];
  description?: string;
  deliveryChargePerKm: number;
  maxAcreCoverage: number;
  pricePerDay: string | number;
  image: string;
  distance: number;
}

const LIMIT = 10;

export default function MachinesScreen() {
  const { t } = useLang();
  const { machineType, lat, long } = useLocalSearchParams<{
    machineType: string;
    lat: string;
    long: string;
  }>();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  // ─── Fetch ──────────────────────────────────────────────────────────────
  const fetchMachines = async (currentCursor: Cursor, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const token = await AsyncStorage.getItem("authToken");

      const params: Record<string, any> = {
        lat,
        long,
        machineType,
        limit: LIMIT,
      };
      if (currentCursor) {
        params.lastDistance = currentCursor.lastDistance;
        params.lastId = currentCursor.lastId;
      }

      const res = await api.get(`${BASE_URL}/machine/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // Support both shaped response { machineList, nextCursor } and plain array fallback
      const raw = res.data;
      const machineList: Machine[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.machineList)
        ? raw.machineList
        : [];
      const nextCursor: Cursor = Array.isArray(raw) ? null : (raw?.nextCursor ?? null);

      if (isLoadMore) {
        setMachines((prev) => [...prev, ...machineList]);
      } else {
        setMachines(machineList);
      }

      setCursor(nextCursor);
      setHasMore(nextCursor !== null && machineList.length === LIMIT);
    } catch (err) {
      console.log("API ERROR:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMachines(null, false);
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || !cursor) return;
    fetchMachines(cursor, true);
  };

  // ─── Filtering (client-side search on loaded data) ───────────────────────
  const filteredMachines = (machines ?? []).filter((item) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    const name = item.name?.toLowerCase() || "";
    const location = `${item.taluka} ${item.district} ${item.state}`.toLowerCase();
    const type = item.machineType?.join(" ").toLowerCase() || "";
    return name.includes(q) || location.includes(q) || type.includes(q);
  });

  // ─── Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingTitle}>{t("machines.loadingTitle")}</Text>
          <Text style={s.loadingText}>{t("machines.loadingText")}</Text>
        </View>
      </View>
    );
  }

  // ─── Card ────────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Machine }) => {
    const imageUrl = item.image;
    const locationLine = [item.taluka, item.district]
      .filter(Boolean)
      .join(", ");

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={s.cardWrap}
        onPress={() => router.push(`/machine-details?machineId=${item._id}`)}
      >
        <View style={s.card}>
          {/* ── Image section ── */}
          <ImageBackground
            source={{ uri: imageUrl }}
            style={s.imageBackground}
            imageStyle={s.imageStyle}
          >
            {/* Gradient overlay */}
            <View style={s.imageGradientTop} />
            <View style={s.imageGradientBottom} />

            {/* Top row: type badge + distance */}
            <View style={s.imageTopRow}>
              <View style={s.typeBadge}>
                <MaterialCommunityIcons name="tractor" size={11} color="#fff" />
                <Text style={s.typeBadgeText}>
                  {item.machineType?.[0] ?? "Machine"}
                </Text>
              </View>
              <View style={s.distanceBadge}>
                <Ionicons name="navigate-circle" size={13} color="#4ADE80" />
                <Text style={s.distanceText}>
                  {formatDistance(item.distance)}
                </Text>
              </View>
            </View>

            {/* Bottom: price */}
            <View style={s.imagePriceRow}>
              <View style={s.pricePill}>
                <Text style={s.pricePillAmount}>{formatPrice(item.pricePerDay)}</Text>
                <Text style={s.pricePillUnit}>/day</Text>
              </View>
            </View>
          </ImageBackground>

          {/* ── Body section ── */}
          <View style={s.cardBody}>
            {/* Name + location */}
            <Text style={s.title} numberOfLines={1}>{item.name}</Text>

            <View style={s.locationRow}>
              <View style={s.locationDot} />
              <Text style={s.locationText} numberOfLines={1}>{locationLine}</Text>
            </View>

            {/* Description */}
            {!!item.description && (
              <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
            )}

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statChip}>
                <Ionicons name="expand-outline" size={13} color={C.primary} />
                <Text style={s.statText}>{item.maxAcreCoverage} acres max</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statChip}>
                <FontAwesome5 name="truck" size={11} color={C.accent} />
                <Text style={[s.statText, { color: C.accent }]}>
                  ₹{item.deliveryChargePerKm}/km
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Crops + CTA */}
            <View style={s.footer}>
              <View style={s.cropsRow}>
                {item.crops?.slice(0, 3).map((c, i) => (
                  <View key={i} style={s.cropChip}>
                    <Text style={s.cropChipText}>{c}</Text>
                  </View>
                ))}
                {item.crops?.length > 3 && (
                  <View style={s.cropChip}>
                    <Text style={s.cropChipText}>+{item.crops.length - 3}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={s.viewBtn}
                onPress={() => router.push(`/machine-details?machineId=${item._id}`)}
                activeOpacity={0.85}
              >
                <Text style={s.viewBtnText}>{t("machines.view")}</Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── List components ─────────────────────────────────────────────────────
  const ListHeader = () => (
    <View style={s.listHeader}>
      <View>
        {/* <Text style={s.resultCount}>{filteredMachines.length} found</Text> */}
        {machineType && (
          <Text style={s.resultCount}>Machines near you</Text>
        )}
      </View>
      {machineType && (
        <View style={s.filterBadge}>
          <Ionicons name="options-outline" size={12} color={C.primary} />
          <Text style={s.filterBadgeText}>{machineType}</Text>
        </View>
      )}
    </View>
  );

  const ListFooter = () => {
    if (!hasMore && machines.length > 0) {
      return (
        <View style={s.endBox}>
          <Text style={s.endText}>All machines loaded</Text>
        </View>
      );
    }
    if (hasMore && machines.length >= LIMIT && !searchText) {
      return (
        <TouchableOpacity
          style={[s.loadMoreBtn, loadingMore && { opacity: 0.7 }]}
          onPress={handleLoadMore}
          disabled={loadingMore}
          activeOpacity={0.85}
        >
          {loadingMore ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={s.loadMoreText}>Finding more machines...</Text>
            </>
          ) : (
            <>
              <Ionicons name="reload-circle-outline" size={18} color="#fff" />
              <Text style={s.loadMoreText}>Load More Machines</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }
    return null;
  };

  const ListEmpty = () => (
    <View style={s.emptyState}>
      <Text style={s.emptyIcon}>🚜</Text>
      <Text style={s.emptyTitle}>{t("machines.noMachinesTitle")}</Text>
      <Text style={s.emptyText}>{t("machines.noMachinesText")}</Text>
    </View>
  );

  // ─── Main render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{t("machines.badge")}</Text>
        </View>
        <Text style={s.headerTitle}>{t("machines.title")}</Text>

        <View style={s.searchRow}>
          <Ionicons name="search" size={17} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder={t("machines.searchPlaceholder")}
            style={s.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={C.muted2}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredMachines}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        ListEmptyComponent={<ListEmpty />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  loadingScreen: { flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" },
  loadingCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
    minWidth: 220,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  loadingText: { fontSize: 13, color: C.muted },

  // ── Header ──
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 0 : 16,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 14 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink },

  // ── List ──
  listContent: { padding: 16, paddingBottom: 56 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  resultCount: { fontSize: 15, fontWeight: "800", color: C.ink },
  resultSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  filterBadgeText: { fontSize: 12, fontWeight: "700", color: C.primary, textTransform: "capitalize" },

  // ── Card ──
  cardWrap: {},
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: C.card,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 5,
  },

  imageBackground: { width: "100%", height: IMAGE_HEIGHT },
  imageStyle: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  // Two-gradient: top for badges, bottom for price
  imageGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  imageGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.52)",
  },

  imageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
  },
  distanceText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  imagePriceRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  pricePillAmount: { color: "#fff", fontSize: 15, fontWeight: "900" },
  pricePillUnit: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" },

  // ── Card body ──
  cardBody: { padding: 14 },

  title: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 5 },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  locationText: { fontSize: 12, color: C.muted, flex: 1, fontWeight: "500" },

  desc: { fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 12 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  statChip: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  statText: { fontSize: 12, fontWeight: "700", color: C.primary },
  statDivider: { width: 1, height: 16, backgroundColor: C.border, marginHorizontal: 8 },

  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cropsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  cropChip: {
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  cropChipText: { fontSize: 11, fontWeight: "600", color: C.primaryMid },

  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
  },
  viewBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Load More / End ──
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  endBox: { alignItems: "center", paddingVertical: 24, marginTop: 8 },
  endText: { fontSize: 12, color: C.muted2, fontStyle: "italic" },

  // ── Empty ──
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 6 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20 },
});