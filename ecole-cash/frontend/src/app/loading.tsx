import { EcoleCashMark } from "@/components/brand";

export default function Chargement() {
  return (
    <div className="chargement" aria-live="polite">
      <EcoleCashMark title="ÉCOLE CASH" className="brand__mark" />
      <span className="chargement__note">La caisse ouvre…</span>
    </div>
  );
}
