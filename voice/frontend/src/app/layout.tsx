import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CADC VOICE, le standard qui répond",
  description:
    "Un standard téléphonique tenu par la voix pour les universités, écoles et " +
    "cliniques du Cameroun. Réponses, rendez-vous au guichet, messages et rappels.",
};

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
