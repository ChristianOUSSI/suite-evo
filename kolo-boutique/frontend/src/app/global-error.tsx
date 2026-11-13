"use client";

// Dernier filet : cet écran remplace la racine du document, donc il porte ses
// propres styles. Il doit rester en français et dans les couleurs du comptoir.
export default function IncidentRacine({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          background: "#ece4d8",
          color: "#2a1e18",
          fontFamily: "'Public Sans', Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "5rem 1.5rem" }}>
          <p
            style={{
              fontFamily: "'Red Hat Mono', monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              border: "1px solid currentColor",
              borderLeftWidth: "3px",
              display: "inline-block",
              padding: "0.22rem 0.55rem",
              color: "#55433a",
            }}
          >
            Comptoir fermé
          </p>
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: "2.4rem",
              lineHeight: 1,
              margin: "1rem 0",
              fontWeight: 400,
            }}
          >
            Rien n&apos;a pu être lu.
          </h1>
          <p style={{ color: "#55433a", fontSize: "0.92rem", lineHeight: 1.6 }}>
            Le cahier n&apos;a pas rendu cette page. Vérifie que le service est
            démarré sur le port attendu, puis reprends ici. Tes écritures
            t&apos;attendent.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              minHeight: "2.85rem",
              padding: "0.6rem 1.05rem",
              border: "1px solid #2a1e18",
              background: "#2a1e18",
              color: "#ece4d8",
              fontFamily: "inherit",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reprendre
          </button>
        </div>
      </body>
    </html>
  );
}
