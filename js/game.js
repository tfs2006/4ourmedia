// Game State
const state = {
    cash: 100,
    users: 0,
    day: 1,
    phase: "Garage Startup",
    officeLevel: 1,
    employees: [],
    upgrades: [], // Array of owned upgrade IDs
    achievements: [],
    startTime: Date.now(),
    crunchMode: false,
    viralCooldown: 0,
    prestige: 0, // IPO count / Multiplier
    selectedEmployeeId: null,
    valuation: 0
};

// Configuration
const officeConfig = {
    1: { name: "Garage HQ", slots: 2, cost: 0 },
    2: { name: "Seed Office", slots: 4, cost: 1000 },
    3: { name: "Tech Park", slots: 8, cost: 10000 },
    4: { name: "Skyscraper", slots: 16, cost: 100000 },
    5: { name: "Moon Base", slots: 32, cost: 1000000 }
};

const employeeTypes = {
    'intern': { name: "Intern", cost: 50, output: 1, type: 'code', icon: '👶', energyDecay: 0.05, desc: "Cheap labor. Falls asleep often." },
    'junior': { name: "Junior Dev", cost: 250, output: 5, type: 'code', icon: '💻', energyDecay: 0.03, desc: "Writes code. Creates bugs." },
    'senior': { name: "Senior Dev", cost: 1000, output: 20, type: 'code', icon: '🧙‍♂️', energyDecay: 0.01, desc: "Solid output. Reliable." },
    'sales': { name: "Sales Bro", cost: 500, output: 2, type: 'sales', icon: '🤝', energyDecay: 0.03, desc: "Converts Users to Cash." },
    'manager': { name: "Manager", cost: 2000, output: 0, type: 'support', icon: '👔', energyDecay: 0.01, desc: "Auto-wakes nearby staff." },
    'ai': { name: "AI Bot", cost: 5000, output: 50, type: 'code', icon: '🤖', energyDecay: 0, desc: "Never sleeps. Expensive server costs." }
};

const UPGRADES = [
    { id: 'coffee_1', name: 'Espresso Machine', cost: 500, desc: 'Energy decay reduced by 20%', icon: '☕' },
    { id: 'chairs_1', name: 'Ergonomic Chairs', cost: 1200, desc: 'Bug chance reduced by 30%', icon: '🪑' },
    { id: 'slack_1', name: 'Chat Pro', cost: 2500, desc: 'Managers work 2x faster', icon: '💬' },
    { id: 'server_1', name: 'Cloud Credits', cost: 5000, desc: 'All output +25%', icon: '☁️' },
    { id: 'gym_1', name: 'Office Gym', cost: 10000, desc: 'Max Energy +50%', icon: '🏋️' },
    { id: 'nap_pods', name: 'Nap Pods', cost: 25000, desc: 'Sleep recovery is instant', icon: '🛌' }
];

// DOM Elements
const els = {
    cash: document.getElementById('cash-display'),
    users: document.getElementById('users-display'),
    officeName: document.getElementById('office-name'),
    slotsUsed: document.getElementById('slots-used'),
    slotsTotal: document.getElementById('slots-total'),
    officeGrid: document.getElementById('office-grid'),
    hireList: document.getElementById('hire-list'),
    upgradesList: document.getElementById('upgrades-list'),
    expandBtn: document.getElementById('expand-btn'),
    founderBtn: document.getElementById('founder-work-btn'),
    
    // Tabs
    btnTabHire: document.getElementById('btn-tab-hire'),
    btnTabUpgrades: document.getElementById('btn-tab-upgrades'),
    mgmtHire: document.getElementById('mgmt-hire'),
    mgmtUpgrades: document.getElementById('mgmt-upgrades'),

    // Employee Detail Overlay
    viewEmployee: document.getElementById('view-employee'),
    empDetailName: document.getElementById('emp-detail-name'),
    empDetailRole: document.getElementById('emp-detail-role'),
    empDetailStats: document.getElementById('emp-detail-stats'),
    btnTrain: document.getElementById('btn-train'),
    btnFire: document.getElementById('btn-fire'),
    btnCloseDetail: document.getElementById('btn-close-detail'),

    // Active Skills
    btnViral: document.getElementById('btn-viral'),
    btnCrunch: document.getElementById('btn-crunch'),
    ipoBtn: document.getElementById('ipo-btn'),
    
    // Advisor
    advisorMsg: document.getElementById('advisor-message'),

    // Sequence Game
    seqOverlay: document.getElementById('sequence-overlay'),
    seqDisplay: document.getElementById('sequence-display'),
    seqStatus: document.getElementById('sequence-status'),
    closeSeqBtn: document.getElementById('close-sequence-btn'),
    particles: document.getElementById('particles')
};

