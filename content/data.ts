/**
 * Single source of truth for every word, number and link on the site.
 * Nothing here is invented: values not yet supplied are empty, named constants
 * below. UI components hide a link or metric whose value is empty.
 */

/* ───────────────────────── Values still to be supplied ───────────────────────── */

/** Full LinkedIn profile URL, e.g. https://www.linkedin.com/in/<handle> */
export const LINKEDIN_URL: string = '';
/** Full GitHub profile URL, e.g. https://github.com/<handle> */
export const GITHUB_URL: string = 'https://github.com/nikhilbajantri';
/** Public site URL used for canonical links, OG and sitemap (no trailing slash). */
export const SITE_URL: string = '';
/** Live URL of the Great British Doner website. */
export const GREAT_BRITISH_DONER_URL: string = '';
/** Live URL of the Olea Social website. */
export const OLEA_SOCIAL_URL: string = '';
/**
 * Muted, looping screen recordings for the STUDIO browser frames (MP4 H.264 ≤ 2 MB,
 * e.g. /videos/great-british-doner.mp4) and their poster stills (AVIF/WebP/PNG).
 * While empty, the frames render a card drawn from this file's project data.
 */
export const GREAT_BRITISH_DONER_VIDEO: string = '';
export const GREAT_BRITISH_DONER_POSTER: string = '';
export const OLEA_SOCIAL_VIDEO: string = '';
export const OLEA_SOCIAL_POSTER: string = '';
/** Doqtra Tech studio website. */
export const DOQTRA_TECH_URL: string = '';
/** Source repository links, one per project, if public. */
export const REPO_RESTAURANT_RATING_URL: string = '';
export const REPO_ANOMALY_DETECTOR_URL: string = '';
export const REPO_SMC_PRO_URL: string = '';
/**
 * Benchmark score per regressor for Restaurant Rating Prediction (e.g. R² on the
 * held-out set). Monolith heights in DATA TERRAIN scale from these values; while
 * they are null the columns render at equal height with no numeric label.
 */
export const RESTAURANT_MODEL_SCORES: Record<RegressorName, number | null> = {
  'Random Forest': null,
  SVR: null,
  KNN: null,
  Ridge: null,
  Lasso: null,
  Linear: null,
};
/** Metric label for RESTAURANT_MODEL_SCORES, e.g. 'R²'. */
export const RESTAURANT_SCORE_METRIC: string = '';

/* ───────────────────────── Types ───────────────────────── */

export type SectionId = 'boot' | 'die' | 'studio' | 'auth' | 'data' | 'kernel' | 'exit';

export interface Section {
  id: SectionId;
  /** Short mono label shown in the section rail. */
  label: string;
  /** Accessible name for the rail item and the section landmark. */
  title: string;
  /** Scroll-progress window [start, end) within 0 → 1. */
  range: readonly [number, number];
}

export interface Person {
  name: string;
  nickname: string;
  title: string;
  company: string;
  headline: string;
  subline: string;
  location: string;
  workMode: string;
  languages: readonly string[];
  availability: string;
  about: readonly [string, string];
}

export interface Education {
  degree: string;
  institution: string;
  city: string;
  start: number;
  end: number;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  start: string;
  end: string;
  points: readonly string[];
  stack: readonly string[];
  link: string;
}

