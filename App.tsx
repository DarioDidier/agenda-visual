
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ScheduleView } from './pages/ScheduleView';
import { PeoplePlaces } from './pages/PeoplePlaces';
import { SettingsPage } from './pages/SettingsPage';
import { AIGenerator } from './pages/AIGenerator';
import { EasyCreator } from './pages/EasyCreator';
import { UserMode } from './types';

const HomeDispatcher: React.FC = () => {
  const { mode } = useApp();
  // Si es modo fácil, la pantalla principal es el creador simplificado
  if (mode === UserMode.EASY_ADULT) {
    return <EasyCreator />;
  }
  // En modo adulto normal o niño, se muestra la agenda
  return <ScheduleView />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeDispatcher />} />
            <Route path="/ai" element={<AIGenerator />} />
            <Route path="/easy-creator" element={<EasyCreator />} />
            <Route path="/people" element={<PeoplePlaces />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
