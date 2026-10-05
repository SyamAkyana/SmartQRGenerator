import { Phone, Mail, Globe, Building2, Download } from "lucide-react";
import type { QRCodeRecord } from "@/lib/qr/service";
import { QrPageShell } from "./qr-page-shell";

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Landing page for CONTACT QR codes — shows the contact card + vCard download. */
export function ContactQrPage({ qr }: { qr: QRCodeRecord }) {
  const d = qr.data ?? {};
  const firstName = asString(d.firstName);
  const lastName = asString(d.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const organization = asString(d.organization);
  const jobTitle = asString(d.jobTitle);
  const phone = asString(d.phone);
  const email = asString(d.email);
  const website = asString(d.website);

  const rows: Array<{ icon: React.ReactNode; label: string; value: string; href?: string }> = [];
  if (phone) rows.push({ icon: <Phone className="w-4 h-4 text-emerald-600" />, label: "Phone", value: phone, href: `tel:${phone}` });
  if (email) rows.push({ icon: <Mail className="w-4 h-4 text-blue-600" />, label: "Email", value: email, href: `mailto:${email}` });
  if (website) rows.push({ icon: <Globe className="w-4 h-4 text-violet-600" />, label: "Website", value: website, href: website });

  return (
    <QrPageShell>
      <div className="mx-auto p-3 bg-pink-50 rounded-full w-fit">
        <Building2 className="w-6 h-6 text-pink-600" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">{fullName || "Contact"}</h1>
      {jobTitle && <p className="text-sm text-neutral-500">{jobTitle}</p>}
      {organization && <p className="text-sm font-medium text-neutral-600">{organization}</p>}

      <div className="space-y-2">
        {rows.map((r) => (
          <a
            key={r.label}
            href={r.href}
            className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors text-left"
          >
            {r.icon}
            <div>
              <p className="text-xs text-neutral-500 font-medium uppercase">{r.label}</p>
              <p className="text-sm text-neutral-800">{r.value}</p>
            </div>
          </a>
        ))}
      </div>

      <a
        href={`/q/${qr.shortCode}/contact.vcf`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        Download vCard
      </a>
    </QrPageShell>
  );
}