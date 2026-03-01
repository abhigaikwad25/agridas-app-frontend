// app/update-machine.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CROPS = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane"];
const MACHINE_TYPES = ["harvesting", "sowing", "transport", "drone"];

export default function UpdateMachineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const BASE_URL = "https://agridas.onrender.com";

  const [form, setForm] = useState<any>({
    name: "",
    pricePerDay: "",
    maxAcreCoverage: "",
    ownerPhoneno: "",
    description: "",
    crops: [] as string[],
    machineType: [] as string[],
    taluka: "",
    district: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [fetchingLocations, setFetchingLocations] = useState(false);

  /** FETCH MACHINE DATA */
  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const res = await axios.get(`${BASE_URL}/machine/details/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;

        setForm({
          name: data.name,
          pricePerDay: data.pricePerDay.toString(),
          maxAcreCoverage: data.maxAcreCoverage.toString(),
          ownerPhoneno: data.ownerPhoneno,
          description: data.description,
          crops: data.crops || [],
          machineType: data.machineType || [],
          taluka: data.taluka,
          district: data.district,
          state: data.state,
        });

        setSelectedLocation({
          _id: data.machinelocation?.[0]?._id,
          taluka: data.taluka,
          district: data.district,
          state: data.state,
        });
      } catch (err: any) {
        console.log("FETCH ERROR:", err.response?.data || err);
        Alert.alert("Error", "Failed to fetch machine data");
      }
    };

    if (id) fetchMachine();
  }, [id]);

  /** FETCH LOCATIONS ON MOUNT */
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setFetchingLocations(true);
        const token = await AsyncStorage.getItem("authToken");
        const res = await axios.get(`${BASE_URL}/location/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(res.data || []);
      } catch (err) {
        console.log("LOCATION FETCH ERROR:", err);
        Alert.alert("Error", "Failed to fetch locations");
      } finally {
        setFetchingLocations(false);
      }
    };

    loadLocations();
  }, []);

  /** TOGGLE MULTI-SELECT */
  const toggleMulti = (key: "crops" | "machineType", value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value],
    }));
  };

  /** UPDATE MACHINE */
  const updateMachine = async () => {
    if (!form.name.trim()) return Alert.alert("Error", "Machine name is mandatory");
    if (!/^\d{10}$/.test(form.ownerPhoneno)) return Alert.alert("Error", "Owner phone must be 10 digits");
    if (!form.crops.length || !form.machineType.length) return Alert.alert("Error", "Select crops & machine type");
    if (!selectedLocation) return Alert.alert("Error", "Select a location");

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      const payload = {
        ...form,
        locationId: selectedLocation._id,
      };

      const res = await axios.put(`${BASE_URL}/machine/updatedetails/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "Machine updated successfully");
      router.back();
    } catch (err: any) {
      console.log("UPDATE ERROR:", err.response?.data || err);
      Alert.alert("Error", err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  /** CHECKBOX GRID COMPONENT */
  const CheckboxGrid = ({
    data,
    selected,
    onToggle,
  }: {
    data: string[];
    selected: string[];
    onToggle: (v: string) => void;
  }) => (
    <View style={styles.grid}>
      {data.map((item) => {
        const active = selected.includes(item);
        return (
          <TouchableOpacity
            key={item}
            style={[styles.gridItem, active && styles.gridItemSelected]}
            onPress={() => onToggle(item)}
          >
            <View style={[styles.checkbox, active && styles.checkboxSelected]}>
              {active && <Text style={styles.checkmark}>✔</Text>}
            </View>
            <Text style={[styles.gridText, active && { color: "#fff", fontWeight: "700" }]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!form.name) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading machine data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 10 }}>Updating...</Text>
        </View>
      )}

      <Text style={styles.header}>🚜 Update Machine</Text>

      <Text style={styles.label}>Machine Name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
      />

      <Text style={styles.label}>Price Per Day</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={form.pricePerDay?.toString()}
        onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
      />

      <Text style={styles.label}>Max Acre Coverage</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={form.maxAcreCoverage?.toString()}
        onChangeText={(v) => setForm({ ...form, maxAcreCoverage: v })}
      />

      <Text style={styles.label}>Owner Phone</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={form.ownerPhoneno}
        onChangeText={(v) => setForm({ ...form, ownerPhoneno: v.replace(/[^0-9]/g, "") })}
        maxLength={10}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
      />

      <Text style={styles.label}>Taluka</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLocation?._id || ""}
          onValueChange={(id) => {
            const loc = locations.find((l) => l._id === id);
            if (loc) {
              setSelectedLocation(loc);
              setForm({
                ...form,
                taluka: loc.taluka,
                district: loc.district,
                state: loc.state,
              });
            }
          }}
        >
          <Picker.Item label={fetchingLocations ? "Loading..." : "Select Taluka"} value="" />
          {locations.map((loc) => (
            <Picker.Item key={loc._id} label={loc.taluka} value={loc._id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Crops</Text>
      <CheckboxGrid data={CROPS} selected={form.crops} onToggle={(v) => toggleMulti("crops", v)} />

      <Text style={styles.label}>Machine Type</Text>
      <CheckboxGrid data={MACHINE_TYPES} selected={form.machineType} onToggle={(v) => toggleMulti("machineType", v)} />

      <TouchableOpacity style={styles.submitBtn} onPress={updateMachine} disabled={loading}>
        <Text style={styles.submitText}>{loading ? "Updating..." : "Update Machine"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#FFF", flexGrow: 1 },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 10, marginBottom: 12 },
  submitBtn: { backgroundColor: "#7A1F3D", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  submitText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  gridItemSelected: { backgroundColor: "#7A1F3D", borderColor: "#7A1F3D" },
  gridText: { marginLeft: 8, color: "#000" },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  checkboxSelected: { backgroundColor: "#fff", borderColor: "#fff" },
  checkmark: { color: "#7A1F3D", fontWeight: "700", fontSize: 14 },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, marginBottom: 12, overflow: "hidden" },
});