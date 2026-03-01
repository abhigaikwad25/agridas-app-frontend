import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface LocationType {
  _id: string;
  district: string;
  state: string;
  taluka: string;
}

interface ProviderType {
  name: string;
  experience: number;
  phone: string;
}

export default function SearchLabourScreen() {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const BASE_URL = "https://agridas.onrender.com";

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const token = await AsyncStorage.getItem("authToken");

      const res = await axios.get(`${BASE_URL}/location/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLocations(res.data || []);
    } catch (error) {
      console.log("Error fetching locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchProviders = async (locationId: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      const res = await axios.get(
        `${BASE_URL}/labour/by-location/${locationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProviders(res.data || []);
    } catch (error) {
      console.log("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    if (value) fetchProviders(value);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.container}>
      {/* HERO SECTION */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find Skilled Labour</Text>
        <Text style={styles.heroSubtitle}>
          Trusted farm workers near your location 👨‍🌾
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>120+</Text>
            <Text style={styles.statLabel}>Villages</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.8⭐</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* LOCATION FILTER */}
      <View style={styles.filterCard}>
        <Text style={styles.label}>📍 Select Location</Text>

        {loadingLocations ? (
          <ActivityIndicator color="#1e7f43" />
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedLocation}
              onValueChange={handleLocationChange}
            >
              <Picker.Item label="Choose Taluka" value="" />
              {locations.map((loc) => (
                <Picker.Item
                  key={loc._id}
                  label={`${loc.taluka}, ${loc.district}`}
                  value={loc._id}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* PROVIDERS LIST */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1e7f43"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.experience}>
                    {item.experience} years experience
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.detail}>📞 {item.phone}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.buttonText}>Book Labour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(item.phone)}
                >
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            selectedLocation ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🌾</Text>
                <Text style={styles.emptyText}>
                  No labourers available in this area
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f4",
  },

  /* HERO */
  hero: {
    paddingTop: 70,
    paddingBottom: 100,
    paddingHorizontal: 25,
    backgroundColor: "#1e7f43",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#e0f2e9",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  statBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },

  statLabel: {
    fontSize: 12,
    color: "#e0f2e9",
    marginTop: 4,
  },

  /* FILTER */
  filterCard: {
    marginHorizontal: 20,
    marginTop: -70,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
    elevation: 4,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1e7f43",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e7f43",
  },

  experience: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },

  detail: {
    fontSize: 14,
    color: "#444",
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 15,
  },

  bookButton: {
    flex: 1,
    backgroundColor: "#1e7f43",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },

  callButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1e7f43",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  callText: {
    color: "#1e7f43",
    fontWeight: "600",
  },

  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyText: {
    fontSize: 14,
    color: "#777",
    marginTop: 10,
  },
});