import type { Texts } from "./types";

export const de: Texts = {
  weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  status: { draft: "Entwurf", in_review: "Zur Prüfung", approved: "Freigegeben", handed_off: "Übergeben" },
  reason: {
    changed_after_handoff: "Beitrag wurde bereits übergeben und danach verändert – bitte manuell klären",
    no_approval: "Keine Freigabe vorhanden",
    approval_outdated: "Freigabe gilt für eine andere Version – erneute Prüfung nötig",
    missing_media: "Medienreferenz fehlt",
    missing_text: "Beitragstext fehlt",
    missing_channels: "Kein Kanal zugeordnet",
    missing_date: "Veröffentlichungstermin fehlt",
  },
  evidence: (n) =>
    n === 0
      ? "Keine Inspirationsfunde"
      : n === 1
        ? "Einzelfund – kein bestätigter Trend"
        : `${n} Einzelfunde – Hinweis, aber kein bestätigter Trend`,
  warning: (w) =>
    w.afterReplan
      ? `Auch nach Umplanung ist ${w.personName} überlastet (${w.planned}/${w.budget} Min.). Manuelle Entscheidung nötig.`
      : `${w.personName} ist mit ${w.planned} von ${w.budget} Minuten verplant (${w.planned - w.budget} Minuten zu viel). Das Budget wird nicht erhöht.`,
  replan: (s) => {
    switch (s.kind) {
      case "reassign":
        return `${s.ideaId} („${s.topic}“, ${s.minutes} Min.) von ${s.from} an ${s.to} übergeben, weil dort noch ${s.freeMinutes} Min. frei waren.`;
      case "swap":
        return `${s.ideaId} („${s.topic}“, ${s.minutes} Min.) zur Reserve zurückgestuft; ${s.reserveId} („${s.reserveTopic}“, ${s.reserveMinutes} Min.) rückt für ${s.person} nach. Keine andere Person hatte genug freie Zeit.`;
      case "unresolved":
        return `Für ${s.person} keine automatische Lösung gefunden – bitte Thema verschieben oder Kanäle reduzieren.`;
    }
  },
  invalidated: (id) => `${id}: nach der Freigabe geändert – Freigabe aufgehoben, zurück in die Prüfung`,
  transitionError: (id, from, to) =>
    `Beitrag ${id}: Wechsel von „${de.status[from]}“ nach „${de.status[to]}“ ist nicht erlaubt`,
  ui: {
    title: (week) => `Social-Media-Workflow · Woche ${week}`,
    simulationNote:
      "Texte = feste Testantworten (simuliert) · Übergabe = JSON-Datei (simuliert) · nichts wird veröffentlicht",
    selection: "THEMENAUSWAHL  (Punkte = +2 saisonaler Anlass · +1 je Inspirationsfund)",
    selectionColumns: ["Rang", "Thema", "Saison", "Funde", "Punkte", "Ergebnis"],
    seasonal: "Saison",
    priority: "Priorität",
    reserve: "Reserve",
    notSelected: "nicht ausgewählt",
    nowPriority: "↻ jetzt Priorität",
    nowReserve: "↻ jetzt Reserve",
    selectionNote:
      "  Plätze 1–3 = Prioritäten, 4–5 = Reserven, Rest entfällt. Bei Punktgleichheit entscheidet die Reihenfolge der Eingabe.",
    plan: (week) => `WOCHENPLAN ${week}`,
    planColumns: ["Nr", "Termin", "Person", "Min.", "Format", "Kanäle", "Thema"],
    reach: "Reichweite",
    sources: "Quellen",
    views: "Aufrufe",
    unknown: "unbekannt",
    legend: "  ★ Priorität (wird diese Woche produziert)   ○ Reserve (nur falls etwas ausfällt)",
    min: "Min.",
    capacity: "KAPAZITÄTSPRÜFUNG  (nur Prioritäten · das Budget wird nie erhöht)",
    draft: "  1. Erster Entwurf (vor der Umplanung)",
    final: "  2. Nach der Umplanung (endgültig)",
    free: (m) => `✔ ${m} Min. frei`,
    overloadedBy: (m) => `✖ ${m} Min. zu viel`,
    movedUp: "↻ durch Umplanung nachgerückt",
    demoted: "↻ durch Umplanung zur Reserve",
    warningLabel: "⚠ WARNUNG  ",
    replanLabel: "↻ UMPLANUNG",
    briefing: "BRIEFING",
    briefingDone: (nr, topic) => `Vollständiges Briefing für ${nr} „${topic}“ → data/output/briefing.md`,
    handoff: "FREIGABE UND ÜBERGABE",
    handedOff: "✔ ÜBERGEBEN",
    alreadyHandedOff: "↺ SCHON ÜBERGEBEN",
    blocked: "✖ BLOCKIERT",
    failed: "✖ FEHLER",
    handedOffNote: "(simuliert, nichts veröffentlicht)",
    alreadyNote: "→ genau diese Version ging schon raus, keine zweite Übergabe",
    invalidatedLabel: "⚠ FREIGABE VERFALLEN",
    nextSteps: "WIE GEHT ES WEITER?",
    briefingFile: "Briefing:       ",
    summaryFile: "Wochenübersicht:",
    waiting: (n) => `${n} Beitrag/Beiträge warten auf Freigabe. Freigeben mit:`,
    runAgain: "  danach erneut: npm start",
    approved: "✔ FREIGEGEBEN",
    approvedBy: (id, by) => `${id} von ${by}`,
    version: "Version",
    aborted: "✖ Lauf abgebrochen:",
    resetDone: "data/output/ gelöscht.",
    usage: 'Aufruf: npm run approve -- <postId> "<Name>"',
    notFound: (id, existing) => `Beitrag ${id} nicht gefunden. Vorhanden: ${existing || "keine"}`,
    input: (file) => `EINGABE  ${file}`,
    brand: "Marke",
    tone: "Tonalität",
    occasion: "Anlass",
    people: "Personen",
    topics: (n) => `Themen (${n})`,
    finds: (n) => `Inspirationsfunde (${n})`,
    media: (n) => `Medienreferenzen (${n})`,
    seasonalTag: "saisonal",
    briefingPreview: "BRIEFING  (Vorschau · simulierte KI-Antwort)",
    hook: "Einstieg",
    shotPlan: (n) => `Drehplan (${n} Schritte)`,
    overlays: "Einblendungen",
    thumbnail: "Titelbild",
    booking: "Termin-Link",
    variants: "Varianten",
    effortLabel: "Aufwand",
    effort: (e) =>
      `Produktion ${e.production} + Varianten ${e.variants} + Abstimmung ${e.coordination} + Freigabe ${e.approval} = ${e.total} Min.`,
    fullBriefing: "Vollständig",
    posts: (file) => `BEITRÄGE  ${file}`,
    newPost: "neu angelegt",
    date: "Termin",
    channels: "Kanäle",
    text: "Text",
    mediaLabel: "Medien",
    missing: "✖ fehlt",
  },
  demo: {
    stepWord: "SCHRITT",
    pause: "↵ Enter = nächster Schritt · q + Enter = beenden",
    input: [
      "Lauf 1 · Eingabe lesen und prüfen",
      "Alles beginnt mit einer Datei: data/input/week-input.json. Sie wird zuerst geprüft – ist etwas ungültig, endet der Lauf hier.",
    ],
    selection: [
      "Lauf 1 · Themen bewerten und auswählen",
      "Jedes Thema bekommt Punkte: +2 für den saisonalen Anlass, +1 je Inspirationsfund. Plätze 1–3 werden Prioritäten, 4–5 Reserven.",
    ],
    capacity: [
      "Lauf 1 · Kapazitätsprüfung",
      "Die Minuten aller Prioritäten werden je Person addiert und mit dem Budget verglichen. Bei Überlastung: Warnung, dann Umplanung – das Budget wird nie erhöht.",
    ],
    plan: [
      "Lauf 1 · Endgültiger Wochenplan",
      "Der Plan nach der Kapazitätsprüfung. Gespeichert in data/output/weekly-plan.json.",
    ],
    briefing: [
      "Lauf 1 · Produktionsbriefing",
      "Der (simulierte) KI-Provider schreibt das vollständige Briefing für die erste Priorität. Die Antwort wird vor der Verwendung gegen ein Schema geprüft.",
    ],
    posts: [
      "Lauf 1 · Beiträge anlegen",
      "Für jede Priorität entsteht ein Beitrag (Text, Mediendatei, Kanäle, Termin) und geht in die Prüfung. Gespeichert im Freigabeordner.",
    ],
    handoff: [
      "Lauf 1 · Übergabeversuch",
      "Vor der Übergabe wird jeder Beitrag geprüft. Noch hat niemand etwas freigegeben – also ist alles blockiert.",
    ],
    whatHappens: "Was passiert:",
    step2: [
      "Ein Mensch gibt frei",
      "Person B gibt post-2026-W47-01 (vollständig) und post-2026-W47-05 (ohne Medienreferenz) frei. post-2026-W47-02 bleibt ohne Freigabe.",
    ],
    step3: [
      "Zweiter Lauf: Übergabe",
      "Übergeben wird nur, was freigegeben UND vollständig ist. Erwartet: 01 geht raus, 02 fehlt die Freigabe, 05 fehlt die Medienreferenz.",
    ],
    step4: [
      "Dritter Lauf: nichts doppelt",
      "Der Ablauf startet noch einmal. 01 wurde schon übergeben und darf nicht ein zweites Mal rausgehen.",
    ],
    step5: [
      "Änderung nach der Freigabe",
      "post-2026-W47-02 wird freigegeben, danach ändert jemand den Text. Die Freigabe gehört zur alten Version und verfällt – der Beitrag muss erneut geprüft werden.",
    ],
    edited: (id) => `Text von ${id} nach der Freigabe ergänzt`,
    result: [
      "Die vier geforderten Prüffälle",
      "Jeder Haken wird aus den echten Ergebnissen dieses Laufs berechnet.",
    ],
    checksTitle: "PRÜFFÄLLE",
    ok: "✔ OK    ",
    fail: "✖ FEHLER",
    checks: [
      "Fall 1   Freigegebener Beitrag genau einmal übergeben, auch beim erneuten Lauf",
      "Fall 2a  Fehlende Freigabe verhindert die Übergabe",
      "Fall 2b  Fehlende Medienreferenz verhindert die Übergabe",
      "Fall 3   Textänderung nach Freigabe erfordert neue Freigabe",
      "Fall 4   Überlastung führt zu Warnung und Umplanung, Budget unverändert",
    ],
    outputs: "  Ausgaben: data/output/  (Plan, Briefing, Freigabeordner, Übergaben, Wochenübersicht)",
  },
};
