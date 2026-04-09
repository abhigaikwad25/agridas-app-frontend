import { useLang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
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
import api from "./utils/axiosinstance";

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
  errorBg: "#FFF2F2",
  errorBorder: "#F5C6C6",
  errorText: "#C0392B",
  successBg: "#EAF5EE",
  successBorder: "#A8D5B5",
  successText: "#1E7F43",
};

type Step = "lookup" | "reset";

interface UserInfo {
  id: string | number;
  name: string;
  phoneno: string;
}

export default function ForgotPasswordScreen() {
  const { t } = useLang();

  // ── Step state ────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("lookup");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // ── Lookup step ───────────────────────────────────────────────
  const [phoneno, setPhoneno] = useState("");
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // ── Reset step ────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // ── Animations ────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const stepFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

  // Fade between steps
  const transitionToStep = (nextStep: Step) => {
    Animated.timing(stepFade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // ── Lookup handler ────────────────────────────────────────────
  const handleLookup = async () => {
    if (phoneno.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (lookupLoading) return;
    try {
      setLookupLoading(true);
      const response = await api.get(
        `auth/user/exists?phoneno=${phoneno}`
      );
      if (response.data.statusCode === 200) {
        const data = response.data;
        setUserInfo({
          id: data.user._id,
          name: data.user.name,
          phoneno,
        });
        transitionToStep("reset");
      } else if (response.data.statusCode === 404) {
        Alert.alert(
          "User Not Found",
          `No account is linked to +91 ${phoneno}. Please check the number or create a new account.`,
          [
            { text: "Try Again", style: "cancel" },
            {
              text: "Register",
              onPress: () => router.push("/register"),
              style: "default",
            },
          ]
        );
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Network error. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Reset handler ─────────────────────────────────────────────
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match. Please try again.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Too Short", "Password must be at least 6 characters.");
      return;
    }
    if (resetLoading) return;
    try {
      setResetLoading(true);

      console.log(userInfo)
      const response = await api.post("auth/resetPassword", {
        _id: userInfo?.id,
        newPassword,
      });

      const data = response.data; // Already parsed
      console.log(data)
      if (data.success) {
        Alert.alert(
          "✅ Password Updated",
          data.message,
          [
            {
              text: "Sign In",
              onPress: () => router.replace("/login"),
              style: "default",
            },
          ]
        );
      } else {
        Alert.alert("Reset Failed", data.message);
      }
    } catch (error: any) {
      Alert.alert(
        "Reset Failed",
        error.response?.data?.message || "Unable to reset password. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ── Password strength indicator ───────────────────────────────
  const getStrength = (p: string) => {
    if (p.length === 0) return null;
    if (p.length < 6) return { label: "Too short", color: "#E74C3C", width: "25%" };
    if (p.length < 8) return { label: "Weak", color: "#E67E22", width: "50%" };
    if (p.length < 12) return { label: "Good", color: "#F1C40F", width: "75%" };
    return { label: "Strong", color: C.primary, width: "100%" };
  };
  const strength = getStrength(newPassword);

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Decorative blobs */}
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
          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <View style={s.backCircle}>
              <Ionicons name="arrow-back" size={18} color={C.primary} />
            </View>
            <Text style={s.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          {/* Brand mark */}
          <View style={s.brand}>
            <View style={s.logoRing}>
              <View style={s.logoInner}>
                <Text style={s.logoEmoji}>
                  {step === "lookup" ? "🔍" : "🔐"}
                </Text>
              </View>
            </View>
            <Text style={s.logoName}>Forgot Password</Text>
            <Text style={s.logoSub}>
              {step === "lookup"
                ? "Enter your registered mobile number"
                : "Set a new secure password"}
            </Text>
          </View>

          {/* Step indicator */}
          <View style={s.stepRow}>
            <View style={s.stepDot}>
              <View style={[s.stepInner, s.stepDone]}>
                {step === "reset" ? (
                  <Ionicons name="checkmark" size={11} color={C.white} />
                ) : (
                  <Text style={s.stepNum}>1</Text>
                )}
              </View>
              <Text style={[s.stepLabel, step === "lookup" && { color: C.primary }]}>
                Verify
              </Text>
            </View>
            <View style={[s.stepLine, step === "reset" && s.stepLineActive]} />
            <View style={s.stepDot}>
              <View style={[s.stepInner, step === "reset" && s.stepDone, step === "lookup" && s.stepPending]}>
                <Text style={[s.stepNum, step === "reset" && { color: C.white }]}>2</Text>
              </View>
              <Text style={[s.stepLabel, step === "reset" && { color: C.primary }]}>
                Reset
              </Text>
            </View>
          </View>

          {/* ── Step content ─────────────────────────────────────── */}
          <Animated.View style={{ opacity: stepFade }}>
            {/* STEP 1 — Phone lookup */}
            {step === "lookup" && (
              <View style={s.formArea}>
                <Text style={s.formTitle}>Find Your Account</Text>
                <Text style={s.formSub}>
                  We'll look up your account using your mobile number.
                </Text>

                <View style={[s.fieldWrap, phoneFocused && s.fieldWrapFocused]}>
                  <View style={s.fieldPrefix}>
                    <Text style={s.fieldPrefixText}>+91</Text>
                  </View>
                  <View style={s.fieldSep} />
                  <TextInput
                    style={s.fieldInput}
                    placeholder="10-digit mobile number"
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

                <TouchableOpacity
                  style={[s.primaryBtn, lookupLoading && { opacity: 0.75 }]}
                  onPress={handleLookup}
                  activeOpacity={0.88}
                  disabled={lookupLoading}
                >
                  {lookupLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.primaryBtnText}>Find My Account</Text>
                      <View style={s.btnArrow}>
                        <Ionicons name="arrow-forward" size={16} color={C.primary} />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2 — Reset password */}
            {step === "reset" && userInfo && (
              <View style={s.formArea}>
                {/* User card */}
                <View style={s.userCard}>
                  <View style={s.userAvatar}>
                    <Text style={s.userAvatarText}>
                      {userInfo.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </Text>
                  </View>
                  <View style={s.userInfo}>
                    <Text style={s.userName}>{userInfo.name}</Text>
                    <Text style={s.userPhone}>+91 {userInfo.phoneno}</Text>
                  </View>
                  <View style={s.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={C.primary} />
                    <Text style={s.verifiedText}>Verified</Text>
                  </View>
                </View>

                <Text style={s.formTitle}>New Password</Text>
                <Text style={s.formSub}>
                  Choose a strong password you haven't used before.
                </Text>

                {/* New password */}
                <View style={[s.fieldWrap, newFocused && s.fieldWrapFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={newFocused ? C.primary : C.muted}
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.fieldInput}
                    placeholder="New password"
                    placeholderTextColor={C.muted}
                    secureTextEntry={!showNew}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    onFocus={() => setNewFocused(true)}
                    onBlur={() => setNewFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNew((v) => !v)}
                    style={s.eyeBtn}
                  >
                    <Ionicons
                      name={showNew ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={C.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Strength bar */}
                {strength && (
                  <View style={s.strengthWrap}>
                    <View style={s.strengthTrack}>
                      <View
                        style={[
                          s.strengthFill,
                          {
                            width: strength.width as any,
                            backgroundColor: strength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[s.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}

                {/* Confirm password */}
                <View
                  style={[
                    s.fieldWrap,
                    confirmFocused && s.fieldWrapFocused,
                    confirmPassword.length > 0 &&
                    !passwordsMatch &&
                    s.fieldWrapError,
                    passwordsMatch && s.fieldWrapSuccess,
                  ]}
                >
                  <Ionicons
                    name="lock-open-outline"
                    size={18}
                    color={
                      passwordsMatch
                        ? C.primary
                        : confirmPassword.length > 0 && !passwordsMatch
                          ? C.errorText
                          : confirmFocused
                            ? C.primary
                            : C.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.fieldInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={C.muted}
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm((v) => !v)}
                    style={s.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={C.muted}
                    />
                  </TouchableOpacity>
                  {passwordsMatch && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={C.primary}
                      style={{ marginRight: 14 }}
                    />
                  )}
                </View>

                {/* Match hint */}
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <View style={s.hintRow}>
                    <Ionicons name="alert-circle-outline" size={13} color={C.errorText} />
                    <Text style={s.hintTextError}>Passwords do not match</Text>
                  </View>
                )}
                {passwordsMatch && (
                  <View style={s.hintRow}>
                    <Ionicons name="checkmark-circle-outline" size={13} color={C.primary} />
                    <Text style={s.hintTextSuccess}>Passwords match</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    s.primaryBtn,
                    (!passwordsMatch || resetLoading) && s.primaryBtnDisabled,
                  ]}
                  onPress={handleResetPassword}
                  activeOpacity={0.88}
                  disabled={!passwordsMatch || resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={s.primaryBtnText}>Reset Password</Text>
                      <View style={s.btnArrow}>
                        <Ionicons name="checkmark" size={16} color={C.primary} />
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Trust pills */}
          <View style={s.trustRow}>
            {[
              { icon: "shield-checkmark-outline", key: "Secure" },
              { icon: "lock-closed-outline", key: "Encrypted" },
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

  // Back button
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontSize: 14, fontWeight: "600", color: C.muted },

  // Brand
  brand: { alignItems: "center", marginBottom: 28 },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "rgba(30,127,67,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
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
  logoEmoji: { fontSize: 32 },
  logoName: {
    fontSize: 26,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 0,
  },
  stepDot: { alignItems: "center", gap: 4 },
  stepInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDone: { backgroundColor: C.primary },
  stepPending: {
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.border,
  },
  stepNum: { fontSize: 13, fontWeight: "700", color: C.muted },
  stepLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.muted,
    marginTop: 2,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: C.border,
    marginHorizontal: 8,
    marginBottom: 18,
    borderRadius: 1,
  },
  stepLineActive: { backgroundColor: C.primary },

  // User card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.faint,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.successBorder,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: { fontSize: 18, fontWeight: "800", color: C.white },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: C.ink },
  userPhone: { fontSize: 12, color: C.muted, marginTop: 2 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: C.border,
  },
  verifiedText: { fontSize: 11, fontWeight: "600", color: C.primary },

  // Form
  formArea: { marginBottom: 28 },
  formTitle: { fontSize: 24, fontWeight: "800", color: C.ink, marginBottom: 5 },
  formSub: { fontSize: 13, color: C.muted, marginBottom: 22, lineHeight: 19 },

  // Fields (matching login page exactly)
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
  fieldWrapError: {
    borderColor: "#E74C3C",
    shadowColor: "rgba(231,76,60,0.15)",
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  fieldWrapSuccess: {
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

  // Strength bar
  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -6,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 60 },

  // Match hints
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  hintTextError: { fontSize: 12, color: "#E74C3C", fontWeight: "500" },
  hintTextSuccess: { fontSize: 12, color: C.primary, fontWeight: "500" },

  // Primary button (same as loginBtn)
  primaryBtn: {
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
  primaryBtnDisabled: { opacity: 0.5, elevation: 0 },
  primaryBtnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
    marginLeft: 38,
  },
  btnArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  // Trust pills
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