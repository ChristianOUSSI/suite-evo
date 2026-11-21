"use client";

import { canoniseTelephone } from "@/lib/format";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";

// Le +237 est hors champ : la caissière ne tape que les neuf chiffres.
export function ChampTelephone({
  id,
  label,
  value,
  onChange,
  aide,
  requis = false,
  langue = LANGUE_DEFAUT,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (canonique: string) => void;
  aide?: string;
  requis?: boolean;
  langue?: Langue;
}) {
  const invalide = value.trim() !== "" && canoniseTelephone(value) === null;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <span className="field__tel">
        <span aria-hidden="true">+237</span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="6 99 30 77 24"
          required={requis}
          aria-invalid={invalide || undefined}
          aria-describedby={aide ? `${id}-aide` : undefined}
        />
      </span>
      {aide || invalide ? (
        <span className="field__aide" id={aide ? `${id}-aide` : undefined}>
          {invalide
            ? t("tel.aide", langue)
            : aide}
        </span>
      ) : null}
    </div>
  );
}
