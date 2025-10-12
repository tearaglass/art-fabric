import { useEffect, useState } from 'react';
import { shameEngine } from '@/lib/affect/ShameEngine';
import { cosmosBus } from '@/lib/events/CosmosBus';
import type { FabricAffect } from '@/state/fabric';

/**
 * Hook to track affect state and wire UI interactions
 */
export function useShameEngine() {
  const [affect, setAffect] = useState<FabricAffect>(shameEngine.getAffect());

  useEffect(() => {
    const unsubHesitation = cosmosBus.on('affect/hesitation', () => {
      setAffect(shameEngine.getAffect());
    });

    const unsubOveractivity = cosmosBus.on('affect/overactivity', () => {
      setAffect(shameEngine.getAffect());
    });

    const unsubTone = cosmosBus.on('affect/tone', () => {
      setAffect(shameEngine.getAffect());
    });

    return () => {
      unsubHesitation();
      unsubOveractivity();
      unsubTone();
    };
  }, []);

  return {
    affect,
    trackHesitation: {
      onPointerEnter: () => shameEngine.startHesitation(),
      onPointerLeave: () => shameEngine.endHesitation(),
    },
    trackActivity: () => shameEngine.trackActivity(),
  };
}
