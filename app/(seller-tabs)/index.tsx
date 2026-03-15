import { ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ─── Palette (matches the design system) ─────────────────────────────────────
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
  shadow: "rgba(107,39,55,0.10)",
};

const POINTS = [
  {
    icon: "list-outline",
    title: "List Once, Earn Always",
    body: "Register your machine once and start receiving booking requests from nearby farmers.",
  },
  {
    icon: "trending-up-outline",
    title: "Stop Idle Losses",
    body: "Every idle hour is lost income. Put your machines to work throughout the season.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Secure & Transparent",
    body: "Clear pricing, verified farmers, and a secure booking system you can trust.",
  },
  {
    icon: "bar-chart-outline",
    title: "Track Everything",
    body: "Monitor bookings, upcoming jobs, and total earnings from your dashboard.",
  },
];

export default function SellerHome() {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Header ── */}
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>AGRIDAS • SELLER PORTAL</Text>
        </View>
        <Text style={s.headerTitle}>Welcome{"\n"}Back 👋</Text>
        <Text style={s.headerSub}>
          Turn your machines into a steady income stream
        </Text>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statNum}>1200+</Text>
            <Text style={s.statLabel}>Machines Listed</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>8400+</Text>
            <Text style={s.statLabel}>Bookings Made</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>340+</Text>
            <Text style={s.statLabel}>Sellers Earning</Text>
          </View>
        </View>
      </View>

      {/* ── Hero Image ── */}
      <View style={s.imageCard}>
        <ImageBackground
          source={require("../../assets/images/sellerimage.jpg")}
          style={s.image}
          imageStyle={s.imageStyle}
        >
          <View style={s.imageOverlay}>
            <View style={s.imageBadge}>
              <Ionicons name="star" size={12} color={C.accent} />
              <Text style={s.imageBadgeText}>Top earners make ₹40,000+ per season</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* ── Tagline ── */}
      <View style={s.taglineBlock}>
        <Text style={s.taglineTitle}>Don't let your machines stay idle</Text>
        <Text style={s.taglineSub}>
          Rent them to nearby farmers and earn consistently — no middlemen, no hassle.
        </Text>
      </View>

      {/* ── Benefits Card ── */}
      <View style={s.benefitsCard}>
        <View style={s.benefitsHeader}>
          <View style={s.benefitsIconWrap}>
            <Text style={{ fontSize: 16 }}>✨</Text>
          </View>
          <Text style={s.benefitsTitle}>Why sellers choose Agridas</Text>
        </View>

        {POINTS.map((p, i) => (
          <View key={i} style={[s.pointRow, i === POINTS.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
            <View style={s.pointIconWrap}>
              <Ionicons name={p.icon as any} size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pointTitle}>{p.title}</Text>
              <Text style={s.pointBody}>{p.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── CTA Banner ── */}
      <View style={s.ctaBanner}>
        <View style={{ flex: 1 }}>
          <Text style={s.ctaTitle}>Ready to start earning?</Text>
          <Text style={s.ctaSub}>Add your first machine in under 2 minutes.</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={36} color="#fff" style={{ opacity: 0.9 }} />
      </View>

      {/* ── Back Button ── */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => router.replace("/(tabs)")}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back-circle-outline" size={20} color={C.primary} />
        <Text style={s.backBtnText}>Back to Buyer Home</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 60 },

  // ── Header
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 12,
  },
  headerBadgeText: {
    color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4,
  },
  headerTitle: {
    color: "#fff", fontSize: 34, fontWeight: "800", lineHeight: 40, marginBottom: 8,
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 20, marginBottom: 24,
  },

  // ── Stats strip inside header
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  // ── Image
  imageCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  image: { height: 210, justifyContent: "flex-end" },
  imageStyle: { borderRadius: 20 },
  imageOverlay: {
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  imageBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  imageBadgeText: { fontSize: 11, fontWeight: "700", color: C.ink },

  // ── Tagline
  taglineBlock: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
    alignItems: "center",
  },
  taglineTitle: {
    fontSize: 22, fontWeight: "800", color: C.ink,
    textAlign: "center", lineHeight: 28, marginBottom: 8,
  },
  taglineSub: {
    fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21,
  },

  // ── Benefits
  benefitsCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  benefitsHeader: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18,
  },
  benefitsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.accentLight,
    justifyContent: "center", alignItems: "center",
  },
  benefitsTitle: { fontSize: 16, fontWeight: "700", color: C.ink },

  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  pointIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  pointTitle: { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 3 },
  pointBody: { fontSize: 13, color: C.muted, lineHeight: 19 },

  // ── CTA Banner
  ctaBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 3 },
  ctaSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },

  // ── Back button
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  backBtnText: { fontSize: 15, fontWeight: "700", color: C.primary },
});