// Game State
const state = {
    cash: 0,
    lifetimeCash: 0,
    mrr: 0,
    clickPower: 1,
    day: 1,
    equity: 0, // Prestige currency
    valuation: 0,
    phase: "Garage Startup",
    achievements: [],
    startTime: Date.now()
};

// Configuration & Data
const phases = [
    { name: "Garage Startup", minVal: 0 },
    { name: "Seed Round", minVal: 100000 },
    { name: "Series A", minVal: 1000000 },
    { name: "Unicorn", minVal: 1000000000 },
    { name: "Decacorn", minVal: 10000000000 },
    { name: "Tech Giant", minVal: 100000000000 }
];

const upgrades = [
    // Click Upgrades
    { id: 'coffee', name: 'Premium Coffee', description: 'Caffeine boost. +1 Click Power.', baseCost: 50, costMultiplier: 1.5, count: 0, type: 'click', power: 1 },
    { id: 'keyboard', name: 'Mechanical Keyboard', description: 'Click louder. +5 Click Power.', baseCost: 500, costMultiplier: 1.6, count: 0, type: 'click', power: 5 },
    { id: 'course', name: 'Online Course', description: 'Learn to code faster. +20 Click Power.', baseCost: 2500, costMultiplier: 1.7, count: 0, type: 'click', power: 20 },
    { id: 'mentor', name: 'Industry Mentor', description: 'Wisdom. +100 Click Power.', baseCost: 10000, costMultiplier: 1.8, count: 0, type: 'click', power: 100 },

    // Passive Upgrades (Staff & Tools)
    { id: 'chatgpt', name: 'ChatGPT Plus', description: 'AI writes emails. +$5/sec MRR.', baseCost: 200, costMultiplier: 1.2, count: 0, type: 'passive', mrr: 5 },
    { id: 'intern', name: 'Unpaid Intern', description: 'They need experience. +$10/sec MRR.', baseCost: 500, costMultiplier: 1.3, count: 0, type: 'passive', mrr: 10 },
    { id: 'freelancer', name: 'Fiverr Freelancer', description: 'Outsource grunt work. +$40/sec MRR.', baseCost: 1500, costMultiplier: 1.4, count: 0, type: 'passive', mrr: 40 },
    { id: 'saas_basic', name: 'Basic SaaS Tool', description: 'Automate simple tasks. +$100/sec MRR.', baseCost: 5000, costMultiplier: 1.5, count: 0, type: 'passive', mrr: 100 },
    { id: 'dev_junior', name: 'Junior Developer', description: 'Writes buggy code. +$250/sec MRR.', baseCost: 15000, costMultiplier: 1.5, count: 0, type: 'passive', mrr: 250 },
    { id: 'ads_fb', name: 'Facebook Ads', description: 'Targeted outreach. +$600/sec MRR.', baseCost: 50000, costMultiplier: 1.6, count: 0, type: 'passive', mrr: 600 },
    { id: 'dev_senior', name: 'Senior Developer', description: 'Fixes junior\'s bugs. +$1,500/sec MRR.', baseCost: 150000, costMultiplier: 1.7, count: 0, type: 'passive', mrr: 1500 },
    { id: 'ai_agent', name: 'Autonomous AI Agent', description: 'Works 24/7. +$5,000/sec MRR.', baseCost: 1000000, costMultiplier: 1.8, count: 0, type: 'passive', mrr: 5000 },
    { id: 'server_farm', name: 'Private Server Farm', description: 'Scale infinitely. +$20,000/sec MRR.', baseCost: 10000000, costMultiplier: 1.9, count: 0, type: 'passive', mrr: 20000 },
    { id: 'quantum', name: 'Quantum Computer', description: 'Solve P=NP. +$100,000/sec MRR.', baseCost: 500000000, costMultiplier: 2.0, count: 0, type: 'passive', mrr: 100000 }
];

