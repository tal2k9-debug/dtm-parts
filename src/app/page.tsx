import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QuickRegisterBar from "@/components/layout/QuickRegisterBar";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import PopularBumpers from "@/components/home/PopularBumpers";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <QuickRegisterBar />
      <Header />
      <main>
        <HeroSection />
        <PopularBumpers />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
