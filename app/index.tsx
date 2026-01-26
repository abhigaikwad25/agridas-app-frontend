import { Redirect } from "expo-router";

export default function Index() {
  const isLoggedIn = false; // later from token / storage

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/" />;
}
