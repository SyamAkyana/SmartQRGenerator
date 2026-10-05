// Shared shell for public QR landing pages (server component).
export function QrPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center space-y-4 w-full max-w-lg bg-white border border-neutral-200 rounded-2xl p-8">
        {children}
      </div>
    </div>
  );
}