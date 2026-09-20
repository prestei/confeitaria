import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingProduct } from "@/components/landing/landing-product";
import { LandingHow } from "@/components/landing/landing-how";
import { LandingModes } from "@/components/landing/landing-modes";
import { LandingBaker } from "@/components/landing/landing-baker";
import { LandingCustomer } from "@/components/landing/landing-customer";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingScrollRoot } from "@/components/landing/landing-scroll-root";

export default function HomePage() {
  return (
    <div className="bg-atelier bg-grain relative min-h-screen overflow-x-hidden">
      <LandingHeader />
      <LandingScrollRoot>
        <main>
          <LandingHero />
          <LandingProduct />
          <LandingHow />
          <LandingModes />
          <LandingBaker />
          <LandingCustomer />
          <LandingCta />
        </main>
      </LandingScrollRoot>
      <LandingFooter />
    </div>
  );
}
