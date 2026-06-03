export type Language = "pl" | "en";

export const translations = {
  pl: {
    title: "Wirtualna Mata",
    size: "Rozmiar:",
    undo: "Cofnij",
    clear: "Wyczyść",
    clearConfirm: "Czy na pewno chcesz wyczyścić całą planszę?",
    cancel: "Anuluj",
    share: "Udostępnij",
    copied: "Skopiowano",
    shareExport: "Udostępnij / Pobierz",
    download: "Pobierz",
    downloadPng: "Obrazek (PNG)",
    downloadPdf: "Dokument (PDF)",
    downloadTxt: "Koordynaty (TXT)",
    importTxt: "Import TXT",
    importSuccess: "Zaimportowano",
    importFailed: "Błąd importu",
    eraser: "Gumka",
    inventory: "Plecak",
    taskToPerform: "Zadanie do wykonania:",
    emptyBoardAlert: "Plansza jest pusta.",
    exportTitle: "Wirtualna Mata Koordynaty",
    bg: "Kolory",
    customColor: "Własny kolor",
    recentColors: "Ostatnie kolory",
    move: "Ruch",
    num: "Cyfry",
    abc: "Alfabet",
    veh: "Pojazdy",
    ani: "Zwierzęta",
    tasks: "Zadania",
    my_mats: "Maty",
    emoji: "Emotikony",
    emoji_people: "Ludzie",
    emoji_nature: "Natura",
    emoji_foods: "Jedzenie",
    emoji_activity: "Aktywność",
    emoji_places: "Miejsca",
    emoji_objects: "Obiekty",
    emoji_symbols: "Symbole",
    emoji_flags: "Flagi",
    saveMat: "Zapisz planszę",
    saveCurrentMatTitle: "Zapisz obecną planszę",
    matTitlePlaceholder: "Nazwa szablonu (np. Mój Labirynt)...",
    matDescPlaceholder: "Krótki opis zadania...",
    matInstrPlaceholder: "Instrukcje lub wskazówki dla uczniów (opcjonalnie)...",
    saveBtn: "Zapisz w przeglądarce",
    saveChanges: "Zapisz zmiany (Nadpisz)",
    saveAsNew: "Zapisz jako nową",
    saveSuccess: "Zapisano szablon!",
    saveSuccessUpdate: "Szablon został zaktualizowany!",
    emptyCustomMats: "Brak zapisanych szablonów. Stwórz coś ciekawego na planszy i wpisz dane powyżej, aby zapisać!",
    deleteConfirm: "Czy na pewno chcesz usunąć ten szablon?",
    simulator: "Symulator:",
    simReady: "Gotowy",
    simPaused: "Wstrzymano",
    simStep: "Krok",
    simSuccess: "Sukces!",
    simCollision: "Kraksa!",
    simOutOfBounds: "Poza planszą!",
    simEnd: "Koniec",
    simResume: "Wznów",
    simStart: "START",
    simPause: "Pauza",
    simResetTitle: "Resetuj symulację",
    simSolutionTitle: "Pokaż gotowe rozwiązanie",
    speedSlow: "Prędkość: Żółw (wolno)",
    speedNormal: "Prędkość: Normalna",
    speedFast: "Prędkość: Zając (szybko)",
    loadBoard: "Uruchom planszę",
    pattern: "Wzór",
    task: "Zadanie",
    soundToggle: "Dźwięki",
    themeToggle: "Motyw",
    menuExpand: "Rozwiń menu",
    menuCollapse: "Zwiń menu",

    // Movement Legend
    moveLegendTitle: "Legenda symboli",
    moveLegendSimTag: "Symulator",
    moveLegendExtTag: "Dekoracyjny",
    moveLegendBot: "Robot – postać, którą programujesz",
    moveLegendEvCharger: "Ładowarka – cel robota",
    moveLegendArrowUp: "Ruch w górę",
    moveLegendArrowDown: "Ruch w dół",
    moveLegendArrowRight: "Ruch w prawo",
    moveLegendArrowLeft: "Ruch w lewo",
    moveLegendCornerUpRight: "Skręt w prawo",
    moveLegendCornerUpLeft: "Skręt w lewo",
    moveLegendNum: "Powtórz × razy (2–6)",
    moveLegendPlayFilled: "Start (dekoracja)",
    moveLegendStopFilled: "Stop (dekoracja)",
    moveLegendF1: "Funkcja F1 (dekoracja)",
    moveLegendF2: "Funkcja F2 (dekoracja)",
    moveLegendLoopPlay: "Pętla start (dekoracja)",
    moveLegendLoopStop: "Pętla stop (dekoracja)",

    // Number Category Translations
    num_basic: "Podstawowa arytmetyka i nawiasy",
    num_adv: "Zaawansowane równania i porównania",
    num_alg: "Algebra, pierwiastki i potęgi",
    num_const: "Stałe i analiza matematyczna",
    num_set: "Teoria mnogości i logika",
    num_geo: "Geometria i trygonometria",

    // Category Translations
    cat_pixel_art: "Rysunki i Pixel Art",
    cat_algorithm: "Ruch i Algorytmy",
    cat_math_symmetry: "Matematyka i Symetria",
    cat_my_mats: "Własne Maty",

    // Template Translations
    tpl_heart_name: "Serduszko",
    tpl_heart_desc: "Gotowy kolorowy wzór czerwonego serduszka.",

    tpl_rocket_name: "Rakieta",
    tpl_rocket_desc: "Kosmiczny pixel art gotowej rakiety.",

    tpl_flower_name: "Wesoły Kwiatek",
    tpl_flower_desc: "Kolorowy, wiosenny pixel art kwiatka w doniczce.",

    tpl_house_name: "Domek w Ogrodzie",
    tpl_house_desc: "Klasyczny pixel art domku z ogródkiem i słońcem.",

    tpl_maze1_name: "Labirynt Robota",
    tpl_maze1_desc: "Doprowadź robota z A1 do ładowarki na J10, omijając szare ściany!",
    tpl_maze1_instr:
      "1. Znajdź robota (Bot) w lewym górnym rogu (A1).\n2. Zaprogramuj trasę na dolnej planszy za pomocą strzałek.\n3. Omijaj szare ściany (przeszkody).\n4. Cel: Ładowarka na J10!",

    tpl_pirate_maze_name: "Kosmiczna Misja",
    tpl_pirate_maze_desc:
      "Poprowadź robota z bazy A10 do ładowarki na J1, omijając kosmiczne przeszkody!",
    tpl_pirate_maze_instr:
      "Pomóż robotowi dotrzeć do ładowarki:\n\n1. Twój robot (Bot) startuje w lewym dolnym rogu (A10).\n2. Unikaj niebezpiecznych przeszkód oznaczonych kolorem szarym.\n3. Ułóż instrukcję ruchu na dolnej planszy za pomocą strzałek.\n4. Cel: Doprowadź robota do ładowarki (na J1)!",

    tpl_coded_heart_name: "Zakodowane Serduszko",
    tpl_coded_heart_desc:
      "Plansza jest pusta! Odkryj rysunek, kolorując kratki według podanej instrukcji współrzędnych.",
    tpl_coded_heart_instr:
      "Odkryj obrazek! Pokoloruj kratki na CZERWONO:\n\n- C2, D2, G2, H2\n- B3 do I3 (czyli B3, C3, D3, E3, F3, G3, H3, I3)\n- B4 do I4\n- B5 do I5\n- C6 do H6\n- D7 do G7\n- E8, F8",

    tpl_butterfly_symmetry_name: "Symetryczny Motylek",
    tpl_butterfly_symmetry_desc:
      "Narysuj drugą połówkę motylka! Dokończ rysunek symetrycznie względem pionowej linii.",
    tpl_butterfly_symmetry_instr:
      "Kolorowy motyl zgubił wzory na prawym skrzydle!\n\n1. Odbij lewą stronę rysunku symetrycznie (jak w lustrze) na prawą stronę.\n2. Oś symetrii przebiega pionowo na środku maty (między kolumnami E a F).\n3. Zachowaj te same kolory na odpowiadających sobie polach!",

    tpl_castle_name: "Zamek Rycerski",
    tpl_castle_desc: "Wspaniała brama zamku z basztami i powiewającymi flagami na matrycy 12x12.",

    tpl_island_maze_name: "Wyspa Skarbów",
    tpl_island_maze_desc:
      "Doprowadź robota przez rafy koralowe na planszy 12x12, zbierając nagrody!",
    tpl_island_maze_instr:
      "Pomóż robotowi zebrać skarby i dopłynąć do stacji ładowania na L12!\n\n1. Startujesz w lewym górnym rogu (A1).\n2. Zbierz po drodze konsolę i zębatkę.\n3. Omijaj ciemne rafy koralowe.\n4. Cel: ładowarka na L12!",

    tpl_shield_symmetry_name: "Tarcza Rycerza",
    tpl_shield_symmetry_desc:
      "Dokończ rysowanie symetrycznej królewskiej tarczy rycerskiej na planszy 12x12.",
    tpl_shield_symmetry_instr:
      "Tarcza rycerska straciła swoją prawą połówkę!\n\n1. Odbij lewą stronę rysunku symetrycznie względem środkowej linii (między F a G).\n2. Zachowaj królewskie barwy (złoty, szafirowy, błękitny)!",

    tpl_digital_robot_name: "Cyfrowy Robot",
    tpl_digital_robot_desc: "Zaawansowany pixel art cyber-robota na dużej planszy 20x20.",

    tpl_space_labyrinth_name: "Galaktyczny Labirynt",
    tpl_space_labyrinth_desc:
      "Wielki labirynt 20x20. Zaprogramuj długą misję kosmiczną i zbierz wszystkie akumulatory!",
    tpl_space_labyrinth_instr:
      "Poprowadź robota przez gigantyczny labirynt 20x20!\n\n1. Startujesz na A1.\n2. Cel to stacja ładowania na T20 (prawy dolny róg).\n3. Omijaj kosmiczne barierki.\n4. Zbierz rozrzucone urządzenia po drodze!",
  },
  en: {
    title: "Virtual Coding Mat",
    size: "Size:",
    undo: "Undo",
    clear: "Clear",
    clearConfirm: "Are you sure you want to clear the entire board?",
    cancel: "Cancel",
    share: "Share",
    copied: "Copied",
    shareExport: "Share / Export",
    download: "Download",
    downloadPng: "Image (PNG)",
    downloadPdf: "Document (PDF)",
    downloadTxt: "Coordinates (TXT)",
    importTxt: "Import TXT",
    importSuccess: "Imported",
    importFailed: "Import failed",
    eraser: "Eraser",
    inventory: "Inventory",
    taskToPerform: "Task to complete:",
    emptyBoardAlert: "The board is empty.",
    exportTitle: "Virtual Coding Mat Coordinates",
    bg: "Colors",
    customColor: "Custom color",
    recentColors: "Recent Colors",
    move: "Movement",
    num: "Digits",
    abc: "Alphabet",
    veh: "Vehicles",
    ani: "Animals",
    tasks: "Tasks",
    my_mats: "Mats",
    emoji: "Emojis",
    emoji_people: "People",
    emoji_nature: "Nature",
    emoji_foods: "Foods",
    emoji_activity: "Activity",
    emoji_places: "Places",
    emoji_objects: "Objects",
    emoji_symbols: "Symbols",
    emoji_flags: "Flags",
    saveMat: "Save Board",
    saveCurrentMatTitle: "Save Current Board",
    matTitlePlaceholder: "Template name (e.g., My Maze)...",
    matDescPlaceholder: "Short description of the task...",
    matInstrPlaceholder: "Instructions or tips for students (optional)...",
    saveBtn: "Save to Browser",
    saveChanges: "Save Changes (Overwrite)",
    saveAsNew: "Save as New",
    saveSuccess: "Template saved!",
    saveSuccessUpdate: "Template updated!",
    emptyCustomMats: "No saved templates yet. Create something interesting on the board and fill out the form above to save!",
    deleteConfirm: "Are you sure you want to delete this template?",
    simulator: "Simulator:",
    simReady: "Ready",
    simPaused: "Paused",
    simStep: "Step",
    simSuccess: "Success!",
    simCollision: "Crash!",
    simOutOfBounds: "Out of bounds!",
    simEnd: "End",
    simResume: "Resume",
    simStart: "START",
    simPause: "Pause",
    simResetTitle: "Reset simulation",
    simSolutionTitle: "Show completed solution",
    speedSlow: "Speed: Turtle (slow)",
    speedNormal: "Speed: Normal",
    speedFast: "Speed: Hare (fast)",
    loadBoard: "Load Board",
    pattern: "Pattern",
    task: "Task",
    soundToggle: "Sounds",
    themeToggle: "Theme",
    menuExpand: "Expand Menu",
    menuCollapse: "Collapse Menu",

    // Movement Legend
    moveLegendTitle: "Symbol legend",
    moveLegendSimTag: "Simulator",
    moveLegendExtTag: "Decorative",
    moveLegendBot: "Robot – the character you program",
    moveLegendEvCharger: "Charger – the robot's goal",
    moveLegendArrowUp: "Move up",
    moveLegendArrowDown: "Move down",
    moveLegendArrowRight: "Move right",
    moveLegendArrowLeft: "Move left",
    moveLegendCornerUpRight: "Turn right",
    moveLegendCornerUpLeft: "Turn left",
    moveLegendNum: "Repeat × times (2–6)",
    moveLegendPlayFilled: "Start (decorative)",
    moveLegendStopFilled: "Stop (decorative)",
    moveLegendF1: "Function F1 (decorative)",
    moveLegendF2: "Function F2 (decorative)",
    moveLegendLoopPlay: "Loop start (decorative)",
    moveLegendLoopStop: "Loop stop (decorative)",

    // Number Category Translations
    num_basic: "Basic Arithmetic & Grouping",
    num_adv: "Advanced Equality & Comparison",
    num_alg: "Algebra, Roots & Exponents",
    num_const: "Constants & Calculus",
    num_set: "Set Theory & Logic",
    num_geo: "Geometry & Trigonometry",

    // Category Translations
    cat_pixel_art: "Pixel Art & Patterns",
    cat_algorithm: "Movement & Algorithms",
    cat_math_symmetry: "Symmetry & Math",
    cat_my_mats: "Custom Mats",

    // Template Translations
    tpl_heart_name: "Little Heart",
    tpl_heart_desc: "A ready-made colorful red heart pattern.",

    tpl_rocket_name: "Rocket",
    tpl_rocket_desc: "A space themed pixel art of a rocket ship.",

    tpl_flower_name: "Cheerful Flower",
    tpl_flower_desc: "A colorful, spring pixel art of a flower in a pot.",

    tpl_house_name: "Garden House",
    tpl_house_desc: "A classic pixel art house with a yard and the sun.",

    tpl_maze1_name: "Robot Maze",
    tpl_maze1_desc: "Guide the robot from A1 to the charger at J10, avoiding the grey walls!",
    tpl_maze1_instr:
      "1. Locate the robot (Bot) in the top-left corner (A1).\n2. Program the path on the bottom panel using arrows.\n3. Avoid the grey walls (obstacles).\n4. Goal: Reach the charger at J10!",

    tpl_pirate_maze_name: "Space Mission",
    tpl_pirate_maze_desc:
      "Guide the robot from base A10 to the charger at J1, avoiding space obstacles!",
    tpl_pirate_maze_instr:
      "Help the robot reach the charger:\n\n1. Your robot (Bot) starts in the bottom-left corner (A10).\n2. Avoid dangerous space obstacles marked in grey.\n3. Program your movements on the bottom panel using arrows.\n4. Goal: Reach the charger (J1)!",

    tpl_coded_heart_name: "Coded Heart",
    tpl_coded_heart_desc:
      "The board is empty! Discover the drawing by coloring the cells according to the coordinate clues.",
    tpl_coded_heart_instr:
      "Reveal the image! Color the following cells in RED:\n\n- C2, D2, G2, H2\n- B3 to I3 (which means B3, C3, D3, E3, F3, G3, H3, I3)\n- B4 to I4\n- B5 to I5\n- C6 to H6\n- D7 to G7\n- E8, F8",

    tpl_butterfly_symmetry_name: "Symmetry Butterfly",
    tpl_butterfly_symmetry_desc:
      "Draw the other half of the butterfly! Complete the drawing symmetrically across the center vertical line.",
    tpl_butterfly_symmetry_instr:
      "A colorful butterfly lost the pattern on its right wing!\n\n1. Mirror the left side of the drawing symmetrically to the right side.\n2. The line of symmetry runs vertically down the middle (between columns E and F).\n3. Keep the matching colors on the corresponding cells!",

    tpl_castle_name: "Knightly Castle",
    tpl_castle_desc: "A grand castle gate with stone towers and waving flags on a 12x12 grid.",

    tpl_island_maze_name: "Treasure Island",
    tpl_island_maze_desc:
      "Guide the robot through coral reefs on a large 12x12 grid, collecting treasure!",
    tpl_island_maze_instr:
      "Help the robot collect treasure and reach the charger at L12!\n\n1. You start in the top-left corner (A1).\n2. Gather the gamepad and puzzle gear along the way.\n3. Avoid the dark reefs.\n4. Goal: charger at L12!",

    tpl_shield_symmetry_name: "Knight Shield",
    tpl_shield_symmetry_desc:
      "Complete the drawing of a symmetrical royal knight's shield on a 12x12 grid.",
    tpl_shield_symmetry_instr:
      "The knight's shield is missing its right half!\n\n1. Mirror the left side of the shield symmetrically across the center line (between F and G).\n2. Retain the royal colors (gold, sapphire, cyan)!",

    tpl_digital_robot_name: "Digital Robot",
    tpl_digital_robot_desc: "An intricate pixel art cyber-robot head on a large 20x20 board.",

    tpl_space_labyrinth_name: "Galactic Labyrinth",
    tpl_space_labyrinth_desc:
      "An epic 20x20 labyrinth. Program a long-range space journey and retrieve energy devices!",
    tpl_space_labyrinth_instr:
      "Guide the robot through the giant 20x20 maze!\n\n1. Start at A1.\n2. Reach the hyper-charger at T20 (bottom-right corner).\n3. Dodge cosmic asteroid blockades.\n4. Collect all the scattered devices along the route!",
  },
} as const;
