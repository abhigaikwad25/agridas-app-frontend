import { useLang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../utils/axiosinstance";

const C = {
  bg: "#F7F3EE",
  bgSoft: "#FBF8F4",
  card: "#FFFFFF",
  primary: "#6B2737",
  primary2: "#8C3A4E",
  primarySoft: "#F8EEF1",
  accent: "#C9863A",
  accentSoft: "#FDF3E6",

  success: "#1F7A5A",
  successSoft: "#EAF7F1",

  danger: "#C44536",
  dangerSoft: "#FDEDEA",

  warning: "#B7791F",
  warningSoft: "#FEF3DC",

  info: "#2B6CB0",
  infoSoft: "#EAF2FC",

  ink: "#1F1A17",
  ink2: "#3A332F",
  muted: "#7B726B",
  muted2: "#A49B94",

  border: "#E9E0D8",
  borderDark: "#DDD1C8",

  shadow: "rgba(71, 38, 45, 0.08)",
  shadowStrong: "rgba(71, 38, 45, 0.14)",
};

type TabKey = "requested" | "ongoing" | "rejected" | "history";

const TAB_STATUS_MAP: Record<TabKey, string | string[]> = {
  requested: "requested",
  ongoing: "accepted",
  rejected: "rejected",
  history: ["completed", "cancelled"],
};

const mapBooking = (item: any) => ({
  _id: item._id,
  farmer: item.name,
  machine: item.bookingType,
  acres: item.acre,
  startDate: item.startDate,
  endDate: item.endDate,
  startOtp: item.startOtp,
  endOtp: item.endOtp,
  date: new Date(item.startDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  endDateFormatted: new Date(item.endDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  amount: item.totalCost,
  bookingStatus: item.bookingStatus,
});

function useBookings(tab: TabKey) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    setData([]);
  try {
  if (tab === "history") {
    // Completed + Cancelled
    const [completedRes, cancelledRes] = await Promise.all([
      api.get("/booking/received/owner", {
        params: { status: "completed", bookingType: "machine" },
      }),
      api.get("/booking/received/owner", {
        params: { status: "cancelled", bookingType: "machine" },
      }),
    ]);

    const merged = [
      ...(completedRes.data ?? []),
      ...(cancelledRes.data ?? []),
    ].map(mapBooking);

    setData(merged);
  }

  else if (tab === "ongoing") {
    // Accepted + Started
    const [acceptedRes, startedRes] = await Promise.all([
      api.get("/booking/received/owner", {
        params: { status: "accepted", bookingType: "machine" },
      }),
      api.get("/booking/received/owner", {
        params: { status: "started", bookingType: "machine" },
      }),
    ]);

    const merged = [
      ...(acceptedRes.data ?? []),
      ...(startedRes.data ?? []),
    ].map(mapBooking);

    setData(merged);
  }

  else {
    // Requested OR Rejected
    const res = await api.get("/booking/received/owner", {
      params: {
        status: TAB_STATUS_MAP[tab],
        bookingType: "machine",
      },
    });

    setData((res.data ?? []).map(mapBooking));
  }

} catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [tab]);

  return { data, loading, error, refetch: fetchBookings };
}

function SectionCard({
  children,
  accentColor = C.primary,
  style,
}: {
  children: React.ReactNode;
  accentColor?: string;
  style?: any;
}) {
  return (
    <View style={[s.bookingCard, style]}>
      <View style={[s.cardAccent, { backgroundColor: accentColor }]} />
      <View style={s.cardInner}>{children}</View>
    </View>
  );
}

function Avatar({
  name,
  color = C.primary,
  bg = C.primarySoft,
}: {
  name: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[s.avatarCircle, { backgroundColor: bg }]}>
      <Text style={[s.avatarText, { color }]}>
        {name?.charAt(0)?.toUpperCase()}
      </Text>
    </View>
  );
}

