import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR.me — Tu identidad en un código",
  description: "Crea códigos QR personales vinculados a tu perfil digital. Imprime, comparte y conecta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
