import React from "react";
import { DASHBOARD_TABS } from "./dashboard/constants";
import DashboardHeader from "./dashboard/DashboardHeader";
import MetricsGrid from "./dashboard/MetricsGrid";
import TabsNav from "./dashboard/TabsNav";
import ArchitectureTab from "./dashboard/tabs/ArchitectureTab";
import DependenciesTab from "./dashboard/tabs/DependenciesTab";
import TechStackTab from "./dashboard/tabs/TechStackTab";
import NarrativeTab from "./dashboard/tabs/NarrativeTab";
import EntryPointsTab from "./dashboard/tabs/EntryPointsTab";
import TestsTab from "./dashboard/tabs/TestsTab";
import UserFlowTab from "./dashboard/tabs/UserFlowTab";
import CodeHealthTab from "./dashboard/tabs/CodeHealthTab";
import DebugTab from "./dashboard/tabs/DebugTab";

export default function DashboardPage({
  CSS,
  Nav,
  MSModal,
  realData,
  nodes,
  edges,
  displayDeps,
  displayStats,
  filtDeps,
  tab,
  setTab,
  setShowMS,
  setScreen,
  depFilter,
  setDepFilter,
  selDep,
  setSelDep,
  logs,
  setLogs,
  refreshing,
}) {
  const isReal = !!realData;

  const renderTabContent = () => {
    if (tab === "architecture") {
      return (
        <ArchitectureTab
          nodes={nodes}
          edges={edges}
          isReal={isReal}
          displayStats={displayStats}
          setShowMS={setShowMS}
          setScreen={setScreen}
          setTab={setTab}
        />
      );
    }

    if (tab === "dependencies") {
      return (
        <DependenciesTab
          filtDeps={filtDeps}
          isReal={isReal}
          displayDeps={displayDeps}
          depFilter={depFilter}
          setDepFilter={setDepFilter}
          selDep={selDep}
          setSelDep={setSelDep}
        />
      );
    }

    if (tab === "tech-stack") {
      return <TechStackTab isReal={isReal} realData={realData} />;
    }

    if (tab === "narrative") {
      return <NarrativeTab isReal={isReal} realData={realData} />;
    }

    if (tab === "entry-points") {
      return <EntryPointsTab />;
    }

    if (tab === "tests") {
      return <TestsTab />;
    }

    if (tab === "user-flow") {
      return <UserFlowTab />;
    }

    if (tab === "code-health") {
      return <CodeHealthTab />;
    }

    if (tab === "debug") {
      return <DebugTab logs={logs} setLogs={setLogs} />;
    }

    return null;
  };

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        background: "#07090F",
        minHeight: "100vh",
        color: "#E2E8F0",
      }}
    >
      <style>{CSS}</style>
      <Nav />
      <MSModal />

      <div
        className="fade"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "22px" }}
      >
        <DashboardHeader
          displayStats={displayStats}
          isReal={isReal}
          refreshing={refreshing}
        />

        <MetricsGrid
          isReal={isReal}
          displayStats={displayStats}
          realData={realData}
        />

        <TabsNav
          tabs={DASHBOARD_TABS}
          tab={tab}
          setTab={setTab}
          isReal={isReal}
          debugCount={logs.length}
        />

        {renderTabContent()}
      </div>
    </div>
  );
}
