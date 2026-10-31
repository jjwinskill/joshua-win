// True once an element has come close to the viewport, and it stays true. Heavy figures wait for this,
// so a reader who never gets there never pays for them.
import { useEffect, useRef, useState } from 'react';

export function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true);
      },
      { rootMargin: '300px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, near };
}
