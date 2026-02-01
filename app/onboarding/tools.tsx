import { View, Text, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import FancyButton from "./FancyButton";

export default function OnboardingTools() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/onboarding-tools.jpg")}
        style={styles.image}
      />

      <View style={styles.card}>
        <Text style={styles.title}>Rent Farming Tools</Text>
        <Text style={styles.desc}>
          Rent tractors and machines easily from nearby farmers.
        </Text>

        <FancyButton
          title="Next"
          onPress={() => router.push("/onboarding/labour")}
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  image: {
    width: "100%",
    height: "70%",          // 🔥 image dominates screen
    resizeMode: "cover",
  },

  card: {
    backgroundColor: "#ffffff",

    // curve
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,

    // spacing (reduced for better UI)
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,

    // overlap
    marginTop: -60,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#111",
    marginBottom: 6,       // 🔥 tighter
  },

  desc: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
    marginBottom: 14,      // 🔥 closer to button
  },
});
