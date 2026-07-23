let gold = 0;
let manualFish = 0;
let totalFish = 0;
let totalGold = 0;
let timePlayed = 0; 

let waterLvl = 1;
let autoLvl = 0;
let netLvl = 1; 
let goldenLvl = 1;

const skinCosts = [0, 100, 500, 1000, 2000, 3000, 5000];
let currentSkin = 1;
let maxUnlockedSkin = 1;

let hookedFishes = []; 
let stunTimer = 0;
let goldenModeTimer = 0;
let isSeabedGenerated = false; 

let activePackage = null; 
let isGameActive = true; 
let bgMusicStarted = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const masterGainNode = audioCtx.createGain();
masterGainNode.gain.value = 0; 
masterGainNode.connect(audioCtx.destination);

const audioBuffers = {};
const AUDIO_VOL = 0.06;

const sfxMap = {
    splash: 'sounds/splash.mp3',
    bell: 'sounds/bell.mp3',
    background: 'sounds/background.mp3',
    accordion: 'sounds/accordion.mp3',
    reel: 'sounds/reel.mp3',
    buy: 'sounds/buy.mp3',
    drip: 'sounds/drip.mp3',
    special: 'sounds/special.mp3',
    click: 'sounds/click.mp3'
};

async function preloadAudio() {
    for (let key in sfxMap) {
        try {
            let response = await fetch(sfxMap[key]);
            if (response.ok) {
                let arrayBuffer = await response.arrayBuffer();
                let audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                audioBuffers[key] = audioBuffer;
            }
        } catch (e) {
            console.warn("Could not load audio:", key);
        }
    }
}
preloadAudio();

function playSound(name, loop = false) {
    if (!audioBuffers[name]) return;
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[name];
    source.loop = loop;
    
    const gainNode = audioCtx.createGain();
    
    if (name === 'background' || name === 'accordion') {
        gainNode.gain.value = 0.015; 
    } else {
        gainNode.gain.value = AUDIO_VOL; 
    }
    
    source.connect(gainNode);
    gainNode.connect(masterGainNode); 
    source.start(0);
}

window.onload = () => {
    document.body.classList.add('game-active');
    masterGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.5);
};

document.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isGameActive && !bgMusicStarted) {
        bgMusicStarted = true;
        playSound('background', true);
        setTimeout(() => { playSound('accordion', false); }, 5000);
    }
}, { once: false });

document.getElementById('game-toggle-btn').addEventListener('click', (e) => {
    e.preventDefault();
    
    playSound('buy');
    
    isGameActive = false;
    document.body.classList.remove('game-active');
    
    masterGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    
    setTimeout(() => {
        window.location.href = "/";
    }, 1500);
});

document.addEventListener('click', (e) => {
    let interactable = e.target.closest('.interactable');
    if (interactable && interactable.id !== 'game-toggle-btn') {
        let isUpgradeBtn = interactable.id && interactable.id.startsWith('upg-');
        if (!isUpgradeBtn) playSound('click');
    }
});

const cursorEl = document.getElementById("custom-cursor");

document.addEventListener("mousemove", (e) => { 
    mouseY = e.clientY; 
    if (cursorEl) {
        cursorEl.style.left = e.clientX + "px";
        cursorEl.style.top = e.clientY + "px";
    }
});

document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.interactable, .nav-placeholder')) {
        cursorEl.style.backgroundImage = "url('images/cursor2.png')";
    } else {
        cursorEl.style.backgroundImage = "url('images/cursor1.png')";
    }
});

document.addEventListener("touchmove", (e) => { mouseY = e.touches[0].clientY; }, {passive: true});
document.addEventListener("touchstart", (e) => { mouseY = e.touches[0].clientY; }, {passive: true});

