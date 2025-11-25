import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  text: "",
  sentiment: null,
  summaryText: "",
  advice: "",
  loading: false,
  error: "",
  recording: null,
};

const diarySlice = createSlice({
  name: "diary",
  initialState,
  reducers: {
    setText: (state, action) => { state.text = action.payload; },
    setSentiment: (state, action) => { state.sentiment = action.payload; },
    setSummaryText: (state, action) => { state.summaryText = action.payload; },
    setAdvice: (state, action) => { state.advice = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    setRecording: (state, action) => { state.recording = action.payload; },
    resetDiary: (state) => {
      state.text = "";
      state.sentiment = null;
      state.summaryText = "";
      state.advice = "";
      state.loading = false;
      state.error = "";
      state.recording = null;
    },
  },
});

export const {
  setText,
  setSentiment,
  setSummaryText,
  setAdvice,
  setLoading,
  setError,
  setRecording,
  resetDiary,
} = diarySlice.actions;

export default diarySlice.reducer;