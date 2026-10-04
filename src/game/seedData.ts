import { CMSContentItem, CMSQuestionItem, WinningPattern, ThemeConfig, GameConfig } from './gameTypes';

export const SEED_CYBER_TERMS: Omit<CMSContentItem, 'id' | 'createdAt'>[] = [
  {
    term: 'PHISHING',
    category: 'Social Engineering',
    description: 'Deceptive emails or messages attempting to trick recipients into revealing sensitive data or credentials.',
    difficulty: 'beginner',
    tags: ['email', 'fraud', 'credentials'],
    active: true,
  },
  {
    term: 'MFA',
    category: 'Authentication',
    description: 'Multi-Factor Authentication requiring two or more distinct verification factors before granting access.',
    difficulty: 'beginner',
    tags: ['auth', 'security', 'identity'],
    active: true,
  },
  {
    term: 'FIREWALL',
    category: 'Network Security',
    description: 'Network device or software filtering incoming and outgoing network traffic based on predefined security rules.',
    difficulty: 'beginner',
    tags: ['network', 'filter', 'perimeter'],
    active: true,
  },
  {
    term: 'RANSOMWARE',
    category: 'Malware',
    description: 'Malicious software that encrypts victim files, demanding payment in exchange for the decryption key.',
    difficulty: 'beginner',
    tags: ['threat', 'encryption', 'extortion'],
    active: true,
  },
  {
    term: 'ZERO TRUST',
    category: 'Architecture',
    description: 'Security model centered on the belief that organizations should not trust anything inside or outside their perimeters.',
    difficulty: 'intermediate',
    tags: ['framework', 'least-privilege', 'identity'],
    active: true,
  },
  {
    term: 'VPN',
    category: 'Network Security',
    description: 'Virtual Private Network that creates an encrypted tunnel across a public network.',
    difficulty: 'beginner',
    tags: ['network', 'privacy', 'encryption'],
    active: true,
  },
  {
    term: 'SIEM',
    category: 'Operations',
    description: 'Security Information and Event Management aggregating and analyzing security log data from across an enterprise.',
    difficulty: 'intermediate',
    tags: ['monitoring', 'logs', 'soc'],
    active: true,
  },
  {
    term: 'SOC',
    category: 'Operations',
    description: 'Security Operations Center staffed by analysts monitoring and neutralizing threats in real time.',
    difficulty: 'beginner',
    tags: ['operations', 'team', 'monitoring'],
    active: true,
  },
  {
    term: 'DDoS',
    category: 'Network Attacks',
    description: 'Distributed Denial of Service overwhelming a server, service, or network with a flood of Internet traffic.',
    difficulty: 'intermediate',
    tags: ['attack', 'availability', 'botnet'],
    active: true,
  },
  {
    term: 'BOTNET',
    category: 'Threats',
    description: 'Network of compromised computers or IoT devices controlled by a command and control server.',
    difficulty: 'intermediate',
    tags: ['zombies', 'c2', 'attacks'],
    active: true,
  },
  {
    term: 'MALWARE',
    category: 'Threats',
    description: 'Malicious code designed to damage, disrupt, or gain unauthorized access to computer systems.',
    difficulty: 'beginner',
    tags: ['viruses', 'trojans', 'threats'],
    active: true,
  },
  {
    term: 'PATCHING',
    category: 'Defense',
    description: 'Applying updates to software, operating systems, and firmware to fix known security vulnerabilities.',
    difficulty: 'beginner',
    tags: ['maintenance', 'vulnerabilities', 'hygiene'],
    active: true,
  },
  {
    term: 'ENCRYPTION',
    category: 'Cryptography',
    description: 'Encoding data so that only authorized parties with the decryption key can comprehend it.',
    difficulty: 'beginner',
    tags: ['privacy', 'confidentiality', 'math'],
    active: true,
  },
  {
    term: 'PASSWORD MANAGER',
    category: 'Defense',
    description: 'Software tool that generates, stores, and autofills strong, unique credentials across applications.',
    difficulty: 'beginner',
    tags: ['credentials', 'defense', 'passwords'],
    active: true,
  },
  {
    term: 'SOCIAL ENGINEERING',
    category: 'Threats',
    description: 'Manipulating individuals into voluntarily handing over confidential information or performing harmful actions.',
    difficulty: 'beginner',
    tags: ['human', 'psychology', 'manipulation'],
    active: true,
  },
  {
    term: 'VULNERABILITY',
    category: 'Risk',
    description: 'A flaw or weakness in software code or hardware design that an adversary can exploit.',
    difficulty: 'beginner',
    tags: ['flaw', 'cve', 'risk'],
    active: true,
  },
  {
    term: 'EXPLOIT',
    category: 'Threats',
    description: 'A piece of software, data chunk, or sequence of commands that takes advantage of a bug or vulnerability.',
    difficulty: 'intermediate',
    tags: ['attack', 'payload', 'cve'],
    active: true,
  },
  {
    term: 'BACKUP',
    category: 'Defense',
    description: 'Creating copies of critical data stored safely offline or offsite to facilitate recovery after incidents.',
    difficulty: 'beginner',
    tags: ['resilience', 'recovery', 'bcdr'],
    active: true,
  },
  {
    term: 'INCIDENT RESPONSE',
    category: 'Operations',
    description: 'Structured methodology for handling breaches, minimizing damage, and restoring normal operations.',
    difficulty: 'intermediate',
    tags: ['forensics', 'triage', 'recovery'],
    active: true,
  },
  {
    term: 'ACCESS CONTROL',
    category: 'Architecture',
    description: 'Selective restriction of access to places or resources based on identity and privileges (RBAC/ABAC).',
    difficulty: 'beginner',
    tags: ['permissions', 'authorization', 'iam'],
    active: true,
  },
  {
    term: 'IDS',
    category: 'Network Security',
    description: 'Intrusion Detection System monitoring network traffic for suspicious activity and known attack signatures.',
    difficulty: 'intermediate',
    tags: ['detection', 'alerts', 'snort'],
    active: true,
  },
  {
    term: 'IPS',
    category: 'Network Security',
    description: 'Intrusion Prevention System actively blocking malicious packets inline before they reach targets.',
    difficulty: 'intermediate',
    tags: ['prevention', 'inline', 'firewall'],
    active: true,
  },
  {
    term: 'EDR',
    category: 'Endpoint Security',
    description: 'Endpoint Detection and Response continuously recording endpoint events to uncover stealthy intrusions.',
    difficulty: 'advanced',
    tags: ['agents', 'telemetry', 'threat-hunting'],
    active: true,
  },
  {
    term: 'AUTHENTICATION',
    category: 'Identity',
    description: 'Process of verifying that someone or something is who or what they claim to be.',
    difficulty: 'beginner',
    tags: ['authn', 'identity', 'credentials'],
    active: true,
  },
  {
    term: 'AUTHORIZATION',
    category: 'Identity',
    description: 'Process of granting or denying specific permissions to an authenticated entity.',
    difficulty: 'beginner',
    tags: ['authz', 'permissions', 'rbac'],
    active: true,
  },
  {
    term: 'BRUTE FORCE',
    category: 'Attacks',
    description: 'Systematic trial-and-error guessing of every possible password or key combination until one works.',
    difficulty: 'beginner',
    tags: ['passwords', 'cracking', 'automation'],
    active: true,
  },
  {
    term: 'HONEYPOT',
    category: 'Deception',
    description: 'Decoy system designed to lure attackers, detect probes, and gather intelligence on adversary tactics.',
    difficulty: 'intermediate',
    tags: ['deception', 'telemetry', 'traps'],
    active: true,
  },
  {
    term: 'MITM',
    category: 'Network Attacks',
    description: 'Man-in-the-Middle attack where the perpetrator secretly relays and alters communication between two parties.',
    difficulty: 'intermediate',
    tags: ['interception', 'sniffing', 'tls'],
    active: true,
  },
  {
    term: 'ZERO-DAY',
    category: 'Threats',
    description: 'A software security flaw that is unknown to the vendor and has no patch available.',
    difficulty: 'advanced',
    tags: ['exploit', 'unpatched', 'critical'],
    active: true,
  },
  {
    term: 'THREAT HUNTING',
    category: 'Operations',
    description: 'Proactive search for malicious actors and undetected malware lingering inside corporate networks.',
    difficulty: 'advanced',
    tags: ['proactive', 'analyst', 'ioc'],
    active: true,
  },
  {
    term: 'AIR GAP',
    category: 'Physical Security',
    description: 'Physical isolation of a secure computer network from external networks and the Internet.',
    difficulty: 'intermediate',
    tags: ['isolation', 'scada', 'high-security'],
    active: true,
  },
  {
    term: 'SQL INJECTION',
    category: 'Web Security',
    description: 'Insertion of malicious SQL queries via client input data to manipulate back-end databases.',
    difficulty: 'intermediate',
    tags: ['owasp', 'injection', 'database'],
    active: true,
  },
  {
    term: 'XSS',
    category: 'Web Security',
    description: 'Cross-Site Scripting injecting malicious scripts into otherwise benign and trusted web pages.',
    difficulty: 'intermediate',
    tags: ['browser', 'cookies', 'owasp'],
    active: true,
  },
  {
    term: 'LEAST PRIVILEGE',
    category: 'Architecture',
    description: 'Granting users or programs only the minimum permissions necessary to perform their legitimate roles.',
    difficulty: 'beginner',
    tags: ['principle', 'iam', 'hardening'],
    active: true,
  },
  {
    term: 'SECURITY AUDIT',
    category: 'Compliance',
    description: 'Systematic technical and policy evaluation of an organization\'s security posture and regulatory compliance.',
    difficulty: 'beginner',
    tags: ['governance', 'compliance', 'review'],
    active: true,
  }
];

