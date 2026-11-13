import Image from "next/image";

export default function Loading() {
  return (
    <div className="chargement" role="status" aria-live="polite">
      <Image
        className="chargement__logo"
        src="/code-axis.png"
        width={720}
        height={839}
        sizes="178px"
        priority
        alt="Code Axis, Digital Cameroon"
      />
      <span className="chargement__trace" aria-hidden="true" />
      <p className="chargement__note">Le carnet s’ouvre, un instant.</p>
    </div>
  );
}
