
document.addEventListener("DOMContentLoaded", () => {
    getDailySeed();
    displayStreak();

});

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
link.addEventListener("click", handleDailyChallengeClick);

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