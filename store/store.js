import { configureStore } from "@reduxjs/toolkit";
import diaryReducer from "./diarySlice";

export const store = configureStore({
  reducer: {
    diary: diaryReducer,
  },
});