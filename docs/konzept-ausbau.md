# Konzept: Messung und Ausbau (Teil 2)

Nur konzipiert, nicht umgesetzt. Aufbauend auf dem Prototyp: Jede übergebene Version hat bereits
eine eindeutige Kennung (`postId` + Fingerprint), an die sich Messdaten hängen lassen.

## 1. Erfolgsmessung

Link-Kennzeichnung. Jeder Termin-Link bekommt beim Übergeben UTM-Parameter, erzeugt aus den
Beitragsdaten statt von Hand:
`https://www.example.com/termin/sehtest?utm_source=instagram&utm_medium=social&utm_campaign=2026-w47&utm_content=post-2026-W47-01`.
Pro Kanalvariante ein eigener `utm_source`, damit Instagram und Facebook getrennt auswertbar sind.

Erfasste Größen je Beitrag und Kanal: Reichweite, Klicks, zugeordnete Anfragen, Termine, Käufe.
Quelle ist jeweils angegeben (Plattform-Export, Web-Analyse, Terminbuch, Kasse).

Dashboard-Regeln:

- Fehlende Daten bleiben sichtbar als „keine Daten“ – nicht als 0. Null heißt gemessen und nichts passiert.
- Keine Mehrfachzählung: Eine Anfrage bzw. ein Termin wird genau einer Quelle zugeordnet
  (z. B. letzter gekennzeichneter Klick innerhalb von 7 Tagen). Kanal-Summen ergeben die Gesamtzahl.
  Termine werden über eine eindeutige Termin-ID dedupliziert.
- Reichweite wird nicht über Kanäle addiert, da Personen mehrere Kanäle sehen; sie wird je Kanal angezeigt.
- Hinweis im Dashboard: Zugeordnete Ergebnisse sind kein Nachweis, dass diese Verkäufe allein durch
  Social Media entstanden sind. Viele Kundinnen und Kunden wären ohnehin gekommen. Ein echter Zusatzeffekt
  ließe sich nur mit Experimenten belegen (z. B. Wochen mit und ohne Kampagne, Gutscheincodes nur in einem Kanal).

## 2. Wirtschaftlichkeit

- Kosten je Anfrage / je Kunde werden nur ausgegeben, wenn eine Mindestdatenbasis erreicht ist
  (Vorschlag: mindestens 10 Anfragen bzw. 4 Wochen Daten). Sonst steht dort „zu wenig Daten“.
- Nenner null: keine Quote, keine Division – Anzeige „nicht berechenbar (0 Anfragen)“.
- Kosten = eingesetzte Personenzeit × interner Stundensatz + ggf. Werbebudget. Die Personenzeit ist im
  Prototyp bereits je Beitrag geschätzt; später werden Ist-Zeiten erfasst.
- Umsatz und Deckungsbeitrag werden getrennt ausgewiesen. Eine Brille mit 400 € Umsatz hat einen
  deutlich kleineren Deckungsbeitrag (Wareneinsatz, Gläser, Anpassung). Entscheidungen sollten auf dem
  Deckungsbeitrag beruhen.

## 3. Kommentare

- Neue Kommentare werden regelmäßig abgerufen und klassifiziert: einfache Frage, Lob, Beschwerde,
  sensibel (Gesundheit, persönliche Daten), unklar.
- Für einfache Fragen und Lob erstellt die KI einen Antwortentwurf. Veröffentlicht wird nur nach
  menschlicher Prüfung – derselbe Freigabe-Mechanismus wie bei Beiträgen. Keine automatische Antwort.
- Beschwerden, sensible und unklare Anliegen bekommen keinen Entwurf, sondern gehen direkt als Aufgabe
  ans Team (mit Frist). Gesundheitsfragen werden grundsätzlich an die persönliche Beratung verwiesen.

## 4. Betrieb

- Zeitsteuerung: Ein zentraler Ablauf (z. B. Cron-Job oder Workflow-Plattform) startet montags die
  Planung und täglich die Übergabe-Prüfung. Durch das Ledger ist ein mehrfacher Start unschädlich.
- Zugangsdaten liegen in einem Secret-Store bzw. Umgebungsvariablen, nie im Code oder in Eingabedateien;
  getrennte Schlüssel je Umgebung, regelmäßige Rotation.
- Fehlerhinweise: Fehlgeschlagene Übergaben, ungültige Provider-Antworten und Kapazitätswarnungen gehen
  per E-Mail/Chat an eine verantwortliche Person. Ein Fehler erscheint nie als Erfolg (wie im Prototyp:
  Ergebnis `failed`, kein Ledger-Eintrag).
- Manuelle Ersatzwege: Fällt eine Schnittstelle aus, bleibt das Payload als Datei liegen und wird
  manuell veröffentlicht; die Person bestätigt das anschließend, damit Ledger und Status stimmen.

## 5. Kapazitätsplanung

- Produktionszeit ist bereits mit jedem Beitrag verknüpft (Schätzung je Format und Kanal).
  Ausbau: Ist-Zeiten erfassen und die Schätzwerte daraus nachjustieren.
- Davon getrennt: ob freie Beratungstermine beworben werden können. Vor der Übergabe eines Beitrags mit
  Termin-Aufruf wird die Terminverfügbarkeit geprüft (z. B. mindestens 5 freie Termine in den nächsten
  14 Tagen). Sind keine frei, wird der Aufruf durch einen allgemeinen Hinweis ersetzt oder der Beitrag
  verschoben – das Team hat Zeit zu produzieren, aber nicht unbedingt Zeit zu beraten.
