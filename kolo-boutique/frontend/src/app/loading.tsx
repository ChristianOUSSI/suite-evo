import { Icone } from "@/components/icone";

export default function Chargement() {
  return (
    <div className="chargement">
      <Icone nom="comptoir" taille={26} />
      <p className="chargement__note">Le comptoir ouvre, un instant</p>
    </div>
  );
}
