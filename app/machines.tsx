import { useLang } from "@/contexts/LanguageContext";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
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
const IMAGE_HEIGHT = 220;

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
  inputBg: "#FFFFFF",
  shadow: "rgba(30,127,67,0.12)",
};

export default function MachinesScreen() {
  const { t } = useLang();
  const { machineType, lat, long } = useLocalSearchParams<{
    machineType: string;
    lat: string;
    long: string;
  }>();

  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const res = await api.get(
          `${BASE_URL}/machine/list?lat=${lat}&long=${long}&machineType=${machineType}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMachines(res.data);
      } catch (err) {
        console.log("API ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, []);

  const filteredMachines = machines.filter((item) => {
    const name = item.name?.toLowerCase() || "";
    const location =
      `${item.taluka} ${item.district} ${item.state}`.toLowerCase();
    return (
      name.includes(searchText.toLowerCase()) ||
      location.includes(searchText.toLowerCase())
    );
  });

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

  const renderItem = ({ item }: any) => {
    const imageUrl = item.images?.[0];
    const locationLine = `${item.taluka}, ${item.district}, ${item.state}`;

    return (
      <TouchableOpacity
        activeOpacity={0.93}
        style={s.cardWrap}
        onPress={() => router.push(`/machine-details?machineId=${item._id}`)}
      >
        <View style={s.card}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={s.imageBackground}
            imageStyle={s.imageStyle}
          >
            <View style={s.imageGradient} />
            <View style={s.imageTopRow}>
              <View style={s.typeBadge}>
                <Text style={s.typeBadgeText}>
                  {item.machineType?.[0] ?? "Machine"}
                </Text>
              </View>
              <TouchableOpacity style={s.heartBtn}>
                <Ionicons name="heart-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={s.pricePill}>
              <Text style={s.pricePillText}>₹{item.pricePerDay}</Text>
              <Text style={s.pricePillSub}>/day</Text>
            </View>
          </ImageBackground>

          <View style={s.cardBody}>
            <View style={s.titleRow}>
              <Text style={s.title} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={s.ratingWrap}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={s.ratingText}>5.0</Text>
                <Text style={s.reviewsText}>(13)</Text>
              </View>
            </View>

            {item.description ? (
              <Text style={s.desc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={s.locationRow}>
              <View style={s.locationIconWrap}>
                <FontAwesome5
                  name="map-marker-alt"
                  size={11}
                  color={C.primary}
                />
              </View>
              <Text style={s.locationText} numberOfLines={1}>
                {locationLine}
              </Text>
            </View>

            <View style={s.footer}>
              <View style={s.chipRow}>
                {item.crops?.slice(0, 2).map((c: string, i: number) => (
                  <View key={i} style={s.chip}>
                    <Text style={s.chipText}>{c}</Text>
                  </View>
                ))}
                {item.crops?.length > 2 && (
                  <View style={s.chip}>
                    <Text style={s.chipText}>+{item.crops.length - 2}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={s.bookBtn}
                onPress={() =>
                  router.push(`/machine-details?machineId=${item._id}`)
                }
              >
                <Text style={s.bookBtnText}>{t("machines.view")}</Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={s.listHeader}>
      <Text style={s.resultCount}>
        {filteredMachines.length}{" "}
        {filteredMachines.length !== 1
          ? t("machines.machinesFound")
          : t("machines.machineFound")}
      </Text>
      {machineType && (
        <View style={s.filterBadge}>
          <Ionicons name="options-outline" size={12} color={C.primary} />
          <Text style={s.filterBadgeText}>{machineType}</Text>
        </View>
      )}
    </View>
  );

  const ListEmpty = () => (
    <View style={s.emptyState}>
      <Text style={s.emptyIcon}>🚜</Text>
      <Text style={s.emptyTitle}>{t("machines.noMachinesTitle")}</Text>
      <Text style={s.emptyText}>{t("machines.noMachinesText")}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{t("machines.badge")}</Text>
        </View>
        <Text style={s.headerTitle}>{t("machines.title")}</Text>
        <View style={s.searchRow}>
          <Ionicons
            name="search"
            size={18}
            color={C.muted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder={t("machines.searchPlaceholder")}
            style={s.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={C.muted}
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
        ListEmptyComponent={<ListEmpty />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loadingScreen: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },
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
  headerBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink },
  listContent: { padding: 16, paddingBottom: 48 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  resultCount: { fontSize: 14, fontWeight: "700", color: C.ink },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.primary,
    textTransform: "capitalize",
  },
  cardWrap: {},
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: C.card,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageBackground: {
    width: "100%",
    height: IMAGE_HEIGHT,
    justifyContent: "space-between",
  },
  imageStyle: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  imageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  typeBadge: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    alignSelf: "flex-start",
    backgroundColor: C.primary,
    marginLeft: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pricePillText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  pricePillSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: { padding: 14 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: C.ink,
    flex: 1,
    marginRight: 8,
  },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontWeight: "700", fontSize: 13, color: C.ink },
  reviewsText: { color: C.muted, fontSize: 12 },
  desc: { fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 10 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  locationText: { fontSize: 12, color: C.muted, flex: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  chip: {
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: C.primary },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
