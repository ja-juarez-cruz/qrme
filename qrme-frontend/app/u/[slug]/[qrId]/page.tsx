import QRPageClient from './QRPageClient';

// Placeholder para satisfacer Next.js static export.
// Las páginas reales se renderizan en el cliente usando useParams().
export function generateStaticParams() {
  return [{ slug: '_', qrId: '_' }];
}

export default function PublicQRPage() {
  return <QRPageClient />;
}
