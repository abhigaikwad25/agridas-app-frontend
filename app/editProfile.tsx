import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BASE_URL } from "@/constants/api";

export default function EditProfile() {
  const [name, setName] = useState("");
  const [phoneno, setPhoneno] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ✅ Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");

        const response = await fetch(
          `${BASE_URL}/user/userdetails`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setName(data.name || "");
          setPhoneno(data.phoneno || "");
          setAddress(data.address || "");
          setEmail(data.email || "");
        } else {
          throw new Error(data.message || "Failed to fetch user");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message);
      } finally {
        setFetching(false);
      }
    };

    fetchUserDetails();
  }, []);

  // ✅ Update user
  const handleSave = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");
      console.log(token)
      const response = await fetch(
        `${BASE_URL}/user/userupdate`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            phoneno,
            address,
            email,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      router.push({
                    pathname: "/(tabs)/profile",
                  })
      
    }
  };

  if (fetching) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e7f43" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          style={styles.input}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phoneno}
          onChangeText={setPhoneno}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Enter address"
          style={styles.input}
        />

        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f4",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f4",
  },

  header: {
    backgroundColor: "#1e7f43",
    padding: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerTitle: {
    paddingTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },

  card: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e7f43",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#f4f6f4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },

  saveButton: {
    backgroundColor: "#1e7f43",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});