export const SEED_QUESTIONS: Omit<CMSQuestionItem, 'id' | 'createdAt'>[] = [
  {
    question: 'Which authentication method requires two or more independent factors for access?',
    answer: 'MFA',
    options: ['MFA', 'Single Password', 'CAPTCHA', 'Shared Secret'],
    explanation: 'Multi-Factor Authentication (MFA) requires credentials from at least two categories: knowledge, possession, or inherence.',
    category: 'Authentication',
    difficulty: 'beginner',
    points: 100,
    active: true,
  },
  {
    question: 'What type of attack involves deceptive emails to harvest corporate credentials?',
    answer: 'PHISHING',
    options: ['PHISHING', 'PORT SCANNING', 'BUFFER OVERFLOW', 'WAR DIALING'],
    explanation: 'Phishing utilizes social engineering via email or messages to trick victims into revealing sensitive information.',
    category: 'Social Engineering',
    difficulty: 'beginner',
    points: 100,
    active: true,
  },
  {
    question: 'Which framework operates under the guiding principle "Never trust, always verify"?',
    answer: 'ZERO TRUST',
    options: ['ZERO TRUST', 'DEFENSE IN DEPTH', 'PERIMETER DEFENSE', 'DEMILITARIZED ZONE'],
    explanation: 'Zero Trust architecture mandates strict identity verification for every person and device attempting to access network resources.',
    category: 'Architecture',
    difficulty: 'intermediate',
    points: 150,
    active: true,
  },
  {
    question: 'What malware family encrypts files and demands cryptocurrency for their release?',
    answer: 'RANSOMWARE',
    options: ['RANSOMWARE', 'KEYLOGGER', 'ADWARE', 'SPYWARE'],
    explanation: 'Ransomware targets data availability by locking files behind cryptographic barriers until extortion payments are met.',
    category: 'Threats',
    difficulty: 'beginner',
    points: 100,
    active: true,
  },
  {
    question: 'Which device or software inspects and filters inbound/outbound network traffic?',
    answer: 'FIREWALL',
    options: ['FIREWALL', 'HUB', 'REPEATER', 'MODEM'],
    explanation: 'A firewall monitors and controls network packets according to established stateful and packet-level security policies.',
    category: 'Network Security',
    difficulty: 'beginner',
    points: 100,
    active: true,
  },
  {
    question: 'Which acronym refers to 24/7 Security Operations monitoring and incident response?',
    answer: 'SOC',
    options: ['SOC', 'SIEM', 'DMZ', 'NOC'],
    explanation: 'The Security Operations Center (SOC) is the command hub where cybersecurity analysts monitor, detect, and neutralize threats.',
    category: 'Operations',
    difficulty: 'beginner',
    points: 100,
    active: true,
  }
];

