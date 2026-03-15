import { getToken } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#F9F5F0",
  card: "#FFFFFF",
  primary: "#6B2737",
  primaryLight: "#9B3E52",
  primaryFaint: "#F7EEF0",
  accent: "#D4873A",
  accentLight: "#FDF3E7",
  green: "#1A7F5A",
  greenLight: "#E8F7F2",
  red: "#C0392B",
  redLight: "#FEECEB",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#E8E0D8",
  inputBg: "#FEFCFB",
  shadow: "rgba(107,39,55,0.10)",
};

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  credit: { icon: "arrow-down-circle", color: C.green, bg: C.greenLight },
  debit:  { icon: "arrow-up-circle",   color: C.red,   bg: C.redLight  },
};

export default function Dashboard({ apiUrlbal, apiUrl, apiUrldel, role, categories, title }) {
  const [earnings, setEarnings] = useState({ totalAmt: 0, totalCredit: 0, totalDebit: 0 });
  const types = ["credit", "debit"];
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: categories[0],
    type: types[0],
  });

  const fetchDashboard = async () => {
    try {
      const token = await getToken();
      const res = await fetch(apiUrlbal, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEarnings({
        totalAmt: data.totalamt || 0,
        totalCredit: data.totalcredit || 0,
        totalDebit: data.totaldebit || 0,
      });
      setTransactions(data.expenses || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const fmt = (v?: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "Other";

  const submitExpense = async () => {
    if (!form.amount) return Alert.alert("Enter amount");
    try {
      const token = await getToken();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          role,
          type: form.type,
          expcategory: form.category,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong!");
      Alert.alert("Success", "Transaction added!");
      setForm({ ...form, description: "", amount: "" });
      setModalVisible(false);
      fetchDashboard();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const deleteTransaction = async (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${apiUrldel}/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchDashboard();
          } catch (err) { Alert.alert("Error", "Failed to delete"); }
        },
      },
    ]);
  };

  const renderTransaction = ({ item, index }: any) => {
    const meta = TYPE_META[item.type] ?? TYPE_META.debit;
    return (
      <View style={[s.txCard, { marginTop: index === 0 ? 4 : 0 }]}>
        <View style={[s.txIconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.txDesc} numberOfLines={1}>
            {item.description || "No description"}
          </Text>
          <View style={s.txMetaRow}>
            <View style={[s.txTypeBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.txTypeBadgeText, { color: meta.color }]}>
                {fmt(item.type)}
              </Text>
            </View>
            <Text style={s.txCat}>• {fmt(item.expcategory)}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 8 }}>
          <Text style={[s.txAmount, { color: meta.color }]}>
            {item.type === "credit" ? "+" : "−"}₹{item.amount}
          </Text>
          <TouchableOpacity
            onPress={() => deleteTransaction(item._id)}
            style={s.txDeleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color={C.red} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      {/* ── Page Header */}
      <View style={s.pageHeader}>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>FINANCIAL OVERVIEW</Text>
        </View>
        <Text style={s.pageTitle}>{title}</Text>
      </View>

      {/* ── Balance Hero */}
      <View style={s.balanceHero}>
        <Text style={s.balanceLabel}>Total Balance</Text>
        <Text style={s.balanceAmount}>₹ {earnings.totalAmt.toLocaleString("en-IN")}</Text>
        <View style={s.balanceDivider} />
        <View style={s.balanceRow}>
          <View style={s.balanceStat}>
            <View style={[s.balanceStatDot, { backgroundColor: C.greenLight }]}>
              <Ionicons name="arrow-down-circle" size={16} color={C.green} />
            </View>
            <View>
              <Text style={s.balanceStatLabel}>Income</Text>
              <Text style={[s.balanceStatAmt, { color: C.green }]}>
                +₹{earnings.totalCredit.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
          <View style={s.balanceStatDivider} />
          <View style={s.balanceStat}>
            <View style={[s.balanceStatDot, { backgroundColor: C.redLight }]}>
              <Ionicons name="arrow-up-circle" size={16} color={C.red} />
            </View>
            <View>
              <Text style={s.balanceStatLabel}>Expenses</Text>
              <Text style={[s.balanceStatAmt, { color: C.red }]}>
                −₹{earnings.totalDebit.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Add Button */}
      <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={s.addBtnText}>Add Transaction</Text>
      </TouchableOpacity>

      {/* ── Section Label */}
      {transactions.length > 0 && (
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>Recent Transactions</Text>
          <Text style={s.sectionCount}>{transactions.length} entries</Text>
        </View>
      )}
    </>
  );

  const ListEmpty = () => (
    <View style={s.emptyState}>
      <Text style={s.emptyIcon}>🧾</Text>
      <Text style={s.emptyTitle}>No transactions yet</Text>
      <Text style={s.emptyText}>Tap "Add Transaction" to record your first entry.</Text>
    </View>
  );

  return (
    <>
      <FlatList
        data={transactions}
        keyExtractor={(item: any) => item._id}
        renderItem={renderTransaction}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        showsVerticalScrollIndicator={false}
      />

      {/* ─── Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.modalHandle} />

            {/* Header row */}
            <View style={s.modalTitleRow}>
              <View>
                <Text style={s.modalTitle}>New Transaction</Text>
                <Text style={s.modalSub}>Record an income or expense</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalCloseBtn}>
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Type Toggle */}
              <Text style={s.fieldLabel}>Type</Text>
              <View style={s.toggleRow}>
                {types.map((t) => {
                  const active = form.type === t;
                  const meta = TYPE_META[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[s.toggleBtn, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                      onPress={() => setForm({ ...form, type: t })}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={16}
                        color={active ? meta.color : C.muted}
                      />
                      <Text style={[s.toggleText, active && { color: meta.color, fontWeight: "700" }]}>
                        {fmt(t)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount */}
              <Text style={s.fieldLabel}>Amount <Text style={{ color: C.accent }}>*</Text></Text>
              <View style={s.amountRow}>
                <View style={s.amountPrefix}>
                  <Text style={s.amountPrefixText}>₹</Text>
                </View>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={C.muted}
                  value={form.amount}
                  onChangeText={(t) => setForm({ ...form, amount: t })}
                />
              </View>

              {/* Description */}
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Description</Text>
              <TextInput
                style={s.input}
                placeholder="What's this for?"
                placeholderTextColor={C.muted}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />

              {/* Category */}
              <Text style={s.fieldLabel}>Category</Text>
              <View style={s.chipRow}>
                {categories.map((c) => {
                  const active = form.category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[s.chip, active && s.chipActive]}
                      onPress={() => setForm({ ...form, category: c })}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{fmt(c)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Submit */}
              <TouchableOpacity style={s.submitBtn} onPress={submitExpense} activeOpacity={0.85}>
                <Text style={s.submitText}>Add Transaction</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  listContent: { paddingBottom: 100, backgroundColor: C.bg },

  // ── Page Header
  pageHeader: {
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
  pageTitle: { color: "#fff", fontSize: 28, fontWeight: "800" },

  // ── Balance Hero
  balanceHero: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 22,
    padding: 22,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 14,
  },
  balanceLabel: { fontSize: 12, fontWeight: "700", color: C.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  balanceAmount: { fontSize: 38, fontWeight: "900", color: C.ink, marginTop: 4, letterSpacing: -0.5 },
  balanceDivider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  balanceStatDot: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  balanceStatLabel: { fontSize: 11, color: C.muted, fontWeight: "600" },
  balanceStatAmt: { fontSize: 16, fontWeight: "800", marginTop: 1 },
  balanceStatDivider: { width: 1, height: 36, backgroundColor: C.border, marginHorizontal: 8 },

  // ── Add Button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 22,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // ── Section row
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 16, fontWeight: "800", color: C.ink },
  sectionCount: { fontSize: 12, color: C.muted, fontWeight: "600" },

  // ── Transaction Card
  txCard: {
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  txIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  txDesc: { fontSize: 14, fontWeight: "700", color: C.ink },
  txMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 5, gap: 6 },
  txTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  txTypeBadgeText: { fontSize: 10, fontWeight: "700" },
  txCat: { fontSize: 11, color: C.muted, fontWeight: "500" },
  txAmount: { fontSize: 15, fontWeight: "800" },
  txDeleteBtn: {
    backgroundColor: C.redLight,
    width: 28, height: 28, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },

  // ── Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 6 },
  emptyText: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20 },

  // ── Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "88%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: C.ink },
  modalSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  modalCloseBtn: {
    backgroundColor: C.bg, width: 34, height: 34, borderRadius: 17,
    justifyContent: "center", alignItems: "center",
  },

  // ── Form
  fieldLabel: { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 8 },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg,
  },
  toggleText: { fontSize: 14, fontWeight: "600", color: C.muted },

  amountRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 0 },
  amountPrefix: {
    backgroundColor: C.primaryFaint, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
  },
  amountPrefixText: { fontSize: 18, fontWeight: "800", color: C.primary },

  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.ink,
    marginBottom: 0,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 50, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  chipActive: { backgroundColor: C.primaryFaint, borderColor: C.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: C.muted },
  chipTextActive: { color: C.primary },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});