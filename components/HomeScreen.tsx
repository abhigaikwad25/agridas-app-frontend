// app/(tabs)/index.tsx — Buyer Home
import { setLocationList } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const ACTIONS = [
  {
    icon: "construct-outline",
    emoji: "🚜",
    title: "Rent Farming Tools",
    desc: "Browse machines available near your location",
    route: "/rent-machine",
    bg: C.primaryFaint,
    color: C.primary,
  },
  {
    icon: "people-outline",
    emoji: "👨‍🌾",
    title: "Hire Labour",
    desc: "Find skilled workers for your farm",
    route: "/rentLabor",
    bg: "#FDF3E7",
    color: C.accent,
  },
  {
    icon: "receipt-outline",
    emoji: "📦",
    title: "My Bookings",
    desc: "Track your current and past bookings",
    route: "",
    bg: "#EEF2FF",
    color: "#4338CA",
  },
];

const QUICK_STATS = [
  { label: "Machines\nNearby",  value: "24+", icon: "hardware-chip-outline" },
  { label: "Labour\nAvailable", value: "60+", icon: "people-outline"        },
  { label: "Villages\nCovered", value: "300+",icon: "location-outline"      },
];

export default function HomeScreen() {
  useEffect(() => {
    const init = async () => {
      await setLocationList();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission is required to use this app.");
        return;
      }
      await Location.getCurrentPositionAsync({});
    };
    init();
  }, []);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>AGRIDAS • BUYER</Text>
            </View>
            <Text style={s.welcome}>Welcome Back 👋</Text>
            <Text style={s.subtitle}>
              साधने भाड्याने घ्या किंवा मजूर मिळवा अगदी सहज
            </Text>
          </View>
          <View style={s.avatarWrap}>
            <Text style={s.avatarEmoji}>🌾</Text>
          </View>
        </View>

        {/* Quick stats */}
        <View style={s.statsStrip}>
          {QUICK_STATS.map((stat, i) => (
            <View key={i} style={[s.statItem, i < QUICK_STATS.length - 1 && s.statBorder]}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Banner ── */}
      <View style={s.bannerWrap}>
        <ImageBackground
          source={require("@/assets/images/farm-banner.png")}
          style={s.banner}
          imageStyle={s.bannerImage}
        >
          <View style={s.bannerOverlay}>
            <Text style={s.bannerTitle}>Find resources{"\n"}near your farm</Text>
            <TouchableOpacity style={s.bannerBtn} activeOpacity={0.85}>
              <Text style={s.bannerBtnText}>Explore Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* ── Actions ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>What would you like to do?</Text>

        {ACTIONS.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={s.actionCard}
            activeOpacity={0.88}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[s.actionIconWrap, { backgroundColor: action.bg }]}>
              <Text style={s.actionEmoji}>{action.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.actionTitle}>{action.title}</Text>
              <Text style={s.actionDesc}>{action.desc}</Text>
            </View>
            <View style={[s.actionArrow, { backgroundColor: action.bg }]}>
              <Ionicons name="arrow-forward" size={15} color={action.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Info Banner ── */}
      <View style={s.infoBanner}>
        <View style={s.infoIconWrap}>
          <Ionicons name="information-circle-outline" size={22} color={C.primary} />
        </View>
        <Text style={s.infoText}>
          AgriConnect helps farmers save time and reduce costs by connecting them with nearby resources.
        </Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 60 },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 10,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  welcome: { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18, maxWidth: 220 },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  avatarEmoji: { fontSize: 26 },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 12 },
  statBorder: { borderRightWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },

  // Banner
  bannerWrap: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 14, elevation: 8,
  },
  banner: { height: 200, justifyContent: "flex-end" },
  bannerImage: { borderRadius: 20 },
  bannerOverlay: {
    padding: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  bannerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 26, marginBottom: 12 },
  bannerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  bannerBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 14 },

  // Action cards
  actionCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  actionIconWrap: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  actionEmoji: { fontSize: 24 },
  actionTitle: { fontSize: 15, fontWeight: "800", color: C.ink, marginBottom: 3 },
  actionDesc: { fontSize: 12, color: C.muted, lineHeight: 17 },
  actionArrow: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },

  // Info banner
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: C.primaryFaint,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 13, color: C.primary, lineHeight: 19, fontWeight: "500" },
});