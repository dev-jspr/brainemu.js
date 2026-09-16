<!DOCTYPE html>
<html>
<body>
<canvas id="brain" width="600" height="400"></canvas>
<div id="console" style="width:600px;height:250px;overflow:auto;background:#111;color:#0f0;padding:10px;font-family:monospace;margin-top:10px;">
</div>

<script>
// Js-Brain v2.3 — Balanced Learning Agent
// this was originally supposed to be called js-brain btw
const INPUT = 8;
const HIDDEN = 16;
const OUTPUT = 4;
const N = INPUT + HIDDEN + OUTPUT;

function createBrain() {
  const neurons = [];
  const synapses = [];

  for (let i = 0; i < N; i++) {
    neurons.push({
      v: 0,
      threshold: 0.6,   // slightly lower than 2.2
      fired: false,
      memory: 0
    });
    synapses.push([]);
  }

  // guaranteed hidden -> output
  for (let i = INPUT; i < INPUT + HIDDEN; i++) {
    for (let j = INPUT + HIDDEN; j < N; j++) {
      synapses[i].push({
        target: j,
        weight: (Math.random() * 0.8) + 0.2,
        memory: 0
      });
    }
  }

  // random extras
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i !== j && Math.random() < 0.1) {
        synapses[i].push({
          target: j,
          weight: (Math.random() - 0.5) * 1.0,
          memory: 0
        });
      }
    }
  }

  return { neurons, synapses };
}

const brainA = createBrain();
const brainB = createBrain();

let externalMaps = {};
let inputBindings = {};

function addMap(name, data) {
  externalMaps[name] = data;
}

function bindMapToInputs(name) {
  inputBindings[name] = {
    type: "map",
    data: externalMaps[name]
  };
}

function autoBind(name, obj) {
  externalMaps[name] = obj;
  bindMapToInputs(name);
}

function stimulateGroup(brain, name) {
  if (!inputBindings[name]) return;
  const map = inputBindings[name].data;
  let i = 0;
  for (const key in map) {
    if (typeof map[key] === "number") {
      if (i >= INPUT) break;
      brain.neurons[i].v += map[key] * 1.0; // stronger than 2.2
      i++;
    }
  }
}

function addNoise(brain) {
  for (let i = 0; i < INPUT; i++) {
    brain.neurons[i].v += (Math.random() - 0.5) * 0.25; // more exploration
  }
}

let rewardBoostA = 0;
let rewardBoostB = 0;

function reward(brainName) {
  if (brainName === "A") rewardBoostA = 1.0;
  if (brainName === "B") rewardBoostB = 1.0;
}

function punish(brainName) {
  if (brainName === "A") rewardBoostA = -1.0;
  if (brainName === "B") rewardBoostB = -1.0;
}

function applyLearning(brain, fired, rewardBoostRef) {
  fired.forEach(i => {
    brain.synapses[i].forEach(s => {
      if (fired.includes(s.target)) {
        s.memory += 0.1;
        s.weight += 0.02 * rewardBoostRef.value;
        if (s.weight > 3) s.weight = 3;
        if (s.weight < -3) s.weight = -3;
      }
    });
  });

  brain.synapses.forEach(list => {
    list.forEach(s => {
      s.memory *= 0.98;
    });
  });

  brain.synapses.forEach(list => {
    list.forEach(s => {
      s.weight *= 0.995;
    });
  });

  rewardBoostRef.value *= 0.9;
}

function evolveBrain(brain) {
  brain.synapses.forEach(list => {
    list.forEach(s => {
      if (Math.random() < 0.003) {
        s.weight += (Math.random() - 0.5) * 0.15;
        if (s.weight > 3) s.weight = 3;
        if (s.weight < -3) s.weight = -3;
      }
    });
  });
}

function stepBrain(brain, rewardBoostRef) {
  const fired = [];

  for (let i = 0; i < N; i++) {
    const n = brain.neurons[i];
    if (n.v >= n.threshold) {
      fired.push(i);
      n.v = 0;
      n.fired = true;
      n.memory += 0.1;
      n.v -= 0.2; // softer cooldown
    } else {
      n.v *= 0.9;
      n.fired = false;
      n.memory *= 0.95;
    }
  }

  fired.forEach(i => {
    brain.synapses[i].forEach(s => {
      brain.neurons[s.target].v += s.weight;
      brain.neurons[s.target].v = Math.min(brain.neurons[s.target].v, 1.5);
    });
  });

  applyLearning(brain, fired, rewardBoostRef);
  evolveBrain(brain);

  return fired;
}

function getOutputsRaw(brain) {
  const out = [];
  for (let i = INPUT + HIDDEN; i < N; i++) {
    out.push(brain.neurons[i].v);
  }
  return out;
}

function getOutputsFired(brain) {
  const out = [];
  for (let i = INPUT + HIDDEN; i < N; i++) {
    out.push(brain.neurons[i].fired);
  }
  return out;
}

