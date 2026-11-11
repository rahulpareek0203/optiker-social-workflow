# KI-gestützter Social-Media-Workflow (Prototyp)

Prototyp für einen fiktiven Optiker („Optik Lindner“): Wochenplanung mit Kapazitätsprüfung,
Produktionsbriefing, menschliche Freigabe und eine simulierte Übergabe an eine Publishing-Schnittstelle.
Alle Daten sind synthetisch, Links zeigen auf `example.com`.

## Schnellstart

Voraussetzung: Node.js 20.12 oder neuer.

```bash
npm install
npm test           # 47 Tests, u. a. die vier geforderten Fälle
npm run demo       # geführter Durchlauf in 12 Schritten, endet mit Prüfung der 4 Testfälle
npm run demo:step  # derselbe Durchlauf, hält nach jedem Schritt an (Enter = weiter, q = beenden)
```

Im Schrittmodus hält der erste Lauf nach jeder Stufe der Pipeline an (Eingabe, Themenauswahl,
Kapazitätsprüfung, Wochenplan, Briefing, Beiträge, Übergabe). Die Dateien der jeweiligen Stufe liegen
dann bereits in `data/output/` und können nebenher geöffnet werden.

Von Hand statt `demo`:

```bash
npm run reset                                   # Ausgaben löschen
npm start                                       # Plan, Briefing, Beiträge zur Prüfung
npm run approve -- post-2026-W47-01 "Person B"  # menschliche Freigabe simulieren
npm start                                       # übergibt den freigegebenen Beitrag
npm start                                       # erneuter Lauf: keine doppelte Übergabe
```

Die Terminalausgabe ist auf Deutsch; mit `APP_LANG=en` erscheint sie auf Englisch
(z. B. `APP_LANG=en npm run demo`). Beitragstexte, Briefing und Wochenübersicht sind immer Deutsch.

Die Terminalausgabe ist farbig und mit Symbolen markiert: ✔ übergeben/ok, ✖ blockiert/Fehler,
⚠ Warnung, ↻ Umplanung, ↺ bereits übergeben, ★ Priorität, ○ Reserve. Die Wochenübersicht
(`weekly-summary.txt`) bleibt bewusst reiner Text, da sie per E-Mail versendet werden soll.

Um Testfall 3 von Hand nachzuvollziehen: nach der Freigabe den `text` in
`data/output/freigabeordner/posts.json` ändern und `npm start` ausführen – die Freigabe verfällt.

## Ablauf

```
week-input.json ─► Planung ─► Kapazitätsprüfung ─► Briefing (Provider) ─► Beiträge „Zur Prüfung“
                                   │                                              │
                          Warnung + Umplanung                         Freigabe (approve)
                                                                                 │
                     Wochenübersicht ◄── Übergabe (nur wenn alle Regeln erfüllt, einmal je Version)
```

### Projektstruktur

```
src/
  domain/      Datenmodelle und Eingabeschemas (zod): input, plan, post
  planning/    scoring (Themenbewertung), effort (Aufwand), capacity (Last + Umplanung), planner
  content/     ContentProvider-Schnittstelle, Schema-Prüfung, FakeContentProvider, LLM-Platzhalter, Markdown
  approval/    fingerprint (SHA-256 je Version), stateMachine (Status, Freigabe, Ungültigwerden)
  handoff/     handoff (Prüfregeln), ledger (keine Doppelübergabe), publisher (simuliert)
  reporting/   Wochenübersicht als Text
  storage/     JSON-Dateien lesen/schreiben, Freigabeordner (posts.json)
  i18n/        Meldungstexte Deutsch/Englisch; die Fachlogik liefert nur Codes
  shared/      Datumsfunktionen
  workflow/    Pfade und runWorkflow() – verbindet alle Stufen zu einem Lauf
  cli/         Einstiege (main, approve, reset, demo) und Terminaldarstellung (format, views/)
tests/
  unit/        je Modul (planning, approval, handoff, i18n)
  integration/ kompletter Ablauf über mehrere Läufe in einem temporären Verzeichnis
  support/     Testdaten und Hilfsfunktionen
data/input/    synthetische Eingabe
data/output/   Beispielausgaben aus `npm run demo`
docs/          Konzept Teil 2, Testnachweis
```

