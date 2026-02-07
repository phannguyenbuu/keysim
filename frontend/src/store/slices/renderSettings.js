import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../api/client";

const DEFAULT_RENDER_SETTINGS = {
  lightIntensity: 1.0,
  brightness: 1.0,
  contrast: 1.0,
  hue: 0.0,
  saturation: 1.0,
  lightness: 1.0,
};

export const fetchRenderSettings = createAsyncThunk(
  "renderSettings/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/render-settings", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return rejectWithValue(errorData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return { ...DEFAULT_RENDER_SETTINGS, ...(data || {}) };
    } catch (error) {
      return rejectWithValue(error.message || "Fetch render settings failed");
    }
  }
);

export const renderSettingsSlice = createSlice({
  name: "renderSettings",
  initialState: {
    ...DEFAULT_RENDER_SETTINGS,
    loading: false,
  },
  reducers: {
    setRenderSettings: (state, action) => {
      const payload = action.payload || {};
      Object.keys(DEFAULT_RENDER_SETTINGS).forEach((key) => {
        if (typeof payload[key] !== "undefined") {
          state[key] = payload[key];
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRenderSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRenderSettings.fulfilled, (state, action) => {
        const payload = action.payload || {};
        Object.keys(DEFAULT_RENDER_SETTINGS).forEach((key) => {
          if (typeof payload[key] !== "undefined") {
            state[key] = payload[key];
          }
        });
        state.loading = false;
      })
      .addCase(fetchRenderSettings.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setRenderSettings } = renderSettingsSlice.actions;
export const selectRenderSettings = (state) => state.renderSettings;

export default renderSettingsSlice.reducer;
