"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import type { RelancesLancees, RelancesProgrammees } from "@/lib/types";

export function PilotageRelances({
  aEnvoyer,
  canaux,
}: {
  aEnvoyer: number;
  canaux: { whatsapp: boolean; sms: boolean };
}) {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function lancer(action: "programmer" | "lancer") {
    setEnCours(action);
    setMessage(null);
    try {
      if (action === "programmer") {
        const rendu = await ecrire<RelancesProgrammees>(
          "/relances/programmer",
          { method: "POST" },
        );
        setMessage(
          `${rendu.posees} avis posés pour ${rendu.annee}. Rien n'est encore parti.`,
        );
      } else {
        const rendu = await ecrire<RelancesLancees>("/relances/lancer", {
          method: "POST",
        });
        setMessage(
          rendu.envoyees === 0 && rendu.annulees === 0
            ? "Rien à envoyer ce jour : aucun avis n'était à sa date."
            : `${rendu.envoyees} avis écrits sur ${rendu.canal}, ${rendu.annulees} devenus inutiles, ${rendu.suspendus} familles suspendues.`,
        );
      }
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : "La caisse n'a pas répondu.",
      );
    } finally {
      setEnCours(null);
    }
  }

  return (
    <section className="sheet bloc" aria-label="Pilotage des relances">
      <div className="section-head">
        <h2>Le tourniquet</h2>
        <span className="section-head__aside">
          {canaux.whatsapp ? "WhatsApp" : canaux.sms ? "SMS" : "canaux coupés"}
        </span>
      </div>

      {message ? (
        <p className="notice" role="status" style={{ marginTop: "1rem" }}>
          {message}
        </p>
      ) : null}

      <div className="paire-boutons" style={{ marginTop: "1.1rem" }}>
        <button
          type="button"
          className="btn"
          onClick={() => lancer("programmer")}
          disabled={enCours !== null}
        >
          <Icone nom="journal" taille={15} />
          {enCours === "programmer" ? "Calcul…" : "Poser le calendrier"}
        </button>
        <button
          type="button"
          className="btn btn--stamp"
          onClick={() => lancer("lancer")}
          disabled={enCours !== null || !canaux.whatsapp}
          title={
            !canaux.whatsapp
              ? "WhatsApp est coupé dans les réglages"
              : "Écrire les avis dus aujourd'hui"
          }
        >
          <Icone nom="relance" taille={15} />
          {enCours === "lancer" ? "Envoi…" : `Lancer ${aEnvoyer} avis`}
        </button>
      </div>

      <p className="vide-note" style={{ marginTop: "1rem" }}>
        Quatre paliers par terme : le rappel avant, le jour dit, le premier
        retard, le dernier avis. Le troisième palier suspend l&apos;élève.{" "}
        <Link href="/app/reglages#ton" className="text-link">
          Régler le ton et les délais
        </Link>
      </p>

      <MentionDemo texte="Démo : les avis sont datés, consignés et marqués envoyés dans la machine. Aucun téléphone de parent reçoit quoi que ce soit." />
    </section>
  );
}