Abhängigkeiten zeigen nur nach innen: `domain` kennt keine anderen Module, die Fachmodule kennen kein
Terminal, und nur `cli/` gibt etwas aus. Dadurch lassen sich Planung, Freigabe und Übergabe ohne
Dateisystem-Mocks oder Terminal testen.

### Entwicklung

```bash
npm run check      # Typprüfung (tsc strict) + Formatierung (Prettier) + Tests
npm run format     # Code formatieren
```

Dieselben Prüfungen und der Demo-Lauf laufen in der CI (`.github/workflows/ci.yml`).

Ausgaben in `data/output/` (Beispielstand aus `npm run demo` ist eingecheckt):
`weekly-plan.json`, `briefing.md` / `briefing.json`, `freigabeordner/posts.json` (simulierter Freigabeordner),
`handoff/*.json` (Übergabe-Payloads), `handoff-ledger.json`, `weekly-summary.txt`.

## Regeln

### Planung

Themen werden bewertet: +2 bei saisonalem Bezug, +1 je Inspirationsfund. Die besten fünf werden
übernommen, die ersten drei sind Prioritäten. Die Bewertung aller Themen (Punkte, Rang, Ergebnis) steht im Terminal und in
der Wochenübersicht unter „THEMENAUSWAHL“. Funde gelten nie als bestätigter Trend („Einzelfund – kein
bestätigter Trend“). Fehlt bei einem Fund die Aufrufzahl, bleibt die Reichweite `null` bzw. „unbekannt“.

### Aufwand

Je Idee: Produktion nach Format (Reel 60, Karussell 45, Bild 25, Story 15 Min.), dazu
10 Min. je zusätzlicher Kanalvariante, 10 Min. Abstimmung und 5 Min. Freigabe.

### Kapazität

Gezählt werden nur Prioritäten. Bei Überlastung erscheint eine Warnung, danach wird umgeplant:
zuerst an eine Person mit genug freier Zeit abgeben, sonst die am niedrigsten bewertete Priorität gegen eine
kleinere Reserve tauschen. Reicht das nicht, bleibt die Warnung stehen. Budgets werden nie verändert.
In der Beispiel-Eingabe wäre Person B mit 155/150 Min. verplant; die Umplanung ist in der Wochenübersicht
dokumentiert.

### Freigabe

Status: Entwurf → Zur Prüfung → Freigegeben → Übergeben. Unerlaubte Wechsel werfen einen Fehler.
Die Freigabe speichert einen SHA-256-Fingerprint über Text, Medienreferenz, Kanäle und Termin. Weicht der
aktuelle Inhalt davon ab, verfällt die Freigabe und der Beitrag geht zurück in die Prüfung.

### Übergabe

Nur, wenn: freigegeben, Fingerprint passt, Medienreferenz vorhanden, Text, Kanäle und Termin gesetzt.
Das Ledger merkt sich jede übergebene Kombination aus Beitrag und Fingerprint, ein erneuter Lauf übergibt
sie nicht noch einmal. Schlägt der Publisher fehl, lautet das Ergebnis `failed` – kein Ledger-Eintrag,
kein Statuswechsel, der Exit-Code ist ungleich 0.

## Was ist ausgeführt, simuliert oder nur Konzept?

