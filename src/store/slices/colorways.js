import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import initial_settings from "../../config/settings_user_default.json";

export const fetchColorways = createAsyncThunk(
  'colorways/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('https://www.n-lux.com/api/colorways');
      
      // Kiểm tra HTTP error (400, 500...)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return rejectWithValue(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Kiểm tra data có phải array không
      if (!Array.isArray(data)) {
        return rejectWithValue('API trả về dữ liệu không đúng định dạng');
      }

      // console.log("DATA", data);
      
      return data;  // [{id: "aurora_polaris", label: "Aurora Polaris"}, ...]
      
    } catch (error) {
      console.error('Fetch colorways lỗi:', error);
      return rejectWithValue(error.message || 'Không thể kết nối API');
    }
  }
);
;

export const fetchColorway = createAsyncThunk(
  'colorways/fetchOne',
  async (id) => {
    const res = await fetch(`/api/colorways/${id}`);
    const data = await res.json();
    return data;  // {id, label, data: {...}}
  }
);

export const colorwaysSlice = createSlice({
  name: "colorways",
  initialState: {
    ...initial_settings.colorways,  // {active, custom}
    available: [],     // ✅ Load từ /api/colorways
    current: null,     // ✅ Colorway hiện tại đang dùng
    loading: false
  },
  reducers: {
    setColorway: (state, action) => {
      state.active = action.payload;
    },
    addCustomColorway: (state, action) => {
      const customList = Array.isArray(state.custom) ? state.custom : [];
      const availableList = Array.isArray(state.available) ? state.available : [];
      const existsCustom = customList.some((c) => c.id === action.payload.id);
      if (!existsCustom) {
        state.custom = [...customList, action.payload];
      }
      const existsAvailable = availableList.some((c) => c.id === action.payload.id);
      if (!existsAvailable) {
        state.available = [...availableList, action.payload];
      }
    },
    removeCustomColorway: (state, action) => {
      state.custom = state.custom.filter((c) => c.id !== action.payload);
      state.available = state.available.filter((c) => c.id !== action.payload);
    },
    updateCustomColorway: (state, action) => {
      const updateList = (list) => {
        const safeList = Array.isArray(list) ? list : [];
        const idx = safeList.findIndex(
          (item) =>
            item.id === action.payload.id ||
            item.label === action.payload.label
        );
        if (idx === -1) return [...safeList, action.payload];
        const next = [...safeList];
        next[idx] = action.payload;
        return next;
      };
      state.custom = updateList(state.custom);
      state.available = updateList(state.available);
      if (
        state.current &&
        (state.current.id === action.payload.id ||
          state.current.label === action.payload.label)
      ) {
        state.current = action.payload;
      }
    },
    toggleEditing: (state) => {
      state.editing = !state.editing;
    },
    setActiveSwatch: (state, action) => {
      state.activeSwatch = action.payload;
    }
  },
  // ✅ API integration
  extraReducers: (builder) => {
    builder
      .addCase(fetchColorways.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchColorways.fulfilled, (state, action) => {
        state.available = action.payload;  // Danh sách từ backend
        state.loading = false;
      })
      .addCase(fetchColorway.fulfilled, (state, action) => {
        state.current = action.payload.data;  // Data chi tiết
        state.active = action.payload.id;
      });
  }
});

export const { 
  setColorway, 
  addCustomColorway, 
  updateCustomColorway, 
  removeCustomColorway,
  toggleEditing, 
  setActiveSwatch 
} = colorwaysSlice.actions;


// store/slices/colorways.js - THÊM dòng này vào cuối file
export const selectAvailableColorways = (state) => state.colorways.available;  // ✅ THÊM
export const selectColorway = (state) => state.colorways.active;  // ✅ THÊM

export const selectActiveColorway = (state) => state.colorways.current || 
  state.colorways.custom.find(c => c.id === state.colorways.active);
export const selectActiveSwatch = (state) => state.colorways.activeSwatch;

export default colorwaysSlice.reducer;
