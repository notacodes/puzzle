const socketUrl = "ws://localhost:8080/ws";
let socket;
let lobbyCode = null;
let tilesize = 100;
let size = 3;
let isLobbyCreator = false;

document.addEventListener("DOMContentLoaded", () => {
    getDailySeed();
    displayStreak();

});

function connectSocket() {
    try {
        console.log("Versuche, eine Verbindung zum WebSocket herzustellen...");

        socket = new WebSocket(socketUrl);

        socket.onopen = () => {
            console.log("WebSocket-Verbindung hergestellt.");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.action) {
                case 'lobbyCreated':
                    showCustomAlert(`Lobby created! Code: ${data.code}`);
                    document.getElementById('copyLobbyCode').style.display = 'block';
                    lobbyCode = data.code;
                    isLobbyCreator = true;
                    document.getElementById('lobbycode').innerText = `Lobby#${lobbyCode}`;
                    size = data.size;
                    document.getElementById('lobbystart').style.display = 'block';
                    document.getElementById('leaveLobby').style.display = 'block';
                    updatePlayerList(data.players);
                    break;
                case 'lobbyJoined':
                    document.getElementById('lobby-options').style.display = 'none';
                    document.getElementById('container').style.display = 'block';
                    document.getElementById('container').innerHTML = '';
                    document.getElementById('copyLobbyCode').style.display = 'block';
                    showCustomAlert(`Successfully joined the ${data.code} lobby!`);
                    size = data.size;
                    console.log(size);
                    document.getElementById('lobbycode').innerText = `Lobby#${data.code}`;
                    document.getElementById('leaveLobby').style.display = 'block';
                    updatePlayerList(data.players);
                    break;
                case 'lobbyNotFound':
                    showCustomAlertWarning('Lobby code not found. Please check the code and try again.');
                    document.getElementById('lobby-options').style.display = 'block';
                    document.getElementById('container').style.display = 'none';
                    break;
                case 'leftLobby':
                    const containerdiv = document.getElementById('container');
                    containerdiv.innerHTML = '';
                    showCustomAlert('You have left the lobby');
                    resetLobbyState();
                    break;
                case 'updatePlayerList':
                    console.log('Updating player list');
                    updatePlayerList(data.players);
                    break;
                case 'gameStarted':
                    console.log('Game started');
                    document.getElementById('playagain-container').style.display = 'none';
                    document.getElementById('container').style.display = 'block';
                    document.getElementById('lobbystart').style.display = 'none';
                    const container = document.getElementById('container');
                    container.innerHTML = '';

                    const wiredCard = document.createElement('wired-card');
                    const puzzleContainer = document.createElement('div');
                    puzzleContainer.id = 'puzzle-container';
                    wiredCard.appendChild(puzzleContainer);
                    container.appendChild(wiredCard);

                    puzzleContainer.style.width = `${size * tilesize}px`;
                    puzzleContainer.style.height = `${size * tilesize}px`;

                    puzzle = data.puzzle;
                    renderPuzzle();
                    break;
                case 'updatePuzzle':
                    puzzle = data.puzzle;
                    renderPuzzle(puzzle);
                    break;
                case 'gameOver':
                    clearPuzzle();
                    showCustomAlert('The puzzle has been solved!');
                    document.getElementById('container').style.display = 'none';
                    document.getElementById('container').innerHTML = '';
                    if (isLobbyCreator === true) {
                        document.getElementById('playagain-container').style.display = 'block';
                    }
                    break;
                case 'newHost':
                    showCustomAlert('You are now the host.');
                    assignNewHost(data.lobbyCode);
                    document.getElementById('lobbystart').style.display = 'block';
                    break;
                case 'error':
                    showCustomAlertWarning(data.message);
                    break;
                case 'playerLeavesMidGame':
                    playerLeavesMidGame(data);
                    break;
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket-Fehler:", error);
            showCustomAlertServer();
        };

        socket.onclose = () => {
            console.warn("WebSocket-Verbindung geschlossen. Versuche erneut...");
            reconnectSocket();
        };
    } catch (err) {
        console.error("Fehler beim Herstellen der WebSocket-Verbindung:", err);
        showCustomAlertServer();
        reconnectSocket();
    }
}

function reconnectSocket() {
    setTimeout(() => {
        console.log("Erneuter Verbindungsversuch...");
        connectSocket();
    }, 5000);
}

window.onload = connectSocket;

function updatePlayerList(playerNames) {
    const playerListContent = document.getElementById('playerListContent');
    playerListContent.innerHTML = '';
    playerNames.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        playerListContent.appendChild(li);
    });
}

document.getElementById('createLobby').onclick = () => {
    const playerName = document.getElementById('playerNameInput').value.trim();
    if (!playerName) {
        showCustomAlertWarning('Please enter your name!');
        return;
    }
    const size = document.getElementById('puzzleSize').value;
    socket.send(JSON.stringify({
        action: 'createLobby',
        size: parseInt(size),
        playerName: playerName
    }));
    document.getElementById('lobby-options').style.display = 'none';
    document.getElementById('lobbystart').style.display = 'block';
    document.getElementById('container').style.display = 'block';
};

