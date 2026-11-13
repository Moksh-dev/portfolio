import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { GalleryPhoto } from "@/content/photos";

export function OrbitImage({ photo, index, active, bind, onSelect }: {
  photo: GalleryPhoto; index: number; active: boolean;
  bind: (element: HTMLButtonElement | null) => void; onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <button ref={bind} type="button" className="orbit-photo" data-photo-index={index} data-active={active || undefined}
      aria-label={`View photograph ${index + 1}: ${photo.alt}`} aria-current={active ? "true" : undefined}
      tabIndex={active ? 0 : -1} onClick={onSelect}
      style={{ "--photo-ratio": photo.width / photo.height, viewTransitionName: active ? "gallery-photo" : "none" } as CSSProperties}>
      <Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} draggable={false}
        sizes="(max-width: 759px) 290px, 380px" onError={() => setFailed(true)} />
      {failed && <span className="photo-unavailable">Photograph unavailable</span>}
      <span className="photo-open-mark" aria-hidden="true">↗</span>
    </button>
  );
}
