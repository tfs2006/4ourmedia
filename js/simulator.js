document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameBoard = document.getElementById('sim-game-board');
    const startScreen = document.getElementById('sim-start-screen');
    const investmentsContainer = document.getElementById('sim-investments');
    const eventLogContainer = document.getElementById('sim-event-log');
    const startButton = document.getElementById('start-simulator');
    const resetButton = document.getElementById('reset-simulator');

    // --- Stat Displays ---
    const monthDisplay = document.getElementById('sim-month');
    const cashDisplay = document.getElementById('sim-cash');
    const mrrDisplay = document.getElementById('sim-mrr');
    const levelDisplay = document.getElementById('sim-level');
    const clickPowerDisplay = document.getElementById('sim-click-power');
    const xpBar = document.getElementById('sim-xp-bar');
    const xpDisplay = document.getElementById('sim-xp');
    const xpNeededDisplay = document.getElementById('sim-xp-needed');

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
        { name: 'Startup', health: 3, mrr: 8, bounty: 50, xp: 2, icon: ICONS.Startup, probability: 0.5 },
        { name: 'Business', health: 8, mrr: 80, bounty: 250, xp: 5, icon: ICONS.Business, probability: 0.35 },
        { name: 'Enterprise', health: 15, mrr: 0, bounty: 2500, xp: 15, icon: ICONS.Enterprise, probability: 0.14 },
        { name: 'WHALE!', health: 25, mrr: 500, bounty: 10000, xp: 50, icon: ICONS.Whale, probability: 0.01, isWhale: true },
    ];

    const investments = [
        { id: 'va', name: 'Hire a VA', baseCost: 500, description: 'Auto-clicks a lead every 5s.', level: 0, action: () => { setupAutoClicker(); }},
        { id: 'blog', name: 'Launch a Blog', baseCost: 2000, description: 'Passively generates small leads.', level: 0, action: () => { setupPassiveLeads(); }},
        { id: 'ads', name: 'Run Ad Campaigns', baseCost: 5000, description: 'Increases high-value lead chance.', level: 0, action: () => { 
            leadTypes.find(l=>l.name==='Enterprise').probability *= 1.5; 
            leadTypes.find(l=>l.name==='WHALE!').probability *= 2; 
            // Re-normalize probabilities
            const totalProb = leadTypes.reduce((sum, lead) => sum + lead.probability, 0);
            leadTypes.forEach(lead => lead.probability /= totalProb);
        }},
    ];

    // --- Functions ---
    function init() {
        startButton.addEventListener('click', startGame);
        resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset your empire? All progress will be lost.')) {
                resetGameState();
                startScreen.classList.remove('hidden');
                resetButton.classList.add('hidden');
            }
        });
    }

    function startGame() {
        resetGameState();
        startScreen.classList.add('hidden');
        resetButton.classList.remove('hidden');
        gameState.gameIsActive = true;
        
        // Main Game Loop - runs every second
        const mainInterval = setInterval(() => {
            if (!gameState.gameIsActive) return;
            
            // Lead Spawner - chance to spawn a lead every second
            if (Math.random() < gameState.leadSpawnChance) {
                spawnLead();
            }
            
        }, 1000); // Faster pace
        
        // Monthly Payout Loop
        const monthInterval = setInterval(() => {
            if (!gameState.gameIsActive) return;
            gameState.month++;
            const mrrPayout = gameState.mrr;
            if (mrrPayout > 0) {
                gameState.cash += mrrPayout;
                logEvent(`Payday! +<span class="text-green-400 font-bold">$${mrrPayout.toLocaleString()}</span> from MRR.`, 'text-green-400');
            }
            updateDisplay();
        }, 4000); // 1 month = 4 seconds

        gameState.intervals.push(mainInterval, monthInterval);
    }

    function resetGameState() {
        if (gameState.intervals) {
            gameState.intervals.forEach(clearInterval);
        }
        gameState = {
            month: 1, cash: 0, mrr: 0, level: 1, xp: 0, xpNeeded: 10, clickPower: 1,
            leadSpawnChance: 0.4, gameIsActive: false, intervals: [],
            autoClicker: { interval: null, speed: 5000 },
            passiveLeads: { interval: null, speed: 10000 },
        };
        investments.forEach(inv => inv.level = 0);
        // Reset probabilities to default
        leadTypes[0].probability = 0.5;
        leadTypes[1].probability = 0.35;
        leadTypes[2].probability = 0.14;
        leadTypes[3].probability = 0.01;

        updateDisplay();
        renderInvestments();
        eventLogContainer.innerHTML = '';
        gameBoard.innerHTML = ''; // Clear any leftover leads
    }

    function updateDisplay() {
        monthDisplay.textContent = gameState.month;
        cashDisplay.textContent = gameState.cash.toLocaleString();
        mrrDisplay.textContent = gameState.mrr.toLocaleString();
        levelDisplay.textContent = gameState.level;
        clickPowerDisplay.textContent = gameState.clickPower;
        xpDisplay.textContent = gameState.xp;
        xpNeededDisplay.textContent = gameState.xpNeeded;
        xpBar.style.width = `${(gameState.xp / gameState.xpNeeded) * 100}%`;
        renderInvestments();
    }

    function spawnLead() {
        const rand = Math.random();
        let cumulativeProb = 0;
        let chosenLead = leadTypes.find(lead => {
            cumulativeProb += lead.probability;
            return rand < cumulativeProb;
        });
        if (!chosenLead) chosenLead = leadTypes[0]; // Fallback
        const leadData = { ...chosenLead };

        leadData.currentHealth = leadData.health;
        
        const leadElement = document.createElement('div');
        leadElement.className = 'sim-lead absolute cursor-pointer p-2 rounded-lg shadow-lg';
        if (leadData.isWhale) leadElement.classList.add('whale');
        
        leadElement.style.left = `${Math.random() * 88}%`; // Use 88% to keep it fully in view
        leadElement.style.top = `${Math.random() * 88}%`;
        
        leadElement.innerHTML = `${leadData.icon}<p class="font-bold text-sm">${leadData.name}</p>`;
        
        leadElement.addEventListener('click', (e) => handleLeadClick(e, leadElement, leadData));
        gameBoard.appendChild(leadElement);

        setTimeout(() => {
            if (leadElement) {
                leadElement.style.animation = 'pop-out 0.3s ease-in forwards';
                setTimeout(() => leadElement.remove(), 300);
            }
        }, 4000); // Leads disappear after 4 seconds
    }

    function handleLeadClick(event, leadElement, leadData) {
        if (!gameState.gameIsActive || !leadData.currentHealth || leadData.currentHealth <= 0) return;

        const damage = gameState.clickPower;
        leadData.currentHealth -= damage;
        
        createFloatingText(`-${damage}`, event.clientX, event.clientY, 'text-white');
        leadElement.classList.add('shake');
        setTimeout(() => leadElement.classList.remove('shake'), 300);

        if (leadData.currentHealth <= 0) {
            leadElement.style.pointerEvents = 'none';
            const bounty = leadData.bounty;
            const newMrr = leadData.mrr;
            gameState.cash += bounty;
            gameState.mrr += newMrr;
            addXp(leadData.xp);
            
            logEvent(`Closed ${leadData.name}! +<span class="text-green-400 font-bold">$${bounty.toLocaleString()}</span> & +<span class="text-blue-400 font-bold">$${newMrr}/mo</span>!`);
            
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
        gameState.xpNeeded = Math.round(gameState.xpNeeded * 1.7);
        gameState.clickPower += gameState.level;
        logEvent(`Level Up! Reached Level <span class="text-yellow-300 font-bold">${gameState.level}</span>! Click Power increased!`, 'text-yellow-300');
    }

    function renderInvestments() {
        investmentsContainer.innerHTML = '';
        investments.forEach(inv => {
            const cost = Math.round(inv.baseCost * Math.pow(1.5, inv.level));
            const button = document.createElement('button');
            button.className = 'w-full text-left p-3 rounded-md transition-colors duration-200';
            button.innerHTML = `
                <p class="font-bold">${inv.name} (Lvl ${inv.level})</p>
                <p class="text-sm text-gray-400">${inv.description}</p>
                <p class="text-sm font-bold text-green-400">Upgrade Cost: $${cost.toLocaleString()}</p>
            `;
            
            if (gameState.cash < cost) {
                button.disabled = true;
            } else {
                button.disabled = false;
            }
            
            button.addEventListener('click', () => {
                if (gameState.cash >= cost) {
                    gameState.cash -= cost;
                    inv.level++;
                    inv.action();
                    logEvent(`Upgraded ${inv.name} to Level ${inv.level}!`, 'text-purple-400');
                    updateDisplay();
                }
            });
            investmentsContainer.appendChild(button);
        });
    }
    
    function setupAutoClicker() {
        if (gameState.autoClicker.interval) clearInterval(gameState.autoClicker.interval);
        
        const speed = gameState.autoClicker.speed / investments.find(i=>i.id==='va').level;
        gameState.autoClicker.interval = setInterval(() => {
            if(!gameState.gameIsActive) return;
            const randomLead = gameBoard.querySelector('.sim-lead');
            if(randomLead) {
                const rect = randomLead.getBoundingClientRect();
                const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: rect.left, clientY: rect.top });
                randomLead.dispatchEvent(clickEvent);
            }
        }, speed);
    }

    function setupPassiveLeads() {
        if (gameState.passiveLeads.interval) clearInterval(gameState.passiveLeads.interval);
        
        const speed = gameState.passiveLeads.speed / investments.find(i=>i.id==='blog').level;
        gameState.passiveLeads.interval = setInterval(() => {
            if(!gameState.gameIsActive) return;
            spawnLead(leadTypes[0]);
        }, speed);
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
        logEntry.className = `text-xs ${color} animate-fade-in`;
        logEntry.innerHTML = `> ${message}`;
        eventLogContainer.prepend(logEntry);
        if (eventLogContainer.children.length > 8) {
            eventLogContainer.lastChild.remove();
        }
    }

    init();
});
