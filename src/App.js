import React, { useMemo, useRef, useState } from "react";
import {
  analyzeGitHubRepo as analyzeGitHubRepoFromEngine,
  analyzeZipArchive as analyzeZipArchiveFromEngine,
  parseGitHubUrl as parseGitHubUrlFromEngine,
} from "./features/analyzer/engine.mjs";
import UploadPage from "./pages/UploadPage.jsx";
import LoadingPage from "./pages/LoadingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DiagramEditorPage from "./pages/DiagramEditorPage.jsx";
import NavBar from "./features/layout/NavBar.jsx";
import MicroserviceModal from "./features/layout/MicroserviceModal.jsx";
import {
  AI_MODELS,
  CSS,
  DB_OPT,
  LOAD_STEPS,
  MOCK_DEPS,
  MOCK_EDGES,
  MOCK_NODES,
  MS_TYPES,
  S,
} from "./features/app/uiData";

const DEMO_STATS = {
  repoName: "demo-project",
  language: "JavaScript",
  stars: 0,
  docker: false,
  kubernetes: false,
  technologyCount: 6,
  activeTechnologyCount: 5,
  declaredOnlyTechnologyCount: 1,
  technologyHighlights: [
    "React",
    "Express",
    "MongoDB",
    "TypeScript",
    "Tailwind CSS",
  ],
  llmUsed: false,
  fallbackCostUSD: 0,
  totalFiles: 47,
  srcFiles: 32,
  testFiles: 4,
  modules: 8,
  moduleList: [
    "src",
    "routes",
    "controllers",
    "models",
    "middleware",
    "services",
    "tests",
    "config",
  ],
  totalDeps: 18,
  devDeps: 9,
  outdatedDeps: 3,
};

function getErrorMessage(error, fallback) {
  if (error && typeof error === "object" && "message" in error) {
    return error.message;
  }
  return fallback;
}

