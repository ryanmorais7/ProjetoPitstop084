import { SelectionProvider } from "@/context/SelectionContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SobreDiferencial from "@/components/SobreDiferencial";
import ServicesEditorial from "@/components/ServicesEditorial";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import BookingFlow from "@/components/BookingFlow";
import CtaFinal from "@/components/CtaFinal";
import Footer from "@/components/Footer";
import MobileStickyCta from "@/components/MobileStickyCta";

export default function Home() {
  return (
    <SelectionProvider>
      <Header />
      <main className="flex-1">
        <Hero />
        <SobreDiferencial />
        <ServicesEditorial />
        <SubscriptionPlans />
        <BeforeAfterSlider />
        <BookingFlow />
        <CtaFinal />
      </main>
      <Footer />
      <MobileStickyCta />
    </SelectionProvider>
  );
}
