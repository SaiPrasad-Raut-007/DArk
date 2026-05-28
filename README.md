# DArk

A top-down infinite survival shooter built with JavaScript and the HTML Canvas API. No external game engines or canvas frameworks are used. 

<img width="1865" height="975" alt="Screenshot 2026-05-29 001044" src="https://github.com/user-attachments/assets/f222a86f-44b0-4690-a667-498cda629d60" />

<img width="1863" height="979" alt="image" src="https://github.com/user-attachments/assets/cd9d9f65-ec03-4a4e-96e4-2cbc5cf4fe16" />

---

## How to Run

Open `index.html` in a browser. Sound assets must be present under `assets/sounds/`.

**Controls**

- `W A S D` or Arrow Keys - move
- Mouse - aim flashlight
- `Space` - shoot
- `Escape` - pause / resume

---

## Project Structure

```text
├── assets/
│   └── sounds/
│       ├── bounce.mp3       # Sound effect for bullets bouncing or ricocheting
│       ├── dead.mp3         # Sound effect for player defeat
│       ├── effect.mp3       # sound effect for special effect sound like health boost or vision boost
│       ├── game loop.mp3    # Background music loop for the game
│       ├── hurt.mp3         # Sound effect for taking damage
│       ├── laser.mp3        # Sound effect for firing laser weapon
│       ├── ranged shoot.mp3 # Sound effect for standard ranged attacks
│       ├── reload.mp3       # Sound effect for reloading weapons
│       └── ricochet.mp3     # Sound effect for ricochet weapon
├── scripts/
│   ├── economy_manager.js   # Handles drop loots, loot boxes and shop items
│   ├── enemy_logic.js       # AI behavior, movement pattern, and enemy spawning
│   ├── physics_engine.js    # Manages collisions
│   ├── player_logic.js      # Handles player inputs, movement, and stats
│   ├── projectiles.js       # Manages bullet/laser generation and flight paths
│   ├── rendering_engine.js  # Draws elements to the screen
│   ├── sound_engine.js      # Controls audio playback and volume 
│   ├── status_manager.js    # Tracks health, buffs, debuffs, and overall game states
│   └── world_generation.js  # Infinite world generation 
├── index.html               # Canvas setup for the game
├── README.md                # Project documentation (this file)
└── styles.css               # Styling for the canvas container and layout
```

## Rendering Flow

The renderer lives entirely in `rendering_engine.js` and is driven by `requestAnimationFrame`. Each frame follows this order:

1. Compute `deltaTime` from the previous frame timestamp
2. If not paused, run all update functions (player, enemies, bullets, effects, loot, world)
3. Reset the canvas transform and clear the screen
4. Apply camera translation so the player stays centered
5. Draw in world space in this order: zones > walls > enemies > bullets > lighting overlay > player > loot (This is the order that i believed worked out the best)

All draw calls happen every frame.

---

## Game Loop Structure

```
requestAnimationFrame(updateGame)
  └── deltaTime = timestamp - lastFrameTime
  └── if not paused:
        tickTimer(deltaTime)
        movePlayer()
        checkZoneInteractions()
        playerShoots(canvas)
        updateBullets()
        updateEnemies()
        updateEffects(deltaTime)
        updateLoot()
        manageInfiniteWorld(canvas)
  └── clear canvas
  └── translate camera
  └── draw everything
  └── requestAnimationFrame(updateGame) - schedules next frame
```

---

## State Management

Key state locations:

| State | Module | Variable |
|---|---|---|
| Player position | `player_logic.js` | `playerXPosition`, `playerYPosition` |
| Player health | `player_logic.js` | `currentPlayerHealth` |
| Current weapon | `player_logic.js` | `currentWeapon` |
| Score and timer | `player_logic.js` | `playerScore`, `currentTime` |
| Pause and death flags | `player_logic.js` | `isPaused`, `isPlayerKilled` |
| Active enemies | `enemy_logic.js` | `activeEnemies` array |
| Active bullets | `projectiles.js` | `playerBullets`, `enemyBullets` arrays |
| Wall geometry | `world_generation.js` | `wallData` array |
| Active zones | `world_generation.js` | `activeZones` array |
| Loot drops and boxes | `economy_manager.js` | `activeLootDrops`, `activeLootBoxes` arrays |
| Timed effects | `status_manager.js` | `activeEffects` array |

The wallet is not a separate balance, it is derived directly from the timer: `Math.floor(currentTime / 1000)`. Spending currency subtracts milliseconds from the timer, creating a direct tradeoff between survival time and purchasing power.

---

## Collision Detection

All collision is axis-aligned bounding box, implemented in `physics_engine.js` via `isColliding(rect1, rect2)`.

Two collision layers are used:

- `checkWallCollision` - checks only against `wallData`
- `checkSolidCollision` - checks against `wallData` and `activeLootBoxes` combined

---

## Room Generation

Rooms are generated procedurally on demand in `world_generation.js` using a grid-based infinite world system.

**Enemy pathfinding - A\***

Chaser enemies use A* pathfinding implemented from scratch. The world is overlaid with a 20px grid. Before running A*, both the start and target positions are snapped to the nearest valid (non-colliding) grid node.

---

## Enemy AI

Each enemy has a `type` that drives its behaviour each frame.

**Idle**

Patrols within 75px of its spawn point by picking a random direction, walking a short distance, then waiting 1 second before picking a new direction. The enemy's `facingAngle` smoothly turns toward the patrol direction using `atan2`-based angle wrapping. If the player comes within `ROI_RADIUS × 0.75`, the enemy transitions to alert.

**Alert**

The enemy stops moving and rotates its `facingAngle` to smoothly track the player each frame. It shoots at the player while they remain within range. If the player moves back outside `ROI_RADIUS × 0.75`, a 2 second cooldown begins. Once the cooldown expires the enemy returns to idle and resumes patrolling.

**Chaser**

Runs A* pathfinding toward the player whenever the player is within `ROI_RADIUS × 3.5`. Shoots whenever the player is within `ROI_RADIUS`. Chaser type is assigned at spawn (25% probability) and does not change.

**Cone vision - `isPlayerInConeVision`**

Used by idle and alert enemies. Checks three conditions in order:
1. Player is within `ROI_RADIUS`
2. Angle to player falls within `FOV / 2` of `facingAngle` (using `atan2` angle-difference normalisation to handle wraparound)
3. Ray march from enemy center to player center in steps of 4px finds no solid collision

All three must pass for the player to be considered visible.

---

## Weapon System

Five weapon types are available to both the player and enemies:

| Weapon | Speed | Bounces | Notes |
|---|---|---|---|
| Short Ranged | 4 | 0 | Short lifespan (250ms) |
| Long Ranged | 5 | 0 | Long lifespan (3000ms) |
| Laser | 6 | 0 | Passes through walls |
| Ricochet Single | 4 | 1000 | Infinite effective bounces |
| Ricochet Multi | 4 | 5 | Fires 3 bullets at 30° spread |

Enemies are assigned a weapon at spawn using weighted random selection. The player starts with Short Ranged and can change weapon via the in-game shop.

---

## Economy System

Currency is time. The wallet balance displayed in the shop is `Math.floor(currentTime / 1000)` - the timer converted to seconds. Purchasing an item subtracts its cost in milliseconds from the timer directly, meaning every purchase shortens the player's remaining survival time.

Loot drops from killed enemies and destroyed loot boxes. Drops are either health or bullets, chosen by weighted random. Drops expire after 10 seconds if not collected.

The shop opens automatically when the player enters a Shopping zone and pauses the timer while open. Each visit generates a fresh shelf of 3 items selected by weighted rarity from the full item database.