const upgradeCosts = [10, 100, 500, 1000, 2000, 4000, 10000];
const fishValues = [1, 2, 4, 8, 16, 32];
const waterPercentages = [15, 30, 45, 60, 75, 90];
const autoIntervals = [0, 10000, 8000, 6000, 4000, 2000, 1000];
const goldenChances = [50, 40, 30, 20, 10];
const waterBottomColors = ["#4682B4", "#36648B", "#27408B", "#191970", "#000044", "#000022"];
const spawnBounds = [3000, 6000]; 
const swimBounds = [4, 7]; 

let lineTimers = [0, 0, 0, 0, 0, 0];
let lineNextSpawn = [0, 0, 0, 0, 0, 0];

let mouseY = window.innerHeight * 0.5;
let currentHookY = mouseY;
let lastHookY = currentHookY;
let autoTimer = 0;
let debugClicks = [];

function getNextSpawnTime() { return Math.random() * (spawnBounds[1] - spawnBounds[0]) + spawnBounds[0]; }
for (let i = 0; i < 6; i++) { lineNextSpawn[i] = getNextSpawnTime(); }

document.getElementById("shop-button").addEventListener("click", () => {
    let menu = document.getElementById("shop-menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
});
document.getElementById("stats-button").addEventListener("click", () => {
    let menu = document.getElementById("stats-menu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
});

let isSkinsMenu = false;
document.getElementById("shop-toggle-btn").addEventListener("click", () => {
    isSkinsMenu = !isSkinsMenu;
    if (isSkinsMenu) {
        document.getElementById("shop-title").innerText = "Skins";
        document.getElementById("shop-toggle-img").src = "images/shop.png";
        document.getElementById("upgrades-container").style.display = "none";
        document.getElementById("skins-container").style.display = "block";
    } else {
        document.getElementById("shop-title").innerText = "Upgrades";
        document.getElementById("shop-toggle-img").src = "images/boat1.png";
        document.getElementById("upgrades-container").style.display = "block";
        document.getElementById("skins-container").style.display = "none";
    }
    updateSkinsUI();
});

document.getElementById("gold-counter").addEventListener("click", () => {
    let now = Date.now();
    debugClicks.push(now);
    debugClicks = debugClicks.filter(t => now - t <= 5000);
    if (debugClicks.length >= 10) { document.getElementById("debug-menu").style.display = "block"; debugClicks = []; }
});
document.getElementById("debug-close").addEventListener("click", () => { document.getElementById("debug-menu").style.display = "none"; });

document.getElementById("debug-save").addEventListener("click", () => {
    let gVal = parseInt(document.getElementById("debug-gold-input").value);
    if (!isNaN(gVal)) gold = gVal;
    let fVal = parseInt(document.getElementById("debug-fish-input").value);
    if (!isNaN(fVal)) {
        totalFish = fVal;
        checkSkinUnlocks();
    }
    updateUI();
});

document.getElementById("debug-delete").addEventListener("click", () => {
    localStorage.removeItem("fishingSave");
    location.reload(); 
});
document.getElementById("debug-package").addEventListener("click", () => {
    if (!activePackage) spawnPackage();
});

document.getElementById("upg-water").addEventListener("click", () => {
    if (waterLvl < 6 && gold >= upgradeCosts[waterLvl - 1]) { 
        playSound('buy'); 
        gold -= upgradeCosts[waterLvl - 1]; 
        waterLvl++; 
        updateWaterHeight(); 
        updateUI(); 
    } 
});
document.getElementById("upg-auto").addEventListener("click", () => {
    if (autoLvl < 6 && gold >= upgradeCosts[autoLvl]) { 
        playSound('buy'); 
        gold -= upgradeCosts[autoLvl]; 
        autoLvl++; 
        updateUI(); 
    } 
});
document.getElementById("upg-net").addEventListener("click", () => {
    if (netLvl < 4 && gold >= upgradeCosts[netLvl - 1]) { 
        playSound('buy'); 
        gold -= upgradeCosts[netLvl - 1]; 
        netLvl++; 
        updateUI(); 
    } 
});
document.getElementById("upg-golden").addEventListener("click", () => {
    if (goldenLvl < 5 && gold >= upgradeCosts[goldenLvl - 1]) { 
        playSound('buy'); 
        gold -= upgradeCosts[goldenLvl - 1]; 
        goldenLvl++; 
        updateUI(); 
    } 
});

function updateWaterHeight() {
    let percentage = waterPercentages[waterLvl - 1];
    let bottomColor = waterBottomColors[waterLvl - 1];
    
    document.getElementById("water").style.height = percentage + "vh";
    
    let shiftUp = percentage - 15;
    document.getElementById("atmosphere").style.transform = `translateY(-${shiftUp}vh)`;
    
    document.getElementById("water").style.background = `linear-gradient(to bottom, #4682B4 0%, ${bottomColor} 100%)`;
    document.getElementById("boat").style.bottom = percentage + "vh";
    document.getElementById("auto-boat").style.bottom = percentage + "vh";

    if (waterLvl === 6) {
        document.getElementById("seabed").style.display = "block";
        requestAnimationFrame(() => {
            document.getElementById("seabed").classList.add("show-seabed");
        });
        if (!isSeabedGenerated) { generateSeabed(); isSeabedGenerated = true; }
    }
}

function generateSeabed() {
    let seabed = document.getElementById("seabed");
    let items = ["images/seaweed1.png", "images/seaweed2.png", "images/coral.png"];
    let numDecor = Math.floor(Math.random() * 8) + 8;
    for (let i = 0; i < numDecor; i++) {
        let img = document.createElement("img");
        img.src = items[Math.floor(Math.random() * items.length)];
        img.className = "sea-decor";
        img.style.left = (Math.random() * 95) + "%"; 
        img.style.width = (Math.random() * 20 + 30) + "px"; 
        if (Math.random() > 0.5) img.style.transform = "scaleX(-1)";
        seabed.appendChild(img);
    }
}

function updateShopItem(id, currentLvl, maxLvl, costArray) {
    let costContainer = document.getElementById(`cost-${id}-container`);
    let lvlSpan = document.getElementById(`lvl-${id}`);
    lvlSpan.className = "shop-lvl"; 
    
    if (currentLvl >= maxLvl) {
        costContainer.style.display = "none";
        lvlSpan.innerText = "MAX";
        lvlSpan.classList.add("lvl-max");
    } else {
        costContainer.style.display = "flex";
        let cost = costArray[currentLvl > 0 ? currentLvl - 1 : 0];
        if (id === "auto") cost = costArray[currentLvl];
        document.getElementById(`cost-${id}`).innerText = cost;
        lvlSpan.innerText = `LVL ${currentLvl}`;
        
        if (currentLvl === 1) lvlSpan.classList.add("lvl-1");
        else if (currentLvl === 2) lvlSpan.classList.add("lvl-2");
        else if (currentLvl === 3) lvlSpan.classList.add("lvl-3");
        else if (currentLvl === 4) lvlSpan.classList.add("lvl-4");
        else if (currentLvl === 5) lvlSpan.classList.add("lvl-5");
    }
}

function checkSkinUnlocks() {
    let newlyUnlocked = false;
    for (let i = maxUnlockedSkin; i < skinCosts.length; i++) {
        if (totalFish >= skinCosts[i]) {
            maxUnlockedSkin = i + 1;
            newlyUnlocked = true;
        }
    }
    if (newlyUnlocked) {
        updateSkinsUI();
    }
}

function updateBoatSkin() {
    let boatSrc = `images/boat${currentSkin}.png`;
    document.querySelector("#boat img").src = boatSrc;
    document.querySelector("#auto-boat img").src = boatSrc;
}

function updateSkinsUI() {
    for (let i = 1; i <= 7; i++) {
        let costEl = document.getElementById(`skin-cost-${i}`);
        let statusEl = document.getElementById(`skin-status-${i}`);
        
        if (totalFish >= skinCosts[i - 1]) {
            if (costEl) costEl.style.display = "none";
            if (statusEl) {
                statusEl.style.display = "inline";
                statusEl.innerText = (currentSkin === i) ? "OWNED" : "USE";
            }
        } else {
            if (costEl) costEl.style.display = "flex";
            if (statusEl) statusEl.style.display = "none";
        }
    }
}

document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let skinId = parseInt(btn.getAttribute('data-skin'));
        if (totalFish >= skinCosts[skinId - 1]) {
            currentSkin = skinId;
            updateBoatSkin();
            updateSkinsUI();
        }
    });
});

