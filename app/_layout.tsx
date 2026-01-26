import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { getToken } from "@/services/authStorage";

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();

      if (token) {
        // only once
        setChecked(true);
      } else {
        setChecked(true);
      }
    };

    checkAuth();
  }, []);

  if (!checked) {
    return null; // or loader
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
