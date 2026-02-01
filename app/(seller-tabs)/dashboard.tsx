import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = "https://agridas.onrender.com/dashboard"; // Replace with your API

export default function DashboardScreen() {
  const [earnings, setEarnings] = useState({
    total: 0,
    month: 0,
  });

  const [expenseForm, setExpenseForm] = useState({
    reason: "",
    amount: "",
    date: new Date(),
  });

  const [expenses, setExpenses] = useState([]);

  /* Fetch earnings from API */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL, {
          headers: { Authorization: "Bearer YOUR_AUTH_TOKEN_HERE" },
        });
        const json = await res.json();
        json.totalEarning = 10000;   // Just for testing
        json.monthEarning = 5000;    // Just for testing
        setEarnings({ total: json.totalEarning, month: json.monthEarning });
        setExpenses(json.expenses || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const addExpense = () => {
    if (!expenseForm.reason || !expenseForm.amount) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const newExpense = {
      ...expenseForm,
      amount: 500, // Placeholder amount
    };
    setExpenses([...expenses, newExpense]);
    setExpenseForm({ reason: "", amount: "", date: new Date() });
    Alert.alert("Success", "Expense added");
  };

  /* Increment/decrement date by 1 day */
  const changeDate = (days: number) => {
    const newDate = new Date(expenseForm.date);
    newDate.setDate(newDate.getDate() + days);
    setExpenseForm({ ...expenseForm, date: newDate });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {/* Earnings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Earnings</Text>
        <Text style={styles.earning}>₹ {earnings.total}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Month Earnings</Text>
        <Text style={styles.earning}>₹ {earnings.month}</Text>
      </View>

      {/* Add Expense */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Expense</Text>

        <Text style={styles.inputLabel}>Reason</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter reason"
          value={expenseForm.reason}
          onChangeText={(text) => setExpenseForm({ ...expenseForm, reason: text })}
        />

        <Text style={styles.inputLabel}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          keyboardType="numeric"
          value={expenseForm.amount}
          onChangeText={(text) => setExpenseForm({ ...expenseForm, amount: text })}
        />

        <Text style={styles.inputLabel}>Date</Text>
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => changeDate(-1)}
          >
            <Text style={styles.dateText}>-1 Day</Text>
          </TouchableOpacity>

          <Text style={styles.dateDisplay}>{expenseForm.date.toLocaleDateString()}</Text>

          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => changeDate(1)}
          >
            <Text style={styles.dateText}>+1 Day</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={addExpense}>
          <Text style={styles.submitText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#FFF7F8", paddingBottom: 40, paddingTop: 35 },
  title: { fontSize: 22, fontWeight: "700", color: "#7A1F3D", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 19,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FADADD",
    marginBottom: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#7A1F3D", marginBottom: 8 },
  earning: { fontSize: 20, fontWeight: "700", color: "#4A0E23" },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#7A1F3D", marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FADADD" },
  dateSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  dateBtn: { backgroundColor: "#FADADD", padding: 10, borderRadius: 10 },
  dateText: { color: "#7A1F3D", fontWeight: "600" },
  dateDisplay: { fontWeight: "700", fontSize: 16, color: "#4A0E23" },
  submitBtn: { backgroundColor: "#4A0E23", padding: 14, borderRadius: 14, alignItems: "center", marginTop: 10 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
