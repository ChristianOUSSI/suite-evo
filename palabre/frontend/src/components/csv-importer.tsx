"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { apiCall } from "@/lib/client-api";
import { fcfa, longDate } from "@/lib/format";
import { Fleche } from "@/components/fleche";

type ParsedRow = {
  line: number;
  customer_name: string;
  phone: string;
  quartier: string;
  label: string;
  amount_due: number;
  due_on: string;
  notes: string;
  errors: string[];
  duplicate: { reference: string | null } | null;
};

type ImportCheck = {
  duplicates: { row: number; reference: string | null }[];
};

type ImportResult = {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
  invoices: string[];
};

const HEADER_ALIASES: Record<string, string> = {
  client: "customer_name",
  client_name: "customer_name",
  customer_name: "customer_name",
  nom: "customer_name",
  nom_client: "customer_name",
  phone: "phone",
  telephone: "phone",
  tel: "phone",
  numero: "phone",
  mobile: "phone",
  quartier: "quartier",
  quartier_client: "quartier",
  label: "label",
  objet: "label",
  designation: "label",
  description: "label",
  facture: "label",
  amount_due: "amount_due",
  montant: "amount_due",
  amount: "amount_due",
  somme: "amount_due",
  due_on: "due_on",
  echeance: "due_on",
  date_echeance: "due_on",
  notes: "notes",
  note: "notes",
  commentaire: "notes",
};

