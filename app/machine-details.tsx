import api from "@/app/utils/axiosinstance";
import { useLang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = 320;

const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
  shadow: "rgba(30,127,67,0.10)",
};

function ImageCarousel({ images }: { images: string[] }) {
  const ref = useRef<FlatList>(null);
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timer.current) clearInterval(timer.current);
    if (images.length <= 1) return;
    timer.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % images.length;
        ref.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [images.length]);

  return (
    <View style={{ height: IMAGE_HEIGHT, backgroundColor: "#E8EDE8" }}>
      <FlatList
        ref={ref}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActive(idx);
          resetTimer();
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: IMAGE_HEIGHT }}
            resizeMode="cover"
          />
        )}
      />
      {images.length > 1 && (
        <View style={s.dotRow}>
          {images.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                ref.current?.scrollToIndex({ index: i, animated: true });
                setActive(i);
                resetTimer();
              }}
            >
              <View style={[s.dot, i === active && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {images.length > 1 && (
        <View style={s.counter}>
          <Ionicons name="images-outline" size={11} color="#fff" />
          <Text style={s.counterText}>
            {active + 1} / {images.length}
          </Text>
        </View>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
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

export default function MachineDetailsScreen() {
  const { t } = useLang();
  const { machineId } = useLocalSearchParams<{ machineId: string }>();
  const router = useRouter();
  const [machine, setMachine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadMachine();
  }, []);

  const loadMachine = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(
        `https://agridas-latest.onrender.com/machine/details/${machineId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMachine(res.data);
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
        <Text style={s.loadingText}>{t("machineDetails.loadingText")}</Text>
      </View>
    );
  }

  if (!machine) return null;

  const images: string[] = machine.images?.length
    ? machine.images
    : ["https://via.placeholder.com/400x320"];

  return (
    <View style={s.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View>
        <ImageCarousel images={images} />
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <TouchableOpacity style={s.likeBtn} onPress={() => setLiked((v) => !v)}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? "#E53935" : C.ink}
          />
        </TouchableOpacity>
      </View>

      <View style={s.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          <View style={s.handle} />

          {/* Title + Rating */}
          <View style={s.titleRow}>
            <Text style={s.title}>{machine.name}</Text>
            <View style={s.ratingChip}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={s.ratingNum}>4.9</Text>
            </View>
          </View>
          <Text style={s.reviews}>{t("machineDetails.reviews")}</Text>

          {/* Location */}
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={14} color={C.primary} />
            <Text style={s.locText}>
              {machine.taluka}, {machine.district}, {machine.state}
            </Text>
          </View>

          {/* Price band */}
          <View style={s.priceBand}>
            <View style={s.priceCell}>
              <Text style={s.priceCellLabel}>
                {t("machineDetails.perAcre")}
              </Text>
              <Text style={s.priceCellValue}>₹{machine.pricePerDay}</Text>
            </View>
            <View style={s.priceSep} />
            <View style={s.priceCell}>
              <Text style={s.priceCellLabel}>
                {t("machineDetails.delivery")}
              </Text>
              <Text style={s.priceCellValue}>
                ₹{machine.deliveryChargePerKm}
                <Text style={s.priceUnit}>{t("machineDetails.perKm")}</Text>
              </Text>
            </View>
            <View style={s.priceSep} />
            <View style={s.priceCell}>
              <Text style={s.priceCellLabel}>
                {t("machineDetails.coverage")}
              </Text>
              <Text style={s.priceCellValue}>
                {machine.maxAcreCoverage}
                <Text style={s.priceUnit}>{t("machineDetails.acreUnit")}</Text>
              </Text>
            </View>
          </View>

          {/* Specs card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>
              {t("machineDetails.specifications")}
            </Text>
            <InfoRow
              icon="construct-outline"
              label={t("machineDetails.machineType")}
              value={
                machine.machineType
                  ?.map(
                    (mt: string) => mt.charAt(0).toUpperCase() + mt.slice(1),
                  )
                  .join(", ") || "—"
              }
            />
            <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
              <View style={s.infoIcon}>
                <Ionicons name="leaf-outline" size={15} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>
                  {t("machineDetails.supportedCrops")}
                </Text>
                <View style={[s.chips, { marginTop: 6 }]}>
                  {machine.crops?.map((c: string, i: number) => (
                    <View key={i} style={s.chip}>
                      <Text style={s.chipText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          {machine.description ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>
                {t("machineDetails.aboutMachine")}
              </Text>
              <Text style={s.desc}>{machine.description}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={s.bar}>
          <View>
            <Text style={s.barLabel}>{t("machineDetails.startingFrom")}</Text>
            <Text style={s.barPrice}>
              ₹{machine.pricePerDay}
              <Text style={s.barUnit}>{t("machineDetails.perAcreUnit")}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={s.bookBtn}
            onPress={() => router.push(`/booking?machineId=${machine._id}`)}
            activeOpacity={0.85}
          >
            <Text style={s.bookText}>{t("machineDetails.bookNow")}</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.card },
  loadingScreen: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: "600" },
  dotRow: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotActive: { width: 20, backgroundColor: "#fff" },
  counter: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  counterText: { color: "#fff", fontSize: 11, fontWeight: "700" },
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
  likeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 42,
    right: 14,
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: C.ink,
    flex: 1,
    marginRight: 10,
    lineHeight: 27,
  },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  ratingNum: { fontSize: 12, fontWeight: "800", color: "#92400E" },
  reviews: { fontSize: 12, color: C.muted, marginBottom: 10 },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 16,
  },
  locText: { fontSize: 13, color: C.muted },
  priceBand: {
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 16,
    marginBottom: 14,
  },
  priceCell: { flex: 1, paddingVertical: 14, alignItems: "center" },
  priceCellLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 3,
  },
  priceCellValue: { color: "#fff", fontSize: 17, fontWeight: "900" },
  priceUnit: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  priceSep: {
    width: 1,
    marginVertical: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: { fontSize: 12, fontWeight: "700", color: C.primary },
  desc: { fontSize: 14, color: C.muted, lineHeight: 22 },
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
  barLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginBottom: 1,
  },
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
