"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Gives the site header a hairline once the page has scrolled. */
export function SiteEffects() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const update = () => header.setAttribute("data-scrolled", String(window.scrollY > 8));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}

/**
 * A slim action bar on phones. It appears once the hero's button has scrolled away and hides again
 * wherever another call to action is on screen (elements marked data-cta).
 */
export function MobileCtaBar({ href, label }: { href: string; label: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const targets = [...document.querySelectorAll("[data-cta]")];
    if (!targets.length) return;
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      // Hidden above the first call to action and whenever one is visible.
      const first = targets[0].getBoundingClientRect();
      setVisible(onScreen.size === 0 && first.bottom < 0);
    });
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="cta-bar" data-visible={visible} aria-hidden={!visible}>
      <Link href={href} tabIndex={visible ? 0 : -1} className="btn btn-primary w-full">
        {label}
      </Link>
    </div>
  );
}