function updateUI() {
    document.getElementById("current-gold").innerText = gold;
    document.getElementById("stat-manual").innerText = manualFish;
    document.getElementById("stat-total").innerText = totalFish;
    document.getElementById("stat-total-gold").innerText = totalGold;

    updateShopItem("water", waterLvl, 6, upgradeCosts);
    updateShopItem("auto", autoLvl, 6, upgradeCosts);
    updateShopItem("net", netLvl, 4, upgradeCosts);
    updateShopItem("golden", goldenLvl, 5, upgradeCosts);

    document.getElementById("auto-boat").style.display = autoLvl > 0 ? "block" : "none";
    updateSkinsUI();
}

function showFloatingText(text, x, y) {
    let el = document.createElement("div");
    el.className = "floating-text";
    el.innerText = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.getElementById("floating-text-container").appendChild(el);
    setTimeout(() => { el.remove(); }, 1000);
}

function triggerGoldRainText() {
    let textEl = document.getElementById("gold-rain-text");
    textEl.classList.remove("gold-rain-anim"); 
    void textEl.offsetWidth; 
    textEl.classList.add("gold-rain-anim");
}

function createSplash(x, y) {
    for(let i=0; i<5; i++) {
        let p = document.createElement('div');
        p.className = 'water-particle';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        let dx = (Math.random() - 0.5) * 40;
        let dy = (Math.random() - 1) * 30; 
        p.style.setProperty('--dx', dx + 'px');
        p.style.setProperty('--dy', dy + 'px');
        document.getElementById('water-group').appendChild(p);
        setTimeout(() => p.remove(), 500);
    }
}

