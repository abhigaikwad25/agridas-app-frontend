// app/bookings.tsx
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#6B2737",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  green: "#1A7F5A",
  greenLight: "#E8F7F2",
  amber: "#B45309",
  amberLight: "#FEF3C7",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  shadow: "rgba(107,39,55,0.10)",
};

const TABS = [
  { key: "request",   label: "Requests",  icon: "time-outline",           count: 3  },
  { key: "ongoing",   label: "Ongoing",   icon: "reload-circle-outline",  count: 1  },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline", count: 12 },
];

// ── Placeholder booking cards ─────────────────────────────────────────────────
const SAMPLE = {
  request: [
    { id: "1", farmer: "Rajesh Patil",   machine: "John Deere 5050D", acres: 5,  date: "18 Mar 2026", amount: 3500  },
    { id: "2", farmer: "Suresh Yadav",   machine: "Mahindra 575 DI",  acres: 3,  date: "19 Mar 2026", amount: 2100  },
    { id: "3", farmer: "Dinesh Kumar",   machine: "John Deere 5050D", acres: 8,  date: "20 Mar 2026", amount: 5600  },
  ],
  ongoing: [
    { id: "4", farmer: "Anand Sharma",   machine: "Mahindra 575 DI",  acres: 6,  date: "14 Mar 2026", amount: 4200  },
  ],
  completed: [
    { id: "5", farmer: "Vikas Jadhav",   machine: "John Deere 5050D", acres: 4,  date: "10 Mar 2026", amount: 2800  },
    { id: "6", farmer: "Mohan Desai",    machine: "Sonalika 750 DI",  acres: 10, date: "08 Mar 2026", amount: 7000  },
  ],
};

type TabKey = "request" | "ongoing" | "completed";

function RequestCard({ item }: { item: any }) {
  return (
    <View style={s.bookingCard}>
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

      <View style={s.bookingMeta}>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{item.date}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="leaf-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{item.acres} acres</Text>
        </View>
      </View>

      <View style={s.bookingActions}>
        <TouchableOpacity style={s.rejectBtn}>
          <Text style={s.rejectText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.acceptBtn}>
          <Ionicons name="checkmark" size={15} color="#fff" />
          <Text style={s.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OngoingCard({ item }: { item: any }) {
  return (
    <View style={s.bookingCard}>
      <View style={s.bookingTop}>
        <View style={[s.avatarCircle, { backgroundColor: C.greenLight }]}>
          <Text style={[s.avatarText, { color: C.green }]}>{item.farmer.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.farmerName}>{item.farmer}</Text>
          <Text style={s.machineName}>{item.machine}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: C.greenLight }]}>
          <View style={[s.statusDot, { backgroundColor: C.green }]} />
          <Text style={[s.statusText, { color: C.green }]}>Active</Text>
        </View>
      </View>

      <View style={s.progressBlock}>
        <View style={s.progressRow}>
          <Text style={s.progressLabel}>Progress</Text>
          <Text style={s.progressPct}>60%</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: "60%" }]} />
        </View>
      </View>

      <View style={s.bookingMeta}>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{item.date}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="leaf-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{item.acres} acres</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="cash-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>₹{item.amount.toLocaleString("en-IN")}</Text>
        </View>
      </View>
    </View>
  );
}

