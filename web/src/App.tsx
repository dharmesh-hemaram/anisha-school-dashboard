import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./routes/AppLayout";
import UpcomingPage from "./pages/upcoming/UpcomingPage";
import HwPage from "./pages/hw/HwPage";
import NotesPage from "./pages/notes/NotesPage";
import FeedPage from "./pages/feed/FeedPage";
import RevisionNotebookPage from "./pages/revision/RevisionNotebookPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/upcoming" replace />} />
          <Route path="upcoming" element={<UpcomingPage />} />
          <Route path="hw" element={<HwPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="notes/:subject" element={<NotesPage />} />
          <Route path="feed" element={<FeedPage />} />
        </Route>
        <Route path="revision/:slug" element={<RevisionNotebookPage />} />
      </Routes>
    </BrowserRouter>
  );
}
