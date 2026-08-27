import type { Metadata } from "next";
import SubpageShell from "@/components/SubpageShell";
import People from "@/components/People";

export const metadata: Metadata = {
  title: "The People | CSAU — Digital Realm",
  description:
    "Technology is built by people — meet the minds behind CSAU, the Computer Society of Anna University.",
};

export default function TeamPage() {
  return (
    <SubpageShell label="CONNECTING PEOPLE · SECTOR 06">
      <People />
    </SubpageShell>
  );
}
