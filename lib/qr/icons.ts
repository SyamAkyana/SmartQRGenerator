// lib/qr/icons.ts
// Built-in Brand & Utility Icons for Logo QR codes (Vector SVGs as clean Data URIs)

export interface BuiltinIcon {
  id: string;
  name: string;
  category: "social" | "utility" | "brand";
  color: string;
  dataUri: string;
  svg: string;
}

function makeSvgDataUri(svgContent: string): string {
  // Convert SVG to clean base64 data URI for reliable rendering in <img> and <canvas>
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(svgContent).toString("base64")
    : btoa(unescape(encodeURIComponent(svgContent)));
  return `data:image/svg+xml;base64,${base64}`;
}

// 1. WhatsApp
const whatsappSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#25D366"/>
  <path fill="#FFFFFF" d="M68.5 31.5C63.6 26.6 57 24 50 24c-14.3 0-26 11.7-26 26 0 4.6 1.2 9 3.5 13L24 76l13.3-3.5c3.8 2.1 8.1 3.2 12.7 3.2 14.3 0 26-11.7 26-26 0-7-2.7-13.6-7.5-18.2zM50 71.3c-3.9 0-7.7-1-11-3l-.8-.5-8.2 2.2 2.2-8-.5-.8c-2.2-3.5-3.4-7.5-3.4-11.2 0-11.9 9.7-21.6 21.7-21.6 5.8 0 11.2 2.3 15.3 6.4 4.1 4.1 6.4 9.5 6.4 15.3 0 11.9-9.8 21.2-21.7 21.2zm11.9-16.3c-.7-.3-3.9-1.9-4.5-2.1-.6-.2-1-.3-1.5.3-.4.7-1.7 2.1-2.1 2.6-.4.4-.7.5-1.4.1-.7-.3-2.8-1-5.3-3.3-2-1.7-3.3-3.9-3.7-4.6-.4-.7 0-1.1.3-1.4.3-.3.7-.8 1-1.2.3-.4.5-.7.7-1.1.2-.5.1-.9 0-1.2-.2-.3-1.5-3.6-2-4.9-.6-1.3-1.1-1.1-1.5-1.1h-1.3c-.4 0-1.2.2-1.8.8-.6.7-2.4 2.3-2.4 5.7 0 3.3 2.4 6.6 2.8 7.1.3.5 4.8 7.3 11.6 10.2 1.6.7 2.9 1.1 3.9 1.4 1.6.5 3.1.4 4.3.3 1.3-.2 3.9-1.6 4.5-3.1.5-1.6.5-2.9.4-3.2-.2-.3-.6-.5-1.3-.8z"/>
</svg>`;

// 2. Instagram
const instagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFDC80"/>
      <stop offset="25%" stop-color="#FCAF45"/>
      <stop offset="50%" stop-color="#F77737"/>
      <stop offset="75%" stop-color="#F56040"/>
      <stop offset="100%" stop-color="#C13584"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <rect x="10" y="10" width="80" height="80" rx="24" fill="url(#ig-grad)"/>
  <rect x="25" y="25" width="50" height="50" rx="14" fill="none" stroke="#FFFFFF" stroke-width="5"/>
  <circle cx="50" cy="50" r="12" fill="none" stroke="#FFFFFF" stroke-width="5"/>
  <circle cx="64" cy="36" r="3.5" fill="#FFFFFF"/>
</svg>`;

// 3. YouTube
const youtubeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <rect x="10" y="20" width="80" height="60" rx="18" fill="#FF0000"/>
  <polygon points="42,34 66,50 42,66" fill="#FFFFFF"/>
</svg>`;

// 4. X / Twitter
const xTwitterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#000000"/>
  <path fill="#FFFFFF" d="M58.4 28h5.6L51.8 42l14.4 19H55L44.8 47.7 33.2 61h-5.6l13-14.8L27 28h11.5l9.4 12.4L58.4 28zm-2 29.6h3.1L39.8 31.2h-3.3L56.4 57.6z"/>
</svg>`;

