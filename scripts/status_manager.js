import { 
    healPlayer, setPlayerSpeed, changePlayerWeapon, setVisionRadius,
    updateInventoryUI, setBullets, getSpeed, setDarknessVisible,
    setIsVisionBoostActive, getIsVisionBoostActive } from './player_logic.js';

// Constants and other variables 
export const activeEffects = [];

// Updating Logic
export function applyEffect(effectType, value, duration = 0) {
    const now = Date.now();

    switch(effectType) {
        case 'heal':
            healPlayer(value);
            break;
            
        case 'change_weapon':
            changePlayerWeapon(value);
            break;

        case 'reload':
            setBullets(value); 
            updateInventoryUI();
            break;
            
        case 'speed_boost':
            setPlayerSpeed(getSpeed() + value); 
            if (duration > 0) {
                activeEffects.push({ type: 'speed', timeRemaining: duration, originalValue: getSpeed() - value });
            }
            break;
            
        case 'vision_boost':
            setVisionRadius(value);
            setIsVisionBoostActive(true);
            setDarknessVisible(false);   
            
            activeEffects.push({ 
                type: 'vision', 
                timeRemaining: duration > 0 ? duration : 15000,
                originalValue: 400 
            });
            break;

        case 'surprise':
            const surpriseEffects = ['damage', 'heal', 'speed', 'vision']; 
            const effect = surpriseEffects[Math.floor(Math.random() * surpriseEffects.length)]; 
            
            if (effect === 'damage') healPlayer(-25); 
            if (effect === 'heal')   healPlayer(25);
            if (effect === 'speed')  applyEffect('speed_boost', 1, 15000);
            if (effect === 'vision') applyEffect('vision_boost', 600, 15000);
            break;
    }
}

export function updateEffects(deltaTime) {
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        let effect = activeEffects[i];
        
        effect.timeRemaining -= deltaTime;
        
        if (effect.timeRemaining <= 0) {
            if (effect.type === 'speed') {
                setPlayerSpeed(effect.originalValue);
            }
            
            if (effect.type === 'vision') {
                setVisionRadius(effect.originalValue);
                setIsVisionBoostActive(false);
            }
            
            activeEffects.splice(i, 1);
        }
    }
}

export function resetEffects() {
    activeEffects.length = 0;
}