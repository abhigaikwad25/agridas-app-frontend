import api from "@/app/utils/axiosinstance";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapPickerModal from "@/components/MapPickerModal";

type BookingType = "machine" | "laborProvider";

interface LatLng {
  latitude: number;
  longitude: number;
}

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const straight = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(straight * 1.3 * 10) / 10;
}

function extractCoords(resource: any, bookingType?: BookingType): LatLng | null {
  if (!resource) return null;

  let g = null;

  if (bookingType === "machine") {
    g = resource.machinelocation ?? resource.geoLocation ?? resource.location ?? resource.coordinates;
  } else if (bookingType === "laborProvider") {
    g = resource.labourLocation ?? resource.location ?? resource.coordinates ?? resource.geoLocation;
  } else {
    g =
      resource.machinelocation ??
      resource.labourLocation ??
      resource.geoLocation ??
      resource.location ??
      resource.coordinates;
  }

  if (!g) return null;

  if (typeof g === "string") {
    try {
      g = JSON.parse(g);
    } catch {
      return null;
    }
  }

  if (g?.type === "Point" && Array.isArray(g.coordinates)) {
    return {
      latitude: g.coordinates[1],
      longitude: g.coordinates[0],
    };
  }

  if (g?.latitude != null && g?.longitude != null) {
    return {
      latitude: g.latitude,
      longitude: g.longitude,
    };
  }

  if (g?.lat != null && g?.lng != null) {
    return {
      latitude: g.lat,
      longitude: g.lng,
    };
  }

  if (Array.isArray(g?.coordinates)) {
    return {
      latitude: g.coordinates[1],
      longitude: g.coordinates[0],
    };
  }

  return null;
}

