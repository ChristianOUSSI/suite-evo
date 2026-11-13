"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiCall } from "@/lib/client-api";
import { fcfa } from "@/lib/format";
import type { Merchant, SettingsPayload } from "@/lib/types";
import { Fleche } from "@/components/fleche";

type ChannelKey = "sms" | "whatsapp" | "voice";

type Tone = "courtois" | "ferme";

type Props = {
  merchant: Merchant;
  pricing: SettingsPayload["pricing"];
  demoMode: boolean;
};

type Notice = { kind: "success" | "error"; text: string };

const CHANNEL_COPY: Record<
  ChannelKey,
  { label: string; summary: string }
> = {
  sms: {
    label: "SMS",
    summary: "Court, lisible sans data. Le canal de secours.",
  },
  whatsapp: {
    label: "WhatsApp",
    summary: "Le lien de paiement arrive dans la conversation.",
  },
  voice: {
    label: "Vocal",
    summary: "Une voix locale lit le message, avec le ton du carnet.",
  },
};

export function SettingsForm({ merchant, pricing, demoMode }: Props) {
  const router = useRouter();
  const [identity, setIdentity] = useState({
    name: merchant.name,
    owner_name: merchant.owner_name,
    phone: merchant.phone_display,
    quartier: merchant.quartier,
    monthly_target: String(merchant.monthly_target),
  });
  const [tone, setTone] = useState<Tone>(merchant.tone);
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    sms: merchant.sms_enabled,
    whatsapp: merchant.whatsapp_enabled,
    voice: merchant.voice_enabled,
  });
  const [auto, setAuto] = useState(merchant.auto_reminders);
  const [daily, setDaily] = useState(merchant.daily_report);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const activeChannels = Number(channels.sms) + Number(channels.whatsapp) + Number(channels.voice);
  const target = Number(identity.monthly_target) || 0;

  function updateIdentity(field: keyof typeof identity, value: string) {
    setNotice(null);
    setIdentity((current) => ({ ...current, [field]: value }));
  }

  function chooseTone(next: Tone) {
    setNotice(null);
    setTone(next);
  }

  function toggleChannel(key: ChannelKey) {
    const next = { ...channels, [key]: !channels[key] };
    if (!next.sms && !next.whatsapp && !next.voice) {
      setNotice({
        kind: "error",
        text: "Gardez au moins un canal actif pour que le carnet puisse parler.",
      });
      return;
    }
    setNotice(null);
    setChannels(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeChannels === 0) {
      setNotice({
        kind: "error",
        text: "Gardez au moins un canal de relance actif.",
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const saved = await apiCall<SettingsPayload>("/settings", {
        method: "PATCH",
        body: {
          name: identity.name,
          owner_name: identity.owner_name,
          phone: identity.phone,
          quartier: identity.quartier,
          monthly_target: target,
          tone,
          sms_enabled: channels.sms,
          whatsapp_enabled: channels.whatsapp,
          voice_enabled: channels.voice,
          auto_reminders: auto,
          daily_report: daily,
        },
      });
      const savedMerchant = saved.merchant;
      setIdentity({
        name: savedMerchant.name,
        owner_name: savedMerchant.owner_name,
        phone: savedMerchant.phone_display,
        quartier: savedMerchant.quartier,
        monthly_target: String(savedMerchant.monthly_target),
      });
      setTone(savedMerchant.tone);
      setChannels({
        sms: savedMerchant.sms_enabled,
        whatsapp: savedMerchant.whatsapp_enabled,
        voice: savedMerchant.voice_enabled,
      });
      setAuto(savedMerchant.auto_reminders);
      setDaily(savedMerchant.daily_report);
      setNotice({
        kind: "success",
        text: "Réglages enregistrés. Le carnet est à jour.",
      });
      router.refresh();
    } catch (cause) {
      setNotice({
        kind: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "Les réglages n’ont pas pu être enregistrés.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-grid">
      <form className="settings-sheet" onSubmit={submit}>
        <section className="settings-section" aria-labelledby="maison-title">
          <div className="settings-section__head">
            <span className="settings-section__index">01</span>
            <div>
              <h2 id="maison-title">La maison</h2>
              <p>Ce que le client lit en haut de chaque message.</p>
            </div>
          </div>
          <div className="form-grid settings-fields">
            <div className="field">
              <label htmlFor="merchant-name">Nom du commerce</label>
              <input
                id="merchant-name"
                type="text"
                minLength={2}
                maxLength={140}
                value={identity.name}
                onChange={(event) =>
                  updateIdentity("name", event.target.value)
                }
                required
              />
            </div>
            <div className="field">
              <label htmlFor="owner-name">Nom du patron</label>
              <input
                id="owner-name"
                type="text"
                minLength={2}
                maxLength={120}
                value={identity.owner_name}
                onChange={(event) =>
                  updateIdentity("owner_name", event.target.value)
                }
                required
              />
            </div>
            <div className="field">
              <label htmlFor="merchant-phone">Téléphone</label>
              <input
                id="merchant-phone"
                type="tel"
                value={identity.phone}
                onChange={(event) =>
                  updateIdentity("phone", event.target.value)
                }
                required
              />
            </div>
            <div className="field">
              <label htmlFor="merchant-quartier">Quartier</label>
              <input
                id="merchant-quartier"
                type="text"
                maxLength={100}
                value={identity.quartier}
                onChange={(event) =>
                  updateIdentity("quartier", event.target.value)
                }
              />
            </div>
            <div className="field field--full">
              <label htmlFor="monthly-target">Objectif du mois</label>
              <input
                id="monthly-target"
                type="number"
                min={1}
                max={500_000_000}
                step={1}
                value={identity.monthly_target}
                onChange={(event) =>
                  updateIdentity("monthly_target", event.target.value)
                }
                required
              />
              <span className="field__help">
                Il sert à mesurer l’avancement du journal, jamais à fixer une
                prime.
              </span>
            </div>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="voix-title">
          <div className="settings-section__head">
            <span className="settings-section__index">02</span>
            <div>
              <h2 id="voix-title">La voix</h2>
              <p>Le ton des relances et le moment où elles partent.</p>
            </div>
          </div>

          <div className="tone-picker" role="radiogroup" aria-label="Ton des relances">
            <label
              className={`tone-choice${tone === "courtois" ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="tone"
                value="courtois"
                checked={tone === "courtois"}
                onChange={() => chooseTone("courtois")}
              />
              <span className="tone-choice__name">Courtois</span>
              <span className="tone-choice__copy">
                Une porte ouverte au contretemps, puis le lien de paiement. Le
                ton de la maison.
              </span>
            </label>
            <label
              className={`tone-choice${tone === "ferme" ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="tone"
                value="ferme"
                checked={tone === "ferme"}
                onChange={() => chooseTone("ferme")}
              />
              <span className="tone-choice__name">Ferme</span>
              <span className="tone-choice__copy">
                Le solde et la date, sans menace ni détour. Pour les dossiers
                qui traînent.
              </span>
            </label>
          </div>

          <div className="setting-toggle">
            <div className="setting-toggle__copy">
              <strong>Le pilote automatique</strong>
              <small>
                Prépare les cinq relances autour de chaque échéance. Sans lui,
                tout se fait à la main.
              </small>
            </div>
            <label className="switch">
              <span className="visually-hidden">
                Activer le pilote automatique
              </span>
              <input
                type="checkbox"
                checked={auto}
                onChange={() => {
                  setNotice(null);
                  setAuto(!auto);
                }}
              />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__text">
                {auto ? "Actif" : "En pause"}
              </span>
            </label>
          </div>

          <div className="setting-toggle">
            <div className="setting-toggle__copy">
              <strong>Le point du soir</strong>
              <small>
                Ajoute une note de clôture dans le journal : encaissements du
                mois, promesses à échéance, tournée du jour.
              </small>
            </div>
            <label className="switch">
              <span className="visually-hidden">
                Afficher le point du soir
              </span>
              <input
                type="checkbox"
                checked={daily}
                onChange={() => {
                  setNotice(null);
                  setDaily(!daily);
                }}
              />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__text">
                {daily ? "Affiché" : "Masqué"}
              </span>
            </label>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="canaux-title">
          <div className="settings-section__head">
            <span className="settings-section__index">03</span>
            <div>
              <h2 id="canaux-title">Les canaux</h2>
              <p>
                Au moins un canal reste ouvert. Si l’un tombe, le message
                bascule sur le suivant.
              </p>
            </div>
          </div>

          <div className="channel-list">
            {(Object.keys(CHANNEL_COPY) as ChannelKey[]).map((key) => {
              const active = channels[key];
              return (
                <div
                  className={`channel-choice${active ? " is-on" : ""}`}
                  key={key}
                >
                  <span
                    className={`channel-choice__dot channel-choice__dot--${key}`}
                    aria-hidden="true"
                  />
                  <div className="channel-choice__copy">
                    <strong>{CHANNEL_COPY[key].label}</strong>
                    <small>{CHANNEL_COPY[key].summary}</small>
                  </div>
                  <label className="switch">
                    <span className="visually-hidden">
                      Activer le canal {CHANNEL_COPY[key].label}
                    </span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleChannel(key)}
                    />
                    <span className="switch__track" aria-hidden="true" />
                    <span className="switch__text">
                      {active ? "Ouvert" : "Fermé"}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
          <p className="settings-channels-note">
            {activeChannels} {activeChannels > 1 ? "canaux ouverts" : "canal ouvert"} sur 3.
          </p>
        </section>

        {notice && (
          <p
            className={`notice notice--${notice.kind} settings-notice`}
            role={notice.kind === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}

        <footer className="settings-save">
          <button type="submit" className="btn btn--ink" disabled={busy}>
            {busy ? "Enregistrement" : "Enregistrer les réglages"}
            <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
          </button>
          <p>
            Le passé ne bouge pas. Les relances encore programmées et l’en-tête
            des prochains messages prennent les nouveaux réglages.
          </p>
        </footer>
      </form>

      <aside className="settings-rail">
        <section className="signature-card" aria-labelledby="signature-title">
          <span className="kicker kicker--plain">L’en-tête</span>
          <h3 id="signature-title">
            {identity.name.trim() || "Nom du commerce"}
          </h3>
          <p className="signature-card__owner">
            {identity.owner_name.trim() || "Nom du patron"}
          </p>
          <dl>
            <div>
              <dt>Téléphone</dt>
              <dd>{identity.phone.trim() || "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Quartier</dt>
              <dd>{identity.quartier.trim() || "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Objectif</dt>
              <dd>{fcfa(target)}</dd>
            </div>
            <div>
              <dt>Ton</dt>
              <dd>{tone === "ferme" ? "Ferme" : "Courtois"}</dd>
            </div>
          </dl>
          <p className="signature-card__note">
            Voilà ce que lit le client au bas d’un SMS ou d’un message
            WhatsApp.
          </p>
        </section>

        <section className="plan-card" aria-labelledby="plan-title">
          <div className="plan-card__head">
            <span className="kicker kicker--plain">Le plan</span>
            <span className="stamp stamp--straight">Essentiel</span>
          </div>
          <h3 id="plan-title">{pricing.plan_name}</h3>
          <p className="plan-card__price">
            {fcfa(pricing.subscription)}
            <small> / mois</small>
          </p>
          <dl>
            <div>
              <dt>Commission</dt>
              <dd>{pricing.fee_rate} % par règlement</dd>
            </div>
            <div>
              <dt>Engagement</dt>
              <dd>aucun</dd>
            </div>
            <div>
              <dt>Clients</dt>
              <dd>illimités</dd>
            </div>
          </dl>
          {demoMode && (
            <p className="plan-card__demo">
              Démonstration en cours. Aucun prélèvement n’est réellement
              effectué.
            </p>
          )}
        </section>

        <section className="effects-card" aria-labelledby="effects-title">
          <span className="eyebrow" id="effects-title">
            Ce qui change
          </span>
          <ul>
            <li>
              <strong>Le ton</strong> réécrit les relances encore programmées.
            </li>
            <li>
              <strong>Un canal fermé</strong> retire ses étapes et laisse les
              autres parler.
            </li>
            <li>
              <strong>L’objectif</strong> déplace la jauge du mois dans le
              journal.
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
