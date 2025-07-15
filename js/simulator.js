document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameBoard = document.getElementById('sim-game-board');
    const startScreen = document.getElementById('sim-start-screen');
    const endScreen = document.getElementById('sim-end-screen');
    const startButton = document.getElementById('start-simulator');
    const restartButton = document.getElementById('restart-simulator');
    const eventLogContainer = document.getElementById('sim-event-log');

    // --- Stat Displays ---
    const timeLeftDisplay = document.getElementById('sim-time-left');
    const earningsDisplay = document.getElementById('sim-earnings');
    const levelDisplay = document.getElementById('sim-level');
    const clickPowerDisplay = document.getElementById('sim-click-power');
    const xpBar = document.getElementById('sim-xp-bar');
    const xpDisplay = document.getElementById('sim-xp');
    const xpNeededDisplay = document.getElementById('sim-xp-needed');
    
    // --- End Screen Displays ---
    const endLevelDisplay = document.getElementById('end-level');
    const endDealsDisplay = document.getElementById('end-deals');
    const endEarningsDisplay = document.getElementById('end-earnings');

    // --- Game State ---
    let gameState = {};

    // --- Game Configuration ---
    const ICONS = {
        Startup: `<svg class="sim-lead-icon text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>`,
        Business: `<svg class="sim-lead-icon text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>`,
        Enterprise: `<svg class="sim-lead-icon text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`,
        Whale: `<svg class="sim-lead-icon text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg>`
    };
    
    const leadTypes = [
        { name: 'Startup', health: 3, value: 50, xp: 2, icon: ICONS.Startup, probability: 0.5 },
        { name: 'Growing Business', health: 8, value: 250, xp: 5, icon: ICONS.Business, probability: 0.35 },
        { name: 'Enterprise', health: 15, value: 1000, xp: 15, icon: ICONS.Enterprise, probability: 0.14 },
        { name: 'WHALE!', health: 25, value: 5000, xp: 50, icon: ICONS.Whale, probability: 0.01, isWhale: true },
    ];

    // --- Functions ---
    function init() {
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', startGame);
    }

    function startGame() {
        resetGameState();
        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        gameState.gameIsActive = true;
        
        const mainInterval = setInterval(() => {
            if (!gameState.gameIsActive) return;
            
            // Countdown
            gameState.time--;
            
            // Lead Spawner
            if (Math.random() < gameState.leadSpawnChance) {
                spawnLead();
            }
            
            updateDisplay();
            
            if (gameState.time <= 0) {
                endGame();
            }
        }, 1000);
        
        gameState.intervals.push(mainInterval);
    }

    function endGame() {
        gameState.gameIsActive = false;
        gameState.intervals.forEach(clearInterval);
        gameBoard.innerHTML = ''; // Clear board
        
        endLevelDisplay.textContent = gameState.level;
        endDealsDisplay.textContent = gameState.deals;
        endEarningsDisplay.textContent = `$${gameState.earnings.toLocaleString()}`;
        endScreen.classList.remove('hidden');
    }

    function resetGameState() {
        if (gameState.intervals) {
            gameState.intervals.forEach(clearInterval);
        }
        gameState = {
            time: 60,
            earnings: 0,
            level: 1,
            xp: 0,
            xpNeeded: 10,
            clickPower: 1,
            deals: 0,
            leadSpawnChance: 0.6,
            gameIsActive: false,
            intervals: [],
            lastClickedLead: null,
            combo: 0,
        };
        updateDisplay();
        eventLogContainer.innerHTML = '';
    }

    function updateDisplay() {
        timeLeftDisplay.textContent = gameState.time;
        earningsDisplay.textContent = gameState.earnings.toLocaleString();
        levelDisplay.textContent = gameState.level;
        clickPowerDisplay.textContent = gameState.clickPower;
        xpDisplay.textContent = gameState.xp;
        xpNeededDisplay.textContent = gameState.xpNeeded;
        xpBar.style.width = `${(gameState.xp / gameState.xpNeeded) * 100}%`;
    }

    function spawnLead(specificLeadType = null) {
        let leadData;
        if (specificLeadType) {
            leadData = { ...specificLeadType };
        } else {
            // Corrected weighted random selection of lead type
            const rand = Math.random();
            let cumulativeProb = 0;
            leadData = { ...leadTypes.find(lead => {
                cumulativeProb += lead.probability;
                return rand < cumulativeProb;
            })};
        }

        leadData.currentHealth = leadData.health;
        
        const leadElement = document.createElement('div');
        leadElement.className = 'sim-lead absolute cursor-pointer p-2 rounded-lg shadow-lg';
        if (leadData.isWhale) {
            leadElement.classList.add('whale');
        }
        leadElement.style.left = `${Math.random() * 85}%`;
        leadElement.style.top = `${Math.random() * 85}%`;
        
        leadElement.innerHTML = `
            ${leadData.icon}
            <p class="font-bold text-sm">${leadData.name}</p>
        `;
        
        leadElement.addEventListener('click', (e) => handleLeadClick(e, leadElement, leadData));

        gameBoard.appendChild(leadElement);

        setTimeout(() => {
            if (leadElement) {
                leadElement.style.animation = 'pop-out 0.3s ease-in forwards';
                setTimeout(() => leadElement.remove(), 300);
            }
        }, 4000); // Lead disappears after 4 seconds
    }

    function handleLeadClick(event, leadElement, leadData) {
        if (!gameState.gameIsActive) return;

        // Combo logic
        if (gameState.lastClickedLead === leadElement && gameState.combo < 5) {
            gameState.combo++;
        } else {
            gameState.combo = 1;
        }
        gameState.lastClickedLead = leadElement;
        
        const damage = gameState.clickPower * gameState.combo;
        leadData.currentHealth -= damage;
        
        // Visual feedback
        createFloatingText(`-${damage}`, event.clientX, event.clientY, 'text-white');
        if(gameState.combo > 1) {
             createFloatingText(`x${gameState.combo} Combo!`, event.clientX, event.clientY + 20, 'text-cyan-400');
        }
        leadElement.classList.add('shake');
        setTimeout(() => leadElement.classList.remove('shake'), 300);

        if (leadData.currentHealth <= 0) {
            // Deal Closed!
            const baseEarning = leadData.value;
            const comboBonus = Math.round(baseEarning * (0.2 * (gameState.combo - 1)));
            const totalEarning = baseEarning + comboBonus;

            gameState.earnings += totalEarning;
            gameState.deals++;
            addXp(leadData.xp);
            
            logEvent(`Closed ${leadData.name} for <span class="text-green-400 font-bold">$${totalEarning.toLocaleString()}</span>!`);
            if (comboBonus > 0) {
                logEvent(`Combo Bonus: <span class="text-cyan-400 font-bold">$${comboBonus.toLocaleString()}</span>!`);
            }
            
            leadElement.remove();
        }
        updateDisplay();
    }
    
    function addXp(amount) {
        gameState.xp += amount;
        while (gameState.xp >= gameState.xpNeeded) {
            levelUp();
        }
        updateDisplay();
    }

    function levelUp() {
        gameState.level++;
        gameState.xp -= gameState.xpNeeded;
        gameState.xpNeeded = Math.round(gameState.xpNeeded * 1.5);
        gameState.clickPower += Math.ceil(gameState.level / 2);
        logEvent(`Level Up! Reached Level <span class="text-yellow-300 font-bold">${gameState.level}</span>! Click Power increased!`, 'text-yellow-300');
    }

    function createFloatingText(text, x, y, colorClass) {
        const textElement = document.createElement('div');
        textElement.className = `floating-text ${colorClass}`;
        textElement.textContent = text;
        
        const rect = gameBoard.getBoundingClientRect();
        textElement.style.left = `${x - rect.left}px`;
        textElement.style.top = `${y - rect.top}px`;
        
        gameBoard.appendChild(textElement);
        setTimeout(() => textElement.remove(), 1500);
    }
    
    function logEvent(message, color = 'text-gray-300') {
        const logEntry = document.createElement('p');
        logEntry.className = color;
        logEntry.innerHTML = `> ${message}`;
        eventLogContainer.prepend(logEntry);
        
        if (eventLogContainer.children.length > 10) {
            eventLogContainer.lastChild.remove();
        }
    }

    // --- Initialize ---
    init();
});
