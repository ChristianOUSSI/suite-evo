import test from "node:test";
import assert from "node:assert/strict";
import {
  LANGUES,
  LANGUE_DEFAUT,
  normaliserLangue,
  creerTraducteur,
  ETIQUETTES_LANGUE,
} from "../i18n.js";

test("normaliserLangue retombe sur le français par défaut", () => {
  assert.equal(LANGUE_DEFAUT, "fr");
  assert.equal(normaliserLangue("fr"), "fr");
  assert.equal(normaliserLangue("en"), "en");
  assert.equal(normaliserLangue("EN"), "en");
  assert.equal(normaliserLangue("es"), "fr");
  assert.equal(normaliserLangue(""), "fr");
  assert.equal(normaliserLangue(null), "fr");
  assert.deepEqual(LANGUES, ["fr", "en"]);
});

test("creerTraducteur choisit la bonne langue et les variables", () => {
  const dico = {
    "pot.du": { fr: "Le pot du jour : {montant}", en: "Today's pot: {montant}" },
    simple: "texte unique",
  };
  const fr = creerTraducteur(dico, "fr");
  const en = creerTraducteur(dico, "en");
  assert.equal(fr.langue, "fr");
  assert.equal(fr.t("pot.du", { montant: "15 000 FCFA" }), "Le pot du jour : 15 000 FCFA");
  assert.equal(en.t("pot.du", { montant: "15,000 FCFA" }), "Today's pot: 15,000 FCFA");
  assert.equal(fr.t("simple"), "texte unique");
});

test("cle manquante : jamais de clé brute dans le repli anglais", () => {
  const dico = { seulement_fr: { fr: "Uniquement en français" } };
  const en = creerTraducteur(dico, "en");
  assert.equal(en.t("seulement_fr"), "Uniquement en français"); // repli sur fr
  assert.equal(en.t("introuvable"), "introuvable"); // clé affichée en dernier recours
});

test("les étiquettes de langue sont complètes", () => {
  assert.equal(ETIQUETTES_LANGUE.fr.court, "FR");
  assert.equal(ETIQUETTES_LANGUE.en.long, "English");
});
