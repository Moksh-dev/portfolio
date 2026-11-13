export const wrapPhoto = (index: number, count: number) => ((index % count) + count) % count;
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const ease = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };

export function photoDistance(index: number, position: number, count: number) {
  return wrapPhoto(index - position + count / 2, count) - count / 2;
}

// A tilted elliptical path in actual CSS 3D space. Images turn independently;
// they are never attached to a rotating parent cylinder.
export function photoPose(distance: number, width: number, arrival: number, reduced: boolean) {
  const mobile = width < 760;
  const angle = distance * (mobile ? 0.93 : 0.64);
  const radius = mobile ? Math.min(width * 0.85, 390) : Math.min(width * 0.43, 650);
  const depth = mobile ? 310 : 460;
  const entrance = reduced ? 1 : ease((arrival - Math.abs(distance) * 0.045) / 0.66);
  const x = Math.sin(angle) * radius * (1 + (1 - entrance) * 0.45);
  const y = (1 - Math.cos(angle)) * -64 - Math.sin(angle) * 25 + (1 - entrance) * 65;
  const z = (Math.cos(angle) - 1) * depth - (1 - entrance) * 490;
  const visibility = ease(((mobile ? 2.35 : 4.65) - Math.abs(distance)) / 0.65);
  return {
    x, y, z,
    turn: reduced ? 0 : -Math.sin(angle) * 43,
    tilt: reduced ? 0 : -Math.sin(angle) * 3,
    opacity: visibility * entrance * (0.22 + 0.78 * ((Math.cos(angle) + 1) / 2) ** 1.5),
    scale: reduced ? (Math.abs(distance) < 0.5 ? 1 : 0.83) : 0.86 + entrance * 0.14,
  };
}
