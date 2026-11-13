"use client";

/**
 * Le dernier filet.
 *
 * Si la racine elle-même casse, plus aucun CSS n'est garanti : cet écran se
 * suffit avec des styles écrits à la main, dans les deux langues, et le
 * message technique ne sort jamais à l'écran.
 */
export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 24,
          background: "#e9eef3",
          color: "#0e1d2b",
          font: "17px/1.55 'Public Sans', 'Segoe UI', Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.7rem", margin: "0 0 10px" }}>Le registre est fermé</h1>
          <p style={{ margin: "0 0 10px", color: "#1d3346" }}>
            {"Une page n'a pas pu s'ouvrir. Rien n'a été écrit : les patients vus"}{" "}
            {"et les paiements encaissés tiennent dans le registre."}
          </p>
          <p style={{ margin: "0 0 18px", color: "#1d3346" }}>
            The register could not open this page. Nothing was written: patients
            seen and payments collected stay in the register.
          </p>
          {error.digest ? (
            <p style={{ margin: "0 0 18px", fontSize: "0.82rem", color: "#3c556e" }}>
              Repère pour l&apos;agence / reference for the agency : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "12px 20px",
              border: "1px solid #0e1d2b",
              borderRadius: 10,
              background: "#0e1d2b",
              color: "#f2f6f9",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Réessayer / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
