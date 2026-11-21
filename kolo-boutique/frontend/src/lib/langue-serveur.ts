import { cookies } from "next/headers";

import { NOM_COOKIE, normaliserLangue, type Langue } from "./langue";

/** La langue lue côté serveur, dans le cookie posé par le sélecteur. */
export async function langueServeur(): Promise<Langue> {
  const bocal = await cookies();
  return normaliserLangue(bocal.get(NOM_COOKIE)?.value);
}
