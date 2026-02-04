import { getToken } from "@/services/authStorage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
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

const API_URL = "https://agridas.onrender.com/machine/register";
const LOCATION_API = "https://agridas.onrender.com/location/list";

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


  /* 📍 FETCH LOCATIONS List */
  const fetchLocations = async () => {
    let locationofuser = await Location.getCurrentPositionAsync()
    console.log('location of user', locationofuser)
    if (locations.length) return;
    const token = await getToken();
    const res = await fetch(LOCATION_API, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLocations(data);
  };

  

  const [form, setForm] = useState({
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    pricePerDay: "",
    ownerPhoneno: "",
    description: "",
    deliveryChargePerKm: "",
    maxAcreCoverage: "",         // keep as string for input
    crops: [] as string[],
    machineType: [] as string[],
  });

  
  useEffect(() => {
    (async () => {
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const camera = await ImagePicker.requestCameraPermissionsAsync();

      if (!media.granted || !camera.granted) {
        Alert.alert(
          "Permission required",
          "Camera and gallery permissions are required"
        );
      }
    })();
  }, []);
  const pickImage = async () => {
    Alert.alert("Upload Image", "Choose option", [
      {
        text: "Camera",
        onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({
            quality: 0.7,
          });
          if (!res.canceled) {
            setImages((prev) => [...prev, ...res.assets]);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.7,
          });
          if (!res.canceled) {
            setImages((prev) => [...prev, ...res.assets]);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };


  /* 🔁 MULTI SELECT */
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
    taluka: "",
    district: "",
    state: "",
    pincode:"",
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


  /* 🚀 SUBMIT */
const submitMachine = async () => {
  if (!selectedLocation) {
    Alert.alert("Error", "Please select taluka");
    return;
  }

  const token = await getToken();
  const data = new FormData();

  data.append("taluka", form.taluka);
  data.append("district", form.district);
  data.append("state", form.state);
  data.append("pincode", form.pincode); // ✅ REQUIRED

  data.append("pricePerDay", Number(form.pricePerDay).toString());
  data.append("ownerPhoneno", form.ownerPhoneno);
  data.append("description", form.description);
  data.append("deliveryChargePerKm", form.deliveryChargePerKm);
  data.append(
    "maxAcreCoverage",
    Number(form.maxAcreCoverage).toString()
  );

  // ✅ ARRAYS AS JSON
  form.machineType.forEach((type) => {
  data.append("machineType[]", type);
});

form.crops.forEach((crop) => {
  data.append("crops[]", crop);
});

  data.append("locationId", selectedLocation._id);

  images.forEach((img, i) =>
    data.append("images", {
      uri: img.uri,
      name: `img_${i}.jpg`,
      type: "image/jpeg",
    } as any)
  );

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });

  const result = await res.json();
  console.log("API RESULT:", result);

  if (!res.ok) {
    Alert.alert("Error", result.message?.join("\n") || "Something went wrong");
    return;
  }

  Alert.alert("Success", "Machine added successfully", [
  {
    text: "OK",
    onPress: resetForm,
  },
]);
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
            <View style={styles.checkbox}>
              {active && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.gridText}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
  <Text style={styles.headerTitle}>🚜 Add Your Machine</Text>
  <Text style={styles.headerSubtitle}>
    Earn by renting your machine to nearby farmers
  </Text>
</View>
          <TouchableOpacity onPress={resetForm} style={styles.clearBtn}>
    <Text style={styles.clearText}>Clear</Text>
  </TouchableOpacity>

        {/* Taluka */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            fetchLocations();
            setShowLocationModal(true);
          }}
        >
          <Text>{form.taluka || "Select Taluka"}</Text>
          
        </TouchableOpacity>

        <TextInput placeholder="District" style={styles.input} value={form.district} editable={false} />
        <TextInput placeholder="State"style={styles.input} value={form.state} editable={false} />
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
          placeholder="Price per day in Rs"
          keyboardType="number-pad"
          value={form.pricePerDay}
          onChangeText={(v) => setForm({ ...form, pricePerDay: v })}
        />

        <TextInput
          style={styles.input}
          placeholder="Owner phone (10 digits)"
          keyboardType="number-pad"
          maxLength={10}
          value={form.ownerPhoneno}
          onChangeText={(v) => {
            // allow only digits
            const digitsOnly = v.replace(/[^0-9]/g, "");
            setForm({ ...form, ownerPhoneno: digitsOnly });
          }}
        />


        <TextInput
          style={styles.input}
          placeholder="Description"
          multiline
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />

        <Text style={styles.label}>Crops</Text>
        <CheckboxGrid
          data={CROPS}
          selected={form.crops}
          onToggle={(v) => toggleMulti("crops", v)}
        />

        <Text style={styles.label}>Machine Type</Text>
        <CheckboxGrid
          data={Object.values(UseCase)}
          selected={form.machineType}
          onToggle={(v) => toggleMulti("machineType", v)}
        />

        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={{ color: "#fff" }}>Upload Images</Text>
        </TouchableOpacity>

        <View style={styles.imageRow}>
          {images.map((i, idx) => (
            <Image key={idx} source={{ uri: i.uri }} style={styles.preview} />
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submitMachine}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

   <Modal visible={showLocationModal} animationType="slide">
  <View style={styles.modalContainer}>
    
    {/* 🔝 Modal Header */}
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Select Taluka</Text>

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setShowLocationModal(false)}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>

    {/* 📍 Location List */}
    <ScrollView contentContainerStyle={{ padding: 20 }}>
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
