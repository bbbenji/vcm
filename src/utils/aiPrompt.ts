import type { GridSize } from "../stores/matStore";
import type { Language } from "./i18n";

const COLUMNS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Decorative icons that are safe for an AI to place (subset of utils/icons.ts,
// excluding simulator-only symbols like arrows, Bot and EvCharger).
const ALLOWED_ICONS =
  "Car, Rocket, TrainFront, Ship, Plane, Tractor, Bus, Bike, Cat, Dog, Bird, Rabbit, Snail, Bug, Fish, Turtle";

// Builds the instructions a user copies into an external AI chat. The AI's
// answer must match the coordinate TXT format understood by
// parseCoordinateImport in stores/matStore.ts.
export function buildAiPrompt(lang: Language, subject: string, size: GridSize): string {
  const lastCol = COLUMNS[size - 1];

  if (lang === "pl") {
    return `Jesteś artystą pixel-art projektującym planszę edukacyjną dla dzieci.
Zaprojektuj: ${subject}
Płótno: siatka ${size}x${size}. Kolumny to litery A-${lastCol} (od lewej do prawej), wiersze to liczby 1-${size} (od góry do dołu). Komórkę zapisuje się jako litera kolumny + numer wiersza (np. C7). A1 to lewy górny róg.

Odpowiedz WYŁĄCZNIE czystym tekstem dokładnie w tym formacie (bez wyjaśnień, bez markdown):

Wirtualna Mata Koordynaty
==============================
Rozmiar: ${size}x${size}

Tło: #ef4444
=> A1, B1, B2

Tło: #3b82f6
=> C4, C5, D5

Zasady:
- Maluj komórki nagłówkami "Tło: <kolor hex>" - jeden nagłówek na kolor.
- Pod każdym nagłówkiem umieść dokładnie jedną linię zaczynającą się od "=>" z komórkami w tym kolorze, oddzielonymi przecinkami.
- Każdą komórkę wymień pod najwyżej jednym kolorem.
- Nie wychodź poza siatkę: kolumny A-${lastCol}, wiersze 1-${size}.
- Użyj 4-10 kolorów i na tyle dużo komórek, aby projekt był wyraźnie rozpoznawalny; puste komórki całkowicie pomiń.
- Opcjonalnie dodaj nagłówek "Ikona: <nazwa>" (ta sama linia "=>") z dekoracjami. Dozwolone nazwy: ${ALLOWED_ICONS}.`;
  }

  return `You are a pixel artist designing an educational board for children.
Design: ${subject}
Canvas: a ${size}x${size} grid. Columns are letters A-${lastCol} (left to right), rows are numbers 1-${size} (top to bottom). A cell is written as column letter + row number (e.g. C7). A1 is the top-left corner.

Reply with ONLY plain text in exactly this format (no explanations, no markdown):

Virtual Coding Mat Coordinates
==============================
Size: ${size}x${size}

Background: #ef4444
=> A1, B1, B2

Background: #3b82f6
=> C4, C5, D5

Rules:
- Paint cells with "Background: <hex color>" headings - one heading per color.
- Below each heading put exactly one line that starts with "=>" followed by the comma-separated cells in that color.
- List each cell under at most one color.
- Stay inside the grid: columns A-${lastCol}, rows 1-${size}.
- Use 4-10 colors and enough cells that the design is clearly recognizable; leave empty cells out completely.
- Optionally add an "Icon: <name>" heading (same "=>" line format) for decorations. Allowed names: ${ALLOWED_ICONS}.`;
}
