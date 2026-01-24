import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { apiFetch } from "../../api/client";
import initial_settings from "../../config/settings_user_default.json";

export const fetchColorways = createAsyncThunk(
  'colorways/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/colorways");
      
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
    const res = await apiFetch(`/api/colorways/${id}`);
    const data = await res.json();
    return data;  // {id, label, data: {...}}
  }
);

export const colorwaysSlice = createSlice({
  name: "colorways",
  initialState: {
    ...initial_settings.colorways,
    loading: false,
  },
  reducers: {
    setColorway: (state, action) => {
      state.activeId = action.payload;
    },
    addCustomColorway: (state, action) => {
      const id = action.payload?.id;
      if (!id) return;
      state.byId[id] = action.payload;
      if (!state.order.includes(id)) {
        state.order.push(id);
      }
    },
    removeCustomColorway: (state, action) => {
      const id = action.payload;
      if (!id) return;
      delete state.byId[id];
      state.order = state.order.filter((cid) => cid !== id);
      if (state.activeId === id) {
        state.activeId = state.order[0] || null;
      }
    },
    updateCustomColorway: (state, action) => {
      const id = action.payload?.id;
      if (!id) return;
      state.byId[id] = action.payload;
      if (!state.order.includes(id)) {
        state.order.push(id);
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
        const list = Array.isArray(action.payload) ? action.payload : [];
        list.forEach((cw) => {
          if (!cw?.id) return;
          state.byId[cw.id] = cw;
          if (!state.order.includes(cw.id)) {
            state.order.push(cw.id);
          }
        });
        state.loading = false;
      })
      .addCase(fetchColorway.fulfilled, (state, action) => {
        const id = action.payload?.id;
        const data = action.payload?.data;
        if (id && data) {
          state.byId[id] = data;
          if (!state.order.includes(id)) {
            state.order.push(id);
          }
          state.activeId = id;
        }
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
const selectColorwaysOrder = (state) => state.colorways.order;
const selectColorwaysById = (state) => state.colorways.byId;

export const selectAvailableColorways = createSelector(
  [selectColorwaysOrder, selectColorwaysById],
  (order, byId) => order.map((id) => byId[id]).filter(Boolean)
);
export const selectColorway = (state) => state.colorways.activeId;
export const selectActiveColorway = (state) =>
  state.colorways.byId[state.colorways.activeId] || null;
export const selectActiveSwatch = (state) => state.colorways.activeSwatch;

export default colorwaysSlice.reducer;
