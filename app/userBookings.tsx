import { useLang } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
import api from "./utils/axiosinstance";

const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#393E46",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  green: "#1A7F5A",
  greenLight: "#E8F7F2",
  red: "#C0392B",
  redLight: "#FDECEA",
  amber: "#393E46",
  amberLight: "#393E46",
  blue: "#1A56A0",
  blueLight: "#EBF3FC",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  shadow: "rgba(107,39,55,0.10)",
};

type TabKey = "requested" | "ongoing" | "rejected" | "history";

const TAB_STATUS_MAP: Record<TabKey, string> = {
  requested: "requested",
  ongoing: "accepted",
  rejected: "rejected",
  history: "history",
};

const LIMIT = 10;

const mapBooking = (item: any) => ({
  _id: item._id,
  farmer: item.name,
  machine: item.bookingType,
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
  startOtp: item.startOtp,
  endOtp: item.endOtp,
});

export default function UserBookingsScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<TabKey>("requested");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to always have the latest skip value inside the scroll handler
  const skipRef = useRef(0);

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "requested", label: "Requested", icon: "time-outline" },
    { key: "ongoing", label: "Ongoing", icon: "reload-circle-outline" },
    { key: "rejected", label: "Rejected", icon: "close-circle-outline" },
    { key: "history", label: "History", icon: "archive-outline" },
  ];

  const activeTab = TABS.find((tb) => tb.key === tab)!;

  // ─── Pagination-aware fetch ───────────────────────────────────────────────
  const fetchBookings = async (currentTab: TabKey, currentSkip: number) => {
    // First page → full loader; subsequent pages → bottom spinner
    if (currentSkip === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      let result: any[] = [];

      if (currentTab === "history") {
        const [completedRes, cancelledRes] = await Promise.all([
          api.get("/booking/requested/user", {
            params: { status: "completed", skip: currentSkip, limit: LIMIT },
          }),
          api.get("/booking/requested/user", {
            params: { status: "cancelled", skip: currentSkip, limit: LIMIT },
          }),
        ]);
        result = [
          ...(completedRes.data ?? []),
          ...(cancelledRes.data ?? []),
        ].map(mapBooking);
      } else if (currentTab === "ongoing") {
        const [acceptedRes, startedRes] = await Promise.all([
          api.get("/booking/requested/user", {
            params: { status: "accepted", skip: currentSkip, limit: LIMIT },
          }),
          api.get("/booking/requested/user", {
            params: { status: "started", skip: currentSkip, limit: LIMIT },
          }),
        ]);
        result = [
          ...(acceptedRes.data ?? []),
          ...(startedRes.data ?? []),
        ].map(mapBooking);
      } else {
        const res = await api.get("/booking/requested/user", {
          params: {
            status: TAB_STATUS_MAP[currentTab],
            skip: currentSkip,
            limit: LIMIT,
          },
        });
        result = (res.data ?? []).map(mapBooking);
      }

      // Append on load-more, replace on fresh fetch
      if (currentSkip === 0) {
        setData(result);
      } else {
        setData((prev) => [...prev, ...result]);
      }

      // For merged tabs (ongoing / history) each sub-call returns up to LIMIT,
      // so if the combined result is 0 there's nothing more to load.
      // For single-status tabs, fewer than LIMIT means last page.
      const isMergedTab = currentTab === "ongoing" || currentTab === "history";
      setHasMore(isMergedTab ? result.length > 0 : result.length === LIMIT);

      // Keep ref in sync
      skipRef.current = currentSkip;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ─── Tab switching ────────────────────────────────────────────────────────
  const handleTabChange = (newTab: TabKey) => {
    // FIX: If the user taps the already-active tab, just re-fetch from scratch
    // instead of clearing data with no follow-up fetch.
    if (newTab === tab) {
      skipRef.current = 0;
      setHasMore(true);
      setData([]);
      setError(null);
      fetchBookings(newTab, 0);
      return;
    }

    // Switching to a different tab
    skipRef.current = 0;
    setHasMore(true);
    setData([]);
    setError(null);
    setLoadingMore(false);
    setTab(newTab); // triggers the useEffect below
  };

  useEffect(() => {
    skipRef.current = 0;
    setHasMore(true);
    fetchBookings(tab, 0);
  }, [tab]);

  // ─── Infinite scroll ──────────────────────────────────────────────────────
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 80;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !loading && !loadingMore && hasMore) {
      const nextSkip = skipRef.current + LIMIT;
      fetchBookings(tab, nextSkip);
    }
  };

  // ─── Sub-components ───────────────────────────────────────────────────────
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
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>
            {date}
            {endDate ? ` → ${endDate}` : ""}
          </Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="leaf-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{acres} acres</Text>
        </View>
      </View>
    );
  }

  function RequestedCard({
    item,
    onAction,
  }: {
    item: any;
    onAction: () => void;
  }) {
    const [cancelLoading, setCancelLoading] = useState(false);

    const handleCancel = async () => {
      Alert.alert(
        "Cancel Booking",
        "Are you sure you want to cancel this booking?",
        [
          { text: "No, Keep it", style: "cancel" },
          {
            text: "Yes, Cancel",
            style: "destructive",
            onPress: async () => {
              setCancelLoading(true);
              try {
                await api.patch(`/booking/${item._id}/cancel`);
                onAction();
              } catch (err: any) {
                Alert.alert(
                  "Error",
                  err?.response?.data?.message || "Failed to cancel booking"
                );
              } finally {
                setCancelLoading(false);
              }
            },
          },
        ]
      );
    };

    return (
      <View style={s.bookingCard}>
        <View style={[s.cardAccent, { backgroundColor: C.amber }]} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={[s.avatarCircle, { backgroundColor: C.amberLight }]}>
              <Text style={[s.avatarText, { color: C.amber }]}>
                {item.farmer.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: C.amberLight }]}>
              <Ionicons name="hourglass-outline" size={11} color={C.amber} />
              <Text style={[s.statusText, { color: C.amber }]}>Pending</Text>
            </View>
          </View>

          <MetaRow
            date={item.date}
            endDate={item.endDateFormatted}
            acres={item.acres}
          />
          <View style={s.divider} />

          <View style={s.bottomRow}>
            <View style={s.amountRow}>
              <Ionicons name="cash-outline" size={13} color={C.muted} />
              <Text style={s.amountRowLabel}>Total</Text>
              <Text style={s.amountRowValue}>
                ₹{item.amount.toLocaleString("en-IN")}
              </Text>
            </View>

            <TouchableOpacity
              style={[s.cancelBtn, cancelLoading && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator size="small" color={C.red} />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={14}
                    color={C.red}
                  />
                  <Text style={s.cancelText}>Cancel</Text>
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
    const statusBg = isActive
      ? C.greenLight
      : isUpcoming
      ? C.blueLight
      : C.amberLight;
    const statusLabel = isActive
      ? "Active"
      : isUpcoming
      ? "Upcoming"
      : "Wrapping up";
    const statusIcon = isActive
      ? "radio-button-on"
      : isUpcoming
      ? "hourglass-outline"
      : "flag-outline";

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.min(
      Math.max(now.getTime() - start.getTime(), 0),
      totalMs
    );
    const progress = totalMs > 0 ? Math.round((elapsedMs / totalMs) * 100) : 0;

    return (
      <View style={s.bookingCard}>
        <View style={[s.cardAccent, { backgroundColor: statusColor }]} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={[s.avatarCircle, { backgroundColor: statusBg }]}>
              <Text style={[s.avatarText, { color: statusColor }]}>
                {item.farmer.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.farmerName}>{item.farmer}</Text>
              <Text style={s.machineName}>{item.machine}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon as any} size={11} color={statusColor} />
              <Text style={[s.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={s.progressBlock}>
            <View style={s.progressRow}>
              <Text style={s.progressLabel}>
                {isActive
                  ? "In progress"
                  : isUpcoming
                  ? "Starts " + item.date
                  : "Completion"}
              </Text>
              <Text style={[s.progressPct, { color: statusColor }]}>
                {progress}%
              </Text>
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

          <MetaRow
            date={item.date}
            endDate={item.endDateFormatted}
            acres={item.acres}
          />
          <View style={s.divider} />

          <View style={s.otpBlock}>
            <View style={s.otpSection}>
              <View style={s.otpSectionHeader}>
                <Ionicons
                  name="play-circle-outline"
                  size={16}
                  color={C.blue}
                />
                <Text style={s.otpSectionTitle}>Start OTP</Text>
              </View>
              <Text style={s.otpSectionSub}>
                {item.startOtp ? item.startOtp : "Pending verification"}
              </Text>
            </View>

            {item.bookingStatus === "started" && (
              <View style={s.otpSection}>
                <View style={s.otpSectionHeader}>
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={16}
                    color={C.green}
                  />
                  <Text style={s.otpSectionTitle}>End OTP</Text>
                </View>
                <Text style={s.otpSectionSub}>
                  {item.endOtp ? item.endOtp : "Pending completion"}
                </Text>
              </View>
            )}
          </View>

          <View style={s.amountRowSingle}>
            <Ionicons name="cash-outline" size={13} color={C.muted} />
            <Text style={s.amountRowLabel}>Service amount</Text>
            <Text style={s.amountRowValue}>
              ₹{item.amount.toLocaleString("en-IN")}
            </Text>
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
              <Text style={[s.avatarText, { color: C.red }]}>
                {item.farmer.charAt(0)}
              </Text>
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

          <View style={s.amountRowSingle}>
            <Ionicons name="cash-outline" size={13} color={C.muted} />
            <Text style={s.amountRowLabel}>Amount</Text>
            <Text style={[s.amountRowValue, { color: C.red }]}>
              ₹{item.amount.toLocaleString("en-IN")}
            </Text>
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
    const label = isCompleted ? "Completed" : "Cancelled";

    return (
      <View style={[s.bookingCard, { opacity: isCompleted ? 1 : 0.8 }]}>
        <View style={[s.cardAccent, { backgroundColor: color }]} />
        <View style={s.cardInner}>
          <View style={s.bookingTop}>
            <View style={[s.avatarCircle, { backgroundColor: bgColor }]}>
              <Text style={[s.avatarText, { color }]}>
                {item.farmer.charAt(0)}
              </Text>
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

          <MetaRow
            date={item.date}
            endDate={item.endDateFormatted}
            acres={item.acres}
          />
          <View style={s.divider} />

          <View style={s.amountRowSingle}>
            <Ionicons name="cash-outline" size={13} color={C.muted} />
            <Text style={s.amountRowLabel}>
              {isCompleted ? "Earned" : "Amount"}
            </Text>
            <Text style={[s.amountRowValue, { color }]}>
              ₹{item.amount.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
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
          <TouchableOpacity
            onPress={() => fetchBookings(tab, 0)}
            style={s.retryBtn}
          >
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data.length) {
      return (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>No {activeTab.label}</Text>
          <Text style={s.emptyText}>No bookings found here yet.</Text>
        </View>
      );
    }

    return (
      <>
        {data.map((item) => {
          if (tab === "requested")
            return (
              <RequestedCard
                key={item._id}
                item={item}
                onAction={() => fetchBookings(tab, 0)}
              />
            );
          if (tab === "ongoing")
            return <OngoingCard key={item._id} item={item} />;
          if (tab === "rejected")
            return <RejectedCard key={item._id} item={item} />;
          if (tab === "history")
            return <HistoryCard key={item._id} item={item} />;
          return null;
        })}

        {/* Bottom load-more spinner */}
        {loadingMore && (
          <View style={s.loadMoreBox}>
            <ActivityIndicator color={C.primary} size="small" />
            <Text style={s.loadingText}>Loading more...</Text>
          </View>
        )}

        {/* End-of-list indicator */}
        {!hasMore && data.length > 0 && (
          <View style={s.endBox}>
            <Text style={s.endText}>You've seen all bookings</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={400}
    >
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>MY BOOKINGS</Text>
        </View>
        <Text style={s.headerTitle}>Your Bookings</Text>
        <Text style={s.headerSub}>Track and manage your service requests</Text>
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
                onPress={() => handleTabChange(tb.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tb.icon as any}
                  size={15}
                  color={active ? "#fff" : C.muted}
                />
                <Text style={[s.tabText, active && s.tabTextActive]}>
                  {tb.label}
                </Text>
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
  screen: { flex: 1, backgroundColor: "#f4f6f4" },
  container: { paddingBottom: 80 },

  header: {
    backgroundColor: "#1e7f43",
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },

  headerBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 6,
  },

  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  tabsWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 },
  tabsRow: { flexDirection: "row", gap: 8 },

  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e0e5e0",
  },

  tabBtnActive: {
    backgroundColor: "#1e7f43",
    borderColor: "#1e7f43",
  },

  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },

  cardsList: { padding: 16, gap: 14 },

  bookingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: "row",
  },

  cardAccent: { width: 4, backgroundColor: "#1e7f43" },
  cardInner: { flex: 1, padding: 16 },

  bookingTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },

  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f2ea",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: { fontSize: 17, fontWeight: "800", color: "#1e7f43" },
  farmerName: { fontSize: 15, fontWeight: "800", color: "#1f2937" },
  machineName: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  amountBadge: {
    backgroundColor: "#e6f2ea",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  amountText: { fontSize: 13, fontWeight: "800", color: "#1e7f43" },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: { fontSize: 11, fontWeight: "700" },

  bookingMeta: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },

  divider: { height: 1, backgroundColor: "#e0e5e0", marginBottom: 12 },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  amountRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  amountRowSingle: { flexDirection: "row", alignItems: "center", gap: 6 },

  amountRowLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  amountRowValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1f2937",
  },

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#dc2626",
    backgroundColor: "#fdecec",
  },

  cancelText: { fontSize: 12, fontWeight: "700", color: "#dc2626" },

  progressBlock: { marginBottom: 12 },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  progressLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  progressPct: { fontSize: 12, fontWeight: "800" },

  progressBg: {
    height: 6,
    backgroundColor: "#e0e5e0",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#1e7f43",
  },

  otpBlock: {
    marginBottom: 14,
    gap: 10,
  },

  otpSection: {
    backgroundColor: "#f4f6f4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0e5e0",
    padding: 12,
  },

  otpSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  otpSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
  },

  otpSectionSub: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },

  centerBox: { alignItems: "center", paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 13, color: "#6b7280" },

  loadMoreBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
    flexDirection: "row",
    justifyContent: "center",
  },

  endBox: {
    alignItems: "center",
    paddingVertical: 20,
  },

  endText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },

  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },

  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#1e7f43",
    borderRadius: 12,
  },

  retryText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});