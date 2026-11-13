"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp, photoDistance, photoPose, wrapPhoto } from "@/lib/photo-orbit";

type Options = { count: number; reducedMotion: boolean; paused: boolean; viewing: boolean };
type Controller = { move: (step: number) => void; focus: (index: number, settled?: () => void) => void; refresh: () => void; jump: (index: number) => void };

export function useOrbitInteraction({ count, reducedMotion, paused, viewing }: Options) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef<HTMLDivElement>(null);
  const images = useRef(new Map<number, HTMLButtonElement>());
  const position = useRef(0);
  const controller = useRef<Controller | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const space = spaceRef.current;
    if (!section || !viewport || !space || !count) return;

    let width = viewport.clientWidth;
    let arrival = 0;
    let previousScroll = 0;
    let visible = false;
    let frame = 0;
    let settledFrame = 0;
    let lastTime = 0;
    let velocity = 0;
    let target: number | null = null;
    let onSettled: (() => void) | undefined;
    let resumeAt = performance.now() + 2800;
    let hovering = false;
    let focused = false;
    let pointer: { id: number; x: number; y: number; lastX: number; lastTime: number; dragging: boolean } | null = null;
    let suppressClick = false;
    let cursorX = 0;
    let cursorY = 0;
    let tiltX = 0;
    let tiltY = 0;
    let lastCurrent = wrapPhoto(Math.round(position.current), count);

    const draw = (dt: number) => {
      tiltX += (cursorX - tiltX) * (1 - Math.exp(-dt * 5));
      tiltY += (cursorY - tiltY) * (1 - Math.exp(-dt * 5));
      space.style.transform = reducedMotion ? "none" : `rotateX(${-tiltY * 1.5}deg) rotateY(${tiltX * 2}deg)`;
      for (const [index, image] of images.current) {
        const distance = photoDistance(index, position.current, count);
        const pose = photoPose(distance, width, arrival, reducedMotion);
        image.style.transform = `translate(-50%, -50%) translate3d(${pose.x}px, ${pose.y}px, ${pose.z}px) rotateY(${pose.turn}deg) rotateZ(${pose.tilt}deg) scale(${pose.scale})`;
        image.style.opacity = String(pose.opacity);
        image.style.visibility = pose.opacity < 0.005 ? "hidden" : "visible";
        image.style.pointerEvents = Math.abs(distance) < (width < 760 ? 1.6 : 3.7) && pose.opacity > 0.15 ? "auto" : "none";
      }
      const nearest = wrapPhoto(Math.round(position.current), count);
      if (nearest !== lastCurrent) { lastCurrent = nearest; setActiveIndex(nearest); }
    };

    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((now - (lastTime || now - 16)) / 1000, 0.035);
      lastTime = now;
      if (!pointer?.dragging && !viewing) {
        if (target !== null) {
          if (reducedMotion) { position.current = target; velocity = 0; }
          else {
            velocity += (target - position.current) * 62 * dt;
            velocity *= Math.exp(-14 * dt);
            position.current += velocity * dt;
          }
          if (Math.abs(target - position.current) < 0.003 && Math.abs(velocity) < 0.025) {
            position.current = target;
            target = null;
            velocity = 0;
            const callback = onSettled;
            onSettled = undefined;
            viewport.removeAttribute("data-selecting");
            if (callback) settledFrame = requestAnimationFrame(() => { settledFrame = 0; callback(); });
          }
        } else if (!reducedMotion && !paused && !hovering && !focused && now > resumeAt && arrival > 0.8) {
          position.current += dt * 0.035;
        }
      }
      draw(dt);
      if (!reducedMotion || target !== null) frame = requestAnimationFrame(tick);
    };

    const wake = () => { if (!frame && visible && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(tick); } };
    const settle = (next: number, callback?: () => void) => {
      if (Math.abs(next - position.current) > 4) { position.current = next; velocity = 0; }
      target = next;
      onSettled = callback;
      resumeAt = performance.now() + 6500;
      if (callback) viewport.setAttribute("data-selecting", "true");
      wake();
    };
    controller.current = {
      move: (step) => settle((target ?? Math.round(position.current)) + step),
      focus: (index, callback) => settle(position.current + photoDistance(index, position.current, count), callback),
      refresh: wake,
      jump: (index) => { position.current += photoDistance(index, position.current, count); target = null; velocity = 0; draw(0.016); wake(); },
    };

    const measureScroll = () => {
      const rect = section.getBoundingClientRect();
      const next = clamp((window.innerHeight - rect.top) / (window.innerHeight * 0.83));
      if (visible && !reducedMotion && !viewing && !pointer && target === null && !hovering && !focused) {
        position.current += (next - previousScroll) * 0.6;
      }
      arrival = next;
      previousScroll = next;
      section.style.setProperty("--photo-arrival", String(next));
      wake();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { measureScroll(); wake(); }
      else { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: "100px 0px" });
    observer.observe(section);
    const resize = new ResizeObserver(() => { width = viewport.clientWidth; measureScroll(); });
    resize.observe(viewport);

    const down = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || viewing) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastTime: event.timeStamp, dragging: false };
      suppressClick = false;
      velocity = 0;
      target = null;
      onSettled = undefined;
    };
    const move = (event: PointerEvent) => {
      if (pointer && event.pointerId === pointer.id) {
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (!pointer.dragging && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { pointer = null; return; }
        if (!pointer.dragging && Math.abs(dx) > 7) {
          pointer.dragging = true;
          suppressClick = true;
          viewport.setPointerCapture(event.pointerId);
          viewport.setAttribute("data-dragging", "true");
        }
        if (pointer.dragging) {
          const elapsed = Math.max(8, event.timeStamp - pointer.lastTime) / 1000;
          const delta = -(event.clientX - pointer.lastX) / (width < 760 ? 175 : 235);
          velocity = clamp(velocity * 0.65 + delta / elapsed * 0.35, -3.2, 3.2);
          position.current += delta;
          draw(0.016);
        }
        pointer.lastX = event.clientX;
        pointer.lastTime = event.timeStamp;
      } else if (event.pointerType === "mouse" && !reducedMotion) {
        const rect = viewport.getBoundingClientRect();
        cursorX = clamp((event.clientX - rect.left) / width * 2 - 1, -1, 1);
        cursorY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      }
    };
    const up = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const dragged = pointer.dragging;
      pointer = null;
      viewport.removeAttribute("data-dragging");
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      if (dragged) settle(Math.round(position.current + (reducedMotion ? 0 : velocity * 0.17)));
      resumeAt = performance.now() + 6500;
    };
    const click = (event: MouseEvent) => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovering = true;
      if (!pointer && target === null) settle(Math.round(position.current));
    };
    const leave = () => { hovering = false; cursorX = 0; cursorY = 0; resumeAt = performance.now() + 2000; };
    const focusIn = () => { focused = true; if (target === null && !pointer) settle(Math.round(position.current)); };
    const focusOut = (event: FocusEvent) => { if (!section.contains(event.relatedTarget as Node)) focused = false; };
    const key = (event: KeyboardEvent) => {
      if (viewing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "Home" || event.key === "End") controller.current?.focus(event.key === "Home" ? 0 : count - 1);
        else controller.current?.move(event.key === "ArrowRight" ? 1 : -1);
        // Keep roving focus on the newly centered photo after keyboard travel.
        onSettled = () => images.current.get(wrapPhoto(Math.round(position.current), count))?.focus({ preventScroll: true });
      }
    };
    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", up);
    viewport.addEventListener("pointercancel", up);
    viewport.addEventListener("lostpointercapture", up);
    viewport.addEventListener("click", click, true);
    viewport.addEventListener("pointerenter", enter);
    viewport.addEventListener("pointerleave", leave);
    section.addEventListener("focusin", focusIn);
    section.addEventListener("focusout", focusOut);
    section.addEventListener("keydown", key);
    window.addEventListener("scroll", measureScroll, { passive: true });
    document.addEventListener("visibilitychange", wake);
    measureScroll();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(settledFrame);
      observer.disconnect(); resize.disconnect();
      viewport.removeEventListener("pointerdown", down); viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up); viewport.removeEventListener("pointercancel", up);
      viewport.removeEventListener("lostpointercapture", up); viewport.removeEventListener("click", click, true);
      viewport.removeEventListener("pointerenter", enter); viewport.removeEventListener("pointerleave", leave);
      section.removeEventListener("focusin", focusIn); section.removeEventListener("focusout", focusOut);
      section.removeEventListener("keydown", key); window.removeEventListener("scroll", measureScroll);
      document.removeEventListener("visibilitychange", wake);
      viewport.removeAttribute("data-selecting"); viewport.removeAttribute("data-dragging");
      controller.current = null;
    };
  }, [count, reducedMotion, paused, viewing]);

  const move = useCallback((step: number) => controller.current?.move(step), []);
  const focus = useCallback((index: number, settled?: () => void) => controller.current?.focus(index, settled), []);
  const refresh = useCallback(() => controller.current?.refresh(), []);
  const jump = useCallback((index: number) => controller.current?.jump(index), []);
  return { sectionRef, viewportRef, spaceRef, images, activeIndex, move, focus, refresh, jump };
}