// 5. Facebook
const facebookSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#1877F2"/>
  <path fill="#FFFFFF" d="M55.8 77V51.7h8.5l1.3-9.9h-9.8v-6.3c0-2.9.8-4.8 4.9-4.8h5.2V22c-.9-.1-4-.4-7.6-.4-7.5 0-12.7 4.6-12.7 13.1v7.1h-8.5v9.9h8.5V77h10.2z"/>
</svg>`;

// 6. TikTok
const tiktokSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#010101"/>
  <path fill="#25F4EE" d="M63 36.8c-3.1-.7-5.5-2.8-6.4-5.8h-4.3v27c0 5.4-4.4 9.8-9.8 9.8-5.4 0-9.8-4.4-9.8-9.8s4.4-9.8 9.8-9.8c1 0 2 .2 3 .5v-4.6c-1-.2-2-.3-3-.3-8 0-14.4 6.5-14.4 14.4 0 8 6.5 14.4 14.4 14.4 8 0 14.4-6.5 14.4-14.4V42.3c3.4 2.5 7.6 3.9 12.1 3.9v-4.6c-2.4 0-4.6-.9-6-2.8z"/>
  <path fill="#FE2C55" d="M64.5 35.3c-3.1-.7-5.5-2.8-6.4-5.8h-4.3v27c0 5.4-4.4 9.8-9.8 9.8-5.4 0-9.8-4.4-9.8-9.8s4.4-9.8 9.8-9.8c1 0 2 .2 3 .5v-4.6c-1-.2-2-.3-3-.3-8 0-14.4 6.5-14.4 14.4 0 8 6.5 14.4 14.4 14.4 8 0 14.4-6.5 14.4-14.4V40.8c3.4 2.5 7.6 3.9 12.1 3.9v-4.6c-2.4 0-4.6-.9-6-2.8z" opacity="0.9"/>
  <path fill="#FFFFFF" d="M63.8 36c-3.1-.7-5.5-2.8-6.4-5.8h-4.3v27c0 5.4-4.4 9.8-9.8 9.8-5.4 0-9.8-4.4-9.8-9.8s4.4-9.8 9.8-9.8c1 0 2 .2 3 .5v-4.6c-1-.2-2-.3-3-.3-8 0-14.4 6.5-14.4 14.4 0 8 6.5 14.4 14.4 14.4 8 0 14.4-6.5 14.4-14.4V41.5c3.4 2.5 7.6 3.9 12.1 3.9v-4.6c-2.4 0-4.6-.9-6-2.8z"/>
</svg>`;

// 7. LinkedIn
const linkedinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <rect x="10" y="10" width="80" height="80" rx="18" fill="#0A66C2"/>
  <path fill="#FFFFFF" d="M30 40h9v30h-9V40zm4.5-15c3 0 5 2 5 4.5s-2 4.5-5 4.5-5-2-5-4.5 2-4.5 5-4.5zM45 40h8.6v4.1h.1c1.2-2.3 4.2-4.8 8.6-4.8 9.2 0 10.9 6.1 10.9 14V70h-9V56c0-3.3-.1-7.6-4.6-7.6-4.6 0-5.3 3.6-5.3 7.3V70H45V40z"/>
</svg>`;

// 8. Telegram
const telegramSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#229ED9"/>
  <path fill="#FFFFFF" d="M69.8 30.5L25 47.8c-3.1 1.2-3 2.9-.6 3.7l11.5 3.6 26.6-16.8c1.3-.8 2.4-.3 1.5.5L42.5 58.2v10.4c0 1.5.8 2.3 2 1.2l6.2-6 12.8 9.5c2.4 1.3 4.1.6 4.7-2.3L76.5 33c.9-3.6-1.4-5.2-6.7-2.5z"/>
</svg>`;