const achievements = [
    { id: 'first_dollar', name: 'First Dollar', condition: s => s.lifetimeCash >= 1, rewarded: false },
    { id: 'first_k', name: 'Thousandnaire', condition: s => s.lifetimeCash >= 1000, rewarded: false },
    { id: 'mrr_100', name: 'Ramen Profitable', condition: s => s.mrr >= 100, rewarded: false },
    { id: 'millionaire', name: 'Millionaire', condition: s => s.valuation >= 1000000, rewarded: false },
    { id: 'unicorn', name: 'Unicorn Status', condition: s => s.valuation >= 1000000000, rewarded: false }
];

const flavorTexts = [
    "Success is 1% inspiration, 99% perspiration.",
    "Move fast and break things.",
    "It's not a bug, it's a feature.",
    "Pivot!",
    "Disrupting the napkin industry.",
    "We are the Uber for toothpicks.",
    "Hiring 10x engineers only.",
    "Just shipped to prod on Friday.",
    "My other car is a server.",
    "Sleep is for the weak."
];

const newsHeadlines = [
    "Market crashes! Just kidding, it's crypto.",
    "AI replaces CEO with a toaster.",
    "Viral cat video boosts productivity by 0%.",
    "New social media app 'Yell' takes over.",
    "Competitor acquires a lemonade stand.",
    "Tech stocks soar on rumors of flying cars.",
    "Local startup pivots to 'Uber for Dogs'.",
    "VCs pouring money into 'Blockchain for Sandwiches'.",
    "4ourmedia announces record profits.",
    "Developer forgets semi-colon, destroys internet."
];

// DOM Elements
const els = {
    cash: document.getElementById('cash-display'),
    mrr: document.getElementById('mrr-display'),
    equity: document.getElementById('equity-display'),
    day: document.getElementById('day-display'),
    valuation: document.getElementById('valuation-display'),
    phase: document.getElementById('phase-display'),
    clickBtn: document.getElementById('main-action-btn'),
    upgradeList: document.getElementById('upgrade-list'),
    newsTicker: document.getElementById('news-content'),
    flavorText: document.getElementById('flavor-text'),
    achievementsList: document.getElementById('achievements-list'),
    prestigeBtn: document.getElementById('prestige-btn'),
    particles: document.getElementById('particles')
};

let currentFilter = 'all';

// Initialization
function init() {
    loadGame();
    renderUpgrades();
    startGameLoop();
    updateUI();
    
    // Event Listeners
    els.clickBtn.addEventListener('mousedown', handleMainClick); // mousedown for faster feel
    els.clickBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleMainClick(e.touches[0]); }); // mobile optimization
    
    els.prestigeBtn.addEventListener('click', prestige);

    // News Ticker
    setInterval(() => {
        const randomNews = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        els.newsTicker.innerText = `BREAKING: ${randomNews}`;
    }, 10000);

    // Flavor Text
    setInterval(() => {
        const text = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];
        els.flavorText.innerText = `"${text}"`;
    }, 15000);
}

// Core Mechanics
function handleMainClick(e) {
    // Calculate earnings with Equity Multiplier
    // Equity gives +10% bonus per point. So 10 equity = +100% = 2x multiplier.
    const multiplier = 1 + (state.equity * 0.1);
    const cashEarned = (10 * state.clickPower) * multiplier;
    
    state.cash += cashEarned;
    state.lifetimeCash += cashEarned;
    
    // Visual Feedback
    // Get coordinates relative to the button or viewport
    const x = e.clientX || (e.target.getBoundingClientRect().left + e.target.getBoundingClientRect().width / 2);
    const y = e.clientY || (e.target.getBoundingClientRect().top + e.target.getBoundingClientRect().height / 2);
    
    createParticle(x, y, `+$${formatNumber(cashEarned)}`);
    
    // Button Animation
    const btn = els.clickBtn;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 50);

    updateUI();
    checkAchievements();
}

