import { getToken } from "@/services/authStorage";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://agridas.onrender.com/laborProvider/register";
const LOCATION_API = "https://agridas.onrender.com/location/list";

const CROPS = ["Rice", "Cotton", "Wheat", "Soybean", "Sugarcane"];

enum LabourSkill {
  Harvesting = "harvesting",
  Sowing = "sowing",
  Spraying = "spraying",
  Driver = "driver",
  DroneOperator = "drone_operator",
}

export default function AddLabourScreen() {
  const [locations, setLocations] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const [form, setForm] = useState({
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    description: "",
    ownerPhoneno: "",
    numberOfWorkers: "",
    pricePerDay: "",
    pricePerHour: "",
    deliveryChargePerKm: "",
    crops: [] as string[],
    skills: [] as string[],
  });

  const resetForm = () => {
  setForm({
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    description: "",
    ownerPhoneno: "",
    numberOfWorkers: "",
    pricePerDay: "",
    pricePerHour: "",
    deliveryChargePerKm: "",
    crops: [],
    skills: [],
  });

  setSelectedLocation(null);
};

  /* 📍 FETCH LOCATIONS */
  const fetchLocations = async () => {
    if (locations.length) return;
    const token = await getToken();
    const res = await fetch(LOCATION_API, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLocations(data);
  };

  /* 🔁 MULTI SELECT */
  const toggleMulti = (key: "skills" | "crops", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  /* 🚀 SUBMIT */
  const submitLabour = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select location");
      return;
    }

    const token = await getToken();

    const payload = {
      taluka: form.taluka,
      district: form.district,
      state: form.state,
      pincode: form.pincode,
      description: form.description,
      ownerPhoneno: form.ownerPhoneno,
      numberOfWorkers: Number(form.numberOfWorkers),
      pricePerDay: Number(form.pricePerDay),
      pricePerHour: form.pricePerHour ? Number(form.pricePerHour) : undefined,
      deliveryChargePerKm: Number(form.deliveryChargePerKm),
      skills: form.skills,        // ✅ ARRAY
      crops: form.crops,           // ✅ ARRAY
      locationId: selectedLocation._id, // ✅ REQUIRED
    };

    console.log("SENDING PAYLOAD:", payload);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log("API RESPONSE:", result);

    if (!res.ok) {
      Alert.alert("Error", JSON.stringify(result));
      return;
    }

    Alert.alert("Success", "Labour added successfully");
    resetForm();
    
  };

  /* 🧩 CHECKBOX GRID */
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
            <Text style={{ color: active ? "#fff" : "#7A1F3D" }}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>👷 Add Labour Provider</Text>

        {/* 📍 Location Section */}
        <Text style={styles.section}>Location Details</Text>

        <Text style={styles.label}>Taluka</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            fetchLocations();
            setShowLocationModal(true);
          }}
        >
          <Text>{form.taluka || "Select Taluka"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>District</Text>
        <TextInput style={styles.input} value={form.district} editable={false} />

        <Text style={styles.label}>State</Text>
        <TextInput style={styles.input} value={form.state} editable={false} />

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.pincode}
          onChangeText={(v) => setForm({ ...form, pincode: v })}
        />

        {/* 📞 Contact Section */}
        <Text style={styles.section}>Contact & Pricing</Text>

        <Text style={styles.label}>Owner Phone Number</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.ownerPhoneno}
          onChangeText={(v) => setForm({ ...form, ownerPhoneno: v })}
        />

        <Text style={styles.label}>Number of Workers</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.numberOfWorkers}
          onChangeText={(v) => setForm({ ...form, numberOfWorkers: v })}
        />

        <Text style={styles.label}>Price Per Day</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.pricePerDay}
          onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
        />

        <Text style={styles.label}>Price Per Hour</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.pricePerHour}
          onChangeText={(v) => setForm({ ...form, pricePerHour: v })}
        />

        <Text style={styles.label}>Delivery Charge per Km</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.deliveryChargePerKm}
          onChangeText={(v) => setForm({ ...form, deliveryChargePerKm: v })}
        />

        {/* 🧠 Skills */}
        <Text style={styles.section}>Skills</Text>
        <CheckboxGrid
          data={Object.values(LabourSkill)}
          selected={form.skills}
          onToggle={(v) => toggleMulti("skills", v)}
        />

        {/* 🌾 Crops */}
        <Text style={styles.section}>Supported Crops</Text>
        <CheckboxGrid
          data={CROPS}
          selected={form.crops}
          onToggle={(v) => toggleMulti("crops", v)}
        />

        {/* 📝 Description */}
        <Text style={styles.section}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitLabour}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Submit Labour</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 📍 LOCATION MODAL */}
      <Modal visible={showLocationModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowLocationModal(false)}
        />

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Taluka</Text>

          <ScrollView>
            {locations.map((l) => (
              <TouchableOpacity
                key={l._id}
                style={styles.option}
                onPress={() => {
                  setSelectedLocation(l);
                  setForm({
                    ...form,
                    taluka: l.taluka,
                    district: l.district,
                    state: l.state,
                  });
                  setShowLocationModal(false);
                }}
              >
                <Text style={styles.optionTitle}>{l.taluka}</Text>
                <Text style={styles.optionSub}>
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


const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 20 },

  section: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: "#7A1F3D",
  },

  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  dropdown: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "#7A1F3D",
  },
  gridItemSelected: {
    backgroundColor: "#7A1F3D",
  },

  submitBtn: {
    backgroundColor: "#7A1F3D",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 30,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#EEE" },
  optionTitle: { fontWeight: "600" },
  optionSub: { fontSize: 12, color: "#6B7280" },
});