// Initialization
function init() {
    if(localStorage.getItem('unicornTycoonV2')) {
        loadGame();
    } else {
        // Migration or new game
        state.cash = 200;
    }
    
    renderHireList();
    renderUpgrades();
    renderOffice();
    startGameLoop();
    setupEventListeners();
}

function setupEventListeners() {
    els.expandBtn.addEventListener('click', expandOffice);
    els.founderBtn.addEventListener('click', doFounderWork); // Changed from startSequenceGame
    els.closeSeqBtn.addEventListener('click', closeSequenceGame);
    
    // Tabs
    els.btnTabHire.addEventListener('click', () => switchMgmtTab('hire'));
    els.btnTabUpgrades.addEventListener('click', () => switchMgmtTab('upgrades'));

    // Employee Detail
    els.btnCloseDetail.addEventListener('click', closeEmployeeDetail);
    els.btnTrain.addEventListener('click', trainSelectedEmployee);
    els.btnFire.addEventListener('click', fireSelectedEmployee);

    // Active Skills
    els.btnViral.addEventListener('click', triggerViral);
    els.btnCrunch.addEventListener('click', toggleCrunch);
    els.ipoBtn.addEventListener('click', triggerIPO);

    // Sequence Game Buttons
    document.querySelectorAll('.seq-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSeqInput(btn.dataset.color));
    });
}

// Core Loop
function startGameLoop() {
    setInterval(() => {
        tick();
        updateUI();
    }, 100); // 10 ticks per second
    
    setInterval(saveGame, 10000);
}

function tick() {
    const prestigeMult = 1 + (state.prestige * 0.5); // 50% bonus per prestige level
    const crunchMult = state.crunchMode ? 2 : 1;
    const crunchDrain = state.crunchMode ? 3 : 1;

    // Modifiers from Upgrades
    const energyDecayMod = state.upgrades.includes('coffee_1') ? 0.8 : 1.0;
    const bugChanceMod = state.upgrades.includes('chairs_1') ? 0.7 : 1.0;
    const outputMod = state.upgrades.includes('server_1') ? 1.25 : 1.0;
    const managerMod = state.upgrades.includes('slack_1') ? 2 : 1;

    // Viral Cooldown
    if (state.viralCooldown > 0) state.viralCooldown -= 100;

    state.employees.forEach(emp => {
        if (emp.status === 'sleeping') return;
        if (emp.status === 'bug') return;

        const type = employeeTypes[emp.type];
        const levelMult = 1 + (emp.level || 0) * 0.5;

        // Energy Decay
        if (type.energyDecay > 0) {
            emp.energy -= type.energyDecay * crunchDrain * energyDecayMod;
            if (emp.energy <= 0) {
                emp.status = 'sleeping';
                renderOfficeSlot(emp.slotIndex);
                return;
            }
        }

        // Production
        if (Math.random() < 0.1 * crunchMult) { // 10% chance per tick
            if (type.type === 'code') {
                const production = type.output * levelMult * outputMod * prestigeMult;
                state.users += production;
                
                // Bug Chance
                if (Math.random() < 0.05 * bugChanceMod && emp.type !== 'senior' && emp.type !== 'ai') {
                    emp.status = 'bug';
                    renderOfficeSlot(emp.slotIndex);
                }
            } else if (type.type === 'sales') {
                // Convert users to cash
                if (state.users > 0) {
                    const capacity = type.output * levelMult * outputMod * prestigeMult;
                    const converted = Math.min(state.users, capacity);
                    state.users -= converted;
                    state.cash += converted * 5 * prestigeMult; // Buffed from 2 to 5
                    
                    // Visual feedback for sales occasionally
                    if (Math.random() < 0.05) {
                        const slot = document.getElementById(`slot-${emp.slotIndex}`);
                        if(slot) {
                            const rect = slot.getBoundingClientRect();
                            createParticle(rect.left + 20, rect.top, `+$${Math.floor(converted * 5)}`);
                        }
                    }
                }
            }
        }
        
        // Manager Logic
        if (type.type === 'support') {
            // Wake up random sleeper
            if (Math.random() < 0.05 * managerMod) {
                const sleeper = state.employees.find(e => e.status === 'sleeping');
                if (sleeper) wakeEmployee(sleeper);
            }
        }
    });
}

