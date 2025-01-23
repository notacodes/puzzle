let puzzle = []; // Initialize the puzzle variable
handleInput();

function getRow(pos) {
    return Math.ceil(pos / size);
}

function getCol(pos) {
    const col = pos % size;
    return col === 0 ? size : col;
}

function renderPuzzle() {
    const puzzleContainer = document.querySelector("#puzzle-container");
    puzzleContainer.innerHTML = "";
    for (let puzzleItem of puzzle) {
        const tile = document.createElement("wired-button");
        tile.classList.add("puzzle-item"); // Uniform styling
        tile.style.left = `${puzzleItem.x}px`;
        tile.style.top = `${puzzleItem.y}px`;
        tile.innerHTML = puzzleItem.disabled ? "" : `<p id="puzzle-number" class="puzzle-text">${puzzleItem.value}</p>`;

        if (puzzleItem.disabled) tile.classList.add("empty");

        tile.addEventListener("click", () => handleTileClick(puzzleItem));
        puzzleContainer.appendChild(tile); // Append element to container
    }
}

function handleInput() {
    document.addEventListener("keydown", handleKeyDown);
}

function handleTileClick(clickedTile) {
    const emptyTile = getEmptyPuzzle();
    moveTileIfValid(clickedTile, emptyTile);
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

function moveTileIfValid(tile, emptyTile) {
    const isAdjacent = Math.abs(tile.x - emptyTile.x) + Math.abs(tile.y - emptyTile.y) === tilesize;
    if (isAdjacent) {
        [tile.x, emptyTile.x] = [emptyTile.x, tile.x];
        [tile.y, emptyTile.y] = [emptyTile.y, tile.y];
        [tile.position, emptyTile.position] = [emptyTile.position, tile.position];
        renderPuzzle();
        if (isPuzzleSolved() === true) {
            socket.send(JSON.stringify({
                action: 'puzzleSolved',
            }));
            console.log("Puzzle solved");
            Celebration();
        }
    }
}

function getTileByPosition(pos, condition) {
    return condition ? puzzle.find((tile) => tile.position === pos) : null;
}

function getEmptyPuzzle() {
    return puzzle.find((tile) => tile.disabled);
}

function isPuzzleSolved() {
    for (let i = 0; i < puzzle.length; i++) {
        console.log(puzzle[i].value);
        if (puzzle[i].value !== puzzle[i].position) {
            return false;
        }
    }
    return true;
}

function clearPuzzle() {
    const puzzleContainer = document.querySelector("#puzzle-container");
    puzzleContainer.innerHTML = '';
}