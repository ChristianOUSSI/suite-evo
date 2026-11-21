import test from "node:test";
import assert from "node:assert/strict";
import {
  canoniseTelephone,
  afficheTelephone,
  operateur,
  fcfa,
  fcfaCourt,
  dateLongue,
  jourEtDate,
  joursEntre,
  pourcentage,
  initiales,
  VILLES,
  RAILS,
} from "../cameroun.js";

test("canoniseTelephone accepte les formats camerounais", () => {
  assert.equal(canoniseTelephone("699307724"), "+237699307724");
  assert.equal(canoniseTelephone("+237 6 99 30 77 24"), "+237699307724");
  assert.equal(canoniseTelephone("00237699307724"), "+237699307724");
  assert.equal(canoniseTelephone("237699307724"), "+237699307724");
  assert.equal(canoniseTelephone("0699307724"), "+237699307724");
});

test("canoniseTelephone refuse les numéros invalides", () => {
  assert.equal(canoniseTelephone(""), null);
  assert.equal(canoniseTelephone(null), null);
  assert.equal(canoniseTelephone("12345"), null);
  assert.equal(canoniseTelephone("899307724"), null); // préfixe 8 inexistant
  assert.equal(canoniseTelephone("abc"), null);
});

test("afficheTelephone groupe le numéro comme au combiné", () => {
  assert.equal(afficheTelephone("699307724"), "6 99 30 77 24");
  assert.equal(afficheTelephone("inconnu"), "inconnu");
});

test("operateur lit la plage des trois premiers chiffres", () => {
  assert.equal(operateur("670987654"), "MTN"); // 670
  assert.equal(operateur("652123456"), "MTN"); // 652
  assert.equal(operateur("699307724"), "Orange"); // 699
  assert.equal(operateur("655123456"), "Orange"); // 655
  assert.equal(operateur("665432109"), "Nexttel"); // 665
  assert.equal(operateur("222123456"), "Camtel (fixe)"); // fixe 2XX
  assert.equal(operateur("pas-un-numero"), "inconnu");
});

test("fcfa formate les montants en FCFA", () => {
  assert.equal(fcfa(1500), `1 500${" "}FCFA`);
  assert.equal(fcfa(2500000), `2 500 000${" "}FCFA`);
  assert.equal(fcfa(0), `0${" "}FCFA`);
  assert.equal(fcfa(-500), `-500${" "}FCFA`);
});

test("fcfaCourt raccourcit les gros montants", () => {
  assert.equal(fcfaCourt(1500000), `1,5${" "}M`);
  assert.equal(fcfaCourt(250000), `250${" "}k`);
  assert.equal(fcfaCourt(800), "800");
});

test("dateLongue et jourEtDate en français et anglais", () => {
  assert.equal(dateLongue("2026-03-15"), "15 mars 2026");
  assert.equal(dateLongue("2026-03-15", "en"), "March 15, 2026");
  assert.equal(jourEtDate("2026-03-15"), "dimanche, 15 mars 2026");
});

test("joursEntre compte les jours entre deux dates", () => {
  assert.equal(joursEntre("2026-01-01", "2026-01-10"), 9);
  assert.equal(joursEntre("2026-01-10", "2026-01-01"), -9);
});

test("pourcentage et initiales", () => {
  assert.equal(pourcentage(42.4), `42${" "}%`);
  assert.equal(initiales("Awa Ngo Bell"), "AN");
  assert.equal(initiales(""), "");
});

test("VILLES et RAILS couvrent le contexte camerounais", () => {
  assert.ok(VILLES.length >= 10);
  assert.ok(VILLES.some((v) => v.nom === "Douala"));
  assert.ok(RAILS.some((r) => r.cle === "momo_mtn"));
  assert.ok(RAILS.some((r) => r.cle === "momo_orange"));
});
