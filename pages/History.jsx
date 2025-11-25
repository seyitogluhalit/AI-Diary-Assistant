import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@diary_entries";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 180;
const IMAGE_SIZE = 100; 
const MAX_SCROLL = 120; 

const BLUE_IMG = require("../assets/images/blue.jpg");

function formatConfidence(score) {
  let p = score * 100;
  if (p > 99.9) p = 99.9;
  if (p < 0) p = 0;
  return p.toFixed(1);
}

function mapLabel(label) {
  if (label === "POSITIVE") {
    return { tr: "Pozitif", emoji: "🙂", color: "#22c55e" };
  }
  if (label === "NEGATIVE") {
    return { tr: "Negatif", emoji: "☹️", color: "#ef4444" };
  }
  return { tr: "Nötr", emoji: "😐", color: "#a3a3a3" };
}

export default function History({ onBack }) {
  const [entries, setEntries] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          setEntries(JSON.parse(json));
        }
      } catch (e) {
        console.log("Geçmiş okunamadı:", e);
      }
    };
    loadEntries();
  }, []);

  // SADECE YANA KAYAN + KÜÇÜLEN RESİM
  const translateImageX = scrollY.interpolate({
    inputRange: [0, MAX_SCROLL],
    outputRange: [0, -width / 2 + IMAGE_SIZE / 2 + 16], // sola kayma
    extrapolate: "clamp",
  });

  const scaleImage = scrollY.interpolate({
    inputRange: [0, MAX_SCROLL],
    outputRange: [1, 0.6], // biraz küçül
    extrapolate: "clamp",
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, MAX_SCROLL],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const renderItem = ({ item }) => {
    // HEADER
    if (item.type === "header") {
      return (
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>

            <Animated.Text
              style={[styles.headerTitle, { opacity: headerTitleOpacity }]}
            >
              Geçmiş Analizler
            </Animated.Text>

            <View style={{ width: 60 }} />
          </View>

          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [
                  { translateX: translateImageX },
                  { scale: scaleImage },
                ],
              },
            ]}
          >
            <Image source={BLUE_IMG} style={styles.img} resizeMode="cover" />
          </Animated.View>
        </View>
      );
    }

    // Hiç kayıt yoksa boş mesaj kartı
    if (item.type === "empty") {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz kayıt yok.</Text>
        </View>
      );
    }

    // NORMAL KART
    const mapped = mapLabel(item.label);
    return (
      <View style={[styles.card, { borderLeftColor: mapped.color }]}>
        <Text style={styles.cardEmoji}>{mapped.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>
            {mapped.tr} ({formatConfidence(item.score)}%)
          </Text>
          {item.summary ? (
            <Text style={styles.cardSummary}>{item.summary}</Text>
          ) : null}
          <Text style={styles.cardText}>{item.text}</Text>
          {item.advice ? (
            <Text style={styles.cardAdvice}>Öneri: {item.advice}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  // FlatList datası: önce header, sonra kayıtlar / yoksa boş item
  const data =
    entries.length === 0
      ? [{ type: "header", id: "HEADER" }, { type: "empty", id: "EMPTY" }]
      : [{ type: "header", id: "HEADER" }, ...entries];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.type}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          paddingBottom: 24,
          backgroundColor: "#020617",
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  // HEADER
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: "#020617",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    paddingTop: 40, // Eskisi: 16 — üstten daha fazla boşluk
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    textAlign: "center",
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#1f2937",
  },
  backText: {
    color: "#e5e7eb",
    fontSize: 17,
  },
  imageWrapper: {
    alignSelf: "center",
    height: IMAGE_SIZE,
    width: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    backgroundColor: "#020617",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#38bdf8",
  },
  img: {
    height: "100%",
    width: "100%",
  },

  // BOŞ MESAJ
  emptyContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
  },

  // KARTLAR
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#020617",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  cardEmoji: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  cardLabel: {
    color: "#e5e7eb",
    fontWeight: "600",
    marginBottom: 2,
  },
  cardSummary: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 2,
  },
  cardText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  cardAdvice: {
    color: "#facc15",
    fontSize: 12,
    marginTop: 4,
  },
});
