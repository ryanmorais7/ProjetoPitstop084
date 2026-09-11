"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [emVista, setEmVista] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEmVista(true);
        observer.disconnect();
      }
    }, options ?? { threshold: 0.15 });

    observer.observe(elemento);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, emVista };
}