function interpretActions(outputsFired) {
  const actions = [];
  if (outputsFired[0]) actions.push("MOVE_FORWARD");
  if (outputsFired[1]) actions.push("TURN_LEFT");
  if (outputsFired[2]) actions.push("TURN_RIGHT");
  if (outputsFired[3]) actions.push("ATTACK");
  return actions;
}

function saveBrain(brain, name) {
  const data = {
    neurons: brain.neurons,
    synapses: brain.synapses
  };
  localStorage.setItem("jsbrain_" + name, JSON.stringify(data));
}

function loadBrain(brain, name) {
  const data = JSON.parse(localStorage.getItem("jsbrain_" + name));
  if (!data) return;
  for (let i = 0; i < N; i++) {
    brain.neurons[i] = data.neurons[i];
    brain.synapses[i] = data.synapses[i];
  }
}

let booting = true;
let bootStep = 0;

function runBootAnimation() {
  const waveSize = 8;
  const start = bootStep * waveSize;
  const end = start + waveSize;

  [brainA, brainB].forEach(brain => {
    for (let i = start; i < end && i < N; i++) {
      brain.neurons[i].fired = true;
      brain.neurons[i].memory = 0.5;
    }

    if (bootStep > 0) {
      const prevStart = (bootStep - 1) * waveSize;
      const prevEnd = prevStart + waveSize;
      for (let i = prevStart; i < prevEnd && i < N; i++) {
        brain.neurons[i].fired = false;
        brain.neurons[i].memory = 0;
      }
    }
  });

  bootStep++;

  if (bootStep * waveSize >= N) {
    booting = false;
    [brainA, brainB].forEach(brain => {
      for (let i = 0; i < N; i++) {
        brain.neurons[i].fired = false;
        brain.neurons[i].memory = 0;
        brain.neurons[i].v = 0;
      }
    });
  }
}

const canvas = document.getElementById("brain");
const ctx = canvas.getContext("2d");
const consoleDiv = document.getElementById("console");

function log(text) {
  consoleDiv.innerHTML += text + "<br>";
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function drawBrain(brain, offsetX) {
  for (let i = 0; i < N; i++) {
    const x = (i % 16) * 35 + 20 + offsetX;
    const y = Math.floor(i / 16) * 35 + 20;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    const mem = brain.neurons[i].memory;
    const color = brain.neurons[i].fired
      ? "orange"
      : `rgb(${200 - mem * 150}, ${200 - mem * 150}, 200)`;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBrain(brainA, 0);
  drawBrain(brainB, 280);
}

const world = {
  playerX: 0.2,
  playerY: 0.8,
  enemyDistance: 0.4,
  health: 0.9,
  ammo: 0.3
};

autoBind("world", world);

const rewardRefA = { value: rewardBoostA };
const rewardRefB = { value: rewardBoostB };

setInterval(() => {
  if (booting) {
    runBootAnimation();
    drawScene();
    log("Booting...");
    return;
  }

  world.enemyDistance = Math.random();
  world.health = Math.random();
  world.playerX = Math.random();
  world.playerY = Math.random();

  stimulateGroup(brainA, "world");
  addNoise(brainA);

  if (world.enemyDistance < 0.2) {
    reward("A");
    rewardRefA.value = rewardBoostA;
    log("Brain A: Reward (enemy very close)");
  }

  const firedA = stepBrain(brainA, rewardRefA);
  const outputsRawA = getOutputsRaw(brainA);
  const outputsFiredA = getOutputsFired(brainA);
  const actionsA = interpretActions(outputsFiredA);

  if (outputsFiredA.filter(x => x).length >= 4) {
    punish("A");
    rewardRefA.value = rewardBoostA;
    log("Brain A: Punish (all outputs firing)");
  }

  log("Brain A outputs raw: " + outputsRawA.map(v => v.toFixed(2)).join(", "));
  log("Brain A outputs fired: " + outputsFiredA.join(", "));
  log("Brain A actions: " + (actionsA.length ? actionsA.join(", ") : "none"));

  stimulateGroup(brainB, "world");
  addNoise(brainB);

  if (world.health < 0.3) {
    reward("B");
    rewardRefB.value = rewardBoostB;
    log("Brain B: Reward (low health)");
  }

  const firedB = stepBrain(brainB, rewardRefB);
  const outputsRawB = getOutputsRaw(brainB);
  const outputsFiredB = getOutputsFired(brainB);
  const actionsB = interpretActions(outputsFiredB);

  if (outputsFiredB.filter(x => x).length >= 4) {
    punish("B");
    rewardRefB.value = rewardBoostB;
    log("Brain B: Punish (all outputs firing)");
  }

  log("Brain B outputs raw: " + outputsRawB.map(v => v.toFixed(2)).join(", "));
  log("Brain B outputs fired: " + outputsFiredB.join(", "));
  log("Brain B actions: " + (actionsB.length ? actionsB.join(", ") : "none"));

  log("-----");

  drawScene();
}, 250);

window.saveBrainA = () => saveBrain(brainA, "A");
window.saveBrainB = () => saveBrain(brainB, "B");
window.loadBrainA = () => loadBrain(brainA, "A");
window.loadBrainB = () => loadBrain(brainB, "B");

</script>
</body>
</html>
