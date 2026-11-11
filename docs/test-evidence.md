# Testnachweis

Erzeugt mit `npx vitest run --reporter=verbose` am 2026-11-11 (Node 24, Vitest 5). Die Ausgabe unten ist
unverändert übernommen, nur Farbcodes, Laufzeiten je Test und der lokale Pfad wurden entfernt.

## Die vier geforderten Fälle

| Nr. | Fall                                                                 | Eingabe                                                                                           | Erwartetes und geprüftes Ergebnis                                                                                                                                 | Test                                                                                                     |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | Freigegebener Beitrag genau einmal übergeben, auch bei erneutem Lauf | Vollständiger Beitrag, freigegeben von „Person B“; Übergabe bzw. ganzer Ablauf zweimal ausgeführt | 1. Lauf: `handed_off`; 2. Lauf: `already_handed_off`; genau 1 Payload-Datei und 1 Ledger-Eintrag                                                                  | `unit/handoff/handoff.test.ts` Testfall 1, `integration/workflow.test.ts` Testfall 1 (Ablaufebene)       |
| 2a  | Fehlende Freigabe verhindert Übergabe                                | Beitrag im Status „Zur Prüfung“, Medienreferenz vorhanden                                         | `blocked` mit Grund `no_approval` („Keine Freigabe vorhanden“); Publisher nicht aufgerufen, keine Datei                                                           | `unit/handoff/handoff.test.ts` Testfall 2a                                                               |
| 2b  | Fehlende Medienreferenz verhindert Übergabe                          | Freigegebener Beitrag mit `mediaRef: null`                                                        | `blocked` mit Grund `missing_media` („Medienreferenz fehlt“); Publisher nicht aufgerufen                                                                          | `unit/handoff/handoff.test.ts` Testfall 2b                                                               |
| 3   | Textänderung nach Freigabe erfordert neue Freigabe                   | Freigegebener Beitrag, danach Text geändert (per Funktion und von Hand in `posts.json`)           | Status zurück auf „Zur Prüfung“, Freigabe gelöscht, Übergabe blockiert; nach erneuter Freigabe Übergabe möglich                                                   | `unit/approval/stateMachine.test.ts` Testfall 3, `integration/workflow.test.ts` Testfall 3 (Ablaufebene) |
| 4   | Überschrittenes Zeitbudget führt zu Warnung und Umplanung            | Beispiel-Eingabe: Person B wäre mit 155 von 150 Min. verplant                                     | Warnung für Person B (155/150 Min.); Umplanungsschritt `swap`: Idee 03 wird Reserve, Reserve 05 rückt nach; danach niemand überlastet; Budgets unverändert 90/150 | `unit/planning/planner.test.ts` Testfall 4                                                               |

Zusätzlich geprüft: nachvollziehbare Themenbewertung (Punkte je Thema), unerlaubte Statuswechsel, doppelte Freigabe, Stabilität des Fingerprints,
Eingabevalidierung (u. a. doppelte IDs, unbekannte Themen), beschädigtes Ledger, Fehler des Publishers (wird als Fehler gemeldet, nicht als Übergabe),
Umplanung durch Neuzuweisung, nicht lösbare Überlastung, Vollständigkeit des Briefings.

## Ablauf im Demo-Lauf (`npm run demo`, schrittweise: `npm run demo:step`)

Die Beispielausgaben in `data/output/` stammen aus diesem Lauf. Am Ende prüft das Demo-Skript die vier Fälle
anhand der tatsächlichen Ergebnisse und gibt je Fall „OK“ oder „FEHLER“ aus (Exit-Code 1 bei Fehler).

1. Erster Lauf: Plan mit Kapazitätswarnung und Umplanung, drei Beiträge „Zur Prüfung“, alle blockiert.
2. Freigabe von `post-2026-W47-01` und `post-2026-W47-05` durch „Person B“.
3. Zweiter Lauf: `post-2026-W47-01` wird übergeben; `post-2026-W47-05` bleibt blockiert (Medienreferenz fehlt);
   `post-2026-W47-02` bleibt blockiert (keine Freigabe).
4. Dritter Lauf: `post-2026-W47-01` wird nicht erneut übergeben („bereits übergeben“).
5. `post-2026-W47-02` wird freigegeben und danach im Text geändert: Die Freigabe verfällt, der Beitrag ist blockiert.

## Ausgabe des Testlaufs

