// app/_layout.js
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Home from "../pages/Home";
import History from "../pages/History";

// 🔹 Redux Provider
import { Provider } from "react-redux";
import { store } from "../store/store";

// 🔹 SafeAreaProvider (react-native yerine buradan)
import { SafeAreaProvider } from "react-native-safe-area-context";

const RootLayout = () => {
  const [screen, setScreen] = useState("home"); // "home" | "history"

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
};

export default RootLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
