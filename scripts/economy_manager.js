import { applyEffect } from './status_manager.js';
import { playerXPosition, playerYPosition, PLAYER_SIZE, spendTimeMoney, getWalletBalance, setTimerPaused } from './player_logic.js';
import { allowedEnemyDamageScore } from './enemy_logic.js';

// SHOP DATABASE 
export const SHOP_ITEMS = [
    { name: 'Short Ranged', type: 'change_weapon', value: 'shootShortRanged', rarity: 80, price: 20, description: 'A basic gun with low range and damage.' },
    { name: 'Long Ranged', type: 'change_weapon', value: 'shootLongRanged', rarity: 40, price: 20, description: 'A gun with higher range and damage than the short ranged.' },
    { name: 'Laser', type: 'change_weapon', value: 'shootLaser', rarity: 5, price: 60, description: 'A powerful weapon that shoots a piercing laser beam.' },
    { name: 'Ricochet Multi', type: 'change_weapon', value: 'shootRicochetMulti', rarity: 1, price: 60, description: 'Shoots multiple bullets that can ricochet off surfaces.' },
    { name: 'Ricochet Single', type: 'change_weapon', value: 'shootRicochetSingle', rarity: 10, price: 50, description: 'Shoots a single bullet that can ricochet off surfaces.' },
    { name: 'Health Boost', type: 'heal', value: 25, rarity: 60, price: 10, description: 'Restores 25 health points.' },
    { name: 'Speed Boost', type: 'speed_boost', value: 1, duration: 15000, rarity: 40, price: 15, description: 'Increases movement speed for 15 seconds.' }, 
    { name: 'Vision Boost', type: 'vision_boost', value: 600, duration: 15000, rarity: 25, price: 20, description: 'Temporarily reveals hidden items and enemies.' },
    { name: 'Surprise Box', type: 'surprise', value: null, rarity: 40, price: 20, description: 'Triggers a random effect that can be beneficial or harmful.' }
];

// GROUND LOOT DATABASE 
const GROUND_LOOT = [
    { dropName: "Bullets", dropSymbol: "⚪", type: 'reload', value: 9, rarity: 10, color: '#FFFFFF' },
    { dropName: "Health", dropSymbol: "💖", type: 'heal', value: 25, rarity: 20, color: '#FF69B4' }
];

// LOOT CRATES & DROPS 
export const activeLootDrops = [];
export const activeLootBoxes = [];
const LOOT_SIZE = 10; 
export const BOX_SIZE = 20;  

const walletElement = document.getElementById('wallet');
const itemDisplayElements = document.getElementsByClassName('item');
const itemList = document.getElementById('item-list');
const shopContainer = document.getElementById('shop');
const buyButton = document.getElementById('buy-button');

let randomItems = null;
let selectedItem = null;
let selectedItemElement = null;

function getWeightedLoot() {
    let totalWeight = GROUND_LOOT[0].rarity + GROUND_LOOT[1].rarity; 
    let randomNum = Math.random() * totalWeight;
    
    if (randomNum < GROUND_LOOT[0].rarity) return GROUND_LOOT[0];
    return GROUND_LOOT[1];
}

export function spawnLootBox(x, y) {
    activeLootBoxes.push({
        id: Math.random().toString(36).substring(2, 9),
        x: x, 
        y: y, 
        width: BOX_SIZE,
        height: BOX_SIZE,
        health: 60
    });
}

export function damageLootBox(lootBoxID) {
    let lootBoxIndex = activeLootBoxes.findIndex(l => l.id === lootBoxID);
    if (lootBoxIndex === -1) return;

    let loot = activeLootBoxes[lootBoxIndex];
    loot.health -= allowedEnemyDamageScore;

    if (loot.health <= 0) {
        destroyLootBox(lootBoxIndex);
    }
}

function destroyLootBox(index) {
    dropLoot(activeLootBoxes[index].x + (BOX_SIZE / 2), activeLootBoxes[index].y + (BOX_SIZE / 2)); 
    activeLootBoxes.splice(index, 1);
}

export function dropLoot(x, y) {
    const dropInfo = getWeightedLoot();
    
    activeLootDrops.push({
        itemConfig: dropInfo,
        x: x - (LOOT_SIZE / 2),
        y: y - (LOOT_SIZE / 2),
        spawnedAt: Date.now()
    });
}

