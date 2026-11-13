"use client";

// Dernier filet du carnet : cet écran remplace la racine du document, donc il
// porte ses propres styles. Sans lui, c'est le message du framework, en anglais,
// que le commerçant lit quand le registre refuse de rendre une page.
export default function RootIncident({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          background: "#e9edf2",
          color: "#142a44",
          fontFamily: "Archivo, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "5rem 1.5rem" }}>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              border: "1px solid currentColor",
              borderLeftWidth: "3px",
              display: "inline-block",
              padding: "0.24rem 0.58rem",
              color: "#3a5271",
            }}
          >
            Carnet fermé
          </p>
          <h1
            style={{
              fontFamily: "'Bodoni Moda', 'Times New Roman', serif",
              fontSize: "2.4rem",
              lineHeight: 1,
              marginTop: "1.1rem",
              fontWeight: 500,
            }}
          >
            Rien n&apos;a pu être lu.
          </h1>
          <p style={{ color: "#3a5271", fontSize: "0.92rem", lineHeight: 1.6 }}>
            Le registre n&apos;a pas rendu cette page. Vérifiez que le service
            PALABRE est démarré sur le port attendu, puis reprenez ici. Vos
            écritures restent dans le carnet.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.6rem",
              minHeight: "2.85rem",
              padding: "0.62rem 1.1rem",
              border: "1px solid #142a44",
              background: "#142a44",
              color: "#e9edf2",
              fontFamily: "inherit",
              fontSize: "0.82rem",
              fontWeight: 600,
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
