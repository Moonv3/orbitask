export default function SplashScreen() {
  return (
    <div className="app-bg relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-ping-ring rounded-full border border-mint/25" />
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ffd7a3] to-[#ff8a3d] shadow-[0_0_50px_rgba(255,138,61,0.7)]" />
          <div className="absolute inset-0 animate-orbit-spin">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-mint shadow-[0_0_12px_#5eead4]" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight text-white">
            Orbitask
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Menyiapkan tata surya…
          </p>
        </div>
      </div>
    </div>
  );
}
