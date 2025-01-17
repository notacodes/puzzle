const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let games = {};

// Verbindung herstellene
function onConnection(ws) {
    ws.on('open', () => console.log("Verbindung hergestellt"));
    ws.on('message', (message) => onMessage(ws, message));
    ws.on('close', () => onClose(ws));
}

// Nachrichtenhandler
function onMessage(ws, message) {
    const data = JSON.parse(message);

    switch (data.type) {
        case 'joinGame':
            handleJoinGame(ws, data);
            break;

        case 'playerUpdate':
            handlePlayerUpdate(ws, data);
            break;

        case 'playerSolved':
            handlePlayerSolved(ws);
            break;
        case 'error':
            alert(data.message);
            break;
        default:
            console.error("Unbekannter Nachrichtentyp:", data.type);
            break;
    }
}

// Spieler einem Spiel hinzufügen
function handleJoinGame(ws, data) {
    const gameId = data.gameId || 'default';
    games[gameId] = games[gameId] || { players: [] };

    // Spieler zur Spiel-Lobby hinzufügen
    const game = games[gameId];
    game.players.push(ws);
    ws.gameId = gameId;

    // Wenn zwei Spieler beigetreten sind, Spiel starten
    if (game.players.length === 2) {
        game.players.forEach((player, index) => {
            player.send(JSON.stringify({
                type: 'gameStart',
                playerId: index + 1,
            }));
        });
    }
}

// Spieleraktualisierung weiterleiten
function handlePlayerUpdate(ws, data) {
    const game = games[ws.gameId];
    if (!game) return;

    // Fortschritt an anderen Spieler senden
    game.players.forEach((player) => {
        if (player !== ws) {
            player.send(JSON.stringify({
                type: 'opponentUpdate',
                puzzle: data.puzzle,
                moves: data.moves,
            }));
        }
    });
}

// Gewinner verkünden
function handlePlayerSolved(ws) {
    const game = games[ws.gameId];
    if (!game) return;

    // Ergebnis an beide Spieler senden
    game.players.forEach((player) => {
        player.send(JSON.stringify({
            type: 'gameEnd',
            winner: player === ws,
        }));
    });

    // Spiel löschen
    delete games[ws.gameId];
}

// Spieler entfernt, wenn Verbindung geschlossen wird
function onClose(ws) {
    const gameId = ws.gameId;
    if (!gameId || !games[gameId]) return;

    // Spieler aus Spiel entfernen
    games[gameId].players = games[gameId].players.filter(player => player !== ws);

    // Spiel löschen, wenn keine Spieler mehr vorhanden sind
    if (games[gameId].players.length === 0) {
        delete games[gameId];
    }
}

wss.on('connection', onConnection);

console.log("WebSocket-Server läuft auf ws://localhost:8080");