function showAlert(title: string, message: string | string[]) {
  Alert.alert(title, Array.isArray(message) ? message.join(", ") : String(message ?? ""));
}

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
        {icon ? (
          <Ionicons
            name={icon as any}
            size={15}
            color={editable ? C.primary : C.muted}
            style={{ marginLeft: 12 }}
          />
        ) : null}
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
        {!editable ? (
          <Ionicons
            name="lock-closed-outline"
            size={13}
            color={C.border}
            style={{ marginRight: 12 }}
          />
        ) : null}
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
          bold && { fontWeight: "900" },
          { color: highlight ? C.primary : C.ink },
          muted && { color: C.muted },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

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
            {hasLocation ? locationLabel : "Required • Tap to open map"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={C.primary} />
      </TouchableOpacity>

      {hasLocation && distanceKm != null ? (
        <View style={dl.resultCard}>
          <View style={dl.resultRow}>
            <Ionicons name="location" size={14} color={C.primary} />
            <Text style={dl.resultLabel} numberOfLines={2}>
              {locationLabel}
            </Text>
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
              <Text style={[dl.metricValue, { color: C.primary }]}>₹{deliveryCost.toLocaleString()}</Text>
              <Text style={dl.metricLabel}>Delivery cost</Text>
            </View>
          </View>

          <Text style={dl.note}>
            Distance estimated via road factor 1.3. Final charge confirmed at delivery.
          </Text>
        </View>
      ) : hasLocation && distanceKm == null ? (
        <View style={dl.resultCard}>
          <View style={dl.resultRow}>
            <Ionicons name="location" size={14} color={C.primary} />
            <Text style={dl.resultLabel} numberOfLines={2}>
              {locationLabel}
            </Text>
          </View>

          <View style={dl.infoBadge}>
            <Ionicons name="information-circle-outline" size={13} color={C.gold} />
            <Text style={dl.infoBadgeText}>
              Delivery cost will be calculated by the service provider.
            </Text>
          </View>
        </View>
      ) : (
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
    const fetchAvailability = async () => {
      try {
        const res = await api.get(
          `https://agridas-latest.onrender.com/booking/availabilyStatus/${resourceId}`
        );
        const bookings: { startDate: string; endDate: string }[] = res.data ?? [];
        const expanded = new Set<string>();

        const p = (n: number) => String(n).padStart(2, "0");
        const toStr = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

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
        console.log("Availability fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [resourceId]);

  const p = (n: number) => String(n).padStart(2, "0");
  const toStr = (date: Date) => `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;

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
      Alert.alert("Unavailable", "These dates overlap with existing bookings. Please choose another slot.");
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
      <Text style={{ fontSize: 14, fontWeight: "800", marginBottom: 10 }}>Select Start Date</Text>

      {loading ? (
        <ActivityIndicator color={C.primary} />
      ) : (
        <>
          <View style={bs.calNav}>
            <TouchableOpacity
              onPress={() =>
                setViewMonth((m) => (m === 0 ? (setViewYear((y) => y - 1), 11) : m - 1))
              }
            >
              <Text>Prev</Text>
            </TouchableOpacity>

            <Text style={{ fontWeight: "800" }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setViewMonth((m) => (m === 11 ? (setViewYear((y) => y + 1), 0) : m + 1))
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
                    inRange && !isOccupied && { backgroundColor: "#A8D5B5", borderRadius: 8 },
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
            <Text style={{ color: "green" }}>Available</Text>
            <Text style={{ color: "red" }}>Booked</Text>
            <Text style={{ color: "#507f1e" }}>Selected Range</Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function BookingScreen() {
  const params = useLocalSearchParams<{
    resourceId?: string;
    machineId?: string;
    bookingType?: BookingType;
  }>();

  const resourceId = (params.resourceId ?? params.machineId)!;
  const bookingType: BookingType = (params.bookingType ?? "machine") as BookingType;
  const isMachine = bookingType === "machine";

  const router = useRouter();

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

  useEffect(() => {
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
        console.log("Resource load error", e);
        showAlert("Error", "Failed to load details. Please go back and try again.");
      } finally {
        setLoadingResource(false);
      }
    };

    loadResource();
  }, [resourceId, isMachine]);

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

    const providerCoords = extractCoords(resource, bookingType);
    if (!providerCoords) {
      setDistanceKm(null);
      return;
    }

    setDistanceKm(haversineKm(deliveryCoords, providerCoords));
  }, [deliveryCoords, resource, bookingType]);

  const pricePerDay: number = parseFloat(resource?.pricePerDay ?? 0) || 0;
  const deliveryPerKm: number = resource?.deliveryChargePerKm ?? 0;
  const maxAcrePerDay: number = resource?.maxAcreCoverage ?? 1;
  const numberOfWorkers: number = resource?.numberOfWorkers ?? 1;
  const acreNum = parseFloat(acre || "0");

  function computeDaysNeeded(): number {
    if (isMachine) return Math.max(1, Math.ceil(acreNum / maxAcrePerDay));
    return Math.max(1, parseInt(manualDays, 10) || 1);
  }

  const daysNeeded = computeDaysNeeded();
  const durationLabel = daysNeeded === 1 ? "1 day" : `${daysNeeded} days`;

  const serviceCost = isMachine
    ? pricePerDay * daysNeeded
    : pricePerDay * numberOfWorkers * daysNeeded;

  const deliveryCost = distanceKm != null ? Math.round(deliveryPerKm * distanceKm) : 0;
  const totalCost = serviceCost + deliveryCost;

  const handleMapConfirm = (coords: LatLng, label: string) => {
    setDeliveryCoords(coords);
    setDeliveryLabel(label);
    setMapVisible(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return showAlert("Missing Info", "Please enter your full name.");
    if (!address.trim()) return showAlert("Missing Info", "Please enter your address.");
    if (!phone.trim() || phone.length !== 10) {
      return showAlert("Missing Info", "Please enter a valid 10-digit phone number.");
    }
    if (!acreNum || acreNum <= 0) {
      return showAlert("Missing Info", "Please enter a valid acreage.");
    }
    if (!isMachine && (!parseInt(manualDays, 10) || parseInt(manualDays, 10) < 1)) {
      return showAlert("Missing Info", "Please enter a valid number of days.");
    }
    if (!startDate) return showAlert("Missing Info", "Please select a start date from the calendar.");
    if (!deliveryCoords) return showAlert("Missing Info", "Please set a delivery location on the map.");

    try {
      setSubmitting(true);

      const startISO = new Date(`${startDate}T09:00:00.000Z`).toISOString();
      const endISO = new Date(`${endDate}T18:00:00.000Z`).toISOString();

      const resourceName = isMachine
        ? resource?.name ?? "Machine"
        : resource?.name ?? `Labour - ${resource?.skills?.slice(0, 2).join(", ") ?? "Provider"}`;

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

      await api.post(`https://agridas-latest.onrender.com/booking/create`, payload);

      Alert.alert(
        "Booking Requested!",
        "Your booking request has been sent. The owner will confirm shortly.",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showAlert(
        "Booking Failed",
        Array.isArray(msg) ? msg.join(", ") : msg ?? "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingResource) {
    return (
      <View style={bs.loadingScreen}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={bs.loadingText}>Loading {isMachine ? "machine" : "labour"} details</Text>
      </View>
    );
  }

  if (!resource) return null;

  const summaryTitle = isMachine
    ? resource.name
    : resource.name || `Labour - ${resource.skills?.slice(0, 2).join(", ") ?? ""}`;

  const summaryLocation = `${resource.taluka ?? ""}, ${resource.district ?? ""}`;

  return (
    <View style={bs.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={bs.topBar}>
        <TouchableOpacity style={bs.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={bs.topTitle}>Book {isMachine ? "Machine" : "Labour"}</Text>
          <Text style={bs.topSubtitle} numberOfLines={1}>
            {summaryTitle}
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={bs.summaryCard}>
            <View style={bs.summaryLeft}>
              <Text style={bs.summaryName} numberOfLines={1}>
                {summaryTitle}
              </Text>

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
                    {Array.isArray(resource.machineType) &&
                      resource.machineType.map((item: string, idx: number) => (
                        <View style={bs.summaryChip} key={`${item}-${idx}`}>
                          <Text style={bs.summaryChipText}>{item}</Text>
                        </View>
                      ))}
                  </>
                ) : (
                  <>
                    <View style={bs.summaryChip}>
                      <Text style={bs.summaryChipText}>{numberOfWorkers} workers</Text>
                    </View>
                    <View style={bs.summaryChip}>
                      <Text style={bs.summaryChipText}>₹{resource.deliveryChargePerKm}/km delivery</Text>
                    </View>
                    {Array.isArray(resource.skills) &&
                      resource.skills.map((item: string, idx: number) => (
                        <View style={bs.summaryChip} key={`${item}-${idx}`}>
                          <Text style={bs.summaryChipText}>{item}</Text>
                        </View>
                      ))}
                  </>
                )}
              </View>
            </View>

            <View style={bs.summaryRight}>
              <Text style={bs.summaryPriceLabel}>per day</Text>
              <Text style={bs.summaryPrice}>₹{pricePerDay.toLocaleString()}</Text>
              {!isMachine && (
                <Text style={bs.summaryPriceSubLabel}>{numberOfWorkers} workers</Text>
              )}
            </View>
          </View>

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

          <View style={bs.card}>
            <SectionHeader
              icon="leaf-outline"
              label={isMachine ? "Field Details" : "Service Details"}
            />

            <Field
              label="Total Acreage"
              value={acre}
              onChangeText={setAcre}
              placeholder="Number of acres"
              keyboardType="numeric"
              icon="expand-outline"
            />

            {isMachine ? (
              <View style={bs.infoBox}>
                <Ionicons name="information-circle-outline" size={13} color={C.primary} />
                <Text style={bs.infoBoxText}>
                  This machine covers up to{" "}
                  <Text style={{ fontWeight: "800" }}>{resource.maxAcreCoverage} acres/day</Text>.{" "}
                  {acreNum > 0
                    ? `For ${acreNum} acres, you'll need ${durationLabel}.`
                    : null}
                </Text>
              </View>
            ) : (
              <>
                <Field
                  label="Number of Days"
                  value={manualDays}
                  onChangeText={setManualDays}
                  placeholder="How many days needed"
                  keyboardType="numeric"
                  icon="time-outline"
                />
                <View style={bs.infoBox}>
                  <Ionicons name="information-circle-outline" size={13} color={C.primary} />
                  <Text style={bs.infoBoxText}>
                    <Text style={{ fontWeight: "800" }}>{numberOfWorkers} workers</Text> × ₹
                    {pricePerDay}/day × {daysNeeded} {daysNeeded === 1 ? "day" : "days"} ={" "}
                    <Text style={{ fontWeight: "800", color: C.primary }}>
                      ₹{serviceCost.toLocaleString()}
                    </Text>
                  </Text>
                </View>
              </>
            )}
          </View>

          {acreNum > 0 && (
            <AvailabilityPicker
              resourceId={resourceId}
              selectedDate={startDate}
              endDate={endDate}
              daysNeeded={daysNeeded}
              onSelectDate={setStartDate}
            />
          )}

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
                    ? `${acreNum} acres • ${resource.maxAcreCoverage} acres/day`
                    : `${numberOfWorkers} workers • ${daysNeeded} day${daysNeeded > 1 ? "s" : ""}`}
                </Text>
              </View>
            </View>
          )}

          <DeliveryLocationCard
            distanceKm={distanceKm}
            deliveryCost={deliveryCost}
            deliveryPerKm={deliveryPerKm}
            locationLabel={deliveryLabel}
            hasLocation={!!deliveryCoords}
            onOpenMap={() => setMapVisible(true)}
          />

          <View style={bs.card}>
            <SectionHeader icon="receipt-outline" label="Cost Summary" />

            {isMachine ? (
              <CostRow
                label={`Service ₹${pricePerDay.toLocaleString()}/day × ${daysNeeded} day${
                  daysNeeded > 1 ? "s" : ""
                }`}
                value={`₹${serviceCost.toLocaleString()}`}
              />
            ) : (
              <CostRow
                label={`Service ₹${pricePerDay.toLocaleString()}/day × ${numberOfWorkers} workers × ${daysNeeded} day${
                  daysNeeded > 1 ? "s" : ""
                }`}
                value={`₹${serviceCost.toLocaleString()}`}
              />
            )}

            <CostRow
              label={
                distanceKm != null
                  ? `Delivery ₹${deliveryPerKm}/km × ${distanceKm} km`
                  : deliveryCoords
                  ? "Delivery • To be confirmed by provider"
                  : "Delivery • Select location to calculate"
              }
              value={
                distanceKm != null
                  ? `₹${deliveryCost.toLocaleString()}`
                  : deliveryCoords
                  ? "TBD"
                  : "TBD"
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
                Delivery distance estimated via road factor 1.3. Final charge confirmed at delivery.
              </Text>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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

      <MapPickerModal
        visible={mapVisible}
        onConfirm={handleMapConfirm}
        onClose={() => setMapVisible(false)}
      />
    </View>
  );
}

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
  topSubtitle: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 1 },
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
  summaryName: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 5 },
  summaryLoc: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  summaryLocText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  summaryChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
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
  summaryPriceSubLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginTop: 2,
  },
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
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: C.primaryFaint,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: C.primary,
    fontWeight: "500",
    lineHeight: 18,
  },
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
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  calCellAvail: { backgroundColor: C.primaryFaint },
  calCellOccupied: { backgroundColor: C.dangerFaint },
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
  dateRangeItem: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
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
  dateRangeValue: { fontSize: 13, fontWeight: "800", color: C.ink, marginTop: 1 },
  dateRangeTime: { fontSize: 11, color: C.muted, fontWeight: "600", marginTop: 1 },
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
  bottomLabel: { fontSize: 11, color: C.muted, fontWeight: "600", marginBottom: 1 },
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

const dl = StyleSheet.create({
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.primaryFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 12,
  },
  mapBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  mapBtnTitle: { fontSize: 13, fontWeight: "700", color: C.ink },
  mapBtnSub: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 2 },
  resultCard: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 12 },
  resultLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: C.ink, lineHeight: 19 },
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
  metricValue: { fontSize: 15, fontWeight: "900", color: C.ink, marginBottom: 2 },
  metricLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },
  metricDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  note: { fontSize: 11, color: C.muted, lineHeight: 16 },
  infoBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F59E0B33",
  },
  infoBadgeText: { flex: 1, fontSize: 12, color: "#92400E", fontWeight: "500", lineHeight: 17 },
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