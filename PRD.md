# Product Requirements Document (PRD): "The Unicorn Founder" - 4ourmedia Game (v2.0)

## 1. Executive Summary
Transform the 4ourmedia website into a highly addictive, "10x better" incremental clicker game. The goal is to simulate the high-stakes world of modern entrepreneurship with deep mechanics, polished UI/UX, and viral loops.

## 2. Game Mechanics (Enhanced)
### Core Loop
1.  **The Grind (Active):** Click to write code/emails. Generates Cash.
2.  **The Scale (Passive):** Hire employees and buy SaaS tools to generate MRR (Cash/sec).
3.  **The Exit (Prestige):** Sell the company to reset progress but gain **Equity**. Equity provides a permanent multiplier to all future income.

### New Features
*   **Prestige System:** "Exit Strategy". Reset game to gain "Equity" (Multiplier).
*   **Skill Tree:** Spend Equity to unlock permanent perks (e.g., "Cheaper Ads", "Better AI").
*   **Managers:** Auto-clickers that click for you.
*   **Achievements:** Milestones that provide cash bonuses.
*   **Dynamic Events:** "Server Crash", "Viral Tweet", "TechCrunch Feature".

## 3. User Interface (UI) - Mobile First
*   **Responsive Design:**
    *   **Desktop:** 3-Column Dashboard (Stats | Action | Upgrades).
    *   **Mobile:** Bottom Navigation Bar (Home | Upgrades | Staff | Profile).
*   **Visual Juice:** Particle effects on clicks, floating numbers, progress bars.
*   **Branding:** "A 4ourmedia Game".
*   **Footer:** Dynamic copyright, contact email, link to David J. Woodbury.

## 4. Technical Architecture
*   **Storage:** `localStorage` with LZString compression (optional) or just JSON.
*   **Loop:** `requestAnimationFrame` for smooth rendering.
*   **Responsiveness:** CSS Grid/Flexbox with Media Queries.

## 5. Implementation Plan
*   **Phase 1: UI Overhaul:** Implement mobile tabs and responsive grid.
*   **Phase 2: Deep Logic:** Add Prestige and Achievements.
*   **Phase 3: Polish:** Add particle effects and better tooltips.
