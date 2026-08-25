import type { Metadata } from "next";
import SubpageShell from "@/components/SubpageShell";
import Origin from "@/components/Origin";

export const metadata: Metadata = {
  title: "The Origin | CSAU — Digital Realm",
  description:
    "Born at CEG. Built for what's next — the story of the Computer Society of Anna University.",
};

export default function AboutPage() {
  return (
    <SubpageShell label="CSAU / ORIGIN NODE · SECTOR 02">
      <Origin />
    </SubpageShell>
  );
}
