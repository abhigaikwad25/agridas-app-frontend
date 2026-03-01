// rent-machine.tsx
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RentMachineScreen() {
  // const navigation = useNavigation<any>();

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
         accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        lat: location.coords.latitude,
        long: location.coords.longitude,
      });
      setLoading(false);
    };

    getLocation();
  }, []);

  
  const goToMachines = (machineType: string) => {
  if (!userLocation) {
    alert("Fetching location... Please wait ⏳");
    return;
  }

  router.push({
    pathname: "../machines",
    params: {
      machineType: machineType.toLowerCase(),
      lat: userLocation.lat,
      long: userLocation.long,
    },
  });
};



  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Rent Farming Machines 🚜</Text>
        <Text style={styles.subtitle}>
          Select category and find machines near you
        </Text>
      </View>

      <View style={styles.grid}>
        <CategoryCard
          title="Sowing"
          image={require("../../assets/images/sowing.jpg")}
          onPress={() => goToMachines("sowing")}
        />

        <CategoryCard
          title="Harvesting"
          image={require("../../assets/images/harvesting.jpg")}
          onPress={() => goToMachines("harvesting")}
        />

        <CategoryCard
          title="Drone"
          image={require("../../assets/images/drone.jpg")}
          onPress={() => goToMachines("drone")}
        />

        <CategoryCard
          title="Logistics Machines"
          image={require("../../assets/images/transport.jpg")}
          onPress={() => goToMachines("logistics")}
        />
      </View>
    </ScrollView>
  );
}

function CategoryCard({ title, image, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground
        source={image}
        style={styles.image}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.cardText}>{title}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  container: { flex: 1, backgroundColor: "#f4f6f4" },

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