| Funktion                                                                     | Stand                                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Eingabeprüfung, Wochenplan, Aufwand, Kapazitätsprüfung, Umplanung            | ausgeführt                                                                   |
| Statusmodell, Fingerprint, Ungültigwerden der Freigabe                       | ausgeführt                                                                   |
| Übergabeprüfung, Ledger gegen Doppelübergabe                                 | ausgeführt                                                                   |
| Wochenübersicht als Textdatei                                                | ausgeführt (Datei wird erzeugt)                                              |
| KI-Texterzeugung (Briefing, Beitragstexte)                                   | simuliert – feste Testantworten in `src/content/fakeProvider.ts`             |
| Menschliche Freigabe                                                         | simuliert – Kommando `npm run approve`, Freigabeordner als JSON-Datei        |
| Publishing-Schnittstelle                                                     | simuliert – Payload wird als JSON gespeichert, nichts wird veröffentlicht    |
| E-Mail-Versand der Wochenübersicht                                           | nicht umgesetzt                                                              |
| Echter KI-Anbieter                                                           | nur Schnittstelle (`src/content/llmProvider.ts` wirft „nicht implementiert“) |
| Erfolgsmessung, Wirtschaftlichkeit, Kommentare, Betrieb, Terminverfügbarkeit | nur Konzept – [`docs/konzept-ausbau.md`](docs/konzept-ausbau.md)             |

## Simulation der KI und ihre Grenzen

Der `FakeContentProvider` liefert von Hand geschriebene, als simuliert gekennzeichnete Antworten.
Die Antworten werden trotzdem wie echte KI-Ausgaben gegen ein Schema geprüft (Pflichtfelder, zwei verschiedene
Kanäle, Link nur unter `example.com`). Ein echter Anbieter implementiert dieselbe Schnittstelle
`ContentProvider`; Planung, Freigabe und Übergabe bleiben unverändert.

Grenzen: Die Texte reagieren nicht auf geänderte Eingaben. Ein vollständiges Briefing ist nur für Thema T1
hinterlegt – landet durch eine andere Eingabe ein anderes Thema auf Platz 1, bricht der Lauf mit einer klaren
Fehlermeldung ab. Über Qualität, Kosten oder Fehlerquote eines echten Modells sagt der Prototyp nichts aus.

## Annahmen

- Reserven binden keine Zeit, solange sie nicht nachrücken; sie haben trotzdem eine zuständige Person und einen Ausweichtermin.
- Die Personenzeiten umfassen alles (Produktion, Varianten, Abstimmung, Freigabe), daher enthält die Aufwandsschätzung alle vier Anteile.
- Zuständigkeit wird automatisch an die Person mit der meisten freien Zeit vergeben (keine Fähigkeiten berücksichtigt).
- Termine: Prioritäten Di/Do/Sa, Reserven Mi/Fr der geplanten Woche.
- Beiträge werden nur für Prioritäten angelegt. Einmal angelegte Beiträge werden bei späteren Läufen nicht überschrieben, damit Änderungen des Teams erhalten bleiben.
- Ein bereits übergebener Beitrag darf nicht mehr geändert werden; eine Korrektur müsste manuell geklärt werden.
- Medienreferenzen kommen aus der Eingabe (das Team produziert selbst); für T5 fehlt sie absichtlich.

## Tools / KI-Einsatz

Werkzeuge: TypeScript, Node.js, zod (Eingabeprüfung), Vitest (Tests), tsx, Prettier.

KI: Claude Code (Anthropic) als Coding-Assistent. Ich habe die Aufgabe in Anforderungen zerlegt, Umfang,
Struktur und gewünschtes Verhalten vorgegeben, und Claude hat danach Code, Tests und Textentwürfe erzeugt.
Mein Hauptaufwand lag darin, die Umsetzung anzuleiten und zu prüfen: Läuft der Ablauf wie gefordert, stimmen
die Regeln mit der Aufgabe überein, ist die Ausgabe für Dritte nachvollziehbar? Wo nicht, habe ich
Korrekturen vorgegeben.

Eingesetzt für:

- Ausarbeitung der Anforderungs-Checkliste und erster Strukturvorschläge
- Code-Entwürfe für Planung, Kapazitätsprüfung, Freigabe und Übergabe nach meinen Vorgaben
- Typsicherheit (TypeScript strict, zod-Schemas), Tests, Formatierung und CI-Konfiguration
- Formulierung der festen Testantworten und Entwürfe der Dokumentation

Eigene Entscheidungen und Prüfungen (Auswahl):

