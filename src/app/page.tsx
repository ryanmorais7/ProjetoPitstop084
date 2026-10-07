import { SelectionProvider } from "@/context/SelectionContext";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TransicaoSecao from "@/components/TransicaoSecao";
import SobreDiferencial from "@/components/SobreDiferencial";
import DuchaPitstop from "@/components/DuchaPitstop";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import BookingFlow from "@/components/BookingFlow";
import EnderecoSection from "@/components/EnderecoSection";
import CtaFinal from "@/components/CtaFinal";
import Footer from "@/components/Footer";
import MobileStickyCta from "@/components/MobileStickyCta";
import MeuPitPass from "@/components/MeuPitPass";

// A landing continua estática. O catálogo (preços, durações, serviços ativos) é relido no
// máximo a cada 5 minutos, e na hora quando o admin salva um ajuste (revalidatePath("/")).
export const revalidate = 300;

export default async function Home() {
  const catalogo = await carregarCatalogo();

  return (
    <SelectionProvider catalogo={catalogo}>
      <Header />
      <main className="flex-1">
        <Hero />
        <TransicaoSecao />
        <SobreDiferencial />
        <DuchaPitstop />
        <SubscriptionPlans />
        <BeforeAfterSlider />
        <BookingFlow />
        <EnderecoSection />
        <CtaFinal />
      </main>
      <Footer />
      <MobileStickyCta />
      <MeuPitPass />
    </SelectionProvider>
  );
}
