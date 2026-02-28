import * as Location from "expo-location";
import { useEffect } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
export default function HomeScreen() {
  useEffect(() => {
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Location permission is required to use this app.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log(location.coords);
  };

  requestLocationPermission();
}, []);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome To Agridas👋</Text>
        <Text style={styles.subtitle}>
          साधने भाड्याने घ्या किंवा मजूर मिळवा अगदी सहज, आणि जाणून घ्या नवीन सरकारी योजनांविषयी.
        </Text>
      </View>

      {/* Banner */}

      <View style={styles.banner}>
        <ImageBackground
          source={require("@/assets/images/farm-banner.png")}
          style={styles.bannerImage}
          imageStyle={{ borderRadius: 15 }}
        >
        </ImageBackground>
      </View>

      {/* Actions */}
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>What would you like to do?</Text>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>🚜 Rent Farming Tools</Text>
          <Text style={styles.cardDesc}>
            Browse machines available near your location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>👨‍🌾 Hire Labour</Text>
          <Text style={styles.cardDesc}>
            Find skilled labourers for your farm work
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardTitle}>📦 My Bookings</Text>
          <Text style={styles.cardDesc}>
            Track your current and past bookings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      {/* <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          AgriConnect helps farmers save time and reduce costs by connecting
          them with nearby resources.
        </Text>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f4",
  },

  header: {
    padding: 30,
    backgroundColor: "#1e7f43",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcome: {
    paddingTop:16,
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#e0f2e9",
  },

  cardContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },

  primaryCard: {
    backgroundColor: "#1e7f43",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e7f43",
  },
  cardDesc: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
  },

  infoBox: {
    margin: 20,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 1,
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
  },

  banner: {
  margin: 20,
  borderRadius: 15,
  overflow: "hidden",
},

bannerImage: {
  height: 240,
  justifyContent: "center",
}
});
