"use client";

// Dernier filet : cet écran remplace la racine du document, donc il porte ses
// propres styles. Il doit rester en français et dans les couleurs de la caisse,
// sinon c'est le message du framework qui parle à la place de l'école.
export default function IncidentRacine({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          background: "#e7ebe3",
          color: "#12312a",
          fontFamily: "Barlow, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "5rem 1.5rem" }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              border: "1px solid currentColor",
              borderLeftWidth: "3px",
              display: "inline-block",
              padding: "0.24rem 0.58rem",
              color: "#35564d",
            }}
          >
            Caisse fermée
          </p>
          <h1
            style={{
              fontFamily: "Fraunces, 'Times New Roman', serif",
              fontSize: "2.4rem",
              lineHeight: 1,
              marginTop: "1.1rem",
              fontWeight: 500,
            }}
          >
            Rien n&apos;a pu être lu.
          </h1>
          <p style={{ color: "#35564d", fontSize: "0.92rem", lineHeight: 1.6 }}>
            Le registre de l&apos;école n&apos;a pas rendu cette feuille.
            Vérifie qu&apos;il est démarré sur le port attendu, puis repasse par
            ici.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.6rem",
              minHeight: "2.85rem",
              padding: "0.62rem 1.1rem",
              border: "1px solid #12312a",
              background: "#12312a",
              color: "#e7ebe3",
              fontFamily: "inherit",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Repasser
          </button>
        </div>
      </body>
    </html>
  );
}
