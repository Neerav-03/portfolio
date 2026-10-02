import type { GraphEdge, GraphNode } from '../../components/ArchitectureGraph';

/**
 * Conceptual map of the systems the resume describes. Deliberately generic:
 * no internal service names, schemas or APIs.
 */
export const PLATFORM_NODES: GraphNode[] = [
  { id: 'device', label: 'DEVICE', sub: 'uploads · device config', x: 380, y: 48, w: 180, kind: 'client' },
  { id: 'services', label: 'VIDEO SERVICES', sub: 'backend core services', x: 380, y: 152, w: 196, kind: 'compute' },
  {
    id: 's3',
    label: 'S3',
    sub: 'video + derived artifacts',
    x: 104,
    y: 272,
    w: 172,
    kind: 'storage',
    stack: true,
    badge: '×5',
  },
  { id: 'iam', label: 'IAM', sub: 'cross-environment', x: 288, y: 272, w: 152, kind: 'identity' },
  { id: 'kms', label: 'KMS', sub: 'keys', x: 472, y: 272, w: 152, kind: 'security' },
  { id: 'pg', label: 'POSTGRESQL', sub: 'relational data', x: 656, y: 272, w: 156, kind: 'data' },
  { id: 'retention', label: 'RETENTION SYSTEM', sub: 'lifecycle expiry', x: 104, y: 376, w: 172, kind: 'compute' },
];

export const PLATFORM_EDGES: GraphEdge[] = [
  { from: 'device', to: 'services', label: 'upload', route: 'v' },
  { from: 'services', to: 's3', route: 'v' },
  { from: 'services', to: 'iam', route: 'v' },
  { from: 'services', to: 'kms', route: 'v' },
  { from: 'services', to: 'pg', route: 'v' },
  { from: 's3', to: 'retention', label: 'lifecycle', route: 'v' },
];

export const MODULE_HIGHLIGHT: Record<'drp' | 'dal' | 'encryption', string[]> = {
  drp: ['device', 'services', 's3', 'iam', 'retention'],
  dal: ['device', 'services'],
  encryption: ['services', 'kms'],
};

export const NODE_INFO: Record<string, { title: string; body: string; modules: ('drp' | 'dal' | 'encryption')[] }> = {
  device: {
    title: 'device',
    body: 'Source of video uploads. DAL restrictions are enforced across device configuration as well as the backend.',
    modules: ['dal', 'drp'],
  },
  services: {
    title: 'video services',
    body: 'The backend platform’s core services. DRP enforcement, DAL restrictions and the encryption refactor all span these services.',
    modules: ['drp', 'dal', 'encryption'],
  },
  s3: {
    title: 's3 · banded buckets',
    body: 'Uploads and derived video artifacts. Banded bucket infrastructure: five duration tiers (62, 93, 124, 217 and 403 days), new partition types, lifecycle tagging, presigned-URL access.',
    modules: ['drp'],
  },
  iam: {
    title: 'iam',
    body: 'Cross-environment IAM set up as part of the banded S3 bucket infrastructure.',
    modules: ['drp'],
  },
  kms: {
    title: 'kms',
    body: 'Encryption previously relied on AWS CMK. Migrating to tenant-specific local encryption (TEK) reduced overall KMS costs.',
    modules: ['encryption'],
  },
  pg: {
    title: 'postgresql',
    body: 'Relational store from the documented stack. Its placement here is conceptual.',
    modules: [],
  },
  retention: {
    title: 'retention system',
    body: 'Per-day lifecycle expiry rules with day-exact and month-rounded expiry — automatic, cost-controlled video expiry with zero object migration.',
    modules: ['drp'],
  },
};
