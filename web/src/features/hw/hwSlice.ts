import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { HW_COMPLETED_KEY, HW_SEEDED_KEY } from "../../lib/constants";

interface HwState {
  completed: Record<string, true>;
  seeded: boolean;
}

function loadCompleted(): Record<string, true> {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(HW_COMPLETED_KEY) || "[]");
    return Object.fromEntries(ids.map((id) => [id, true as const]));
  } catch {
    return {};
  }
}

function saveCompleted(completed: Record<string, true>) {
  try {
    localStorage.setItem(HW_COMPLETED_KEY, JSON.stringify(Object.keys(completed)));
  } catch {
    // localStorage unavailable (private browsing, etc.) -- completion just
    // won't persist across reloads.
  }
}

const initialState: HwState = {
  completed: loadCompleted(),
  seeded: (() => {
    try {
      return Boolean(localStorage.getItem(HW_SEEDED_KEY));
    } catch {
      return false;
    }
  })(),
};

const hwSlice = createSlice({
  name: "hw",
  initialState,
  reducers: {
    toggleDone(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.completed[id]) delete state.completed[id];
      else state.completed[id] = true;
      saveCompleted(state.completed);
    },
    // First-ever load has no real completion history, and the scraped data
    // can span months -- without this, every HW ever posted would show up
    // as undone backlog. Auto-mark anything older than a week done so only
    // recent, actually-actionable homework needs a look. Runs once: after
    // that, only the user's own taps change what's marked done.
    seedIfNeeded(state, action: PayloadAction<string[]>) {
      if (state.seeded) return;
      action.payload.forEach((id) => {
        state.completed[id] = true;
      });
      state.seeded = true;
      saveCompleted(state.completed);
      try {
        localStorage.setItem(HW_SEEDED_KEY, "1");
      } catch {
        // ignore
      }
    },
  },
});

export const { toggleDone, seedIfNeeded } = hwSlice.actions;
export default hwSlice.reducer;
