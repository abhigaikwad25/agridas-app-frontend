import LogoutItem from "@/components/Logout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header} />

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <Image
          source={require("../../assets/images/farmer.jpg")}
          style={styles.avatar}
        />
        <Text style={styles.name}>Akshat Tated</Text>
        <Text style={styles.sub}>AgriDas User</Text>
      </View>

      {/* OPTIONS */}
      <View style={styles.card}>
        <Item icon="construct-outline" label="Switch to Machine Seller Mode" onPress={() =>
          router.push({
            pathname: "/(seller-tabs)",
          })
        } />
         <Item icon="storefront-outline" label="Switch to Labor Provider Mode" onPress={() =>
          router.push({
            pathname: "/(labour-tabs)",
          })
        } />
        
        <Item icon="wallet-outline" label="My Expenses & Earnings" onPress={()=> 
        router.push({
            pathname: "/dashboardFarmer",
          })} />
        <Item icon="calendar-outline" label="My Bookings" onPress={""}/>
        <Item icon="create-outline" label="Edit Profile" onPress={()=>{
          router.push({
            pathname:"/editProfile"
          })
        }}/>
        <LogoutItem icon="log-out-outline" label="Logout" danger />
      </View>
    </ScrollView>
  );
}

function Item({ icon, label, danger = false , onPress }) {
  return (
    <TouchableOpacity style={styles.item}  onPress={onPress}>
      <Ionicons
        name={icon}
        size={24}
        color={danger ? "#DC2626" : "#1E7F3B"}
      />
      <Text style={[styles.itemText, danger && { color: "#DC2626" }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF7EF",
  },

  header: {
    height: 120,
    backgroundColor: "#1E7F3B",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -50,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  sub: {
    fontSize: 14,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 8,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,   // ⬆ bigger
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  itemText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    color: "#111827",
  },
});
