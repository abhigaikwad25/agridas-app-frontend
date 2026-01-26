import { removeToken } from "@/services/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
};

const LogoutItem = ({ icon, label, danger }: Props) => {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken()
    router.replace("/login"); // index.tsx
  };

  return (
    <TouchableOpacity
      style={[styles.item, danger && styles.danger]}
      onPress={handleLogout}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#E53935" : "#333"}
      />
      <Text style={[styles.label, danger && styles.dangerText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default LogoutItem;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginVertical: 6,
  },
  label: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  danger: {
    backgroundColor: "#FDECEA",
  },
  dangerText: {
    color: "#E53935",
  },
});
