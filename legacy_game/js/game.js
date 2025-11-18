// Game State
const state = {
    cash: 100,
    users: 0,
    day: 1,
    phase: "Garage Startup",
    officeLevel: 1,
    employees: [],
    upgrades: [],
    achievements: [],
    startTime: Date.now(),
    crunchMode: false,
    viralCooldown: 0,
    prestige: 0,
    valuation: 0,
    // New RPG State
    player: { x: 5, y: 5, dir: 'down', moving: false, level: 1, xp: 0, nextLevel: 100 },
    map: 'garage',
    dialogOpen: false,
    storyIndex: 0,
    objective: "Write Code (Press Z at PC)"
};

// Story & Missions
const STORY_EVENTS = [
    {
        id: 0,
        condition: (s) => true, // Start
        text: "MOM: 'Stop playing video games and get a real job!'\nYOU: 'I'm building a startup, Mom! It's gonna be huge!'\nMOM: 'Fine. You have 30 days to make $100 or you're moving out.'",
        objective: "Earn $100 Cash",
        trigger: () => {}
    },
    {
        id: 1,
        condition: (s) => s.cash >= 100,
        text: "MOM: 'Wow, $100? Maybe you're not useless.'\nYOU: 'This is just the beginning. I need help though.'",
        objective: "Hire an Intern (Cost: $50)",
        trigger: () => { state.xp += 50; }
    },
    {
        id: 2,
        condition: (s) => s.employees.length > 0,
        text: "INTERN: 'Uh, boss? Where do I sit?'\nYOU: 'Anywhere. Just start coding.'\nINTERN: 'I need coffee...'",
        objective: "Reach 100 Users",
        trigger: () => { state.xp += 100; }
    },
    {
        id: 3,
        condition: (s) => s.users >= 100,
        text: "INVESTOR: 'I see you have some traction. 100 users is cute.'\nYOU: 'We're growing fast!'\nINVESTOR: 'Prove it. Get 500 users and I'll give you a seed round.'",
        objective: "Reach 500 Users",
        trigger: () => { state.cash += 500; }
    },
    {
        id: 4,
        condition: (s) => s.users >= 500,
        text: "INVESTOR: 'Not bad. Here's $1,000. Get a real office.'\nYOU: 'Goodbye Garage!'",
        objective: "Expand Office (Door -> Expand)",
        trigger: () => { state.cash += 1000; }
    },
    {
        id: 5,
        condition: (s) => state.officeLevel > 1,
        text: "RIVAL CEO: 'Heard you moved into the incubator. Don't get comfortable. My app 'Bark' is crushing you.'",
        objective: "Hire a Sales Bro",
        trigger: () => { state.xp += 500; }
    },
    {
        id: 6,
        condition: (s) => s.employees.some(e => e.type === 'sales'),
        text: "SALES BRO: 'Yo boss, let's monetize this! I can turn users into cash, but I need users to burn!'",
        objective: "Reach $5,000 Cash",
        trigger: () => {}
    },
    {
        id: 7,
        condition: (s) => s.cash >= 5000,
        text: "RIVAL CEO: 'Cute revenue. But do you have a unicorn valuation? I think not.'",
        objective: "Reach 10,000 Users",
        trigger: () => {}
    }
];

// Configuration
const officeConfig = {
    1: { name: "Garage HQ", slots: 2, cost: 0, map: 'garage' },
    2: { name: "Seed Office", slots: 4, cost: 1000, map: 'office_small' },
    3: { name: "Tech Park", slots: 8, cost: 10000, map: 'office_medium' },
    4: { name: "Skyscraper", slots: 16, cost: 100000, map: 'office_large' }
};

const employeeTypes = {
    'intern': { name: "Intern", cost: 50, output: 1, type: 'code', icon: '👶', color: '#88cc88' },
    'junior': { name: "Junior Dev", cost: 250, output: 5, type: 'code', icon: '💻', color: '#306230' },
    'senior': { name: "Senior Dev", cost: 1000, output: 20, type: 'code', icon: '🧙‍♂️', color: '#0f380f' },
    'sales': { name: "Sales Bro", cost: 500, output: 2, type: 'sales', icon: '🤝', color: '#9bbc0f' },
    'manager': { name: "Manager", cost: 2000, output: 0, type: 'support', icon: '👔', color: '#000000' }
};

// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const TILE_SIZE = 32;
const VIEW_WIDTH = 20;
const VIEW_HEIGHT = 15;

// Maps (0=Floor, 1=Wall, 2=Desk, 3=Door, 4=Computer, 5=Vending Machine)
const MAPS = {
    'garage': [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1]
    ],
    'office_small': [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,2,0,2,0,2,0,2,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1]
    ]
};

// DOM Elements
const els = {
    cash: document.getElementById('cash-display'),
    users: document.getElementById('users-display'),
    day: document.getElementById('day-display'),
    dialog: document.getElementById('dialog-box'),
    dialogText: document.getElementById('dialog-text'),
    dialogOptions: document.getElementById('dialog-options'),
    objective: document.getElementById('objective-display')
};

// Input Handling
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if(state.dialogOpen) handleDialogInput(e.key);
});
window.addEventListener('keyup', e => keys[e.key] = false);

// Mobile Controls
document.querySelectorAll('.d-pad div').forEach(el => {
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[el.dataset.key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); keys[el.dataset.key] = false; });
});
document.querySelectorAll('.action-btns div').forEach(el => {
    el.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        if(el.dataset.key === 'z') interact();
        if(el.dataset.key === 'x') closeDialog();
    });
});

// Initialization
function init() {
    if(localStorage.getItem('unicornTycoonV3')) {
        const saved = JSON.parse(localStorage.getItem('unicornTycoonV3'));
        Object.assign(state, saved);
    }
    
    // Start Loops
    requestAnimationFrame(gameLoop);
    setInterval(businessTick, 100);
    setInterval(checkStory, 1000);
    setInterval(saveGame, 5000);
}

// Game Loop (Rendering & Input)
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function checkStory() {
    const event = STORY_EVENTS[state.storyIndex];
    if (event && event.condition(state)) {
        showDialog("STORY EVENT", event.text, [{
            text: "Let's Go!",
            action: () => {
                event.trigger();
                state.storyIndex++;
                state.objective = STORY_EVENTS[state.storyIndex] ? STORY_EVENTS[state.storyIndex].objective : "Free Play: Become a Unicorn!";
                if(els.objective) els.objective.innerText = "GOAL: " + state.objective;
                closeDialog();
            }
        }]);
    }
}

function update() {
    if (state.dialogOpen) return;

    let dx = 0;
    let dy = 0;

    if (keys['ArrowUp']) dy = -1;
    else if (keys['ArrowDown']) dy = 1;
    else if (keys['ArrowLeft']) dx = -1;
    else if (keys['ArrowRight']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        // Simple grid movement (no smooth animation for now to keep it retro/snappy)
        // Add delay to prevent super speed
        if (!state.player.moving) {
            const newX = state.player.x + dx;
            const newY = state.player.y + dy;
            
            if (!isSolid(newX, newY)) {
                state.player.x = newX;
                state.player.y = newY;
                state.player.moving = true;
                setTimeout(() => state.player.moving = false, 150);
            }
        }
    }

    if (keys['z'] || keys['Enter']) {
        if (!state.player.interacting) {
            interact();
            state.player.interacting = true;
            setTimeout(() => state.player.interacting = false, 300);
        }
    }
}

function isSolid(x, y) {
    const map = MAPS[state.map] || MAPS['garage'];
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return true;
    const tile = map[y][x];
    return tile === 1 || tile === 2 || tile === 4 || tile === 5; // Walls, Desks, Computers are solid
}

