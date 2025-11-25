// pages/Home.jsx
import React, { useRef, useEffect } from "react";
import {
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,             
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import TopBar from "../components/TopBar";
import HeaderSection from "../components/HeaderSection";
import InputArea from "../components/InputArea";
import ResultArea from "../components/ResultArea";
import {
  setText,
  setSentiment,
  setSummaryText,
  setAdvice,
  setLoading,
  setError,
} from "../store/diarySlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import { StyleSheet } from "react-native";


const NEUTRAL_IMG = require("../assets/images/blue.jpg");
const POSITIVE_IMG = require("../assets/images/green.png");
const NEGATIVE_IMG = require("../assets/images/pink.png");


const HF_API_KEY = "YOUR_HF_API_KEY_HERE";
const ASSEMBLY_API_KEY = "YOUR_ASSEMBLYAI_API_KEY_HERE";
const GEMINI_API_KEY   = "YOUR_GEMINI_API_KEY_HERE";



const GEMINI_MODEL = "gemini-2.0-flash";

const HF_SENTIMENT_URL =
  "https://router.huggingface.co/hf-inference/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english";

const { width, height } = Dimensions.get("window");


function formatConfidence(score) {
  let p = score * 100;
  if (p > 99.9) p = 99.9;
  if (p < 0) p = 0;
  return p.toFixed(1);
}


async function analyzeSentiment(text) {
  const response = await fetch(HF_SENTIMENT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.log("Sentiment error body:", errText);
    throw new Error(`Sentiment HTTP ${response.status}: ${errText}`);
  }

  const result = await response.json();
  let predictions;

  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) {
      predictions = result[0];
    } else {
      predictions = result;
    }
  } else {
    throw new Error("Beklenmeyen sentiment response formatı");
  }

  const best = predictions.reduce((max, cur) =>
    cur.score > max.score ? cur : max
  );

  return best; 
}


function normalizeSentiment(best) {
  let label = best.label; 
  const score = best.score;


  if (score < 0.6) {
    label = "NEUTRAL";
  }

  return { label, score };
}


function mapLabel(label) {
  if (label === "POSITIVE") {
    return { tr: "Pozitif", emoji: "🙂", color: "#198754" };
  }
  if (label === "NEGATIVE") {
    return { tr: "Negatif", emoji: "☹️", color: "#d32f2f" };
  }
  return { tr: "Nötr", emoji: "😐", color: "#374151" };
}


function mapTheme(label) {
  if (label === "POSITIVE") {
    return {
      bgColor: "#c7e7d9", 
      image: POSITIVE_IMG,
    };
  }
  if (label === "NEGATIVE") {
    return {
      bgColor: "#ffd1ea",
      image: NEGATIVE_IMG,
    };
  }
 
  return {
    bgColor: "#c9d8ee", 
    image: NEUTRAL_IMG,
  };
}


async function analyzeWithGemini(text, label) {
  const prompt = `
Aşağıdaki metin bir günlük kaydıdır. Kullanıcının gün içindeki duygularını yansıtıyor.

1) En fazla 1-2 cümlelik kısa ve sade bir ÖZET yaz.
2) Ayrı bir satırda "Öneri:" ile başlayan, kısa ve samimi bir öneri yaz.
3) Sadece şu formatta dön:

Özet: ...
Öneri: ...

Metin: "${text}"
Duygu etiketi: ${label}
`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const full =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    let summary = "";
    let adviceText = "";

    const lines = full.split("\n").map((l) => l.trim());
    for (const line of lines) {
      if (line.toLowerCase().startsWith("özet:")) {
        summary = line.substring(5).trim();
      } else if (
        line.toLowerCase().startsWith("öneri:") ||
        line.toLowerCase().startsWith("onerı:")
      ) {
        adviceText = line.substring(6).trim();
      }
    }

    if (!summary && full) {
      summary = full;
    }

    return { summary, adviceText };
  } catch (gemErr) {
    console.log("Gemini hata:", gemErr.response?.data || gemErr.message);
    return { summary: "", adviceText: "" };
  }
}

