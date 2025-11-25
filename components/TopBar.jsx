import React from "react";
import { View, TouchableOpacity, Text, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");
const NEUTRAL_IMG = require("../assets/images/blue.jpg");

export default function TopBar({ onOpenHistory, styles }) {
  return (
    <View style={[styles.topBar, { width, marginTop: height * 0.04 }]}>
      <View
        style={[
          styles.logoCircle,
          {
            width: width * 0.09,
            height: width * 0.09,
            borderRadius: width * 0.045,
          },
        ]}
      >
        <Image
          source={NEUTRAL_IMG}
          style={{
            marginTop: height * 0.002,
            width: width * 0.14,
            height: width * 0.14,
            borderRadius: width * 0.12,
            resizeMode: "cover",
          }}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.historyIconButton,
          {
            paddingVertical: height * 0.012,
            paddingHorizontal: width * 0.04,
            borderRadius: width * 0.2,
          },
        ]}
        onPress={onOpenHistory}
      >
        <MaterialIcons name="history" size={width * 0.06} color="#374151" />
        <Text
          style={[
            styles.historyIconText,
            { fontSize: width * 0.032, marginLeft: width * 0.01 },
          ]}
        >
          Geçmiş
        </Text>
      </TouchableOpacity>
    </View>
  );
}