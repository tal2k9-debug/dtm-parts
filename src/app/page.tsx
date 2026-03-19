import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import GoogleReviewBanner from "@/components/home/GoogleReviewBanner";
import FeaturesSection from "@/components/home/FeaturesSection";
import PopularBumpers from "@/components/home/PopularBumpers";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <GoogleReviewBanner />
        <PopularBumpers />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