export default function App() {
  const [screen, setScreen] = useState(S.UP);
  const [tab, setTab] = useState("architecture");
  const [selNode, setSelNode] = useState(null);
  const [nodes, setNodes] = useState(MOCK_NODES);
  const [edges, setEdges] = useState(MOCK_EDGES);
  const [curDb, setCurDb] = useState("postgresql");
  const [curAI, setCurAI] = useState("gpt-4o");
  const [converting, setConverting] = useState(false);
  const [convDone, setConvDone] = useState(false);
  const [swapAI, setSwapAI] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [showMS, setShowMS] = useState(false);
  const [msType, setMsType] = useState(null);
  const [msName, setMsName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [depFilter, setDepFilter] = useState("all");
  const [selDep, setSelDep] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const [loadPct, setLoadPct] = useState(0);
  const [realData, setRealData] = useState(null);
  const [nodeDetails, setNodeDetails] = useState({});
  const [logs, setLogs] = useState([]);
  const [analyzeErr, setAnalyzeErr] = useState("");

  const fileRef = useRef(null);

  const envGitHubToken =
    process.env.REACT_APP_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
  const envGeminiKey =
    process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

  const displayDeps = useMemo(
    () =>
      realData && Array.isArray(realData.deps) ? realData.deps : MOCK_DEPS,
    [realData],
  );

  const displayStats = useMemo(() => {
    if (!realData || !realData.stats) {
      return DEMO_STATS;
    }
    return { ...DEMO_STATS, ...realData.stats };
  }, [realData]);

  const filtDeps = useMemo(
    () =>
      displayDeps.filter((dep) => {
        if (depFilter === "all") return true;
        if (depFilter === "outdated") return dep.old;
        if (depFilter === "unused") return dep.unused;
        return dep.type === depFilter;
      }),
    [displayDeps, depFilter],
  );

  const applyAnalysisResult = (data) => {
    setRealData(data);
    setNodeDetails(data.nodeDetails || {});
    setLogs(Array.isArray(data.debugLog) ? data.debugLog : []);
    setNodes(data.nodes?.length ? data.nodes : MOCK_NODES);
    setEdges(data.edges?.length ? data.edges : MOCK_EDGES);
    setSelNode(null);
    setSelDep(null);
    setTab("architecture");
    setScreen(S.DASH);
  };

  const handleAnalyze = async () => {
    const parsed = parseGitHubUrlFromEngine(githubUrl);
    if (!parsed) {
      setAnalyzeErr("Invalid URL. Example: https://github.com/owner/repo");
      return;
    }

    setAnalyzeErr("");
    setLoadMsg("Starting...");
    setLoadPct(0);
    setScreen(S.LOAD);

    try {
      const data = await analyzeGitHubRepoFromEngine(
        parsed.owner,
        parsed.repo,
        (msg, pct) => {
          setLoadMsg(msg);
          setLoadPct(pct);
        },
        envGitHubToken || undefined,
        {
          geminiApiKey: envGeminiKey || undefined,
        },
      );
      applyAnalysisResult(data);
    } catch (error) {
      setAnalyzeErr(getErrorMessage(error, "GitHub analysis failed."));
      setScreen(S.UP);
    }
  };

  const handleZipAnalyze = async (file) => {
    if (!file) return;
    const lowerName = String(file.name || "").toLowerCase();
    if (!lowerName.endsWith(".zip")) {
      setAnalyzeErr("Please select a .zip archive.");
      return;
    }

    setAnalyzeErr("");
    setLoadMsg(`Reading ZIP: ${file.name}`);
    setLoadPct(0);
    setScreen(S.LOAD);

    try {
      const data = await analyzeZipArchiveFromEngine(
        file,
        (msg, pct) => {
          setLoadMsg(msg);
          setLoadPct(pct);
        },
        {
          geminiApiKey: envGeminiKey || undefined,
        },
      );
      applyAnalysisResult(data);
    } catch (error) {
      setAnalyzeErr(getErrorMessage(error, "ZIP analysis failed."));
      setScreen(S.UP);
    }
  };

  const doDbSwap = (id) => {
    if (id === curDb || converting) return;

    setConverting(true);
    setConvDone(false);

    window.setTimeout(() => {
      const selectedDb = DB_OPT.find((db) => db.id === id);
      if (!selectedDb) return;

      setCurDb(id);
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === "db"
            ? { ...node, label: selectedDb.label, color: selectedDb.color }
            : node,
        ),
      );
      setConverting(false);
      setConvDone(true);
    }, 2300);
  };

  const doAISwap = (id) => {
    if (id === curAI || swapAI) return;

    setSwapAI(true);
    setAiDone(false);

    window.setTimeout(() => {
      const selectedModel = AI_MODELS.find((model) => model.id === id);
      if (!selectedModel) return;

      setCurAI(id);
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === "ai"
            ? {
                ...node,
                label: selectedModel.label,
                color: selectedModel.color,
              }
            : node,
        ),
      );
      setSwapAI(false);
      setAiDone(true);
    }, 1800);
  };

  const addMicroservice = () => {
    if (!msType || !msName.trim()) return;

    const selectedType = MS_TYPES.find((type) => type.id === msType);
    if (!selectedType) return;

    const id = `ms_${Date.now()}`;
    const existingMsCount = nodes.filter(
      (node) => node.type === "microservice",
    ).length;
    const nextY = Math.max(...nodes.map((node) => node.y + node.h)) + 30;

    setNodes((prevNodes) => [
      ...prevNodes,
      {
        id,
        x: 35 + existingMsCount * 140,
        y: nextY,
        w: 120,
        h: 46,
        label: msName.trim(),
        color: selectedType.color,
        type: "microservice",
        msType,
      },
    ]);

    setEdges((prevEdges) => [...prevEdges, { from: "api", to: id }]);
    setShowMS(false);
    setMsType(null);
    setMsName("");
  };

  const doRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 2200);
  };

  const reset = () => {
    setScreen(S.UP);
    setTab("architecture");
    setSelNode(null);
    setNodes(MOCK_NODES);
    setEdges(MOCK_EDGES);
    setCurDb("postgresql");
    setCurAI("gpt-4o");
    setConverting(false);
    setConvDone(false);
    setSwapAI(false);
    setAiDone(false);
    setShowMS(false);
    setMsType(null);
    setMsName("");
    setRefreshing(false);
    setDepFilter("all");
    setSelDep(null);
    setLoadMsg("");
    setLoadPct(0);
    setRealData(null);
    setNodeDetails({});
    setLogs([]);
    setGithubUrl("");
    setAnalyzeErr("");
  };

  const Nav = () => (
    <NavBar
      screen={screen}
      setScreen={setScreen}
      onReset={reset}
      refreshing={refreshing}
      onRefresh={doRefresh}
    />
  );

  const MSModal = () => (
    <MicroserviceModal
      show={showMS}
      onClose={() => setShowMS(false)}
      msTypes={MS_TYPES}
      msType={msType}
      setMsType={setMsType}
      msName={msName}
      setMsName={setMsName}
      onAdd={addMicroservice}
    />
  );

  if (screen === S.UP) {
    return (
      <UploadPage
        CSS={CSS}
        Nav={Nav}
        githubUrl={githubUrl}
        setGithubUrl={setGithubUrl}
        analyzeErr={analyzeErr}
        setAnalyzeErr={setAnalyzeErr}
        handleAnalyze={handleAnalyze}
        fileRef={fileRef}
        handleZipAnalyze={handleZipAnalyze}
      />
    );
  }

  if (screen === S.LOAD) {
    return (
      <LoadingPage
        CSS={CSS}
        Nav={Nav}
        githubUrl={githubUrl}
        loadMsg={loadMsg}
        loadPct={loadPct}
        loadSteps={LOAD_STEPS}
      />
    );
  }

  if (screen === S.DIAG) {
    return (
      <DiagramEditorPage
        CSS={CSS}
        Nav={Nav}
        MSModal={MSModal}
        nodes={nodes}
        edges={edges}
        selNode={selNode}
        setSelNode={setSelNode}
        setShowMS={setShowMS}
        converting={converting}
        convDone={convDone}
        swapAI={swapAI}
        aiDone={aiDone}
        curDb={curDb}
        doDbSwap={doDbSwap}
        curAI={curAI}
        doAISwap={doAISwap}
        nodeDetails={nodeDetails}
      />
    );
  }

  return (
    <DashboardPage
      CSS={CSS}
      Nav={Nav}
      MSModal={MSModal}
      realData={realData}
      nodes={nodes}
      edges={edges}
      displayDeps={displayDeps}
      displayStats={displayStats}
      filtDeps={filtDeps}
      tab={tab}
      setTab={setTab}
      setShowMS={setShowMS}
      setScreen={setScreen}
      depFilter={depFilter}
      setDepFilter={setDepFilter}
      selDep={selDep}
      setSelDep={setSelDep}
      logs={logs}
      setLogs={setLogs}
      refreshing={refreshing}
    />
  );
}
