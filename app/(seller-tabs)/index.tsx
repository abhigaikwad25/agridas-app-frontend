import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";


export default function SellerHome() {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.brand}>AGRIDAS • SELLER</Text>
        <Text style={styles.welcome}>Welcome 👋</Text>
        <Text style={styles.headerSub}>
          Turn your machines into steady income
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <ImageBackground
          source={require("../../assets/images/sellerimage.jpg")}
          style={styles.image}
          imageStyle={{ borderRadius: 18 }}
        />

        {/* TITLE BELOW IMAGE */}
        <Text style={styles.heroTitle}>
          Don’t let your machines stay idle
        </Text>

        <Text style={styles.heroSub}>
          Rent them to nearby farmers and earn consistently throughout the season.
        </Text>

        {/* GUIDELINES */}
        <View style={styles.card}>
          <Point
            text="List your machines once and receive bookings from nearby farmers"
          />
          <Point
            text="Idle machines mean lost income — put them to work"
          />
          <Point
            text="Transparent pricing and secure booking system"
          />
          <Point
            text="Track bookings and earnings from your dashboard"
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => router.replace("/(tabs)")}
      >
        <Ionicons name="arrow-back-circle-outline" size={20} color="#7A1F3D" />
        <Text style={styles.switchText}>Back to Buyer Home</Text>
      </TouchableOpacity>
    </View>
  );
}

function Point({ text }) {
  return (
    <View style={styles.point}>
      <Ionicons name="checkmark-circle" size={20} color="#7A1F3D" />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F8",
  },

  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: "#7A1F3D",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  brand: {
    color: "#FADADD",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 6,
  },

  welcome: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  headerSub: {
    fontSize: 14,
    color: "#FADADD",
    marginTop: 6,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  image: {
    height: 180,
    width: "100%",
    marginBottom: 18,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A0E23",
    textAlign: "center",
    marginBottom: 6,
  },

  heroSub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },

  point: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  pointText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#4A0E23",
    lineHeight: 22,
    flex: 1,
  },
  switchButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 24,
  paddingVertical: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#7A1F3D",
  backgroundColor: "#FFF",
},

switchText: {
  marginLeft: 8,
  fontSize: 15,
  fontWeight: "600",
  color: "#7A1F3D",
},

});
