import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import Join from "@/pages/Join";
// code-split: players never download the MASTER console (QR, search, filters) or the history screens
const Master = lazy(() => import("@/pages/Master"));
const HistoryHome = lazy(() => import("@/pages/History").then((m) => ({ default: m.HistoryHome })));
const HistoryList = lazy(() => import("@/pages/History").then((m) => ({ default: m.HistoryList })));
const HistoryDetail = lazy(() => import("@/pages/History").then((m) => ({ default: m.HistoryDetail })));
import Player from "@/pages/Player";
import { Toaster } from "@/components/ui/sonner";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/join" element={<Join />} />
        <Route path="/master/:code" element={<Master />} />
        <Route path="/play/:code" element={<Player />} />
        <Route path="/history" element={<HistoryHome />} />
        <Route path="/history/match/:id" element={<HistoryDetail />} />
        <Route path="/history/:mode" element={<HistoryList />} />
        <Route path="*" element={<Home />} />
      </Routes>
      </Suspense>
      <Toaster richColors />
    </>
  );
}