function interact() {
    const map = MAPS[state.map] || MAPS['garage'];
    // Check tile in front of player
    // Simplified: Check current tile or neighbors
    // Actually, let's check neighbors based on last move or just all neighbors
    
    const neighbors = [
        {x: state.player.x, y: state.player.y - 1},
        {x: state.player.x, y: state.player.y + 1},
        {x: state.player.x - 1, y: state.player.y},
        {x: state.player.x + 1, y: state.player.y}
    ];

    for (let pos of neighbors) {
        if (pos.y >= 0 && pos.y < map.length && pos.x >= 0 && pos.x < map[0].length) {
            const tile = map[pos.y][pos.x];
            if (tile === 4) { // Computer
                showDialog("Founder's PC", "What do you want to do?", [
                    { text: "Code Feature (Hustle)", action: () => doFounderWork() },
                    { text: "Check Email", action: () => showDialog("Email", "Spam... Spam... Investor offer... Spam.") }
                ]);
                return;
            }
            if (tile === 2) { // Desk
                // Check if occupied
                const emp = state.employees.find(e => e.x === pos.x && e.y === pos.y);
                if (emp) {
                    showDialog(employeeTypes[emp.type].name, "I'm working hard boss!", [
                        { text: "Train ($500)", action: () => trainEmployee(emp) },
                        { text: "Fire", action: () => fireEmployee(emp) }
                    ]);
                } else {
                    showDialog("Empty Desk", "Hire someone?", [
                        { text: "Hire Intern ($50)", action: () => hireEmployee('intern', pos.x, pos.y) },
                        { text: "Hire Junior ($250)", action: () => hireEmployee('junior', pos.x, pos.y) },
                        { text: "Hire Sales ($500)", action: () => hireEmployee('sales', pos.x, pos.y) }
                    ]);
                }
                return;
            }
            if (tile === 3) { // Door
                showDialog("Exit", "Expand Office?", [
                    { text: "Expand ($1000)", action: () => expandOffice() },
                    { text: "Cancel", action: () => closeDialog() }
                ]);
                return;
            }
            if (tile === 5) { // Vending Machine
                showDialog("Vending Machine", "Buy Upgrades?", [
                    { text: "Coffee ($500)", action: () => buyUpgrade('coffee_1') },
                    { text: "Cancel", action: () => closeDialog() }
                ]);
                return;
            }
        }
    }
}

// Drawing
function draw() {
    // Clear
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const map = MAPS[state.map] || MAPS['garage'];

    // Draw Map
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile === 0) { // Floor
                ctx.fillStyle = '#0f380f'; // Dark Green
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#306230';
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile === 1) { // Wall
                ctx.fillStyle = '#306230'; // Mid Green
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Brick pattern
                ctx.fillStyle = '#0f380f';
                ctx.fillRect(px + 2, py + 2, 28, 12);
                ctx.fillRect(px + 2, py + 18, 28, 12);
            } else if (tile === 2) { // Desk
                ctx.fillStyle = '#8b4513'; // Brownish
                ctx.fillRect(px + 4, py + 8, 24, 20);
            } else if (tile === 3) { // Door
                ctx.fillStyle = '#000';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile === 4) { // Computer
                ctx.fillStyle = '#888';
                ctx.fillRect(px + 8, py + 8, 16, 16);
                ctx.fillStyle = '#0f380f';
                ctx.fillRect(px + 10, py + 10, 12, 10); // Screen
            } else if (tile === 5) { // Vending
                ctx.fillStyle = '#a00';
                ctx.fillRect(px + 4, py + 4, 24, 28);
            }
        }
    }

    // Draw Employees
    state.employees.forEach(emp => {
        const px = emp.x * TILE_SIZE;
        const py = emp.y * TILE_SIZE;
        const type = employeeTypes[emp.type];
        
        // Body
        ctx.fillStyle = type.color;
        ctx.fillRect(px + 8, py + 4, 16, 24);
        // Head
        ctx.fillStyle = '#ffe0bd';
        ctx.fillRect(px + 10, py, 12, 10);
        
        // ZZZ if sleeping
        if (emp.status === 'sleeping') {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText('Z', px + 20, py);
        }
    });

    // Draw Player
    const px = state.player.x * TILE_SIZE;
    const py = state.player.y * TILE_SIZE;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 28, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Red Shirt)
    ctx.fillStyle = '#d04648';
    ctx.fillRect(px + 8, py + 12, 16, 16);
    
    // Head
    ctx.fillStyle = '#ffe0bd';
    ctx.fillRect(px + 8, py + 2, 16, 14);
    
    // Hat (Blue Cap)
    ctx.fillStyle = '#597dce';
    ctx.fillRect(px + 6, py, 20, 6);
    ctx.fillRect(px + 6, py, 4, 8); // Brim

    // Draw Level/XP Bar above player
    ctx.fillStyle = '#000';
    ctx.fillRect(px, py - 10, 32, 4);
    ctx.fillStyle = '#4ade80';
    const xpPct = state.player.xp / state.player.nextLevel;
    ctx.fillRect(px, py - 10, 32 * xpPct, 4);

    // UI Updates
    els.cash.innerText = Math.floor(state.cash);
    els.users.innerText = Math.floor(state.users);
    els.day.innerText = state.day;
}