function CompletedCard({ item }: { item: any }) {
  return (
    <View style={s.bookingCard}>
      <View style={s.bookingTop}>
        <View style={[s.avatarCircle, { backgroundColor: "#F0EDEB" }]}>
          <Text style={[s.avatarText, { color: C.muted }]}>{item.farmer.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.farmerName}>{item.farmer}</Text>
          <Text style={s.machineName}>{item.machine}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: "#F0EDEB" }]}>
          <Ionicons name="checkmark-circle" size={13} color={C.muted} />
          <Text style={[s.statusText, { color: C.muted }]}>Done</Text>
        </View>
      </View>

      <View style={s.bookingMeta}>
        <View style={s.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{item.date}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="leaf-outline" size={13} color={C.muted} />
          <Text style={s.metaText}>{item.acres} acres</Text>
        </View>
      </View>

      <View style={s.completedFooter}>
        <Text style={s.earnedLabel}>Earned</Text>
        <Text style={s.earnedAmount}>₹{item.amount.toLocaleString("en-IN")}</Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const [tab, setTab] = useState<TabKey>("request");

  const activeTab = TABS.find(t => t.key === tab)!;

  const renderCards = () => {
    const data = SAMPLE[tab];
    if (!data.length) return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>📋</Text>
        <Text style={s.emptyTitle}>No {activeTab.label}</Text>
        <Text style={s.emptyText}>Nothing here yet — check back soon.</Text>
      </View>
    );

    return data.map((item) => {
      if (tab === "request")   return <RequestCard   key={item.id} item={item} />;
      if (tab === "ongoing")   return <OngoingCard   key={item.id} item={item} />;
      if (tab === "completed") return <CompletedCard key={item.id} item={item} />;
      return null;
    });
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>AGRIDAS • SELLER</Text>
        </View>
        <Text style={s.headerTitle}>Bookings{"\n"}Received</Text>
        <Text style={s.headerSub}>Manage all your machine booking requests</Text>

        {/* Summary strip */}
        <View style={s.strip}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={s.stripItem} onPress={() => setTab(t.key as TabKey)}>
              <Text style={[s.stripNum, tab === t.key && { color: "#fff" }, tab !== t.key && { color: "rgba(255,255,255,0.6)" }]}>
                {t.count}
              </Text>
              <Text style={s.stripLabel}>{t.label}</Text>
              {tab === t.key && <View style={s.stripActiveLine} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[s.tabBtn, active && s.tabBtnActive]}
                onPress={() => setTab(t.key as TabKey)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={t.icon as any}
                  size={15}
                  color={active ? "#fff" : C.muted}
                />
                <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
                {t.count > 0 && (
                  <View style={[s.tabCount, active && s.tabCountActive]}>
                    <Text style={[s.tabCountText, active && s.tabCountTextActive]}>{t.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Cards ── */}
      <View style={s.cardsList}>
        {renderCards()}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingBottom: 60 },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 24, paddingHorizontal: 20,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10,
  },
  headerBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  headerTitle: { color: "#fff", fontSize: 30, fontWeight: "800", lineHeight: 36, marginBottom: 6 },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 20 },

  strip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
  },
  stripItem: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  stripNum: { fontSize: 20, fontWeight: "900", color: "#fff" },
  stripLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600", marginTop: 2 },
  stripActiveLine: {
    position: "absolute", bottom: 0, left: 16, right: 16,
    height: 2, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 1,
  },

  // Tabs
  tabsWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 4 },
  tabsRow: { flexDirection: "row", gap: 8 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 50,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: C.muted },
  tabTextActive: { color: "#fff" },
  tabCount: {
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 7, paddingVertical: 1, borderRadius: 20,
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: { fontSize: 11, fontWeight: "800", color: C.primary },
  tabCountTextActive: { color: "#fff" },

  // Cards list
  cardsList: { padding: 16, gap: 12 },

  // Booking card
  bookingCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  bookingTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: C.primary },
  farmerName: { fontSize: 15, fontWeight: "800", color: C.ink },
  machineName: { fontSize: 12, color: C.muted, marginTop: 2 },

  amountBadge: {
    backgroundColor: C.accentLight,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  amountText: { fontSize: 13, fontWeight: "800", color: C.accent },

  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "700" },

  bookingMeta: { flexDirection: "row", gap: 14, marginBottom: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: C.muted, fontWeight: "500" },

  // Request actions
  bookingActions: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: "center",
  },
  rejectText: { fontSize: 13, fontWeight: "700", color: C.muted },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 11, borderRadius: 12,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  acceptText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // Ongoing progress
  progressBlock: { marginBottom: 12 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  progressPct: { fontSize: 12, fontWeight: "800", color: C.green },
  progressBg: {
    height: 6, backgroundColor: C.greenLight, borderRadius: 3, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: C.green, borderRadius: 3 },

  // Completed footer
  completedFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1, borderColor: C.border,
  },
  earnedLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  earnedAmount: { fontSize: 16, fontWeight: "900", color: C.ink },

  // Empty
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginBottom: 4 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center" },
});