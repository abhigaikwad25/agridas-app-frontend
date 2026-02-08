import HomeScreen from "../../components/HomeScreen";
import { useFocusEffect } from "expo-router";
import { BackHandler, Alert } from "react-native";
import { useCallback } from "react";
export default function Home() {
    useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // stop default behavior
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [])
  );

  return <HomeScreen />;
}
