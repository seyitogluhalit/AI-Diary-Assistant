// components/AnimatedTypewriterText.jsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AnimatedTypewriterText({
  text,
  speed = 35,
  style,
}) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [typingDone, setTypingDone] = useState(false);
  const typingIntervalRef = useRef(null);

  // Metin değiştiğinde yeniden başlat
  useEffect(() => {
    setDisplayed("");
    setTypingDone(false);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    if (!text) return;

    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));

      // 🔥 Animasyon bitti
      if (index >= text.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setTypingDone(true); // cursor durması için işaret
      }
    }, speed);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [text, speed]);

  // Cursor blink — typing bittiyse dur
  useEffect(() => {
    if (typingDone) {
      setShowCursor(false);
      return;
    }

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [typingDone]);

  return (
    <View style={styles.row}>
      <Text style={style}>{displayed}</Text>

      {/* 🔥 Animasyon bitince cursor tamamen kayboluyor */}
      {!typingDone && showCursor && (
        <Text style={[style, styles.cursor]}>|</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  cursor: {
    opacity: 0.7,
    marginLeft: 2,
  },
});
