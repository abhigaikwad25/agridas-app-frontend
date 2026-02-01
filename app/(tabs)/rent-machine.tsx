import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TextInput,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ToolCard from "../../components/ToolCard";
import { Machine } from "../../types/Machine";
import { TouchableOpacity } from "react-native";


export default function RentMachine() {
  const [tools, setTools] = useState<Machine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      console.log("RENT PAGE TOKEN:", token); // 🔍 debug

      const res = await axios.get<Machine[]>(
        "https://agridas.onrender.com/machine/list",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTools(res.data);
    } catch (error) {
      console.log("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search filter (only logic, no UI impact on cards)
  const filteredTools = tools.filter((tool) =>
    (tool.machineType || "")
      .toString()
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#1E7F3B"
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 24, // ✅ ANDROID TOP SAFE FIX
      }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* 🔍 SEARCH BAR */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
            style={styles.searchInput}
          />

          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* 📃 LIST */}
        <FlatList
          data={filteredTools}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ToolCard tool={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No machines available
            </Text>
          }
        />
      </View>
    </View>
  );
}


const styles = {
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 30,
    paddingLeft: 18,
    marginBottom: 14,
    height: 52,

    // Shadow (Android)
    elevation: 6,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  searchIcon: {
    fontSize: 18,
    color: "#fff",
  },
};
