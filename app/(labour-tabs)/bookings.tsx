// app/labour-bookings.tsx
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
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  shadow: "rgba(107,39,55,0.10)",
};

const TABS = [
  { key: "request",   label: "Requests",  icon: "time-outline",             count: 2 },
  { key: "ongoing",   label: "Ongoing",   icon: "reload-circle-outline",    count: 1 },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline", count: 8 },
];

const SAMPLE = {
  request: [
    { id: "1", farmer: "Rajesh Patil",  location: "Nashik, Maharashtra", skill: "Harvesting", workers: 4, date: "18 Mar 2026", days: 2, amount: 6400 },
    { id: "2", farmer: "Suresh Yadav",  location: "Pune, Maharashtra",   skill: "Sowing",     workers: 2, date: "20 Mar 2026", days: 1, amount: 2800 },
  ],
  ongoing: [
    { id: "3", farmer: "Anand Sharma",  location: "Aurangabad, MH",      skill: "Spraying",   workers: 3, date: "14 Mar 2026", days: 3, amount: 7200, progress: 45 },
  ],
  completed: [
    { id: "4", farmer: "Vikas Jadhav",  location: "Nagpur, Maharashtra", skill: "Harvesting", workers: 5, date: "10 Mar 2026", days: 2, amount: 8000 },
    { id: "5", farmer: "Mohan Desai",   location: "Solapur, Maharashtra",skill: "Sowing",     workers: 3, date: "06 Mar 2026", days: 1, amount: 4200 },
  ],
};

const SKILL_ICONS: Record<string, string> = {
  Harvesting: "🌾",
  Sowing: "🌱",
  Spraying: "💧",
  Driver: "🚜",
  "Drone Op.": "🚁",
};

type TabKey = "request" | "ongoing" | "completed";

