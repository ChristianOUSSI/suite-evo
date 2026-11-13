import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/session";

import "../../styles/login.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ouvrir le carnet",
  description:
    "Entrez dans la démonstration PALABRE avec le carnet de la Quincaillerie Nana & Fils.",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  return (
    <div className="auth">
      <aside className="auth__side">
        <div className="auth__side-inner">
          <Wordmark light />
          <div className="auth__promise">
            <span className="kicker kicker--light">
              Le carnet des comptes
            </span>
            <h1>
              Chaque franc échu a une date, un nom, et une prochaine étape.
            </h1>
            <p>
              Pas de tableau de bord pour faire joli. Une feuille de comptes,
              des relances qui partent au bon moment, et une caisse qui sait ce
              qui est rentré.
            </p>
          </div>

          <div className="auth__excerpt">
            <div className="auth__excerpt-head">
              <span>Quincaillerie Nana &amp; Fils</span>
              <span>Mboppi</span>
            </div>
            <dl>
              <div>
                <dt>Encours clients</dt>
                <dd>5 255 000 FCFA</dd>
              </div>
              <div>
                <dt>Dont échu</dt>
                <dd>4 190 000 FCFA</dd>
              </div>
              <div>
                <dt>Promesses en cours</dt>
                <dd>02</dd>
              </div>
            </dl>
            <span className="stamp stamp--moss auth__stamp">
              Démonstration
            </span>
          </div>

          <p className="auth__side-foot">
            Atelier CADC · Douala · Données fictives
          </p>
        </div>
      </aside>

      <main className="auth__main" id="contenu">
        <div className="auth__top">
          <Link href="/" className="text-link">
            ← Retour à la présentation
          </Link>
          <span>Édition de démonstration</span>
        </div>

        <div className="auth__panel">
          <span className="kicker">Ouverture du carnet</span>
          <h2>Reprenez votre comptoir.</h2>
          <p className="auth__lede">
            Le carnet de la Quincaillerie Nana &amp; Fils est déjà rempli.
            Ouvrez-le pour suivre les créances, lancer une tournée de relances
            et encaisser un règlement fictif.
          </p>
          <LoginForm />
        </div>

        <p className="auth__legal">
          PALABRE est présenté ici en démonstration. Aucun paiement réel n’est
          effectué et aucun message n’est envoyé à un client.
        </p>
      </main>
    </div>
  );
}