// 9. WiFi
const wifiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#3B82F6"/>
  <path fill="#FFFFFF" d="M50 30c-11.8 0-22.5 4.7-30.4 12.3l4.6 4.6C30.9 40.1 40 36 50 36s19.1 4.1 25.8 10.9l4.6-4.6C72.5 34.7 61.8 30 50 30zm0 14c-8 0-15.3 3.2-20.6 8.4l4.6 4.6c4.1-4.1 9.8-6.6 16-6.6s11.9 2.5 16 6.6l4.6-4.6C65.3 47.2 58 44 50 44zm0 14c-4.2 0-8 1.7-10.8 4.4L50 73.2l10.8-10.8C58 59.7 54.2 58 50 58z"/>
</svg>`;

// 10. Location / Map Pin
const locationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#EF4444"/>
  <path fill="#FFFFFF" d="M50 24c-11 0-20 9-20 20 0 15 20 32 20 32s20-17 20-32c0-11-9-20-20-20zm0 27c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
</svg>`;

// 11. Website / Globe
const globeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#6366F1"/>
  <circle cx="50" cy="50" r="22" fill="none" stroke="#FFFFFF" stroke-width="4"/>
  <ellipse cx="50" cy="50" rx="10" ry="22" fill="none" stroke="#FFFFFF" stroke-width="4"/>
  <line x1="28" y1="50" x2="72" y2="50" stroke="#FFFFFF" stroke-width="4"/>
  <line x1="33" y1="38" x2="67" y2="38" stroke="#FFFFFF" stroke-width="3"/>
  <line x1="33" y1="62" x2="67" y2="62" stroke="#FFFFFF" stroke-width="3"/>
</svg>`;

// 12. Phone / Call
const phoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#10B981"/>
  <path fill="#FFFFFF" d="M65.6 59.8l-5.4-2.5c-.8-.4-1.8-.2-2.4.5l-2.4 2.9c-4.1-2.2-7.5-5.6-9.7-9.7l2.9-2.4c.7-.6.9-1.6.5-2.4l-2.5-5.4c-.5-1-1.6-1.5-2.6-1.3l-5.6 1.3c-1 .2-1.7 1.1-1.7 2.1 0 18.2 14.8 33 33 33 1 0 1.9-.7 2.1-1.7l1.3-5.6c.3-1-.2-2.1-1.2-2.6z"/>
</svg>`;

// 13. Mail / Email
const mailSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#F59E0B"/>
  <rect x="26" y="32" width="48" height="36" rx="6" fill="#FFFFFF"/>
  <path fill="#F59E0B" d="M28 34l22 18 22-18H28zm44 32H28V38l22 17 22-17v28z"/>
</svg>`;

// 14. Spotify
const spotifySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#1DB954"/>
  <path fill="#FFFFFF" d="M68 44.5c-9.6-5.7-25.5-6.2-34.7-3.4-1.5.4-3-.4-3.5-1.9s.4-3 1.9-3.5c10.7-3.2 28.2-2.6 39.2 3.9 1.3.8 1.8 2.5 1 3.8-.7 1.4-2.5 1.9-3.9 1.1zm-.4 9.1c-.8 1.3-2.4 1.7-3.7.9-8-4.9-20.3-6.4-29.8-3.5-1.4.4-2.9-.4-3.3-1.8-.4-1.4.4-2.9 1.8-3.3 10.9-3.3 24.4-1.7 33.6 4 1.3.8 1.7 2.4.9 3.7zm-1.8 9.3c-.6 1-1.9 1.3-2.9.7-6.9-4.2-15.6-5.2-25.8-2.9-1.2.3-2.3-.5-2.5-1.7s.5-2.3 1.7-2.5c11.2-2.6 20.8-1.4 28.5 3.3 1.1.7 1.4 2 1 3.1z"/>
</svg>`;