export const SYSTEM_PATTERNS: WinningPattern[] = [
  {
    id: 'pattern-postage-stamp',
    name: 'Postage Stamp',
    description: 'Any 2x2 square in one of the four corners.',
    rows: 5,
    cols: 5,
    cells: [], // Dynamic check: 2x2 in any corner
    isSystem: true,
  },
  {
    id: 'pattern-horizontal',
    name: 'Horizontal Row',
    description: 'Any complete horizontal row across the board.',
    rows: 5,
    cols: 5,
    cells: [], // Dynamic check: any row full
    isSystem: true,
  },
  {
    id: 'pattern-vertical',
    name: 'Vertical Column',
    description: 'Any complete vertical column down the board.',
    rows: 5,
    cols: 5,
    cells: [], // Dynamic check: any col full
    isSystem: true,
  },
  {
    id: 'pattern-diagonal',
    name: 'Diagonal Line',
    description: 'Any of the two main diagonal lines from corner to corner.',
    rows: 5,
    cols: 5,
    cells: [], // Dynamic check: diagonal 1 or 2
    isSystem: true,
  },
  {
    id: 'pattern-four-corners',
    name: 'Four Corners',
    description: 'Mark all 4 corner cells of the board.',
    rows: 5,
    cols: 5,
    cells: [[0, 0], [0, 4], [4, 0], [4, 4]],
    isSystem: true,
  },
  {
    id: 'pattern-x-mode',
    name: 'X-Pattern',
    description: 'Both diagonals forming a glowing X across the grid.',
    rows: 5,
    cols: 5,
    cells: [
      [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],
      [0, 4], [1, 3], [3, 1], [4, 0]
    ],
    isSystem: true,
  },
  {
    id: 'pattern-plus',
    name: 'Plus / Cross',
    description: 'Center row and center column forming a plus sign.',
    rows: 5,
    cols: 5,
    cells: [
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
      [0, 2], [1, 2], [3, 2], [4, 2]
    ],
    isSystem: true,
  },
  {
    id: 'pattern-diamond',
    name: 'Diamond',
    description: 'A diamond shape centered on the card.',
    rows: 5,
    cols: 5,
    cells: [
      [0, 2],
      [1, 1], [1, 3],
      [2, 0], [2, 4],
      [3, 1], [3, 3],
      [4, 2]
    ],
    isSystem: true,
  },
  {
    id: 'pattern-frame',
    name: 'Outside Frame',
    description: 'All outer boundary cells around the perimeter of the card.',
    rows: 5,
    cols: 5,
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      [4, 0], [4, 1], [4, 2], [4, 3], [4, 4],
      [1, 0], [2, 0], [3, 0],
      [1, 4], [2, 4], [3, 4]
    ],
    isSystem: true,
  },
  {
    id: 'pattern-blackout',
    name: 'Full Blackout / Coverall',
    description: 'Every single cell on the board must be marked.',
    rows: 5,
    cols: 5,
    cells: [], // Blackout all
    isSystem: true,
  }
];

