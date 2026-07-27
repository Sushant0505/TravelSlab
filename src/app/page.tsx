import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { StoryCircles } from "@/components/home/story-circles";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { UpcomingTrips } from "@/components/home/upcoming-trips";
import { TripShowcase } from "@/components/home/trip-showcase";
import { PopularDestinations } from "@/components/home/popular-destinations";
import { HowItWorks } from "@/components/home/how-it-works";
import { AgencyCTA } from "@/components/home/agency-cta";
import { OfferPopup } from "@/components/home/offer-popup";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StoryCircles />
        <TripShowcase />
        <BannerCarousel />
        <UpcomingTrips />
        <PopularDestinations />
        <HowItWorks />
        <AgencyCTA />
      </main>
      <Footer />
      <OfferPopup />
    </>
  );
}
