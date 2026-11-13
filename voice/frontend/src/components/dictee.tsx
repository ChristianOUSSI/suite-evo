import { etiquetteDictee } from "@/lib/format";

const TOURS: Record<string, string> = {
  voix: "voix",
  voice: "voix",
  téléphone: "appelant",
  phone: "appelant",
  sms: "poste",
  whatsapp: "poste",
  poste: "poste",
  bip: "silence",
};

export function Dictee({ lignes }: { lignes: string[] }) {
  return (
    <div className="dictee">
      {lignes.map((ligne, index) => {
        const { qui, texte } = etiquetteDictee(ligne);
        const classe = TOURS[qui] ?? "poste";
        return (
          <div className={`tour ${classe}`} key={`${index}-${qui}`}>
            <span className="qui">
              {qui === "bip" ? ligne.slice(0, 3) : qui}
            </span>
            <span className="texte">
              {qui === "bip" ? ligne.slice(5) : texte}
            </span>
          </div>
        );
      })}
    </div>
  );
}
