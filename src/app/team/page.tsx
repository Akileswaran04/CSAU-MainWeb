import type { Metadata } from "next";
import TeamShowcasePage from "./TeamShowcasePage";

export const metadata: Metadata = {
  title: "CSAU // Team — The People Behind the System",
  description:
    "Meet the pilots. The people behind CSAU's digital realm.",
};

export default function TeamPage() {
  return <TeamShowcasePage />;
}
