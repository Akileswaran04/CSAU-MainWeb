export const dynamic = "force-dynamic";

import Preloader from "@/components/Preloader";
import ScrollFlight from "@/components/ScrollFlight";
import RealmProgress from "@/components/RealmProgress";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Origin from "@/components/Origin";
import Domains from "@/components/Domains";
import Archive from "@/components/Archive";
import Journey from "@/components/Journey";
import People from "@/components/People";
import Portal from "@/components/Portal";

export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <RealmProgress />
      <main id="page-root">
        <Hero />
        <Origin />
        <Domains />
        <Archive />
        <Journey />
        <People />
        <Portal />
      </main>
    </>
  );
}
