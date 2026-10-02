import { codingProfiles, education, exams, extracurriculars, profile } from '../data/portfolio';

export interface QuestFact {
  label: string;
  detail: string;
}

/** What each `{ }` block reveals, in level order. Drawn from the portfolio data only. */
export function questFacts(): QuestFact[] {
  const [cf, cc] = codingProfiles;
  const karate = extracurriculars.find((x) => x.id === 'karate')!;
  return [
    { label: profile.title, detail: `@ ${profile.company}` },
    { label: education.shortName, detail: `B.Tech EE · GPA ${education.gpa}` },
    { label: cf.platform, detail: `${cf.title} · ${cf.maxRating}` },
    { label: cc.platform, detail: `${cc.title} · ${cc.maxRating}` },
    { label: exams[0].exam, detail: `${exams[0].rank} (${exams[0].year})` },
    { label: 'Built at Netradyne', detail: 'DRP · DAL · TEK' },
    { label: 'Stack', detail: profile.coreStack.join(' · ') },
    { label: karate.name, detail: `${karate.role} · 1st Dan` },
  ];
}
