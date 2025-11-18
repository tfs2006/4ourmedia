// Game State
const state = {
    cash: 100, // Start with some cash
    users: 0,
    day: 1,
    equity: 0,
    valuation: 0,
    phase: "Garage Startup",
    officeLevel: 1, // 1=Garage (2 slots), 2=Office (4), 3=Campus (8)
    employees: [], // Array of { id, type, slotIndex, status, energy }
    achievements: [],
    startTime: Date.now()
};

// Configuration
const officeConfig = {
    1: { name: "Garage HQ", slots: 2, cost: 0 },
    2: { name: "Seed Office", slots: 4, cost: 1000 },
    3: { name: "Tech Park", slots: 8, cost: 10000 },
    4: { name: "Skyscraper", slots: 16, cost: 100000 }
};

const employeeTypes = {
    'intern': { name: "Intern", cost: 50, output: 1, type: 'code', icon: '👶', energyDecay: 0.05, desc: "Cheap labor. Falls asleep often." },
    'junior': { name: "Junior Dev", cost: 250, output: 5, type: 'code', icon: '💻', energyDecay: 0.02, desc: "Writes code. Creates bugs." },
    'senior': { name: "Senior Dev", cost: 1000, output: 20, type: 'code', icon: '🧙‍♂️', energyDecay: 0.01, desc: "Solid output. Reliable." },
    'sales': { name: "Sales Bro", cost: 500, output: 2, type: 'sales', icon: '🤝', energyDecay: 0.03, desc: "Converts Users to Cash." },
    'manager': { name: "Manager", cost: 2000, output: 0, type: 'support', icon: '👔', energyDecay: 0.01, desc: "Auto-wakes nearby staff." }
};

// DOM Elements
const els = {
    cash: document.getElementById('cash-display'),
    users: document.getElementById('users-display'),
    officeName: document.getElementById('office-name'),
    slotsUsed: document.getElementById('slots-used'),
    slotsTotal: document.getElementById('slots-total'),
    officeGrid: document.getElementById('office-grid'),
    hireList: document.getElementById('hire-list'),
    expandBtn: document.getElementById('expand-btn'),
    founderBtn: document.getElementById('founder-work-btn'),
    // Sequence Game
    seqOverlay: document.getElementById('sequence-overlay'),
    seqDisplay: document.getElementById('sequence-display'),
    seqStatus: document.getElementById('sequence-status'),
    closeSeqBtn: document.getElementById('close-sequence-btn'),
    particles: document.getElementById('particles')
};

// Initialization
function init() {
    // Reset state for new version if needed (simple check)
    if(!localStorage.getItem('unicornTycoonV1')) {
        state.cash = 100;
    } else {
        loadGame();
    }
    
    renderHireList();
    renderOffice();
    startGameLoop();
    
    // Listeners
    els.expandBtn.addEventListener('click', expandOffice);
    els.founderBtn.addEventListener('click', startSequenceGame);
    els.closeSeqBtn.addEventListener('click', closeSequenceGame);
    
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
    
    setInterval(saveGame, 30000);
}

function tick() {
    // Process Employees
    state.employees.forEach(emp => {
        if (emp.status === 'sleeping') return;
        if (emp.status === 'bug') return;

        // Energy Decay
        emp.energy -= employeeTypes[emp.type].energyDecay;
        if (emp.energy <= 0) {
            emp.status = 'sleeping';
            renderOfficeSlot(emp.slotIndex);
            return;
        }

        // Production
        // 10% chance to produce per tick (simulates work speed)
        if (Math.random() < 0.1) {
            if (employeeTypes[emp.type].type === 'code') {
                state.users += employeeTypes[emp.type].output;
                // Chance for bug
                if (Math.random() < 0.05 && emp.type !== 'senior') {
                    emp.status = 'bug';
                    renderOfficeSlot(emp.slotIndex);
                }
            } else if (employeeTypes[emp.type].type === 'sales') {
                // Convert users to cash
                if (state.users > 0) {
                    const converted = Math.min(state.users, employeeTypes[emp.type].output);
                    state.users -= converted;
                    state.cash += converted * 2; // $2 per user
                }
            }
        }
        
        // Manager Logic (Auto-wake)
        if (emp.type === 'manager') {
            // Find neighbors
            // Simplified: Just wake random sleeping person
            const sleeper = state.employees.find(e => e.status === 'sleeping');
            if (sleeper && Math.random() < 0.05) {
                wakeEmployee(sleeper);
            }
        }
    });
}

// Office Management
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
        energy: 100
    });

    renderOffice();
    updateUI();
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

function wakeEmployee(emp) {
    emp.status = 'working';
    emp.energy = 100;
    createParticle(event?.clientX || window.innerWidth/2, event?.clientY || window.innerHeight/2, "Woke up!");
    renderOfficeSlot(emp.slotIndex);
}

function fixBug(emp) {
    emp.status = 'working';
    state.cash += 50; // Bonus for fixing
    createParticle(event?.clientX || window.innerWidth/2, event?.clientY || window.innerHeight/2, "Bug Fixed! +$50");
    renderOfficeSlot(emp.slotIndex);
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
    
    // Status Icon
    if (emp.status === 'sleeping') {
        const badge = document.createElement('div');
        badge.className = 'status-indicator status-zzz';
        badge.innerText = '💤';
        slot.appendChild(badge);
        slot.onclick = () => wakeEmployee(emp);
    } else if (emp.status === 'bug') {
        const badge = document.createElement('div');
        badge.className = 'status-indicator status-bug';
        badge.innerText = '🐛';
        slot.appendChild(badge);
        slot.onclick = () => fixBug(emp);
    } else {
        // Normal click does nothing or shows info?
        slot.onclick = null;
    }
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
                <div class="text-[10px] text-blue-400">Output: ${type.output}</div>
            </div>
        `;
        card.onclick = () => hireEmployee(key);
        els.hireList.appendChild(card);
    });
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
    
    // Update Hire Card States
    document.querySelectorAll('.hire-card').forEach(card => {
        const cost = parseInt(card.querySelector('.text-green-400').innerText.replace('$',''));
        if (state.cash < cost) card.classList.add('disabled');
        else card.classList.remove('disabled');
    });
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
    localStorage.setItem('unicornTycoonV1', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('unicornTycoonV1');
    if (saved) Object.assign(state, JSON.parse(saved));
}

document.addEventListener('DOMContentLoaded', init);
