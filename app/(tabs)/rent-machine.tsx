// app/rent-machine.tsx
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
  shadow: "rgba(30,127,67,0.12)",
};

const CATEGORIES = [
  { key: "sowing",     label: "Sowing",    emoji: "🌱", image: require("../../assets/images/sowing.jpg")     },
  { key: "harvesting", label: "Harvesting",emoji: "🌾", image: require("../../assets/images/harvesting.jpg") },
  { key: "drone",      label: "Drone",     emoji: "🚁", image: require("../../assets/images/drone.jpg")      },
  { key: "logistics",  label: "Logistics", emoji: "🚛", image: require("../../assets/images/transport.jpg")  },
];

export default function RentMachineScreen() {
  const [loading, setLoading] = useState(true);
  const locationRef = useRef<{ lat: number; long: number } | null>(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLoading(true);

    // Try requesting — if undetermined shows prompt, if denied returns "denied" immediately
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      // Redirect straight to settings — no walls, no extra screens
      await Linking.openSettings();
      // Re-check when they come back
      const { status: recheck } = await Location.getForegroundPermissionsAsync();
      if (recheck !== "granted") {
        setLoading(false);
        return;
      }
    }

    try {
      // Try cached position first — instant if available
      const cached = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,      // accept if less than 5 minutes old
        requiredAccuracy: 500,       // within 500m is fine for finding nearby machines
      });

      if (cached) {
        locationRef.current = { lat: cached.coords.latitude, long: cached.coords.longitude };
        setLoading(false);
        return;
      }

      // No cache — fetch fresh at lowest accuracy (fastest)
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      locationRef.current = { lat: loc.coords.latitude, long: loc.coords.longitude };
    } catch {
      locationRef.current = null;
    }
    setLoading(false);
  };

  const goToMachines = (machineType: string) => {
    const loc = locationRef.current;
    if (!loc) {
      getLocation(); // silently retry
      return;
    }
    router.push(`/machines?machineType=${machineType}&lat=${loc.lat}&long=${loc.long}`);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadingText}>Fetching your location…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>AGRIDAS • BUYER</Text>
        </View>
        <Text style={s.headerTitle}>Rent Farming{"\n"}Machines</Text>
        <Text style={s.headerSub}>Select a category to find machines near you</Text>
        {locationRef.current && (
          <View style={s.locationChip}>
            <Ionicons name="location" size={12} color={C.primary} />
            <Text style={s.locationChipText}>Location detected</Text>
          </View>
        )}
      </View>

      <View style={s.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={s.card}
            onPress={() => goToMachines(cat.key)}
            activeOpacity={0.88}
          >
            <ImageBackground
              source={cat.image}
              style={s.cardImage}
              imageStyle={s.cardImageStyle}
            >
              <View style={s.cardLabel}>
                <Text style={s.cardEmoji}>{cat.emoji}</Text>
                <Text style={s.cardTitle}>{cat.label}</Text>
                <View style={s.cardArrow}>
                  <Ionicons name="arrow-forward" size={12} color={C.primary} />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 60 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: C.bg },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: "600" },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 28, paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 12,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 30, fontWeight: "800", lineHeight: 36, marginBottom: 6 },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 16 },
  locationChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  locationChipText: { fontSize: 12, fontWeight: "700", color: C.primary },

  grid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  card: {
    width: "47.5%", height: 200, borderRadius: 18,
    overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 5,
    backgroundColor: C.card,
  },
  cardImage: { flex: 1, justifyContent: "flex-end" },
  cardImageStyle: { borderRadius: 18 },
  cardLabel: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    marginHorizontal: 8, marginBottom: 8,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12,
  },
  cardEmoji: { fontSize: 16 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: C.ink },
  cardArrow: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center",
  },
});