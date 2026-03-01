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
    KeyboardAvoidingView

} from "react-native";

export default function Dashboard({ apiUrlbal,apiUrl,apiUrldel, role, categories, title }) {
  const [earnings, setEarnings] = useState({
    totalAmt: 0,
    totalCredit: 0,
    totalDebit: 0,
  });
  const type=["credit","debit"]
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: categories[0],
    type: type[0],
  });

  const fetchDashboard = async () => {
    try {
      const token = await getToken();
      const res = await fetch(apiUrlbal, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // console.log(data)

      setEarnings({
        totalAmt: data.totalamt || 0,
        totalCredit: data.totalcredit || 0,
        totalDebit: data.totaldebit || 0,
      });

      setTransactions(data.expenses || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCategory = (value?: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "Other";

const submitExpense = async () => {
  if (!form.amount) return Alert.alert("Enter amount");

  try {
    const token = await getToken();
    const payload = {
      description: form.description,
      amount: Number(form.amount),
      role,
      type: form.type,
      expcategory: form.category,
    };

    // console.log(payload)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json(); // parse response body

    if (!response.ok) {
      // Handles status 400, 401, 500, etc.
      throw new Error(data.message || "Something went wrong!");
    }

    // Success
    Alert.alert("Success", "Transaction added successfully!");
    // console.log("Server response:", data);

    // Reset form
    setForm({ ...form, description: "", amount: "" });

    // Close modal if using one
    setModalVisible(false);

    // Optionally, refresh transaction list
    fetchDashboard(); // call your fetch function again
  } catch (err: any) {
    console.log("Error submitting expense:", err);
    Alert.alert("Error", err.message);
  }
};


  const deleteTransaction = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${apiUrldel}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Deleted", "Transaction removed");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to delete transaction");
    }
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionMeta}>
          {formatCategory(item.type)} | ₹{item.amount}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteTransaction(item._id)}>
        <Ionicons name="trash-outline" size={24} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

return (
  <>
    <FlatList
      data={transactions}
      keyExtractor={(item) => item._id}
      renderItem={renderTransaction}
      contentContainerStyle={{ padding: 20 }}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: "#6366F1" }]}>
              <Text style={styles.statTitle}>Total Balance</Text>
              <Text style={styles.statAmount}>₹ {earnings.totalAmt}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#22C55E" }]}>
              <Text style={styles.statTitle}>Total Credit</Text>
              <Text style={styles.statAmount}>₹ {earnings.totalCredit}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#EF4444" }]}>
              <Text style={styles.statTitle}>Total Debit</Text>
              <Text style={styles.statAmount}>₹ {earnings.totalDebit}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addBtnText}>+ Add Transaction</Text>
          </TouchableOpacity>
        </>
      }
    />

    {/* Modal OUTSIDE FlatList */}
    <Modal visible={modalVisible} animationType="slide" transparent>
    <KeyboardAvoidingView
    style={styles.modalOverlay}
    behavior={Platform.OS === "ios" ? "padding" : "height"} // adjusts for keyboard
    keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0} // tweak if needed
  >
    <ScrollView
      contentContainerStyle={styles.modalContent}
      keyboardShouldPersistTaps="handled" // allow taps outside inputs
    >
      <Text style={styles.cardTitle}>Add Transaction</Text>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Reason..."
        placeholderTextColor="#64748B"
        value={form.description}
        onChangeText={(t) => setForm({ ...form, description: t })}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="₹ Amount"
        placeholderTextColor="#64748B"
        value={form.amount}
        onChangeText={(t) => setForm({ ...form, amount: t })}
      />

      <Text style={styles.label}>Category</Text>
      {categories.map((c) => (
        <TouchableOpacity
          key={c}
          style={[
            styles.categoryBtn,
            form.category === c && styles.categorySelected,
          ]}
          onPress={() => setForm({ ...form, category: c })}
        >
          <Text style={styles.categoryText}>{formatCategory(c)}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Type</Text>
      {type.map((c) => (
        <TouchableOpacity
          key={c}
          style={[
            styles.categoryBtn,
            form.type === c && styles.categorySelected,
          ]}
          onPress={() => setForm({ ...form, type: c })}
        >
          <Text style={styles.categoryText}>{formatCategory(c)}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.submitBtn} onPress={submitExpense}>
        <Text style={styles.submitText}>Add</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: "#EF4444", marginTop: 10 }]}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.submitText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>

  </>
);

}

// Keep your styles same as before
const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: "#7A1F3D", marginBottom: 20 , marginTop:15},
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  statCard: { flex: 1, marginHorizontal: 4, padding: 16, borderRadius: 20, shadowColor: "#7A1F3D", shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  statTitle: { color: "#FFE4E8", fontSize: 12, fontWeight: "600" },
  statAmount: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 6 },
  addBtn: { backgroundColor: "#6366F1", padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  transactionCard: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: "#FADADD", shadowColor: "#7A1F3D", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  transactionDesc: { fontSize: 14, fontWeight: "700", color: "#7A1F3D" },
  transactionMeta: { fontSize: 12, color: "#7A1F3D", marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#7A1F3D", marginBottom: 10 },
  label: { marginTop: 12, fontWeight: "600", color: "#7A1F3D" },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#FADADD", padding: 12, borderRadius: 12, marginTop: 6, color: "#4A0E23" },
  categoryBtn: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FADADD", marginTop: 8, backgroundColor: "#FFF" },
  categorySelected: { backgroundColor: "#FADADD", borderColor: "#7A1F3D" },
  categoryText: { fontWeight: "700", color: "#7A1F3D", textTransform: "capitalize" },
  submitBtn: { backgroundColor: "#7A1F3D", padding: 15, borderRadius: 14, alignItems: "center", marginTop: 16 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF7F8", borderRadius: 18, padding: 20 },
});
