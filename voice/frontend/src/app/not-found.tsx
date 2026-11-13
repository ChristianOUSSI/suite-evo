import Link from "next/link";
import "./styles/perdu.css";

export default function Introuvable() {
  return (
    <main className="perdu">
      <p className="code">404</p>
      <h1>Cette page n'est pas au standard</h1>
      <p className="dit">
        Le lien demandé n'existe pas, ou la fiche a été retirée depuis. Le
        standard téléphonique, lui, continue de décrocher.
      </p>
      <div className="issues">
        <Link className="bouton" href="/connexion">
          Ouvrir la console
        </Link>
        <Link className="bouton sobre" href="/">
          Revoir ce que fait le standard
        </Link>
      </div>
    </main>
  );
}
