import type { Metadata } from "next";
import HeritageSection from "@/components/heritage/HeritageSection";
import StoryCollection from "@/components/heritage/StoryCollection";
import { playerStories } from "@/lib/heritage-stories";
export const metadata: Metadata = { title: "Players Who Shaped the Championship | Perfect XV", description: "Meet the players behind the numbers. From O’Driscoll’s arrival in Paris to Wilkinson’s control, Williams’s elusive running and Parisse’s defiance, these profiles explore the skills and defining moments that made their names." };
export default function Page() {
  return <HeritageSection slug="players"><StoryCollection stories={playerStories} /></HeritageSection>;
}
