const world = document.getElementById('world');
const timerElement = document.getElementById('timer');
const playerHighScoreElement = document.getElementById('player-high-score');
const gameMenu = document.getElementById('game-menu');
const resumeGameButton = document.getElementById('resume-button')

let cameraOffsetX = 0;
let cameraOffsetY = 0;

function updateCamera() {
    const screenCenterX = gameContainer.clientWidth / 2;
    const screenCenterY = gameContainer.clientHeight / 2;

    cameraOffsetX = screenCenterX - x - (15 / 2); 
    cameraOffsetY = screenCenterY - y - (15 / 2);

    world.style.transform = `translate(${cameraOffsetX}px, ${cameraOffsetY}px)`;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function renderTimer() {
    timerElement.textContent = `Score: ${playerScore} | ${formatTime(timer)}`;
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        gameMenu.style.display = "grid";

        isPaused = true;
        isTimerPaused = true;
    }
})

function resetGame() {
    playerHealth = MAX_PLAYER_HEALTH;
    playerBullets = 9;
    playerScore = 0;
    timer = 60000;
    x = -40;
    y = -40;
    SPEED = 2;

    currentWeapon = 'shootRicochetSingle';

    bullets.length = 0;
    enemyBullets.length = 0;
    enemyData.length = 0;
    droppedItems.length = 0;
    lootBoxesData.length = 0;
    zoneData.length = 0;
    wallData.length = 0;
    wasInShoppingZone = false;
    isVisionBoostActive = false;
    wasInVisionZone = false;
    wasInHealthZone = false;
    zoneData = [];
    canShoot = true;
    activeBuffEmoji = "";
    spentAmount = 0;
    randomItems = null;
    selectedItem = null;
    selectedItemElement = null;
    shopContainer.style.display = 'none';
    isTimerPaused = false;

    for (let key in activeRooms) {
        activeRooms[key].remove();
        delete activeRooms[key];
    }

    const world = document.getElementById('world');
    const gameObjects = world.querySelectorAll('.enemy, .bullet, .drop, .room, .loot-box, .wall, .zone');
    gameObjects.forEach(el => el.remove());

    updateInventoryUI();
    updatePlayerHealth();
    isPlayerKilled = false;
    isPaused = false;
}

resumeGameButton.addEventListener('click', (event) => {
    if (isPlayerKilled) {
        resetGame();
        
        gameMenu.style.display = 'none';
        resumeGameButton.textContent = 'Resume';
    } else {
        gameMenu.style.display = 'none';
        isPaused = false;
        isTimerPaused = false;
    }
});

function updateGame() {
    if (isPaused) {
        requestAnimationFrame(updateGame);
        return
    };

    moveAndSlide(SPEED);
    updateCamera(); 
    manageInfiniteWorld(); 
    playerShoots();
    rotateSector();
    updatePlayerBullets();
    updateEnemyBullets();
    updateEnemies();

    if (isPlayerHit(enemyBullets, x, y)) damagePlayer();

    pickUpDrop(x, y);
    checkEnemyHits(bullets); 
    checkLootHits(bullets);
    checkZoneInteractions(x, y); 
    despawnDroppedItem();
    updatePlayerHealth();

    if (checkTimeout()) {
        killPlayer();
    }

    renderTimer();

    playerHighScoreElement.textContent = `High Score: ${returnCurrentHighScore()}`
    requestAnimationFrame(updateGame);
}

startTimerCountdown();
requestAnimationFrame(updateGame);