export const DEFAULT_THEMES: ThemeConfig[] = [
  {
    id: 'theme-classic-hall',
    name: 'Classic Bingo Hall (Default)',
    primaryColor: '#eab308',     // Warm Gold
    secondaryColor: '#ef4444',   // Crimson Cherry
    accentColor: '#3b82f6',      // Royal Blue
    backgroundColor: '#0c0e17',  // Deep Velvet Navy
    textColor: '#f8fafc',        // Crisp Card White
    cardBackground: '#131828',   // Rich Hall Felt
    cellRadius: '0.6rem',
    glowIntensity: 'high',
    fontFamily: 'Inter',
  },
  {
    id: 'theme-lucky-emerald',
    name: 'Lucky Emerald Lounge',
    primaryColor: '#10b981',     // Emerald
    secondaryColor: '#f59e0b',   // Gold Amber
    accentColor: '#064e3b',      // Dark Forest
    backgroundColor: '#03140c',  // Deep Green
    textColor: '#ecfdf5',
    cardBackground: '#06291a',
    cellRadius: '0.5rem',
    glowIntensity: 'high',
    fontFamily: 'Inter',
  },
  {
    id: 'theme-vegas-strip',
    name: 'Vegas Golden Marquee',
    primaryColor: '#fbbf24',     // Bright Vegas Gold
    secondaryColor: '#ec4899',   // Flamingo Pink
    accentColor: '#7c3aed',      // Deep Royal Violet
    backgroundColor: '#0f0728',
    textColor: '#fdf4ff',
    cardBackground: '#1e0f3d',
    cellRadius: '0.75rem',
    glowIntensity: 'high',
    fontFamily: 'Inter',
  },
  {
    id: 'theme-cyber-soc',
    name: 'Electric Neon Nights',
    primaryColor: '#00f5ff',     // Electric Cyan
    secondaryColor: '#00ff88',   // Neon Green
    accentColor: '#a855f7',      // Royal Violet
    backgroundColor: '#050811',  // Near Black
    textColor: '#e2e8f0',        // Slate White
    cardBackground: '#0a0f1d',   // Deep Blue Gray
    cellRadius: '0.5rem',
    glowIntensity: 'high',
    fontFamily: 'Chakra Petch',
  }
];

