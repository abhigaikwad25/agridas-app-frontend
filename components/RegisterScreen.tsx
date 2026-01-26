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
import { register } from "@/services/authService";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [phoneno, setPhoneno] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Consumer");
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
    input: {
      borderWidth: 1,
      borderRadius: 10,
      height: 45,
      paddingHorizontal: 10,
      marginBottom: 15,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
    },
    phoneInput: {
      flex: 1,
      height: 45,
      marginLeft: 8,
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
    link: {
      marginTop: 15,
      textAlign: "center",
      color: "#1e7f43",
    },
  });


  const handleRegister = async () => {
    if (!name || !phoneno || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      setLoading(true);

      const response = await register({
        name,
        phoneno,
        password,
        role,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message);
        router.replace("/");
      } else {
        Alert.alert("Registration failed", data.message || "Try again");
      }
    } catch (err) {
      Alert.alert("Error", "Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Agridas</Text>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <View style={styles.row}>
        <Text>+91</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="Mobile Number"
          keyboardType="number-pad"
          value={phoneno}
          onChangeText={setPhoneno}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnText}>
          {loading ? "Creating..." : "Register"}
        </Text>
      </TouchableOpacity>

      <Text
        style={styles.link}
        onPress={() => router.replace("/")}
      >
        Already have an account? Login
      </Text>
    </View>
  );
}
