import { Footer } from "@/app/components/footer";
import Header from "@/app/components/header/header";
import { Hero } from "@/app/components/hero";
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
