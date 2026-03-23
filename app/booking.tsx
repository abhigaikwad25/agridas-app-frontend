import { useLang } from "@/contexts/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/app/utils/axiosinstance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width, height } = Dimensions.get("window");

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
  goldFaint: "#FFFBEB",
  shadow: "rgba(30,127,67,0.10)",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationMode = "none" | "current" | "custom";

interface LatLng {
  latitude: number;
  longitude: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Haversine formula — straight-line distance between two coordinates in km.
 * For delivery, road distance is ~1.3–1.4× this; we apply a 1.3 road factor.
 */
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const straightLine = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  // Apply 1.3× road factor for realistic road distance estimate
  return Math.round(straightLine * 1.3 * 10) / 10;
}

// ─── Availability Calendar / Date Picker ─────────────────────────────────────

function AvailabilityPicker({
  machineId,
  selectedDate,
  endDate,
  onSelectDate,
}: {
  machineId: string;
  selectedDate: string | null;
  endDate: string | null;
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
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(
        `https://agridas-latest.onrender.com/booking/availabilyStatus/${machineId}`
      );
      const dates: string[] = res.data?.occupiedDates ?? res.data ?? [];
      setOccupiedDates(new Set(dates));
    } catch (e) {
      console.log("Availability fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = toDateStr(today);

  const rangeSet = new Set<string>();
  if (selectedDate && endDate) {
    const s = new Date(selectedDate);
    const e = new Date(endDate);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      rangeSet.add(toDateStr(new Date(d)));
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={bs.calCard}>
      <View style={bs.calHeader}>
        <View style={bs.calHeaderIcon}>
          <Ionicons name="calendar-outline" size={14} color={C.primary} />
        </View>
        <Text style={bs.calTitle}>Select Start Date</Text>
      </View>

      {loading ? (
        <View style={bs.calLoading}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={bs.calLoadingText}>Fetching schedule…</Text>
        </View>
      ) : (
        <>
          <View style={bs.calNav}>
            <TouchableOpacity style={bs.calNavBtn} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={16} color={C.ink} />
            </TouchableOpacity>
            <Text style={bs.calMonthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity style={bs.calNavBtn} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={16} color={C.ink} />
            </TouchableOpacity>
          </View>

          <View style={bs.calDayHeaders}>
            {DAY_LABELS.map((d) => (
              <Text key={d} style={bs.calDayHeader}>
                {d}
              </Text>
            ))}
          </View>

          <View style={bs.calGrid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`blank-${idx}`} style={bs.calCell} />;
              }
              const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
              const isOccupied = occupiedDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const isPast =
                new Date(viewYear, viewMonth, day) <
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                );
              const isSelected = selectedDate === dateStr;
              const isEnd = endDate === dateStr && !isSelected;
              const inRange = rangeSet.has(dateStr) && !isSelected && !isEnd;

              if (isPast && !isToday) {
                return (
                  <View key={dateStr} style={bs.calCell}>
                    <Text style={bs.calCellPastText}>{day}</Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    bs.calCell,
                    !isOccupied && bs.calCellAvail,
                    isOccupied && bs.calCellOccupied,
                    isToday && !isOccupied && !isSelected && bs.calCellToday,
                    inRange && bs.calCellRange,
                    isEnd && bs.calCellEnd,
                    isSelected && bs.calCellSelected, // gold — always last to win
                  ]}
                  onPress={() => !isOccupied && onSelectDate(dateStr)}
                  activeOpacity={isOccupied ? 1 : 0.7}
                  disabled={isOccupied}
                >
                  <Text
                    style={[
                      bs.calCellText,
                      !isOccupied && bs.calCellAvailText,
                      isOccupied && bs.calCellOccupiedText,
                      isToday &&
                        !isOccupied &&
                        !isSelected &&
                        bs.calCellTodayText,
                      isEnd && bs.calCellSelectedText,
                      isSelected && bs.calCellSelectedText, // last → always wins
                    ]}
                  >
                    {day}
                  </Text>
                  {isOccupied && <View style={bs.calDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={bs.calLegend}>
            <View style={bs.calLegendItem}>
              <View
                style={[
                  bs.calLegendDot,
                  { backgroundColor: C.primaryFaint, borderColor: C.primary },
                ]}
              />
              <Text style={bs.calLegendText}>Available</Text>
            </View>
            <View style={bs.calLegendItem}>
              <View
                style={[
                  bs.calLegendDot,
                  { backgroundColor: C.dangerFaint, borderColor: C.danger },
                ]}
              />
              <Text style={bs.calLegendText}>Booked</Text>
            </View>
            <View style={bs.calLegendItem}>
              <View
                style={[
                  bs.calLegendDot,
                  { backgroundColor: C.gold, borderColor: C.gold },
                ]}
              />
              <Text style={bs.calLegendText}>Selected</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Map Picker Modal ─────────────────────────────────────────────────────────

function MapPickerModal({
  visible,
  initialLocation,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  initialLocation: LatLng | null;
  onConfirm: (coords: LatLng, label: string) => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState<LatLng>(
    initialLocation ?? { latitude: 19.9975, longitude: 73.7898 },
  );
  const [resolving, setResolving] = useState(false);
  const [label, setLabel] = useState("Custom location");
  const [fetchingInitial, setFetchingInitial] = useState(false);
  const mapRef = useRef<MapView>(null);

  // When modal opens — if no initialLocation, fetch current GPS and center map there
  useEffect(() => {
    if (!visible) return;
    if (initialLocation) {
      // Already have coords (e.g. user already used Current Location)
      setPin(initialLocation);
      mapRef.current?.animateToRegion(
        {
          ...initialLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        500,
      );
      return;
    }
    // No coords yet — silently get current location for default pin
    fetchCurrentForMap();
  }, [visible]);

  const fetchCurrentForMap = async () => {
    setFetchingInitial(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return; // permission not granted, use default Maharashtra coords

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const coords: LatLng = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setPin(coords);
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        800,
      );
    } catch {
      // Silently fall back to default coords
    } finally {
      setFetchingInitial(false);
    }
  };

  // Reverse-geocode on pin change
  useEffect(() => {
    if (!visible) return;
    resolveAddress(pin);
  }, [pin]);

  const resolveAddress = async (coords: LatLng) => {
    setResolving(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.city ?? r.subregion, r.region]
          .filter(Boolean)
          .join(", ");
        setLabel(parts || "Custom location");
      }
    } catch {
      setLabel("Custom location");
    } finally {
      setResolving(false);
    }
  };

  const defaultRegion = {
    latitude: pin.latitude,
    longitude: pin.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={mp.container}>
        <StatusBar barStyle="dark-content" />

        <View style={mp.header}>
          <TouchableOpacity style={mp.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={mp.headerTitle}>Pick Delivery Location</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={mp.hint}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={C.primary}
          />
          <Text style={mp.hintText}>
            Tap on map or drag the pin to set location
          </Text>
        </View>

        {/* Loading overlay while fetching initial location */}
        {fetchingInitial && (
          <View style={mp.mapLoadingOverlay}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={mp.mapLoadingText}>Finding your location…</Text>
          </View>
        )}

        <MapView
          ref={mapRef}
          style={mp.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={defaultRegion}
          onPress={(e) => setPin(e.nativeEvent.coordinate)}
        >
          <Marker
            coordinate={pin}
            pinColor={C.primary}
            draggable
            onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
          />
        </MapView>

        <View style={mp.addressBar}>
          <View style={mp.addressIcon}>
            <Ionicons name="location" size={16} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={mp.addressLabel}>Selected location</Text>
            {resolving ? (
              <ActivityIndicator
                size="small"
                color={C.primary}
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              />
            ) : (
              <Text style={mp.addressValue} numberOfLines={2}>
                {label}
              </Text>
            )}
            <Text style={mp.addressCoords}>
              {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={mp.confirmBtn}
          onPress={() => onConfirm(pin, label)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={mp.confirmText}>Confirm This Location</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Delivery Location Selector ───────────────────────────────────────────────

function DeliveryLocationSelector({
  mode,
  distanceKm,
  deliveryCost,
  deliveryPerKm,
  locationLabel,
  loadingLocation,
  onSelectCurrent,
  onOpenMap,
}: {
  mode: LocationMode;
  distanceKm: number | null;
  deliveryCost: number;
  deliveryPerKm: number;
  locationLabel: string;
  loadingLocation: boolean;
  onSelectCurrent: () => void;
  onOpenMap: () => void;
}) {
  return (
    <View style={bs.card}>
      {/* Section header */}
      <View style={bs.sectionHeader}>
        <View style={bs.sectionIconWrap}>
          <Ionicons name="car-outline" size={14} color={C.primary} />
        </View>
        <Text style={bs.sectionLabel}>Delivery Location</Text>
      </View>

      {/* Option buttons */}
      <View style={dl.optionRow}>
        <TouchableOpacity
          style={[dl.optionBtn, mode === "current" && dl.optionBtnActive]}
          onPress={onSelectCurrent}
          activeOpacity={0.8}
        >
          <View
            style={[dl.optionIcon, mode === "current" && dl.optionIconActive]}
          >
            <Ionicons
              name="navigate"
              size={15}
              color={mode === "current" ? "#fff" : C.primary}
            />
          </View>
          <Text
            style={[dl.optionLabel, mode === "current" && dl.optionLabelActive]}
          >
            Current Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dl.optionBtn, mode === "custom" && dl.optionBtnActive]}
          onPress={onOpenMap}
          activeOpacity={0.8}
        >
          <View
            style={[dl.optionIcon, mode === "custom" && dl.optionIconActive]}
          >
            <Ionicons
              name="map"
              size={15}
              color={mode === "custom" ? "#fff" : C.primary}
            />
          </View>
          <Text
            style={[dl.optionLabel, mode === "custom" && dl.optionLabelActive]}
          >
            Pick on Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loadingLocation && (
        <View style={dl.statusRow}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={dl.statusText}>Getting your location…</Text>
        </View>
      )}

      {/* Result card — shown once a location is chosen */}
      {!loadingLocation && mode !== "none" && distanceKm !== null && (
        <View style={dl.resultCard}>
          {/* Location label */}
          <View style={dl.resultRow}>
            <Ionicons name="location" size={14} color={C.primary} />
            <Text style={dl.resultLabel} numberOfLines={2}>
              {locationLabel}
            </Text>
          </View>

          {/* Distance + cost breakdown */}
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
            * Distance estimated via road factor (1.3×). Final charge confirmed
            at delivery.
          </Text>

          {/* Change button for custom */}
          {mode === "custom" && (
            <TouchableOpacity style={dl.changeBtn} onPress={onOpenMap}>
              <Ionicons name="pencil-outline" size={12} color={C.primary} />
              <Text style={dl.changeBtnText}>Change location</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* No location chosen yet */}
      {!loadingLocation && mode === "none" && (
        <View style={dl.emptyHint}>
          <Ionicons name="location-outline" size={14} color={C.muted} />
          <Text style={dl.emptyHintText}>
            Choose a delivery location to calculate charges
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────

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
  maxLength
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const { machineId } = useLocalSearchParams<{ machineId: string }>();
  const router = useRouter();

  function showAlert(title: string, message: string) {
    Alert.alert(
      title,
      Array.isArray(message) ? message.join(", ") : String(message ?? ""),
    );
  }

  const [machine, setMachine] = useState<any>(null);
  const [loadingMachine, setLoadingMachine] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [acre, setAcre] = useState("1");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Delivery location
  const [locationMode, setLocationMode] = useState<LocationMode>("none");
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    loadMachine();
  }, []);

  // Recalculate endDate whenever startDate or acre changes
  useEffect(() => {
    if (!startDate || !machine) return;
    const acres = parseFloat(acre) || 1;
    const maxAcrePerDay: number = machine.maxAcreCoverage ?? 1;
    const daysNeeded = Math.max(1, Math.ceil(acres / maxAcrePerDay));
    const end = new Date(startDate);
    end.setDate(end.getDate() + daysNeeded - 1);
    setEndDate(toDateStr(end));
  }, [startDate, acre, machine]);

  // Recalculate distance whenever userCoords changes
  useEffect(() => {
    if (!userCoords || !machine) return;
    const machineCoords = getMachineCoords();
    if (!machineCoords) return;
    const km = haversineKm(userCoords, machineCoords);
    setDistanceKm(km);
  }, [userCoords, machine]); // ← make sure BOTH are in deps array

  const loadMachine = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(
        `https://agridas-latest.onrender.com/machine/details/${machineId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMachine(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingMachine(false);
    }
  };

  /**
   * Extract machine geoLocation from API response.
   * Handles common shapes: { lat, lng }, { latitude, longitude },
   * GeoJSON { coordinates: [lng, lat] }
   */
  const getMachineCoords = (): LatLng | null => {
    if (!machine) return null;

    let g = machine.geoLocation ?? machine.location ?? machine.coordinates;
    if (!g) return null;

    // ← THIS was the bug: geoLocation comes as a JSON string, need to parse it first
    if (typeof g === "string") {
      try {
        g = JSON.parse(g);
      } catch {
        return null;
      }
    }

    // GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
    if (g.type === "Point" && Array.isArray(g.coordinates)) {
      return { latitude: g.coordinates[1], longitude: g.coordinates[0] };
    }

    // Plain object shapes
    if (g.latitude != null)
      return { latitude: g.latitude, longitude: g.longitude };
    if (g.lat != null) return { latitude: g.lat, longitude: g.lng };
    if (Array.isArray(g.coordinates)) {
      return { latitude: g.coordinates[1], longitude: g.coordinates[0] };
    }

    return null;
  };

  // ── Use current location ────────────────────────────────────────────────────
  const handleCurrentLocation = async () => {
    setLoadingLocation(true);
    setLocationMode("current");
    try {
      // Check existing permission first without prompting
      const { status: existing } =
        await Location.getForegroundPermissionsAsync();

      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location access from Settings → Apps → Agridas → Permissions → Location.",
        );
        setLocationMode("none");
        setLoadingLocation(false);
        return;
      }

      // Use Low accuracy — much faster on Android, good enough for delivery distance
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const coords: LatLng = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserCoords(coords);

      // Reverse geocode for label
      try {
        const results = await Location.reverseGeocodeAsync(coords);
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.name, r.city ?? r.subregion, r.region]
            .filter(Boolean)
            .join(", ");
          setLocationLabel(parts || "Your current location");
        } else {
          setLocationLabel("Your current location");
        }
      } catch {
        setLocationLabel("Your current location");
      }
    } catch (e: any) {
      console.log("Location error:", e);
      // Fallback: try last known location if getCurrentPositionAsync fails
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          const coords: LatLng = {
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          };
          setUserCoords(coords);
          setLocationLabel("Your last known location");
          return;
        }
      } catch {}

      Alert.alert(
        "Location Error",
        "Could not fetch your location. Make sure GPS is turned ON and try again.",
      );
      setLocationMode("none");
    } finally {
      setLoadingLocation(false);
    }
  };

  // ── Map picker confirm ──────────────────────────────────────────────────────
  const handleMapConfirm = (coords: LatLng, label: string) => {
    setUserCoords(coords);
    setLocationLabel(label);
    setLocationMode("custom");
    setMapVisible(false);
  };

  // ── Cost calculations ───────────────────────────────────────────────────────
  // ── Cost calculations ───────────────────────────────────────────────────────
  const acreNum = parseFloat(acre) || 0;
  const pricePerDay: number = machine?.pricePerDay ?? 0;
  const deliveryPerKm: number = machine?.deliveryChargePerKm ?? 0;
  const maxAcrePerDay: number = machine?.maxAcreCoverage ?? 1;
  const daysNeeded = Math.max(1, Math.ceil(acreNum / maxAcrePerDay));

  const serviceCost = pricePerDay * daysNeeded;

  // ← THIS was the bug: distanceKm was null even after setting because
  //    it was computed before state updated. Now reads directly from state.
  const deliveryCost =
    distanceKm != null ? Math.round(deliveryPerKm * distanceKm) : 0;

  const totalCost = serviceCost + deliveryCost;
  const durationLabel = daysNeeded === 1 ? "1 day" : `${daysNeeded} days`;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim())
      return showAlert("Missing Info", "Please enter your full name.");
    if (!address.trim())
      return showAlert("Missing Info", "Please enter your address.");
    if (!phone.trim() || phone.length < 10)
      return showAlert(
        "Missing Info",
        "Please enter a valid 10-digit phone number.",
      );
    if (!acreNum || acreNum <= 0)
      return showAlert("Missing Info", "Please enter a valid acreage.");
    if (!startDate)
      return showAlert(
        "Missing Info",
        "Please select a start date from the calendar.",
      );
    if (locationMode === "none")
      return showAlert(
        "Missing Info",
        "Please select a delivery location to calculate charges.",
      );

    // ... rest of submit code ...

    try {
      setSubmitting(true);
      const startISO = new Date(`${startDate}T09:00:00.000Z`).toISOString();
      const endISO = new Date(`${endDate}T18:00:00.000Z`).toISOString();

      const payload = {
        name: name.trim(),
        address: address.trim(),
        startDate: startISO,
        endDate: endISO,
        acre: acreNum,
        clientPhoneno: phone.trim(),
        bookingLocationId: machineId,
        serviceCost,
        deliveryCost,
        totalCost,
        bookingStatus: "requested",
        providerUserId: machine?.createdBy || null,
        ownerPhoneno: machine?.ownerPhoneno ?? machine?.phoneNo ?? "",
        resourceId: machineId,
        bookingType: "machine",
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
        "Error",
        Array.isArray(msg)
          ? msg.join(", ")
          : (msg ?? "Something went wrong. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadingMachine) {
    return (
      <View style={bs.loadingScreen}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={bs.loadingText}>Loading machine details…</Text>
      </View>
    );
  }
  if (!machine) return null;

  return (
    <View style={bs.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ── Top Bar ── */}
      <View style={bs.topBar}>
        <TouchableOpacity style={bs.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={bs.topTitle}>Book Machine</Text>
          <Text style={bs.topSubtitle} numberOfLines={1}>
            {machine.name}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={bs.scrollContent}
        >
          {/* ── Machine Summary ── */}
          <View style={bs.summaryCard}>
            <View style={bs.summaryLeft}>
              <Text style={bs.summaryName} numberOfLines={1}>
                {machine.name}
              </Text>
              <View style={bs.summaryLoc}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={bs.summaryLocText}>
                  {machine.taluka}, {machine.district}
                </Text>
              </View>
              <View style={bs.summaryChips}>
                <View style={bs.summaryChip}>
                  <Text style={bs.summaryChipText}>
                    {machine.maxAcreCoverage} acres/day
                  </Text>
                </View>
                <View style={bs.summaryChip}>
                  <Text style={bs.summaryChipText}>
                    ₹{machine.deliveryChargePerKm}/km
                  </Text>
                </View>
              </View>
            </View>
            <View style={bs.summaryRight}>
              <Text style={bs.summaryPriceLabel}>per Acre</Text>
              <Text style={bs.summaryPrice}>₹{machine.pricePerDay}</Text>
            </View>
          </View>

          {/* ── Your Details ── */}
          <View style={bs.card}>
            <SectionHeader icon="person-outline" label="Your Details" />
            <Field
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Patil"
              icon="person-circle-outline"
            />
            <Field
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              icon="call-outline"
            />
            <Field
              label="Address / Village"
              value={address}
              onChangeText={setAddress}
              placeholder="Village, Taluka, District"
              icon="home-outline"
            />
          </View>

          {/* ── Field Details ── */}
          <View style={bs.card}>
            <SectionHeader icon="leaf-outline" label="Field Details" />
            <Field
              label="Total Acreage"
              value={acre}
              onChangeText={setAcre}
              placeholder="Number of acres"
              keyboardType="numeric"
              icon="expand-outline"
            />
            <View style={bs.acreInfo}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={C.primary}
              />
              <Text style={bs.acreInfoText}>
                This machine covers up to{" "}
                <Text style={{ fontWeight: "800" }}>
                  {machine.maxAcreCoverage} acres/day
                </Text>
                .
                {acreNum > 0 &&
                  ` For ${acreNum} acres, you'll need ${durationLabel}.`}
              </Text>
            </View>
          </View>

          {/* ── Calendar ── */}
          <AvailabilityPicker
            machineId={machineId!}
            selectedDate={startDate}
            endDate={endDate}
            onSelectDate={setStartDate}
          />

          {/* ── Date Range Display ── */}
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
                  <View
                    style={[
                      bs.dateRangeIconWrap,
                      { backgroundColor: "#FFF3E0" },
                    ]}
                  >
                    <Ionicons name="stop-circle" size={16} color="#E65100" />
                  </View>
                  <View>
                    <Text style={bs.dateRangeLabel}>End Date</Text>
                    <Text style={[bs.dateRangeValue, { color: "#E65100" }]}>
                      {endDate}
                    </Text>
                    <Text style={[bs.dateRangeTime, { color: "#E65100" }]}>
                      6:00 PM
                    </Text>
                  </View>
                </View>
              </View>
              <View style={bs.dateRangeBadgeRow}>
                <View style={bs.dateRangeBadge}>
                  <Ionicons name="time-outline" size={12} color={C.primary} />
                  <Text style={bs.dateRangeBadgeText}>{durationLabel}</Text>
                </View>
                <Text style={bs.dateRangeNote}>
                  {acreNum} acres ÷ {machine.maxAcreCoverage} acres/day
                </Text>
              </View>
            </View>
          )}

          {/* ── Delivery Location ── */}
          <DeliveryLocationSelector
            mode={locationMode}
            distanceKm={distanceKm}
            deliveryCost={deliveryCost}
            deliveryPerKm={deliveryPerKm}
            locationLabel={locationLabel}
            loadingLocation={loadingLocation}
            onSelectCurrent={handleCurrentLocation}
            onOpenMap={() => setMapVisible(true)}
          />

          {/* ── Cost Summary ── */}
          <View style={bs.card}>
            <SectionHeader icon="receipt-outline" label="Cost Summary" />
            <CostRow
              label={`Service  ·  ₹${pricePerDay}/Acre × ${daysNeeded} day${daysNeeded > 1 ? "s" : ""}`}
              value={`₹${serviceCost.toLocaleString()}`}
            />
            <CostRow
              label={
                distanceKm != null
                  ? `Delivery  ·  ₹${deliveryPerKm}/km × ${distanceKm} km`
                  : "Delivery  ·  Select location to calculate"
              }
              value={
                distanceKm != null ? `₹${deliveryCost.toLocaleString()}` : "—"
              }
              muted={distanceKm == null}
            />
            <View style={bs.costDivider} />
            <CostRow
              label="Total Amount"
              value={`₹${totalCost.toLocaleString()}`}
              bold
              highlight
            />
            {distanceKm != null && (
              <Text style={bs.costNote}>
                * Delivery distance estimated via road factor (1.3×). Final
                charge confirmed at delivery.
              </Text>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Bottom Bar ── */}
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

      {/* ── Map Picker Modal ── */}
      <MapPickerModal
        visible={mapVisible}
        initialLocation={userCoords}
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
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: "600" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  topTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  topSubtitle: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "500",
    marginTop: 1,
  },

  scrollContent: { padding: 16 },

  summaryCard: {
    backgroundColor: C.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryLeft: { flex: 1, marginRight: 12 },
  summaryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 5,
  },
  summaryLoc: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  summaryLocText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  summaryChips: { flexDirection: "row", gap: 6 },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  summaryChipText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  summaryRight: { alignItems: "flex-end" },
  summaryPriceLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
  },
  summaryPrice: { fontSize: 24, fontWeight: "900", color: "#fff" },

  // Calendar
  calCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  calHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  calTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  calLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  calLoadingText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  calMonthLabel: { fontSize: 14, fontWeight: "800", color: C.ink },
  calDayHeaders: { flexDirection: "row", marginBottom: 5 },
  calDayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: C.muted,
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
    position: "relative",
  },
  calCellText: { fontSize: 13, fontWeight: "600", color: C.ink },
  calCellAvail: { backgroundColor: C.primaryFaint },
  calCellAvailText: { color: C.primary },
  calCellOccupied: { backgroundColor: C.dangerFaint },
  calCellOccupiedText: { color: C.danger },
  calCellToday: { backgroundColor: C.primary },
  calCellTodayText: { color: "#fff", fontWeight: "900" },
  calCellSelected: { backgroundColor: C.gold, borderRadius: 8 }, // golden
  calCellEnd: { backgroundColor: "#E65100", borderRadius: 8 },
  calCellRange: { backgroundColor: C.primaryMid, borderRadius: 4 },
  calCellPastText: { fontSize: 13, fontWeight: "500", color: C.border },
  calCellSelectedText: { color: "#fff", fontWeight: "800" },
  calDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.danger,
  },
  calLegend: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  calLegendDot: { width: 11, height: 11, borderRadius: 3, borderWidth: 1.5 },
  calLegendText: { fontSize: 11, fontWeight: "600", color: C.muted },

  // Date Range
  dateRangeCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRangeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dateRangeArrow: { paddingHorizontal: 6, alignItems: "center" },
  dateRangeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  dateRangeLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  dateRangeValue: {
    fontSize: 13,
    fontWeight: "800",
    color: C.ink,
    marginTop: 1,
  },
  dateRangeTime: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginTop: 1,
  },
  dateRangeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  dateRangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  dateRangeBadgeText: { fontSize: 11, fontWeight: "700", color: C.primary },
  dateRangeNote: { fontSize: 11, color: C.muted, fontWeight: "500", flex: 1 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: C.ink },

  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 46,
  },
  fieldInputLocked: { backgroundColor: "#F8F8F8" },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.ink,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  acreInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: C.primaryFaint,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  acreInfoText: {
    flex: 1,
    fontSize: 12,
    color: C.primary,
    fontWeight: "500",
    lineHeight: 18,
  },

  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  costRowHighlight: {
    backgroundColor: C.primaryFaint,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    marginTop: 4,
  },
  costLabel: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  costValue: { fontSize: 15, fontWeight: "700", color: C.ink },
  costDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  costNote: { fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 16 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  bottomLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "600",
    marginBottom: 1,
  },
  bottomPrice: { fontSize: 22, fontWeight: "900", color: C.ink },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 13,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 170,
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});

// ─── Delivery Location styles ─────────────────────────────────────────────────

const dl = StyleSheet.create({
  optionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  optionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: C.primaryFaint,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  optionBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.card,
    justifyContent: "center",
    alignItems: "center",
  },
  optionIconActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  optionLabel: { fontSize: 13, fontWeight: "700", color: C.primary, flex: 1 },
  optionLabelActive: { color: "#fff" },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: C.primaryFaint,
    borderRadius: 10,
  },
  statusText: { fontSize: 13, color: C.primary, fontWeight: "600" },

  resultCard: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  resultLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: C.ink,
    lineHeight: 19,
  },

  metricRow: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  metric: { flex: 1, alignItems: "center" },
  metricValue: {
    fontSize: 15,
    fontWeight: "900",
    color: C.ink,
    marginBottom: 2,
  },
  metricLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  metricDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  note: { fontSize: 11, color: C.muted, lineHeight: 16 },

  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.primaryFaint,
    borderWidth: 1,
    borderColor: C.border,
  },
  changeBtnText: { fontSize: 12, fontWeight: "700", color: C.primary },

  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
  },
  emptyHintText: { fontSize: 13, color: C.muted, fontWeight: "500", flex: 1 },
});

// ─── Map Picker styles ────────────────────────────────────────────────────────

const mp = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.75)",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  mapLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.ink },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primaryFaint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  hintText: { fontSize: 12, color: C.primary, fontWeight: "600" },

  map: { flex: 1 },

  addressBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.card,
    padding: 16,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  addressIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primaryFaint,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  addressLabel: {
    fontSize: 10,
    color: C.muted,
    fontWeight: "600",
    marginBottom: 3,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: C.ink,
    lineHeight: 20,
  },
  addressCoords: { fontSize: 11, color: C.muted, marginTop: 3 },

  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    margin: 16,
    borderRadius: 13,
    paddingVertical: 15,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
