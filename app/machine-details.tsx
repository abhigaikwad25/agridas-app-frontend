// app/machine-details.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function MachineDetailsScreen() {
  const { machineId } = useLocalSearchParams<{ machineId: string }>();
  const router = useRouter();

  const [machine, setMachine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachineDetails();
  }, []);

  const fetchMachineDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const res = await axios.get(
        `https://agridas.onrender.com/machine/details/${machineId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMachine(res.data);
      setLoading(false);
    } catch (error) {
      console.log("DETAILS API ERROR:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E7F3B" />
      </View>
    );
  }

  if (!machine) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* IMAGE SECTION */}
      <View>
        <Image
          source={{ uri: machine.images?.[0] }}
          style={styles.image}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        
      </View>

      {/* DETAILS CARD */}
      <View style={styles.detailsContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <Text style={styles.title}>{machine.name}</Text>

          <Text style={styles.rating}>
            4.9 • 40 Reviews
          </Text>

          <Text style={styles.location}>
            {machine.taluka}, {machine.district}, {machine.state}
          </Text>

          <View style={styles.divider} />

          {/* Info Rows */}
          <InfoRow label="Type" value={machine.machineType?.join(", ")} />
          <InfoRow label="Crops" value={machine.crops?.join(", ")} />
          <InfoRow label="Coverage" value={`${machine.maxAcreCoverage} Acre`} />
          <InfoRow label="Delivery" value={`₹ ${machine.deliveryChargePerKm} / km`} />
          <InfoRow label="Owner Contact" value={machine.ownerPhoneno} />

          {machine.description ? (
            <>
              <Text style={styles.sectionTitle}>About this machine</Text>
              <Text style={styles.description}>
                {machine.description}
              </Text>
            </>
          ) : null}

        </ScrollView>

        {/* Sticky Bottom Booking */}
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.price}>
              ₹ {machine.pricePerDay}
              <Text style={styles.perDay}> / Acre</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() =>
              router.push(`/booking?machineId=${machine._id}`)
            }
          >
            <Text style={styles.bookText}>Book Now</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

/* Small reusable component */
function InfoRow({ label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width,
    height: 300,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 30,
  },
  favBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 30,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  rating: {
    marginTop: 6,
    color: "#444",
  },
  location: {
    marginTop: 6,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    color: "#555",
  },
  value: {
    color: "#222",
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E7F3B",
  },
  description: {
    marginTop: 6,
    color: "#555",
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
  },
  perDay: {
    fontSize: 14,
    color: "#666",
  },
  bookBtn: {
    backgroundColor: "#1E7F3B",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
  bookText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});