function RequestCard({ item }: { item: any }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{item.farmer.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.farmerName}>{item.farmer}</Text>
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={12} color={C.muted} />
            <Text style={s.locText}>{item.location}</Text>
          </View>
        </View>
        <View style={s.amountBadge}>
          <Text style={s.amountText}>₹{item.amount.toLocaleString("en-IN")}</Text>
        </View>
      </View>

      <View style={s.skillRow}>
        <Text style={s.skillEmoji}>{SKILL_ICONS[item.skill] ?? "👷"}</Text>
        <Text style={s.skillText}>{item.skill}</Text>
      </View>

      <View style={s.metaRow}>
        <View style={s.metaChip}>
          <Ionicons name="calendar-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.date}</Text>
        </View>
        <View style={s.metaChip}>
          <Ionicons name="people-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.workers} workers</Text>
        </View>
        <View style={s.metaChip}>
          <Ionicons name="sunny-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.days} day{item.days > 1 ? "s" : ""}</Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.actions}>
        <TouchableOpacity style={s.declineBtn}>
          <Text style={s.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.acceptBtn}>
          <Ionicons name="checkmark" size={15} color="#fff" />
          <Text style={s.acceptText}>Accept Job</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OngoingCard({ item }: { item: any }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: C.greenLight }]}>
          <Text style={[s.avatarText, { color: C.green }]}>{item.farmer.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.farmerName}>{item.farmer}</Text>
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={12} color={C.muted} />
            <Text style={s.locText}>{item.location}</Text>
          </View>
        </View>
        <View style={[s.statusPill, { backgroundColor: C.greenLight }]}>
          <View style={[s.statusDot, { backgroundColor: C.green }]} />
          <Text style={[s.statusLabel, { color: C.green }]}>Active</Text>
        </View>
      </View>

      <View style={s.skillRow}>
        <Text style={s.skillEmoji}>{SKILL_ICONS[item.skill] ?? "👷"}</Text>
        <Text style={s.skillText}>{item.skill}</Text>
      </View>

      <View style={s.progressBlock}>
        <View style={s.progressHeader}>
          <Text style={s.progressLabel}>Work Progress</Text>
          <Text style={[s.progressPct, { color: C.green }]}>{item.progress}%</Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${item.progress}%` as any }]} />
        </View>
      </View>

      <View style={s.metaRow}>
        <View style={s.metaChip}>
          <Ionicons name="calendar-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.date}</Text>
        </View>
        <View style={s.metaChip}>
          <Ionicons name="people-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.workers} workers</Text>
        </View>
        <View style={s.metaChip}>
          <Ionicons name="cash-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>₹{item.amount.toLocaleString("en-IN")}</Text>
        </View>
      </View>
    </View>
  );
}

function CompletedCard({ item }: { item: any }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={[s.avatar, { backgroundColor: "#F0EDEB" }]}>
          <Text style={[s.avatarText, { color: C.muted }]}>{item.farmer.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.farmerName}>{item.farmer}</Text>
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={12} color={C.muted} />
            <Text style={s.locText}>{item.location}</Text>
          </View>
        </View>
        <View style={[s.statusPill, { backgroundColor: "#F0EDEB" }]}>
          <Ionicons name="checkmark-circle" size={13} color={C.muted} />
          <Text style={[s.statusLabel, { color: C.muted }]}>Done</Text>
        </View>
      </View>

      <View style={s.skillRow}>
        <Text style={s.skillEmoji}>{SKILL_ICONS[item.skill] ?? "👷"}</Text>
        <Text style={s.skillText}>{item.skill}</Text>
      </View>

      <View style={s.metaRow}>
        <View style={s.metaChip}>
          <Ionicons name="calendar-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.date}</Text>
        </View>
        <View style={s.metaChip}>
          <Ionicons name="people-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.workers} workers</Text>
        </View>
        <View style={s.metaChip}>
          <Ionicons name="sunny-outline" size={12} color={C.muted} />
          <Text style={s.metaText}>{item.days} day{item.days > 1 ? "s" : ""}</Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.completedFooter}>
        <Text style={s.earnedLabel}>Total Earned</Text>
        <Text style={s.earnedAmount}>₹{item.amount.toLocaleString("en-IN")}</Text>
      </View>
    </View>
  );
}

export default function LabourBookingsScreen() {
  const [tab, setTab] = useState<TabKey>("request");

  const data = SAMPLE[tab];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>AGRIDAS • LABOUR</Text>
        </View>
        <Text style={s.headerTitle}>Bookings{"\n"}Received</Text>
        <Text style={s.headerSub}>Manage your incoming job requests</Text>

        {/* Stats strip */}
        <View style={s.strip}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={s.stripItem}
              onPress={() => setTab(t.key as TabKey)}
            >
              <Text style={[s.stripNum, tab !== t.key && { color: "rgba(255,255,255,0.55)" }]}>
                {t.count}
              </Text>
              <Text style={s.stripLabel}>{t.label}</Text>
              {tab === t.key && <View style={s.stripLine} />}
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
                <Ionicons name={t.icon as any} size={14} color={active ? "#fff" : C.muted} />
                <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
                {t.count > 0 && (
                  <View style={[s.countBadge, active && s.countBadgeActive]}>
                    <Text style={[s.countText, active && s.countTextActive]}>{t.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Cards ── */}
      <View style={s.list}>
        {data.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No bookings here</Text>
            <Text style={s.emptyText}>Check back soon for new job requests.</Text>
          </View>
        ) : (
          data.map((item) => {
            if (tab === "request")   return <RequestCard   key={item.id} item={item} />;
            if (tab === "ongoing")   return <OngoingCard   key={item.id} item={item} />;
            if (tab === "completed") return <CompletedCard key={item.id} item={item} />;
            return null;
          })
        )}
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
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 10,
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
  stripLine: {
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
  countBadge: {
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 7, paddingVertical: 1, borderRadius: 20,
  },
  countBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  countText: { fontSize: 11, fontWeight: "800", color: C.primary },
  countTextActive: { color: "#fff" },

  // List
  list: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
    marginBottom: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.primaryFaint,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: C.primary },
  farmerName: { fontSize: 15, fontWeight: "800", color: C.ink },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locText: { fontSize: 12, color: C.muted },

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
  statusLabel: { fontSize: 12, fontWeight: "700" },

  // Skill row
  skillRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, marginBottom: 12, alignSelf: "flex-start",
  },
  skillEmoji: { fontSize: 15 },
  skillText: { fontSize: 13, fontWeight: "700", color: C.primary },

  // Meta chips
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: C.muted, fontWeight: "500" },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  // Actions
  actions: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, alignItems: "center",
  },
  declineText: { fontSize: 13, fontWeight: "700", color: C.muted },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 5,
    paddingVertical: 11, borderRadius: 12,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  acceptText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // Progress
  progressBlock: { marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  progressPct: { fontSize: 12, fontWeight: "800" },
  progressBg: { height: 6, backgroundColor: C.greenLight, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: C.green, borderRadius: 3 },

  // Completed
  completedFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  earnedLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  earnedAmount: { fontSize: 17, fontWeight: "900", color: C.ink },

  // Empty
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginBottom: 4 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center" },
});