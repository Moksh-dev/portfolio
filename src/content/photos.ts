import manifest from "./photos.json";

export type GalleryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const galleryPhotos: GalleryPhoto[] = manifest;
