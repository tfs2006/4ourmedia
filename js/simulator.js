document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const gameBoard = document.getElementById('sim-game-board');
    const startScreen = document.getElementById('sim-start-screen');
    const endScreen = document.getElementById('sim-end-screen');
    const startButton = document.getElementById('start-simulator');
    const restartButton = document.getElementById('restart-simulator');
    const upgradesContainer = document.getElementById('sim-upgrades');
    const eventLog = document.getElementById('sim-event-log');

    // --- Stat Displays ---
    const timeLeftDisplay = document.getElementById('sim-time-left');
    const bountiesDisplay = document.getElementById('sim-bounties');
    const mrrDisplay = document.getElementById('sim-mrr');
    const dealsDisplay = document.getElementById('sim-deals');
    const endDealsDisplay = document.getElementById('end-deals');
    const endMrrDisplay = document.getElementById('end-mrr');
    const endBountiesDisplay = document.getElementById('end-bounties');
    const endArrDisplay = document.getElementById('end-arr');

    // --- Game State ---
    let gameState = {
        time: 60,
        bounties: 0,
        mrr: 0,
        deals: 0,
        clickPower: 1,
        leadSpawnRate: 1500,
        gameIsActive: false,
        intervals: [],
    };

    // --- Game Data (Based on Hiring Plan) ---
    const leadTypes = [
        { name: 'Startup', plan: 'Shopify Basic', health: 5, mrr: 8, bounty: 0, color: 'bg-green-500' },
        { name: 'Retail Store', plan: 'Shopify Advanced', health: 8, mrr: 80, bounty: 0, color: 'bg-blue-500' },
        { name: 'Enterprise Client', plan: 'Shopify Plus', health: 12, mrr: 0, bounty: 2500, color: 'bg-purple-500' },
        { name: 'POS Pro Prospect', plan: 'POS Pro', health: 6, mrr: 0, bounty: 500, color: 'bg-yellow-500' },
    ];

    const upgrades = [
        { id: 'crm', name: 'CRM Automation', cost: 250, description: '+1 Click Power', action: () => gameState.clickPower++, purchased: false },
        { id: 'network', name: 'Networking Event', cost: 1000, description: 'Faster Lead Spawns', action: () => gameState.leadSpawnRate *= 0.8, purchased: false },
        { id: 'training', name: 'Advanced Training', cost: 2000, description: '+5 Click Power', action: () => gameState.clickPower += 5, purchased: false },
        { id: 'plus', name: 'Plus Partner Status', cost: 5000, description: 'Double All Earnings!', action: () => { leadTypes.forEach(l => { l.mrr *= 2; l.bounty *= 2; }); }, purchased: false },
    ];
    
    const randomEvents = [
        { text: "Market Boom! Leads are flooding in!", effect: () => { tempChangeSpawnRate(0.5, 5000); }},
        { text: "BigCommerce affiliate program shut down! More leads!", effect: () => { tempChangeSpawnRate(0.6, 8000); }},
        { text: "A key lead went with a competitor...", effect: () => { removeHighValueLead(); }},
        { text: "Your blog post went viral! High-quality leads incoming!", effect: () => { spawnSpecificLead(2, 3); }},
    ];

    // --- Functions ---
    function init() {
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', startGame);
        renderUpgrades();
    }

    function startGame() {
        resetGameState();
        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        gameState.gameIsActive = true;
        
        const countdownInterval = setInterval(() => {
            gameState.time--;
            updateStats();
            if (gameState.time <= 0) {
                endGame();
            }
        }, 1000);
        gameState.intervals.push(countdownInterval);

        const leadSpawnInterval = setInterval(() => {
            if (gameState.gameIsActive) spawnLead();
        }, gameState.leadSpawnRate);
        gameState.intervals.push(leadSpawnInterval);
        
        const eventInterval = setInterval(() => {
            if (gameState.gameIsActive) triggerRandomEvent();
        }, 10000);
         gameState.intervals.push(eventInterval);
    }

    function endGame() {
        gameState.gameIsActive = false;
        gameState.intervals.forEach(clearInterval);
        gameBoard.innerHTML = ''; // Clear board
        
        // Show end screen
        endDealsDisplay.textContent = gameState.deals;
        endMrrDisplay.textContent = `$${gameState.mrr.toLocaleString()}/mo`;
        endBountiesDisplay.textContent = `$${gameState.bounties.toLocaleString()}`;
        endArrDisplay.textContent = `$${(gameState.mrr * 12).toLocaleString()}`;
        endScreen.classList.remove('hidden');
    }

    function resetGameState() {
        gameState = {
            time: 60, bounties: 0, mrr: 0, deals: 0, clickPower: 1, leadSpawnRate: 1500, gameIsActive: false, intervals: [],
        };
        leadTypes.forEach(l => { // Reset potential mutations from upgrades
            if(l.name === 'Startup') { l.mrr = 8; l.bounty = 0; }
            if(l.name === 'Retail Store') { l.mrr = 80; l.bounty = 0; }
            if(l.name === 'Enterprise Client') { l.mrr = 0; l.bounty = 2500; }
            if(l.name === 'POS Pro Prospect') { l.mrr = 0; l.bounty = 500; }
        });
        upgrades.forEach(u => u.purchased = false);
        renderUpgrades();
        updateStats();
        eventLog.textContent = '';
    }

    function updateStats() {
        timeLeftDisplay.textContent = gameState.time;
        bountiesDisplay.textContent = gameState.bounties.toLocaleString();
        mrrDisplay.textContent = gameState.mrr.toLocaleString();
        dealsDisplay.textContent = gameState.deals;
        renderUpgrades(); // To update button disabled state
    }

    function spawnLead() {
        const leadData = { ...leadTypes[Math.floor(Math.random() * leadTypes.length)] };
        leadData.currentHealth = leadData.health;
        
        const leadElement = document.createElement('div');
        leadElement.className = 'sim-lead absolute cursor-pointer p-2 rounded-lg shadow-lg transition-all duration-300';
        leadElement.style.left = `${Math.random() * 85}%`;
        leadElement.style.top = `${Math.random() * 85}%`;
        
        leadElement.innerHTML = `
            <p class="font-bold text-sm">${leadData.name}</p>
            <p class="text-xs text-gray-300">${leadData.plan}</p>
            <div class="progress-bar-bg bg-gray-600 rounded-full h-2 mt-1 overflow-hidden">
                <div class="progress-bar h-full rounded-full ${leadData.color}" style="width: 100%;"></div>
            </div>
        `;
        
        leadElement.addEventListener('click', () => {
            if (!gameState.gameIsActive) return;
            
            leadData.currentHealth -= gameState.clickPower;
            const progressBar = leadElement.querySelector('.progress-bar');
            progressBar.style.width = `${(leadData.currentHealth / leadData.health) * 100}%`;

            if (leadData.currentHealth <= 0) {
                // Deal Closed!
                gameState.bounties += leadData.bounty;
                gameState.mrr += leadData.mrr;
                gameState.deals++;
                updateStats();
                leadElement.remove();
            }
        });

        gameBoard.appendChild(leadElement);

        setTimeout(() => {
            if (leadElement) leadElement.remove();
        }, 5000); // Lead disappears after 5 seconds if not closed
    }
    
    function renderUpgrades() {
        upgradesContainer.innerHTML = '';
        upgrades.forEach(upgrade => {
            const button = document.createElement('button');
            button.id = upgrade.id;
            button.className = 'w-full text-left p-3 rounded-md transition-colors duration-200 sim-upgrade-btn';
            button.innerHTML = `
                <p class="font-bold">${upgrade.name}</p>
                <p class="text-sm text-gray-400">${upgrade.description}</p>
                <p class="text-sm font-bold text-green-400">Cost: $${upgrade.cost.toLocaleString()}</p>
            `;
            
            if (upgrade.purchased) {
                button.disabled = true;
                button.classList.add('bg-green-800', 'text-gray-400', 'cursor-not-allowed');
                button.querySelector('p:last-child').textContent = 'Purchased';
            } else if (gameState.bounties < upgrade.cost) {
                button.disabled = true;
                button.classList.add('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
            } else {
                button.disabled = false;
                button.classList.add('bg-gray-700', 'hover:bg-gray-600');
            }
            
            button.addEventListener('click', () => {
                if (gameState.bounties >= upgrade.cost && !upgrade.purchased) {
                    gameState.bounties -= upgrade.cost;
                    upgrade.action();
                    upgrade.purchased = true;
                    updateStats();
                }
            });
            upgradesContainer.appendChild(button);
        });
    }

    function triggerRandomEvent() {
        const eventData = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        eventLog.textContent = eventData.text;
        eventData.effect();
        setTimeout(() => { eventLog.textContent = ''; }, 4000);
    }

    function tempChangeSpawnRate(multiplier, duration) {
        const originalRate = gameState.leadSpawnRate;
        gameState.leadSpawnRate *= multiplier;
        // Clear and set new interval
        clearInterval(gameState.intervals[1]);
        gameState.intervals[1] = setInterval(() => { if(gameState.gameIsActive) spawnLead(); }, gameState.leadSpawnRate);
        
        setTimeout(() => {
            gameState.leadSpawnRate = originalRate;
            clearInterval(gameState.intervals[1]);
            gameState.intervals[1] = setInterval(() => { if(gameState.gameIsActive) spawnLead(); }, gameState.leadSpawnRate);
        }, duration);
    }

    function removeHighValueLead() {
        const leads = gameBoard.querySelectorAll('.sim-lead');
        let highestValue = 0;
        let leadToRemove = null;
        leads.forEach(lead => {
            // A simple heuristic for value
            const value = (lead.innerHTML.includes('Plus') ? 2500 : 0) + (lead.innerHTML.includes('Advanced') ? 80 : 0);
            if (value > highestValue) {
                highestValue = value;
                leadToRemove = lead;
            }
        });
        if(leadToRemove) leadToRemove.remove();
    }

    function spawnSpecificLead(typeIndex, count) {
        for(let i = 0; i < count; i++) {
             const leadData = { ...leadTypes[typeIndex] };
             spawnLead(leadData); // Pass the specific lead data
        }
    }

    // --- Initialize ---
    init();
});
