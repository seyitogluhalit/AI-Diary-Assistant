import React from "react";
import { View, Text, Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

export default function HeaderSection({ styles }) {
  return (
    <View
      style={[
        styles.headerSection,
        {
          width: width * 0.95,
          marginTop: height * 0.01,
          marginBottom: height * 0.015,
        },
      ]}
    >
      <Text style={[styles.title, { fontSize: width * 0.065 }]}>
        AI Günlük Asistanı
      </Text>
      <Text
        style={[
          styles.subtitle,
          { fontSize: width * 0.035, lineHeight: width * 0.05 },
        ]}
      >
        Günlük ruh halini yaz veya konuş; Hugging Face ile duygu analizi,
        Gemini ile özet ve öneri alsın.
      </Text>
    </View>
  );
}