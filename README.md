# Js‑Brain (brainemu.js)
A tiny experimental reinforcement‑learning “brain” written entirely in JavaScript.  
It runs in the browser, learns from whatever data you feed it, and visualizes its internal activity in real time.

This project is meant to be a sandbox: a place to plug in your own game, simulation, robot, or data stream and watch an agent try to make sense of it. Everything happens inside one HTML file — no libraries, no build tools, no dependencies.

---

## 🚀 Features

### 🧠 Real‑time neural simulation
- 8 input neurons  
- 16 hidden neurons  
- 4 output neurons  
- Adjustable thresholds, decay, mutation, reward, punish  
- Live firing visualization on a canvas  
- Memory coloring (neurons “glow” when they learn)

### 🔌 Plug‑and‑play input system
You can feed **any object** into the brain as long as it contains numeric values.

Supports:
- World maps  
- Physics engines  
- Game states  
- Robot sensors  
- Custom objects  
- Multiple input groups at once
  ## 🔌 How to Plug Anything Into Js‑Brain

One of the main goals of Js‑Brain is to make input flexible.  
If your object has **numbers**, the brain can learn from it.

There are **three** ways to plug data into the brain:

1. `addMap()` + `bindMapToInputs()` — structured input groups  
2. `autoBind()` — plug in ANY object instantly  
3. Raw neuron stimulation — direct control

Below is a complete guide with examples.

---

## 1️⃣ Plugging in a Map (recommended for world/game state)
addMap("world", {
  playerX: player.x,
  playerY: player.y,
  enemyDistance: enemy.distance,
  health: player.health,
  ammo: player.ammo
});
and
bindMapToInputs("world");
stimulateGroup(brainA, "world");
autoBind("enemy", {
  danger: enemy.danger,
  speed: enemy.speed,
  distance: enemy.distance,
  health: enemy.health
});

stimulateGroup(brainA, "enemy");


### 🎯 Reinforcement learning
- Reward / punish system  
- Weight strengthening  
- Weight decay  
- Synapse evolution (mutation)  
- Cooldown to prevent runaway firing  
- Balanced thresholds to avoid “all true” or “all false” collapse

### 🧬 Evolution
Synapses mutate over time, allowing the agent to explore new behaviors.

### 🎮 Action outputs
The 4 output neurons map to:
- `MOVE_FORWARD`
- `TURN_LEFT`
- `TURN_RIGHT`
- `ATTACK`

You can replace these with your own actions.

### 💾 Save / Load
Brains can be saved to `localStorage` and restored later.

### 👀 Visualizer
A live neuron grid shows:
- firing neurons (orange)  
- memory strength (blue tint)  
- activity waves  
- both Brain A and Brain B side‑by‑side

---

## 📦 Getting Started

Clone the repo or download the HTML file:

```bash
git clone https://github.com/dev-jspr/brainemu.js
