// app/_layout.tsx
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { store } from "../store/store";        // <- kendi store'un
import Home from "../pages/Home";              // senin Home
import History from "../pages/History";        // senin History

export default function RootLayout() {
  const [screen, setScreen] = useState<"home" | "history">("home");

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <View style={styles.container}>
          {screen === "home" ? (
            <Home onOpenHistory={() => setScreen("history")} />
          ) : (
            <History onBack={() => setScreen("home")} />
          )}
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
