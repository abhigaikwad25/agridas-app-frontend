import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BookingsScreen() {
  const [selectedTab, setSelectedTab] = useState("request");

  const tabs = [
    { key: "request", label: "Requests" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
  ];

  const renderContent = () => {
    switch (selectedTab) {
      case "request":
        return <Text style={styles.contentText}>Request Booking Content</Text>;
      case "ongoing":
        return <Text style={styles.contentText}>Ongoing Bookings Content</Text>;
      case "completed":
        return <Text style={styles.contentText}>Completed Bookings Content</Text>;
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Bookings Received</Text>
        <Text style={styles.headerSubtitle}>
          Manage all your machine bookings
        </Text>
      </View>

      {/* TABS (Scrollable) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* CONTENT CARD */}
      <View style={styles.contentContainer}>{renderContent()}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFF7F8",
    paddingTop: 40,
  },

  /* HEADER */
  header: {
    backgroundColor: "#7A1F3D",
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#FFD6E0",
    marginTop: 4,
    fontSize: 13,
  },

  /* TABS */
  tabsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FADADD",
  },

  activeTab: {
    backgroundColor: "#7A1F3D",
    borderColor: "#7A1F3D",
  },

  tabText: {
    fontSize: 14,
    color: "#7A1F3D",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* CONTENT */
  contentContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FADADD",
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
  },

  contentText: {
    fontSize: 16,
    color: "#4A0E23",
    fontWeight: "500",
  },
});