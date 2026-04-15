import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Keyboard
} from "react-native";
import { WebView } from "react-native-webview";


// ─── Types ─────────────────
interface LatLng {
  latitude: number;
  longitude: number;
}

type Props = {
  visible: boolean;
  onConfirm: (coords: LatLng, label: string) => void;
  onClose: () => void;
};

// ─── Theme ─────────────────
const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
};

// ─── Nominatim ─────────────────
const NOMINATIM_HEADERS = {
  "User-Agent": "AgriDasApp/1.0",
  Accept: "application/json",
  "Accept-Language": "hi,en",
};

async function nominatimReverse(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    return data?.display_name || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
}

async function nominatimSearch(query: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    if (data?.length) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        label: data[0].display_name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Map HTML ─────────────────
function buildMapHtml(lat: number, lng: number) {
  return `
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html,body,#map {height:100%;margin:0}
    </style>
  </head>

  <body>
    <div id="map"></div>

    <script>
      window.map = L.map('map').setView([${lat},${lng}], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(window.map);

      window.marker = L.marker([${lat},${lng}], { draggable: true })
        .addTo(window.map);

      function send(lat,lng){
        window.ReactNativeWebView.postMessage(JSON.stringify({lat,lng}))
      }

      window.marker.on('dragend', function(e){
        const p = e.target.getLatLng();
        send(p.lat,p.lng);
      });

      window.map.on('click', function(e){
        window.marker.setLatLng(e.latlng);
        send(e.latlng.lat,e.latlng.lng);
      });

      // ✅ IMPORTANT FIX
      window.map.whenReady(function () {
        window.ReactNativeWebView.postMessage("MAP_READY");
      });
    </script>
  </body>
  </html>
  `;
}


// ─── Component ─────────────────
export default function MapPickerModal({
  visible,
  onConfirm,
  onClose,
}: Props) {
  
const DEFAULT = { latitude: 21.1458, longitude: 79.0882 };

  const webRef = useRef<WebView>(null);
  const hasInitialized = useRef(false);
  const mapHtml = useRef(buildMapHtml(DEFAULT.latitude, DEFAULT.longitude));

  const [pin, setPin] = useState<LatLng>(DEFAULT);
  const [label, setLabel] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const mapReady = useRef(false);

  
  // ✅ Run location only once
  useEffect(() => {
    if (visible && !hasInitialized.current) {
      hasInitialized.current = true;
      initLocation();
    }
  }, [visible]);

  // ✅ Reset when modal closes
  useEffect(() => {
    if (!visible) {
      hasInitialized.current = false;
    }
  }, [visible]);

const initLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    let coords = DEFAULT;

    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // 🔥 IMPORTANT
      });

      coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    }

    setPin(coords);
    inject(coords.latitude, coords.longitude);

    const addr = await nominatimReverse(coords.latitude, coords.longitude);
    setLabel(addr);
  } catch {
    setPin(DEFAULT);
    inject(DEFAULT.latitude, DEFAULT.longitude);
  }
};

const handleMessage = async (e: any) => {
  const msg = e.nativeEvent.data;

  if (msg === "MAP_READY") {
    mapReady.current = true;

    // 🔥 NOW SAFE: apply latest pin
    inject(pin.latitude, pin.longitude);
    return;
  }

  const data = JSON.parse(msg);

  const coords = { latitude: data.lat, longitude: data.lng };
  setPin(coords);

  const addr = await nominatimReverse(data.lat, data.lng);
  setLabel(addr);
};
const inject = (lat: number, lng: number) => {
  if (!mapReady.current) return;

  webRef.current?.injectJavaScript(`
    window.map.setView([${lat},${lng}], 15);
    window.marker.setLatLng([${lat},${lng}]);
    true;
  `);
};
  const handleSearch = async () => {
    if (!search.trim()) return;
     Keyboard.dismiss();
    setLoading(true);
    const res = await nominatimSearch(search);

    if (res) {
      setPin({ latitude: res.lat, longitude: res.lng });
      setLabel(res.label);

      webRef.current?.injectJavaScript(`
        map.setView([${res.lat},${res.lng}],15);
        marker.setLatLng([${res.lat},${res.lng}]);
        true;
      `);
    } else {
      Alert.alert("Not found", "Try a more specific location");
    }

    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Pick Location</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons
              name="search-outline"
              size={16}
              color={C.muted}
              style={{ marginLeft: 10 }}
            />

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search village, city, address…"
              placeholderTextColor={C.muted}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchBtnText}>Go</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={14} color={C.primary} />
          <Text style={styles.hintText}>
            Search or tap map · Drag pin to adjust
          </Text>
        </View>

        {/* Map */}
        <WebView
          ref={webRef}
          source={{ html: mapHtml.current }}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text numberOfLines={2}>{label || "Select location from map"}</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => onConfirm(pin, label)}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },

  title: { fontSize: 16, fontWeight: "bold" },

  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#D8E5DA",
  },

  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E5DA",
    minHeight: 42,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1917",
    paddingHorizontal: 8,
  },

  searchBtn: {
    backgroundColor: "#1E7F43",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  searchBtnText: {
    color: "#fff",
    fontWeight: "800",
  },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF5EE",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  hintText: {
    fontSize: 12,
    color: "#1E7F43",
    fontWeight: "600",
  },

  footer: { padding: 15 },

  btn: {
    backgroundColor: "#1E7F43",
    padding: 14,
    marginTop: 10,
    alignItems: "center",
    borderRadius: 10,
  },
});