export default function BookingsScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<TabKey>("requested");

  const TABS: { key: TabKey; label: string; icon: string }[] = useMemo(
    () => [
      { key: "requested", label: t("bookings.requests"), icon: "time-outline" },
      { key: "ongoing", label: t("bookings.ongoing"), icon: "sparkles-outline" },
      { key: "rejected", label: "Rejected", icon: "close-circle-outline" },
      { key: "history", label: "History", icon: "archive-outline" },
    ],
    [t]
  );

  const activeTab = TABS.find((tb) => tb.key === tab)!;
  const { data, loading, error, refetch } = useBookings(tab);

  function MetaRow({
    date,
    endDate,
    acres,
  }: {
    date: string;
    endDate?: string;
    acres: number;
  }) {
    return (
      <View style={s.bookingMeta}>
        <View style={s.metaChip}>
          <Ionicons name="calendar-outline" size={14} color={C.muted} />
          <Text style={s.metaText}>
            {date}
            {endDate ? ` → ${endDate}` : ""}
          </Text>
        </View>

        <View style={s.metaChip}>
          <Ionicons name="leaf-outline" size={14} color={C.muted} />
          <Text style={s.metaText}>
            {acres} {t("bookings.acres")}
          </Text>
        </View>
      </View>
    );
  }

  function MoneyRow({
    label,
    value,
    color = C.ink,
  }: {
    label: string;
    value: number;
    color?: string;
  }) {
    return (
      <View style={s.amountRow}>
        <View style={s.amountRowLeft}>
          <Ionicons name="cash-outline" size={14} color={C.muted} />
          <Text style={s.amountRowLabel}>{label}</Text>
        </View>
        <Text style={[s.amountRowValue, { color }]}>₹{value.toLocaleString("en-IN")}</Text>
      </View>
    );
  }

  function RequestCard({ item, onAction }: { item: any; onAction: () => void }) {
    const [actionLoading, setActionLoading] = useState(false);

    const handleAccept = async () => {
      setActionLoading(true);
      try {
        await api.patch(`/booking/${item._id}/accept`, {
          startDate: item.startDate,
          endDate: item.endDate,
        });
        onAction();
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to accept booking";
        Alert.alert("Error", message);
      } finally {
        setActionLoading(false);
      }
    };

    const handleDecline = async () => {
      Alert.alert("Decline Booking", "Are you sure you want to decline this booking?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.patch(`/booking/${item._id}/reject`);
              onAction();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to decline booking"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]);
    };

    return (
      <SectionCard accentColor={C.primary}>
        <View style={s.bookingTop}>
          <View style={s.personWrap}>
            <Avatar name={item.farmer} />
            <View style={s.personInfo}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
          </View>

          <View style={s.amountBadge}>
            <Text style={s.amountText}>₹{item.amount.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <MetaRow date={item.date} endDate={item.endDateFormatted} acres={item.acres} />
        <View style={s.divider} />

        <View style={s.bookingActions}>
          <TouchableOpacity
            style={s.rejectBtn}
            onPress={handleDecline}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={15} color={C.muted} />
            <Text style={s.rejectText}>{t("bookings.decline")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.acceptBtn, actionLoading && { opacity: 0.65 }]}
            onPress={handleAccept}
            disabled={actionLoading}
            activeOpacity={0.9}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={s.acceptText}>{t("bookings.accept")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SectionCard>
    );
  }

  function OngoingCard({ item, onAction }: { item: any; onAction: () => void }) {
    const now = new Date();
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    const isActive = now >= start && now <= end;
    const isUpcoming = now < start;

    const statusColor = isActive ? C.success : isUpcoming ? C.info : C.warning;
    const statusBg = isActive ? C.successSoft : isUpcoming ? C.infoSoft : C.warningSoft;
    const statusLabel = isActive ? t("bookings.active") : isUpcoming ? "Upcoming" : "Wrapping up";
    const statusIcon = isActive
      ? "radio-button-on"
      : isUpcoming
      ? "time-outline"
      : "flag-outline";

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
    const progress = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;

    const [otpVisible, setOtpVisible] = useState(false);
    const [otpAction, setOtpAction] = useState<"start" | "complete">("start");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState<string | null>(null);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const openOtp = (action: "start" | "complete") => {
      setOtp(["", "", "", "", "", ""]);
      setOtpError(null);
      setOtpAction(action);
      setOtpVisible(true);
    };

    const handleOtpChange = (val: string, idx: number) => {
      const cleaned = val.replace(/[^0-9]/g, "").slice(-1);
      const next = [...otp];
      next[idx] = cleaned;
      setOtp(next);
      if (cleaned && idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyPress = (e: any, idx: number) => {
      if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    };

    const verifyAndExecute = async () => {
      const code = otp.join("");
      const expectedOtp = otpAction === "start" ? String(item.startOtp ?? "") : String(item.endOtp ?? "");

      if (code.length < 6) {
        setOtpError("Please enter the complete 6-digit OTP");
        return;
      }

      if (!expectedOtp) {
        setOtpError("OTP is not available for this booking");
        return;
      }

      if (code !== expectedOtp) {
        setOtpError("Invalid OTP. Please try again.");
        return;
      }

      setOtpLoading(true);
      setOtpError(null);

      try {
        if (otpAction === "start") {
          await api.patch(`/booking/${item._id}/start`);
        } else {
          await api.patch(`/booking/${item._id}/completed`);
        }
        setOtpVisible(false);
        onAction();
      } catch (err: any) {
        setOtpError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Something went wrong. Please try again."
        );
      } finally {
        setOtpLoading(false);
      }
    };

    const sheetColor = otpAction === "start" ? C.info : C.success;
    const sheetSoft = otpAction === "start" ? C.infoSoft : C.successSoft;

    return (
      <>
        <Modal
          visible={otpVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setOtpVisible(false)}
        >
          <View style={os.overlay}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={() => !otpLoading && setOtpVisible(false)}
            />
            <View style={os.sheet}>
              <View style={os.dragHandle} />

              <View style={[os.sheetHeader, { backgroundColor: sheetSoft }]}>
                <View style={[os.sheetHeaderIcon, { backgroundColor: sheetColor }]}>
                  <Ionicons
                    name={
                      otpAction === "start"
                        ? "play-circle-outline"
                        : "checkmark-done-circle-outline"
                    }
                    size={25}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={os.sheetTitle}>
                    {otpAction === "start" ? "Start Booking" : "Complete Booking"}
                  </Text>
                  <Text style={os.sheetTitleSub}>
                    {otpAction === "start"
                      ? "Enter start OTP to begin the service"
                      : "Enter completion OTP to close the service"}
                  </Text>
                </View>
              </View>

              <View style={os.sheetBody}>
                <View style={os.farmerRow}>
                  <View style={[os.farmerAvatar, { backgroundColor: sheetSoft }]}>
                    <Text style={[os.farmerAvatarText, { color: sheetColor }]}>
                      {item.farmer.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={os.farmerRowName}>{item.farmer}</Text>
                    <Text style={os.farmerRowMachine}>{item.machine}</Text>
                  </View>
                </View>

                <Text style={os.sheetSub}>
                  Ask the farmer for the{" "}
                  <Text style={os.sheetSubStrong}>
                    {otpAction === "start" ? "start" : "completion"}
                  </Text>{" "}
                  OTP and enter it below.
                </Text>

                <View style={os.otpRow}>
                  {otp.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(r: any) => (inputRefs.current[idx] = r)}
                      style={[
                        os.otpBox,
                        digit ? os.otpBoxFilled : null,
                        otpError ? os.otpBoxError : null,
                      ]}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      autoFocus={idx === 0}
                    />
                  ))}
                </View>

                {otpError && (
                  <View style={os.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={C.danger} />
                    <Text style={os.errorText}>{otpError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    os.verifyBtn,
                    { backgroundColor: sheetColor },
                    otpLoading && { opacity: 0.65 },
                  ]}
                  onPress={verifyAndExecute}
                  disabled={otpLoading}
                  activeOpacity={0.9}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                      <Text style={os.verifyText}>Verify & Confirm</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={os.cancelBtn}
                  onPress={() => setOtpVisible(false)}
                  disabled={otpLoading}
                >
                  <Text style={os.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <SectionCard accentColor={statusColor}>
          <View style={s.bookingTop}>
            <View style={s.personWrap}>
              <Avatar name={item.farmer} color={statusColor} bg={statusBg} />
              <View style={s.personInfo}>
                <Text style={s.farmerName}>{item.farmer}</Text>
                <Text style={s.machineName}>{item.machine}</Text>
              </View>
            </View>

            <View style={[s.statusPill, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon as any} size={12} color={statusColor} />
              <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={s.progressBlock}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>
                {isActive ? "In progress" : isUpcoming ? `Starts ${item.date}` : "Completion"}
              </Text>
              <Text style={[s.progressPct, { color: statusColor }]}>{progress}%</Text>
            </View>

            <View style={s.progressBg}>
              <View
                style={[
                  s.progressFill,
                  { width: `${progress}%`, backgroundColor: statusColor },
                ]}
              />
            </View>
          </View>

          <MetaRow date={item.date} endDate={item.endDateFormatted} acres={item.acres} />
          <View style={s.divider} />
          <MoneyRow label="Service amount" value={item.amount} />

          {isUpcoming && (
            <TouchableOpacity
              style={[os.actionBtn, { backgroundColor: C.info, marginTop: 16 }]}
              onPress={() => openOtp("start")}
              activeOpacity={0.9}
            >
              <Ionicons name="play-circle-outline" size={18} color="#fff" />
              <Text style={os.actionBtnText}>Start Booking</Text>
            </TouchableOpacity>
          )}

          {isActive && (
            <TouchableOpacity
              style={[os.actionBtn, { backgroundColor: C.success, marginTop: 16 }]}
              onPress={() => openOtp("complete")}
              activeOpacity={0.9}
            >
              <Ionicons name="checkmark-done-circle-outline" size={18} color="#fff" />
              <Text style={os.actionBtnText}>Complete Booking</Text>
            </TouchableOpacity>
          )}
        </SectionCard>
      </>
    );
  }

  function RejectedCard({ item }: { item: any }) {
    return (
      <SectionCard accentColor={C.danger} style={{ opacity: 0.96 }}>
        <View style={s.bookingTop}>
          <View style={s.personWrap}>
            <Avatar name={item.farmer} color={C.danger} bg={C.dangerSoft} />
            <View style={s.personInfo}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
          </View>

          <View style={[s.statusPill, { backgroundColor: C.dangerSoft }]}>
            <Ionicons name="close-circle" size={12} color={C.danger} />
            <Text style={[s.statusText, { color: C.danger }]}>Rejected</Text>
          </View>
        </View>

        <MetaRow date={item.date} acres={item.acres} />
        <View style={s.divider} />
        <MoneyRow label={t("bookings.amount")} value={item.amount} color={C.danger} />
      </SectionCard>
    );
  }

  function HistoryCard({ item }: { item: any }) {
    const isCompleted = item.bookingStatus === "completed";
    const color = isCompleted ? C.success : C.muted;
    const bgColor = isCompleted ? C.successSoft : "#F1ECE7";
    const icon: any = isCompleted ? "checkmark-circle" : "ban-outline";
    const label = isCompleted ? t("bookings.done") : t("bookings.cancelled");

    return (
      <SectionCard accentColor={color} style={{ opacity: isCompleted ? 1 : 0.92 }}>
        <View style={s.bookingTop}>
          <View style={s.personWrap}>
            <Avatar name={item.farmer} color={color} bg={bgColor} />
            <View style={s.personInfo}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
          </View>

          <View style={[s.statusPill, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={12} color={color} />
            <Text style={[s.statusText, { color }]}>{label}</Text>
          </View>
        </View>

        <MetaRow date={item.date} endDate={item.endDateFormatted} acres={item.acres} />
        <View style={s.divider} />
        <MoneyRow
          label={isCompleted ? t("bookings.earned") : t("bookings.amount")}
          value={item.amount}
          color={color}
        />
      </SectionCard>
    );
  }

  const renderCards = () => {
    if (loading) {
      return (
        <View style={s.centerBox}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={s.loadingText}>Fetching bookings...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>⚠️</Text>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptyText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={s.retryBtn} activeOpacity={0.9}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data.length) {
      return (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>No {activeTab.label}</Text>
          <Text style={s.emptyText}>{t("bookings.noBookings")}</Text>
        </View>
      );
    }

    return data.map((item) => {
      if (tab === "requested") {
        return <RequestCard key={item._id} item={item} onAction={refetch} />;
      }
      if (tab === "ongoing") {
        return <OngoingCard key={item._id} item={item} onAction={refetch} />;
      }
      if (tab === "rejected") {
        return <RejectedCard key={item._id} item={item} />;
      }
      if (tab === "history") {
        return <HistoryCard key={item._id} item={item} />;
      }
      return null;
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={s.screen}>
        <ScrollView
          style={s.screen}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <View style={s.headerGlow} />
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{t("bookings.badge")}</Text>
            </View>
            <Text style={s.headerTitle}>{t("bookings.title")}</Text>
            <Text style={s.headerSub}>{t("bookings.subtitle")}</Text>
          </View>

          <View style={s.tabsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tabsRow}
            >
              {TABS.map((tb) => {
                const active = tab === tb.key;
                return (
                  <TouchableOpacity
                    key={tb.key}
                    style={[s.tabBtn, active && s.tabBtnActive]}
                    onPress={() => setTab(tb.key)}
                    activeOpacity={0.88}
                  >
                    <Ionicons
                      name={tb.icon as any}
                      size={16}
                      color={active ? "#fff" : C.muted}
                    />
                    <Text style={[s.tabText, active && s.tabTextActive]}>{tb.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={s.cardsList}>{renderCards()}</View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.primary },
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 100 },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 18 : 26,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    right: -30,
    top: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  headerBadgeText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 6,
  },
  headerSub: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    lineHeight: 20,
    maxWidth: "90%",
  },

  tabsWrap: {
    paddingTop: 18,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 8,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: C.border,
  },
  tabBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.shadowStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  tabText: { fontSize: 13, fontWeight: "700", color: C.muted },
  tabTextActive: { color: "#fff" },

  cardsList: { padding: 16, gap: 14 },

  bookingCard: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(233,224,216,0.9)",
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 5,
  },
  cardAccent: { width: 5, backgroundColor: C.primary },
  cardInner: { flex: 1, padding: 16 },

  bookingTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  personWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  personInfo: { marginLeft: 12, flex: 1 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "900" },
  farmerName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 2,
  },
  machineName: { fontSize: 12, color: C.muted },

  amountBadge: {
    backgroundColor: C.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  amountText: { fontSize: 12, fontWeight: "900", color: C.accent },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: "800" },

  bookingMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.bgSoft,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  metaText: { fontSize: 12, color: C.muted, fontWeight: "600" },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 14,
  },

  bookingActions: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: C.borderDark,
    backgroundColor: "#FCFAF8",
  },
  rejectText: { fontSize: 13, fontWeight: "700", color: C.muted },
  acceptBtn: {
    flex: 1.4,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    backgroundColor: C.primary,
    shadowColor: C.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  acceptText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  progressBlock: {
    marginBottom: 14,
    backgroundColor: C.bgSoft,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: C.muted, fontWeight: "700" },
  progressPct: { fontSize: 12, fontWeight: "900" },
  progressBg: {
    height: 8,
    backgroundColor: "#E9E2DB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  amountRowLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "700",
  },
  amountRowValue: {
    fontSize: 16,
    fontWeight: "900",
    color: C.ink,
  },

  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 54,
  },
  loadingText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 54,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 34, marginBottom: 14 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.primary,
  },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

const os = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(19,16,15,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    paddingBottom: Platform.OS === "ios" ? 34 : 18,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: C.borderDark,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
  },
  sheetHeaderIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
  },
  sheetTitleSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 3,
    lineHeight: 18,
  },
  sheetBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  farmerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bgSoft,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    borderRadius: 16,
    marginBottom: 18,
  },
  farmerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  farmerAvatarText: { fontSize: 16, fontWeight: "900" },
  farmerRowName: { fontSize: 14, fontWeight: "800", color: C.ink },
  farmerRowMachine: { fontSize: 12, color: C.muted, marginTop: 2 },
  sheetSub: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  sheetSubStrong: {
    fontWeight: "800",
    color: C.ink,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.borderDark,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    color: C.ink,
    backgroundColor: C.bgSoft,
  },
  otpBoxFilled: {
    borderColor: C.primary,
    backgroundColor: C.primarySoft,
    color: C.primary,
  },
  otpBoxError: {
    borderColor: C.danger,
    backgroundColor: C.dangerSoft,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: C.danger,
    fontWeight: "700",
  },
  verifyBtn: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  verifyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 2,
  },
  cancelText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "700",
  },
  actionBtn: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
});