- Technologie und Umfang: TypeScript statt Python; bewusst schlanke Lösung passend zum Zeitrahmen statt
  einer überdimensionierten Architektur.
- Nachvollziehbarkeit: Themenbewertung mit Punkten je Thema, Quellen und Aufrufzahlen je Idee,
  Kapazitätsprüfung in der Reihenfolge Entwurf → Warnung → Umplanung → Endstand.
- Demo: geführter Durchlauf mit Erklärung je Schritt, Schrittmodus mit Pausen, automatische Prüfung der
  vier Testfälle am Ende.
- Prüfung der Logik: Beim Nachrechnen der Zuweisung fiel auf, dass die Greedy-Verteilung nicht die beste
  Lösung findet; das ist unter „Offene Punkte“ dokumentiert.
- Struktur: Aufteilung in Module nach Verantwortung, deutsche Ausgabe als Standard.

## Bearbeitungszeit

Insgesamt ca. 3 Stunden 15 Minuten (11.11.2026, ca. 21:10 bis 00:25 Uhr), geschätzt anhand der Zeitstempel
von Dateien und Testläufen.

| Phase                             | Inhalt                                                                                | Zeit (ca.) |
| --------------------------------- | ------------------------------------------------------------------------------------- | ---------- |
| 1. Aufgabe analysieren            | PDF lesen, Anforderungen als Checkliste                                               | 15 Min.    |
| 2. Lösung planen                  | Technologie (TypeScript statt Python), Umfang, Ablauf                                 | 10 Min.    |
| 3. Kernablauf umsetzen            | Eingabe, Wochenplan, Kapazität, Briefing, Freigabe, Übergabe                          | 15 Min.    |
| 4. Tests und Testnachweis         | Vier Pflichtfälle und Zusatzfälle                                                     | 5 Min.     |
| 5. Erste Dokumentation            | README, Konzept Teil 2                                                                | 5 Min.     |
| 6. Ausgabe nachvollziehbar machen | Terminalausgabe, Themenbewertung, Kapazitätsdarstellung, Schrittmodus; Regeln geprüft | 85 Min.    |
| 7. Struktur und Tooling           | Aufteilung in Module, Prettier, CI                                                    | 20 Min.    |
| 8. Review und Überarbeitung       | Code-Review, zusätzliche Validierung, Dokumentation überarbeitet                      | 40 Min.    |
| Gesamt                            |                                                                                       | 195 Min.   |

Mit KI-Unterstützung ging die erste Umsetzung schnell. Der größte Teil der Zeit floss in das Prüfen der
Ergebnisse gegen die Aufgabe und in eine Darstellung, die für Dritte nachvollziehbar ist.

## Offene Punkte

- Kein echter KI-Anbieter angebunden; Testantworten decken nur die Beispiel-Eingabe ab.
- Freigabe ist ein Kommandozeilenbefehl ohne Benutzerverwaltung; jeder kann einen beliebigen Namen angeben.
- Die JSON-Dateien sind nicht gegen gleichzeitige Zugriffe geschützt. Bricht der Prozess genau zwischen
  Payload und Ledger-Eintrag ab, würde beim nächsten Lauf erneut übergeben (hier unschädlich, da gleicher Dateiname je Version).
- Umplanung ist bewusst einfach (Abgeben oder Tauschen); Kanäle reduzieren oder Themen verschieben wird nur vorgeschlagen.
- Die Zuweisung ist „greedy“ (jede Idee geht an die Person mit der meisten freien Zeit, ohne spätere Korrektur).
  Sie findet nicht immer die beste Verteilung: In der Beispielwoche hätte Person A Idee 01 (85 Min.) übernehmen
  können, dann hätten alle drei Prioritäten gepasst. Eine Verteilung „größte Idee zuerst“ wäre der nächste Schritt.
- Ein nach der Übergabe geänderter Beitrag wird nur blockiert; ein Korrektur-Ablauf fehlt.
- Teil 2 (Messung, Wirtschaftlichkeit, Kommentare, Betrieb) ist nur als Konzept beschrieben.