export type ProjectStatus = 'live' | 'poc' | 'in-progress' | 'complete';

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ArchitectureNode {
  id: string;
  label: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CaseStudy {
  problem: string;
  approach: readonly string[];
  architecture: {
    nodes: readonly ArchitectureNode[];
    edges: readonly ArchitectureEdge[];
  };
  outcome: readonly string[];
}

export interface Metric {
  /** Numeric part, animated by counters. */
  value: number;
  /** Prefix such as '~'. */
  prefix: string;
  /** Suffix such as 'K'. */
  suffix: string;
  label: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  client: string;
  status: ProjectStatus;
  /** Badge text, shown when not empty. */
  badge: string;
  featured: boolean;
  /** Scene the project's 3D card lives in. */
  section: SectionId;
  stack: readonly string[];
  metric: Metric | null;
  links: readonly ProjectLink[];
  /** Screen recording and still for 3D browser frames; empty when not supplied. */
  media: { video: string; poster: string };
  caseStudy: CaseStudy;
}

export interface SkillCluster {
  id: string;
  name: string;
  items: readonly string[];
}

export interface LeadershipRole {
  id: string;
  role: string;
  organisation: string;
  description: string;
  highlights: readonly string[];
}

export interface Contact {
  email: string;
  linkedin: string;
  github: string;
  resume: string;
}

export type RegressorName = 'Random Forest' | 'SVR' | 'KNN' | 'Ridge' | 'Lasso' | 'Linear';

/* ───────────────────────── Content ───────────────────────── */

export const SECTIONS: readonly Section[] = [
  { id: 'boot', label: 'BOOT', title: 'Introduction', range: [0, 0.08] },
  { id: 'die', label: 'DIE', title: 'About', range: [0.08, 0.22] },
  { id: 'studio', label: 'STUDIO', title: 'Client work at Doqtra Tech', range: [0.22, 0.42] },
  { id: 'auth', label: 'AUTH', title: 'Secure platforms at Shiktra Technologies', range: [0.42, 0.58] },
  { id: 'data', label: 'DATA', title: 'Machine learning and data projects', range: [0.58, 0.76] },
  { id: 'kernel', label: 'KERNEL', title: 'Skills and leadership', range: [0.76, 0.92] },
  { id: 'exit', label: 'EXIT', title: 'Contact', range: [0.92, 1] },
] as const;

export const PERSON: Person = {
  name: 'Nikhil Bajantri',
  nickname: 'Nick',
  title: 'Full-Stack & AI Engineer',
  company: 'Doqtra Tech',
  headline: 'I build secure systems that ship.',
  subline: 'Full-stack products, ML pipelines and secure auth, for real clients from scoping to deploy.',
  location: 'Mangalore, India',
  workMode: 'Remote-first',
  languages: ['English', 'Hindi', 'Marathi'],
  availability: 'Open to remote internships',
  about: [
    'I co-founded Doqtra Tech, a software studio delivering full-stack and headless web products for international clients, including UK businesses. I own client scoping and delivery, and build production apps end to end with React, Next.js, Django/FastAPI and MongoDB.',
    'As Product Lead at Shiktra Technologies I led two full-stack POC platforms, designed ML pipelines for resume and candidate scoring, and built Keycloak-based authentication with JWT/OAuth and RBAC. I study Artificial Intelligence & Data Science in Mangalore and work remote-first.',
  ],
};

export const EDUCATION: Education = {
  degree: 'B.E. Artificial Intelligence & Data Science',
  institution: 'Srinivas Institute of Technology',
  city: 'Mangalore',
  start: 2024,
  end: 2028,
};

export const EXPERIENCE: readonly Experience[] = [
  {
    id: 'doqtra',
    role: 'Co-Founder & Full-Stack Developer',
    company: 'Doqtra Tech',
    start: '2025',
    end: 'Present',
    points: [
      'Co-founded a software studio delivering full-stack and headless web products for international clients, including UK businesses.',
      'Delivered Great British Doner, a headless Sanity CMS website for a UK client, sustaining ~15K monthly reach.',
      'Builds production apps end to end with React, Next.js, Django/FastAPI and MongoDB; owns client scoping and delivery.',
    ],
    stack: ['React', 'Next.js', 'Django', 'FastAPI', 'MongoDB', 'Sanity'],
    link: DOQTRA_TECH_URL,
  },
  {
    id: 'shiktra',
    role: 'Product Lead & Full-Stack Developer (Intern)',
    company: 'Shiktra Technologies',
    start: 'Jan 2026',
    end: 'May 2026',
    points: [
      'Led product development for two full-stack POC platforms: MyCodeBud and an ATS (Applicant Tracking System).',
      'Designed and implemented ML pipelines for resume/candidate processing and scoring.',
      'Built Keycloak-based authentication (JWT/OAuth, RBAC) and handled application security tasks.',
      'Built frontend and backend APIs with React, Next.js, FastAPI and MongoDB in an Agile team.',
    ],
    stack: ['React', 'Next.js', 'FastAPI', 'MongoDB', 'Keycloak', 'JWT', 'OAuth', 'RBAC'],
    link: '',
  },
] as const;

const linksOf = (...links: ProjectLink[]): ProjectLink[] => links.filter((l) => l.href !== '');

export const PROJECTS: readonly Project[] = [
  {
    slug: 'great-british-doner',
    title: 'Great British Doner',
    summary: 'Headless website for a UK food brand.',
    client: 'UK food brand, via Doqtra Tech',
    status: 'live',
    badge: 'LIVE',
    featured: true,
    section: 'studio',
    stack: ['Next.js', 'Sanity CMS'],
    metric: { value: 15, prefix: '~', suffix: 'K', label: 'monthly reach' },
    links: linksOf({ label: 'Visit live site', href: GREAT_BRITISH_DONER_URL }),
    media: { video: GREAT_BRITISH_DONER_VIDEO, poster: GREAT_BRITISH_DONER_POSTER },
    caseStudy: {
      problem: 'A UK food brand needed a headless website, delivered by Doqtra Tech.',
      approach: [
        'Headless architecture: content modelled and edited in Sanity CMS.',
        'Front end built with Next.js, consuming content from Sanity (JAMstack).',
      ],
      architecture: {
        nodes: [
          { id: 'editors', label: 'Client editors' },
          { id: 'sanity', label: 'Sanity CMS' },
          { id: 'next', label: 'Next.js front end' },
          { id: 'visitors', label: 'Visitors' },
        ],
        edges: [
          { from: 'editors', to: 'sanity', label: 'edit content' },
          { from: 'sanity', to: 'next', label: 'content API' },
          { from: 'next', to: 'visitors', label: 'web' },
        ],
      },
      outcome: ['Live in production.', 'Sustains ~15K monthly reach.'],
    },
  },
  {
    slug: 'olea-social',
    title: 'Olea Social',
    summary: 'Website for a UK restaurant client.',
    client: 'UK restaurant, via Doqtra Tech',
    status: 'live',
    badge: '',
    featured: false,
    section: 'studio',
    stack: [],
    metric: null,
    links: linksOf({ label: 'Visit live site', href: OLEA_SOCIAL_URL }),
    media: { video: OLEA_SOCIAL_VIDEO, poster: OLEA_SOCIAL_POSTER },
    caseStudy: {
      problem: 'A UK restaurant client needed a website, delivered by Doqtra Tech.',
      approach: ['Scoped and delivered by Doqtra Tech for the client.'],
      architecture: {
        nodes: [
          { id: 'doqtra', label: 'Doqtra Tech' },
          { id: 'site', label: 'Olea Social website' },
          { id: 'visitors', label: 'Visitors' },
        ],
        edges: [
          { from: 'doqtra', to: 'site', label: 'build & deliver' },
          { from: 'site', to: 'visitors', label: 'web' },
        ],
      },
      outcome: ['Delivered to a UK restaurant client.'],
    },
  },
  {
    slug: 'ats-platform',
    title: 'ATS Platform',
    summary: 'Applicant tracking POC with an ML resume-scoring pipeline and role-based secure auth.',
    client: 'Shiktra Technologies',
    status: 'poc',
    badge: 'POC',
    featured: false,
    section: 'auth',
    stack: ['Python', 'ML pipeline', 'JWT', 'Keycloak'],
    metric: null,
    links: [],
    media: { video: '', poster: '' },
    caseStudy: {
      problem: 'Shiktra Technologies needed an Applicant Tracking System proof of concept that could process and score candidates securely.',
      approach: [
        'Led product development of the platform.',
        'Designed and implemented an ML pipeline for resume/candidate processing and scoring in Python.',
        'Secured access with Keycloak, JWT and role-based access control.',
      ],
      architecture: {
        nodes: [
          { id: 'user', label: 'Recruiter / candidate' },
          { id: 'keycloak', label: 'Keycloak' },
          { id: 'api', label: 'API (JWT + RBAC)' },
          { id: 'ml', label: 'ML scoring pipeline' },
        ],
        edges: [
          { from: 'user', to: 'keycloak', label: 'sign in' },
          { from: 'keycloak', to: 'api', label: 'JWT' },
          { from: 'api', to: 'ml', label: 'resumes' },
          { from: 'ml', to: 'api', label: 'scores' },
        ],
      },
      outcome: ['Proof of concept with an ML resume-scoring pipeline and role-based secure auth.'],
    },
  },
  {
    slug: 'mycodebud',
    title: 'MyCodeBud',
    summary: 'Full-stack POC with ML-assisted features and secure auth.',
    client: 'Shiktra Technologies',
    status: 'poc',
    badge: 'POC',
    featured: false,
    section: 'auth',
    stack: ['React', 'Next.js', 'FastAPI', 'MongoDB'],
    metric: null,
    links: [],
    media: { video: '', poster: '' },
    caseStudy: {
      problem: 'Shiktra Technologies needed a full-stack proof of concept with ML-assisted features and secure authentication.',
      approach: [
        'Led product development of the platform.',
        'Built the frontend with React and Next.js and backend APIs with FastAPI and MongoDB.',
        'Added secure authentication and ML-assisted features.',
      ],
      architecture: {
        nodes: [
          { id: 'web', label: 'React / Next.js' },
          { id: 'auth', label: 'Secure auth' },
          { id: 'api', label: 'FastAPI' },
          { id: 'db', label: 'MongoDB' },
        ],
        edges: [
          { from: 'web', to: 'auth', label: 'sign in' },
          { from: 'web', to: 'api', label: 'REST' },
          { from: 'api', to: 'db' },
        ],
      },
      outcome: ['Full-stack proof of concept, built in an Agile team.'],
    },
  },
  {
    slug: 'restaurant-rating-prediction',
    title: 'Restaurant Rating Prediction',
    summary: 'Zomato dataset: EDA, feature engineering and six regressors benchmarked.',
    client: 'Personal project',
    status: 'complete',
    badge: '',
    featured: false,
    section: 'data',
    stack: ['Python', 'scikit-learn', 'Pandas'],
    metric: null,
    links: linksOf({ label: 'Source', href: REPO_RESTAURANT_RATING_URL }),
    media: { video: '', poster: '' },
    caseStudy: {
      problem: 'Predict restaurant ratings from the Zomato dataset.',
      approach: [
        'Exploratory data analysis and feature engineering with Pandas.',
        'Benchmarked six regressors with scikit-learn: Random Forest, SVR, KNN, Ridge, Lasso and Linear.',
      ],
      architecture: {
        nodes: [
          { id: 'data', label: 'Zomato dataset' },
          { id: 'eda', label: 'EDA' },
          { id: 'fe', label: 'Feature engineering' },
          { id: 'models', label: '6 regressors' },
          { id: 'bench', label: 'Benchmark' },
        ],
        edges: [
          { from: 'data', to: 'eda' },
          { from: 'eda', to: 'fe' },
          { from: 'fe', to: 'models' },
          { from: 'models', to: 'bench' },
        ],
      },
      outcome: ['Six regression models benchmarked side by side.'],
    },
  },
  {
    slug: 'ml-network-anomaly-detector',
    title: 'ML Network Anomaly Detector',
    summary: 'Intrusion detection on the CIC-IDS2017 dataset.',
    client: 'Personal project',
    status: 'in-progress',
    badge: 'IN PROGRESS',
    featured: false,
    section: 'auth',
    stack: [],
    metric: null,
    links: linksOf({ label: 'Source', href: REPO_ANOMALY_DETECTOR_URL }),
    media: { video: '', poster: '' },
    caseStudy: {
      problem: 'Detect network intrusions in traffic data.',
      approach: ['Machine learning on the CIC-IDS2017 intrusion detection dataset.'],
      architecture: {
        nodes: [
          { id: 'data', label: 'CIC-IDS2017' },
          { id: 'model', label: 'ML detector' },
          { id: 'out', label: 'Normal / anomaly' },
        ],
        edges: [
          { from: 'data', to: 'model' },
          { from: 'model', to: 'out' },
        ],
      },
      outcome: ['In progress.'],
    },
  },
  {
    slug: 'smc-pro',
    title: 'SMC PRO',
    summary: 'Institutional Smart Money Concepts trading toolkit.',
    client: 'Personal project',
    status: 'complete',
    badge: '',
    featured: false,
    section: 'data',
    stack: ['Pine Script v6'],
    metric: { value: 1860, prefix: '~', suffix: '', label: 'lines of Pine Script' },
    links: linksOf({ label: 'Source', href: REPO_SMC_PRO_URL }),
    media: { video: '', poster: '' },
    caseStudy: {
      problem: 'Build an institutional Smart Money Concepts trading toolkit.',
      approach: ['Written in Pine Script v6.', 'Built across 6 phases.'],
      architecture: {
        nodes: [
          { id: 'chart', label: 'Price data' },
          { id: 'smc', label: 'SMC PRO (Pine Script v6)' },
          { id: 'overlay', label: 'Chart overlays' },
        ],
        edges: [
          { from: 'chart', to: 'smc' },
          { from: 'smc', to: 'overlay' },
        ],
      },
      outcome: ['~1,860 lines of Pine Script v6.', '6 build phases.'],
    },
  },
] as const;

export const REGRESSORS: readonly RegressorName[] = ['Random Forest', 'SVR', 'KNN', 'Ridge', 'Lasso', 'Linear'];

export const SKILLS: readonly SkillCluster[] = [
  { id: 'languages', name: 'Languages', items: ['Python', 'JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'SQL'] },
  { id: 'frontend', name: 'Frontend', items: ['React', 'Next.js', 'Tailwind CSS'] },
  { id: 'backend', name: 'Backend', items: ['Django', 'FastAPI', 'Express/Node.js', 'REST APIs'] },
  { id: 'cms', name: 'Headless CMS', items: ['Sanity (JAMstack)'] },
  {
    id: 'ml',
    name: 'ML / DL',
    items: ['Neural networks', 'scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'ML pipelines'],
  },
  { id: 'databases', name: 'Databases', items: ['MongoDB', 'MySQL', 'SQLite', 'NoSQL'] },
  { id: 'devops', name: 'DevOps & Monitoring', items: ['Docker', 'Git/GitHub', 'Prometheus', 'Grafana'] },
  { id: 'security', name: 'Security & Auth', items: ['Keycloak', 'JWT', 'OAuth', 'RBAC', 'Secure API design'] },
] as const;

export const LEADERSHIP: readonly LeadershipRole[] = [
  {
    id: 'ssosc',
    role: 'Web Co-Lead',
    organisation: 'Srinivas Students Open Source Community (SSOSC)',
    description: 'Led the web team and open-source initiatives.',
    highlights: [],
  },
  {
    id: 'gssoc',
    role: 'Contributor',
    organisation: 'GirlScript Summer of Code',
    description: 'Open-source contributor.',
    highlights: [],
  },
  {
    id: 'altius',
    role: 'Technical Coordinator',
    organisation: 'AI & DS Department',
    description: 'Runs the ALTIUS tech fest.',
    highlights: ['DECODE', 'AI Olympics', 'Cyber Crime', 'Tech Auction', 'CHAOS'],
  },
] as const;

export const CONTACT: Contact = {
  email: 'nikhil.bajantri.dev@gmail.com',
  linkedin: LINKEDIN_URL,
  github: GITHUB_URL,
  resume: '/Nikhil_Bajantri_Resume.pdf',
};

export const BOOT_LOG: readonly string[] = [
  '[ OK ] Initializing kernel',
  '[ OK ] Mounting /dev/nick',
  '[ OK ] Loading doqtra.tech',
  '[ OK ] Auth: keycloak ready',
  '> welcome',
] as const;

export const SITE = {
  title: 'Nikhil Bajantri — Full-Stack & AI Engineer',
  description:
    'Co-founder of Doqtra Tech. Full-stack products, ML pipelines and secure auth for international clients.',
  footer: '© 2026 Nikhil Bajantri · Built with three.js',
} as const;
