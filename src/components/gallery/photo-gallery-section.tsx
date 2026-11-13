"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, MoveHorizontal, Pause, Play } from "lucide-react";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import type { GalleryPhoto } from "@/content/photos";
import { wrapPhoto } from "@/lib/photo-orbit";
import { OrbitImage } from "./orbit-image";
import { useOrbitInteraction } from "./use-orbit-interaction";
import type { PhotoOrigin } from "./photo-viewer";
import "./gallery.css";

const PhotoViewer = dynamic(() => import("./photo-viewer").then((module) => module.PhotoViewer), { ssr: false });

export function PhotoGallerySection({ photos, reducedMotion }: { photos: GalleryPhoto[]; reducedMotion: boolean }) {
  const [paused, setPaused] = useState(false);
  const [viewer, setViewer] = useState<{ index: number; origin: PhotoOrigin } | null>(null);
  const returnIndex = useRef(0);
  const { sectionRef, viewportRef, spaceRef, activeIndex, move, focus, images, refresh, jump } = useOrbitInteraction({ count: photos.length, reducedMotion, paused, viewing: viewer !== null });
  const closeViewer = useCallback(() => {
    setViewer(null);
    // The hook resumes on the next commit; return focus without moving the page.
    requestAnimationFrame(() => {
      jump(returnIndex.current);
      requestAnimationFrame(() => images.current.get(returnIndex.current)?.focus({ preventScroll: true }));
    });
  }, [jump, images]);

  if (!photos.length) return null;
  const indices = [...new Set(Array.from({ length: Math.min(photos.length, 11) }, (_, slot) => wrapPhoto(activeIndex + slot - Math.min(5, Math.floor(photos.length / 2)), photos.length)))];
  const select = (index: number) => {
    focus(index, () => {
      const element = images.current.get(index);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      returnIndex.current = index;
      setViewer({ index, origin: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } });
    });
  };

  return (
    <section ref={sectionRef} id="in-between" className="photo-gallery" aria-labelledby="gallery-title" data-still={reducedMotion || paused || undefined}>
      <div className="gallery-star-traces" aria-hidden="true">{Array.from({ length: 23 }, (_, index) => <i key={index} style={{ "--star-x": `${(index * 37 + 11) % 100}%`, "--star-y": `${(index * 23 + 7) % 90}%`, "--drift-x": `${((index * 13) % 80) - 40}px`, "--drift-y": `${-25 - (index * 7) % 90}px` } as CSSProperties} />)}</div>
      <div className="gallery-heading section-padding"><div><p className="eyebrow">03 / photographs</p><h2 id="gallery-title">In between.</h2></div><p>a few moments, kept close.</p></div>
      <div ref={viewportRef} className="photo-orbit" role="group" aria-roledescription="interactive photo gallery" aria-label="Orbit of photographs" aria-describedby="gallery-help">
        <div className="gallery-atmosphere" aria-hidden="true" />
        <div ref={spaceRef} className="photo-space">
          {indices.map((index) => <OrbitImage key={photos[index].id} photo={photos[index]} index={index} active={index === activeIndex}
            bind={(element) => { if (element) { images.current.set(index, element); refresh(); } else images.current.delete(index); }} onSelect={() => select(index)} />)}
        </div>
      </div>
      <div className="gallery-controls section-padding">
        <p id="gallery-help"><MoveHorizontal size={16} strokeWidth={1.2} /><span>Drag to explore<span className="gallery-help-extra"> · select to look closer</span></span></p>
        <div className="gallery-navigation"><button className="gallery-icon-button" onClick={() => move(-1)} aria-label="Previous photograph"><ArrowLeft size={17} strokeWidth={1.3} /></button>
          <span className="gallery-counter"><span>{String(activeIndex + 1).padStart(2, "0")}</span><i>/</i>{String(photos.length).padStart(2, "0")}</span>
          <button className="gallery-icon-button" onClick={() => move(1)} aria-label="Next photograph"><ArrowRight size={17} strokeWidth={1.3} /></button></div>
        <button className="gallery-motion" onClick={() => setPaused((value) => !value)} disabled={reducedMotion} aria-pressed={paused || reducedMotion}
          aria-label={reducedMotion ? "Motion disabled by stillness preference" : paused ? "Resume photo orbit" : "Pause photo orbit"}>
          {paused || reducedMotion ? <Play size={12} strokeWidth={1.3} /> : <Pause size={12} strokeWidth={1.3} />}<span>{paused || reducedMotion ? "Stillness" : "Slow orbit"}</span></button>
      </div>
      <p className="sr-only">Use left and right arrow keys to explore. Home and End reach the first and last photograph. Enter opens the centered photograph. Escape closes it.</p>
      {viewer && <PhotoViewer photos={photos} index={viewer.index} origin={viewer.origin} reducedMotion={reducedMotion} onClose={closeViewer}
        onChange={(index) => { returnIndex.current = index; setViewer((previous) => previous ? { ...previous, index } : null); }} />}
    </section>
  );
}
