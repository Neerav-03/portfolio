/**
 * Single source of truth for every factual claim on the site.
 * Everything here comes from the resume — edit this file to update the site.
 */
import type {
  CodingProfile,
  ContestResult,
  Education,
  ExamResult,
  ExperienceEntry,
  Extracurricular,
  Profile,
  Project,
  SkillGroup,
} from './types';

export const profile: Profile = {
  name: 'Neerav Daswani',
  handle: 'neerav',
  title: 'Software Engineer',
  company: 'Netradyne',
  location: 'Bengaluru, India',
  email: 'daswanineerav@gmail.com',
  headline: 'Software Engineer at Netradyne · IIT (BHU) Electrical Engineering',
  summary:
    'Backend software engineer at Netradyne, working on data retention, GDPR data-access controls and tenant-specific encryption across a video platform’s core services on AWS. IIT (BHU) Varanasi graduate in Electrical Engineering (GPA 9.59/10) and Codeforces Expert.',
  coreStack: ['AWS', 'Java', 'C++', 'PostgreSQL'],
  links: {
    github: 'https://github.com/Neerav-03',
    linkedin: 'https://linkedin.com/in/neerav-daswani-573313148',
    codeforces: 'https://codeforces.com/profile/Neerav03',
    codechef: 'https://www.codechef.com/users/neerav3',
  },
  resumeFile: 'Neerav_Daswani_Resume.pdf',
};

export const experience: ExperienceEntry[] = [
  {
    id: 'netradyne',
    company: 'Netradyne Technology',
    role: 'Software Engineer',
    location: 'Bengaluru',
    start: 'July 2025',
    end: 'Present',
    bullets: [
      'Designed and shipped configurable video Data Retention Policy (DRP) enforcement across the backend platform’s core services, covering day-exact/month-rounded expiry, presigned-URL gating, and S3 lifecycle tagging for uploads and derived video artifacts.',
      'Built banded S3 bucket infrastructure (five duration tiers, 62–403 days) with new partition types, per-day lifecycle expiry rules, and cross-environment IAM, enabling automatic, cost-controlled video expiry with zero object migration.',
      'Delivered GDPR Data Access Levels (DAL): a 4-tier, config-driven privacy framework enforcing per-tenant data-access restrictions across backend and device configuration, with validation guards and audit logging.',
      'Migrated encryption framework from AWS CMK to tenant-specific local encryption (TEK), refactoring key storage and decryption logic across services to strengthen data security and reduce overall KMS costs.',
    ],
    tags: ['AWS S3', 'IAM', 'KMS', 'Data retention', 'GDPR', 'Encryption'],
  },
  {
    id: 'exl',
    company: 'EXL',
    role: 'Decision Analyst Intern',
    location: 'Gurugram',
    start: 'May 2024',
    end: 'July 2024',
    bullets: [
      'Created an interactive competitive price monitoring dashboard analyzing transaction-level data from 5 retail stores over 2 years (857 products) across Overview, Sales, Price, and Elasticity views.',
      'Conducted customer segmentation using RFM profiling and tracked KPIs like sales growth and retention, enabling strategists to set profitable prices based on elasticities.',
    ],
    tags: ['Dashboards', 'RFM segmentation', 'Price elasticity'],
  },
];

