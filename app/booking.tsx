// app/booking.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function BookingScreen() {
  const router = useRouter();
  const { machineId } = useLocalSearchParams<{ machineId: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <Text style={styles.emoji}>🚜</Text>

        <Text style={styles.title}>Booking Feature</Text>

        <Text style={styles.subtitle}>
          Coming Soon...
        </Text>

        <Text style={styles.machineText}>
          Machine ID: {machineId}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f4",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 10,
  },
  machineText: {
    marginTop: 20,
    fontSize: 12,
    color: "#777",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});