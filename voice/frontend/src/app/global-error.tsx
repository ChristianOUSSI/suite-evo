"use client";

// Dernier filet du standard : cet écran remplace la racine du document, donc il
// porte ses propres styles. Sans lui, c'est l'écran du framework, en anglais,
// que l'opératrice lit quand la console refuse de rendre une page.
export default function IncidentRacine({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          background: "#10151a",
          color: "#e3e9ee",
          fontFamily: "Karla, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "5rem 1.5rem" }}>
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#9db0bf",
            }}
          >
            Standard fermé
          </p>
          <h1
            style={{
              fontFamily: "Newsreader, Georgia, serif",
              fontSize: "2.3rem",
              lineHeight: 1.05,
              margin: "0.9rem 0 1rem",
              fontWeight: 500,
            }}
          >
            Rien n&apos;a pu être lu.
          </h1>
          <p style={{ color: "#9db0bf", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Le registre du standard n&apos;a pas rendu cette page. Vérifie que le
            service est démarré sur le port attendu, puis reprends ici. Les
            appels déjà consignés t&apos;attendent.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.6rem",
              minHeight: "2.85rem",
              padding: "0.62rem 1.1rem",
              border: "1px solid #f0a63c",
              background: "#f0a63c",
              color: "#10151a",
              fontFamily: "inherit",
              fontSize: "0.86rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reprendre la lecture
          </button>
        </div>
      </body>
    </html>
  );
}
