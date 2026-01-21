export interface SolutionFeature {
  title: string;
  description: string;
  image: string;
}

export interface SolutionStep {
  title: string;
  description: string;
}

export interface SolutionFAQ {
  question: string;
  answer: string;
}

export interface Solution {
  title: string;
  shortTitle: string;
  slug: string;
  description: string;
  heroPrefix?: string;
  heroSuffix?: string;
  features: SolutionFeature[];
  steps: SolutionStep[];
  faqs: SolutionFAQ[];
  heroImages?: string[];
  isVideo?: boolean;
  showcase?: {
    label: string;
    aspectRatio: "square" | "portrait" | "landscape" | "landscape-wide" | "portrait-tall";
    className?: string;
    src?: string;
  }[];
}
