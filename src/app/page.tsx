import { SelectionProvider } from "@/context/SelectionContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Sobre from "@/components/Sobre";
import Planos from "@/components/Planos";
import Assinatura from "@/components/Assinatura";
import Avulsos from "@/components/Avulsos";
import Agendamento from "@/components/Agendamento";
import Diferencial from "@/components/Diferencial";
import CtaFinal from "@/components/CtaFinal";

export default function Home() {
  return (
    <SelectionProvider>
      <Header />
      <main className="flex-1">
        <Hero />
        <Sobre />
        <Planos />
        <Assinatura />
        <Avulsos />
        <Agendamento />
        <Diferencial />
        <CtaFinal />
      </main>
    </SelectionProvider>
  );
}
