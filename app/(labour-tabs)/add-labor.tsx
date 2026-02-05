import { getToken } from "@/services/authStorage";
import * as Location from "expo-location";
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

const API_URL = "https://agridas.onrender.com/labour/register";
const LOCATION_API = "https://agridas.onrender.com/location/list";

const CROPS = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane"];

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
    travelChargePerKm: "",
    deliveryChargePerKm: "",
    crops: [] as string[],
    skills: [] as string[],
  });

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
      Alert.alert("Error", "Please select taluka");
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
      pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
      pricePerHour: form.pricePerHour ? Number(form.pricePerHour) : undefined,
      travelChargePerKm: form.travelChargePerKm
        ? Number(form.travelChargePerKm)
        : undefined,
      deliveryChargePerKm: form.deliveryChargePerKm
        ? Number(form.deliveryChargePerKm)
        : undefined,
      skills: form.skills,
      crops: form.crops,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      Alert.alert("Error", result.message?.join("\n") || "Something went wrong");
      return;
    }

    Alert.alert("Success", "Labour added successfully");
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
            <Text>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>👷 Add Labour Provider</Text>

        {/* Taluka */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            fetchLocations();
            setShowLocationModal(true);
          }}
        >
          <Text style={{ color: form.taluka ? "#111" : "#9CA3AF" }}>
            {form.taluka || "Select Taluka"}
          </Text>
        </TouchableOpacity>

        <TextInput style={styles.input} value={form.district} editable={false} />
        <TextInput style={styles.input} value={form.state} editable={false} />

        <TextInput
          style={styles.input}
          placeholder="Pincode"
          keyboardType="number-pad"
          maxLength={6}
          value={form.pincode}
          onChangeText={(v) =>
            setForm({ ...form, pincode: v.replace(/[^0-9]/g, "") })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Owner Phone"
          keyboardType="number-pad"
          maxLength={10}
          value={form.ownerPhoneno}
          onChangeText={(v) =>
            setForm({ ...form, ownerPhoneno: v.replace(/[^0-9]/g, "") })
          }
        />

        <TextInput
          style={styles.input}
          placeholder="Number of Workers"
          keyboardType="number-pad"
          value={form.numberOfWorkers}
          onChangeText={(v) => setForm({ ...form, numberOfWorkers: v })}
        />

        <TextInput
          style={styles.input}
          placeholder="Price Per Day"
          keyboardType="number-pad"
          value={form.pricePerDay}
          onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
        />

        <TextInput
          style={styles.input}
          placeholder="Price Per Hour"
          keyboardType="number-pad"
          value={form.pricePerHour}
          onChangeText={(v) => setForm({ ...form, pricePerHour: v })}
        />

        <Text style={styles.label}>Skills</Text>
        <CheckboxGrid
          data={Object.values(LabourSkill)}
          selected={form.skills}
          onToggle={(v) => toggleMulti("skills", v)}
        />

        <Text style={styles.label}>Crops</Text>
        <CheckboxGrid
          data={CROPS}
          selected={form.crops}
          onToggle={(v) => toggleMulti("crops", v)}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitLabour}>
          <Text style={{ color: "#fff" }}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 📍 Location Modal */}
     <Modal
  visible={showLocationModal}
  transparent
  animationType="slide"
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
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

    <TouchableOpacity
      style={styles.closeBtn}
      onPress={() => setShowLocationModal(false)}
    >
      <Text style={styles.closeText}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>

    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, paddingTop: 25 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  label: { fontWeight: "700", marginVertical: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  gridItemSelected: { backgroundColor: "#FADADD" },
  submitBtn: {
    backgroundColor: "#7A1F3D",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
},

modalCard: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  maxHeight: "70%",
  backgroundColor: "#fff",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 12,
  color: "#4A0E23",
},
option: {
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderColor: "#FADADD",
},

optionTitle: {
  fontSize: 15,
  fontWeight: "600",
  color: "#111",
},

optionSub: {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 2,
},

closeBtn: {
  marginTop: 16,
  paddingVertical: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#7A1F3D",
  alignItems: "center",
},

closeText: {
  color: "#7A1F3D",
  fontWeight: "700",
},

});
