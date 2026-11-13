"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiCall } from "@/lib/client-api";
import type { RunSummary } from "@/lib/types";
import { Fleche } from "@/components/fleche";

const CHANNEL_NAMES: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  voice: "Vocal",
};

function channelList(byChannel: Record<string, number>): string {
  const parts = Object.entries(byChannel).map(
    ([key, count]) => `${CHANNEL_NAMES[key] ?? key} ${count}`,
  );
  return parts.length > 0 ? parts.join(" · ") : "aucun canal";
}

export function RelanceRunner({ dueCount }: { dueCount: number }) {
  const router = useRouter();
  const [preview, setPreview] = useState<RunSummary | null>(null);
  const [result, setResult] = useState<RunSummary | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [error, setError] = useState("");

  async function prepare() {
    setBusy("preview");
    setError("");
    setResult(null);
    try {
      const summary = await apiCall<RunSummary>("/reminders/run?dry_run=true", {
        method: "POST",
      });
      setPreview(summary);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La tournée n’a pas pu être préparée.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    setBusy("send");
    setError("");
    try {
      const summary = await apiCall<RunSummary>("/reminders/run", {
        method: "POST",
      });
      setPreview(null);
      setResult(summary);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Les relances n’ont pas pu être envoyées.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="runner" id="tournee" aria-labelledby="runner-title">
      <div className="runner__head">
        <span className="kicker kicker--light">La tournée du jour</span>
        <span className="stamp runner__stamp">Simulation</span>
      </div>

      <p className="runner__figure">{dueCount}</p>
      <h2 id="runner-title">
        {dueCount === 0
          ? "Rien à sortir aujourd’hui."
          : `${dueCount} relance${dueCount > 1 ? "s" : ""} à envoyer.`}
      </h2>
      <p className="runner__lede">
        Le carnet rassemble les messages arrivés à date et n’en garde qu’un par
        client. Les échéances dépassées ne s’empilent pas.
      </p>

      {error && (
        <p className="runner__error" role="alert">
          {error}
        </p>
      )}

      {result ? (
        <div className="runner__done">
          <p>
            <strong>{result.sent}</strong>{" "}
            {result.sent > 1 ? "relances envoyées" : "relance envoyée"}
            {result.skipped > 0
              ? `, ${result.skipped} doublon${result.skipped > 1 ? "s" : ""} écarté${result.skipped > 1 ? "s" : ""}`
              : ""}
            .
          </p>
          <p className="runner__done-meta">{channelList(result.by_channel)}</p>
          <button
            type="button"
            className="runner__close"
            onClick={() => setResult(null)}
          >
            Fermer
          </button>
        </div>
      ) : preview ? (
        <div className="runner__preview">
          <div className="runner__preview-head">
            <span>Avant envoi</span>
            <span>
              {preview.sent} message{preview.sent > 1 ? "s" : ""} ·{" "}
              {channelList(preview.by_channel)}
            </span>
          </div>

          {preview.items.length === 0 ? (
            <p className="runner__preview-empty">
              Aucun message n’est dû pour l’instant. Rien ne sera envoyé.
            </p>
          ) : (
            <ul className="runner__list">
              {preview.items.slice(0, 4).map((item) => (
                <li key={`${item.invoice_reference}-${item.channel}`}>
                  <div className="runner__list-line">
                    <strong>{item.customer_name}</strong>
                    <span>
                      {CHANNEL_NAMES[item.channel] ?? item.channel} ·{" "}
                      {item.invoice_reference}
                    </span>
                  </div>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          )}
          {preview.items.length > 4 && (
            <p className="runner__more">
              Et {preview.items.length - 4} autre
              {preview.items.length - 4 > 1 ? "s" : ""} message
              {preview.items.length - 4 > 1 ? "s" : ""} dans la tournée.
            </p>
          )}

          <div className="runner__actions">
            <button
              type="button"
              className="btn btn--stamp"
              onClick={send}
              disabled={busy !== null || preview.sent === 0}
            >
              {busy === "send"
                ? "Envoi en cours"
                : `Envoyer ${preview.sent} message${preview.sent > 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              className="btn runner__cancel"
              onClick={() => setPreview(null)}
              disabled={busy !== null}
            >
              Revoir plus tard
            </button>
          </div>
          <p className="runner__recheck">
            L’envoi refait le calcul au moment même. Un doublon écarté ici le
            reste.
          </p>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--stamp btn--block runner__prepare"
          onClick={prepare}
          disabled={busy !== null}
        >
          {busy === "preview" ? "Préparation" : "Préparer la tournée"}
          <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
        </button>
      )}

      <p className="runner__fine">
        Démonstration : les SMS, messages WhatsApp et appels sont simulés.
        Aucun numéro n’est réellement contacté.
      </p>
    </section>
  );
}
