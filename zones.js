let zoneData = [];

function generateZone(x, y, width, height) {
    const zoneTypes = ['Health', 'Vision', 'Surprise', 'Shopping'];
    const type = zoneTypes[Math.floor(Math.random() * zoneTypes.length)];

    const zone = document.createElement('div');
    zone.className = 'zone';
    
    zone.style.position = "absolute";
    zone.style.left = x + 'px';
    zone.style.top = y + 'px';
    zone.style.width = width + 'px';
    zone.style.height = height + 'px';
    zone.style.zIndex = -1;

    if (type === 'Health') zone.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    if (type === 'Vision') zone.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    if (type === 'Surprise') zone.style.backgroundColor = 'rgba(128, 0, 128, 0.3)';
    if (type === 'Shopping') zone.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';

    world.appendChild(zone);

    let effect = null;
    if (type === 'Surprise') {
        const roll = Math.random();
        if (roll < 0.80) effect = 'damage';
        else if (roll < 0.90) effect = 'heal';
        else if (roll < 0.95) effect = 'vision';
        else effect = 'speed';
    }

    zoneData.push({
        x: x, 
        y: y, 
        width: width, 
        height: height, 
        type: type, 
        element: zone, 
        surpriseTriggered: false,
        surpriseEffect: effect,
        lastHealTime: 0 
    });
}

let wasInShoppingZone = false;
let isVisionBoostActive = false;
let wasInVisionZone = false;
let wasInHealthZone = false;

function checkZoneInteractions(playerX, playerY) {
    const pSize = 15;
    const now = Date.now(); 
    let currentZoneEmoji = "";
    
    let currentlyInShoppingZone = false;
    let currentlyInVisionZone = false;
    let currentlyInHealthZone = false;

    for (let i = 0; i < zoneData.length; i++) {
        let z = zoneData[i];

        if (playerX < z.x + z.width && playerX + pSize > z.x && playerY < z.y + z.height && playerY + pSize > z.y) {
            
            if (z.type === 'Health') {
                currentlyInHealthZone = true;
                currentZoneEmoji = "➕";
                if (now - z.lastHealTime >= 2000 && playerHealth < 100) {
                    playerHealth = Math.min(100, playerHealth + 5);
                    updatePlayerHealth();
                    z.lastHealTime = now; 
                }
            } 
            else if (z.type === 'Vision') {
                currentlyInVisionZone = true;
                currentZoneEmoji = "👁️";
            } 
            else if (z.type === 'Shopping') {
                currentlyInShoppingZone = true;
                currentZoneEmoji = "🛒";
            } 
            else if (z.type === 'Surprise') {
                let effectEmoji = "❓";
                if (z.surpriseEffect === 'damage') effectEmoji = "☠️";
                else if (z.surpriseEffect === 'heal') effectEmoji = "💖";
                else if (z.surpriseEffect === 'speed') effectEmoji = "⚡";
                else if (z.surpriseEffect === 'vision') effectEmoji = "👁️";

                currentZoneEmoji = Math.floor(now / 500) % 2 === 0 ? "❓" : effectEmoji;

                if (!z.surpriseTriggered) {
                    z.surpriseTriggered = true;
                    applySurpriseEffect(z.surpriseEffect);
                }
            }
        }
    }

    if (currentlyInShoppingZone) {
        openShop();
    } else if (wasInShoppingZone && !currentlyInShoppingZone) {
        closeShop();
    }
    
    if (currentlyInVisionZone || isVisionBoostActive) {
        document.getElementById('darkness-overlay').style.display = 'none';
        if (isVisionBoostActive) currentZoneEmoji = "👁️"; 
    } else {
        document.getElementById('darkness-overlay').style.display = 'block';
    }

    wasInShoppingZone = currentlyInShoppingZone;
    wasInVisionZone = currentlyInVisionZone;
    wasInHealthZone = currentlyInHealthZone;

    if (typeof updatePlayerIndicator === 'function') {
        updatePlayerIndicator(currentZoneEmoji);
    }
}

function applySurpriseEffect(effect) {
    if (effect === 'damage') {
        playerHealth -= (playerHealth * 0.25);
        updatePlayerHealth();
    } else if (effect === 'heal') {
        playerHealth += 25;
        if (playerHealth > 100) playerHealth = 100;
        updatePlayerHealth();
    } else if (effect === 'speed') {
        SPEED = 4;
        setTimeout(() => {
            SPEED = 2;
        }, 5000);
    } 
}