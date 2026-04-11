import LogoutItem from "@/components/Logout";
import { useLang, type Lang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LANGUAGES: { code: Lang; native: string; english: string }[] = [
  { code: "en", native: "English", english: "English" },
  { code: "mr", native: "मराठी", english: "Marathi" },
  { code: "hi", native: "हिंदी", english: "Hindi" },
];

export default function Profile() {
  const { lang, setLang, t } = useLang();
  const [langModal, setLangModal] = useState(false);

  const current = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header} />

      <View style={styles.profileCard}>
        <Image
          source={require("../../assets/images/farmer.jpg")}
          style={styles.avatar}
        />
        <Text style={styles.name}>{t("profile.agriUser")}</Text>
      </View>

      <View style={styles.card}>
        <Item
          icon="construct-outline"
          label={t("profile.switchMachine")}
          onPress={() => router.push({ pathname: "/(seller-tabs)" })}
        />
        <Item
          icon="storefront-outline"
          label={t("profile.switchLabour")}
          onPress={() => router.push({ pathname: "/(labour-tabs)" })}
        />
        <Item
          icon="wallet-outline"
          label={t("profile.expenses")}
          onPress={() => router.push({ pathname: "/dashboardFarmer" })}
        />
        <Item
          icon="calendar-outline"
          label={t("profile.bookings")}
          onPress={() => router.push({ pathname: "/userBookings" })}
        />
        <Item
          icon="create-outline"
          label={t("profile.editProfile")}
          onPress={() => router.push({ pathname: "/editProfile" })}
        />

        {/* Language row */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => setLangModal(true)}
        >
          <Ionicons name="language-outline" size={24} color="#1E7F3B" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.itemText}>{t("profile.language")}</Text>
            <Text style={styles.itemSub}>
              {current.native} • {current.english}
            </Text>
          </View>
          <View style={styles.langBadge}>
            <Text style={styles.langBadgeText}>{current.native}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#9CA3AF"
          />
        </TouchableOpacity>

        <LogoutItem icon="log-out-outline" label={t("common.logout")} danger />
      </View>

      {/* Language Modal */}
      <Modal
        visible={langModal}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModal(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setLangModal(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{t("language.selectLanguage")}</Text>
          <Text style={styles.sheetSub}>{t("language.selectSub")}</Text>

          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langOption, active && styles.langOptionActive]}
                onPress={() => {
                  setLang(l.code);
                  setLangModal(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text
                    style={[styles.langName, active && { color: "#1E7F3B" }]}
                  >
                    {l.native}
                  </Text>
                  <Text style={styles.langEnglish}>{l.english}</Text>
                </View>
                {active && (
                  <Ionicons name="checkmark-circle" size={22} color="#1E7F3B" />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setLangModal(false)}
          >
            <Text style={styles.closeBtnText}>{t("language.close")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Item({ icon, label, danger = false, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={24} color={danger ? "#DC2626" : "#1E7F3B"} />
      <Text style={[styles.itemText, danger && { color: "#DC2626" }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAF7EF" },
  header: {
    height: 120,
    backgroundColor: "#1E7F3B",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: -50,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 20,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "600", color: "#111827" },
  sub: { fontSize: 14, color: "#6B7280" },
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18, // ← increased vertical padding
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 14, // ← gap between icon and label
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    // remove marginLeft from here — gap handles it now
  },
  itemSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  langBadge: {
    backgroundColor: "#EAF7EF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8DDD0",
  },
  langBadgeText: { fontSize: 12, fontWeight: "700", color: "#1E7F3B" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  sheetSub: { fontSize: 13, color: "#6B7280", marginBottom: 20 },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  langOptionActive: { backgroundColor: "#EAF7EF", borderColor: "#1E7F3B" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: { borderColor: "#1E7F3B" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1E7F3B",
  },
  langName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  langEnglish: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  closeBtn: {
    marginTop: 8,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  closeBtnText: { fontSize: 15, fontWeight: "700", color: "#374151" },
});