```
 RUN  v5.1.0 .
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > Testfall 1: freigegebener, vollständiger Beitrag wird genau einmal übergeben
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > Testfall 2a: ohne Freigabe wird nicht übergeben
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > Testfall 2b: ohne Medienreferenz wird nicht übergeben, auch wenn freigegeben
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > meldet einen Fehler des Publishers als Fehler, nicht als Übergabe, und erlaubt einen neuen Versuch
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > blockiert einen bereits übergebenen Beitrag, der danach von Hand geändert wurde
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > listet alle fehlenden Pflichtangaben auf
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > kennzeichnet das Payload als simuliert
 ✓ tests/unit/handoff/handoff.test.ts > Übergabe > bricht bei beschädigtem Ledger ab, statt es als leer zu behandeln
 ✓ tests/unit/planning/planner.test.ts > Wochenplan > enthält fünf Ideen: drei Prioritäten und zwei Reserven mit allen Pflichtfeldern
 ✓ tests/unit/planning/planner.test.ts > Wochenplan > bezeichnet Inspirationsfunde nie als bestätigten Trend
 ✓ tests/unit/planning/planner.test.ts > Wochenplan > lässt Reichweite unbekannt, wenn eine Kennzahl fehlt
 ✓ tests/unit/planning/planner.test.ts > Wochenplan > schätzt Aufwand nachvollziehbar aus Format und Kanalzahl
 ✓ tests/unit/planning/planner.test.ts > Kapazitätsprüfung > Testfall 4: Überlastung erzeugt Warnung und nachvollziehbare Umplanung, Budget bleibt gleich
 ✓ tests/unit/planning/planner.test.ts > Kapazitätsprüfung > gibt eine Idee an eine andere Person ab, wenn dort Zeit frei ist
 ✓ tests/unit/planning/planner.test.ts > Kapazitätsprüfung > warnt weiter, wenn keine Umplanung reicht, statt Zeit zu erfinden
 ✓ tests/unit/planning/planner.test.ts > Eingabeprüfung > lehnt Funde mit unbekanntem Thema ab
 ✓ tests/unit/planning/planner.test.ts > Eingabeprüfung > lehnt negative oder fehlende Zeitbudgets ab
 ✓ tests/unit/planning/planner.test.ts > Eingabeprüfung > lehnt doppelte Themen-IDs ab
 ✓ tests/unit/planning/planner.test.ts > Eingabeprüfung > lehnt Medienreferenzen für unbekannte Themen ab
 ✓ tests/unit/planning/planner.test.ts > Eingabeprüfung > verlangt mindestens drei Inspirationsfunde
 ✓ tests/unit/planning/planner.test.ts > Themenauswahl > bewertet alle Themen nachvollziehbar und wählt die besten fünf
 ✓ tests/unit/planning/planner.test.ts > Quellen > führt jeden Fund mit Quellenkennung, Kanal und Aufrufen (oder null) auf
 ✓ tests/integration/workflow.test.ts > Gesamtablauf > erster Lauf legt drei Beiträge zur Prüfung an und übergibt nichts
 ✓ tests/integration/workflow.test.ts > Gesamtablauf > Testfall 1 (Ablaufebene): ein freigegebener Beitrag wird über zwei Läufe genau einmal übergeben
 ✓ tests/integration/workflow.test.ts > Gesamtablauf > Testfall 3 (Ablaufebene): von Hand geänderter Text hebt die Freigabe beim nächsten Lauf auf
 ✓ tests/integration/workflow.test.ts > Gesamtablauf > Wochenübersicht zeigt Warnung, Umplanung, Blockaden und Simulationshinweis
 ✓ tests/integration/workflow.test.ts > Gesamtablauf > Briefing enthält alle geforderten Bestandteile
 ✓ tests/integration/workflow.test.ts > Gesamtablauf > bricht mit dem nicht implementierten LLM-Provider ab, statt etwas vorzutäuschen
 ✓ tests/unit/i18n.test.ts > Texte > haben für jeden Code eine deutsche und eine englische Fassung
 ✓ tests/unit/approval/stateMachine.test.ts > Freigabe > Testfall 3: Textänderung nach Freigabe erfordert erneute Freigabe
 ✓ tests/unit/approval/stateMachine.test.ts > Freigabe > erkennt auch direkte Änderungen (z. B. von Hand in posts.json)
 ✓ tests/unit/approval/stateMachine.test.ts > Freigabe > lässt eine unveränderte Freigabe bestehen
 ✓ tests/unit/approval/stateMachine.test.ts > Freigabe > verlangt den Namen der freigebenden Person
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > durchläuft Entwurf -> zur Prüfung -> freigegeben
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet draft -> approved
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet draft -> handed_off
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet in_review -> handed_off
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet handed_off -> in_review
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet handed_off -> draft
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet eine doppelte Freigabe
 ✓ tests/unit/approval/stateMachine.test.ts > Statusübergänge > verbietet Änderungen über editPost nach der Übergabe
 ✓ tests/unit/approval/fingerprint.test.ts > Fingerprint > ist stabil und unabhängig von der Reihenfolge der Kanäle
 ✓ tests/unit/approval/fingerprint.test.ts > Fingerprint > ändert sich, wenn sich der Text ändert
 ✓ tests/unit/approval/fingerprint.test.ts > Fingerprint > ändert sich, wenn sich die Medienreferenz ändert
 ✓ tests/unit/approval/fingerprint.test.ts > Fingerprint > ändert sich, wenn sich der Kanal ändert
 ✓ tests/unit/approval/fingerprint.test.ts > Fingerprint > ändert sich, wenn sich der Termin ändert
 ✓ tests/unit/approval/fingerprint.test.ts > Fingerprint > ignoriert Felder, die nicht zur Freigabe gehören
 Test Files  6 passed (6)
      Tests  47 passed (47)
   Start at  23:56:34
   Duration  2.26s (import 75%, tests 15%, transform 8%, worker 2%)
    Isolate  6 workers spawned · ~543ms startup each (spawn + environment, per file)
             at least ~543ms faster with isolate: false — reuses workers across files instead of one per file
```
