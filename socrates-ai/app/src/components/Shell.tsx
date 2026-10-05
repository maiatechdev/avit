export function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen w-full" style={{ background: "var(--background)" }}>
      <div
        className={`relative w-full mx-auto flex flex-col ${wide ? "" : "max-w-3xl"}`}
        style={{ minHeight: "100svh" }}
      >
        {children}
      </div>
    </div>
  );
}
