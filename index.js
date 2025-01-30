const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let games = {};

function onConnection(ws) {
    ws.on('open', () => console.log("Verbindung hergestellt"));
    ws.on('message', (message) => onMessage(ws, message));
    ws.on('close', () => onClose(ws));
}

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

function handleJoinGame(ws, data) {
    const gameId = data.gameId || 'default';
    games[gameId] = games[gameId] || { players: [] };

    const game = games[gameId];
    game.players.push(ws);
    ws.gameId = gameId;

    if (game.players.length === 2) {
        game.players.forEach((player, index) => {
            player.send(JSON.stringify({
                type: 'gameStart',
                playerId: index + 1,
            }));
        });
    }
}


function handlePlayerUpdate(ws, data) {
    const game = games[ws.gameId];
    if (!game) return;

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


function handlePlayerSolved(ws) {
    const game = games[ws.gameId];
    if (!game) return;

    game.players.forEach((player) => {
        player.send(JSON.stringify({
            type: 'gameEnd',
            winner: player === ws,
        }));
    });

    delete games[ws.gameId];
}

function onClose(ws) {
    const gameId = ws.gameId;
    if (!gameId || !games[gameId]) return;

    games[gameId].players = games[gameId].players.filter(player => player !== ws);

    if (games[gameId].players.length === 0) {
        delete games[gameId];
    }
}

wss.on('connection', onConnection);

console.log("WebSocket-Server läuft auf ws://localhost:8080");
