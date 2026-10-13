import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router";
import Index from "./pages/Index";
import Guidance from "./pages/Guidance";
import NotFound from "./pages/NotFound";
import { I18nProvider } from "@/lib/i18n";
import { FeedingHistoryProvider } from "@/hooks/use-feeding-history";
import { PersonasProvider } from "@/hooks/use-personas";
import { ThemeProvider } from "@/hooks/use-theme";

// Loaded on first visit to the docs, so the calculator stays small
const Docs = lazy(() => import("./pages/Docs"));

const App = () => (
  <ThemeProvider>
    <Toaster />
    <I18nProvider>
      <FeedingHistoryProvider>
        <PersonasProvider>
          {/* Hash URLs (/#/guidance) work on static hosts like GitHub Pages without server rewrites */}
          <HashRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/guidance" element={<Guidance />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/docs/:page" element={<Docs />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </PersonasProvider>
      </FeedingHistoryProvider>
    </I18nProvider>
  </ThemeProvider>
);

export default App;