export const DEFAULT_GAME_CONFIG: GameConfig = {
  version: 1,
  name: 'CLASSIC 75-BALL BINGO',
  description: 'The authentic 75-Ball Classic Bingo Hall experience with B-I-N-G-O columns (1-75), ball hopper blower, flashboard, real dauber stamps, speech caller, and pattern prizes.',
  board: {
    rows: 5,
    columns: 5,
    freeSpace: true,
    freeSpacePosition: {
      row: 2,
      column: 2,
    },
    freeSpaceLabel: '★ FREE ★',
  },
  mode: 'classic',
  draw: {
    intervalMs: 5000,
    automatic: true,
    contentType: 'numbers',
    numberRangeMin: 1,
    numberRangeMax: 75,
  },
  rules: {
    allowMultipleWinners: true,
    maxWinners: 3,
    falseClaimPenalty: 25,
    minPlayers: 1,
    maxPlayers: 100,
    speedBonusEnabled: true,
  },
  scoring: {
    baseWin: 100,
    firstWinnerBonus: 100,
    secondWinnerBonus: 75,
    thirdWinnerBonus: 50,
    falseClaimPenalty: 25,
    speedBonusPerSecondRemaining: 2,
  },
  winningPatterns: [
    'pattern-horizontal',
    'pattern-vertical',
    'pattern-diagonal',
    'pattern-four-corners',
    'pattern-postage-stamp'
  ],
  theme: DEFAULT_THEMES[0],
};
