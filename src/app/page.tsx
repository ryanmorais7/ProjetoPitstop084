import { SelectionProvider } from "@/context/SelectionContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SubscriptionNudge from "@/components/SubscriptionNudge";
import SobreDiferencial from "@/components/SobreDiferencial";
import DuchaPitstop from "@/components/DuchaPitstop";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import DiamanteExperience from "@/components/DiamanteExperience";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import BookingFlow from "@/components/BookingFlow";
import EnderecoSection from "@/components/EnderecoSection";
import CtaFinal from "@/components/CtaFinal";
import Footer from "@/components/Footer";
import MobileStickyCta from "@/components/MobileStickyCta";

export default function Home() {
  return (
    <SelectionProvider>
      <Header />
      <main className="flex-1">
        <Hero />
        <SubscriptionNudge />
        <SobreDiferencial />
        <DuchaPitstop />
        <SubscriptionPlans />
        <DiamanteExperience />
        <BeforeAfterSlider />
        <BookingFlow />
        <EnderecoSection />
        <CtaFinal />
      </main>
      <Footer />
      <MobileStickyCta />
    </SelectionProvider>
  );
}