const REQUIRED = ["customer_name", "phone", "label", "amount_due", "due_on"];

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/).find((line) => line.trim() !== "");
  if (!firstLine) {
    return [];
  }
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const delimiter = semicolons >= commas && semicolons > 0 ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    if (quoted) {
      if (char === '"') {
        if (clean[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((line) => line.some((cell) => cell.trim() !== ""));
}

function parseAmount(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : Number.NaN;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function validIso(value: string): string | null {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3) {
    return null;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return validIso(`${iso[1]}-${iso[2]}-${iso[3]}`);
  }
  const french = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (french) {
    const year = french[3].length === 2 ? `20${french[3]}` : french[3];
    return validIso(`${year}-${pad(Number(french[2]))}-${pad(Number(french[1]))}`);
  }
  return null;
}

function rowFromCells(
  cells: string[],
  headers: string[],
  line: number,
): ParsedRow {
  const value = (name: string): string => {
    const index = headers.indexOf(name);
    return index >= 0 ? (cells[index] ?? "").trim() : "";
  };

  const customerName = value("customer_name");
  const phone = value("phone");
  const label = value("label");
  const amount = parseAmount(value("amount_due"));
  const due = parseDate(value("due_on"));
  const errors: string[] = [];

  if (customerName.length < 2) {
    errors.push("nom du client manquant");
  }
  if (!phone) {
    errors.push("téléphone manquant");
  }
  if (label.length < 2) {
    errors.push("objet manquant");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("montant illisible");
  } else if (amount > 500_000_000) {
    errors.push("montant au-delà du plafond");
  }
  if (!due) {
    errors.push("échéance illisible");
  }

  return {
    line,
    customer_name: customerName,
    phone,
    quartier: value("quartier"),
    label,
    amount_due: Number.isFinite(amount) ? amount : 0,
    due_on: due ?? "",
    notes: value("notes"),
    errors,
    duplicate: null,
  };
}

export function CsvImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validRows =
    rows?.filter((row) => row.errors.length === 0 && !row.duplicate) ?? [];
  const invalidRows = rows?.filter((row) => row.errors.length > 0) ?? [];
  const duplicateRows = rows?.filter((row) => row.duplicate) ?? [];

  async function readFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setFileError("");
    setRows(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Choisissez un fichier .csv. Le modèle est téléchargeable plus bas.");
      return;
    }
    if (file.size > 1_000_000) {
      setFileError("Le fichier dépasse 1 Mo. Découpez-le en plusieurs imports.");
      return;
    }

    const text = await file.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      setFileError("Le fichier est vide ou ne contient que la ligne d’en-tête.");
      return;
    }
    if (table.length > 501) {
      setFileError("Le carnet accepte 500 lignes par import. Découpez le fichier.");
      return;
    }

    const headers = table[0].map((header) => {
      const normalized = normalizeHeader(header);
      return HEADER_ALIASES[normalized] ?? normalized;
    });
    const missing = REQUIRED.filter((field) => !headers.includes(field));
    if (missing.length > 0) {
      setFileError(
        "Colonnes manquantes : " +
          missing
            .map((field) =>
              field === "customer_name"
                ? "client"
                : field === "amount_due"
                  ? "montant"
                  : field === "due_on"
                    ? "echeance"
                    : field === "label"
                      ? "objet"
                      : "telephone",
            )
            .join(", ") +
          ". Téléchargez le modèle pour partir d’une base juste.",
      );
      return;
    }

    const parsed = table
      .slice(1)
      .map((cells, index) => rowFromCells(cells, headers, index + 2));
    if (parsed.length === 0) {
      setFileError("Aucune ligne de créance n’a été trouvée.");
      return;
    }

    const candidates = parsed
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.errors.length === 0);
    if (candidates.length === 0) {
      setRows(parsed);
      return;
    }

    setChecking(true);
    try {
      const check = await apiCall<ImportCheck>("/invoices/import/check", {
        method: "POST",
        body: {
          rows: candidates.map(({ row }) => ({
            customer_name: row.customer_name,
            phone: row.phone,
            quartier: row.quartier,
            label: row.label,
            amount_due: row.amount_due,
            due_on: row.due_on,
            notes: row.notes,
          })),
        },
      });
      const found = new Map<number, string | null>();
      for (const duplicate of check.duplicates) {
        const source = candidates[duplicate.row - 1];
        if (source) {
          found.set(source.index, duplicate.reference);
        }
      }
      setRows(
        parsed.map((row, index) =>
          found.has(index)
            ? { ...row, duplicate: { reference: found.get(index) ?? null } }
            : row,
        ),
      );
    } catch {
      setRows(parsed);
    } finally {
      setChecking(false);
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void readFile(file);
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void readFile(file);
    }
  }

  async function importRows() {
    if (validRows.length === 0) {
      return;
    }
    setBusy(true);
    setFileError("");
    try {
      const payload = validRows.map((row) => ({
        customer_name: row.customer_name,
        phone: row.phone,
        quartier: row.quartier,
        label: row.label,
        amount_due: row.amount_due,
        due_on: row.due_on,
        notes: row.notes,
      }));
      const response = await apiCall<ImportResult>("/invoices/import", {
        method: "POST",
        body: { rows: payload },
      });
      setResult(response);
      setRows(null);
    } catch (cause) {
      setFileError(
        cause instanceof Error
          ? cause.message
          : "L’import n’a pas pu aboutir.",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFileName("");
    setRows(null);
    setResult(null);
    setFileError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="importer" aria-labelledby="importer-title">
      <div className="importer__head">
        <div>
          <span className="kicker kicker--plain">Le carnet entier</span>
          <h2 id="importer-title">Un CSV, plusieurs lignes.</h2>
          <p>
            Le fichier est vérifié ici, ligne par ligne, avant d’entrer au
            carnet. Rien n’est envoyé à l’aveugle.
          </p>
        </div>
        <span className="stamp importer__stamp">En lot</span>
      </div>

      {result ? (
        <div
          className={`importer__result${
            result.imported === 0 ? " importer__result--empty" : ""
          }`}
          role="status"
        >
          <span
            className={`stamp stamp--straight ${
              result.imported > 0 ? "stamp--moss" : "stamp--gold"
            }`}
          >
            {result.imported > 0 ? "Entré" : "Écarté"}
          </span>
          <p className="importer__result-title">
            {result.imported > 0
              ? `${result.imported} créance${result.imported > 1 ? "s" : ""} inscrite${result.imported > 1 ? "s" : ""}.`
              : "Rien n’est entré au carnet."}
          </p>
          <p className="importer__result-note">
            {result.imported > 0
              ? "Chaque ligne retenue a reçu sa référence et ses dates de relance."
              : "Les lignes signalées ci-dessous ont été écartées."}
          </p>
          {result.invoices.length > 0 && (
            <ul className="importer__refs">
              {result.invoices.slice(0, 6).map((reference) => (
                <li key={reference}>
                  <Link href={`/app/creances/${reference}`}>{reference}</Link>
                </li>
              ))}
              {result.invoices.length > 6 && (
                <li>et {result.invoices.length - 6} autres</li>
              )}
            </ul>
          )}
          {result.errors.length > 0 && (
            <ul className="importer__backend-errors">
              {result.errors.map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Ligne {error.row} : {error.message}
                </li>
              ))}
            </ul>
          )}
          <div className="importer__actions">
            <Link href="/app/creances" className="btn btn--small btn--ink">
              Voir le registre
            </Link>
            <button type="button" className="importer__link" onClick={reset}>
              Importer un autre fichier
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="visually-hidden"
            onChange={onChange}
          />
          <label
            htmlFor="csv-file"
            className={`importer__drop${dragging ? " is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="importer__drop-title">
              {fileName || "Poser le CSV ici"}
            </span>
            <span className="importer__drop-note">
              {checking
                ? "Vérification du carnet"
                : fileName
                  ? "Changer de fichier"
                  : "ou cliquer pour choisir un fichier"}
            </span>
          </label>

          {fileError && (
            <p className="notice notice--error importer__error" role="alert">
              {fileError}
            </p>
          )}

          {rows && (
            <>
              <div className="importer__summary">
                <span>
                  <strong>{validRows.length}</strong> prête
                  {validRows.length > 1 ? "s" : ""}
                </span>
                {invalidRows.length > 0 && (
                  <span className="is-warn">
                    <strong>{invalidRows.length}</strong> à corriger
                  </span>
                )}
                {duplicateRows.length > 0 && (
                  <span>
                    <strong>{duplicateRows.length}</strong> déjà au carnet
                  </span>
                )}
                <span>{rows.length} lignes lues</span>
              </div>

              <div className="importer__table-wrap">
                <table className="importer__table">
                  <thead>
                    <tr>
                      <th scope="col">Ligne</th>
                      <th scope="col">Client</th>
                      <th scope="col">Montant</th>
                      <th scope="col">Échéance</th>
                      <th scope="col">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 7).map((row) => (
                      <tr
                        key={row.line}
                        className={
                          row.errors.length > 0
                            ? "is-invalid"
                            : row.duplicate
                              ? "is-duplicate"
                              : ""
                        }
                      >
                        <td>{row.line}</td>
                        <td>
                          {row.customer_name || "Sans nom"}
                          <small>{row.label || "Objet vide"}</small>
                        </td>
                        <td className="money">
                          {row.amount_due > 0 ? fcfa(row.amount_due) : "-"}
                        </td>
                        <td>
                          {row.due_on ? longDate(row.due_on) : "Illisible"}
                        </td>
                        <td>
                          {row.errors.length > 0 ? (
                            <span className="importer__ko">
                              {row.errors[0]}
                            </span>
                          ) : row.duplicate ? (
                            <span className="importer__dup">
                              {row.duplicate.reference
                                ? "Déjà au carnet"
                                : "Doublon du fichier"}
                              {row.duplicate.reference && (
                                <small>{row.duplicate.reference}</small>
                              )}
                            </span>
                          ) : (
                            <span className="importer__ok">Prête</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 7 && (
                  <p className="importer__table-more">
                    Les {rows.length - 7} autres lignes suivront le même
                    contrôle.
                  </p>
                )}
              </div>

              {invalidRows.length > 0 && (
                <div className="importer__corrections">
                  <span className="eyebrow">À corriger dans le fichier</span>
                  <ul>
                    {invalidRows.slice(0, 4).map((row) => (
                      <li key={row.line}>
                        Ligne {row.line} : {row.errors.join(", ")}.
                      </li>
                    ))}
                  </ul>
                  <p>
                    Les lignes en erreur seront ignorées. Corrigez le fichier
                    puis rechargez-le pour tout faire entrer.
                  </p>
                </div>
              )}

              {duplicateRows.length > 0 && (
                <div className="importer__corrections importer__corrections--quiet">
                  <span className="eyebrow">Déjà au carnet</span>
                  <ul>
                    {duplicateRows.slice(0, 4).map((row) => (
                      <li key={row.line}>
                        Ligne {row.line} :{" "}
                        {row.duplicate?.reference
                          ? `inscrite sous ${row.duplicate.reference}.`
                          : "double une autre ligne du fichier."}
                      </li>
                    ))}
                  </ul>
                  <p>
                    Ces lignes ne seront pas reprises. Le reste du fichier
                    peut entrer sans les toucher.
                  </p>
                </div>
              )}

              <div className="importer__actions">
                <button
                  type="button"
                  className="btn btn--ink"
                  onClick={importRows}
                  disabled={busy || validRows.length === 0}
                >
                  {busy
                    ? "Import en cours"
                    : `Importer ${validRows.length} ligne${validRows.length > 1 ? "s" : ""}`}
                  <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
                </button>
                <button
                  type="button"
                  className="importer__link"
                  onClick={reset}
                  disabled={busy}
                >
                  Changer de fichier
                </button>
              </div>
            </>
          )}

          <div className="importer__format">
            <span className="eyebrow">Le modèle</span>
            <p>
              Sept colonnes, une ligne par créance : client, telephone,
              quartier, objet, montant, echeance, notes. Les dates acceptent
              AAAA-MM-JJ ou JJ/MM/AAAA.
            </p>
            <a
              href="/modele-import.csv"
              download
              className="text-link"
            >
              Télécharger le modèle CSV
            </a>
          </div>
        </>
      )}
    </section>
  );
}
