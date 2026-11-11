// Setzt den Demo-Zustand zurück (Ausgaben, Freigabeordner, Ledger). Eingaben bleiben unverändert.

import { rmSync } from "node:fs";
import { join } from "node:path";
import { terminalTexts } from "../i18n";

rmSync(join(process.cwd(), "data", "output"), { recursive: true, force: true });
console.log(terminalTexts().ui.resetDone);
