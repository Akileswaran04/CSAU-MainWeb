import type { Metadata } from "next";
import { getTeam } from "@/lib/team";
import TeamView from "@/components/team/TeamView";

/* ============================================================
   TEAM - the real CSAU roster: a full-circle carousel of the
   leadership, the deputy heads by domain, and a profile view
   for every member. The roster is fetched from the CMS on the
   server (revalidated hourly) and handed to the interactive
   view. See src/lib/team.ts.
   Route: /team
   ============================================================ */

export const metadata: Metadata = {
  title: "Team // CSAU - Computer Society of Anna University",
  description:
    "The people behind the Computer Society of Anna University, CEG - office bearers, domain heads and deputy heads.",
};

export const revalidate = 3600;

export default async function TeamPage() {
  const { members, state } = await getTeam();
  return <TeamView members={members} state={state} />;
}
