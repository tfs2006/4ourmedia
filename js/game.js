// Game State
const state = {
    cash: 0,
    users: 0,
    hype: 0,
    mrr: 0,
    clickPower: 1,
    day: 1,
    level: 1,
    xp: 0,
    xpNeeded: 100,
    history: []
};

// Configuration & Data
const upgrades = [
    {
        id: 'coffee',
        name: 'Premium Coffee',
        description: 'Caffeine boost. +1 Click Power.',
        baseCost: 50,
        costMultiplier: 1.5,
        count: 0,
        effect: (s) => { s.clickPower += 1; },
        type: 'click'
    },
    {
        id: 'chatgpt',
        name: 'ChatGPT Plus',
        description: 'AI writes your emails. +$5/sec MRR.',
        baseCost: 200,
        costMultiplier: 1.2,
        count: 0,
        effect: (s) => { s.mrr += 5; },
        type: 'passive'
    },
    {
        id: 'freelancer',
        name: 'Fiverr Freelancer',
        description: 'Outsource the grunt work. +$15/sec MRR.',
        baseCost: 500,
        costMultiplier: 1.3,
        count: 0,
        effect: (s) => { s.mrr += 15; },
        type: 'passive'
    },
    {
        id: 'ads',
        name: 'Facebook Ads',
        description: 'Targeted outreach. +10 Users/click.',
        baseCost: 1000,
        costMultiplier: 1.4,
        count: 0,
        effect: (s) => { /* Logic handled in click */ },
        type: 'marketing'
    },
    {
        id: 'saas',
        name: 'Launch SaaS Tool',
        description: 'Recurring revenue machine. +$100/sec MRR.',
        baseCost: 5000,
        costMultiplier: 1.5,
        count: 0,
        effect: (s) => { s.mrr += 100; },
        type: 'passive'
    },
    {
        id: 'influencer',
        name: 'TikTok Influencer',
        description: 'Viral dance challenge. +500 Hype/sec.',
        baseCost: 15000,
        costMultiplier: 1.6,
        count: 0,
        effect: (s) => { /* Hype logic */ },
        type: 'hype'
    },
    {
        id: 'ai_agent',
        name: 'Autonomous AI Agent',
        description: 'Works while you sleep. +$1,000/sec MRR.',
        baseCost: 50000,
        costMultiplier: 1.8,
        count: 0,
        effect: (s) => { s.mrr += 1000; },
        type: 'passive'
    }
];

const newsHeadlines = [
    "Market crashes! Just kidding, it's crypto.",
    "AI replaces CEO with a toaster.",
    "Viral cat video boosts productivity by 0%.",
    "New social media app 'Yell' takes over.",
    "Competitor acquires a lemonade stand.",
    "Tech stocks soar on rumors of flying cars.",
    "Local startup pivots to 'Uber for Dogs'.",
    "VCs pouring money into 'Blockchain for Sandwiches'."
];

// DOM Elements
const els = {
    cash: document.getElementById('cash-display'),
    mrr: document.getElementById('mrr-display'),
    users: document.getElementById('users-display'),
    day: document.getElementById('day-display'),
    clickBtn: document.getElementById('main-action-btn'),
    upgradeList: document.getElementById('upgrade-list'),
    newsTicker: document.getElementById('news-content'),
    clickArea: document.getElementById('click-area')
};

// Initialization
function init() {
    loadGame();
    renderUpgrades();
    startGameLoop();
    updateUI();
    
    // Event Listeners
    els.clickBtn.addEventListener('click', handleMainClick);
    
    // News Ticker
    setInterval(() => {
        const randomNews = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];
        els.newsTicker.innerText = `BREAKING: ${randomNews}`;
    }, 10000);
}

// Core Mechanics
function handleMainClick(e) {
    // Calculate earnings
    const cashEarned = 10 * state.clickPower;
    state.cash += cashEarned;
    
    // Visual Feedback
    showFloatingText(e.clientX, e.clientY, `+$${cashEarned}`);
    
    // XP / Leveling (Simplified)
    state.xp += 1;
    if (state.xp >= state.xpNeeded) {
        levelUp();
    }
    
    updateUI();
    saveGame();
}

function levelUp() {
    state.level++;
    state.xp = 0;
    state.xpNeeded = Math.floor(state.xpNeeded * 1.5);
    state.clickPower = Math.floor(state.clickPower * 1.2);
    alert(`Level Up! You are now a Level ${state.level} Founder! Click Power Increased!`);
}

function buyUpgrade(upgradeId) {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count));
    
    if (state.cash >= cost) {
        state.cash -= cost;
        upgrade.count++;
        
        // Apply immediate effects or passive flags
        if (upgrade.type === 'click') {
            state.clickPower += 1; // Simple logic, can be complex
        } else if (upgrade.type === 'passive') {
            state.mrr += (upgrade.id === 'chatgpt' ? 5 : 
                          upgrade.id === 'freelancer' ? 15 : 
                          upgrade.id === 'saas' ? 100 : 
                          upgrade.id === 'ai_agent' ? 1000 : 0);
        }
        
        renderUpgrades();
        updateUI();
        saveGame();
    }
}

// Game Loop
function startGameLoop() {
    setInterval(() => {
        // Passive Income (MRR is monthly, so divide by 30 for daily/tick, but let's just do per second for fun)
        if (state.mrr > 0) {
            state.cash += state.mrr;
        }
        
        state.day++;
        updateUI();
    }, 1000); // 1 second tick
}

// UI Functions
function updateUI() {
    if(els.cash) els.cash.innerText = formatNumber(state.cash);
    if(els.mrr) els.mrr.innerText = formatNumber(state.mrr);
    if(els.users) els.users.innerText = formatNumber(state.users);
    if(els.day) els.day.innerText = state.day;
    
    // Update upgrade buttons availability
    upgrades.forEach(u => {
        const btn = document.getElementById(`btn-${u.id}`);
        const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.count));
        if (btn) {
            if (state.cash >= cost) {
                btn.classList.remove('disabled');
                btn.classList.add('opacity-100', 'hover:bg-white/10');
            } else {
                btn.classList.add('disabled');
                btn.classList.remove('opacity-100', 'hover:bg-white/10');
            }
        }
    });
}

function renderUpgrades() {
    if(!els.upgradeList) return;
    els.upgradeList.innerHTML = '';
    
    upgrades.forEach(u => {
        const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.count));
        const div = document.createElement('div');
        div.className = `upgrade-item ${state.cash >= cost ? '' : 'disabled'}`;
        div.id = `btn-${u.id}`;
        div.onclick = () => buyUpgrade(u.id);
        
        div.innerHTML = `
            <div class="upgrade-info">
                <h4>${u.name} <span class="text-xs text-gray-400">(Lvl ${u.count})</span></h4>
                <p>${u.description}</p>
            </div>
            <div class="upgrade-cost">$${formatNumber(cost)}</div>
        `;
        els.upgradeList.appendChild(div);
    });
}

function showFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    
    setTimeout(() => {
        el.remove();
    }, 1000);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}

// Save/Load
function saveGame() {
    localStorage.setItem('unicornFounderSave', JSON.stringify({
        state,
        upgrades: upgrades.map(u => ({ id: u.id, count: u.count }))
    }));
}

function loadGame() {
    const saved = localStorage.getItem('unicornFounderSave');
    if (saved) {
        const data = JSON.parse(saved);
        // Merge saved state
        Object.assign(state, data.state);
        // Restore upgrade counts
        data.upgrades.forEach(savedU => {
            const u = upgrades.find(up => up.id === savedU.id);
            if (u) u.count = savedU.count;
        });
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
