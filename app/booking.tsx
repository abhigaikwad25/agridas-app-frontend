/**
 * BookingScreen.tsx — Unified booking screen for Machine & Labour
 *
 * Route params expected:
 *   resourceId  : string   (machine _id or labour _id)
 *   bookingType : "machine" | "laborProvider"
 *
 * Backward-compatible: also accepts `machineId` param (older machine routes).
 *
 * Map: OpenStreetMap via react-native-webview + Leaflet.js
 *   → NO Google Maps, NO Google API key required
 *   → Geocoding via Nominatim (free, no key)
 *   → Works in production builds without crashing
 *
 * Install: npx expo install react-native-webview
 */

import api from "@/app/utils/axiosinstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg: "#F4F6F4",
  card: "#FFFFFF",
  primary: "#1E7F43",
  primaryFaint: "#EAF5EE",
  primaryMid: "#A8D5B5",
  ink: "#1C1917",
  muted: "#78716C",
  border: "#D8E5DA",
  danger: "#E53935",
  dangerFaint: "#FDECEA",
  gold: "#F59E0B",
  shadow: "rgba(30,127,67,0.10)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingType = "machine" | "laborProvider";

interface LatLng {
  latitude: number;
  longitude: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function pad(n: number) { return String(n).padStart(2, "0"); }

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const straight = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(straight * 1.3 * 10) / 10;
}

function extractCoords(resource: any): LatLng | null {
  if (!resource) return null;
  let g =
    resource.geoLocation ??
    resource.location ??
    resource.coordinates ??
    resource.machinelocation;
  if (!g) return null;
  if (typeof g === "string") {
    try { g = JSON.parse(g); } catch { return null; }
  }
  if (g.type === "Point" && Array.isArray(g.coordinates)) {
    return { latitude: g.coordinates[1], longitude: g.coordinates[0] };
  }
  if (g.latitude != null) return { latitude: g.latitude, longitude: g.longitude };
  if (g.lat != null) return { latitude: g.lat, longitude: g.lng };
  if (Array.isArray(g.coordinates)) {
    return { latitude: g.coordinates[1], longitude: g.coordinates[0] };
  }
  return null;
}

// ─── Nominatim geocoding helpers (no API key, no Google) ─────────────────────

// const NOMINATIM_HEADERS = {
//   "User-Agent": "AgriDasApp/1.0",
//   "Accept-Language": "en",
// };

