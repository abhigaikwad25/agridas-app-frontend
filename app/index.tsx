// import { Redirect } from "expo-router";

// export default function Index() {
//   const isLoggedIn = false; // later from token / storage

//   if (!isLoggedIn) {
//     return <Redirect href="/login" />;
//   }

//   return <Redirect href="/" />;
// }



import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingIntro from "./onboarding/OnboardingIntro"; // your onboarding UI component

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkFlow = async () => {
      const onboardingSeen = await AsyncStorage.getItem("onboarding_seen");
      const token = await AsyncStorage.getItem("authToken");

      setSeenOnboarding(!!onboardingSeen);
      setIsLoggedIn(!!token);
      setLoading(false);
    };

    checkFlow();
  }, []);

  if (loading) return null;

  // 1️⃣ Show onboarding first
  if (!seenOnboarding) {
    return <OnboardingIntro />;
  }

  // 2️⃣ Go to login / register
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  // 3️⃣ Go to home
  return <Redirect href="/(tabs)" />;
}
