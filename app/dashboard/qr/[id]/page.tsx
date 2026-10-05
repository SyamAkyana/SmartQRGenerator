import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getQrById } from "@/lib/qr/service";
import { MultiLinkEditor } from "./components/multi-link-editor";
import { QrWorkspace } from "./components/qr-workspace";
import { ArrowLeft, Link2, QrCode, BarChart3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QrDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const qr = await getQrById(id, session.user.id);
  if (!qr) redirect("/dashboard/qr");

  const isMultiLink = qr.type === "MULTI_LINK";

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Header bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/qr">
              <Button variant="ghost" size="sm" className="gap-1.5 text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">QR Codes</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-neutral-900 truncate">
                  {qr.name}
                </h1>
                <Badge variant="outline" className="text-[11px] font-normal px-2 py-0 shrink-0">
                  {qr.type}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                /q/{qr.shortCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/q/${qr.shortCode}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Public URL</span>
              </Button>
            </Link>
            <Link href={`/dashboard/qr/${id}/analytics`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isMultiLink ? (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-indigo-950">Multi-Link Landing Page Editor</h2>
                  <p className="text-xs text-indigo-700">Add, reorder, and customize links rendered on your mobile landing page.</p>
                </div>
              </div>
            </div>
            <MultiLinkEditor qrId={qr.id} />
          </div>
        ) : (
          <QrWorkspace initialQr={qr} />
        )}
      </main>
    </div>
  );
}
