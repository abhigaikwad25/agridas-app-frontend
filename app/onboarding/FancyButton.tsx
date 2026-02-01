import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function FancyButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{title} →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#2f6f4e",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 25,
    elevation: 5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
