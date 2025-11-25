import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

export default function InputArea({
  text,
  loading,
  error,
  recording,
  dispatch,
  setText,
  handleAnalyze,
  startRecording,
  stopRecording,
  styles,
}) {
  return (
    <View style={[styles.inputMinimal, { width: width * 0.95, marginTop: height * 0.012 }]}>
      <Text style={[styles.inputLabelMinimal, { fontSize: width * 0.038 }]}>Günlüğünü yaz</Text>
      <Text style={[styles.inputHintMinimal, { fontSize: width * 0.03 }]}>
        Nasıl hissediyorsun? Bugün seni en çok ne etkiledi?
      </Text>
      <TextInput
        value={text}
        onChangeText={(t) => dispatch(setText(t))}
        placeholder="Örn: Bugün biraz yorgunum ama umutluyum."
        placeholderTextColor="#6b7280"
        style={[
          styles.inputMinimalBox,
          {
            width: width * 0.9,
            minHeight: height * 0.09,
            maxHeight: height * 0.22,
            fontSize: width * 0.035,
          },
        ]}
        multiline
      />
      <View style={[styles.rowMinimal, { gap: width * 0.025 }]}>
        <TouchableOpacity
          style={[
            styles.buttonMinimal,
            styles.analyzeButtonMinimal,
            {
              paddingVertical: height * 0.014,
              borderRadius: width * 0.2,
            },
            loading && { opacity: 0.7, width: width * 0.42 },
          ]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#f9fafb" />
          ) : (
            <Text style={[styles.buttonTextMinimal, { fontSize: width * 0.035 }]}>Analiz Et</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.buttonMinimal,
            recording ? styles.stopButtonMinimal : styles.micButtonMinimal,
            {
              width: width * 0.42,
              paddingVertical: height * 0.014,
              borderRadius: width * 0.2,
            },
          ]}
          onPress={recording ? stopRecording : startRecording}
        >
          <Text style={[styles.buttonTextMinimal, { fontSize: width * 0.035 }]}>
            {recording ? "⏹️ Durdur" : "🎙️ Sesle Yaz"}
          </Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={[styles.errorMinimal, { fontSize: width * 0.032, marginHorizontal: width * 0.06 }]}>{error}</Text>
      ) : null}
    </View>
  );
}