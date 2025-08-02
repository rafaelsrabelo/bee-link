import { Footer } from "@/components/footer";
import Header from "@/components/header/header";
import { Hero } from "@/components/hero";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <Hero />
        {/* <Pricing /> */}
        {/* <FAQ /> */}
      </div>
      <Footer />
    </div>
  );
}