document.getElementById('joinLobby').onclick = () => {
    const playerName = document.getElementById('playerNameInputJoin').value.trim();
    if (!playerName) {
        showCustomAlertWarning('Please enter your name!');
        return;
    }

    const code = document.getElementById('lobbyCodeInput').value.trim();
    if (!code) {
        showCustomAlertWarning('Please enter a lobby code!');
        return;
    }
    document.getElementById('container').style.display = 'none';
    socket.send(JSON.stringify({
        action: 'joinLobby',
        code,
        playerName: playerName
    }));
};
document.getElementById('startGame').onclick = () => {
    socket.send(JSON.stringify({ action: 'startGame', size: size, code: lobbyCode }));
};
document.getElementById('playAgain').onclick = () => {
    socket.send(JSON.stringify({ action: 'startGame', size: size, code: lobbyCode }));
    document.getElementById('playagain-container').style.display = 'none';
    document.getElementById('container').style.display = 'block';
};
document.getElementById('leaveLobby').onclick = () => {
    socket.send(JSON.stringify({ action: 'leaveLobby', code: lobbyCode }));
    resetLobbyState();
};
function resetLobbyState() {
    lobbyCode = null;
    isLobbyCreator = false;
    document.getElementById('lobbycode').innerText = 'Lobby#???';
    document.getElementById('lobbystart').style.display = 'none';
    document.getElementById('playagain-container').style.display = 'none';
    document.getElementById('leaveLobby').style.display = 'none';
    document.getElementById('playerListContent').innerHTML = '';
    document.getElementById('copyLobbyCode').style.display = 'none';
    document.getElementById('lobby-options').style.display = 'block';
    document.getElementById('container').style.display = 'none';
    document.getElementById('playagain-container').style.display = 'none';
    clearPuzzle();
}

function assignNewHost(newLobbyCode) {
    isLobbyCreator = true;
    lobbyCode = newLobbyCode;
    document.getElementById('startGame').style.display = 'block';
    document.getElementById('playagain-container').style.display = 'none';
    document.getElementById('copyLobbyCode').style.display = 'block';
    document.getElementById('lobbycode').innerText = `Lobby#${lobbyCode}`;
}
function showCustomAlert(message) {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.className = 'alert alert-success';
    alert.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
    `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 2500);
}
function showCustomAlertWarning(message) {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.className = 'alert alert-warning';
    alert.innerHTML = `
        <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-6 w-6 shrink-0 stroke-current"
    fill="none"
    viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
        <span>${message}</span>
    `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3500);
}
function showCustomAlertServer() {
    const message = 'The server is taking a quick nap and should wake up within a minute.Thanks for your patience!'
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    alert.className = 'alert alert-warning';
    alert.innerHTML = `
        <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-6 w-6 shrink-0 stroke-current"
    fill="none"
    viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
        <span>${message}</span>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => {
        alert.remove();
    }, 5000);

}
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
document.getElementById('copyLobbyCode').onclick = () => {
    if (lobbyCode) {
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = lobbyCode;
        tempInput.select();
        tempInput.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            showCustomAlert('Lobby code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy lobby code:', err);
        }
        document.body.removeChild(tempInput);
    } else {
        showCustomAlertWarning('No lobby code available to copy.');
    }
};

function getDailySeed() {
    const today = new Date();
    let dateString = today.getFullYear() + today.getMonth() + today.getDate();
    let storedSeedData = localStorage.getItem('dailySeed');
    if (storedSeedData) {
        let parsedData = JSON.parse(storedSeedData);
        console.log(parsedData.date);
        console.log(dateString);


        if (parsedData.date === dateString) {
            if (parsedData.isSolved) {
                return;
            }
        }else{
            const newSeed = Math.floor(Math.random() * 1000000);
            storedSeedData = {
                date: dateString,
                seed: newSeed,
                isSolved: false
            };
            localStorage.setItem('dailySeed', JSON.stringify(storedSeedData));
        }
    } else {
        const newSeed = Math.floor(Math.random() * 1000000);
        storedSeedData = {
            date: dateString,
            seed: newSeed,
            isSolved: false
        };
        localStorage.setItem('dailySeed', JSON.stringify(storedSeedData));
    }
}

const link = document.getElementById("daily-challange");
link.addEventListener("click", handleDailyChallengeClick)

function handleDailyChallengeClick() {
    let storedSeedData = localStorage.getItem('dailySeed');
    let parsedData = JSON.parse(storedSeedData);
    if (parsedData.isSolved) {
        window.location.href = `daily-challenge.html`;
    }else{
        window.location.href = `index.html?seed=${parsedData.seed}&size=4`;
    }
}

function displayStreak() {
    const streakData = JSON.parse(localStorage.getItem('dailyStreak'));
    const streakElement = document.getElementById('streak');
    streakElement.textContent = streakData.currentStreak;
}

function playerLeavesMidGame(data) {
    clearPuzzle();
    document.getElementById('container').style.display = 'none';
    document.getElementById('container').innerHTML = '';
    if (isLobbyCreator === true) {
        document.getElementById('playagain-container').style.display = 'block';
    }
    let playername = data.playername;
    showCustomAlertWarning(`${playername} quit mid-game – guess they couldn't take the heat!`);
}
