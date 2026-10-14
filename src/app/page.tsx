import HomeClient from "@/components/HomeClient";
import { QUICK_CODE } from "@/lib/whatsNew";

export default function Home() {
  return <HomeClient news={QUICK_CODE} />;
}