const STORAGE_KEY = "@diary_entries";

export default function Home({ onOpenHistory }) {
  const dispatch = useDispatch();
  const { text, sentiment, summaryText, advice, loading, error } = useSelector(
    (state) => state.diary
  );


  const [recording, setRecording] = React.useState(null);


  const bgAnim = useRef(new Animated.Value(0)).current;
  const imgAnim = useRef(new Animated.Value(0)).current;


  const saveEntry = async (entry) => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const prev = json ? JSON.parse(json) : [];
      const newEntries = [entry, ...prev];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (e) {
      console.log("Kaydedilemedi:", e);
    }
  };


  const runAnalysis = async (inputText) => {
    if (!inputText.trim()) return;

    dispatch(setLoading(true));
    dispatch(setError(""));
    dispatch(setSentiment(null));
    dispatch(setSummaryText(""));
    dispatch(setAdvice(""));

    try {
    
      const rawSentiment = await analyzeSentiment(inputText);
      const norm = normalizeSentiment(rawSentiment);

    
      const { summary, adviceText } = await analyzeWithGemini(
        inputText,
        norm.label
      );

      dispatch(setSentiment(norm));
      dispatch(setSummaryText(summary));
      dispatch(setAdvice(adviceText));

      const now = new Date();
      const entry = {
        id: now.getTime().toString(),
        text: inputText,
        label: norm.label,
        score: norm.score,
        summary,
        advice: adviceText,
        createdAt: now.toISOString(),
      };

      await saveEntry(entry);
    } catch (e) {
      console.log(e);
      dispatch(
        setError(
          "Bir hata oluştu. Hugging Face / Gemini anahtarlarını ve internet bağlantını kontrol et."
        )
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAnalyze = async () => {
    await runAnalysis(text);
  };

 
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("İzin Gerekli", "Ses kaydı izni verilmedi.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

  
      setRecording(recording);
    } catch (err) {
      Alert.alert("Hata", "Kayıt başlatılamadı.");
      console.error(err);
    }
  };


  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log(" Kayıt URI:", uri);

      setRecording(null);

      if (uri) await transcribeAudio(uri);
    } catch (err) {
      Alert.alert("Hata", "Kayıt durdurulamadı.");
      console.error(err);
    }
  };


  const transcribeAudio = async (uri) => {
    dispatch(setLoading(true));
    dispatch(setError(""));
    try {
      const uploadRes = await FileSystem.uploadAsync(
        "https://api.assemblyai.com/v2/upload",
        uri,
        {
          httpMethod: "POST",
          headers: {
            authorization: ASSEMBLY_API_KEY,
            "content-type": "application/octet-stream",
          },
        }
      );

      const uploadUrl = JSON.parse(uploadRes.body).upload_url;
      console.log("AssemblyAI Upload URL:", uploadUrl);

      const transcriptRes = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        { audio_url: uploadUrl, language_code: "tr" },
        { headers: { authorization: ASSEMBLY_API_KEY } }
      );

      const transcriptId = transcriptRes.data.id;
      console.log("Transcript ID:", transcriptId);

      let transcriptText = "";
      // polling
      while (true) {
        const pollingRes = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          { headers: { authorization: ASSEMBLY_API_KEY } }
        );

        if (pollingRes.data.status === "completed") {
          transcriptText = pollingRes.data.text;
          break;
        } else if (pollingRes.data.status === "error") {
          throw new Error(pollingRes.data.error || "Transkripsiyon hatası");
        }
        await new Promise((res) => setTimeout(res, 2000));
      }

      console.log("Transkript:", transcriptText);
      dispatch(setText(transcriptText));
      Alert.alert(
        "Ses Metne Çevrildi",
        "Metni düzenleyip 'Analiz Et'e basabilirsin."
      );
    } catch (err) {
      Alert.alert("Hata", "Transkripsiyon başarısız.");
      console.error(
        "AssemblyAI Hatası:",
        JSON.stringify(err.response?.data || err.message)
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  // 🔹 ŞU ANKİ DUYGUYA GÖRE TEMA
  const currentLabel = sentiment?.label || "NEUTRAL";
  const theme = mapTheme(currentLabel);

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue:
        currentLabel === "POSITIVE" ? 0 : currentLabel === "NEGATIVE" ? 1 : 2,
      duration: 600,
      useNativeDriver: false,
    }).start();

    imgAnim.setValue(0);
    Animated.timing(imgAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [currentLabel, theme.image]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [theme.bgColor, theme.bgColor, theme.bgColor],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgColor }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bgColor }}
        contentContainerStyle={{
          minHeight: height,
          backgroundColor: theme.bgColor,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TopBar onOpenHistory={onOpenHistory} styles={styles} />
        <HeaderSection styles={styles} />
        <InputArea
          text={text}
          loading={loading}
          error={error}
          recording={recording}
          dispatch={dispatch}
          setText={setText}
          handleAnalyze={handleAnalyze}
          startRecording={startRecording}
          stopRecording={stopRecording}
          styles={styles}
        />
        <ResultArea
          sentiment={sentiment}
          advice={advice}
          theme={theme}
          imgAnim={imgAnim}
          styles={styles}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  topBar: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e0e7ef",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#374151", 
    fontWeight: "700",
    fontSize: 14,
  },
  historyIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#e0e7ef",
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconText: {
    color: "#374151", 
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  headerSection: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#22223b", 
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#374151", 
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  moodImage: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 5, 
    borderColor: "#444", 
    opacity: 0.98,
    marginBottom: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  resultMinimal: {
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 0,
    backgroundColor: "transparent",
  },
  resultEmojiMinimal: {
    fontSize: 44,
    marginBottom: 2,
  },
  resultChipMinimal: {
    fontSize: 13,
    color: "#198754",
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  resultTextMinimal: {
    color: "#22223b", 
    fontSize: 15,
    marginBottom: 2,
    fontWeight: "600",
  },
  resultSummaryMinimal: {
    color: "#374151", 
    fontSize: 14,
    marginTop: 2,
    textAlign: "center",
  },
  resultAdviceMinimal: {
    color: "#d97706", 
    fontSize: 14,
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  inputMinimal: {
    marginHorizontal: 0,
    marginTop: 10,
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 0,
  },
  inputLabelMinimal: {
    color: "#22223b", 
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
    marginLeft: 2,
  },
  inputHintMinimal: {
    color: "#374151", 
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputMinimalBox: {
    minHeight: 80,
    maxHeight: 180,
    borderRadius: 12,
    padding: 12,
    color: "#22223b", 
    backgroundColor: "#e0e7ef", 
    borderWidth: 0,
    fontSize: 14,
    marginBottom: 12,
    marginTop: 2,
  },
  rowMinimal: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 0,
  },
  buttonMinimal: {
    flex: 1,
    paddingVertical: 10, 
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    elevation: 2,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  analyzeButtonMinimal: {
    backgroundColor: "#6366f1",
    borderWidth: 0,
  },
  micButtonMinimal: {
    backgroundColor: "#22c55e",
    borderWidth: 0,
  },
  stopButtonMinimal: {
    backgroundColor: "#ef4444",
    borderWidth: 0,
  },
  buttonTextMinimal: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
    textShadowColor: "#6366f1",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorMinimal: {
    color: "#d32f2f", 
    marginTop: 10,
    marginHorizontal: 24,
    textAlign: "center",
    fontSize: 13,
  },
  adviceBubble: {
    backgroundColor: "#fff",
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#444", 
    paddingVertical: 20,
    paddingHorizontal: 28,
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 24,
    position: "relative",
    minWidth: 180,
    maxWidth: 340,
    alignSelf: "center",
    shadowColor: "#444", 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  adviceBubbleTail: {
    position: "absolute",
    left: 48,
    bottom: -28,
    width: 40,
    height: 32,
    backgroundColor: "transparent",
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#444",
    borderBottomLeftRadius: 22,
    transform: [{ rotate: "-18deg" }],
    shadowColor: "#444", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  moodImage: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 5,
    borderColor: "#444", 
    opacity: 0.98,
    marginBottom: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});
