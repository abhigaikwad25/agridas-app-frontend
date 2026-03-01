// app/machines.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const IMAGE_HEIGHT = 220;

export default function MachinesScreen() {
  const { machineType, lat, long } = useLocalSearchParams<{
    machineType: string;
    lat: string;
    long: string;
  }>();

  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");

        const res = await axios.get(
          `https://agridas.onrender.com/machine/list?lat=${lat}&long=${long}&machineType=${machineType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMachines(res.data);
        setLoading(false);
      } catch (err) {
        console.log("API ERROR:", err);
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  const filteredMachines = machines.filter((item) => {
    const name = item.name?.toLowerCase() || "";
    const location =
      `${item.taluka} ${item.district} ${item.state}`.toLowerCase();

    return (
      name.includes(searchText.toLowerCase()) ||
      location.includes(searchText.toLowerCase())
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading machines...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: any) => {
    const imageUrl = item.images?.[0];

    const locationLine =
      `${item.taluka}, ${item.district}, ${item.state}`;

    return (
      <TouchableOpacity
      activeOpacity={0.95}
      style={styles.cardWrap}
      onPress={() =>
        router.push(`/machine-details?machineId=${item._id}`)
      }
    >
        <View style={styles.card}>
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.imageBackground}
            imageStyle={styles.imageStyle}
          >
            <TouchableOpacity style={styles.heart}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>♡</Text>
            </TouchableOpacity>
          </ImageBackground>

          <View style={styles.cardBody}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.name}</Text>
              <View style={styles.ratingWrap}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>5.0</Text>
                <Text style={styles.reviewsText}>(13)</Text>
              </View>
            </View>

            <Text style={styles.subtitle} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.locationRow}>
              <FontAwesome5 name="map-marker-alt" size={14} color="#444" />
              <Text style={styles.locationText}>{locationLine}</Text>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.price}>
                ₹ {item.pricePerDay}
                <Text style={styles.priceSmall}> / acre</Text>
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* AIRBNB STYLE SEARCH BAR */}
      <View style={styles.searchOuter}>
        <View style={styles.searchPill}>
          <TextInput
            placeholder="Search machines..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.searchButton}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredMachines}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f4",
    paddingTop: 25,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchOuter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f4f6f4",
  },

  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingLeft: 16,
    paddingRight: 6,
    height: 48,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
  },

  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  cardWrap: {
    alignItems: "center",
  },

  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 3,
  },

  imageBackground: {
    width: "100%",
    height: IMAGE_HEIGHT,
    justifyContent: "flex-end",
  },

  imageStyle: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  heart: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  cardBody: {
    padding: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    width: "68%",
  },

  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  star: {
    color: "#ffb400",
    marginRight: 4,
    fontSize: 14,
  },

  ratingText: {
    fontWeight: "600",
    marginRight: 4,
  },

  reviewsText: {
    color: "#666",
    fontSize: 12,
  },

  subtitle: {
    marginTop: 6,
    color: "#666",
    fontSize: 13,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  locationText: {
    marginLeft: 6,
    color: "#444",
    fontSize: 13,
    lineHeight: 18,
  },

  bottomRow: {
    marginTop: 12,
  },

  price: {
    fontSize: 16,
    fontWeight: "800",
  },

  priceSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
});
