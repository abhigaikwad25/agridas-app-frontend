import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function LabourHome() {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.brand}>AGRIDAS • LABOUR</Text>
        <Text style={styles.welcome}>Welcome 👋</Text>
        <Text style={styles.headerSub}>
          Find work nearby and earn consistently
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <ImageBackground
          source={require("../../assets/images/laborimage.jpg")}
          style={styles.image}
          imageStyle={{ borderRadius: 18 }}
        />

        {/* TITLE BELOW IMAGE */}
        <Text style={styles.heroTitle}>
          Your skills deserve daily income
        </Text>

        <Text style={styles.heroSub}>
          Offer your labour services to nearby farmers and get paid fairly for
          your hard work.
        </Text>

        {/* GUIDELINES */}
        <View style={styles.card}>
          <Point text="Create your labour profile once and get job requests" />
          <Point text="Work with nearby farmers without middlemen" />
          <Point text="Transparent wages and confirmed bookings" />
          <Point text="Track jobs and earnings from your dashboard" />
        </View>
      </View>

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => router.replace("/(tabs)")}
      >
        <Ionicons
          name="arrow-back-circle-outline"
          size={20}
          color="#2E7D32"
        />
        <Text style={styles.switchText}>Back to Buyer Home</Text>
      </TouchableOpacity>
    </View>
  );
}

function Point({ text }: { text: string }) {
  return (
    <View style={styles.point}>
      <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FFF8",
  },

  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  brand: {
    color: "#C8E6C9",
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
    color: "#C8E6C9",
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
    color: "#1B5E20",
    textAlign: "center",
    marginBottom: 6,
  },

  heroSub: {
    fontSize: 14,
    color: "#4B5563",
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
    color: "#1B5E20",
    lineHeight: 22,
    flex: 1,
  },

  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
  },

  switchText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
  },
});
