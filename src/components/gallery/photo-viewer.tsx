"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { GalleryPhoto } from "@/content/photos";
import { wrapPhoto } from "@/lib/photo-orbit";

export type PhotoOrigin = { left: number; top: number; width: number; height: number };

export function PhotoViewer({ photos, index, origin, reducedMotion, onClose, onChange }: {
  photos: GalleryPhoto[]; index: number; origin: PhotoOrigin; reducedMotion: boolean;
  onClose: () => void; onChange: (index: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const openedIndex = useRef(index);
  const closing = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const photo = photos[index];

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const element = figure.current;
    if (reducedMotion || !element || index !== openedIndex.current) { onClose(); return; }
    const rect = element.getBoundingClientRect();
    const animation = element.animate([
      { transform: "translate(0, 0) scale(1)" },
      { transform: `translate(${origin.left - rect.left}px, ${origin.top - rect.top}px) scale(${origin.width / rect.width}, ${origin.height / rect.height})` },
    ], { duration: 420, easing: "cubic-bezier(.22,.68,0,1)", fill: "forwards" });
    dialog.current?.setAttribute("data-closing", "true");
    animation.finished.then(onClose).catch(onClose);
  }, [index, origin, reducedMotion, onClose]);

  useEffect(() => {
    const element = dialog.current;
    const image = figure.current;
    if (!element || !image) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const rect = image.getBoundingClientRect();
    const animation = !reducedMotion ? image.animate([
      { transform: `translate(${origin.left - rect.left}px, ${origin.top - rect.top}px) scale(${origin.width / rect.width}, ${origin.height / rect.height})` },
      { transform: "translate(0, 0) scale(1)" },
    ], { duration: 650, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }) : null;
    return () => { animation?.cancel(); element.close(); document.body.style.overflow = overflow; };
  }, [origin, reducedMotion]);

  const change = (step: number) => { if (!closing.current) { setFailed(false); onChange(wrapPhoto(index + step, photos.length)); } };
  return createPortal(
    <dialog ref={dialog} className="photo-viewer" aria-label={`Photograph ${index + 1} of ${photos.length}`} onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); change(event.key === "ArrowRight" ? 1 : -1); }
        if (event.key === "Home" || event.key === "End") { event.preventDefault(); setFailed(false); onChange(event.key === "Home" ? 0 : photos.length - 1); }
      }}>
      <div className="photo-viewer-top"><span>In between.</span><button autoFocus className="gallery-icon-button" onClick={close} aria-label="Close photograph"><X size={20} strokeWidth={1.3} /></button></div>
      <div ref={figure} className="photo-viewer-image" style={{ "--viewer-ratio": photo.width / photo.height } as CSSProperties}
        onPointerDown={(event) => { if (event.isPrimary) swipe.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={(event) => { const start = swipe.current; swipe.current = null; if (start && Math.abs(event.clientX - start.x) > 55 && Math.abs(event.clientY - start.y) < 60) change(event.clientX < start.x ? 1 : -1); }}
        onPointerCancel={() => { swipe.current = null; }}>
        <Image key={photo.id} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} draggable={false}
          sizes="(max-width: 759px) 92vw, 85vw" loading="eager" onError={() => setFailed(true)} />
        {failed && <span className="photo-unavailable">Photograph unavailable. Use the arrows to continue.</span>}
      </div>
      <div className="photo-viewer-bottom"><button className="gallery-icon-button" onClick={() => change(-1)} aria-label="Previous photograph"><ArrowLeft size={18} strokeWidth={1.3} /></button>
        <span aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, "0")}<i>/</i>{String(photos.length).padStart(2, "0")}</span>
        <button className="gallery-icon-button" onClick={() => change(1)} aria-label="Next photograph"><ArrowRight size={18} strokeWidth={1.3} /></button></div>
    </dialog>, document.body,
  );
}