function updateHookDisplay() {
    let hookEl = document.getElementById("hook");
    if (hookedFishes.length === 0) {
        hookEl.innerHTML = `<img src="images/hook.png" alt="Hook">`;
        return;
    }

    let html = '';
    if (hookedFishes.length === 1) {
        html = `<img src="${hookedFishes[0].src}">`;
    } else if (hookedFishes.length === 2) {
        html = `<div style="display:flex; gap:2px;"><img src="${hookedFishes[0].src}"><img src="${hookedFishes[1].src}"></div>`;
    } else if (hookedFishes.length === 3) {
        html = `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <div style="display:flex; gap:2px;"><img src="${hookedFishes[0].src}"><img src="${hookedFishes[1].src}"></div>
                    <img src="${hookedFishes[2].src}">
                </div>`;
    } else if (hookedFishes.length === 4) {
        html = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:2px;">
                    <img src="${hookedFishes[0].src}"><img src="${hookedFishes[1].src}">
                    <img src="${hookedFishes[2].src}"><img src="${hookedFishes[3].src}">
                </div>`;
    }
    hookEl.innerHTML = html;
}

function spawnPackage() {
    let dropDuration = (Math.random() * 5 + 10) * 1000; 
    let openTime = 10000; 
    
    let pContainer = document.createElement("div");
    pContainer.id = "package-container";
    pContainer.innerHTML = `
        <svg width="60" height="60" viewBox="0 0 60 60">
            <circle class="pkg-bg" cx="30" cy="30" r="26"></circle>
            <circle class="pkg-progress" cx="30" cy="30" r="26"></circle>
        </svg>
        <img src="images/package.png" alt="📦" onerror="this.outerHTML='<div style=\\'position:absolute;top:15px;left:18px;font-size:24px;\\'>📦</div>'">
    `;
    
    document.getElementById("fish-container").appendChild(pContainer);
    
    let boatRect = document.getElementById("boat").getBoundingClientRect();
    pContainer.style.left = boatRect.left + (boatRect.width / 2) + "px";
    
    let startY = boatRect.bottom - 20;
    let endY = window.innerHeight; 
    let speed = (endY - startY) / (dropDuration / 33);
    
    activePackage = { el: pContainer, y: startY, speed: speed, progress: 0, maxProgress: openTime };
}

setInterval(() => {
    if (isGameActive && !activePackage && Math.random() < 0.01) spawnPackage();
}, 60000);

setInterval(function spawnSeagull() {
    if (!isGameActive) return; 
    let gull = document.createElement("img");
    gull.src = "images/seagull.png";
    gull.className = "seagull";
    
    let maxSkyHeight = window.innerHeight * (1 - waterPercentages[waterLvl - 1] / 100);
    gull.style.top = (Math.random() * maxSkyHeight * 0.6) + "px"; 
    
    gull.style.width = (Math.random() * 20 + 20) + "px"; 
    let duration = Math.random() * 10 + 15; 
    
    if (Math.random() > 0.5) {
        gull.style.left = "-100px"; gull.style.transform = "scaleX(-1)";
        gull.style.animation = `flyGull ${duration}s linear forwards`;
    } else {
        gull.style.right = "-100px";
        gull.style.animation = `flyGullRight ${duration}s linear forwards`;
    }
    document.getElementById("atmosphere").appendChild(gull);
    setTimeout(() => { gull.remove(); }, duration * 1000);
}, 8000);

function spawnFish(lineIndex) {
    let fishEl = document.createElement("div");
    fishEl.className = "fish";
    
    let type = "normal";
    let imgSrc = `images/fish${lineIndex + 1}.png`; 
    let baseValue = fishValues[lineIndex];
    let finalValue = baseValue;

    if (Math.random() < 1/20) {
        type = "trash"; imgSrc = "images/trash.png";
    } else if (Math.random() < 1/50) {
        type = "special"; imgSrc = "images/special.png";
    } else {
        if (goldenModeTimer > 0 || Math.random() < (1 / goldenChances[goldenLvl - 1])) {
            type = "golden"; imgSrc = "images/golden.png"; finalValue = baseValue * 4;
        }
    }

    fishEl.setAttribute("data-type", type);
    fishEl.setAttribute("data-value", finalValue);
    
    let imgEl = document.createElement("img");
    imgEl.src = imgSrc;
    fishEl.appendChild(imgEl);

    let direction = Math.random() > 0.5 ? 1 : -1;
    let swimTime = Math.random() * (swimBounds[1] - swimBounds[0]) + swimBounds[0];
    let screenWidth = window.innerWidth;
    let pixelsPerFrame = (screenWidth / (swimTime * 30)) * direction;
    
    fishEl.setAttribute("data-speed", pixelsPerFrame);
    if (direction === 1) {
        fishEl.style.left = "-80px"; fishEl.style.transform = "scaleX(-1)";
    } else {
        fishEl.style.left = screenWidth + "px";
    }
    
    let waterHeight = document.getElementById("water").clientHeight;
    let lineSpacing = waterHeight / waterLvl;
    let fishY = (lineIndex * lineSpacing) + (lineSpacing / 2) - 25;
    fishEl.style.top = fishY + "px";
    document.getElementById("fish-container").appendChild(fishEl);
}

function saveGame() {
    let saveData = { 
        gold, manualFish, totalFish, totalGold, timePlayed, 
        waterLvl, autoLvl, netLvl, goldenLvl,
        currentSkin, maxUnlockedSkin
    };
    localStorage.setItem("fishingSave", JSON.stringify(saveData));
}

function loadGame() {
    let saveString = localStorage.getItem("fishingSave");
    if (saveString) {
        let saveData = JSON.parse(saveString);
        gold = saveData.gold || 0;
        manualFish = saveData.manualFish || 0;
        totalFish = saveData.totalFish || 0;
        totalGold = saveData.totalGold || 0;
        timePlayed = saveData.timePlayed || 0;
        waterLvl = saveData.waterLvl || 1;
        autoLvl = saveData.autoLvl || 0;
        netLvl = saveData.netLvl || 1;
        goldenLvl = saveData.goldenLvl || 1;
        currentSkin = saveData.currentSkin || 1;
        maxUnlockedSkin = saveData.maxUnlockedSkin || 1;
    }
    updateBoatSkin();
    updateWaterHeight();
    updateUI();
}

setInterval(() => {
    if (!isGameActive) return; 
    timePlayed++;
    let hours = Math.floor(timePlayed / 3600);
    let minutes = Math.floor((timePlayed % 3600) / 60);
    let seconds = timePlayed % 60;
    document.getElementById("stat-time").innerText = `${hours}h ${minutes}m ${seconds}s`;
}, 1000);

setInterval(() => {
    if (!isGameActive) return; 

    let hookImgEl = document.querySelector("#hook img");

    if (stunTimer > 0) {
        stunTimer -= 33;
        if (hookImgEl) hookImgEl.style.filter = "grayscale(1) opacity(0.5)";
    } else {
        if (hookImgEl) hookImgEl.style.filter = "none";
    }

    if (goldenModeTimer > 0) {
        goldenModeTimer -= 33;
    }

    let boatRect = document.getElementById("boat").getBoundingClientRect();
    let boatBottom = boatRect.bottom - 20; 
    let targetY = mouseY;
    
    if (targetY < boatBottom) targetY = boatBottom;
    let maxDepth = window.innerHeight - (waterLvl === 6 ? 25 : 0);
    if (targetY > maxDepth - 30) targetY = maxDepth - 30; 
    
    currentHookY += (targetY - currentHookY) * 0.15;
    
    let waterLineY = window.innerHeight * (1 - waterPercentages[waterLvl - 1] / 100);
    if ((lastHookY <= waterLineY && currentHookY > waterLineY) || 
        (lastHookY >= waterLineY && currentHookY < waterLineY)) {
        createSplash(window.innerWidth / 2, waterLineY);
    }
    lastHookY = currentHookY;
    
    let lineLength = currentHookY - boatBottom;
    let lineEl = document.getElementById("fishing-line");
    lineEl.style.top = boatBottom + "px";
    lineEl.style.height = lineLength + "px";
    
    let hookEl = document.getElementById("hook");
    hookEl.style.top = currentHookY + "px";
    let hookRect = hookEl.getBoundingClientRect();
    
    if (activePackage) {
        activePackage.y += activePackage.speed;
        activePackage.el.style.top = activePackage.y + "px";
        let pRect = activePackage.el.getBoundingClientRect();
        
        if (hookRect.top < pRect.bottom && hookRect.bottom > pRect.top) {
            activePackage.progress += 33;
        }
        
        let circle = activePackage.el.querySelector('.pkg-progress');
        let offset = 163.36 - (activePackage.progress / activePackage.maxProgress) * 163.36;
        circle.style.strokeDashoffset = offset;
        
        if (activePackage.progress >= activePackage.maxProgress) {
            playSound('special');
            let reward = waterLvl * 100;
            gold += reward; totalGold += reward;
            showFloatingText("+" + reward + " Gold!", pRect.left, pRect.top);
            updateUI();
            activePackage.el.remove();
            activePackage = null;
        } else if (activePackage.y > window.innerHeight) {
            activePackage.el.remove();
            activePackage = null;
        }
    }

    let fishes = document.querySelectorAll(".fish");
    for (let i = 0; i < fishes.length; i++) {
        let f = fishes[i];
        let currentLeft = parseFloat(f.style.left);
        let speed = parseFloat(f.getAttribute("data-speed"));
        f.style.left = (currentLeft + speed) + "px";
        
        if (speed > 0 && currentLeft > window.innerWidth) f.remove();
        if (speed < 0 && currentLeft < -80) f.remove();
        
        let fRect = f.getBoundingClientRect();
        
        if (hookRect.left < fRect.right && hookRect.right > fRect.left && hookRect.top < fRect.bottom && hookRect.bottom > fRect.top) {
            let type = f.getAttribute("data-type");

            if (type === "trash") {
                if (stunTimer <= 0) {
                    playSound('drip');
                    stunTimer = 10000;
                    hookedFishes = []; 
                    updateHookDisplay();
                    showFloatingText("STUNNED!", hookRect.left, hookRect.top);
                }
                f.remove();
            } 
            else if (stunTimer <= 0 && hookedFishes.length < netLvl) {
                if (type === "special") {
                    playSound('special');
                    goldenModeTimer = 10000; 
                    triggerGoldRainText();
                    showFloatingText("GOLDEN MODE!", hookRect.left, hookRect.top);
                    f.remove();
                    
                    let allFish = document.querySelectorAll(".fish");
                    allFish.forEach(fishDiv => {
                        if (fishDiv.getAttribute("data-type") === "normal") {
                            fishDiv.setAttribute("data-type", "golden");
                            fishDiv.setAttribute("data-value", parseInt(fishDiv.getAttribute("data-value")) * 4);
                            fishDiv.querySelector("img").src = "images/golden.png";
                        }
                    });
                } else {
                    playSound('reel');
                    let fValue = parseInt(f.getAttribute("data-value"));
                    let fSrc = f.querySelector("img").src;
                    hookedFishes.push({ value: fValue, src: fSrc });
                    updateHookDisplay();
                    f.remove();
                }
            }
        }
    }
    
    if (hookedFishes.length > 0 && lineLength < 20) {
        playSound('splash');
        playSound('bell');
        
        let batchGold = 0;
        hookedFishes.forEach(fish => { batchGold += fish.value; });
        
        gold += batchGold; totalGold += batchGold;
        manualFish += hookedFishes.length; totalFish += hookedFishes.length;
        
        hookedFishes = [];
        updateHookDisplay();
        
        checkSkinUnlocks();
        
        showFloatingText("+" + batchGold, boatRect.left + 30, boatRect.top);
        updateUI();
    }
    
    for (let i = 0; i < waterLvl; i++) {
        lineTimers[i] += 33;
        if (lineTimers[i] >= lineNextSpawn[i]) {
            lineTimers[i] = 0;
            lineNextSpawn[i] = getNextSpawnTime();
            spawnFish(i);
        }
    }
    
    if (autoLvl > 0) {
        autoTimer += 33;
        if (autoTimer >= autoIntervals[autoLvl]) {
            autoTimer = 0;
            let numLines = waterLvl;
            let lineIndex = Math.floor(Math.random() * numLines);
            let baseValue = fishValues[lineIndex];
            
            let isGolden = (goldenModeTimer > 0) || (Math.random() < (1 / goldenChances[goldenLvl - 1]));
            let finalValue = isGolden ? baseValue * 4 : baseValue;
            
            gold += finalValue; totalGold += finalValue; totalFish++;
            
            checkSkinUnlocks(); 
            
            let autoBoatRect = document.getElementById("auto-boat").getBoundingClientRect();
            showFloatingText("+" + finalValue + " (Auto)", autoBoatRect.right, autoBoatRect.top);
            updateUI();
        }
    }
}, 33);

setInterval(() => { saveGame(); }, 5000);

loadGame();

const nav = document.getElementById('pageNav');
const scrollTopBtn = document.querySelector('.scroll-top-btn');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY > lastScrollY && currentScrollY > 120) nav.classList.add('hidden');
  else nav.classList.remove('hidden');
  lastScrollY = currentScrollY;
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