// 15. GitHub
const githubSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#181717"/>
  <path fill="#FFFFFF" d="M50 24c-14.4 0-26 11.6-26 26 0 11.5 7.5 21.2 17.8 24.6 1.3.2 1.8-.6 1.8-1.2v-4.5c-7.2 1.6-8.7-3.5-8.7-3.5-1.2-3-2.9-3.8-2.9-3.8-2.4-1.6.2-1.6.2-1.6 2.6.2 4 2.7 4 2.7 2.3 4 6.1 2.8 7.6 2.2.2-1.7.9-2.8 1.7-3.5-5.8-.7-11.8-2.9-11.8-12.8 0-2.8 1-5.1 2.7-6.9-.3-.7-1.2-3.3.3-6.8 0 0 2.2-.7 7.1 2.6 2.1-.6 4.3-.9 6.5-.9 2.2 0 4.4.3 6.5.9 4.9-3.3 7.1-2.6 7.1-2.6 1.5 3.5.6 6.1.3 6.8 1.7 1.8 2.7 4.1 2.7 6.9 0 10-6.1 12.1-11.9 12.8 1 .8 1.8 2.4 1.8 4.9v7.2c0 .7.5 1.5 1.8 1.2 10.3-3.4 17.8-13.1 17.8-24.6 0-14.4-11.6-26-26-26z"/>
</svg>`;

// 16. PDF / Document
const pdfSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <rect x="15" y="15" width="70" height="70" rx="18" fill="#DC2626"/>
  <path fill="#FFFFFF" d="M30 28h24l16 16v28c0 2.2-1.8 4-4 4H30c-2.2 0-4-1.8-4-4V32c0-2.2 1.8-4 4-4zm20 3v14h14L50 31zM34 60h4c3 0 5-1.5 5-4s-2-4-5-4h-4v8zm3-6h1c1.2 0 2 .5 2 1.5s-.8 1.5-2 1.5h-1v-3zm10 6h3.5v-8H47v8zm7 0h3.5v-3.5h3v-2.2h-3v-2.3h4V44H54v8z"/>
</svg>`;

// 17. Google
const googleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
  <path fill="#4285F4" d="M70.5 50.8c0-1.6-.1-3.1-.4-4.5H50v8.6h11.5c-.5 2.7-2 5-4.3 6.5v5.4h7c4.1-3.8 6.3-9.3 6.3-16z"/>
  <path fill="#34A853" d="M50 71.7c5.9 0 10.8-1.9 14.4-5.3l-7-5.4c-1.9 1.3-4.4 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H30.6v5.6c3.6 7.2 11 12 19.4 12z"/>
  <path fill="#FBBC05" d="M37.8 54.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.6h-7.2C29.1 43.1 28 46.4 28 50s1.1 6.9 2.6 9.7l7.2-5.6z"/>
  <path fill="#EA4335" d="M50 36.6c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C60.8 30.2 55.8 28.3 50 28.3c-8.4 0-15.8 4.8-19.4 12l7.2 5.6c1.7-5.2 6.5-9.3 12.2-9.3z"/>
</svg>`;

// 18. Apple
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#FFFFFF"/>
  <circle cx="50" cy="50" r="42" fill="#000000"/>
  <path fill="#FFFFFF" d="M56.8 34.5c2.3-2.9 3.9-6.9 3.5-10.9-3.4.1-7.5 2.3-9.9 5.2-2.1 2.5-4 6.6-3.5 10.5 3.8.3 7.6-1.9 9.9-4.8zm9.5 17.5c-.1-7.1 5.8-10.5 6-10.7-3.3-4.8-8.4-5.5-10.2-5.6-4.3-.4-8.5 2.5-10.7 2.5-2.2 0-5.6-2.5-9.2-2.4-4.7.1-9 2.8-11.4 7-4.9 8.5-1.3 21 3.5 27.9 2.3 3.4 5.1 7.1 8.8 7 3.5-.1 4.9-2.3 9.1-2.3s5.5 2.3 9.2 2.2c3.8-.1 6.2-3.4 8.5-6.8 2.7-3.9 3.8-7.7 3.9-7.9-.1 0-7.3-2.8-7.5-10.9z"/>
</svg>`;