// Management UI
function switchMgmtTab(tab) {
    if (tab === 'hire') {
        els.mgmtHire.classList.remove('hidden');
        els.mgmtUpgrades.classList.add('hidden');
        
        // Active Hire Tab
        els.btnTabHire.classList.add('text-blue-400', 'border-b-2', 'border-blue-400');
        els.btnTabHire.classList.remove('text-gray-400', 'hover:text-white');
        
        // Inactive Upgrades Tab
        els.btnTabUpgrades.classList.remove('text-blue-400', 'border-b-2', 'border-blue-400');
        els.btnTabUpgrades.classList.add('text-gray-400', 'hover:text-white');
    } else {
        els.mgmtHire.classList.add('hidden');
        els.mgmtUpgrades.classList.remove('hidden');
        
        // Inactive Hire Tab
        els.btnTabHire.classList.remove('text-blue-400', 'border-b-2', 'border-blue-400');
        els.btnTabHire.classList.add('text-gray-400', 'hover:text-white');
        
        // Active Upgrades Tab
        els.btnTabUpgrades.classList.add('text-blue-400', 'border-b-2', 'border-blue-400');
        els.btnTabUpgrades.classList.remove('text-gray-400', 'hover:text-white');
    }
}

function hireEmployee(typeKey) {
    const type = employeeTypes[typeKey];
    if (state.cash < type.cost) return;
    
    const config = officeConfig[state.officeLevel];
    if (state.employees.length >= config.slots) {
        alert("Office full! Expand first.");
        return;
    }

    state.cash -= type.cost;
    
    // Find first empty slot
    let slotIndex = 0;
    const occupiedSlots = state.employees.map(e => e.slotIndex);
    while (occupiedSlots.includes(slotIndex)) slotIndex++;

    state.employees.push({
        id: Date.now() + Math.random(),
        type: typeKey,
        slotIndex: slotIndex,
        status: 'working',
        energy: 100,
        level: 0
    });

    renderOffice();
    updateUI();
}

function buyUpgrade(id) {
    if (state.upgrades.includes(id)) return;
    const upgrade = UPGRADES.find(u => u.id === id);
    if (state.cash < upgrade.cost) return;

    state.cash -= upgrade.cost;
    state.upgrades.push(id);
    renderUpgrades();
    updateUI();
    createParticle(window.innerWidth/2, window.innerHeight/2, `${upgrade.name} Acquired!`);
}

// Employee Interaction
function handleSlotClick(emp) {
    if (emp.status === 'sleeping') {
        wakeEmployee(emp);
    } else if (emp.status === 'bug') {
        fixBug(emp);
    } else {
        openEmployeeDetail(emp);
    }
}

function wakeEmployee(emp) {
    emp.status = 'working';
    emp.energy = 100;
    createParticle(event?.clientX || window.innerWidth/2, event?.clientY || window.innerHeight/2, "Woke up!");
    renderOfficeSlot(emp.slotIndex);
}

function fixBug(emp) {
    emp.status = 'working';
    state.cash += 50;
    createParticle(event?.clientX || window.innerWidth/2, event?.clientY || window.innerHeight/2, "Bug Fixed! +$50");
    renderOfficeSlot(emp.slotIndex);
}

function openEmployeeDetail(emp) {
    state.selectedEmployeeId = emp.id;
    const type = employeeTypes[emp.type];
    
    els.empDetailName.innerText = `${type.name} (Lvl ${emp.level || 0})`;
    els.empDetailRole.innerText = type.desc;
    
    const trainCost = Math.floor(type.cost * (1 + (emp.level || 0)));
    els.btnTrain.innerText = `Train ($${formatNumber(trainCost)})`;
    
    els.viewEmployee.classList.remove('hidden');
}

function closeEmployeeDetail() {
    els.viewEmployee.classList.add('hidden');
    state.selectedEmployeeId = null;
}