function buyUpgrade(upgradeId) {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count));
    
    if (state.cash >= cost) {
        state.cash -= cost;
        upgrade.count++;
        
        // Recalculate stats
        recalculateStats();
        
        renderUpgrades();
        updateUI();
        saveGame();
    }
}

function recalculateStats() {
    // Reset base
    state.clickPower = 1;
    state.mrr = 0;

    // Apply upgrades
    upgrades.forEach(u => {
        if (u.type === 'click') {
            state.clickPower += (u.power * u.count);
        } else if (u.type === 'passive') {
            state.mrr += (u.mrr * u.count);
        }
    });

    // Apply Equity Multiplier to MRR
    const multiplier = 1 + (state.equity * 0.1);
    state.mrr *= multiplier;
}

// Prestige System
function calculatePrestigeEquity() {
    // Formula: 1 Equity for every $1M lifetime cash (simplified)
    // Or square root curve for diminishing returns
    if (state.lifetimeCash < 1000000) return 0;
    return Math.floor(Math.sqrt(state.lifetimeCash / 1000000));
}

function prestige() {
    const potentialEquity = calculatePrestigeEquity();
    if (potentialEquity <= state.equity) {
        alert("You need to earn more money before selling the company makes sense!");
        return;
    }

    const confirmSell = confirm(`Are you sure you want to sell your company?
    
    You will lose all Cash, Upgrades, and MRR.
    You will GAIN: ${potentialEquity - state.equity} New Equity.
    Total Equity: ${potentialEquity} (+${Math.round(potentialEquity * 10)}% Bonus to all future income).
    
    This is a permanent reset!`);

    if (confirmSell) {
        // Reset Game but keep Equity and Achievements
        const keptEquity = potentialEquity;
        const keptAchievements = state.achievements;
        
        // Reset State
        state.cash = 0;
        state.lifetimeCash = 0;
        state.mrr = 0;
        state.clickPower = 1;
        state.day = 1;
        state.equity = keptEquity;
        state.valuation = 0;
        state.phase = "Garage Startup";
        state.achievements = keptAchievements;
        
        // Reset Upgrades
        upgrades.forEach(u => u.count = 0);
        
        saveGame();
        location.reload();
    }
}

// Game Loop
function startGameLoop() {
    // Run every 100ms for smoother UI, but add 1/10th of MRR
    setInterval(() => {
        if (state.mrr > 0) {
            const cashPerTick = state.mrr / 10;
            state.cash += cashPerTick;
            state.lifetimeCash += cashPerTick;
        }
        
        // Update Valuation (Cash + MRR * 12)
        state.valuation = state.cash + (state.mrr * 12);
        
        // Update Phase
        for (let i = phases.length - 1; i >= 0; i--) {
            if (state.valuation >= phases[i].minVal) {
                state.phase = phases[i].name;
                break;
            }
        }

        // Day counter (1 day per second)
        state.day += 0.1;

        updateUI();
        checkAchievements();
    }, 100);
    
    // Auto-save every 30s
    setInterval(saveGame, 30000);
}

function checkAchievements() {
    let newUnlock = false;
    achievements.forEach(ach => {
        if (!ach.rewarded && ach.condition(state)) {
            ach.rewarded = true;
            state.achievements.push(ach.id);
            // Reward? Maybe later. For now just notification.
            createParticle(window.innerWidth / 2, window.innerHeight / 2, `🏆 ${ach.name}`);
            newUnlock = true;
        }
    });
    if (newUnlock) renderAchievements();
}