export const BUILTIN_ICONS: BuiltinIcon[] = [
  { id: "icon:whatsapp", name: "WhatsApp", category: "social", color: "#25D366", dataUri: makeSvgDataUri(whatsappSvg), svg: whatsappSvg },
  { id: "icon:instagram", name: "Instagram", category: "social", color: "#E1306C", dataUri: makeSvgDataUri(instagramSvg), svg: instagramSvg },
  { id: "icon:youtube", name: "YouTube", category: "social", color: "#FF0000", dataUri: makeSvgDataUri(youtubeSvg), svg: youtubeSvg },
  { id: "icon:x", name: "X / Twitter", category: "social", color: "#000000", dataUri: makeSvgDataUri(xTwitterSvg), svg: xTwitterSvg },
  { id: "icon:facebook", name: "Facebook", category: "social", color: "#1877F2", dataUri: makeSvgDataUri(facebookSvg), svg: facebookSvg },
  { id: "icon:tiktok", name: "TikTok", category: "social", color: "#000000", dataUri: makeSvgDataUri(tiktokSvg), svg: tiktokSvg },
  { id: "icon:linkedin", name: "LinkedIn", category: "social", color: "#0A66C2", dataUri: makeSvgDataUri(linkedinSvg), svg: linkedinSvg },
  { id: "icon:telegram", name: "Telegram", category: "social", color: "#229ED9", dataUri: makeSvgDataUri(telegramSvg), svg: telegramSvg },
  { id: "icon:wifi", name: "Wi-Fi", category: "utility", color: "#3B82F6", dataUri: makeSvgDataUri(wifiSvg), svg: wifiSvg },
  { id: "icon:location", name: "Location", category: "utility", color: "#EF4444", dataUri: makeSvgDataUri(locationSvg), svg: locationSvg },
  { id: "icon:globe", name: "Website", category: "utility", color: "#6366F1", dataUri: makeSvgDataUri(globeSvg), svg: globeSvg },
  { id: "icon:phone", name: "Phone", category: "utility", color: "#10B981", dataUri: makeSvgDataUri(phoneSvg), svg: phoneSvg },
  { id: "icon:mail", name: "Email", category: "utility", color: "#F59E0B", dataUri: makeSvgDataUri(mailSvg), svg: mailSvg },
  { id: "icon:spotify", name: "Spotify", category: "brand", color: "#1DB954", dataUri: makeSvgDataUri(spotifySvg), svg: spotifySvg },
  { id: "icon:github", name: "GitHub", category: "brand", color: "#181717", dataUri: makeSvgDataUri(githubSvg), svg: githubSvg },
  { id: "icon:google", name: "Google", category: "brand", color: "#4285F4", dataUri: makeSvgDataUri(googleSvg), svg: googleSvg },
  { id: "icon:apple", name: "Apple", category: "brand", color: "#000000", dataUri: makeSvgDataUri(appleSvg), svg: appleSvg },
  { id: "icon:pdf", name: "PDF Document", category: "utility", color: "#DC2626", dataUri: makeSvgDataUri(pdfSvg), svg: pdfSvg },
];

export function isBuiltinIcon(id: string | null | undefined): boolean {
  if (!id) return false;
  return id.startsWith("icon:");
}

export function getBuiltinIconById(id: string | null | undefined): BuiltinIcon | undefined {
  if (!id) return undefined;
  return BUILTIN_ICONS.find((icon) => icon.id === id);
}

export function getBuiltinIconDataUri(id: string | null | undefined): string | undefined {
  const icon = getBuiltinIconById(id);
  return icon ? icon.dataUri : undefined;
}
