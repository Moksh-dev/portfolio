"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, MoveUpRight, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PublicEntry, owner as ownerData } from "@/content/portfolio";
import { constellationEdges, smoothRange } from "@/lib/world";
import type { SceneBridge } from "./world";
import { galleryPhotos } from "@/content/photos";
import { PhotoGallerySection } from "./gallery/photo-gallery-section";

const World = dynamic(() => import("./world"), { ssr: false });
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function getMotionSnapshot() { return window.matchMedia(motionQuery).matches; }
const serverMotionSnapshot = () => false;

export function Becoming({ entries, owner }: { entries: PublicEntry[]; owner: typeof ownerData }) {
  const voyage = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const triggerButton = useRef<HTMLElement | null>(null);
  const bridge = useRef<SceneBridge>({ progress: 0, invalidate: () => {} });
  const [journeyVisible, setJourneyVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [explored, setExplored] = useState<Set<string>>(() => new Set());
  const [still, setStill] = useState(false);
  const [listView, setListView] = useState(false);
  const [webgl, setWebgl] = useState<"checking" | "available" | "unavailable">("checking");
  const [sceneReady, setSceneReady] = useState(false);
  const [notice, setNotice] = useState("");
  const prefersReducedMotion = useSyncExternalStore(subscribeMotion, getMotionSnapshot, serverMotionSnapshot);
  const reducedMotion = prefersReducedMotion || still;
  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        if (new URLSearchParams(window.location.search).get("graphics") === "off") { setWebgl("unavailable"); return; }
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2");
        if (!context) { setWebgl("unavailable"); return; }
        context.getExtension("WEBGL_lose_context")?.loseContext();
        setWebgl("available");
      } catch { setWebgl("unavailable"); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: voyage.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;
          bridge.current.progress = reducedMotion ? (p > 0.6 ? 1 : 0) : p;
          bridge.current.invalidate();
          const dark = smoothRange(0.13, 0.79, bridge.current.progress);
          const heroOpacity = 1 - smoothRange(0.015, 0.28, p);
          stage.current?.style.setProperty("--hero-opacity", String(heroOpacity));
          stage.current?.style.setProperty("--hero-shift", `${reducedMotion ? 0 : -p * 150}px`);
          stage.current?.style.setProperty("--journey-opacity", String(smoothRange(0.7, 0.92, p)));
          stage.current?.style.setProperty("--transition-opacity", String(Math.sin(smoothRange(0.15, 0.85, p) * Math.PI)));
          stage.current?.style.setProperty("--darkness", String(dark));
          stage.current?.style.setProperty("--ink", gsap.utils.interpolate("#292c31", "#e6e7ee", dark));
          stage.current?.style.setProperty("--muted-ink", gsap.utils.interpolate("#69685f", "#a0abc2", dark));
          stage.current?.style.setProperty("--world-color", gsap.utils.interpolate("#f4f0e8", "#080e20", dark));
          setJourneyVisible(p > 0.78);
        },
      });
    }, voyage);
    ScrollTrigger.refresh();
    return () => context.revert();
  }, [reducedMotion]);

  const goToJourney = useCallback((instant = false) => {
    if (!voyage.current) return;
    const top = window.scrollY + voyage.current.getBoundingClientRect().top + voyage.current.offsetHeight - window.innerHeight;
    window.scrollTo({ top, behavior: reducedMotion || instant ? "instant" : "smooth" });
  }, [reducedMotion]);

  const openEntry = useCallback((id: string, fromHash = false) => {
    if (!entries.some((entry) => entry.id === id)) return;
    triggerButton.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(id);
    setExplored((previous) => new Set(previous).add(id));
    setHoveredId(null);
    if (!fromHash) window.history.pushState(null, "", `#story/${id}`);
    goToJourney(fromHash);
  }, [entries, goToJourney]);

  const closeEntry = useCallback(() => {
    setSelectedId(null);
    window.history.replaceState(null, "", "#journey");
    requestAnimationFrame(() => {
      const star = document.querySelector<HTMLButtonElement>(`[data-star-id="${selectedId}"]`);
      if (triggerButton.current?.isConnected && triggerButton.current.closest("#selected-work")) {
        triggerButton.current.focus({ preventScroll: true });
      } else star?.focus({ preventScroll: true });
    });
  }, [selectedId]);

  useEffect(() => {
    const syncHash = () => {
      const id = window.location.hash.replace("#story/", "");
      if (window.location.hash.startsWith("#story/") && entries.some((entry) => entry.id === id)) openEntry(id, true);
      else {
        setSelectedId(null);
        if (window.location.hash === "#journey") goToJourney(true);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [entries, openEntry, goToJourney]);

  useEffect(() => {
    if (!selectedId) return;
    const frame = requestAnimationFrame(() => detailHeading.current?.focus({ preventScroll: true }));
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") closeEntry(); };
    window.addEventListener("keydown", escape);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", escape); };
  }, [selectedId, closeEntry]);

  const sceneUnavailable = webgl === "unavailable";
  const showFallback = !sceneReady || sceneUnavailable;

  return (
    <main id="top" data-reduced-motion={reducedMotion || undefined}>
      <a className="skip-link" href="#selected-work">Skip to selected work</a>
      <section ref={voyage} className="voyage" aria-label="Becoming: an orbital journey">
        <div id="journey" className="journey-anchor" aria-hidden="true" />
        <div ref={stage} className="world-stage" data-journey={journeyVisible} data-detail={Boolean(selected)}>
          <div className="world-canvas" aria-label="Animated orbital environment">
            {webgl === "available" && <World entries={entries} bridge={bridge} reducedMotion={reducedMotion} journeyVisible={journeyVisible} selectedId={selectedId} hoveredId={hoveredId} explored={explored} onSelect={openEntry} onHover={setHoveredId} onReady={() => setSceneReady(true)} onError={() => { setWebgl("unavailable"); setSceneReady(false); }} hideLabels={listView} />}
          </div>

          {showFallback && <div className="fallback-orbit" aria-hidden="true"><div className="fallback-sphere" /><i /><i /><i /><span className="fallback-moon" /></div>}
          <div className="world-grain" aria-hidden="true" />
          <div className="world-vignette" aria-hidden="true" />

          <header className="site-header">
            <a href="#top" className="wordmark" aria-label="Becoming, back to the beginning"><OrbitMark /><span>becoming<span className="wordmark-dot">.</span></span></a>
            <nav aria-label="Main navigation">
              <button onClick={() => { if (selected) closeEntry(); goToJourney(); }} aria-current={journeyVisible && !selected ? "location" : undefined}>Journey</button>
              <a href="#selected-work"><span className="desktop-nav-label">Selected work</span><span className="mobile-nav-label">Work</span></a>
              <a href="#contact">Contact <ArrowUpRight size={12} strokeWidth={1.4} /></a>
            </nav>
          </header>

          <div className="hero-copy" aria-hidden={journeyVisible} inert={journeyVisible}>
            <p className="eyebrow hero-eyebrow"><span className="tiny-dot" /> A work in progress</p>
            <h1>{owner.name}</h1>
            <p className="hero-signature">{owner.signature}</p>
            <p className="hero-microcopy">ideas / experiments / everything in between</p>
          </div>
          <div className="hero-coordinate" aria-hidden="true"><span>01 — an open orbit</span><span>nothing here stands still</span></div>
          <div className="hero-footer" aria-hidden={journeyVisible} inert={journeyVisible}>
            <button className="explore-link" onClick={() => goToJourney()}><span className="circle-arrow"><ArrowDown size={16} strokeWidth={1.3} /></span><span>Follow the orbit<small>Scroll to explore</small></span></button>
            <div className="study-note"><span>{owner.study}</span><span>{owner.institution} <span className="note-divider">/</span> {owner.stage}</span></div>
          </div>

          <div className="passage-caption" aria-hidden="true"><span>A few things,</span><span>connected.</span></div>

          <div className="journey-heading" aria-hidden={!journeyVisible || Boolean(selected)} inert={!journeyVisible || Boolean(selected)}>
            <p className="eyebrow">02 / the constellation</p>
            <h2>Follow your curiosity.</h2>
            <p>Choose a star. See where it leads.</p>
          </div>

          {(sceneUnavailable || listView) && <div className={`constellation-fallback ${listView ? "is-list" : ""}`} aria-label="Explore the constellation" aria-hidden={!journeyVisible || Boolean(selected)} inert={!journeyVisible || Boolean(selected)}>
            {!listView && <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">{constellationEdges(entries).map((edge) => {
              const from = entries.find((entry) => entry.id === edge.from)!;
              const to = entries.find((entry) => entry.id === edge.to)!;
              return <line key={edge.id} x1={(from.visual.position[0] + 4.5) / 9 * 1000} y1={(2.7 - from.visual.position[1]) / 5.4 * 600} x2={(to.visual.position[0] + 4.5) / 9 * 1000} y2={(2.7 - to.visual.position[1]) / 5.4 * 600} />;
            })}</svg>}
            {entries.map((entry) => <button key={entry.id} className={`fallback-star ${explored.has(entry.id) ? "is-explored" : ""}`} data-star-id={entry.id} onClick={() => openEntry(entry.id)} style={{ "--node-x": `${(entry.visual.position[0] + 4.5) / 9 * 100}%`, "--node-y": `${(2.7 - entry.visual.position[1]) / 5.4 * 100}%`, "--star-color": entry.visual.color } as CSSProperties}>
              <span className="star-dot" /><span>{entry.shortTitle ?? entry.title}<small>{entry.category.split(" / ")[0]}{explored.has(entry.id) ? " · explored" : ""}</small></span><ArrowUpRight size={13} />
            </button>)}
          </div>}

          {selected && <article key={selected.id} className={`story story-${selected.id}`} aria-labelledby="story-title">
            <button className="back-link" onClick={closeEntry}><ArrowLeft size={16} /> Back to the constellation</button>
            <p className="eyebrow story-category">{selected.category}</p>
            <h2 id="story-title" tabIndex={-1} ref={detailHeading}>{selected.title}</h2>
            <div className="story-meta"><span className={`status status-${selected.status}`}><i />{selected.status === "exploratory" ? "Exploration" : selected.status === "ongoing" ? "Ongoing" : "Completed"}</span>{selected.date && <span>{selected.date}</span>}</div>
            <p className="story-description">{selected.description}</p>
            <dl>{selected.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.text}</dd></div>)}</dl>
            {selected.approvedNarrative && <p className="story-narrative">{selected.approvedNarrative}</p>}
            {selected.media?.map((media) => <figure key={media.src}><Image src={media.src} alt={media.alt} width={1000} height={700} /></figure>)}
            {selected.source && <a className="text-link story-source" href={selected.source.url} target="_blank" rel="noreferrer">{selected.source.label}<ArrowUpRight size={16} /></a>}
            <div className="related-entries"><span>Connected to</span>{selected.relatedIds.map((id) => {
              const related = entries.find((entry) => entry.id === id);
              return related && <button key={id} onClick={() => openEntry(id)}>{related.shortTitle ?? related.title}<ArrowUpRight size={12} /></button>;
            })}</div>
          </article>}

          <div className="journey-toolbar" aria-hidden={!journeyVisible || Boolean(selected)} inert={!journeyVisible || Boolean(selected)}>
            <p><span className="tiny-dot" />{explored.size ? "A few new connections." : "Every point has a story."}<span className="toolbar-subtext">An open constellation. No particular order.</span></p>
            <div><button onClick={() => { setListView((value) => !value); setNotice(listView ? "Constellation view" : "List view"); }}>{listView ? "Constellation view" : "View as list"}</button><button onClick={() => { setExplored(new Set()); setNotice("Exploration reset. A fresh constellation."); }} aria-label="Reset explored stars"><RotateCcw size={13} /> Reset</button></div>
          </div>
          <button className="motion-toggle" onClick={() => setStill((value) => !value)} aria-pressed={reducedMotion} aria-label={reducedMotion ? "Allow ambient motion" : "Pause ambient motion"} disabled={prefersReducedMotion} title={prefersReducedMotion ? "Following your reduced-motion preference" : undefined}><AudioLines size={14} strokeWidth={1.3} /><span>{reducedMotion ? "Stillness" : "Ambient motion"}</span></button>
        </div>
      </section>

      <PhotoGallerySection photos={galleryPhotos} reducedMotion={reducedMotion} />

      <section id="selected-work" className="selected-work section-padding" aria-labelledby="work-title">
        <div className="section-topline"><span className="eyebrow">04 / a closer look</span><span>Selected work</span></div>
        <div className="work-heading"><h2 id="work-title">Things taking shape.</h2><p>Some built. Some still unfolding.</p></div>
        <div className="work-list">{entries.filter((entry) => entry.kind === "project").map((entry, index) => <button key={entry.id} className="work-row" onClick={() => openEntry(entry.id)} aria-label={`Explore ${entry.title}`}>
          <span className="work-index">0{index + 1}</span><div className="work-title"><h3>{entry.title}</h3><p>{entry.description}</p></div><span className="work-category">{entry.category.split(" / ")[0]}<small>{entry.status === "exploratory" ? "Exploration" : entry.status === "ongoing" ? "Ongoing" : "Completed"}</small></span><span className="work-arrow"><MoveUpRight size={23} strokeWidth={1} /></span>
        </button>)}</div>
        <button className="return-link" onClick={() => { setSelectedId(null); goToJourney(); }}><Sparkles size={15} strokeWidth={1} /> There’s more in the constellation <ArrowRight size={15} /></button>
      </section>

      <footer id="contact" className="contact section-padding">
        <div className="section-topline"><span className="eyebrow">05 / an open connection</span><span>{owner.institution}</span></div>
        <div className="contact-main"><h2>What’s next<span>?</span></h2><a className="contact-link" href={owner.github} target="_blank" rel="noreferrer"><span>Find me on GitHub<small>@Moksh-dev</small></span><span className="contact-arrow"><ArrowUpRight size={30} strokeWidth={1} /></span></a></div>
        <div className="contact-bottom"><a className="wordmark" href="#top"><OrbitMark /><span>becoming.</span></a><p>Always room for another connection.</p><a href="#top">Back to the beginning <ArrowUpRight size={13} /></a></div>
      </footer>
      <div className="sr-only" aria-live="polite">{notice}</div>
      <noscript><div className="noscript-note">The orbital experience uses JavaScript. The selected work above is available as a reading list. Source code: <a href={owner.github}>github.com/Moksh-dev</a>.</div></noscript>
    </main>
  );
}

function OrbitMark() {
  return <svg width="29" height="29" viewBox="0 0 40 40" fill="none" aria-hidden="true"><ellipse cx="20" cy="20" rx="17" ry="7" transform="rotate(-36 20 20)" stroke="currentColor" strokeWidth="0.65" /><ellipse cx="20" cy="20" rx="17" ry="7" transform="rotate(36 20 20)" stroke="currentColor" strokeWidth="0.65" /><circle cx="20" cy="20" r="3" fill="currentColor" /><circle cx="31.7" cy="11.7" r="1.8" fill="currentColor" /></svg>;
}
