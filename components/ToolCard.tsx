import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Machine } from "../types/Machine";

interface Props {
  tool: Machine;
}

const ToolCard: React.FC<Props> = ({ tool }) => {
  const location = `${tool.taluka}, ${tool.district}, ${tool.state}`;

  return (
    <View style={styles.card}>
      {/* ORANGE IMAGE PART */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../assets/images/demo_tool.jpg")} // ✅ demo image
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* GREEN INFO PART */}
      <View style={styles.infoWrapper}>
        <Text style={styles.machineType}>{tool.machineType}</Text>

        <Text style={styles.location}>{location}</Text>

        <Text style={styles.price}>₹ {tool.pricePerDay} / day</Text>

        <Text style={styles.delivery}>
          Delivery: ₹ {tool.deliveryChargePerKm} / km
        </Text>

        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ToolCard;


const styles = StyleSheet.create({

  view:{
    
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#5f7f63",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    height: 110,
  },
  imageWrapper: {
    width: 90,
    backgroundColor: "#f5a623",
    height: "100%", 
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoWrapper: {
    flex: 1,
    padding: 12,
    position: "relative",
  },
  machineType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  location: {
    fontSize: 13,
    color: "#e6e6e6",
    marginVertical: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
  },
  delivery: {
    fontSize: 12,
    color: "#dcdcdc",
  },
  addBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#5f7f63",
  },
});
