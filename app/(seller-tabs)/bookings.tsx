import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BookingsScreen() {
  const [selectedTab, setSelectedTab] = useState("request");

  const renderContent = () => {
    switch (selectedTab) {
      case "request":
        return <Text>Request Booking Content</Text>;
      case "ongoing":
        return <Text>Ongoing Bookings Content</Text>;
      case "completed":
        return <Text>Completed Bookings Content</Text>;
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bookings Received</Text>


      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: "request", label: "Request Booking" },
          { key: "ongoing", label: "Ongoing Bookings" },
          { key: "completed", label: "Completed Bookings" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7A1F3D",
    marginBottom: 16,
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
    paddingVertical: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#4A0E23",
  },
  tabText: {
    fontSize: 13,
    color: "#555",
  },
  activeTabText: {
    color: "#4A0E23",
    fontWeight: "bold",
  },
  contentContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FADADD",
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
});