async function nominatimReverse(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    if (data?.display_name) return data.display_name;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

type Result = { lat: number; lng: number; label: string };

const NOMINATIM_HEADERS = {
  "User-Agent": "AgriDasApp/1.0",
  Accept: "application/json",
  "Accept-Language": "hi,en", // 👈 IMPORTANT
};

// simple transliteration fallback (basic, no library)
function generateVariants(query: string): string[] {
  return [
    query,
    `${query}, India`,
    query.replace(/,/g, ""),
  ];
}

export async function nominatimSearch(
  query: string
): Promise<Result | null> {
  try {
    const queries = generateVariants(query);

    let allResults: any[] = [];

    for (const q of queries) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(q)}` +
          `&format=json` +
          `&limit=5` +
          `&addressdetails=1` +
          `&countrycodes=in` +
          `&dedupe=1`,
        { headers: NOMINATIM_HEADERS }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        allResults.push(...data);
      }
    }

    if (!allResults.length) return null;

    // pick best match (simple heuristic)
    const best = allResults.sort((a, b) => {
      const aScore =
        (a.display_name?.includes(query) ? 2 : 0) +
        (a.type === "village" ? 3 : 0);

      const bScore =
        (b.display_name?.includes(query) ? 2 : 0) +
        (b.type === "village" ? 3 : 0);

      return bScore - aScore;
    })[0];

    return {
      lat: parseFloat(best.lat),
      lng: parseFloat(best.lon),
      label: best.display_name,
    };
  } catch {
    return null;
  }
}

// ─── Leaflet map HTML (no Google, uses OpenStreetMap tiles) ───────────────────

function buildMapHtml(defaultLat: number, defaultLng: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e8f5e9; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function () {
  try {
    var defaultLat = ${defaultLat};
    var defaultLng = ${defaultLng};

var map = L.map('map', {
  zoomControl: true,
  attributionControl: true
}).setView([defaultLat, defaultLng], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

var marker = L.marker([defaultLat, defaultLng], {
  draggable: true
}).addTo(map);

// ⭐ IMPORTANT FIX
window.map = map;
window.marker = marker;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);

    var greenIcon = L.divIcon({
      className: '',
      html: '<div style="width:32px;height:32px;background:#1E7F43;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34]
    });

    var marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: greenIcon
    }).addTo(map);

    function sendCoords(lat, lng) {
      try {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'coords', lat: lat, lng: lng })
        );
      } catch(e) {}
    }

    marker.on('dragend', function (e) {
      var pos = e.target.getLatLng();
      sendCoords(pos.lat, pos.lng);
    });

    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      sendCoords(e.latlng.lat, e.latlng.lng);
    });

    // Tell React Native the map is ready
    setTimeout(function() {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      } catch(e) {}
    }, 300);

  } catch(err) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', msg: String(err) }));
    } catch(e) {}
  }
})();
</script>
</body>
</html>
`.trim();
}

// ─── Availability Calendar ────────────────────────────────────────────────────

function AvailabilityPicker({
  resourceId,
  selectedDate,
  endDate,
  daysNeeded,
  onSelectDate,
}: {
  resourceId: string;
  selectedDate: string | null;
  endDate: string | null;
  daysNeeded: number;
  onSelectDate: (date: string) => void;
}) {
  const today = new Date();
  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await api.get(
        `https://agridas-latest.onrender.com/booking/availabilyStatus/${resourceId}`
      );
      const bookings: { startDate: string; endDate: string }[] = res.data ?? [];
      const expanded = new Set<string>();
      const p = (n: number) => String(n).padStart(2, "0");
      const toStr = (d: Date) =>
        `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      bookings.forEach((b) => {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        const cur = new Date(start);
        while (cur <= end) {
          expanded.add(toStr(new Date(cur)));
          cur.setDate(cur.getDate() + 1);
        }
      });
      setOccupiedDates(expanded);
    } catch (e) {
      console.log("Availability fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const p = (n: number) => String(n).padStart(2, "0");
  const toStr = (date: Date) =>
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;

  const checkRangeConflict = (start: Date) => {
    const temp = new Date(start);
    for (let i = 0; i < daysNeeded; i++) {
      const d = new Date(temp);
      d.setDate(temp.getDate() + i);
      if (occupiedDates.has(toStr(d))) return true;
    }
    return false;
  };

  const handleSelect = (dateStr: string) => {
    const start = new Date(dateStr);
    if (checkRangeConflict(start)) {
      alert("These dates overlap with existing bookings. Please choose another slot.");
      return;
    }
    onSelectDate(dateStr);
  };

  const isInSelectedRange = (dateStr: string) => {
    if (!selectedDate) return false;
    const start = new Date(selectedDate);
    const target = new Date(dateStr);
    const diff = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < daysNeeded;
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = toStr(today);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={bs.calCard}>
      <Text style={{ fontSize: 14, fontWeight: "800", marginBottom: 10 }}>
        Select Start Date
      </Text>
      {loading ? (
        <ActivityIndicator color={C.primary} />
      ) : (
        <>
          <View style={bs.calNav}>
            <TouchableOpacity
              onPress={() =>
                setViewMonth((m) =>
                  m === 0 ? (setViewYear((y) => y - 1), 11) : m - 1
                )
              }
            >
              <Text>Prev</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: "800" }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setViewMonth((m) =>
                  m === 11 ? (setViewYear((y) => y + 1), 0) : m + 1
                )
              }
            >
              <Text>Next</Text>
            </TouchableOpacity>
          </View>

          <View style={bs.calGrid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={idx} style={bs.calCell} />;
              const dateStr = `${viewYear}-${p(viewMonth + 1)}-${p(day)}`;
              const isOccupied = occupiedDates.has(dateStr);
              const isPast = new Date(dateStr) < new Date(todayStr);
              const inRange = isInSelectedRange(dateStr);
              return (
                <TouchableOpacity
                  key={dateStr}
                  disabled={isOccupied || isPast}
                  onPress={() => handleSelect(dateStr)}
                  style={[
                    bs.calCell,
                    isOccupied && bs.calCellOccupied,
                    inRange && !isOccupied && {
                      backgroundColor: "#A8D5B5",
                      borderRadius: 8,
                    },
                    !isOccupied && !inRange && bs.calCellAvail,
                    isPast && { opacity: 0.3 },
                  ]}
                >
                  <Text
                    style={{
                      color: isOccupied ? "red" : inRange ? "#1E7F43" : "green",
                      fontWeight: "700",
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
            <Text style={{ color: "green" }}>● Available</Text>
            <Text style={{ color: "red" }}>● Booked</Text>
            <Text style={{ color: "#507f1e" }}>● Selected Range</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Map Picker Modal (OpenStreetMap via WebView + Leaflet) ───────────────────

function MapPickerModal({
  visible,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  onConfirm: (coords: LatLng, label: string) => void;
  onClose: () => void;
}) {
  // Default: center of India
  const DEFAULT_LAT = 20.5937;
  const DEFAULT_LNG = 78.9629;

  const webViewRef = useRef<WebView>(null);
  const mapReadyRef = useRef(false);
  const pendingCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [pin, setPin] = useState<LatLng>({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
  const [label, setLabel] = useState("");
  const [resolving, setResolving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Reset state every time modal opens
  useEffect(() => {
    if (visible) {
      mapReadyRef.current = false;
      pendingCoordsRef.current = null;
      setLabel("");
      setSearchText("");
      setMapLoaded(false);
    }
  }, [visible]);

  // Inject JS to move marker + pan map
  const moveMarker = (lat: number, lng: number) => {
    const js = `
      (function() {
        try {
          marker.setLatLng([${lat}, ${lng}]);
          map.setView([${lat}, ${lng}], 14, { animate: true });
        } catch(e) {}
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(js);
    setPin({ latitude: lat, longitude: lng });
  };

  // After map is ready, try to center at user GPS
  const initUserLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        const { latitude, longitude } = loc.coords;
        moveMarker(latitude, longitude);
        const addr = await nominatimReverse(latitude, longitude);
        setLabel(addr);
      }
    } catch {
      // Fall back to default center — no crash
    }
  };

  // Handle messages from Leaflet map
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "ready") {
        mapReadyRef.current = true;
        setMapLoaded(true);
        // If GPS location was fetched before map was ready, apply it now
        if (pendingCoordsRef.current) {
          moveMarker(pendingCoordsRef.current.lat, pendingCoordsRef.current.lng);
          pendingCoordsRef.current = null;
        } else {
          initUserLocation();
        }
      }

      if (data.type === "coords") {
        const lat: number = data.lat;
        const lng: number = data.lng;
        setPin({ latitude: lat, longitude: lng });
        // Reverse geocode without blocking map interaction
        setResolving(true);
        nominatimReverse(lat, lng).then((addr) => {
          setLabel(addr);
          setResolving(false);
        });
      }
    } catch {
      // Silently ignore parse errors
    }
  };

  const handleSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    setSearching(true);
    try {
      const result = await nominatimSearch(q);
      if (result) {
        moveMarker(result.lat, result.lng);
        setLabel(result.label);
      } else {
        Alert.alert("Not Found", "Could not find that location. Try a more specific address.");
      }
    } catch {
      Alert.alert("Search Error", "Location search failed. Please check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const canConfirm = !!label && !resolving;

  const mapHtml = buildMapHtml(DEFAULT_LAT, DEFAULT_LNG);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={mp.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={mp.header}>
          <TouchableOpacity style={mp.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={mp.headerTitle}>Set Delivery Location</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={mp.searchRow}>
          <View style={mp.searchInputWrap}>
            <Ionicons
              name="search-outline"
              size={16}
              color={C.muted}
              style={{ marginLeft: 10 }}
            />
            <TextInput
              style={mp.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search village, city, address…"
              placeholderTextColor={C.muted}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                style={{ marginRight: 6 }}
              >
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[mp.searchBtn, searching && { opacity: 0.55 }]}
            onPress={handleSearch}
            disabled={searching}
            activeOpacity={0.8}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={mp.searchBtnText}>Go</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={mp.hint}>
          <Ionicons name="information-circle-outline" size={14} color={C.primary} />
          <Text style={mp.hintText}>
            Search or tap the map · Drag the pin to fine-tune
          </Text>
        </View>

        {/* Map — WebView with Leaflet (OpenStreetMap, no Google API) */}
        <View style={{ flex: 1 }}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={mp.map}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            // Prevents white flash / crash on some Android builds
            androidLayerType="hardware"
            // Scroll inside WebView should not interfere with RN scroll
            scrollEnabled={false}
            bounces={false}
          />

          {/* Loading overlay while Leaflet initialises */}
          {!mapLoaded && (
            <View style={mp.mapLoader}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={mp.mapLoaderText}>Loading map…</Text>
            </View>
          )}
        </View>

        {/* Address bar */}
        <View style={mp.addressBar}>
          <View style={mp.addressIcon}>
            <Ionicons name="location" size={16} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mp.addressLabel}>Selected delivery location</Text>
            {resolving ? (
              <ActivityIndicator
                size="small"
                color={C.primary}
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              />
            ) : (
              <Text style={mp.addressValue} numberOfLines={2}>
                {label || "Tap on map to select a location"}
              </Text>
            )}
            <Text style={mp.addressCoords}>
              {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </Text>
          </View>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[mp.confirmBtn, !canConfirm && { opacity: 0.55 }]}
          onPress={() => canConfirm && onConfirm(pin, label)}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={mp.confirmText}>Confirm Delivery Location</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Reusable UI pieces ───────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={bs.sectionHeader}>
      <View style={bs.sectionIconWrap}>
        <Ionicons name={icon as any} size={14} color={C.primary} />
      </View>
      <Text style={bs.sectionLabel}>{label}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  editable = true,
  icon,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  editable?: boolean;
  icon?: string;
  maxLength?: number;
}) {
  return (
    <View style={bs.field}>
      <Text style={bs.fieldLabel}>{label}</Text>
      <View style={[bs.fieldInputWrap, !editable && bs.fieldInputLocked]}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={15}
            color={editable ? C.primary : C.muted}
            style={{ marginLeft: 12 }}
          />
        )}
        <TextInput
          style={[bs.fieldInput, !editable && { color: C.muted }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          keyboardType={keyboardType}
          editable={editable}
          maxLength={maxLength}
        />
        {!editable && (
          <Ionicons
            name="lock-closed-outline"
            size={13}
            color={C.border}
            style={{ marginRight: 12 }}
          />
        )}
      </View>
    </View>
  );
}

function CostRow({
  label,
  value,
  bold,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={[bs.costRow, highlight && bs.costRowHighlight]}>
      <Text
        style={[
          bs.costLabel,
          bold && { fontWeight: "800", color: C.ink },
          muted && { color: C.muted, fontStyle: "italic" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          bs.costValue,
          bold && { fontWeight: "900", color: highlight ? C.primary : C.ink },
          muted && { color: C.muted },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Delivery Location Card ───────────────────────────────────────────────────

function DeliveryLocationCard({
  distanceKm,
  deliveryCost,
  deliveryPerKm,
  locationLabel,
  hasLocation,
  onOpenMap,
}: {
  distanceKm: number | null;
  deliveryCost: number;
  deliveryPerKm: number;
  locationLabel: string;
  hasLocation: boolean;
  onOpenMap: () => void;
}) {
  return (
    <View style={bs.card}>
      <SectionHeader icon="car-outline" label="Delivery Location" />

      <TouchableOpacity style={dl.mapBtn} onPress={onOpenMap} activeOpacity={0.85}>
        <View style={dl.mapBtnIcon}>
          <Ionicons name="map" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={dl.mapBtnTitle}>
            {hasLocation ? "Change delivery location" : "Pick delivery location on map"}
          </Text>
          <Text style={dl.mapBtnSub}>
            {hasLocation ? locationLabel : "Required · Tap to open map"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.primary} />
      </TouchableOpacity>

      {hasLocation && distanceKm !== null && (
        <View style={dl.resultCard}>
          <View style={dl.resultRow}>
            <Ionicons name="location" size={14} color={C.primary} />
            <Text style={dl.resultLabel} numberOfLines={2}>{locationLabel}</Text>
          </View>
          <View style={dl.metricRow}>
            <View style={dl.metric}>
              <Text style={dl.metricValue}>{distanceKm} km</Text>
              <Text style={dl.metricLabel}>Est. distance</Text>
            </View>
            <View style={dl.metricDivider} />
            <View style={dl.metric}>
              <Text style={dl.metricValue}>₹{deliveryPerKm}/km</Text>
              <Text style={dl.metricLabel}>Rate</Text>
            </View>
            <View style={dl.metricDivider} />
            <View style={dl.metric}>
              <Text style={[dl.metricValue, { color: C.primary }]}>
                ₹{deliveryCost.toLocaleString()}
              </Text>
              <Text style={dl.metricLabel}>Delivery cost</Text>
            </View>
          </View>
          <Text style={dl.note}>
            * Distance estimated via road factor (1.3×). Final charge confirmed at delivery.
          </Text>
        </View>
      )}

      {hasLocation && distanceKm === null && (
        <View style={dl.resultCard}>
          <View style={dl.resultRow}>
            <Ionicons name="location" size={14} color={C.primary} />
            <Text style={dl.resultLabel} numberOfLines={2}>{locationLabel}</Text>
          </View>
          <View style={dl.infoBadge}>
            <Ionicons name="information-circle-outline" size={13} color={C.gold} />
            <Text style={dl.infoBadgeText}>
              Delivery cost will be calculated by the service provider.
            </Text>
          </View>
        </View>
      )}

      {!hasLocation && (
        <View style={dl.emptyHint}>
          <Ionicons name="location-outline" size={14} color={C.muted} />
          <Text style={dl.emptyHintText}>
            Select a delivery location to calculate charges
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const params = useLocalSearchParams<{
    resourceId?: string;
    machineId?: string;
    bookingType?: BookingType;
  }>();

  const resourceId = (params.resourceId ?? params.machineId)!;
  const bookingType: BookingType = params.bookingType ?? "machine";
  const isMachine = bookingType === "machine";

  const router = useRouter();

  function showAlert(title: string, message: string) {
    Alert.alert(title, Array.isArray(message) ? message.join(", ") : String(message ?? ""));
  }

  const [resource, setResource] = useState<any>(null);
  const [loadingResource, setLoadingResource] = useState(true);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [acre, setAcre] = useState("0");
  const [manualDays, setManualDays] = useState("0");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [deliveryCoords, setDeliveryCoords] = useState<LatLng | null>(null);
  const [deliveryLabel, setDeliveryLabel] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadResource(); }, []);

  const loadResource = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const endpoint = isMachine
        ? `https://agridas-latest.onrender.com/machine/details/${resourceId}`
        : `https://agridas-latest.onrender.com/laborProvider/details/${resourceId}`;
      const res = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResource(res.data);
    } catch (e) {
      console.log("Resource load error:", e);
      showAlert("Error", "Failed to load details. Please go back and try again.");
    } finally {
      setLoadingResource(false);
    }
  };

  useEffect(() => {
    if (!startDate || !resource) return;
    const days = computeDaysNeeded();
    const end = new Date(startDate);
    end.setDate(end.getDate() + days - 1);
    setEndDate(toDateStr(end));
  }, [startDate, acre, manualDays, resource]);

  useEffect(() => {
    if (!deliveryCoords || !resource) {
      setDistanceKm(null);
      return;
    }
    const providerCoords = extractCoords(resource);
    if (!providerCoords) {
      setDistanceKm(null);
      return;
    }
    setDistanceKm(haversineKm(deliveryCoords, providerCoords));
  }, [deliveryCoords, resource]);

  const pricePerDay: number = parseFloat(resource?.pricePerDay ?? "0") || 0;
  const deliveryPerKm: number = resource?.deliveryChargePerKm ?? 0;
  const maxAcrePerDay: number = resource?.maxAcreCoverage ?? 1;
  const numberOfWorkers: number = resource?.numberOfWorkers ?? 1;
  const acreNum = parseFloat(acre) || 0;

  function computeDaysNeeded(): number {
    if (isMachine) {
      return Math.max(1, Math.ceil(acreNum / maxAcrePerDay));
    }
    return Math.max(1, parseInt(manualDays, 10) || 1);
  }

  const daysNeeded = computeDaysNeeded();
  const durationLabel = daysNeeded === 1 ? "1 day" : `${daysNeeded} days`;

  const serviceCost = isMachine
    ? pricePerDay * daysNeeded
    : pricePerDay * numberOfWorkers * daysNeeded;

  const deliveryCost =
    distanceKm != null ? Math.round(deliveryPerKm * distanceKm) : 0;

  const totalCost = serviceCost + deliveryCost;

  const handleMapConfirm = (coords: LatLng, label: string) => {
    setDeliveryCoords(coords);
    setDeliveryLabel(label);
    setMapVisible(false);
  };

  const handleSubmit = async () => {
    if (!name.trim())
      return showAlert("Missing Info", "Please enter your full name.");
    if (!address.trim())
      return showAlert("Missing Info", "Please enter your address.");
    if (!phone.trim() || phone.length < 10)
      return showAlert("Missing Info", "Please enter a valid 10-digit phone number.");
    if (!acreNum || acreNum <= 0)
      return showAlert("Missing Info", "Please enter a valid acreage.");
    if (!isMachine && (!parseInt(manualDays, 10) || parseInt(manualDays, 10) < 1))
      return showAlert("Missing Info", "Please enter a valid number of days.");
    if (!startDate)
      return showAlert("Missing Info", "Please select a start date from the calendar.");
    if (!deliveryCoords)
      return showAlert("Missing Info", "Please set a delivery location on the map.");

    try {
      setSubmitting(true);

      const startISO = new Date(`${startDate}T09:00:00.000Z`).toISOString();
      const endISO = new Date(`${endDate}T18:00:00.000Z`).toISOString();

      const resourceName = isMachine
        ? (resource?.name ?? "Machine")
        : "Labour Provider";

      const payload = {
        name: name.trim(),
        address: address.trim(),
        startDate: startISO,
        endDate: endISO,
        acre: acreNum,
        clientPhoneno: phone.trim(),
        serviceCost,
        deliveryCost,
        totalCost,
        bookingStatus: "requested",
        providerUserId: resource?.createdBy ?? null,
        ownerPhoneno: resource?.ownerPhoneno ?? "",
        resourceId,
        bookingType,
        deliveryLocation: {
          type: "Point",
          coordinates: [deliveryCoords.longitude, deliveryCoords.latitude],
        },
        deliveryAddress: deliveryLabel,
        resourceName,
        bookingLocationId: resourceId,
      };

      await api.post("https://agridas-latest.onrender.com/booking/create", payload);

      Alert.alert(
        "Booking Requested! 🎉",
        "Your booking request has been sent. The owner will confirm shortly.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showAlert(
        "Booking Failed",
        Array.isArray(msg)
          ? msg.join(", ")
          : (msg ?? "Something went wrong. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingResource) {
    return (
      <View style={bs.loadingScreen}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={bs.loadingText}>
          Loading {isMachine ? "machine" : "labour"} details…
        </Text>
      </View>
    );
  }

  if (!resource) return null;

  const summaryTitle = isMachine
    ? resource.name
    : `Labour · ${resource.skills?.slice(0, 2).join(", ") ?? ""}`;
  const summaryLocation = `${resource.taluka}, ${resource.district}`;

  return (
    <View style={bs.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={bs.topBar}>
        <TouchableOpacity style={bs.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={bs.topTitle}>Book {isMachine ? "Machine" : "Labour"}</Text>
          <Text style={bs.topSubtitle} numberOfLines={1}>{summaryTitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={bs.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary Card */}
          <View style={bs.summaryCard}>
            <View style={bs.summaryLeft}>
              <Text style={bs.summaryName} numberOfLines={1}>{summaryTitle}</Text>
              <View style={bs.summaryLoc}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={bs.summaryLocText}>{summaryLocation}</Text>
              </View>
              <View style={bs.summaryChips}>
                {isMachine ? (
                  <>
                    <View style={bs.summaryChip}>
                      <Text style={bs.summaryChipText}>{resource.maxAcreCoverage} acres/day</Text>
                    </View>
                    <View style={bs.summaryChip}>
                      <Text style={bs.summaryChipText}>₹{resource.deliveryChargePerKm}/km delivery</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={bs.summaryChip}>
                      <Text style={bs.summaryChipText}>{resource.numberOfWorkers} workers</Text>
                    </View>
                    <View style={bs.summaryChip}>
                      <Text style={bs.summaryChipText}>₹{resource.pricePerHour}/hr</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            <View style={bs.summaryRight}>
              <Text style={bs.summaryPriceLabel}>per day</Text>
              <Text style={bs.summaryPrice}>₹{pricePerDay.toLocaleString()}</Text>
              {!isMachine && (
                <Text style={bs.summaryPriceSubLabel}>× {numberOfWorkers} workers</Text>
              )}
            </View>
          </View>

          {/* Your Details */}
          <View style={bs.card}>
            <SectionHeader icon="person-outline" label="Your Details" />
            <Field label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Rahul Patil" icon="person-circle-outline" />
            <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} icon="call-outline" />
            <Field label="Address / Village" value={address} onChangeText={setAddress} placeholder="Village, Taluka, District" icon="home-outline" />
          </View>

          {/* Field / Service Details */}
          <View style={bs.card}>
            <SectionHeader icon="leaf-outline" label={isMachine ? "Field Details" : "Service Details"} />
            <Field label="Total Acreage" value={acre} onChangeText={setAcre} placeholder="Number of acres" keyboardType="numeric" icon="expand-outline" />
            {isMachine ? (
              <View style={bs.infoBox}>
                <Ionicons name="information-circle-outline" size={13} color={C.primary} />
                <Text style={bs.infoBoxText}>
                  This machine covers up to{" "}
                  <Text style={{ fontWeight: "800" }}>{resource.maxAcreCoverage} acres/day</Text>.
                  {acreNum > 0 && ` For ${acreNum} acres, you'll need ${durationLabel}.`}
                </Text>
              </View>
            ) : (
              <>
                <Field label="Number of Days" value={manualDays} onChangeText={setManualDays} placeholder="How many days needed" keyboardType="numeric" icon="time-outline" />
                <View style={bs.infoBox}>
                  <Ionicons name="information-circle-outline" size={13} color={C.primary} />
                  <Text style={bs.infoBoxText}>
                    <Text style={{ fontWeight: "800" }}>{numberOfWorkers} workers</Text>
                    {" × "}₹{pricePerDay}/day × {daysNeeded} {daysNeeded === 1 ? "day" : "days"}
                    {" = "}
                    <Text style={{ fontWeight: "800", color: C.primary }}>
                      ₹{serviceCost.toLocaleString()}
                    </Text>
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Calendar */}
          {acreNum > 0 && (
            <AvailabilityPicker
              resourceId={resourceId}
              selectedDate={startDate}
              endDate={endDate}
              daysNeeded={daysNeeded}
              onSelectDate={setStartDate}
            />
          )}

          {/* Date Range Display */}
          {startDate && (
            <View style={bs.dateRangeCard}>
              <View style={bs.dateRangeRow}>
                <View style={bs.dateRangeItem}>
                  <View style={bs.dateRangeIconWrap}>
                    <Ionicons name="play-circle" size={16} color={C.primary} />
                  </View>
                  <View>
                    <Text style={bs.dateRangeLabel}>Start Date</Text>
                    <Text style={bs.dateRangeValue}>{startDate}</Text>
                    <Text style={bs.dateRangeTime}>9:00 AM</Text>
                  </View>
                </View>
                <View style={bs.dateRangeArrow}>
                  <Ionicons name="arrow-forward" size={14} color={C.muted} />
                </View>
                <View style={bs.dateRangeItem}>
                  <View style={[bs.dateRangeIconWrap, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="stop-circle" size={16} color="#E65100" />
                  </View>
                  <View>
                    <Text style={bs.dateRangeLabel}>End Date</Text>
                    <Text style={[bs.dateRangeValue, { color: "#E65100" }]}>{endDate}</Text>
                    <Text style={[bs.dateRangeTime, { color: "#E65100" }]}>6:00 PM</Text>
                  </View>
                </View>
              </View>
              <View style={bs.dateRangeBadgeRow}>
                <View style={bs.dateRangeBadge}>
                  <Ionicons name="time-outline" size={12} color={C.primary} />
                  <Text style={bs.dateRangeBadgeText}>{durationLabel}</Text>
                </View>
                <Text style={bs.dateRangeNote}>
                  {isMachine
                    ? `${acreNum} acres ÷ ${resource.maxAcreCoverage} acres/day`
                    : `${numberOfWorkers} workers × ${daysNeeded} day${daysNeeded > 1 ? "s" : ""}`
                  }
                </Text>
              </View>
            </View>
          )}

          {/* Delivery Location */}
          <DeliveryLocationCard
            distanceKm={distanceKm}
            deliveryCost={deliveryCost}
            deliveryPerKm={deliveryPerKm}
            locationLabel={deliveryLabel}
            hasLocation={!!deliveryCoords}
            onOpenMap={() => setMapVisible(true)}
          />

          {/* Cost Summary */}
          <View style={bs.card}>
            <SectionHeader icon="receipt-outline" label="Cost Summary" />
            {isMachine ? (
              <CostRow
                label={`Service · ₹${pricePerDay.toLocaleString()}/day × ${daysNeeded} day${daysNeeded > 1 ? "s" : ""}`}
                value={`₹${serviceCost.toLocaleString()}`}
              />
            ) : (
              <CostRow
                label={`Service · ₹${pricePerDay}/day × ${numberOfWorkers} workers × ${daysNeeded} day${daysNeeded > 1 ? "s" : ""}`}
                value={`₹${serviceCost.toLocaleString()}`}
              />
            )}
            <CostRow
              label={
                distanceKm != null
                  ? `Delivery · ₹${deliveryPerKm}/km × ${distanceKm} km`
                  : deliveryCoords
                    ? "Delivery · To be confirmed by provider"
                    : "Delivery · Select location to calculate"
              }
              value={
                distanceKm != null
                  ? `₹${deliveryCost.toLocaleString()}`
                  : deliveryCoords ? "TBD" : "—"
              }
              muted={distanceKm == null}
            />
            <View style={bs.costDivider} />
            <CostRow label="Total Amount" value={`₹${totalCost.toLocaleString()}`} bold highlight />
            {distanceKm != null && (
              <Text style={bs.costNote}>
                * Delivery distance estimated via road factor (1.3×). Final charge confirmed at delivery.
              </Text>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar */}
      <View style={bs.bottomBar}>
        <View>
          <Text style={bs.bottomLabel}>Total Amount</Text>
          <Text style={bs.bottomPrice}>₹{totalCost.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[bs.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={bs.submitText}>Confirm Booking</Text>
              <Ionicons name="checkmark-circle" size={17} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Map Picker Modal */}
      <MapPickerModal
        visible={mapVisible}
        onConfirm={handleMapConfirm}
        onClose={() => setMapVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bs = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  loadingScreen: {
    flex: 1, backgroundColor: C.bg,
    justifyContent: "center", alignItems: "center", gap: 12,
  },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: "600" },

  topBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: C.card,
    borderBottomWidth: 1, borderColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.bg, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.border,
  },
  topTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  topSubtitle: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 1 },

  scrollContent: { padding: 16 },

  summaryCard: {
    backgroundColor: C.primary, borderRadius: 16, padding: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  summaryLeft: { flex: 1, marginRight: 12 },
  summaryName: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 5 },
  summaryLoc: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  summaryLocText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  summaryChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  summaryChipText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  summaryRight: { alignItems: "flex-end" },
  summaryPriceLabel: { fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  summaryPrice: { fontSize: 24, fontWeight: "900", color: "#fff" },
  summaryPriceSubLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "500", marginTop: 2 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: C.primaryFaint, justifyContent: "center", alignItems: "center",
  },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: C.ink },

  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 11, fontWeight: "700", color: C.muted,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4,
  },
  fieldInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, minHeight: 46,
  },
  fieldInputLocked: { backgroundColor: "#F8F8F8" },
  fieldInput: {
    flex: 1, fontSize: 14, fontWeight: "600", color: C.ink,
    paddingHorizontal: 12, paddingVertical: 10,
  },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: C.primaryFaint, borderRadius: 10, padding: 10, marginTop: 2,
  },
  infoBoxText: { flex: 1, fontSize: 12, color: C.primary, fontWeight: "500", lineHeight: 18 },

  calCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  calNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center",
    borderRadius: 8, marginVertical: 2,
  },
  calCellAvail: { backgroundColor: C.primaryFaint },
  calCellOccupied: { backgroundColor: C.dangerFaint },

  dateRangeCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  dateRangeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateRangeItem: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dateRangeArrow: { paddingHorizontal: 6, alignItems: "center" },
  dateRangeIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.primaryFaint, justifyContent: "center", alignItems: "center",
  },
  dateRangeLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  dateRangeValue: { fontSize: 13, fontWeight: "800", color: C.ink, marginTop: 1 },
  dateRangeTime: { fontSize: 11, color: C.muted, fontWeight: "600", marginTop: 1 },
  dateRangeBadgeRow: {
    flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderColor: C.border, gap: 8,
  },
  dateRangeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primaryFaint, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  dateRangeBadgeText: { fontSize: 11, fontWeight: "700", color: C.primary },
  dateRangeNote: { fontSize: 11, color: C.muted, fontWeight: "500", flex: 1 },

  costRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderColor: C.border,
  },
  costRowHighlight: {
    backgroundColor: C.primaryFaint, borderRadius: 10,
    paddingHorizontal: 10, borderBottomWidth: 0, marginTop: 4,
  },
  costLabel: { fontSize: 13, color: C.muted, fontWeight: "600", flex: 1, marginRight: 8 },
  costValue: { fontSize: 15, fontWeight: "700", color: C.ink },
  costDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  costNote: { fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 16 },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: C.card, paddingHorizontal: 20,
    paddingTop: 14, paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1, borderColor: C.border,
  },
  bottomLabel: { fontSize: 11, color: C.muted, fontWeight: "600", marginBottom: 1 },
  bottomPrice: { fontSize: 22, fontWeight: "900", color: C.ink },
  submitBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.primary, paddingHorizontal: 22, paddingVertical: 13,
    borderRadius: 13, shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8,
    elevation: 5, minWidth: 170, justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});

const dl = StyleSheet.create({
  mapBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.primaryFaint, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: C.border, marginBottom: 12,
  },
  mapBtnIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primary, justifyContent: "center", alignItems: "center",
  },
  mapBtnTitle: { fontSize: 13, fontWeight: "700", color: C.ink },
  mapBtnSub: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 2 },

  resultCard: {
    backgroundColor: C.bg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  resultRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 12 },
  resultLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: C.ink, lineHeight: 19 },

  metricRow: {
    flexDirection: "row", backgroundColor: C.card, borderRadius: 10,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  metric: { flex: 1, alignItems: "center" },
  metricValue: { fontSize: 15, fontWeight: "900", color: C.ink, marginBottom: 2 },
  metricLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  metricDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  note: { fontSize: 11, color: C.muted, lineHeight: 16 },

  infoBadge: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#FFFBEB", borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: "#F59E0B33",
  },
  infoBadgeText: { flex: 1, fontSize: 12, color: "#92400E", fontWeight: "500", lineHeight: 17 },

  emptyHint: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, borderStyle: "dashed",
  },
  emptyHintText: { fontSize: 13, color: C.muted, fontWeight: "500", flex: 1 },
});

const mp = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: C.card, borderBottomWidth: 1, borderColor: C.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.bg, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.ink },

  searchRow: {
    flexDirection: "row", gap: 8, alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.card, borderBottomWidth: 1, borderColor: C.border,
  },
  searchInputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    minHeight: 42,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontWeight: "500", color: C.ink,
    paddingHorizontal: 8, paddingVertical: 9,
  },
  searchBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 11,
    alignItems: "center", justifyContent: "center", minWidth: 52,
  },
  searchBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  hint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.primaryFaint, paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderColor: C.border,
  },
  hintText: { fontSize: 12, color: C.primary, fontWeight: "600" },

  map: { flex: 1, width: "100%" },

  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  mapLoaderText: { fontSize: 13, color: C.muted, fontWeight: "600" },

  addressBar: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.card, padding: 16,
    borderTopWidth: 1, borderColor: C.border,
  },
  addressIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primaryFaint, justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  addressLabel: { fontSize: 10, color: C.muted, fontWeight: "600", marginBottom: 3 },
  addressValue: { fontSize: 14, fontWeight: "700", color: C.ink, lineHeight: 20 },
  addressCoords: { fontSize: 11, color: C.muted, marginTop: 3 },

  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, margin: 16, borderRadius: 13, paddingVertical: 15,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 5,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});