// UI Functions
function updateUI() {
    if(els.cash) els.cash.innerText = formatNumber(state.cash);
    if(els.mrr) els.mrr.innerText = formatNumber(state.mrr);
    if(els.equity) els.equity.innerText = state.equity;
    if(els.day) els.day.innerText = Math.floor(state.day);
    if(els.valuation) els.valuation.innerText = formatNumber(state.valuation);
    if(els.phase) els.phase.innerText = state.phase;
    
    // Show Prestige Button if valuation > 1M
    if (state.valuation > 1000000) {
        els.prestigeBtn.classList.remove('hidden');
        const potential = calculatePrestigeEquity();
        const gain = potential - state.equity;
        els.prestigeBtn.innerText = `Exit Company (Gain ${gain > 0 ? '+' + gain : '0'} Equity)`;
    } else {
        els.prestigeBtn.classList.add('hidden');
    }

    // Update upgrade buttons availability
    upgrades.forEach(u => {
        const btn = document.getElementById(`btn-${u.id}`);
        if (btn) {
            const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.count));
            if (state.cash >= cost) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        }
    });
}

function filterUpgrades(type) {
    currentFilter = type;
    renderUpgrades();
    
    // Update active button state
    const buttons = document.querySelectorAll('#tab-shop button');
    buttons.forEach(b => {
        if (b.innerText.toLowerCase().includes(type === 'click' ? 'upgrades' : type === 'passive' ? 'staff' : 'all')) {
            b.classList.remove('bg-slate-700', 'text-gray-300');
            b.classList.add('bg-blue-600', 'text-white');
        } else {
            b.classList.add('bg-slate-700', 'text-gray-300');
            b.classList.remove('bg-blue-600', 'text-white');
        }
    });
}

function renderUpgrades() {
    if(!els.upgradeList) return;
    els.upgradeList.innerHTML = '';
    
    const filtered = upgrades.filter(u => currentFilter === 'all' || u.type === currentFilter);
    
    filtered.forEach(u => {
        const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.count));
        const div = document.createElement('div');
        div.className = `upgrade-item ${state.cash >= cost ? '' : 'disabled'}`;
        div.id = `btn-${u.id}`;
        div.onclick = () => buyUpgrade(u.id);
        
        div.innerHTML = `
            <div class="upgrade-info">
                <h4>${u.name} <span class="text-xs text-blue-400 ml-1">Lvl ${u.count}</span></h4>
                <p>${u.description}</p>
            </div>
            <div class="upgrade-cost">$${formatNumber(cost)}</div>
        `;
        els.upgradeList.appendChild(div);
    });
}

function renderAchievements() {
    if(!els.achievementsList) return;
    els.achievementsList.innerHTML = '';
    
    const unlocked = achievements.filter(a => a.rewarded);
    if (unlocked.length === 0) {
        els.achievementsList.innerHTML = '<div class="text-xs text-gray-600 italic">No milestones yet.</div>';
        return;
    }
    
    unlocked.forEach(a => {
        const div = document.createElement('div');
        div.className = 'text-xs text-green-400 flex items-center';
        div.innerHTML = `<span class="mr-2">🏆</span> ${a.name}`;
        els.achievementsList.appendChild(div);
    });
}

function createParticle(x, y, text) {
    const el = document.createElement('div');
    el.className = 'particle text-green-400';
    el.innerText = text;
    
    // Randomize position slightly
    const offsetX = (Math.random() - 0.5) * 40;
    el.style.left = `${x + offsetX}px`;
    el.style.top = `${y}px`;
    
    els.particles.appendChild(el);
    
    setTimeout(() => {
        el.remove();
    }, 800);
}

function formatNumber(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Save/Load
function saveGame() {
    const saveData = {
        state: state,
        upgrades: upgrades.map(u => ({ id: u.id, count: u.count }))
    };
    localStorage.setItem('unicornFounderSaveV2', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('unicornFounderSaveV2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Merge saved state
            Object.assign(state, data.state);
            // Restore upgrade counts
            data.upgrades.forEach(savedU => {
                const u = upgrades.find(up => up.id === savedU.id);
                if (u) u.count = savedU.count;
            });
            // Recalculate derived stats
            recalculateStats();
        } catch (e) {
            console.error("Save file corrupted", e);
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