export function updateLoot() {
    const now = Date.now();
    const pCenterX = playerXPosition + (PLAYER_SIZE / 2);
    const pCenterY = playerYPosition + (PLAYER_SIZE / 2);

    for (let i = activeLootDrops.length - 1; i >= 0; i--) {
        let loot = activeLootDrops[i];
        
        if (now - loot.spawnedAt > 10000) {
            activeLootDrops.splice(i, 1);
            continue;
        }
        
        if (
            loot.x < playerXPosition + PLAYER_SIZE && 
            loot.x + LOOT_SIZE > playerXPosition &&
            loot.y < playerYPosition + PLAYER_SIZE &&
            loot.y + LOOT_SIZE > playerYPosition
        ) {
            applyEffect(loot.itemConfig.type, loot.itemConfig.value, 0); 
            activeLootDrops.splice(i, 1);
        }
    }
}

export function spawnSpecificLoot(type, x, y) {
    const dropInfo = GROUND_LOOT.find(l => l.type === type);
    if (dropInfo) {
        activeLootDrops.push({
            itemConfig: dropInfo,
            x: x,
            y: y,
            spawnedAt: Date.now()
        });
    }
}

// Draw Boxes and Drops
export function drawLoot(ctx) {
    // Draw destructible boxes
    for (let i = 0; i < activeLootBoxes.length; i++) {
        let box = activeLootBoxes[i];
        ctx.fillStyle = 'gold'; 
        ctx.fillRect(box.x, box.y, box.width, box.height);
    }

    // Draw drops 
    for (let i = 0; i < activeLootDrops.length; i++) {
        let loot = activeLootDrops[i];
        ctx.fillStyle = loot.itemConfig.color;
        ctx.fillRect(loot.x, loot.y, LOOT_SIZE, LOOT_SIZE);
    }
}

// Shop Logic 
function canPurchaseItem(item) {
    return getWalletBalance() >= item.price;
}

function updateItemsShelf() {
    randomItems = [];

    while (randomItems.length < 3) {
        let shuffledList = [...SHOP_ITEMS].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffledList.length; i++) {
            let item = shuffledList[i];
            if (randomItems.length === 3) break;
            if (randomItems.some(existingItem => existingItem.name === item.name)) {
                continue;
            }
            let roll = Math.random() * 100;
            
            if (roll <= item.rarity) {
                randomItems.push(item);
            }
        }
    }

    for (let i = 0; i < 3; i++) {
        const item = randomItems[i];
        
        itemDisplayElements[i].innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description}</div>
            </div>
            <div class="item-price">$ ${item.price}</div>
        `;
        itemDisplayElements[i].classList.remove('selected');
    }
}

export function openShop() {
    setTimerPaused(true); 
    shopContainer.style.display = 'grid'; 

    walletElement.textContent = getWalletBalance();

    if (!randomItems) updateItemsShelf();

    for (let i = 0; i < 3; i++) {
        const currentItem = itemDisplayElements[i];
        
        if (!canPurchaseItem(randomItems[i])) {
            currentItem.classList.add('disabled');
        } else {
            currentItem.classList.remove('disabled');
        }
    }
}

function buyItem(item) {
    if (spendTimeMoney(item.price)) {
        applyEffect(item.type, item.value, item.duration || 0);
        walletElement.textContent = getWalletBalance();
        return true;
    }
    return false;
}

export function closeShop() {
    setTimerPaused(false); 
    shopContainer.style.display = 'none'; 
    randomItems = null; 
    selectedItem = null;
    if (selectedItemElement) {
        selectedItemElement.classList.remove('selected');
        selectedItemElement = null;
    }
}

// Event listeners 
itemList.addEventListener('click', (event) => {
    const clickedItemContainer = event.target.closest('.item');
    if (!clickedItemContainer) return;

    const itemIndex = parseInt(clickedItemContainer.id.slice(-1), 10) - 1;
    const item = randomItems[itemIndex];

    if (!item || !canPurchaseItem(item)) return;

    if (selectedItem === item) {
        selectedItem = null;
        clickedItemContainer.classList.remove('selected');
        selectedItemElement = null;
    } else {
        if (selectedItemElement) {
            selectedItemElement.classList.remove('selected');
        }
        selectedItem = item;
        selectedItemElement = clickedItemContainer;
        clickedItemContainer.classList.add('selected');
    }
});

buyButton.addEventListener('click', (event) => {
    if (selectedItem) {
        const success = buyItem(selectedItem);
        if (success) {
            selectedItemElement.classList.remove('selected');
            selectedItem = null;
            selectedItemElement = null;
            
            for (let i = 0; i < 3; i++) {
                if (!canPurchaseItem(randomItems[i])) {
                    itemDisplayElements[i].classList.add('disabled');
                }
            }
        }
    }
});

export function resetEconomy() {
    activeLootDrops.length = 0;
    activeLootBoxes.length = 0;
}
