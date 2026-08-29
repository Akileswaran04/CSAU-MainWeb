"use client";

import { motion } from "framer-motion";
import TeamCard from "@/components/TeamCard";

/* ============================================================
   TEAM PAGE — White Sculptural Tactility Theme

   No header — just the grid of team members with box-reveal
   3D flap animation cards. Staggered entrance with
   framer-motion fade-up on page load.
   ============================================================ */

const TEAM = [
  { name: "Aarav Sharma", role: "Backend engineer", photo: "https://i.pravatar.cc/400?img=13" },
  { name: "Meera Iyer", role: "Product design", photo: "https://i.pravatar.cc/400?img=32" },
  { name: "Karthik Raj", role: "Frontend engineer", photo: "https://i.pravatar.cc/400?img=15" },
  { name: "Sanjana Nair", role: "ML research", photo: "https://i.pravatar.cc/400?img=48" },
  { name: "Rohan Patel", role: "DevOps lead", photo: "https://i.pravatar.cc/400?img=53" },
  { name: "Meera Rajan", role: "Outreach lead", photo: "https://i.pravatar.cc/400?img=44" },
];

export default function TeamPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--background)",
        paddingTop: "12vh",
        paddingBottom: "10vh",
      }}
    >
      {/* Grid — no header */}
      <div
        className="mx-auto px-5 sm:px-8 lg:px-12"
        style={{ maxWidth: 1040 }}
      >
        <div
          className="grid gap-y-14 gap-x-10"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          }}
        >
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.15 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <TeamCard
                name={member.name}
                role={member.role}
                photo={member.photo}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
