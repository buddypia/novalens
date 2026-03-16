import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@shared/components/Layout';
import { AnalysisPage, HistoryPage } from '@features/analysis';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
