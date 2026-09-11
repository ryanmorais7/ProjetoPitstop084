import Reveal from "./Reveal";
import Bolt from "./Bolt";

// Placeholder até a @ real e os posts serem definidos.
const INSTAGRAM_URL = "https://instagram.com/";

export default function InstagramSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            <Bolt className="h-3.5 w-3.5 text-gold" />
            Instagram
          </div>
          <h2 className="max-w-lg font-heading text-3xl font-bold md:text-5xl">
            Vistos no Instagram.
          </h2>
        </Reveal>

        <Reveal delayMs={100}>
          <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-sm bg-panel text-text-secondary/40"
                aria-hidden="true"
              >
                <Bolt className="h-5 w-5" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            Grade de exemplo, conteúdo real do Instagram entra aqui em breve.
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-text-primary underline-offset-4 transition hover:text-gold hover:underline"
          >
            Ver no Instagram
          </a>
        </Reveal>
      </div>
    </section>
  );
}
