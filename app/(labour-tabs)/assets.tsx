// app/owner-labor-providers.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../utils/axiosinstance";
import { BASE_URL } from "@/constants/api";
const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

const DEFAULT_IMAGE = require("../../assets/images/laborproovider.jpg");

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
  red: "#C0392B",
  redLight: "#FEECEB",
  shadow: "rgba(107,39,55,0.10)",
};

export default function OwnerLaborProvidersScreen() {
  const router = useRouter();
  const [laborProviders, setLaborProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLaborProviders = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(`${BASE_URL}/laborProvider/userowned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLaborProviders(res.data);
    } catch (err) {
      console.log("API ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch every time this screen comes into focus
  // so newly added entries appear immediately
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLaborProviders();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete Listing", "This will permanently remove the listing. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(id);
          try {
            const token = await AsyncStorage.getItem("authToken");
            await api.delete(`${BASE_URL}/laborProvider/delete/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setLaborProviders((prev) => prev.filter((m) => m._id !== id));
          } catch (err) {
            Alert.alert("Error", "Failed to delete. Try again.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <View style={s.loadingCard}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingTitle}>Loading your listings…</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: any) => {
    const imageUrl = item.images?.[0];
    const isDeleting = deletingId === item._id;

    return (
      <View style={s.card}>
        {/* Image */}
        <View style={s.imageWrap}>
          <Image
            source={imageUrl ? { uri: imageUrl } : DEFAULT_IMAGE}
            style={s.image}
            resizeMode="cover"
            defaultSource={DEFAULT_IMAGE}
            onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
          />
          {/* Type badge */}
          {item.machineType?.[0] && (
            <View style={s.typeBadge}>
              <Text style={s.typeBadgeText}>
                {item.machineType[0].charAt(0).toUpperCase() + item.machineType[0].slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={s.cardBody}>
          {/* Title + price */}
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={1}>{item.name}</Text>
            <View style={s.priceBadge}>
              <Text style={s.priceText}>₹{item.pricePerDay}</Text>
              <Text style={s.priceUnit}>/ac</Text>
            </View>
          </View>

          {/* Location */}
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={13} color={C.muted} />
            <Text style={s.locText} numberOfLines={1}>
              {item.taluka}, {item.district}
            </Text>
          </View>

          {/* Crop chips */}
          {item.crops?.length > 0 && (
            <View style={s.chips}>
              {item.crops.slice(0, 3).map((c: string, i: number) => (
                <View key={i} style={s.chip}>
                  <Text style={s.chipText}>{c}</Text>
                </View>
              ))}
              {item.crops.length > 3 && (
                <View style={s.chip}>
                  <Text style={s.chipText}>+{item.crops.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Divider */}
          <View style={s.divider} />

          {/* Action buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={s.updateBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: "../update-labor", params: { id: item._id } })
              }
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={s.updateBtnText}>Edit Listing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.deleteBtn}
              activeOpacity={0.85}
              onPress={() => handleDelete(item._id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={C.red} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color={C.red} />
                  <Text style={s.deleteBtnText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={s.listHeader}>
      <Text style={s.listCount}>
        {laborProviders.length} listing{laborProviders.length !== 1 ? "s" : ""}
      </Text>
      <TouchableOpacity
        style={s.addBtn}
        onPress={() => router.push("/add-labor")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={s.addBtnText}>Add New</Text>
      </TouchableOpacity>
    </View>
  );

  const ListEmpty = () => (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>👷</Text>
      <Text style={s.emptyTitle}>No listings yet</Text>
      <Text style={s.emptyText}>
        Add your first labor provider listing and start receiving bookings from nearby farmers.
      </Text>
      <TouchableOpacity
        style={s.emptyBtn}
        onPress={() => router.push("/add-labor")}
      >
        <Text style={s.emptyBtnText}>Add Listing</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.screen}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>AGRIDAS • SELLER</Text>
        </View>
        <Text style={s.headerTitle}>Your Listings</Text>
        <Text style={s.headerSub}>Manage, update or remove your labor provider listings</Text>

        {/* Summary strip */}
        <View style={s.strip}>
          <View style={s.stripItem}>
            <Text style={s.stripNum}>{laborProviders.length}</Text>
            <Text style={s.stripLabel}>Listed</Text>
          </View>
          <View style={s.stripSep} />
          <View style={s.stripItem}>
            <Text style={s.stripNum}>
              {laborProviders.filter((m) => m.isActive !== false).length}
            </Text>
            <Text style={s.stripLabel}>Active</Text>
          </View>
          <View style={s.stripSep} />
          <View style={s.stripItem}>
            <Text style={s.stripNum}>
              {laborProviders.reduce((sum, m) => sum + (m.bookingsCount || 0), 0)}
            </Text>
            <Text style={s.stripLabel}>Bookings</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={laborProviders}
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
  screen: { flex: 1, backgroundColor: C.bg },

  loadingScreen: { flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" },
  loadingCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 32,
    alignItems: "center", gap: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 6,
  },
  loadingTitle: { fontSize: 15, fontWeight: "700", color: C.ink },

  // ── Header
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 0 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 10,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 4 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 20 },

  strip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8,
  },
  stripItem: { flex: 1, alignItems: "center" },
  stripNum: { color: "#fff", fontSize: 20, fontWeight: "900" },
  stripLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600", marginTop: 2 },
  stripSep: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },

  // ── List
  listContent: { padding: 16, paddingBottom: 50 },
  listHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  listCount: { fontSize: 14, fontWeight: "700", color: C.ink },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 4,
  },

  imageWrap: { position: "relative" },
  image: { width: "100%", height: 200 },
  typeBadge: {
    position: "absolute", top: 12, left: 12,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  typeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  cardBody: { padding: 16 },

  titleRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: "800", color: C.ink, flex: 1, marginRight: 8 },
  priceBadge: {
    flexDirection: "row", alignItems: "baseline", gap: 2,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  priceText: { fontSize: 14, fontWeight: "900", color: C.primary },
  priceUnit: { fontSize: 11, color: C.primary, fontWeight: "600" },

  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  locText: { fontSize: 12, color: C.muted, flex: 1 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: {
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 11, fontWeight: "600", color: C.primary },

  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },

  btnRow: { flexDirection: "row", gap: 10 },

  updateBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: C.primary,
    paddingVertical: 12, borderRadius: 12,
  },
  updateBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  deleteBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: C.redLight,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "#F5C6C6",
  },
  deleteBtnText: { color: C.red, fontSize: 14, fontWeight: "700" },

  // ── Empty
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 6 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 13,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});