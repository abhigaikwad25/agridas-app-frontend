import api from "@/app/utils/axiosinstance";
import { useLang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
  shadow: "rgba(30,127,67,0.10)",
  amber: "#F59E0B",
  amberFaint: "#FFFBEB",
  amberBorder: "#FDE68A",
  amberText: "#92400E",
};

// ─── Skill pill ──────────────────────────────────────────────────────────────

const SKILL_ICONS: Record<string, string> = {
  sowing: "leaf-outline",
  spraying: "water-outline",
  harvesting: "cut-outline",
  driver: "car-outline",
  ploughing: "git-branch-outline",
  irrigation: "rainy-outline",
};

function SkillPill({ skill }: { skill: string }) {
  const icon = (SKILL_ICONS[skill.toLowerCase()] ?? "construct-outline") as any;
  const label = skill.charAt(0).toUpperCase() + skill.slice(1);
  return (
    <View style={s.skillPill}>
      <Ionicons name={icon} size={13} color={C.primary} />
      <Text style={s.skillPillText}>{label}</Text>
    </View>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <View style={[s.statCard, accent && s.statCardAccent]}>
      <View style={[s.statIcon, accent && s.statIconAccent]}>
        <Ionicons
          name={icon as any}
          size={16}
          color={accent ? "#fff" : C.primary}
        />
      </View>
      <Text style={[s.statLabel, accent && s.statLabelAccent]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Text style={[s.statValue, accent && s.statValueAccent]}>{value}</Text>
        {unit ? (
          <Text style={[s.statUnit, accent && s.statUnitAccent]}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={s.infoIcon}>
        <Ionicons name={icon as any} size={15} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Header hero (no images in data — use a gradient-free illustrated banner) ─

function HeroBanner({ workerCount }: { workerCount: number }) {
  return (
    <View style={s.heroBanner}>
      {/* abstract background rings */}
      <View style={s.heroRing1} />
      <View style={s.heroRing2} />

      {/* worker avatar stack */}
      <View style={s.avatarStack}>
        {Array.from({ length: Math.min(workerCount, 4) }).map((_, i) => (
          <View
            key={i}
            style={[
              s.avatarCircle,
              { marginLeft: i === 0 ? 0 : -14, zIndex: 10 - i },
            ]}
          >
            <Ionicons name="person" size={18} color={C.primary} />
          </View>
        ))}
        {workerCount > 4 && (
          <View style={[s.avatarCircle, s.avatarMore, { marginLeft: -14 }]}>
            <Text style={s.avatarMoreText}>+{workerCount - 4}</Text>
          </View>
        )}
      </View>

      <Text style={s.heroLabel}>Labor Team Available</Text>
      <View style={s.heroBadge}>
        <View style={s.activeIndicator} />
        <Text style={s.heroBadgeText}>Active</Text>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LaborProviderDetailsScreen() {
  const { t } = useLang();
  const { machineId } = useLocalSearchParams<{ machineId: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProvider();
  }, []);

  const loadProvider = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(
        `https://agridas-latest.onrender.com/laborProvider/details/${machineId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log(res)
      setProvider(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadingText}>Loading provider details…</Text>
      </View>
    );
  }

  if (!provider) return null;

  const skills: string[] = provider.skills ?? [];
  const crops: string[] = provider.crops ?? [];
  const locationLine = [provider.taluka, provider.district, provider.state]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={s.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Hero */}
      <HeroBanner workerCount={provider.numberOfWorkers ?? 1} />

      {/* Back button */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color={C.ink} />
      </TouchableOpacity>

      {/* Sheet */}
      <View style={s.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={s.handle} />

          {/* Title */}
          <View style={s.titleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={s.title}>Labor Service Provider</Text>
              <View style={s.locRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={C.primary}
                />
                <Text style={s.locText}>{locationLine}</Text>
              </View>
            </View>
            <View style={s.ratingChip}>
              <Ionicons name="star" size={12} color={C.amber} />
              <Text style={s.ratingNum}>4.9</Text>
            </View>
          </View>

          {/* ── Stat grid ─────────────────────────────────────────────── */}
          <View style={s.statGrid}>
            <StatCard
              icon="people"
              label="Workers"
              value={String(provider.numberOfWorkers ?? "—")}
              accent
            />
            <StatCard
              icon="sunny-outline"
              label="Per day"
              value={`₹${provider.pricePerDay}`}
            />
            <StatCard
              icon="time-outline"
              label="Per hour"
              value={`₹${provider.pricePerHour}`}
            />
            <StatCard
              icon="navigate-outline"
              label="Delivery / km"
              value={`₹${provider.deliveryChargePerKm}`}
            />
          </View>

          {/* ── Skills ────────────────────────────────────────────────── */}
          {skills.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Skills offered</Text>
              <View style={s.pillWrap}>
                {skills.map((sk, i) => (
                  <SkillPill key={i} skill={sk} />
                ))}
              </View>
            </View>
          )}

          {/* ── Details card ──────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Provider details</Text>
            <InfoRow
              icon="location-outline"
              label="Pincode"
              value={provider.pincode ?? "—"}
            />
            <InfoRow
              icon="call-outline"
              label="Contact"
              value={provider.ownerPhoneno ?? "—"}
            />
            <InfoRow
              icon="leaf-outline"
              label="Supported crops"
              value={crops.length ? crops.join(", ") : "—"}
              last
            />
          </View>

          {/* ── Description ───────────────────────────────────────────── */}
          {provider.description ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>About</Text>
              <Text style={s.desc}>{provider.description}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky bottom bar */}
        <View style={s.bar}>
          <View>
            <Text style={s.barLabel}>Starting from</Text>
            <Text style={s.barPrice}>
              ₹{provider.pricePerDay}
              <Text style={s.barUnit}> / day</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={s.bookBtn}
            onPress={() =>
              router.push(`/booking?machineId=${provider._id}&bookingType=laborProvider`)
            }
            activeOpacity={0.85}
          >
            <Text style={s.bookText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const HERO_H = 240;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.card },

  // loading
  loadingScreen: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: "600" },

  // hero banner
  heroBanner: {
    height: HERO_H,
    backgroundColor: C.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroRing1: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 40,
    borderColor: "rgba(30,127,67,0.07)",
    top: -width * 0.55,
  },
  heroRing2: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    borderWidth: 24,
    borderColor: "rgba(30,127,67,0.05)",
    bottom: -width * 0.35,
    right: -width * 0.2,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarMore: { backgroundColor: C.primaryFaint },
  avatarMoreText: { fontSize: 11, fontWeight: "800", color: C.primary },
  heroLabel: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 10 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  activeIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  heroBadgeText: { fontSize: 12, fontWeight: "700", color: C.primary },

  // back button
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 42,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 5,
  },

  // sheet
  sheet: {
    flex: 1,
    backgroundColor: C.bg,
    marginTop: -22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 16,
  },

  // title row
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: C.ink,
    lineHeight: 27,
    marginBottom: 4,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locText: { fontSize: 13, color: C.muted },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.amberFaint,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.amberBorder,
  },
  ratingNum: { fontSize: 12, fontWeight: "800", color: C.amberText },

  // stat grid
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: (width - 42) / 2,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardAccent: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  statIconAccent: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statLabel: { fontSize: 11, fontWeight: "600", color: C.muted },
  statLabelAccent: { color: "rgba(255,255,255,0.7)" },
  statValue: { fontSize: 20, fontWeight: "900", color: C.ink },
  statValueAccent: { color: "#fff" },
  statUnit: { fontSize: 11, fontWeight: "600", color: C.muted },
  statUnitAccent: { color: "rgba(255,255,255,0.7)" },

  // shared card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 12,
  },

  // skills
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  skillPillText: { fontSize: 13, fontWeight: "700", color: C.primary },

  // info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginBottom: 1,
  },
  infoValue: { fontSize: 14, fontWeight: "700", color: C.ink },

  // description
  desc: { fontSize: 14, color: C.muted, lineHeight: 22 },

  // bottom bar
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  barLabel: { fontSize: 11, color: C.muted, fontWeight: "600", marginBottom: 1 },
  barPrice: { fontSize: 22, fontWeight: "900", color: C.ink },
  barUnit: { fontSize: 13, color: C.muted, fontWeight: "600" },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 13,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  bookText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});