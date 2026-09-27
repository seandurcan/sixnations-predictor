import type { Metadata } from "next";
import HeritageSection from "@/components/heritage/HeritageSection";
import StoryCollection from "@/components/heritage/StoryCollection";
import { milestoneStories } from "@/lib/heritage-stories";
export const metadata: Metadata = { title: "Championship Milestones Before the Six Nations Era | Perfect XV", description: "Before Italy arrived, the Championship had already produced a century of remarkable stories. Revisit Ireland’s 1948 breakthrough, the five-way tie of 1973, the arrival of a trophy and Scotland’s dramatic farewell to the Five Nations." };
export default function Page() {
  return <HeritageSection slug="milestones"><StoryCollection stories={milestoneStories} /></HeritageSection>;
}