function trainSelectedEmployee() {
    const emp = state.employees.find(e => e.id === state.selectedEmployeeId);
    if (!emp) return;
    
    const type = employeeTypes[emp.type];
    const trainCost = Math.floor(type.cost * (1 + (emp.level || 0)));
    
    if (state.cash >= trainCost) {
        state.cash -= trainCost;
        emp.level = (emp.level || 0) + 1;
        createParticle(window.innerWidth/2, window.innerHeight/2, "Level Up!");
        openEmployeeDetail(emp); // Refresh UI
        renderOfficeSlot(emp.slotIndex);
    }
}

function fireSelectedEmployee() {
    const emp = state.employees.find(e => e.id === state.selectedEmployeeId);
    if (!emp) return;
    
    if (confirm("Are you sure you want to fire this employee?")) {
        state.employees = state.employees.filter(e => e.id !== emp.id);
        closeEmployeeDetail();
        renderOffice();
    }
}

// Active Skills
function toggleCrunch() {
    state.crunchMode = !state.crunchMode;
    if (state.crunchMode) {
        document.body.classList.add('crunch-mode');
        els.btnCrunch.classList.add('bg-red-600', 'animate-pulse');
        els.btnCrunch.innerText = "STOP CRUNCH";
    } else {
        document.body.classList.remove('crunch-mode');
        els.btnCrunch.classList.remove('bg-red-600', 'animate-pulse');
        els.btnCrunch.innerText = "CRUNCH MODE";
    }
}

function triggerViral() {
    if (state.viralCooldown > 0) return;
    
    const cost = 1000 * (state.officeLevel);
    if (state.cash >= cost) {
        state.cash -= cost;
        state.viralCooldown = 30000; // 30s cooldown
        
        const viralUsers = 1000 * state.officeLevel * (1 + state.prestige);
        state.users += viralUsers;
        createParticle(window.innerWidth/2, window.innerHeight/2, `VIRAL! +${formatNumber(viralUsers)} Users`);
    }
}

function triggerIPO() {
    if (state.valuation < 1000000) {
        alert("Need $1M Valuation to IPO!");
        return;
    }
    
    if (confirm("IPO will reset your office, employees, and cash, but you will keep Prestige Multipliers. Do it?")) {
        state.prestige++;
        state.cash = 1000; // Seed money
        state.users = 0;
        state.officeLevel = 1;
        state.employees = [];
        state.upgrades = [];
        state.day = 1;
        state.valuation = 0;
        
        saveGame();
        location.reload();
    }
}

// Rendering
function renderOffice() {
    const config = officeConfig[state.officeLevel];
    els.officeGrid.style.gridTemplateColumns = state.officeLevel >= 3 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)';
    els.officeGrid.innerHTML = '';

    for (let i = 0; i < config.slots; i++) {
        const slot = document.createElement('div');
        slot.className = 'office-slot';
        slot.id = `slot-${i}`;
        
        const emp = state.employees.find(e => e.slotIndex === i);
        if (emp) {
            slot.classList.add('occupied');
            renderEmployeeInSlot(slot, emp);
        } else {
            slot.innerHTML = `<div class="text-gray-600 text-xs">Empty Desk</div>`;
        }
        
        els.officeGrid.appendChild(slot);
    }
    
    // Update Header
    els.officeName.innerText = config.name;
    els.slotsUsed.innerText = state.employees.length;
    els.slotsTotal.innerText = config.slots;
    
    // Update Expand Button
    const nextConfig = officeConfig[state.officeLevel + 1];
    if (nextConfig) {
        els.expandBtn.innerText = `Expand to ${nextConfig.name} ($${formatNumber(nextConfig.cost)})`;
        els.expandBtn.disabled = state.cash < nextConfig.cost;
    } else {
        els.expandBtn.innerText = "Max Expansion Reached";
        els.expandBtn.disabled = true;
    }
}

function renderOfficeSlot(index) {
    const slot = document.getElementById(`slot-${index}`);
    if (!slot) return;
    
    const emp = state.employees.find(e => e.slotIndex === index);
    if (emp) {
        slot.innerHTML = ''; // Clear
        renderEmployeeInSlot(slot, emp);
    }
}

