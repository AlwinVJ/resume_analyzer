import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './views/DashboardView';
import { AnalyzeView } from './views/AnalyzeView';
import { BulkScreeningView } from './views/BulkScreeningView';
import { HistoryView } from './views/HistoryView';
import { HistorySessionView } from './views/HistorySessionView';
import { CandidateDetailView } from './views/CandidateDetailView';

const AppContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <AppShell>
      {currentTab === 'dashboard' && <DashboardView />}
      {currentTab === 'analyze' && <AnalyzeView />}
      {currentTab === 'screening' && <BulkScreeningView />}
      {currentTab === 'history' && <HistoryView />}
      {currentTab === 'history-session' && <HistorySessionView />}
      {currentTab === 'candidate-detail' && <CandidateDetailView />}
    </AppShell>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
