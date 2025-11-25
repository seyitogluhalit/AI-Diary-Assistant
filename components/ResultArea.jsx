// components/ResultArea.jsx
import React from "react";
import { View, Animated, Dimensions } from "react-native";
import AnimatedTypewriterText from "./AnimatedTypewriterText";

const { width, height } = Dimensions.get("window");

export default function ResultArea({ sentiment, advice, theme, imgAnim, styles }) {
  if (!sentiment) return null;

  return (
    <View
      style={{
        alignItems: "center",
        marginBottom: height * 0.015,
        marginTop: height * 0.01,
        width,
      }}
    >
      {advice ? (
        <View
          style={[
            styles.adviceBubble,
            {
              width: width * 0.8, // ✅ SABİT GENİŞLİK -> balon yazdıkça sağa sola büyümüyor
              paddingVertical: height * 0.025,
              paddingHorizontal: width * 0.07,
              borderRadius: width * 0.08,
              marginTop: height * 0.015,
              marginBottom: height * 0.01,
              marginHorizontal: width * 0.06,
            },
          ]}
        >
          <AnimatedTypewriterText
            text={advice}
            speed={35}
            style={[
              styles.resultAdviceMinimal,
              {
                fontSize: width * 0.035,
                paddingHorizontal: 0, // padding balona ait, yazıya değil
              },
            ]}
          />

          <View
            style={[
              styles.adviceBubbleTail,
              {
                left: width * 0.13,
                bottom: -height * 0.035,
                width: width * 0.11,
                height: height * 0.04,
                borderBottomLeftRadius: width * 0.055,
              },
            ]}
          />
        </View>
      ) : null}

      <Animated.Image
        source={theme.image}
        style={{
          width: 240,
          height: 240,
          borderRadius: 120,
          opacity: imgAnim,
          transform: [
            {
              scale: imgAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        }}
        resizeMode="cover"
      />
    </View>
  );
}
