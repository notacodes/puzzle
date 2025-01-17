let results = {};
let bestTimes = {};
const puzzleContainer = document.querySelector("#puzzle-container");
let puzzle = [];
let size = 3;
let tilesize = 100;
let counter = 0;
let madeFirstMove = false;
let timerInterval;
let startTime;

puzzleContainer.style.width = `${size * tilesize}px`;
puzzleContainer.style.height = `${size * tilesize}px`;

document.addEventListener("DOMContentLoaded", () => {
    loadPuzzleFromURL();
    renderPuzzle();
    handleInput();
});

// Funktion zur Erzeugung eines deterministischen Zufallszahlengenerators basierend auf einem Seed
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Funktion zur Initialisierung und Randomisierung des Puzzles mit einem Seed
function randomizePuzzleWithSeed(seed) {
    if (puzzle.length === 0) {
        generatePuzzle(); // Stelle sicher, dass das Puzzle zuerst generiert wird
    }

    const randomValues = getRandomValuesWithSeed(seed);
    let i = 0;

    for (let puzzleItem of puzzle) {
        puzzleItem.value = randomValues[i];
        puzzleItem.disabled = false;
        i++;
    }

    const emptyPuzzle = puzzle.find((item) => item.value === size * size);
    emptyPuzzle.disabled = true;
    renderPuzzle();
}

// Funktion zur Erzeugung von zufälligen Puzzleteilen basierend auf einem Seed
function getRandomValuesWithSeed(seed) {
    const values = Array.from({ length: size * size }, (_, i) => i + 1);
    const randomValues = [];

    for (let i = 0; i < size * size; i++) {
        const randomIndex = Math.floor(seededRandom(seed) * values.length);
        randomValues.push(values.splice(randomIndex, 1)[0]);
        seed++; // Inkremetierung des Seeds für die nächste Zufallszahl
    }

    return randomValues;
}

// Funktion zur Überprüfung der URL auf einen Seed und zur Initialisierung des Puzzles
function loadPuzzleFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get("seed");

    if (seed) {
        console.log("Seed gefunden:", seed);
        randomizePuzzleWithSeed(parseInt(seed)); // Puzzle mit dem Seed aus der URL initialisieren
    } else {
        const newSeed = Math.floor(Math.random() * 1000000); // Generiere einen neuen zufälligen Seed
        console.log("Kein Seed gefunden. Neuer Seed generiert:", newSeed);
        randomizePuzzleWithSeed(newSeed); // Puzzle mit dem neuen Seed initialisieren
        updateURLWithSeed(newSeed); // URL mit dem neuen Seed aktualisieren
    }
}

// Funktion zum Aktualisieren der URL mit dem Seed
function updateURLWithSeed(seed) {
    const newURL = `${window.location.origin}${window.location.pathname}?seed=${seed}`;
    history.replaceState(null, "", newURL); // URL mit dem Seed aktualisieren, ohne die Seite neu zu laden
}

// Puzzle Container und Initialisierungen
function generatePuzzle() {
    puzzle = [];
    for (let i = 1; i <= size * size; i++) {
        puzzle.push({
            value: i,
            position: i,
            x: (getCol(i) - 1) * tilesize,
            y: (getRow(i) - 1) * tilesize,
            disabled: false,
        });
    }
}

// Hilfsfunktionen für die Berechnung der Zeilen und Spalten
function getRow(pos) {
    return Math.ceil(pos / size);
}

function getCol(pos) {
    const col = pos % size;
    return col === 0 ? size : col;
}

// Funktion zur Darstellung des Puzzles auf der Seite
function renderPuzzle() {
    puzzleContainer.innerHTML = "";
    for (let puzzleItem of puzzle) {
        const tile = document.createElement("wired-button");
        tile.classList.add("puzzle-item");
        tile.style.left = `${puzzleItem.x}px`;
        tile.style.top = `${puzzleItem.y}px`;
        tile.innerHTML = puzzleItem.disabled ? "" : `<p id="puzzle-number">${puzzleItem.value}</p>`;

        if (puzzleItem.disabled) tile.classList.add("empty");

        tile.addEventListener("click", () => handleTileClick(puzzleItem));
        puzzleContainer.appendChild(tile);
    }
}

// Funktion, die aufgerufen wird, wenn ein Puzzleteil angeklickt wird
function handleTileClick(clickedTile) {
    const emptyTile = getEmptyPuzzle();
    moveTileIfValid(clickedTile, emptyTile);
    if (!madeFirstMove) {
        startTimer();
        madeFirstMove = true;
    }
}

// Funktion zur Berechnung des leeren Puzzleteils
function getEmptyPuzzle() {
    return puzzle.find((tile) => tile.disabled);
}

// Funktion zur Überprüfung, ob das Puzzle korrekt gelöst ist
function isPuzzleSolved() {
    for (let i = 0; i < puzzle.length; i++) {
        if (puzzle[i].value !== puzzle[i].position) {
            return false;
        }
    }
    return true;
}

