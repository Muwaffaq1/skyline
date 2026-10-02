// Two stacked gradient layers that crossfade when the sky token changes
// (CSS can't smoothly transition multi-stop gradients). Under
// prefers-reduced-motion the swap is instant via the animation being disabled.

import { useEffect, useRef, useState } from "react";
import type { SkyToken } from "../lib/sky";

interface Layer {
  token: SkyToken;
  key: number;
}

export function GradientBackground({ token }: { token: SkyToken }) {
  const [layers, setLayers] = useState<Layer[]>([{ token, key: 0 }]);
  const nextKey = useRef(1);

  useEffect(() => {
    setLayers((prev) => {
      const top = prev[prev.length - 1];
      if (top.token === token) return prev;
      // Keep at most two layers: old one underneath, new one fading in.
      return [prev[prev.length - 1], { token, key: nextKey.current++ }];
    });
  }, [token]);

  const handleFadeIn = (index: number) => {
    if (index > 0) {
      setLayers((prev) => prev.slice(1));
    }
  };

  return (
    <div className="sky" aria-hidden="true">
      {layers.map((layer, i) => (
        <div
          key={layer.key}
          className="sky-layer"
          data-sky={layer.token}
          onAnimationEnd={() => handleFadeIn(i)}
        />
      ))}
    </div>
  );
}