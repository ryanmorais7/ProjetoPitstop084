import { SelectionProvider } from "@/context/SelectionContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NeedSelector from "@/components/NeedSelector";
import Diferencial from "@/components/Diferencial";
import ServicesEditorial from "@/components/ServicesEditorial";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import ProcessTimeline from "@/components/ProcessTimeline";
import BusinessModelSelector from "@/components/BusinessModelSelector";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import StorySection from "@/components/StorySection";
import Testimonials from "@/components/Testimonials";
import InstagramSection from "@/components/InstagramSection";
import LocationSection from "@/components/LocationSection";
import BookingFlow from "@/components/BookingFlow";
import CtaFinal from "@/components/CtaFinal";
import MobileStickyCta from "@/components/MobileStickyCta";

export default function Home() {
  return (
    <SelectionProvider>
      <Header />
      <main className="flex-1">
        <Hero />
        <NeedSelector />
        <Diferencial />
        <ServicesEditorial />
        <BeforeAfterSlider />
        <ProcessTimeline />
        <BusinessModelSelector />
        <SubscriptionPlans />
        <StorySection />
        <Testimonials />
        <InstagramSection />
        <LocationSection />
        <BookingFlow />
        <CtaFinal />
      </main>
      <MobileStickyCta />
    </SelectionProvider>
  );
}