// Funktion zur Bewegung eines Puzzleteils, falls die Bewegung gültig ist
function moveTileIfValid(tile, emptyTile) {
    const isAdjacent = Math.abs(tile.x - emptyTile.x) + Math.abs(tile.y - emptyTile.y) === tilesize;
    if (isAdjacent) {
        [tile.x, emptyTile.x] = [emptyTile.x, tile.x];
        [tile.y, emptyTile.y] = [emptyTile.y, tile.y];
        [tile.position, emptyTile.position] = [emptyTile.position, tile.position];
        counter++;
        updateCounter();
        renderPuzzle();
        if (isPuzzleSolved()) {
            solved();
            updateResults();
            counter = 0;
            updateCounter();
        }
    }
}

const shuffel = document.getElementById("shuffle");
shuffel.addEventListener("click", shufflePuzzle);

function shufflePuzzle() {
    madeFirstMove = false;
    counter = 0;
    updateCounter();
    resetTimer();
    const newSeed = Math.floor(Math.random() * 1000000);
    randomizePuzzleWithSeed(newSeed);
    updateURLWithSeed(newSeed);
    renderPuzzle();
}

const goBigger = document.getElementById("goBigger");
goBigger.addEventListener("click", biggerPuzzle);

function biggerPuzzle() {
    resetTimer();
    madeFirstMove = false;
    size++;
    puzzle = [];
    puzzleContainer.style.width = `${size * tilesize}px`;
    puzzleContainer.style.height = `${size * tilesize}px`;
    generatePuzzle();
    const newSeed = Math.floor(Math.random() * 1000000);
    randomizePuzzleWithSeed(newSeed);
    updateURLWithSeed(newSeed);
    renderPuzzle();
    handleInput();
    counter = 0;
    updateCounter();
}

const counterHTML = document.getElementById("counter");

function updateCounter() {
    counterHTML.innerHTML = counter;
}

function updateResults() {
    const sizeKey = `${size}x${size}`;
    const elapsedTime = Date.now() - startTime;
    const timeInSeconds = Math.floor(elapsedTime / 1000);

    if (!results[sizeKey] || counter < results[sizeKey]) {
        results[sizeKey] = counter;
    }

    if (!bestTimes[sizeKey] || timeInSeconds < bestTimes[sizeKey]) {
        bestTimes[sizeKey] = timeInSeconds;
    }

    saveResults();
    displayResults();
}

function displayResults() {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    for (let key in results) {
        const resultItem = document.createElement("div");
        const bestTime = bestTimes[key] ? `${Math.floor(bestTimes[key] / 60)}:${String(bestTimes[key] % 60).padStart(2, '0')}` : "N/A";
        resultItem.textContent = `Puzzle ${key}: ${results[key]} moves, Best Time: ${bestTime}`;
        resultsContainer.appendChild(resultItem);
    }
}

function saveResults() {
    localStorage.setItem("puzzleResults", JSON.stringify(results));
    localStorage.setItem("puzzleBestTimes", JSON.stringify(bestTimes));
}

function loadResults() {
    const savedResults = localStorage.getItem("puzzleResults");
    const savedBestTimes = localStorage.getItem("puzzleBestTimes");

    if (savedResults) {
        results = JSON.parse(savedResults);
    }

    if (savedBestTimes) {
        bestTimes = JSON.parse(savedBestTimes);
    }

    displayResults();
}

document.addEventListener("DOMContentLoaded", loadResults);

const dialog = document.querySelector('wired-dialog');
dialog.open = false;

const closeButton = document.getElementById("dialog-close");
closeButton.addEventListener("click", () => {
    dialog.open = false;
});

function Celebration() {
    var count = 230;
    var defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}

function solved() {
    stopTimer();
    puzzleContainer.innerHTML = "";
    let dialogMoves = document.getElementById("dialog-moves");
    dialogMoves.innerHTML = counter;
    dialog.open = true;
    Celebration();
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    document.getElementById('timer').textContent = '00:00';
}

function isPuzzleToEasy() {
    let correctTiles = 0;
    for (let i = 0; i < puzzle.length; i++) {
        if (puzzle[i].value === puzzle[i].position) {
            correctTiles++;
        }
    }
    return correctTiles > 3;
}
function handleInput() {
    document.addEventListener("keydown", handleKeyDown);
}
function handleKeyDown(e) {
    const emptyTile = getEmptyPuzzle();
    let neighbor;
    switch (e.key) {
        case "ArrowLeft":
            neighbor = getTileByPosition(emptyTile.position + 1, getCol(emptyTile.position) < size);
            break;
        case "ArrowRight":
            neighbor = getTileByPosition(emptyTile.position - 1, getCol(emptyTile.position) > 1);
            break;
        case "ArrowUp":
            neighbor = getTileByPosition(emptyTile.position + size, getRow(emptyTile.position) < size);
            break;
        case "ArrowDown":
            neighbor = getTileByPosition(emptyTile.position - size, getRow(emptyTile.position) > 1);
            break;
    }
    if (neighbor) moveTileIfValid(neighbor, emptyTile);
}
function getTileByPosition(pos, condition) {
    return condition ? puzzle.find((tile) => tile.position === pos) : null;
}
function copyLinkToClipboard() {
    const currentUrl = window.location.href;
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = currentUrl;
    tempInput.select();
    tempInput.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        console.log('Link wurde in die Zwischenablage kopiert!');
    } catch (err) {
        console.error('Fehler beim Kopieren des Links:', err);
    }

    document.body.removeChild(tempInput);
}
document.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', copyLinkToClipboard);
    }
});

