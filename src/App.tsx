import { useState } from "react";
import Header from "./components/Header";
import DashboardPage from "./components/DashboardPage";
import RaidsPage from "./components/RaidsPage";
import ItemsPage from "./components/ItemsPage";
import StorePage from "./components/StorePage";
import ReputationPage from "./components/ReputationPage";
import TrialsLeaderboardPage from "./components/TrialsLeaderboardPage";
import MemberListPage from "./components/MemberListPage";
import CodexPage from "./components/CodexPage";
import SettingsPage from "./components/SettingsPage";
import { RaiderBackdrop } from "./components/RaiderBackdrop";
import { PlayerProvider } from "./context/PlayerContext";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'raids':
        return <RaidsPage />;
      case 'stash':
        return <ItemsPage />;
      case 'store':
        return <StorePage />;
      case 'reputation':
        return <ReputationPage />;
      case 'trials':
        return <TrialsLeaderboardPage />;
      case 'members':
        return <MemberListPage />;
      case 'codex':
        return <CodexPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <PlayerProvider>
      <div className="min-h-screen bg-gradient-to-br from-black via-[#050505] to-[#111]">
        <RaiderBackdrop />
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="pb-20">
          {renderPage()}
        </main>
      </div>
    </PlayerProvider>
  );
}

