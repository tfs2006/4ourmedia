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
        { id: 'va', name: 'Hire a VA', baseCost: 500, description: 'Auto-clicks a lead every few seconds.', level: 0, action: () => { setupAutoClicker(); }},
        { id: 'blog', name: 'Launch a Blog', baseCost: 2000, description: 'Passively generates small leads.', level: 0, action: () => { setupPassiveLeads(); }},
        { id: 'ads', name: 'Run Ad Campaigns', baseCost: 5000, description: 'Increases high-value lead chance.', level: 0, action: () => { updateLeadProbabilities(); }},
        { id: 'seo', name: 'SEO Specialist', baseCost: 7500, description: 'Passively increases MRR by 2% each month.', level: 0, action: () => {} },
        { id: 'contentTeam', name: 'Content Team', baseCost: 10000, description: 'Doubles the effectiveness of your Blog.', level: 0, action: () => { if(gameState.passiveLeads.interval) setupPassiveLeads(); } },
        { id: 'podcast', name: 'Podcast Sponsorship', baseCost: 25000, description: 'Small chance to spawn a Whale lead each month.', level: 0, action: () => {} },
        { id: 'followup', name: 'Follow-up Automation', baseCost: 4000, description: 'Leads stay on screen 25% longer.', level: 0, action: () => { gameState.leadLifetime *= 1.25; } },
        { id: 'salesTraining', name: 'Advanced Sales Training', baseCost: 15000, description: 'Permanently increases bounty cash by 10%.', level: 0, action: () => { gameState.bountyMultiplier += 0.1; } },
        { id: 'referralNetwork', name: 'Build Referral Network', baseCost: 30000, description: 'Closing a deal has a chance to spawn a new lead.', level: 0, action: () => {} },
        { id: 'coffee', name: 'Espresso Machine', baseCost: 250, description: 'Speeds up the passage of time slightly.', level: 0, action: () => { updateGameSpeed(); } },
        { id: 'marketResearch', name: 'Market Research', baseCost: 50000, description: 'Increases chance of a "Hot" market next month.', level: 0, action: () => {} },
    ];
    
    const setbacks = [
        { name: 'Client Churn', message: 'Oh no! A client churned, losing you MRR.', effect: () => {
            const lostMrr = Math.min(gameState.mrr, Math.round(gameState.mrr * (Math.random() * 0.2 + 0.05)));
            gameState.mrr -= lostMrr;
            logEvent(`Client Churn! Lost <span class="text-red-400 font-bold">$${lostMrr}/mo</span> MRR.`, 'text-red-400');
        }},
        { name: 'Tax Season', message: 'It\'s tax season! You pay your dues.', effect: () => {
            const taxAmount = Math.round(gameState.cash * 0.1);
            gameState.cash -= taxAmount;
            logEvent(`Tax Season! Paid <span class="text-red-400 font-bold">$${taxAmount.toLocaleString()}</span> in taxes.`, 'text-red-400');
        }},
        { name: 'Ad Campaign Failed', message: 'Your latest ad campaign flopped!', effect: () => {
            logEvent(`An ad campaign failed to deliver results.`, 'text-red-400');
        }},
        { name: 'Platform Outage', message: 'A platform outage has frozen all activity!', effect: () => {
            logEvent(`Platform Outage! No income or leads this month.`, 'text-red-500');
            gameState.isFrozen = true;
            setTimeout(() => { gameState.isFrozen = false; }, gameState.gameSpeed);
        }},
    ];

    const marketConditions = {
        normal: { name: 'Normal', multiplier: 1, leadChance: 0.4, color: 'text-gray-300' },
        hot: { name: 'Hot', multiplier: 1.5, leadChance: 0.7, color: 'text-green-400' },
        cold: { name: 'Cold', multiplier: 0.7, leadChance: 0.2, color: 'text-blue-400' },
    };

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
        
        const mainInterval = setInterval(() => {
            if (!gameState.gameIsActive || gameState.isFrozen) return;
            if (Math.random() < gameState.market.leadChance) spawnLead();
        }, 1200);
        
        const monthInterval = setInterval(() => {
            if (!gameState.gameIsActive) return;
            
            if (!gameState.isFrozen) {
                gameState.month++;
                const mrrPayout = Math.round(gameState.mrr * gameState.market.multiplier);
                if (mrrPayout > 0) {
                    gameState.cash += mrrPayout;
                    logEvent(`Payday! +<span class="text-green-400 font-bold">$${mrrPayout.toLocaleString()}</span> from MRR.`, 'text-green-400');
                }
                
                const seoInvestment = investments.find(i=>i.id==='seo');
                if (seoInvestment.level > 0) {
                    const seoBonus = Math.round(gameState.mrr * 0.02 * seoInvestment.level);
                    gameState.mrr += seoBonus;
                    if (seoBonus > 0) logEvent(`SEO efforts boosted MRR by <span class="text-blue-400 font-bold">$${seoBonus}</span>!`, 'text-blue-400');
                }
                const podcastInvestment = investments.find(i=>i.id==='podcast');
                if (podcastInvestment.level > 0 && Math.random() < (0.05 * podcastInvestment.level)) {
                    logEvent(`Podcast sponsorship paid off! A Whale lead is inbound!`, 'text-yellow-300');
                    spawnLead(leadTypes.find(l=>l.isWhale));
                }

                if (Math.random() < 0.1) {
                    const setback = setbacks[Math.floor(Math.random() * setbacks.length)];
                    setback.effect();
                }
            }
            
            updateMarketCondition();
            updateDisplay();
        }, gameState.gameSpeed);

        gameState.intervals.push(mainInterval, monthInterval);
    }

    function resetGameState() {
        if (gameState.intervals) gameState.intervals.forEach(clearInterval);
        gameState = {
            month: 1, cash: 0, mrr: 0, level: 1, xp: 0, xpNeeded: 10, clickPower: 1,
            gameIsActive: false, intervals: [], leadLifetime: 4000, bountyMultiplier: 1.0, 
            gameSpeed: 4000, market: marketConditions.normal, isFrozen: false,
            critChance: 0.05, critMultiplier: 3,
            autoClicker: { interval: null, speed: 5000 },
            passiveLeads: { interval: null, speed: 10000 },
        };
        investments.forEach(inv => inv.level = 0);
        leadTypes[0].probability = 0.5; leadTypes[1].probability = 0.35; leadTypes[2].probability = 0.14; leadTypes[3].probability = 0.01;
        updateDisplay();
        renderInvestments();
        eventLogContainer.innerHTML = '';
        gameBoard.innerHTML = '';
    }

    function updateDisplay() {
        monthDisplay.textContent = gameState.month;
        cashDisplay.textContent = Math.round(gameState.cash).toLocaleString();
        mrrDisplay.textContent = Math.round(gameState.mrr).toLocaleString();
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
        if(!leadData.name) leadData = {...leadTypes[0]};

        leadData.currentHealth = leadData.health;
        
        const leadElement = document.createElement('div');
        leadElement.className = 'sim-lead absolute cursor-pointer p-2 rounded-lg shadow-lg';
        if (leadData.isWhale) leadElement.classList.add('whale');
        
        leadElement.style.left = `${Math.random() * 88}%`;
        leadElement.style.top = `${Math.random() * 88}%`;
        
        leadElement.innerHTML = `${leadData.icon}<p class="font-bold text-sm">${leadData.name}</p>`;
        
        leadElement.addEventListener('click', (e) => handleLeadClick(e, leadElement, leadData));
        gameBoard.appendChild(leadElement);

        setTimeout(() => {
            if (leadElement) {
                leadElement.style.animation = 'pop-out 0.3s ease-in forwards';
                setTimeout(() => leadElement.remove(), 300);
            }
        }, gameState.leadLifetime);
    }

    function handleLeadClick(event, leadElement, leadData) {
        if (!gameState.gameIsActive || !leadData.currentHealth || leadData.currentHealth <= 0) return;

        let damage = gameState.clickPower;
        const isCrit = Math.random() < gameState.critChance;
        if (isCrit) {
            damage *= gameState.critMultiplier;
            createFloatingText(`CRIT! -${damage}`, event.clientX, event.clientY, 'text-red-500 text-lg');
        } else {
            createFloatingText(`-${damage}`, event.clientX, event.clientY, 'text-white');
        }

        leadData.currentHealth -= damage;
        
        leadElement.classList.add('shake');
        setTimeout(() => leadElement.classList.remove('shake'), 300);

        if (leadData.currentHealth <= 0) {
            leadElement.style.pointerEvents = 'none';
            const bounty = Math.round(leadData.bounty * gameState.bountyMultiplier * gameState.market.multiplier);
            const newMrr = Math.round(leadData.mrr * gameState.market.multiplier);
            gameState.cash += bounty;
            gameState.mrr += newMrr;
            addXp(leadData.xp);
            
            logEvent(`Closed ${leadData.name}! +<span class="text-green-400 font-bold">$${bounty.toLocaleString()}</span> & +<span class="text-blue-400 font-bold">$${newMrr}/mo</span>!`);
            
            const referralInvestment = investments.find(i=>i.id==='referralNetwork');
            if (referralInvestment.level > 0 && Math.random() < (0.1 * referralInvestment.level)) {
                logEvent(`Referral! A new lead appeared!`, 'text-cyan-400');
                spawnLead(leadTypes[0]);
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
        gameState.xpNeeded = Math.round(gameState.xpNeeded * 1.7);
        gameState.clickPower += gameState.level;
        gameState.critChance += 0.005; // Small crit chance increase on level up
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
            
            if (gameState.cash < cost) button.disabled = true;
            
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
            if(!gameState.gameIsActive || gameState.isFrozen) return;
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
        const contentTeamLevel = investments.find(i=>i.id==='contentTeam').level;
        const speed = gameState.passiveLeads.speed / (investments.find(i=>i.id==='blog').level * (contentTeamLevel > 0 ? contentTeamLevel * 2 : 1));
        gameState.passiveLeads.interval = setInterval(() => {
            if(!gameState.gameIsActive || gameState.isFrozen) return;
            spawnLead(leadTypes[0]);
        }, speed);
    }
    
    function updateGameSpeed() {
        const coffeeLevel = investments.find(i=>i.id==='coffee').level;
        gameState.gameSpeed = 4000 / (1 + (0.1 * coffeeLevel));
    }

    function updateLeadProbabilities() {
        // This function is called when 'Run Ad Campaigns' is purchased.
    }
    
    function updateMarketCondition() {
        const researchLevel = investments.find(i=>i.id==='marketResearch').level;
        const hotChance = 0.15 + (0.05 * researchLevel);
        const rand = Math.random();

        if (rand < hotChance) {
            gameState.market = marketConditions.hot;
        } else if (rand < hotChance + 0.15) { // 15% chance of cold market
            gameState.market = marketConditions.cold;
        } else {
            gameState.market = marketConditions.normal;
        }
        logEvent(`Market is now <span class="${gameState.market.color} font-bold">${gameState.market.name}</span>!`, gameState.market.color);
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
