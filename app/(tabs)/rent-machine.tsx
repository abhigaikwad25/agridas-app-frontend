import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RentMachineScreen() {
  const goToMachines = (category: string) => {
    // router.push({ pathname: "/machines", params: { category } });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rent Farming Machines 🚜</Text>
        <Text style={styles.subtitle}>
          Select category and find machines near you
        </Text>
      </View>

      {/* Grid Cards */}
      <View style={styles.grid}>
        <CategoryCard
          title="Sowing"
          image={require("../../assets/images/sowing.jpg")}
          onPress={() => goToMachines("Sowing")}
        />
        <CategoryCard
          title="Harvesting"
          image={require("../../assets/images/harvesting.jpg")}
          onPress={() => goToMachines("Harvesting")}
        />
        <CategoryCard
          title="Drone"
          image={require("../../assets/images/drone.jpg")}
          onPress={() => goToMachines("Drone")}
        />
        <CategoryCard
          title="Logistics Machines"
          image={require("../../assets/images/transport.jpg")}
          onPress={() => goToMachines("sugarcane")}
        />
      </View>
    </ScrollView>
  );
}

/* ---------- Reusable Card ---------- */
function CategoryCard({ title, image, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground source={image} style={styles.image} imageStyle={{ borderRadius: 16 }}>
        <View style={styles.overlay}>
          <Text style={styles.cardText}>{title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
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
  title: {
    paddingTop: 26,
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#e0f2e9",
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 20,
  },

  card: {
    width: "48%",
    height: 220,
    marginBottom: 15,
    borderRadius: 16,
    elevation: 3,
    backgroundColor: "#fff",
  },

  image: {
    flex: 1,
    justifyContent: "flex-end",
  },

  overlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  cardText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
