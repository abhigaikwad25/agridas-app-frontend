import { login } from "@/services/authService";
import { saveToken } from "@/services/authStorage";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [phoneno, setPhoneno] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

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

    registerText: {
      textAlign: "center",
      marginTop: 15,
      color: "#1e7f43",
      fontWeight: "500",
    },
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      setLocationGranted(true);
    } else {
      setLocationGranted(false);

      Alert.alert(
        "Location Required",
        "This app needs location permission to work properly.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings()
          }
        ]
      );
    }
  };


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
        // ✅ STORE ACCESS TOKEN HERE
        await saveToken(data.accesstoken); // or data.token

        // 🔍 DEBUG: Check if token is actually saved
        const t = await AsyncStorage.getItem("authToken");
        console.log("SAVED TOKEN:", t);

        // ✅ NAVIGATE TO HOME
        router.replace("/(tabs)");
      }
    } catch (err: any) {
        console.log("LOGIN ERROR:", err);
        Alert.alert("Error", err?.message || "Something went wrong");
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

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.registerText}>
          Don’t have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}
