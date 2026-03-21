import { useLang } from "@/contexts/LanguageContext";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../utils/axiosinstance";

const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#6B2737",
  primaryFaint: "#F7EEF0",
  primaryMid: "#8B3347",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  green: "#1A7F5A",
  greenLight: "#E8F7F2",
  red: "#C0392B",
  redLight: "#FDECEA",
  amber: "#B45309",
  amberLight: "#FEF3C7",
  blue: "#1A56A0",
  blueLight: "#EBF3FC",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  shadow: "rgba(107,39,55,0.10)",
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
  machine: "Labour Provider",
  acres: item.acre,
  startDate: item.startDate,
  endDate: item.endDate,
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

export default function LabourBookingsScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<TabKey>("requested");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "requested", label: t("bookings.requests"), icon: "time-outline" },
    { key: "ongoing", label: t("bookings.ongoing"), icon: "reload-circle-outline" },
    { key: "rejected", label: "Rejected", icon: "close-circle-outline" },
    { key: "history", label: "History", icon: "archive-outline" },
  ];

  const activeTab = TABS.find((tb) => tb.key === tab)!;

  const handleTabChange = (newTab: TabKey) => {
    setData([]);
    setError(null);
    setLoading(false);
    setTab(newTab);
  };

  const fetchBookings = async (currentTab: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      let result: any[] = [];
      if (currentTab === "history") {
        const [completedRes, cancelledRes] = await Promise.all([
          api.get("/booking/received/owner", { params: { status: "completed", bookingType: "laborProvider" } }),
          api.get("/booking/received/owner", { params: { status: "cancelled", bookingType: "laborProvider" } }),
        ]);
        result = [
          ...(completedRes.data ?? []),
          ...(cancelledRes.data ?? []),
        ].map(mapBooking);
      } else {
        const res = await api.get("/booking/received/owner", {
          params: { status: TAB_STATUS_MAP[currentTab], bookingType: "laborProvider" },
        });
        result = (res.data ?? []).map(mapBooking);
      }
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(tab);
  }, [tab]);

  function MetaRow({ date, endDate, acres }: { date: string; endDate?: string; acres: number }) {
    return (
      <View style={s.bookingMeta}>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{date}{endDate ? ` → ${endDate}` : ""}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="leaf-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{acres} {t("bookings.acres")}</Text>
        </View>
      </View>
    );
  }

  function RequestCard({ item, onAction }: { item: any; onAction: () => void }) {
    const [actionLoading, setActionLoading] = useState(false);

const handleAccept = async () => {
  setActionLoading(true);
  try {
    const res = await api.patch(`/booking/${item._id}/accept`, {
      startDate: item.startDate,  
      endDate: item.endDate,
    });
    console.log(res)
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
      Alert.alert("Decline Booking", "Are you sure you want to decline?", [
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
              const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Failed to decline booking";
              Alert.alert("Error", message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]);
    };

    return (
      <View style={s.bookingCard}>
        <View style={s.cardAccent} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{item.farmer.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
            <View style={s.amountBadge}>
              <Text style={s.amountText}>₹{item.amount.toLocaleString("en-IN")}</Text>
            </View>
          </View>
          <MetaRow date={item.date} endDate={item.endDateFormatted} acres={item.acres} />
          <View style={s.divider} />
          <View style={s.bookingActions}>
            <TouchableOpacity style={s.rejectBtn} onPress={handleDecline} disabled={actionLoading}>
              <Ionicons name="close" size={14} color={C.muted} />
              <Text style={s.rejectText}>{t("bookings.decline")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.acceptBtn, actionLoading && { opacity: 0.6 }]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={15} color="#fff" />
                  <Text style={s.acceptText}>{t("bookings.accept")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function OngoingCard({ item }: { item: any }) {
    const now = new Date();
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const isActive = now >= start && now <= end;
    const isUpcoming = now < start;

    const statusColor = isActive ? C.green : isUpcoming ? C.blue : C.amber;
    const statusBg = isActive ? C.greenLight : isUpcoming ? C.blueLight : C.amberLight;
    const statusLabel = isActive ? t("bookings.active") : isUpcoming ? "Upcoming" : "Wrapping up";
    const statusIcon = isActive ? "radio-button-on" : isUpcoming ? "hourglass-outline" : "flag-outline";

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
    const progress = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;

    return (
      <View style={s.bookingCard}>
        <View style={[s.cardAccent, { backgroundColor: statusColor }]} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={[s.avatarCircle, { backgroundColor: statusBg }]}>
              <Text style={[s.avatarText, { color: statusColor }]}>{item.farmer.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon as any} size={11} color={statusColor} />
              <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={s.progressBlock}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>
                {isActive ? "In progress" : isUpcoming ? "Starts " + item.date : "Completion"}
              </Text>
              <Text style={[s.progressPct, { color: statusColor }]}>{progress}%</Text>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: statusColor }]} />
            </View>
          </View>
          <MetaRow date={item.date} endDate={item.endDateFormatted} acres={item.acres} />
          <View style={s.divider} />
          <View style={s.amountRow}>
            <Ionicons name="people-outline" size={13} color={C.muted} />
            <Text style={s.amountRowLabel}>Labour service amount</Text>
            <Text style={s.amountRowValue}>₹{item.amount.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </View>
    );
  }

  function RejectedCard({ item }: { item: any }) {
    return (
      <View style={[s.bookingCard, { opacity: 0.85 }]}>
        <View style={[s.cardAccent, { backgroundColor: C.red }]} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={[s.avatarCircle, { backgroundColor: C.redLight }]}>
              <Text style={[s.avatarText, { color: C.red }]}>{item.farmer.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: C.redLight }]}>
              <Ionicons name="close-circle" size={11} color={C.red} />
              <Text style={[s.statusText, { color: C.red }]}>Rejected</Text>
            </View>
          </View>
          <MetaRow date={item.date} acres={item.acres} />
          <View style={s.divider} />
          <View style={s.amountRow}>
            <Ionicons name="cash-outline" size={13} color={C.muted} />
            <Text style={s.amountRowLabel}>{t("bookings.amount")}</Text>
            <Text style={[s.amountRowValue, { color: C.red }]}>₹{item.amount.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </View>
    );
  }

  function HistoryCard({ item }: { item: any }) {
    const isCompleted = item.bookingStatus === "completed";
    const color = isCompleted ? C.green : C.muted;
    const bgColor = isCompleted ? C.greenLight : "#F0EDEB";
    const icon: any = isCompleted ? "checkmark-circle" : "ban-outline";
    const label = isCompleted ? t("bookings.done") : t("bookings.cancelled");

    return (
      <View style={[s.bookingCard, { opacity: isCompleted ? 1 : 0.8 }]}>
        <View style={[s.cardAccent, { backgroundColor: color }]} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={[s.avatarCircle, { backgroundColor: bgColor }]}>
              <Text style={[s.avatarText, { color }]}>{item.farmer.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: bgColor }]}>
              <Ionicons name={icon} size={11} color={color} />
              <Text style={[s.statusText, { color }]}>{label}</Text>
            </View>
          </View>
          <MetaRow date={item.date} endDate={item.endDateFormatted} acres={item.acres} />
          <View style={s.divider} />
          <View style={s.amountRow}>
            <Ionicons name="cash-outline" size={13} color={C.muted} />
            <Text style={s.amountRowLabel}>{isCompleted ? t("bookings.earned") : t("bookings.amount")}</Text>
            <Text style={[s.amountRowValue, { color }]}>₹{item.amount.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </View>
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
        <View style={s.empty}>
          <Text style={s.emptyIcon}>⚠️</Text>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchBookings(tab)} style={s.retryBtn}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!data.length) {
      return (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>👷</Text>
          <Text style={s.emptyTitle}>No {activeTab.label}</Text>
          <Text style={s.emptyText}>{t("bookings.noBookings")}</Text>
        </View>
      );
    }
    return data.map((item) => {
      if (tab === "requested") return <RequestCard key={item._id} item={item} onAction={() => fetchBookings(tab)} />;
      if (tab === "ongoing") return <OngoingCard key={item._id} item={item} />;
      if (tab === "rejected") return <RejectedCard key={item._id} item={item} />;
      if (tab === "history") return <HistoryCard key={item._id} item={item} />;
      return null;
    });
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>LABOUR BOOKINGS</Text>
        </View>
        <Text style={s.headerTitle}>Labour Bookings</Text>
        <Text style={s.headerSub}>Manage your labour provider requests</Text>
      </View>

      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {TABS.map((tb) => {
            const active = tab === tb.key;
            return (
              <TouchableOpacity
                key={tb.key}
                style={[s.tabBtn, active && s.tabBtnActive]}
                onPress={() => handleTabChange(tb.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={tb.icon as any} size={15} color={active ? "#fff" : C.muted} />
                <Text style={[s.tabText, active && s.tabTextActive]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={s.cardsList}>{renderCards()}</View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 80 },
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 30, fontWeight: "800", lineHeight: 36, marginBottom: 6 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  tabsWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 },
  tabsRow: { flexDirection: "row", gap: 8 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: C.muted },
  tabTextActive: { color: "#fff" },
  cardsList: { padding: 16, gap: 14 },
  bookingCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: "row",
  },
  cardAccent: { width: 4, backgroundColor: C.primary },
  cardInner: { flex: 1, padding: 16 },
  bookingTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "800", color: C.primary },
  farmerName: { fontSize: 15, fontWeight: "800", color: C.ink },
  machineName: { fontSize: 12, color: C.muted, marginTop: 2 },
  amountBadge: { backgroundColor: C.accentLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  amountText: { fontSize: 13, fontWeight: "800", color: C.accent },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  bookingMeta: { flexDirection: "row", gap: 14, marginBottom: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: C.muted, fontWeight: "500" },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
  bookingActions: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  rejectText: { fontSize: 13, fontWeight: "700", color: C.muted },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.primary,
    elevation: 3,
  },
  acceptText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  progressBlock: { marginBottom: 12 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  progressPct: { fontSize: 12, fontWeight: "800" },
  progressBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  amountRowLabel: { flex: 1, fontSize: 12, color: C.muted, fontWeight: "600" },
  amountRowValue: { fontSize: 15, fontWeight: "900", color: C.ink },
  centerBox: { alignItems: "center", paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 13, color: C.muted },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginBottom: 4 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center" },
  retryBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});