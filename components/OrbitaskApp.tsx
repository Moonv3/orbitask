"use client";

import {
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import { Orbit, Plus } from "lucide-react";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";
import AddTaskDialog from "./ui/AddTaskDialog";
import CommandPalette from "./ui/CommandPalette";
import FocusHud from "./ui/FocusHud";
import GalaxyOverlay from "./ui/GalaxyOverlay";
import GoalDialog from "./ui/GoalDialog";
import IntroDialog from "./ui/IntroDialog";
import MainGoalCard from "./ui/MainGoalCard";
import SceneFooter from "./ui/SceneFooter";
import SettingsDialog from "./ui/SettingsDialog";
import SplashScreen from "./ui/SplashScreen";
import SystemDialog from "./ui/SystemDialog";
import TaskListDialog from "./ui/TaskListDialog";
import TaskPanel from "./ui/TaskPanel";
import TopBar from "./ui/TopBar";

const SolarSystem = dynamic(() => import("./solar-system/SolarSystem"), {
  ssr: false,
});

const Galaxy = dynamic(() => import("./galaxy/Galaxy"), {
  ssr: false,
});

const emptySubscribe = () => () => {};

export default function OrbitaskApp() {
  // Only render the interactive app after hydration so the persisted store
  // never clashes with the server-rendered shell.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const system = useActiveSystem();
  const tasks = system.tasks;
  const selectedId = useTaskStore((state) => state.selectedId);
  const viewMode = useTaskStore((state) => state.viewMode);
  const autoRotate = useTaskStore((state) => state.autoRotate);
  const resetSignal = useTaskStore((state) => state.resetSignal);
  const isAddOpen = useTaskStore((state) => state.isAddOpen);
  const isListOpen = useTaskStore((state) => state.isListOpen);
  const isGoalOpen = useTaskStore((state) => state.isGoalOpen);
  const isSettingsOpen = useTaskStore((state) => state.isSettingsOpen);
  const isSystemOpen = useTaskStore((state) => state.isSystemOpen);
  const isCommandOpen = useTaskStore((state) => state.isCommandOpen);
  const focusRunning = useTaskStore((state) => state.focus.running);
  const tickFocus = useTaskStore((state) => state.tickFocus);
  const hasSeenIntro = useTaskStore((state) => state.settings.hasSeenIntro);
  const selectTask = useTaskStore((state) => state.selectTask);
  const openAdd = useTaskStore((state) => state.openAdd);
  const closeAdd = useTaskStore((state) => state.closeAdd);
  const closeList = useTaskStore((state) => state.closeList);
  const closeGoal = useTaskStore((state) => state.closeGoal);
  const closeSettings = useTaskStore((state) => state.closeSettings);
  const closeSystem = useTaskStore((state) => state.closeSystem);
  const closeGalaxy = useTaskStore((state) => state.closeGalaxy);
  const closeCommand = useTaskStore((state) => state.closeCommand);
  const toggleCommand = useTaskStore((state) => state.toggleCommand);
  const dismissIntro = useTaskStore((state) => state.dismissIntro);

  const selected = tasks.find((task) => task.id === selectedId) ?? null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommand();
        return;
      }
      if (event.key !== "Escape") return;
      if (isCommandOpen) closeCommand();
      else if (isSystemOpen) closeSystem();
      else if (isAddOpen) closeAdd();
      else if (isListOpen) closeList();
      else if (isGoalOpen) closeGoal();
      else if (isSettingsOpen) closeSettings();
      else if (viewMode === "galaxy") closeGalaxy();
      else if (!hasSeenIntro) dismissIntro();
      else if (selectedId) selectTask(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCommandOpen,
    isSystemOpen,
    isAddOpen,
    isListOpen,
    isGoalOpen,
    isSettingsOpen,
    viewMode,
    hasSeenIntro,
    selectedId,
    closeCommand,
    toggleCommand,
    closeSystem,
    closeAdd,
    closeList,
    closeGoal,
    closeSettings,
    closeGalaxy,
    dismissIntro,
    selectTask,
  ]);

  useEffect(() => {
    if (!focusRunning) return;
    const interval = window.setInterval(tickFocus, 1000);
    return () => window.clearInterval(interval);
  }, [focusRunning, tickFocus]);

  if (!mounted) return <SplashScreen />;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>
      <main
        id="main-content"
        className="app-bg relative h-dvh w-full overflow-hidden"
        style={{ "--color-accent": system.accent } as CSSProperties}
      >
      {viewMode === "galaxy" ? (
        <Galaxy />
      ) : (
        <SolarSystem autoRotate={autoRotate} resetSignal={resetSignal} />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-screen"
      >
        <div className="absolute left-1/2 top-1/2 h-[52vw] w-[52vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,150,70,0.1),transparent_62%)]" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.07),transparent_70%)]" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(122,162,255,0.08),transparent_70%)]" />
      </div>

      {viewMode === "galaxy" ? (
        <GalaxyOverlay />
      ) : (
        <>
          <TopBar />
          <MainGoalCard />
          <SceneFooter />
        </>
      )}

      {viewMode === "system" && tasks.length === 0 && (
        <div className="pointer-events-none absolute left-1/2 top-[62%] z-20 w-[calc(100%-2rem)] max-w-[330px] -translate-x-1/2">
          <div className="glass pointer-events-auto animate-rise-in rounded-3xl p-5 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Orbit className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 text-sm font-medium text-white">
              Orbit masih kosong
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Tambahkan tugas pertamamu dan biarkan ia mengorbit fokus hari
              ini.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ffc26b] to-[#ff9a4d] px-4 text-[11.5px] font-semibold text-[#231304]"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah tugas pertama
            </button>
          </div>
        </div>
      )}

      {viewMode === "system" && selected && (
        <TaskPanel key={selected.id} task={selected} />
      )}

        {isAddOpen && <AddTaskDialog />}
        <TaskListDialog />
        {isGoalOpen && <GoalDialog />}
        <SettingsDialog />
        <SystemDialog />
        <IntroDialog />
        <FocusHud />
        {isCommandOpen && <CommandPalette />}
      </main>
    </>
  );
}
