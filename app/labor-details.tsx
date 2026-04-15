import api from "@/app/utils/axiosinstance";
import { useLang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// ─── COLORS ────────────────────────────────────────────────
const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
  shadow: "rgba(30,127,67,0.10)",
  amberFaint: "#FFFBEB",
  amberBorder: "#FDE68A",
  amberText: "#92400E",
};

// ─── SKILLS ────────────────────────────────────────────────
const SKILL_ICONS: Record<string, string> = {
  sowing: "leaf-outline",
  spraying: "water-outline",
  harvesting: "cut-outline",
  driver: "car-outline",
  ploughing: "git-branch-outline",
};

function SkillPill({ skill }: { skill: string }) {
  return (
    <View style={s.skillPill}>
      <Ionicons
        name={(SKILL_ICONS[skill.toLowerCase()] as any) ?? "construct-outline"}
        size={13}
        color={C.primary}
      />
      <Text style={s.skillText}>{skill}</Text>
    </View>
  );
}

// ─── STATS ────────────────────────────────────────────────
function StatCard({ icon, label, value }: any) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={18} color={C.primary} />
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

// ─── MAIN SCREEN ───────────────────────────────────────────
export default function LaborProviderDetailsScreen() {
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProvider(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadingText}>Loading provider...</Text>
      </View>
    );
  }

  if (!provider) return null;

  const coords = provider?.labourLocation?.coordinates;
  console.log(provider)
  const lng = Array.isArray(coords) ? coords[0] : null;
  const lat = Array.isArray(coords) ? coords[1] : null;

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />

      {/* HERO */}
      <View style={s.hero}>
        <Text style={s.heroTitle}>Labor Provider</Text>
        <Text style={s.heroSub}>
          {provider.isActive ? "Available Now" : "Currently Busy"}
        </Text>
      </View>

      {/* BACK */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* TITLE */}
        <View style={s.card}>
          <Text style={s.title}>Labor Service Provider</Text>
         <Text style={s.location}>
  {`${provider.taluka}, ${provider.district}, ${provider.state}`}
</Text>

{provider.address ? (
  <Text style={s.addressSingle}>{provider.address}</Text>
) : null}
        </View>

        {/* STATS */}
        <View style={s.grid}>
          <StatCard icon="people" label="Workers" value={provider.numberOfWorkers} />
          <StatCard icon="cash" label="Per Day" value={`₹${provider.pricePerDay}`} />
          <StatCard icon="car" label="Delivery/km" value={`₹${provider.deliveryChargePerKm}`} />
        </View>

        {/* MAP BUTTON */}
        {lat && lng && (
          <TouchableOpacity
            style={s.mapBtn}
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`)
            }
          >
            <Ionicons name="map" size={16} color="#fff" />
            <Text style={s.mapText}>View on Google Maps</Text>
          </TouchableOpacity>
        )}

        {/* SKILLS */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Skills</Text>
          <View style={s.skillWrap}>
            {provider.skills?.map((s1: string, i: number) => (
              <SkillPill key={i} skill={s1} />
            ))}
          </View>
        </View>

        {/* DETAILS */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Details</Text>

          <Text style={s.info}>📞 {provider.ownerPhoneno}</Text>
          <Text style={s.info}>📍 {provider.pincode}</Text>
          <Text style={s.info}>
            🌾 {provider.crops?.join(", ") || "No crops"}
          </Text>
        </View>

        {/* ABOUT */}
        {provider.description ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.desc}>{provider.description}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={s.bottomBar}>
        <View>
          <Text style={s.priceLabel}>Starting from</Text>
          <Text style={s.price}>₹{provider.pricePerDay} / day</Text>
        </View>

        <TouchableOpacity
          style={s.bookBtn}
          onPress={() =>
            router.push(
              `/booking?machineId=${provider._id}&bookingType=laborProvider`
            )
          }
        >
          <Text style={s.bookText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 10, color: C.muted },

  hero: {
    height: 120,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    paddingLeft: 20,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: C.ink },
  heroSub: { color: C.primary, marginTop: 4 },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 15,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },

  card: {
    backgroundColor: C.card,
    margin: 12,
    padding: 14,
    borderRadius: 14,
  },

  title: { fontSize: 18, fontWeight: "800", color: C.ink },
  location: { color: C.muted, marginTop: 4 },
  address: { color: C.muted, marginTop: 6, fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 12,
  },

  statCard: {
    width: (width - 36) / 2,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  statLabel: { fontSize: 12, color: C.muted },
  statValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },

  mapBtn: {
    margin: 12,
    backgroundColor: C.primary,
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    gap: 8,
  },
  mapText: { color: "#fff", fontWeight: "700" },

  sectionTitle: { fontWeight: "800", marginBottom: 10 },

  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  skillPill: {
    flexDirection: "row",
    backgroundColor: C.primaryFaint,
    padding: 8,
    borderRadius: 20,
    gap: 6,
  },
  skillText: { color: C.primary, fontWeight: "600" },

  info: { marginTop: 6, color: C.muted },

  desc: { color: C.muted, lineHeight: 20 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  priceLabel: { fontSize: 12, color: C.muted },
  price: { fontSize: 18, fontWeight: "800" },

  addressSingle: {
  color: C.muted,
  fontSize: 12,
  marginTop: 6,
  lineHeight: 18,
},
  bookBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookText: { color: "#fff", fontWeight: "800" },
});