import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index.tsx";
import LiabilityPage from "./pages/LiabilityPage.tsx";
import KanbanPage from "./pages/KanbanPage.tsx";
import MapPage from "./pages/MapPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import ReportsPage from "./pages/ReportsPage";
import PrivacyPage from "./pages/PrivacyPage";
import Manufacturing from "./pages/sectors/Manufacturing";
import IT from "./pages/sectors/IT";
import Food from "./pages/sectors/Food";
import Construction from "./pages/sectors/Construction";
import Healthcare from "./pages/sectors/Healthcare";
import Retail from "./pages/sectors/Retail";
import BFSI from "./pages/sectors/BFSI";

const queryClient = new QueryClient();


import ComplianceChatbot from './components/chatbot/ComplianceChatbot';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/liability" element={<LiabilityPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/sectors/manufacturing" element={<Manufacturing />} />
            <Route path="/sectors/it" element={<IT />} />
            <Route path="/sectors/food" element={<Food />} />
            <Route path="/sectors/construction" element={<Construction />} />
            <Route path="/sectors/healthcare" element={<Healthcare />} />
            <Route path="/sectors/retail" element={<Retail />} />
            <Route path="/sectors/bfsi" element={<BFSI />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ComplianceChatbot />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
