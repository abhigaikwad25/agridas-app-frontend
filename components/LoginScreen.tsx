import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { login } from "@/services/authService";

export default function LoginScreen() {
  const [phoneno, setPhoneno] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: "#f4f6f4",
    },
    logo: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#1e7f43",
      textAlign: "center",
    },
    title: {
      textAlign: "center",
      marginVertical: 15,
      fontSize: 16,
      fontWeight: "600",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
    },
    input: {
      flex: 1,
      height: 45,
      marginLeft: 8,
    },
    inputFull: {
      borderWidth: 1,
      borderRadius: 10,
      height: 45,
      paddingHorizontal: 10,
      marginBottom: 20,
    },
    btn: {
      backgroundColor: "#1e7f43",
      padding: 14,
      borderRadius: 10,
    },
    btnText: {
      color: "#fff",
      textAlign: "center",
      fontWeight: "600",
    },
  });


  const handleLogin = async () => {
    if (!phoneno || !password) {
      Alert.alert("Error", "Enter mobile number & password");
      return;
    }

    try {
      setLoading(true);

      const response = await login({ phoneno, password });
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Login successful");

        // 👉 Navigate to tabs after login
        router.replace("/(tabs)");
      } else {
        Alert.alert("Login failed", data.message || "Invalid credentials");
      }
    } catch (err) {
      Alert.alert("Error", "Backend not reachable");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Agridas</Text>
      <Text style={styles.title}>Welcome to Agridas</Text>

      <View style={styles.row}>
        <Text>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          keyboardType="number-pad"
          value={phoneno}
          onChangeText={setPhoneno}
        />
      </View>

      <TextInput
        style={styles.inputFull}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
