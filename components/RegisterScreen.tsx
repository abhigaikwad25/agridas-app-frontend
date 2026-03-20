import { useLang } from "@/contexts/LanguageContext";
import { register } from "@/services/authService";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#F0F7F2",
  primary: "#1E7F43",
  primaryDark: "#155C30",
  faint: "#EAF5EE",
  ink: "#1C1917",
  muted: "#6B7280",
  border: "#C9E2D4",
  white: "#FFFFFF",
};

export default function RegisterScreen() {
  const { t } = useLang();

  const ROLES = [
    {
      key: "Consumer",
      labelKey: "register.roleFarmer",
      descKey: "register.roleFarmerDesc",
      emoji: "🌾",
    },
    {
      key: "MachineOwner",
      labelKey: "register.roleMachine",
      descKey: "register.roleMachineDesc",
      emoji: "🚜",
    },
    {
      key: "LabourProvider",
      labelKey: "register.roleLabour",
      descKey: "register.roleLabourDesc",
      emoji: "👷",
    },
  ];

  const [name, setName] = useState("");
  const [phoneno, setPhoneno] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Consumer");
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleRegister = async () => {
    if (!name || !phoneno || !password) {
      Alert.alert(t("register.missingFields"), t("register.missingFieldsMsg"));
      return;
    }
    try {
      setLoading(true);
      const response = await register({ name, phoneno, password, role });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          t("register.accountCreated"),
          data.message || t("register.welcomeMsg"),
          [{ text: t("auth.signIn"), onPress: () => router.replace("/") }],
        );
      } else {
        Alert.alert(
          t("register.registrationFailed"),
          data.message || t("register.tryAgain"),
        );
      }
    } catch {
      Alert.alert(t("common.error"), t("register.serverError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Blob header */}
        <View style={s.blob}>
          <View style={s.blobCircle1} />
          <View style={s.blobCircle2} />
          <View style={s.brandRow}>
            <View style={s.leafBadge}>
              <Text style={s.leafEmoji}>🌿</Text>
            </View>
            <Text style={s.brandName}>agridas</Text>
          </View>
          <Text style={s.heroText}>{t("register.title")}</Text>
          <Text style={s.heroSub}>{t("register.subtitle")}</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {/* Full Name */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t("register.fullName")}</Text>
            <View style={[s.fieldRow, nameFocused && s.fieldRowFocused]}>
              <View style={s.iconWrap}>
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={nameFocused ? C.primary : C.muted}
                />
              </View>
              <View style={s.fieldSep} />
              <TextInput
                style={s.fieldInput}
                placeholder={t("register.namePlaceholder")}
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t("register.mobileNumber")}</Text>
            <View style={[s.fieldRow, phoneFocused && s.fieldRowFocused]}>
              <View style={s.prefixWrap}>
                <Text style={s.prefixText}>🇮🇳 +91</Text>
              </View>
              <View style={s.fieldSep} />
              <TextInput
                style={s.fieldInput}
                placeholder="9876543210"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                maxLength={10}
                value={phoneno}
                onChangeText={setPhoneno}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t("register.password")}</Text>
            <View style={[s.fieldRow, passFocused && s.fieldRowFocused]}>
              <View style={s.iconWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={passFocused ? C.primary : C.muted}
                />
              </View>
              <View style={s.fieldSep} />
              <TextInput
                style={[s.fieldInput, { flex: 1 }]}
                placeholder={t("register.passwordPlaceholder")}
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role selector */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t("register.iAmA")}</Text>
            <View style={s.roleGrid}>
              {ROLES.map((r) => {
                const active = role === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[s.roleCard, active && s.roleCardActive]}
                    onPress={() => setRole(r.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.roleEmoji}>{r.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.roleLabel, active && s.roleLabelActive]}>
                        {t(r.labelKey)}
                      </Text>
                      <Text style={[s.roleDesc, active && s.roleDescActive]}>
                        {t(r.descKey)}
                      </Text>
                    </View>
                    {active && (
                      <View style={s.roleCheck}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Register button */}
          <TouchableOpacity
            style={[s.registerBtn, loading && { opacity: 0.75 }]}
            onPress={handleRegister}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.registerBtnText}>
                  {t("register.createAccount")}
                </Text>
                <View style={s.registerArrow}>
                  <Ionicons name="arrow-forward" size={16} color={C.primary} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View style={s.loginRow}>
            <Text style={s.loginLabel}>{t("register.alreadyHaveAccount")}</Text>
            <TouchableOpacity onPress={() => router.replace("/")}>
              <Text style={s.loginLink}>{t("register.signIn")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust strip */}
        <View style={s.trust}>
          {[
            { icon: "shield-checkmark-outline", key: "register.secure" },
            { icon: "people-outline", key: "register.farmers" },
            { icon: "star-outline", key: "register.rated" },
          ].map((item, i) => (
            <View key={i} style={s.trustItem}>
              <Ionicons name={item.icon as any} size={13} color={C.primary} />
              <Text style={s.trustText}>{t(item.key)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },
  blob: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 64 : 52,
    paddingBottom: 52,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    overflow: "hidden",
  },
  blobCircle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -40,
  },
  blobCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 10,
    right: 60,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  leafBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  leafEmoji: { fontSize: 20 },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },
  heroText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 44,
    marginBottom: 8,
  },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 20 },
  form: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8 },
  fieldWrap: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.ink,
    marginBottom: 8,
    marginLeft: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
    height: 54,
  },
  fieldRowFocused: {
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  prefixWrap: { paddingHorizontal: 14, justifyContent: "center" },
  prefixText: { fontSize: 14, fontWeight: "700", color: C.ink },
  iconWrap: { paddingHorizontal: 14, justifyContent: "center" },
  fieldSep: { width: 1, height: 24, backgroundColor: C.border },
  fieldInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    color: C.ink,
    height: "100%",
  },
  eyeBtn: { paddingHorizontal: 14, justifyContent: "center" },
  roleGrid: { flexDirection: "column", gap: 10 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    position: "relative",
  },
  roleCardActive: { borderColor: C.primary, backgroundColor: C.faint },
  roleEmoji: { fontSize: 24 },
  roleLabel: { fontSize: 14, fontWeight: "700", color: C.ink },
  roleLabelActive: { color: C.primary },
  roleDesc: { fontSize: 12, color: C.muted },
  roleDescActive: { color: C.primary, opacity: 0.75 },
  roleCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.primary,
    height: 56,
    borderRadius: 18,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
    marginTop: 4,
  },
  registerBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  registerArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  loginLabel: { fontSize: 14, color: C.muted },
  loginLink: { fontSize: 14, fontWeight: "800", color: C.primary },
  trust: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingBottom: 32,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { fontSize: 12, color: C.muted, fontWeight: "500" },
});
