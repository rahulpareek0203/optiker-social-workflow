import type { Idea } from "../domain/plan";
import type { ContentContext, ContentProvider } from "./provider";

/*
 * Feste, gekennzeichnete Testantworten statt eines Sprachmodells.
 * Grenzen: Inhalte reagieren nicht auf geänderte Eingaben, ein vollständiges
 * Briefing gibt es nur für Thema T1, Tonalität und Fakten sind von Hand geschrieben.
 */

const BOOKING_URL = "https://www.example.com/termin/sehtest";

const BRIEFINGS: Record<string, unknown> = {
  T1: {
    hook: "Abends im Auto und jedes entgegenkommende Licht blendet? Das muss nicht so bleiben.",
    postText:
      "Jetzt, wo es schon gegen fünf dunkel wird, hören wir das bei uns fast jeden Tag: Die Scheinwerfer " +
      "der anderen blenden, und nach der Heimfahrt sind die Augen müde. Oft steckt etwas ganz Einfaches " +
      "dahinter – eine nicht mehr passende Sehstärke, Kratzer auf den Gläsern oder Gläser ohne gute " +
      "Entspiegelung. In unserem kurzen Video zeigt Ihnen Jana aus unserem Team drei Dinge, die Sie heute " +
      "Abend selbst prüfen können. Und wenn Sie unsicher sind: Kommen Sie einfach vorbei, wir schauen " +
      "gemeinsam drauf. Wichtig: Ein Sehtest bei uns ersetzt keine augenärztliche Untersuchung. Wenn Sie " +
      "plötzlich schlechter sehen, gehen Sie bitte zeitnah zum Augenarzt.",
    shotPlan: [
      "0–3 s: Blick durch die Windschutzscheibe in der Dämmerung (Auto steht auf dem Parkplatz vor dem Laden), Lichtreflex von einer Taschenlampe – Einblendung des Hooks.",
      "3–8 s: Jana im Laden, direkt in die Kamera: „Drei Dinge, die Sie heute Abend prüfen können.“",
      "8–14 s: Tipp 1 – Brille gegen das Licht halten, Kratzer zeigen (Nahaufnahme).",
      "14–20 s: Tipp 2 – Gläser richtig reinigen: Wasser, Spülmittel, Mikrofasertuch statt Pullover.",
      "20–27 s: Tipp 3 – Vergleich entspiegeltes und nicht entspiegeltes Demo-Glas vor einer Lampe.",
      "27–35 s: Jana am Beratungstisch: „Wann war Ihr letzter Sehtest?“ – Einblendung Termin-Hinweis.",
    ],
    equipment:
      "Smartphone hochkant (9:16), Ansteckmikrofon, Ringlicht; Drehorte Laden und Parkplatz; Dreh ca. 30 Minuten am Stück.",
    textOverlays: [
      "Nachts geblendet?",
      "1. Kratzer prüfen",
      "2. Richtig reinigen",
      "3. Entspiegelung macht den Unterschied",
      "Sehtest-Termin: Link in der Bio",
    ],
    thumbnailIdea:
      "Blick aus dem Auto in der Dämmerung, ein heller Scheinwerfer mit Blendschein; groß darüber: „Nachts geblendet?“ und Janas Gesicht rechts unten.",
    callToAction: {
      text: "Vereinbaren Sie Ihren persönlichen Sehtest – wir nehmen uns 30 Minuten Zeit für Sie:",
      url: BOOKING_URL,
    },
    variants: [
      {
        channel: "instagram",
        format: "reel",
        text:
          "Nachts geblendet? Drei schnelle Checks für Ihre Brille – im Video zeigt Jana, worauf es ankommt. " +
          "Termin für den Sehtest: Link in der Bio. #Sehtest #Autofahren #Brille #Optiker",
        differences:
          "Hochkant-Reel 35 s, kurzer Text, Hashtags, Termin über Link in der Bio (Links im Text sind dort nicht klickbar).",
      },
      {
        channel: "facebook",
        format: "reel",
        text:
          "Kennen Sie das? Abends auf dem Heimweg blendet jedes Auto. Jana aus unserem Team zeigt drei Dinge, " +
          "die Sie selbst prüfen können – von Kratzern bis zur Entspiegelung. Wie geht es Ihnen bei Dunkelheit " +
          `im Auto? Schreiben Sie es gern in die Kommentare. Hier direkt einen Termin vereinbaren: ${BOOKING_URL}`,
        differences:
          "Gleiches Video im 4:5-Zuschnitt, längerer Text mit Frage an die Community, klickbarer Termin-Link direkt im Beitrag, keine Hashtags.",
      },
    ],
  },
};

const POST_TEXTS: Record<string, string> = {
  T1:
    "Nachts geblendet? Jana zeigt drei Dinge, die Sie heute Abend an Ihrer Brille prüfen können. Termin für Ihren Sehtest: " +
    BOOKING_URL,
  T2: "Abends brennen die Augen nach dem Bildschirmtag? Wir erklären in fünf Bildern, was eine Arbeitsplatzbrille anders macht.",
  T3: "So entsteht Ihre Brille: Ein Blick in unsere Werkstatt, wo jedes Glas passgenau eingeschliffen wird.",
  T4: "Blinzelt Ihr Kind oft oder hält Bücher sehr nah? Diese Anzeichen sollten Eltern kennen.",
  T5: "Kurzer Tipp für klare Sicht: So reinigen Sie Ihre Brille richtig – ohne Kratzer.",
  T6: "Im Advent schauen wir uns Ihre Brille kostenlos an: Schrauben nachziehen, Sitz anpassen, Gläser reinigen. Einfach vorbeikommen!",
  T7: "Wer berät Sie eigentlich bei uns? Heute stellt sich unser Team vor.",
};

export class FakeContentProvider implements ContentProvider {
  readonly name = "FakeContentProvider";
  readonly simulated = true;

  async generateBriefing(idea: Idea, _context: ContentContext): Promise<unknown> {
    const briefing = BRIEFINGS[idea.topicId];
    if (!briefing) {
      throw new Error(`Keine feste Testantwort für ein Briefing zu Thema ${idea.topicId} hinterlegt`);
    }
    return briefing;
  }

  async generatePostText(idea: Idea, _context: ContentContext): Promise<unknown> {
    return { text: POST_TEXTS[idea.topicId] ?? `[Testantwort fehlt] Entwurf zu „${idea.topic}“` };
  }
}
