import type { Metadata } from "next";
import SubpageShell from "@/components/SubpageShell";
import Archive from "@/components/Archive";

export const metadata: Metadata = {
  title: "The Archive | CSAU — Digital Realm",
  description:
    "Mission logs from past CSAU events — workshops, hackathons, bootcamps and competitions.",
};

export default function EventsPage() {
  return (
    <SubpageShell label="OPENING ARCHIVE · REALM RECORDS">
      <Archive />
    </SubpageShell>
  );
}
