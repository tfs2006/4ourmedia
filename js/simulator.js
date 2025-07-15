document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameBoard = document.getElementById('sim-game-board');
    const startScreen = document.getElementById('sim-start-screen');
    const investmentsContainer = document.getElementById('sim-investments');
    const eventLogContainer = document.getElementById('sim-event-log');
    const startButton = document.getElementById('start-simulator');

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
        { id: 'va', name: 'Hire a VA', baseCost: 500, description: 'Auto-clicks a lead every 5s.', level: 0, action: () => { gameState.autoClickInterval = 5000; setupAutoClicker(); }},
        { id: 'blog', name: 'Launch a Blog', baseCost: 2000, description: 'Passively generates small leads.', level: 0, action: () => { gameState.passiveLeadInterval = 10000; setupPassiveLeads(); }},
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
    }

    function startGame() {
        resetGameState();
        startScreen.classList.add('hidden');
        gameState.gameIsActive = true;
        
        const mainInterval = setInterval(() => {
            if (!gameState.gameIsActive) return;
            
            // Month passes
            gameState.month++;
            // Payout MRR
            const mrrPayout = gameState.mrr;
            if (mrrPayout > 0) {
                gameState.cash += mrrPayout;
                logEvent(`Payday! +<span class="text-green-400 font-bold">$${mrrPayout.toLocaleString()}</span> from MRR.`, 'text-green-400');
            }
            
            // Lead Spawner
            if (Math.random() < gameState.leadSpawnChance) {
                spawnLead();
            }
            
            updateDisplay();
        }, 5000); // 1 month = 5 seconds
        
        gameState.intervals.push(mainInterval);
    }

    function resetGameState() {
        if (gameState.intervals) {
            gameState.intervals.forEach(clearInterval);
        }
        gameState = {
            month: 1, cash: 0, mrr: 0, level: 1, xp: 0, xpNeeded: 10, clickPower: 1,
            leadSpawnChance: 0.7, gameIsActive: false, intervals: [], lastClickedLead: null, combo: 0,
            autoClickInterval: null, passiveLeadInterval: null,
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

    function spawnLead(specificLeadType = null) {
        let leadData;
        if (specificLeadType) {
            leadData = { ...specificLeadType };
        } else {
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
        if (leadData.isWhale) leadElement.classList.add('whale');
        
        leadElement.style.left = `${Math.random() * 85}%`;
        leadElement.style.top = `${Math.random() * 85}%`;
        
        leadElement.innerHTML = `${leadData.icon}<p class="font-bold text-sm">${leadData.name}</p>`;
        
        leadElement.addEventListener('click', (e) => handleLeadClick(e, leadElement, leadData));
        gameBoard.appendChild(leadElement);

        setTimeout(() => {
            if (leadElement) {
                leadElement.style.animation = 'pop-out 0.3s ease-in forwards';
                setTimeout(() => leadElement.remove(), 300);
            }
        }, 5000);
    }

    function handleLeadClick(event, leadElement, leadData) {
        if (!gameState.gameIsActive || !leadData.currentHealth || leadData.currentHealth <= 0) return;

        const damage = gameState.clickPower;
        leadData.currentHealth -= damage;
        
        createFloatingText(`-${damage}`, event.clientX, event.clientY, 'text-white');
        leadElement.classList.add('shake');
        setTimeout(() => leadElement.classList.remove('shake'), 300);

        if (leadData.currentHealth <= 0) {
            leadElement.style.pointerEvents = 'none'; // Prevent multi-clicks on a dead lead
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
                <p class="text-sm font-bold text-green-400">Cost: $${cost.toLocaleString()}</p>
            `;
            
            if (gameState.cash < cost) {
                button.disabled = true;
                button.classList.add('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
            } else {
                button.disabled = false;
                button.classList.add('bg-gray-700', 'hover:bg-gray-600');
            }
            
            button.addEventListener('click', () => {
                if (gameState.cash >= cost) {
                    gameState.cash -= cost;
                    inv.action(); // Apply the effect first
                    inv.level++; // Then increment level
                    logEvent(`Upgraded ${inv.name} to Level ${inv.level}!`, 'text-purple-400');
                    updateDisplay();
                }
            });
            investmentsContainer.appendChild(button);
        });
    }
    
    function setupAutoClicker() {
        // Clear existing interval to prevent stacking
        const existingInterval = gameState.intervals.find(i => i.id === 'autoClicker');
        if (existingInterval) clearInterval(existingInterval);
        
        const interval = setInterval(() => {
            if(!gameState.gameIsActive) return;
            const randomLead = gameBoard.querySelector('.sim-lead');
            if(randomLead) {
                // Simulate a click event at the lead's position
                const rect = randomLead.getBoundingClientRect();
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2
                });
                randomLead.dispatchEvent(clickEvent);
            }
        }, gameState.autoClickInterval / (investments.find(i=>i.id==='va').level)); // Speed up with levels
        interval.id = 'autoClicker';
        gameState.intervals = gameState.intervals.filter(i => i.id !== 'autoClicker');
        gameState.intervals.push(interval);
    }

    function setupPassiveLeads() {
        const existingInterval = gameState.intervals.find(i => i.id === 'passiveLeads');
        if (existingInterval) clearInterval(existingInterval);

        const interval = setInterval(() => {
            if(!gameState.gameIsActive) return;
            spawnLead(leadTypes[0]); // Spawn a startup lead
        }, gameState.passiveLeadInterval / (investments.find(i=>i.id==='blog').level)); // Speed up with levels
        interval.id = 'passiveLeads';
        gameState.intervals = gameState.intervals.filter(i => i.id !== 'passiveLeads');
        gameState.intervals.push(interval);
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
        logEntry.className = `text-xs ${color}`;
        logEntry.innerHTML = `> ${message}`;
        eventLogContainer.prepend(logEntry);
        if (eventLogContainer.children.length > 12) {
            eventLogContainer.lastChild.remove();
        }
    }

    init();
});
