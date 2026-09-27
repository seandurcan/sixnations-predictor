import type { Metadata } from "next";
import HeritageSection from "@/components/heritage/HeritageSection";
import StoryCollection from "@/components/heritage/StoryCollection";
import { matchStories } from "@/lib/heritage-stories";
export const metadata: Metadata = { title: "Classic Championship Matches | Perfect XV", description: "Step back inside the games that still start arguments and raise a smile: Croke Park in 2007, Italy’s breakthrough against France, Cardiff’s 2013 decider and the extraordinary 2019 Calcutta Cup. Read how the drama unfolded and why it mattered." };
export default function Page() {
  return <HeritageSection slug="classic-matches"><StoryCollection stories={matchStories} /></HeritageSection>;
}
