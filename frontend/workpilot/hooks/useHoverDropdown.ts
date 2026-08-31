"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useHoverDropdown(delay = 200) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const open = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsOpen(false), delay);
  }, [delay]);

  const close = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { isOpen, open, scheduleClose, close, setIsOpen };
}
