# CYBER BINGO

A production-grade, configuration-driven, real-time multiplayer Bingo platform with a cybersecurity operations center (SOC) aesthetic.

---

## 🛡️ Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend / Real-time Database**: Cloud Firestore (Enterprise Edition)
- **Authentication**: Firebase Authentication + Multi-Factor Authentication (MFA)
- **Security Rules**: Attribute-Based Access Control (ABAC), Master Gate validation pattern, server-authoritative validations
- **Audio Synthesizer**: Web Audio API cyber sound engine (zero external audio asset dependencies)

---

## 🎮 Key Features

1. **Server-Authoritative Anti-Cheat Gameplay**:
   - Official draws are recorded authoritatively in Cloud Firestore.
   - When a player submits a Bingo claim, the validator verifies that every marked cell in the claimed pattern corresponds to an item already drawn in the official sequence (or a free space).
   - Replays and false claims are rejected and penalized with configurable score deductions.

2. **Configuration-Driven Game Engine (`src/game/`)**:
   - Independent of visual components.
   - Supports 3×3, 4×4, 5×5, 6×6, 7×7 board dimensions.
   - Configurable free spaces, labels, draw intervals, and player limits.
   - Modes: Classic, Blackout, Four Corners, Horizontal, Vertical, Diagonal, X-Mode, Cyber Grid, and Custom Patterns.

3. **Multiplayer Room System**:
   - 6-digit Game PIN generation (e.g. `482913`).
   - Real-time listener synchronization across all connected players.
   - Session recovery: players reconnecting retain their exact card and marked cells.
   - Host Command Console with manual or automated timer-based calling and a "+4 AI Demo Bots" quick-test mechanism.

4. **Visual Pattern Editor**:
   - Interactive 5×5 grid in the Admin Console where administrators click cells to define custom winning shapes (e.g. Diamond, Cyber Shield, Letter Z).

5. **Theme Studio**:
   - Data-driven visual themes (Electric Cyan, Matrix Emerald, Red Alert Incident Response, Quantum Violet) with live interactive card preview.

6. **Content CMS & Question Bank**:
   - Comprehensive repository of core cybersecurity concepts (PHISHING, MFA, ZERO TRUST, FIREWALL, EDR, SIEM, SOC, DDoS, etc.).
   - Cybersecurity trivia challenges for Question Bingo.

7. **Enterprise Admin Console**:
   - Enforced Multi-Factor Authentication challenge.
   - Role-Based Access Control (RBAC): `SUPER_ADMIN`, `GAME_ADMIN`, `CONTENT_ADMIN`, `ANALYTICS_ADMIN`.
   - Bootstrapped admin email: `webdev.cybernetics@gmail.com`.
   - Immutable audit logging for logins, game creations, and mutations.
   - Real-time game analytics and win-pattern distribution.

---

## 🔒 Firestore Collections & Security Structure

- `/users/{userId}`: User profiles
- `/admins/{adminId}`: RBAC administrator privileges
- `/games/{gameId}`: Live game state, versioned configuration snapshot, winner records
- `/games/{gameId}/players/{playerId}`: Connected players, card matrix, marked indices, scores
- `/games/{gameId}/draws/{drawId}`: Authoritative drawn numbers/terms in sequence
- `/games/{gameId}/claims/{claimId}`: Bingo claim submissions and validation audit
- `/games/{gameId}/events/{eventId}`: Live room event feed
- `/content/{contentId}`: Cybersecurity terms CMS
- `/questions/{questionId}`: Question bank items
- `/themes/{themeId}`: Visual styles
- `/winningPatterns/{patternId}`: Custom and system winning patterns
- `/auditLogs/{logId}`: Append-only administrative audit trail
