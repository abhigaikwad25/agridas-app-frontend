import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API } from "@/constants/api";
import { getToken } from "@/services/authStorage";

const API_URL = `${API.BASE_URL}/machine/register`;
const LOCATION_API = `${API.BASE_URL}/location/list`;

enum UseCase {
  Harvesting = "harvesting",
  Sowing = "sowing",
  Transport = "transport",
  Drone = "drone",
}

const CROPS = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane"];

export default function AddMachineScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    pricePerDay: "",
    ownerPhoneno: "",
    description: "",
    deliveryChargePerKm: "",
    maxAcreCoverage: "",
    crops: [] as string[],
    machineType: [] as string[],
  });

  useEffect(() => {
    const fetchLocationsAsync = async () => {
      try {
        const token = await getToken();
        const res = await fetch(LOCATION_API, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.log("Location fetch error", err);
        Alert.alert("Error", "Failed to fetch locations");
      }
    };

    fetchLocationsAsync();
  }, []);

  useEffect(() => {
    (async () => {
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      if (!media.granted || !camera.granted) {
        Alert.alert("Permission required", "Camera & gallery permission required");
      }
    })();
  }, []);

  const pickImage = async () => {
    Alert.alert("Upload Image", "Choose option", [
      {
        text: "Camera",
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!res.canceled) setImages((p) => [...p, ...res.assets]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.7,
          });
          if (!res.canceled) setImages((p) => [...p, ...res.assets]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  /* MULTI SELECT */
  const toggleMulti = (key: "crops" | "machineType", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      taluka: "",
      district: "",
      state: "",
      pincode: "",
      pricePerDay: "",
      ownerPhoneno: "",
      description: "",
      deliveryChargePerKm: "",
      maxAcreCoverage: "",
      crops: [],
      machineType: [],
    });
    setSelectedLocation(null);
    setImages([]);
  };

  /* 🚀 SUBMIT MACHINE */
  const submitMachine = async () => {
    if (loading) return;

    if (!selectedLocation) {
      Alert.alert("Error", "Select taluka");
      return;
    }

    const required = ["name", "pincode", "pricePerDay", "ownerPhoneno", "maxAcreCoverage"];
    for (const f of required) {
      if (!(form as any)[f]) {
        Alert.alert("Error", `Please fill ${f}`);
        return;
      }
    }

    if (!form.crops.length || !form.machineType.length) {
      Alert.alert("Error", "Select crops & machine type");
      return;
    }

    if (images.length < 2) {
      Alert.alert("Error", "Upload at least 2 images");
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const long = loc.coords.longitude;

      const data = new FormData();

      Object.entries(form).forEach(([k, v]: any) => {
        if (!Array.isArray(v)) data.append(k, String(v));
      });

      data.append("machineType", JSON.stringify(form.machineType));
      data.append("crops", JSON.stringify(form.crops));


      data.append("locationId", selectedLocation._id);
      data.append(
        "geoLocation",
        JSON.stringify({ type: "Point", coordinates: [long, lat] })
      );

      images.forEach((img, i) =>
        data.append("images", {
          uri: img.uri,
          name: `img_${Date.now()}_${i}.jpg`,
          type: "image/jpeg",
        } as any)
      );
      console.log(data)

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();
      console.log("SERVER:", result);

      if (!res.ok) throw new Error(result.message || "Upload failed");

      Alert.alert("Success", "Machine added successfully");
      resetForm();
    } catch (err: any) {
      console.log("Upload Error", err);
      Alert.alert("Error", err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* GRID */
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
            <View style={styles.checkbox}>{active && <View style={styles.checkboxInner} />}</View>
            <Text style={styles.gridText}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      {/* LOADER */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 10 }}>Uploading machine...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚜 Add Your Machine</Text>
          <Text style={styles.headerSubtitle}>Earn by renting your machine</Text>
        </View>

        <TouchableOpacity onPress={resetForm} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>

        {/* TALUKA */}
        <Text style={styles.label}>Taluka</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={{ color: form.taluka ? "#000" : "#999" }}>
            {form.taluka || "Select Taluka"}
          </Text>
        </TouchableOpacity>

        {/* READONLY FIELDS */}
        <Text style={styles.label}>District</Text>
        <TextInput style={styles.input} value={form.district} editable={false} />

        <Text style={styles.label}>State</Text>
        <TextInput style={styles.input} value={form.state} editable={false} />

        {/* PINCODE */}
        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={6}
          value={form.pincode}
          onChangeText={(v) => setForm({ ...form, pincode: v.replace(/[^0-9]/g, "") })}
        />

        {/* MACHINE NAME */}
        <Text style={styles.label}>Machine Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        {/* PRICE */}
        <Text style={styles.label}>Price per Day (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.pricePerDay}
          onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
        />

        <Text style={styles.label}>Delivery Charge per KM (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.deliveryChargePerKm}
          onChangeText={(v) => setForm({ ...form, deliveryChargePerKm: v })}
        />

        <Text style={styles.label}>Max Acre Coverage</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.maxAcreCoverage}
          onChangeText={(v) => setForm({ ...form, maxAcreCoverage: v })}
        />

        <Text style={styles.label}>Owner Phone</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
          value={form.ownerPhoneno}
          onChangeText={(v) => setForm({ ...form, ownerPhoneno: v.replace(/[^0-9]/g, "") })}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />

        {/* CROPS */}
        <Text style={styles.label}>Crops</Text>
        <CheckboxGrid
          data={CROPS}
          selected={form.crops}
          onToggle={(v) => toggleMulti("crops", v)}
        />

        {/* MACHINE TYPE */}
        <Text style={styles.label}>Machine Type</Text>
        <CheckboxGrid
          data={Object.values(UseCase)}
          selected={form.machineType}
          onToggle={(v) => toggleMulti("machineType", v)}
        />

        {/* IMAGES */}
        <Text style={styles.label}>Images</Text>
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={{ color: "#fff" }}>Upload Images</Text>
        </TouchableOpacity>

        <View style={styles.imageRow}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageWrapper}>
              <Image source={{ uri: img.uri }} style={styles.preview} />
              <TouchableOpacity
                style={styles.removeImgBtn}
                onPress={() => setImages((p) => p.filter((_, i) => i !== idx))}
              >
                <Text style={styles.removeImgText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submitMachine}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* LOCATION MODAL */}
      <Modal visible={showLocationModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Taluka</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowLocationModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {locations.map((l) => (
              <TouchableOpacity
                key={l._id}
                style={styles.option}
                onPress={() => {
                  setSelectedLocation(l);
                  setForm({ ...form, taluka: l.taluka, district: l.district, state: l.state });
                  setShowLocationModal(false);
                }}
              >
                <Text>{l.taluka}</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {l.district}, {l.state}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}


/* 🎨 STYLES */
const styles = StyleSheet.create({
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },


  imageWrapper: {
    position: "relative",
  },

  removeImgBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  removeImgText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF7F8",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#FADADD",
    backgroundColor: "#257a1f",
  },

  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  closeBtn: {
    position: "absolute",
    right: 16,
    padding: 6,
  },

  closeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e1e1e1",
    borderWidth: 1,
    borderColor: "#000000",
    alignSelf: "flex-end",
  },

  clearText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A1F3D",
  },
  header: {
    backgroundColor: "#7A1F3D",
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#FFD6E0",
    marginTop: 6,
    fontSize: 13,
  },

  container: { padding: 20, paddingBottom: 60, backgroundColor: "#FFF7F8" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, paddingTop: 3 },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
    marginBottom: 10,
  },
  label: { fontWeight: "700", marginVertical: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
    backgroundColor: "#FFF",
  },
  gridItemSelected: { backgroundColor: "#FADADD" },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "#7A1F3D",
    marginRight: 6,
  },
  checkboxInner: { width: 10, height: 10, backgroundColor: "#7A1F3D" },
  gridText: { fontSize: 12 },
  imageBtn: {
    backgroundColor: "#7A1F3D",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 14,
  },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preview: { width: 80, height: 80, borderRadius: 10 },
  submitBtn: {
    backgroundColor: "#4A0E23",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: { color: "#fff", fontWeight: "700" },
  option: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
    marginBottom: 10,
  },
});
