import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RevisionNotebook } from "../../revision-notebooks/types";

type NotebookStatus = "loading" | "succeeded" | "failed";

interface RevisionState {
  bySlug: Record<string, { status: NotebookStatus; notebook?: RevisionNotebook; error?: string }>;
}

const initialState: RevisionState = { bySlug: {} };

// Every revision notebook is just a JSON file at data/revision-notebooks/<slug>.json
// -- adding a new subject's notebook is dropping in that one file (plus its
// images in public/) and linking to /revision/<slug> from
// portion_schedules.json. No registry, no code change, no rebuild-time
// import: this thunk fetches whatever slug the route asks for.
export const fetchRevisionNotebook = createAsyncThunk<RevisionNotebook, string>(
  "revision/fetchNotebook",
  async (slug) => {
    const res = await fetch(`${import.meta.env.BASE_URL}data/revision-notebooks/${slug}.json?_=${Date.now()}`);
    // A missing file doesn't always come back as a real 404: the dev
    // server's (and some static hosts') SPA fallback returns 200 with the
    // app shell's index.html for any unmatched path, JSON or not -- check
    // the content-type too, or a missing notebook shows a JSON-parse error
    // instead of "not found".
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("json")) {
      throw new Error(`No revision notebook found for "${slug}"`);
    }
    return res.json() as Promise<RevisionNotebook>;
  },
);

const revisionSlice = createSlice({
  name: "revision",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevisionNotebook.pending, (state, action) => {
        state.bySlug[action.meta.arg] = { status: "loading" };
      })
      .addCase(fetchRevisionNotebook.fulfilled, (state, action: PayloadAction<RevisionNotebook, string, { arg: string }>) => {
        state.bySlug[action.meta.arg] = { status: "succeeded", notebook: action.payload };
      })
      .addCase(fetchRevisionNotebook.rejected, (state, action) => {
        state.bySlug[action.meta.arg] = { status: "failed", error: action.error.message };
      });
  },
});

export default revisionSlice.reducer;