// Business Logic (Background)
function businessTick() {
    state.employees.forEach(emp => {
        if (emp.status === 'sleeping') return;
        
        const type = employeeTypes[emp.type];
        
        // Energy
        emp.energy -= type.energyDecay || 0.01;
        if (emp.energy <= 0) emp.status = 'sleeping';

        // Work
        if (Math.random() < 0.1) {
            if (type.type === 'code') state.users += type.output;
            if (type.type === 'sales') {
                if (state.users > 0) {
                    state.users--;
                    state.cash += 5;
                }
            }
        }
    });
}

// Actions
function doFounderWork() {
    // Leveling Logic
    const xpGain = 10;
    state.player.xp += xpGain;
    if (state.player.xp >= state.player.nextLevel) {
        state.player.level++;
        state.player.xp = 0;
        state.player.nextLevel = Math.floor(state.player.nextLevel * 1.5);
        showDialog("LEVEL UP!", `You are now Level ${state.player.level}! Coding speed increased.`);
    }

    const levelMult = state.player.level;
    state.cash += 10 * levelMult;
    state.users += 5 * levelMult;
    
    closeDialog();
}

function hireEmployee(type, x, y) {
    const cost = employeeTypes[type].cost;
    if (state.cash >= cost) {
        state.cash -= cost;
        state.employees.push({
            id: Date.now(),
            type: type,
            x: x,
            y: y,
            status: 'working',
            energy: 100
        });
        closeDialog();
    } else {
        showDialog("HR", "Not enough cash!");
    }
}

function expandOffice() {
    if (state.cash >= 1000) {
        state.cash -= 1000;
        state.officeLevel++;
        state.map = 'office_small'; // Switch map
        closeDialog();
    } else {
        showDialog("Construction", "Need $1000 to expand.");
    }
}

// Dialog System
function showDialog(title, text, options = []) {
    state.dialogOpen = true;
    els.dialog.classList.remove('hidden');
    els.dialogText.innerHTML = `<strong style="color:#fff">${title}:</strong><br>${text}`;
    els.dialogOptions.innerHTML = '';
    
    if (options.length > 0) {
        options.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'dialog-option';
            div.innerText = `> ${opt.text}`;
            div.onclick = opt.action;
            els.dialogOptions.appendChild(div);
        });
    } else {
        const div = document.createElement('div');
        div.className = 'dialog-option';
        div.innerText = '> OK';
        div.onclick = closeDialog;
        els.dialogOptions.appendChild(div);
    }
}

function closeDialog() {
    state.dialogOpen = false;
    els.dialog.classList.add('hidden');
}

function handleDialogInput(key) {
    // Simple keyboard navigation for dialogs could go here
    if (key === 'z' || key === 'Enter') {
        // Select first option for now
        const opts = document.querySelectorAll('.dialog-option');
        if(opts.length > 0) opts[0].click();
    }
    if (key === 'x' || key === 'Escape') {
        closeDialog();
    }
}

function saveGame() {
    localStorage.setItem('unicornTycoonV3', JSON.stringify(state));
}

document.addEventListener('DOMContentLoaded', init);
