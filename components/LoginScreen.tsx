import { login } from "@/services/authService";
import { saveToken } from "@/services/authStorage";
import { useLang } from "@/contexts/LanguageContext";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

const { height } = Dimensions.get("window");

const C = {
  bg: "#F2F7F4",
  primary: "#1E7F43",
  primaryDark: "#155C30",
  primaryMid: "#278A4C",
  faint: "#EAF5EE",
  ink: "#0F1F15",
  muted: "#6B7C70",
  border: "#C8DDD0",
  white: "#FFFFFF",
  shadow: "rgba(21,92,48,0.15)",
};

export default function LoginScreen() {
  const { t } = useLang();

  const [phoneno, setPhoneno] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    requestLocationPermission();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("auth.locationRequired"), t("auth.locationMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("auth.openSettings"), onPress: () => Linking.openSettings() },
      ]);
    }
  };

  const handleLogin = async () => {
    if (!phoneno || !password) {
      Alert.alert(t("common.error"), t("auth.enterDetails"));
      return;
    }
    if (loading) return;
    try {
      setLoading(true);
      const response = await login({ phoneno, password });
      const data = await response.json();
      if (response.ok) {
        await saveToken(data.accesstoken);
        setTimeout(() => router.replace("/(tabs)"), 300);
      } else {
        Alert.alert(
          t("auth.loginFailed"),
          data?.message || t("auth.invalidCredentials"),
        );
      }
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.blobTop} />
      <View style={s.blobBottom} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Brand */}
          <View style={s.brand}>
            <View style={s.logoRing}>
              <View style={s.logoInner}>
                <Text style={s.logoEmoji}>🌾</Text>
              </View>
            </View>
            <Text style={s.logoName}>{t("common.appName")}</Text>
            <Text style={s.logoSub}>{t("auth.connectingFarmers")}</Text>
          </View>

          {/* Form */}
          <View style={s.formArea}>
            <Text style={s.formTitle}>{t("auth.signIn")}</Text>
            <Text style={s.formSub}>{t("auth.signInBack")}</Text>

            {/* Phone */}
            <View style={[s.fieldWrap, phoneFocused && s.fieldWrapFocused]}>
              <View style={s.fieldPrefix}>
                <Text style={s.fieldPrefixText}>+91</Text>
              </View>
              <View style={s.fieldSep} />
              <TextInput
                style={s.fieldInput}
                placeholder={t("auth.mobileNumber")}
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                maxLength={10}
                value={phoneno}
                onChangeText={setPhoneno}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
              {phoneno.length === 10 && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={C.primary}
                  style={{ marginRight: 14 }}
                />
              )}
            </View>

            {/* Password */}
            <View style={[s.fieldWrap, passFocused && s.fieldWrapFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passFocused ? C.primary : C.muted}
                style={s.fieldIcon}
              />
              <TextInput
                style={s.fieldInput}
                placeholder={t("auth.password")}
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={s.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[s.loginBtn, loading && { opacity: 0.75 }]}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.loginBtnText}>{t("auth.signIn")}</Text>
                  <View style={s.loginArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={C.primary}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity
              style={s.registerRow}
              onPress={() => router.push("/register")}
            >
              <Text style={s.registerPrompt}>{t("auth.noAccount")}</Text>
              <Text style={s.registerLink}>{t("auth.createOne")}</Text>
            </TouchableOpacity>
          </View>

          {/* Trust pills */}
          <View style={s.trustRow}>
            {[
              { icon: "shield-checkmark-outline", key: "Secure" },
              { icon: "location-outline", key: "Location" },
              { icon: "leaf-outline", key: "For Farmers" },
            ].map((item, i) => (
              <View key={i} style={s.trustPill}>
                <Ionicons name={item.icon as any} size={13} color={C.primary} />
                <Text style={s.trustText}>{item.key}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  blobTop: {
    position: "absolute",
    top: -height * 0.1,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(30,127,67,0.09)",
  },
  blobBottom: {
    position: "absolute",
    bottom: -60,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(30,127,67,0.06)",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  brand: { alignItems: "center", marginBottom: 44 },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "rgba(30,127,67,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: { fontSize: 34 },
  logoName: {
    fontSize: 30,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  logoSub: { fontSize: 13, color: C.muted, fontWeight: "500" },
  formArea: { marginBottom: 32 },
  formTitle: { fontSize: 26, fontWeight: "800", color: C.ink, marginBottom: 6 },
  formSub: { fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 20 },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 14,
    paddingVertical: Platform.OS === "ios" ? 4 : 0,
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  fieldWrapFocused: {
    borderColor: C.primary,
    shadowColor: C.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  fieldPrefix: { paddingLeft: 18, paddingRight: 4 },
  fieldPrefixText: { fontSize: 15, fontWeight: "700", color: C.primary },
  fieldSep: {
    width: 1,
    height: 22,
    backgroundColor: C.border,
    marginHorizontal: 8,
  },
  fieldIcon: { marginLeft: 18, marginRight: 4 },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: C.ink,
    paddingVertical: 14,
    paddingRight: 4,
  },
  eyeBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingVertical: 17,
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  loginBtnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
    marginLeft: 38,
  },
  loginArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerPrompt: { fontSize: 14, color: C.muted },
  registerLink: { fontSize: 14, fontWeight: "700", color: C.primary },
  trustRow: { flexDirection: "row", justifyContent: "center", gap: 10 },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: C.border,
  },
  trustText: { fontSize: 11, fontWeight: "600", color: C.muted },
});
