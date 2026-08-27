import type { Metadata } from "next";
import SubpageShell from "@/components/SubpageShell";
import JourneyTrack from "@/components/JourneyTrack";

export const metadata: Metadata = {
  title: "The Journey — 100 Days of Code | CSAU",
  description:
    "Traverse the 100 Days of Code progress track — checkpoints, milestones and the road to day 100.",
};

export default function JourneyPage() {
  return (
    <SubpageShell label="SYNCING JOURNEY · SECTOR 05">
      <JourneyTrack />
    </SubpageShell>
  );
}
