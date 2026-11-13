export type EntryStatus = "completed" | "ongoing" | "exploratory";
export type Point3 = readonly [number, number, number];

export interface PortfolioEntry {
  id: string;
  title: string;
  shortTitle?: string;
  category: string;
  kind: "project" | "community" | "recognition" | "foundation";
  date?: string;
  description: string;
  details: readonly { label: string; text: string }[];
  relatedIds: readonly string[];
  source?: { label: string; url: string };
  status: EntryStatus;
  media?: readonly { src: string; alt: string }[];
  approvedNarrative?: string;
  /** Editorial only. Stripped before anything is sent to the browser. */
  privateEditorialNotes?: string;
  visual: {
    position: Point3;
    color: string;
    size: number;
    labelSide?: "left" | "right";
  };
}

export type PublicEntry = Omit<PortfolioEntry, "privateEditorialNotes">;

export const owner = {
  name: "Moksh Goel",
  signature: "still becoming.",
  study: "Computer Science · AI / ML",
  institution: "VIT Chennai",
  stage: "First year",
  github: "https://github.com/Moksh-dev",
} as const;

export const portfolio: readonly PortfolioEntry[] = [
  {
    id: "asha",
    title: "Project A.S.H.A.",
    category: "Social impact / Web development",
    kind: "project",
    description: "Technical work for an anti-human-trafficking awareness initiative.",
    details: [
      { label: "Role", text: "Technical Lead" },
      { label: "The work", text: "Work on the organization’s website, alongside volunteer-facing technology concepts." },
      { label: "In development", text: "Volunteer-facing tools remain at the concept stage." },
    ],
    relatedIds: ["one-line", "mic"],
    source: { label: "Explore the repository", url: "https://github.com/Moksh-dev/project-asha" },
    status: "ongoing",
    visual: { position: [-2.7, 0.75, 0.65], color: "#e4bd87", size: 1.35 },
  },
  {
    id: "one-line",
    title: "One Line",
    category: "Personal experiment / Web application",
    kind: "project",
    description: "An anonymous space to leave a single thought.",
    details: [
      { label: "Made with", text: "Flask, SQLite, HTML, CSS, JavaScript" },
      { label: "The experiment", text: "A small web application built around one simple interaction: leaving a thought without a profile." },
    ],
    relatedIds: ["asha", "debate"],
    source: { label: "Explore the repository", url: "https://github.com/Moksh-dev/one-line" },
    status: "completed",
    visual: { position: [0.05, 1.38, -0.5], color: "#d8dbf1", size: 1.05 },
  },
  {
    id: "concrete",
    title: "Concrete Strength Prediction",
    shortTitle: "Concrete strength",
    category: "Machine learning / Regression",
    kind: "project",
    description: "An introductory regression project exploring concrete compressive strength.",
    details: [
      { label: "Explored", text: "Data preprocessing, supervised learning, model training, and validation." },
      { label: "Context", text: "A learning project: an early application of regression, with room for more experiments." },
    ],
    relatedIds: ["mic", "technology-day"],
    source: { label: "Explore the repository", url: "https://github.com/Moksh-dev/concrete-strength-model" },
    status: "exploratory",
    visual: { position: [2.65, 0.42, 0.1], color: "#b5c8f3", size: 1.15, labelSide: "left" },
  },
  {
    id: "mic",
    title: "Microsoft Innovations Club",
    shortTitle: "Microsoft Innovations Club",
    category: "Community / Technical collaboration",
    kind: "community",
    date: "2026–27",
    description: "Member of the AI/ML Department at Microsoft Innovations Club, VIT Chennai.",
    details: [
      { label: "Tenure", text: "2026–27" },
      { label: "In progress", text: "Ongoing learning and technical collaboration through the club’s AI/ML Department." },
    ],
    relatedIds: ["asha", "concrete"],
    status: "ongoing",
    visual: { position: [0.95, -0.85, 0.9], color: "#c0c9f1", size: 0.95 },
  },
  {
    id: "technology-day",
    title: "National Technology Day",
    shortTitle: "Technology Day ’25",
    category: "Recognition / Early experimentation",
    kind: "recognition",
    date: "May 2025",
    description: "First position in a project exhibition at Panipat Institute of Engineering & Technology.",
    details: [
      { label: "Recognition", text: "First position · National Technology Day 2025" },
      { label: "Where", text: "Panipat Institute of Engineering & Technology" },
    ],
    relatedIds: ["concrete", "ar-vr"],
    status: "completed",
    visual: { position: [3.1, -1.45, -1.2], color: "#d5b78b", size: 0.7, labelSide: "left" },
  },
  {
    id: "parliament",
    title: "Mock Parliament",
    category: "Communication / Public speaking",
    kind: "recognition",
    date: "October 2024",
    description: "Second position in a Mock Parliament competition.",
    details: [{ label: "Recognition", text: "Second position · October 2024" }],
    relatedIds: ["debate", "mic"],
    status: "completed",
    visual: { position: [-2.2, -1.25, -0.2], color: "#b4c0e5", size: 0.8 },
  },
  {
    id: "ar-vr",
    title: "An introduction to AR / VR",
    shortTitle: "AR / VR",
    category: "Foundations / Technology training",
    kind: "foundation",
    date: "June 2023",
    description: "Recognition for AR/VR technology training.",
    details: [{ label: "When", text: "June 2023" }],
    relatedIds: ["technology-day", "concrete"],
    status: "completed",
    visual: { position: [-0.7, -2.05, -1.5], color: "#abb9da", size: 0.55 },
  },
  {
    id: "debate",
    title: "Inter-school debate",
    shortTitle: "Debate",
    category: "Foundations / Communication",
    kind: "foundation",
    date: "October 2023",
    description: "Participation in an inter-school debate.",
    details: [{ label: "When", text: "October 2023" }],
    relatedIds: ["parliament", "one-line"],
    status: "completed",
    visual: { position: [-3.55, -0.3, -1.5], color: "#a5b5d8", size: 0.55 },
  },
];

export function publicEntries(entries: readonly PortfolioEntry[]): PublicEntry[] {
  return entries.map((entry) => {
    const { privateEditorialNotes, ...publicEntry } = entry;
    void privateEditorialNotes;
    return publicEntry;
  });
}
