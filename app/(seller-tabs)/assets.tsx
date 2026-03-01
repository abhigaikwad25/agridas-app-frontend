// app/owner-machines.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const IMAGE_HEIGHT = 220;
const BASE_URL="https://agridas.onrender.com"
export default function OwnerMachinesScreen() {
  const router = useRouter();
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await axios.get(
        `${BASE_URL}/machine/userowned`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMachines(res.data);
      setLoading(false);
    } catch (err) {
      console.log("API ERROR:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Machine",
      "Are you sure you want to delete this machine?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("authToken");
              await axios.delete(
                `${BASE_URL}/machine/delete/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              fetchMachines(); // refresh list
            } catch (err) {
              console.log("DELETE ERROR:", err);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading your machines...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: any) => {
    const imageUrl = item.images?.[0];
    return (
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.imageBackground}
            imageStyle={styles.imageStyle}
          />
          <View style={styles.cardBody}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>₹ {item.pricePerDay} / acre</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={() =>
                  router.push({
                    pathname: "../update-machine",
                    params: { id: item._id },
                  })
                }
              >
                <Text style={styles.btnText}>✏️ Update</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={[styles.btnText, { color: "#7A1F3D" }]}>
                  🗑 Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>AGRIDAS • SELLER MODE</Text>
        <Text style={styles.welcome}>Your Machines</Text>
        <Text style={styles.headerSub}>
          Manage, update or delete your listed machines
        </Text>
      </View>

      <FlatList
        data={machines}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F8" },
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: "#7A1F3D",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  brand: { color: "#FADADD", fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  welcome: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 14, color: "#FADADD", marginTop: 6 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrap: { alignItems: "center" },
  card: { width: CARD_WIDTH, borderRadius: 18, backgroundColor: "#FFFFFF", overflow: "hidden", elevation: 4 },
  imageBackground: { width: "100%", height: IMAGE_HEIGHT },
  imageStyle: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardBody: { padding: 16 },
  title: { fontSize: 16, fontWeight: "700", color: "#4A0E23", marginBottom: 6 },
  subtitle: { color: "#6B7280", marginBottom: 14, fontSize: 14 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  updateBtn: { flex: 1, backgroundColor: "#7A1F3D", paddingVertical: 12, borderRadius: 12, marginRight: 8, alignItems: "center" },
  deleteBtn: { flex: 1, backgroundColor: "#FADADD", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { fontWeight: "600", fontSize: 14, color: "#FFFFFF" },
});