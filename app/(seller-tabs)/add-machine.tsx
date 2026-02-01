import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://agridas.onrender.com/machine/register";
const TOKEN = "YOUR_AUTH_TOKEN_HERE"; // replace from secure storage later

export default function AddMachineScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; long: number } | null>(
    null
  );

  const [form, setForm] = useState({
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    pricePerDay: "",
    ownerPhoneno: "",
    crops: "",
    description: "",
    deliveryChargePerKm: "",
    maxAcreCoverage: "",
    locationId: "",
    machineType: "",
  });

  /* 📍 GET LOCATION */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        long: loc.coords.longitude,
      });
    })();
  }, []);

  /* 📸 PICK IMAGE */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  /* 🚀 SUBMIT FORM */
  const submitMachine = async () => {
    if (!location) {
      Alert.alert("Location required", "Please enable location");
      return;
    }

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (key === "crops" || key === "machineType") {
        value.split(",").forEach((v) => data.append(key, v.trim()));
      } else {
        data.append(key, value);
      }
    });

    data.append("lat", String(location.lat));
    data.append("long", String(location.long));

    images.forEach((img, index) => {
      data.append("images", {
        uri: img.uri,
        name: `machine_${index}.jpg`,
        type: "image/jpeg",
      } as any);
    });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        body: data,
      });

      const json = await res.json();
      Alert.alert("Success", "Machine uploaded successfully");
      console.log(json);
    } catch (err) {
      Alert.alert("Error", "Failed to upload machine");
      console.error(err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Machine</Text>

      {/* Button above form */}
      <TouchableOpacity style={styles.secondaryBtn}>
        <Text style={styles.secondaryText}>View My Machines</Text>
      </TouchableOpacity>

      {/* Form Card */}
      <View style={styles.formCard}>
        {Object.keys(form).map((key) => (
          <View key={key} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <TextInput
              placeholder={`Enter ${key}`}
              value={(form as any)[key]}
              onChangeText={(text) => setForm({ ...form, [key]: text })}
              style={styles.input}
            />
          </View>
        ))}

        {/* Image Upload */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageBtnText}>Upload Images</Text>
        </TouchableOpacity>

        <View style={styles.previewRow}>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img.uri }} style={styles.preview} />
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={submitMachine}>
          <Text style={styles.submitText}>Submit Machine</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFF7F8",
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7A1F3D",
    marginBottom: 16,
  },
  secondaryBtn: {
    backgroundColor: "#7A1F3D",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FADADD",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7A1F3D",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
  },
  imageBtn: {
    backgroundColor: "#7A1F3D",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 12,
  },
  imageBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  submitBtn: {
    backgroundColor: "#4A0E23",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
