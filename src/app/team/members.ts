/* ============================================================
   TEAM DATA — shared by the Team page.
   photo: pravatar stand-ins (mirrors the old page's placeholders)
   ============================================================ */

export interface TeamMember {
  name: string;
  role: string;
  dept: string;
  photo: string;
}

export const PRESIDENTS: TeamMember[] = [
  { name: "Aarav Sharma", role: "President", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/480?img=13" },
  { name: "Meera Iyer", role: "Co-President", dept: "Information Technology", photo: "https://i.pravatar.cc/480?img=32" },
];

export const HEADS: TeamMember[] = [
  { name: "Karthik Raj", role: "Technical Head", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/480?img=15" },
  { name: "Sanjana Nair", role: "Design Head", dept: "Electronics & Communication", photo: "https://i.pravatar.cc/480?img=48" },
  { name: "Rohan Patel", role: "Operations Head", dept: "Mechanical Engineering", photo: "https://i.pravatar.cc/480?img=53" },
  { name: "Meera Rajan", role: "Outreach Head", dept: "Electrical Engineering", photo: "https://i.pravatar.cc/480?img=44" },
  { name: "Arjun Menon", role: "Content Head", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/480?img=59" },
  { name: "Nisha Gupta", role: "Logistics Head", dept: "Information Technology", photo: "https://i.pravatar.cc/480?img=28" },
  { name: "Vikram Singh", role: "Events Head", dept: "Electronics & Communication", photo: "https://i.pravatar.cc/480?img=68" },
  { name: "Ananya Reddy", role: "Sponsorship Head", dept: "Electrical Engineering", photo: "https://i.pravatar.cc/480?img=47" },
];

/** Members that flow through the 3D scroll stage */
export const FEATURED: TeamMember[] = [...PRESIDENTS, ...HEADS];

/** Remaining members, shown in a grid below the stage */
export const DEPUTIES: TeamMember[] = [
  { name: "Priya Verma", role: "Technical Deputy", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/480?img=45" },
  { name: "Rahul Krishnan", role: "Technical Deputy", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/480?img=52" },
  { name: "Kavya Pillai", role: "Design Deputy", dept: "Electronics & Communication", photo: "https://i.pravatar.cc/480?img=41" },
  { name: "Nikhil Das", role: "Design Deputy", dept: "Electronics & Communication", photo: "https://i.pravatar.cc/480?img=61" },
  { name: "Siddharth Nair", role: "Outreach Deputy", dept: "Electrical Engineering", photo: "https://i.pravatar.cc/480?img=11" },
  { name: "Sneha Menon", role: "Outreach Deputy", dept: "Electrical Engineering", photo: "https://i.pravatar.cc/480?img=25" },
  { name: "Aditya Rao", role: "Operations Deputy", dept: "Mechanical Engineering", photo: "https://i.pravatar.cc/480?img=33" },
  { name: "Tanvi Sharma", role: "Operations Deputy", dept: "Mechanical Engineering", photo: "https://i.pravatar.cc/480?img=16" },
  { name: "Ravi Kumar", role: "Content Deputy", dept: "Information Technology", photo: "https://i.pravatar.cc/480?img=51" },
  { name: "Riya Joshi", role: "Content Deputy", dept: "Information Technology", photo: "https://i.pravatar.cc/480?img=30" },
  { name: "Divya Iyer", role: "Sponsorship Deputy", dept: "Electrical Engineering", photo: "https://i.pravatar.cc/480?img=9" },
  { name: "Karthik Iyer", role: "Events Deputy", dept: "Mechanical Engineering", photo: "https://i.pravatar.cc/480?img=57" },
];

/** Initials for avatar fallbacks */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
