#!/usr/bin/env bash
# Lance toute la suite evo : 22 backends FastAPI + 22 fronts Next.js + le portail.
# Les fronts utilisent `npm run start` si le build existe, sinon `npm run dev`.
set -u
cd "$(dirname "$0")/.."
PY=/c/Users/Christian/tools/py312/python.exe
[ -x "$PY" ] || PY=python3
JOURNAL=/tmp/suite-evo
mkdir -p "$JOURNAL"

# dossier|port_api|port_front — la table fait foi, pas une formule.
TABLE="
evo-tontine|8500|3500
evo-crm|8600|3600
evo-presence|8700|3700
evo-hotel|8800|3800
evo-shop|8900|3900
evo-school|9000|4000
evo-clinic|9200|4200
evo-immo|9300|4300
evo-log|9400|4400
evo-market|9500|4500
evo-docs|9600|4600
evo-call|9700|4700
evo-auto|9800|4800
evo-import|9900|4900
evo-bijou|10000|5000
evo-moto|10100|5100
evo-cars|10200|5200
evo-wear|10300|5300
evo-gaz|10400|5400
evo-carnet|10500|5500
evo-agent|10600|5600
evo-voice|10700|5700
"

echo "$TABLE" | while IFS='|' read -r dossier api front; do
  [ -n "$dossier" ] || continue
  (cd "$dossier/backend" && nohup "$PY" -m uvicorn app.main:app --host 127.0.0.1 --port "$api" > "$JOURNAL/$dossier-api.log" 2>&1 &)
  (cd "$dossier/frontend" && \
    if [ -f .next/BUILD_ID ]; then CMD="npm run start"; else CMD="npm run dev"; fi && \
    nohup $CMD > "$JOURNAL/$dossier-front.log" 2>&1 &)
  echo "  $dossier → api :$api · front :$front"
done

(cd portail/frontend && nohup npm run start > "$JOURNAL/portail.log" 2>&1 &)
echo "  portail → http://localhost:5800"
echo "Journaux dans $JOURNAL — arrêt : scripts/arreter.sh"