export const projects: Project[] = [
  {
    id: 'moviemate',
    name: 'MovieMate',
    tagline: 'Movie discovery with content-based recommendations',
    repo: 'https://github.com/Neerav-03/Movie-Mate',
    tech: ['Next.js', 'TMDB API', 'Flask', 'TF-IDF', 'Cosine similarity', 'Disqus'],
    bullets: [
      'Created a Next.js application to display movie details using the TMDB API.',
      'Implemented Dark/Light mode and a Disqus React comment section for user engagement.',
      'Built a Flask backend with a TF-IDF vectorization model for personalized movie recommendations.',
    ],
  },
  {
    id: 'doclink',
    name: 'Doc-Link',
    tagline: 'Medical appointment management with role-based interfaces',
    repo: 'https://github.com/Neerav-03/Doc-Link',
    tech: ['React', 'Node.js', 'Express', 'MongoDB', 'bcrypt.js'],
    bullets: [
      'Developed a React application for managing medical appointments, featuring login, registration, and user authentication using bcrypt.js and MongoDB.',
      'Designed distinct interfaces for Admin, User, and Doctor, ensuring a customized experience.',
      'Incorporated push notifications, streamlined doctor availability checking and appointment booking through doctor approval, and enabled admins to approve or reject doctor registrations.',
    ],
  },
];

export const education: Education = {
  institution: 'Indian Institute of Technology (BHU) Varanasi',
  shortName: 'IIT (BHU)',
  degree: 'B.Tech in Electrical Engineering',
  start: 'Dec 2021',
  end: 'May 2025',
  gpa: 9.59,
  gpaScale: 10,
};

export const exams: ExamResult[] = [
  { exam: 'JEE Advanced', year: 2021, rank: 'AIR 3150' },
  { exam: 'JEE Main', year: 2021, rank: 'AIR 2220', percentile: 99.8 },
];

export const codingProfiles: CodingProfile[] = [
  {
    id: 'codeforces',
    platform: 'Codeforces',
    handle: 'Neerav03',
    url: 'https://codeforces.com/profile/Neerav03',
    title: 'Expert',
    maxRating: 1639,
    note: 'Active participation in contests',
  },
  {
    id: 'codechef',
    platform: 'CodeChef',
    handle: 'neerav3',
    url: 'https://www.codechef.com/users/neerav3',
    title: '4 Star',
    maxRating: 1853,
    note: 'Active participation in contests',
  },
];

export const contests: ContestResult[] = [
  { contest: 'Codeforces Round 931 (Div. 2)', rank: 946, platform: 'Codeforces' },
  { contest: 'Codeforces Round 930 (Div. 2)', rank: 989, platform: 'Codeforces' },
];

export const skills: SkillGroup[] = [
  { label: 'Languages', items: ['C/C++', 'Java', 'JavaScript', 'SQL'] },
  {
    label: 'Cloud',
    items: ['AWS S3', 'AWS Lambda', 'AWS EventBridge', 'AWS KMS', 'AWS IAM'],
  },
  { label: 'Data', items: ['PostgreSQL', 'MongoDB'] },
  { label: 'Web', items: ['Node.js', 'Express', 'React'] },
  { label: 'Interests', items: ['Data Structures', 'Algorithms', 'Operating Systems', 'OOP'] },
];

export const extracurriculars: Extracurricular[] = [
  {
    id: 'aptiquest',
    name: 'Aptiquest',
    role: 'Host',
    stat: '400+',
    statLabel: 'participants',
    detail: 'Hosted a quant aptitude test spanning number theory, geometry, combinatorics, probability and puzzles.',
  },
  {
    id: 'admad',
    name: 'Admad',
    role: 'Manager',
    stat: '18',
    statLabel: 'teams managed',
    detail: 'Managed 18 teams and curated creative themes for a campus advertisement-making event.',
  },
  {
    id: 'karate',
    name: 'Shito-Ryu Karate',
    role: 'Shodan',
    stat: '1st',
    statLabel: 'Dan black belt',
    detail: 'Attained Shodan (1st Dan) black belt in Shito-Ryu Karate in 2017.',
  },
];

/**
 * Lifecycle durations (days) of the five banded S3 bucket tiers behind DRP.
 * The resume documents the 62–403 day range; the intermediate values were
 * supplied by Neerav.
 */
export const drpBucketTiersDays = [62, 93, 124, 217, 403] as const;

export const resumeUrl = `${import.meta.env.BASE_URL}${profile.resumeFile}`;
