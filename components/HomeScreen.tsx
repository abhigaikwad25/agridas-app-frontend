import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

export default function HomeScreen() {

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f4",
  },
  header: {
    padding: 20,
    backgroundColor: "#1e7f43",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#e0f2e9",
  },
  cardContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e7f43",
  },
  cardDesc: {
    marginTop: 5,
    fontSize: 13,
    color: "#555",
  },
  infoBox: {
    margin: 20,
    padding: 15,
    backgroundColor: "#e8f5ec",
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#1e7f43",
    textAlign: "center",
  },
});

    
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome 👋</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      {/* Action Cards */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>🚜 Rent Tools</Text>
          <Text style={styles.cardDesc}>
            Find farming tools available near you
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>👨‍🌾 Hire Labour</Text>
          <Text style={styles.cardDesc}>
            Book skilled labourers in your area
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📦 My Bookings</Text>
          <Text style={styles.cardDesc}>
            View your ongoing and past bookings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          AgriConnect helps farmers rent tools and hire labour easily, saving
          time and cost.
        </Text>
      </View>
    </ScrollView>
  );
}
