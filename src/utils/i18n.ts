export type Language = 'pl' | 'en'

export const translations = {
  pl: {
    title: 'Wirtualna Mata',
    size: 'Rozmiar:',
    undo: 'Cofnij',
    clear: 'Wyczyść',
    clearConfirm: 'Czy na pewno chcesz wyczyścić całą planszę?',
    cancel: 'Anuluj',
    share: 'Udostępnij',
    copied: 'Skopiowano',
    shareExport: 'Udostępnij / Pobierz',
    download: 'Pobierz',
    downloadPng: 'Obrazek (PNG)',
    downloadPdf: 'Dokument (PDF)',
    downloadTxt: 'Koordynaty (TXT)',
    importTxt: 'Import TXT',
    importSuccess: 'Zaimportowano',
    importFailed: 'Błąd importu',
    eraser: 'Gumka',
    inventory: 'Plecak',
    taskToPerform: 'Zadanie do wykonania:',
    emptyBoardAlert: 'Plansza jest pusta.',
    exportTitle: 'Wirtualna Mata Koordynaty',
    bg: 'Kolory',
    move: 'Ruch',
    num: 'Cyfry',
    abc: 'Alfabet',
    veh: 'Pojazdy',
    ani: 'Zwierzęta',
    tasks: 'Zadania',
    simulator: 'Symulator:',
    simReady: 'Gotowy',
    simPaused: 'Wstrzymano',
    simStep: 'Krok',
    simSuccess: 'Sukces! 🎉',
    simCollision: 'Kraksa! 💥',
    simOutOfBounds: 'Poza planszą! 🗺️',
    simEnd: 'Koniec',
    simResume: 'Wznów',
    simStart: 'START',
    simPause: 'Pauza',
    simResetTitle: 'Resetuj symulację',
    simSolutionTitle: 'Pokaż gotowe rozwiązanie',
    speedSlow: 'Prędkość: Żółw (wolno)',
    speedNormal: 'Prędkość: Normalna',
    speedFast: 'Prędkość: Zając (szybko)',
    loadBoard: 'Uruchom planszę',
    pattern: 'Wzór',
    task: 'Zadanie',
    soundToggle: 'Dźwięki',
    themeToggle: 'Motyw',
    menuExpand: 'Rozwiń menu',
    menuCollapse: 'Zwiń menu',

    // Template Translations
    tpl_heart_name: 'Serduszko',
    tpl_heart_desc: 'Gotowy kolorowy wzór czerwonego serduszka.',

    tpl_rocket_name: 'Rakieta',
    tpl_rocket_desc: 'Kosmiczny pixel art gotowej rakiety.',

    tpl_flower_name: 'Wesoły Kwiatek',
    tpl_flower_desc: 'Kolorowy, wiosenny pixel art kwiatka w doniczce.',

    tpl_house_name: 'Domek w Ogrodzie',
    tpl_house_desc: 'Klasyczny pixel art domku z ogródkiem i słońcem.',

    tpl_maze1_name: 'Labirynt Robota',
    tpl_maze1_desc: 'Doprowadź robota z A1 do baterii na J10, omijając szare ściany!',
    tpl_maze1_instr:
      '1. Znajdź robota (Bot) w lewym górnym rogu (A1).\n2. Zaprogramuj trasę na dolnej planszy za pomocą strzałek.\n3. Omijaj szare ściany (przeszkody).\n4. Cel: Ładowarka baterii na J10!',

    tpl_pirate_maze_name: 'Kosmiczna Misja',
    tpl_pirate_maze_desc:
      'Poprowadź robota z bazy A10 do ładowarki na J1, omijając kosmiczne przeszkody!',
    tpl_pirate_maze_instr:
      'Pomóż robotowi dotrzeć do ładowarki:\n\n1. Twój robot (Bot) startuje w lewym dolnym rogu (A10).\n2. Unikaj niebezpiecznych przeszkód oznaczonych kolorem szarym.\n3. Ułóż instrukcję ruchu na dolnej planszy za pomocą strzałek.\n4. Cel: Doprowadź robota do ładowarki (baterii na J1)!',

    tpl_coded_heart_name: 'Zakodowane Serduszko',
    tpl_coded_heart_desc:
      'Plansza jest pusta! Odkryj rysunek, kolorując kratki według podanej instrukcji współrzędnych.',
    tpl_coded_heart_instr:
      'Odkryj obrazek! Pokoloruj kratki na CZERWONO:\n\n- C2, D2, G2, H2\n- B3 do I3 (czyli B3, C3, D3, E3, F3, G3, H3, I3)\n- B4 do I4\n- B5 do I5\n- C6 do H6\n- D7 do G7\n- E8, F8',

    tpl_butterfly_symmetry_name: 'Symetryczny Motylek',
    tpl_butterfly_symmetry_desc:
      'Narysuj drugą połówkę motylka! Dokończ rysunek symetrycznie względem pionowej linii.',
    tpl_butterfly_symmetry_instr:
      'Kolorowy motyl zgubił wzory na prawym skrzydle!\n\n1. Odbij lewą stronę rysunku symetrycznie (jak w lustrze) na prawą stronę.\n2. Oś symetrii przebiega pionowo na środku maty (między kolumnami E a F).\n3. Zachowaj te same kolory na odpowiadających sobie polach!',
  },
  en: {
    title: 'Virtual Coding Mat',
    size: 'Size:',
    undo: 'Undo',
    clear: 'Clear',
    clearConfirm: 'Are you sure you want to clear the entire board?',
    cancel: 'Cancel',
    share: 'Share',
    copied: 'Copied',
    shareExport: 'Share / Export',
    download: 'Download',
    downloadPng: 'Image (PNG)',
    downloadPdf: 'Document (PDF)',
    downloadTxt: 'Coordinates (TXT)',
    importTxt: 'Import TXT',
    importSuccess: 'Imported',
    importFailed: 'Import failed',
    eraser: 'Eraser',
    inventory: 'Inventory',
    taskToPerform: 'Task to complete:',
    emptyBoardAlert: 'The board is empty.',
    exportTitle: 'Virtual Coding Mat Coordinates',
    bg: 'Colors',
    move: 'Movement',
    num: 'Digits',
    abc: 'Alphabet',
    veh: 'Vehicles',
    ani: 'Animals',
    tasks: 'Tasks',
    simulator: 'Simulator:',
    simReady: 'Ready',
    simPaused: 'Paused',
    simStep: 'Step',
    simSuccess: 'Success! 🎉',
    simCollision: 'Crash! 💥',
    simOutOfBounds: 'Out of bounds! 🗺️',
    simEnd: 'End',
    simResume: 'Resume',
    simStart: 'START',
    simPause: 'Pause',
    simResetTitle: 'Reset simulation',
    simSolutionTitle: 'Show completed solution',
    speedSlow: 'Speed: Turtle (slow)',
    speedNormal: 'Speed: Normal',
    speedFast: 'Speed: Hare (fast)',
    loadBoard: 'Load Board',
    pattern: 'Pattern',
    task: 'Task',
    soundToggle: 'Sounds',
    themeToggle: 'Theme',
    menuExpand: 'Expand Menu',
    menuCollapse: 'Collapse Menu',

    // Template Translations
    tpl_heart_name: 'Little Heart',
    tpl_heart_desc: 'A ready-made colorful red heart pattern.',

    tpl_rocket_name: 'Rocket',
    tpl_rocket_desc: 'A space themed pixel art of a rocket ship.',

    tpl_flower_name: 'Cheerful Flower',
    tpl_flower_desc: 'A colorful, spring pixel art of a flower in a pot.',

    tpl_house_name: 'Garden House',
    tpl_house_desc: 'A classic pixel art house with a yard and the sun.',

    tpl_maze1_name: 'Robot Maze',
    tpl_maze1_desc: 'Guide the robot from A1 to the battery at J10, avoiding the grey walls!',
    tpl_maze1_instr:
      '1. Locate the robot (Bot) in the top-left corner (A1).\n2. Program the path on the bottom panel using arrows.\n3. Avoid the grey walls (obstacles).\n4. Goal: Reach the battery at J10!',

    tpl_pirate_maze_name: 'Space Mission',
    tpl_pirate_maze_desc:
      'Guide the robot from base A10 to the charger at J1, avoiding space obstacles!',
    tpl_pirate_maze_instr:
      'Help the robot reach the charger:\n\n1. Your robot (Bot) starts in the bottom-left corner (A10).\n2. Avoid dangerous space obstacles marked in grey.\n3. Program your movements on the bottom panel using arrows.\n4. Goal: Reach the charger (battery at J1)!',

    tpl_coded_heart_name: 'Coded Heart',
    tpl_coded_heart_desc:
      'The board is empty! Discover the drawing by coloring the cells according to the coordinate clues.',
    tpl_coded_heart_instr:
      'Reveal the image! Color the following cells in RED:\n\n- C2, D2, G2, H2\n- B3 to I3 (which means B3, C3, D3, E3, F3, G3, H3, I3)\n- B4 to I4\n- B5 to I5\n- C6 to H6\n- D7 to G7\n- E8, F8',

    tpl_butterfly_symmetry_name: 'Symmetry Butterfly',
    tpl_butterfly_symmetry_desc:
      'Draw the other half of the butterfly! Complete the drawing symmetrically across the center vertical line.',
    tpl_butterfly_symmetry_instr:
      'A colorful butterfly lost the pattern on its right wing!\n\n1. Mirror the left side of the drawing symmetrically to the right side.\n2. The line of symmetry runs vertically down the middle (between columns E and F).\n3. Keep the matching colors on the corresponding cells!',
  },
} as const
