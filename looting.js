const droppedItems = [];
let lootBoxesData = [];

function increaseHealth() {
    const addHealth = 25;
    if (playerHealth + addHealth >= 100) {
        playerHealth = 100;
    } else {
        playerHealth += addHealth;
    }
}

function reloadBullets() {
    playerBullets = 9;
    if (typeof updateInventoryUI === 'function') {
        updateInventoryUI(); 
    }
}

const dropList = [
    {
        dropName: "Bullets",
        dropSymbol: "⚪",
        rarity: 10,
        effect: reloadBullets
    },
    {
        dropName: "Health",
        dropSymbol: "💖",
        rarity: 20,
        effect: increaseHealth
    }
];

function dropLoot(x, y) {
    const drop = document.createElement('div');
    drop.className = 'drop';
    const dropInfo = dropList[Math.floor(Math.random() * dropList.length)]; 

    drop.textContent = dropInfo.dropSymbol;
    drop.style.left = x + 'px';
    drop.style.top = y + 'px';

    droppedItems.push({
        element: drop, 
        dropName: dropInfo.dropName,
        x: x, 
        y: y, 
        spawnedAt: Date.now()
    });

    world.appendChild(drop);
}

function despawnDroppedItem() {
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const item = droppedItems[i];
        const now = Date.now(); 
        
        if (now - item.spawnedAt > 10000) {
            item.element.remove();
            droppedItems.splice(i, 1);
        }
    }
}

function pickUpDrop(playerX, playerY) {
    const playerSize = 15;
    const itemSize = 10;

    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const item = droppedItems[i];
        
        if (
            item.x < playerX + playerSize && 
            item.x + itemSize > playerX &&
            item.y < playerY + playerSize &&
            item.y + itemSize > playerY
        ) {
            const dropInfo = dropList.find(drop => drop.dropName === item.dropName);
            
            if (dropInfo) {
                dropInfo.effect(); 
            }

            item.element.remove();
            droppedItems.splice(i, 1);
        }
    }
}

setInterval(() => {
    const spawnX = x + (Math.random() * 500 - 250);
    const spawnY = y + (Math.random() * 500 - 250);

    if (!isCollidingBox(spawnX, spawnY, 15)) {
        const drop = document.createElement('div');
        drop.className = 'drop';
        const dropInfo = dropList.find(d => d.dropName === "Bullets"); 
        
        if (dropInfo) {
            drop.textContent = dropInfo.dropSymbol;
            drop.style.left = spawnX + 'px';
            drop.style.top = spawnY + 'px';

            droppedItems.push({
                element: drop, 
                dropName: dropInfo.dropName,
                x: spawnX, 
                y: spawnY, 
                spawnedAt: Date.now()
            });

            world.appendChild(drop);
        }
    }
}, 10000);

function generateLootBox(x, y) {
    const lootBox = document.createElement('div');
    lootBox.className = "loot-box";

    lootBox.style.left = x + 'px';
    lootBox.style.top = y + 'px';

    world.appendChild(lootBox);

    lootBoxesData.push({
        x: x, 
        y: y, 
        element: lootBox, 
        boxSize: 20, 
        health: 60
    });
}

function damageBox(box) {
    box.health -= allowedEnemyDamageScore;
    if (box.health <= 0) {
        destroyLootBox(box);
    }
}

function destroyLootBox(box) {
    dropLoot(box.x, box.y);
    box.element.remove();
    const index = lootBoxesData.indexOf(box);
    if (index > -1) {
        lootBoxesData.splice(index, 1);
    }
}