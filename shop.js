const wallet = document.getElementById('wallet');
const itemDisplayElements = document.getElementsByClassName('item');
const itemList = document.getElementById('item-list');
const shopContainer = document.getElementById('shop');
const buyButton = document.getElementById('buy-button');

let randomItems = null;
let walletAmount = 0;
let spentAmount = 0;
let selectedItem = null;
let selectedItemElement = null;

shoppingList = [
    {
        name: 'Short Ranged',
        rarity: 80,
        effect: () => { currentWeapon = 'shootShortRanged'; },
        price: 20,
        description: 'A basic gun with low range and damage.'
    },
    {
        name: 'Long Ranged',
        rarity: 40,
        effect: () => { currentWeapon = 'shootLongRanged'; },   
        price: 20,
        description: 'A gun with higher range and damage than the short ranged.'
    },
    {
        name: 'Laser',
        rarity: 5,
        effect: () => { currentWeapon = 'shootLaser'; },   
        price: 60,
        description: 'A powerful weapon that shoots a piercing laser beam.'
    },
    {
        name: 'Ricochet Multi',
        rarity: 1,
        effect: () => { currentWeapon = 'shootRicochetMulti'; },   
        price: 60,
        description: 'Shoots multiple bullets that can ricochet off surfaces.'
    },
    {
        name: 'Ricochet Single',
        rarity: 10,
        effect: () => { currentWeapon = 'shootRicochetSingle'; },
        price: 50,
        description: 'Shoots a single bullet that can ricochet off surfaces.'
    },
    {
        name: 'Health Boost',
        rarity: 60,
        effect: () => { playerHealth += 25; if (playerHealth > 100) playerHealth = 100; updatePlayerHealth(); },
        price: 10,
        description: 'Restores 25 health points.'
    },
    {
        name: 'Speed Boost',
        rarity: 40,
        effect: () => { SPEED += 1; setTimeout(() => { SPEED -= 1; }, 15000); },
        price: 15,
        description: 'Increases movement speed for 5 seconds.'
    },
    {
        name: 'Vision Boost',
        rarity: 25,
        effect: () => { isVisionBoostActive = true; setTimeout(() => { isVisionBoostActive = false }, 15000)},
        price: 20,
        description: 'Temporarily reveals hidden items and enemies.'
    },
    {
        name: 'Surprise Box',
        rarity: 40,
        effect: () => { const surpriseEffects = ['damage', 'heal', 'speed', 'vision']; const effect = surpriseEffects[Math.floor(Math.random() * surpriseEffects.length)]; applySurpriseEffect(effect); },
        price: 20,
        description: 'Triggers a random effect that can be beneficial or harmful.'
    }
];

function canBuyItem(item) {
    return walletAmount >= item.price;
}

function updateItemsShelf() {
    randomItems = [];

    while (randomItems.length < 3) {
        let shuffledList = [...shoppingList].sort(() => Math.random() - 0.5);

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

function openShop() {
    isTimerPaused = true; 
    shopContainer.style.display = 'grid'; 

    walletAmount = Math.max(0, Math.floor((timer / 1000)) - spentAmount);
    wallet.textContent = walletAmount;

    if (!randomItems) updateItemsShelf();

    for (let i = 0; i < 3; i++) {
        const currentItem = itemDisplayElements[i];
        
        if (!canBuyItem(randomItems[i])) {
            currentItem.classList.add('disabled');
        } else {
            currentItem.classList.remove('disabled');
        }
    }
}

function buyItem(item) {
    if (walletAmount >= item.price) {
        item.effect();
        spentAmount += item.price;
        walletAmount -= item.price;
        wallet.textContent = walletAmount;
        return true;
    }
    return false;
}

itemList.addEventListener('click', (event) => {
    const clickedItemContainer = event.target.closest('.item');
    if (!clickedItemContainer) return;

    const itemIndex = parseInt(clickedItemContainer.id.slice(-1), 10) - 1;
    const item = randomItems[itemIndex];

    if (!item || !canBuyItem(item)) return;

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
                if (!canBuyItem(randomItems[i])) {
                    itemDisplayElements[i].classList.add('disabled');
                }
            }
        }
    }

    updateInventoryUI();
});

function closeShop() {
    isTimerPaused = false; 
    shopContainer.style.display = 'none'; 
    randomItems = null; 
    selectedItem = null;
    if (selectedItemElement) {
        selectedItemElement.classList.remove('selected');
        selectedItemElement = null;
    }
}