function renderEmployeeInSlot(slot, emp) {
    const type = employeeTypes[emp.type];
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.className = `employee-avatar ${emp.status}`;
    avatar.innerText = type.icon;
    slot.appendChild(avatar);
    
    // Level Badge
    if (emp.level > 0) {
        const lvl = document.createElement('div');
        lvl.className = 'absolute top-0 right-0 bg-yellow-500 text-black text-[10px] px-1 rounded-full font-bold';
        lvl.innerText = `L${emp.level}`;
        slot.appendChild(lvl);
    }
    
    // Status Icon
    if (emp.status === 'sleeping') {
        const badge = document.createElement('div');
        badge.className = 'status-indicator status-zzz';
        badge.innerText = '💤';
        slot.appendChild(badge);
    } else if (emp.status === 'bug') {
        const badge = document.createElement('div');
        badge.className = 'status-indicator status-bug';
        badge.innerText = '🐛';
        slot.appendChild(badge);
    }
    
    slot.onclick = () => handleSlotClick(emp);
}

function renderHireList() {
    els.hireList.innerHTML = '';
    Object.keys(employeeTypes).forEach(key => {
        const type = employeeTypes[key];
        const card = document.createElement('div');
        card.className = 'hire-card';
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-2xl">${type.icon}</div>
                <div>
                    <div class="font-bold text-sm text-gray-200">${type.name}</div>
                    <div class="text-[10px] text-gray-500">${type.desc}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-green-400 font-bold text-sm">$${type.cost}</div>
                <div class="text-[10px] text-blue-400">Out: ${type.output}</div>
            </div>
        `;
        card.onclick = () => hireEmployee(key);
        els.hireList.appendChild(card);
    });
}

function renderUpgrades() {
    els.upgradesList.innerHTML = '';
    UPGRADES.forEach(upg => {
        const card = document.createElement('div');
        card.className = `upgrade-card ${state.upgrades.includes(upg.id) ? 'owned' : ''}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <div class="flex items-center gap-2">
                    <span class="text-xl">${upg.icon}</span>
                    <span class="font-bold text-sm">${upg.name}</span>
                </div>
                <span class="text-green-400 text-xs font-bold">${state.upgrades.includes(upg.id) ? 'OWNED' : '$' + formatNumber(upg.cost)}</span>
            </div>
            <div class="text-[10px] text-gray-400">${upg.desc}</div>
        `;
        if (!state.upgrades.includes(upg.id)) {
            card.onclick = () => buyUpgrade(upg.id);
        }
        els.upgradesList.appendChild(card);
    });
}

function expandOffice() {
    const nextLevel = state.officeLevel + 1;
    const config = officeConfig[nextLevel];
    if (!config) return;
    
    if (state.cash >= config.cost) {
        state.cash -= config.cost;
        state.officeLevel = nextLevel;
        renderOffice();
        updateUI();
    }
}

// Founder Actions
function doFounderWork() {
    // Base click value
    const clickValue = 10 * (1 + state.prestige);
    const userValue = 5 * (1 + state.prestige);
    
    state.cash += clickValue;
    state.users += userValue;
    
    createParticle(event?.clientX, event?.clientY, `+$${clickValue}`);
    
    // 5% Chance to trigger "Major Feature" (Sequence Game)
    if (Math.random() < 0.05 && !seqState.active) {
        startSequenceGame();
    }
    
    updateUI();
}

// Sequence Mini-Game (Memory/Manual Work)
let seqState = {
    active: false,
    sequence: [],
    input: [],
    level: 1
};

const colors = ['red', 'blue', 'green', 'yellow'];

function startSequenceGame() {
    seqState.active = true;
    seqState.level = 1;
    els.seqOverlay.classList.remove('hidden');
    playRound();
}

function playRound() {
    seqState.sequence = [];
    seqState.input = [];
    
    // Generate sequence based on level
    for(let i=0; i<seqState.level + 2; i++) {
        seqState.sequence.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    
    els.seqStatus.innerText = `Level ${seqState.level}: Watch...`;
    els.seqStatus.className = "h-8 text-lg font-bold text-blue-400";
    
    // Play sequence
    let i = 0;
    const interval = setInterval(() => {
        if (i >= seqState.sequence.length) {
            clearInterval(interval);
            els.seqStatus.innerText = "YOUR TURN!";
            els.seqStatus.className = "h-8 text-lg font-bold text-green-400 animate-pulse";
            return;
        }
        
        const color = seqState.sequence[i];
        const btn = document.querySelector(`.seq-btn[data-color="${color}"]`);
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 300);
        
        i++;
    }, 600);
}

function handleSeqInput(color) {
    if (!seqState.active || els.seqStatus.innerText.includes('Watch')) return;
    
    // Visual feedback
    const btn = document.querySelector(`.seq-btn[data-color="${color}"]`);
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 100);
    
    seqState.input.push(color);
    
    // Check correctness
    const currentIndex = seqState.input.length - 1;
    if (seqState.input[currentIndex] !== seqState.sequence[currentIndex]) {
        // Fail
        els.seqStatus.innerText = "WRONG! BUG CREATED.";
        els.seqStatus.className = "h-8 text-lg font-bold text-red-500";
        state.users = Math.max(0, state.users - 50); // Penalty
        setTimeout(closeSequenceGame, 1000);
    } else {
        // Correct so far
        if (seqState.input.length === seqState.sequence.length) {
            // Round Complete
            const reward = seqState.level * 100;
            state.cash += reward;
            createParticle(window.innerWidth/2, window.innerHeight/2, `Feature Shipped! +$${reward}`);
            
            seqState.level++;
            setTimeout(playRound, 1000);
        }
    }
}

function closeSequenceGame() {
    seqState.active = false;
    els.seqOverlay.classList.add('hidden');
}

// Utils
function updateUI() {
    if(els.cash) els.cash.innerText = formatNumber(state.cash);
    if(els.users) els.users.innerText = formatNumber(state.users);
    
    // Valuation Logic
    state.valuation = (state.users * 10) + (state.cash) + (state.employees.length * 1000);
    
    // Update Hire Card States
    document.querySelectorAll('.hire-card').forEach(card => {
        const cost = parseInt(card.querySelector('.text-green-400').innerText.replace('$',''));
        if (state.cash < cost) card.classList.add('disabled');
        else card.classList.remove('disabled');
    });

    // Update Upgrade Card States
    document.querySelectorAll('.upgrade-card').forEach(card => {
        if (card.classList.contains('owned')) return;
        const costText = card.querySelector('.text-green-400').innerText;
        const cost = parseInt(costText.replace('$','').replace(',',''));
        if (state.cash < cost) card.classList.add('disabled');
        else card.classList.remove('disabled');
    });

    // Viral Button
    if (state.viralCooldown > 0) {
        els.btnViral.disabled = true;
        els.btnViral.innerText = `Viral (${Math.ceil(state.viralCooldown/1000)}s)`;
        els.btnViral.classList.add('opacity-50');
    } else {
        els.btnViral.disabled = false;
        els.btnViral.innerText = "GO VIRAL ($1k)";
        els.btnViral.classList.remove('opacity-50');
    }

    // IPO Button
    if (state.valuation >= 1000000) {
        els.ipoBtn.classList.remove('hidden');
        els.ipoBtn.innerText = `IPO (Val: $${formatNumber(state.valuation)})`;
    } else {
        els.ipoBtn.classList.add('hidden');
    }
    
    updateAdvisor();
}

function updateAdvisor() {
    if (!els.advisorMsg) return;
    
    const sales = state.employees.filter(e => employeeTypes[e.type].type === 'sales').length;
    const devs = state.employees.filter(e => employeeTypes[e.type].type === 'code').length;
    const sleepers = state.employees.filter(e => e.status === 'sleeping').length;
    
    let msg = "Keep growing! Click 'Hustle' for quick cash.";
    
    if (state.cash < 50 && state.users < 100) {
        msg = "Click 'HUSTLE' to earn your first dollars!";
    } else if (state.users > 500 && sales === 0) {
        msg = "⚠️ We have Users but no Revenue! Hire Sales Bros!";
    } else if (state.cash > 1000 && state.officeLevel === 1) {
        msg = "We're rich! Expand the office to hire more staff.";
    } else if (sleepers > 2) {
        msg = "Everyone is asleep! Hire a Manager or click them to wake up.";
    } else if (state.users > 10000 && state.valuation < 50000) {
        msg = "Monetize! We need more Sales staff to convert these users.";
    } else if (state.crunchMode) {
        msg = "🔥 CRUNCH MODE ACTIVE! Watch energy levels!";
    }
    
    els.advisorMsg.innerText = msg;
}

function createParticle(x, y, text) {
    const el = document.createElement('div');
    el.className = 'particle text-green-400';
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    els.particles.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}

function saveGame() {
    localStorage.setItem('unicornTycoonV2', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('unicornTycoonV2');
    if (saved) Object.assign(state, JSON.parse(saved));
}

document.addEventListener('DOMContentLoaded', init);
