
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import OnboardingIntro from "./onboarding/OnboardingIntro"; // your onboarding UI component

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkFlow = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsLoggedIn(!!token);
      setLoading(false);
    };

    checkFlow();
  }, []);

  if (loading) return null;

  // 2️⃣ Go to start
  if (!isLoggedIn) {
     return <OnboardingIntro />;
  }

  // 3️⃣ Go to home
  return <Redirect href="/(tabs)" />;
}
