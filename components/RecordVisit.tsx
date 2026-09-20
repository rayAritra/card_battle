"use client";

import { useEffect } from "react";
import { pushRecent } from "@/lib/utils/recents";

interface RecordVisitProps {
  address: string;
  name: string | null;
  archetype: string;
  level: number;
}

/**
 * Records a card view in the browser's recent list. Renders nothing.
 *
 * Mounted on the card page so returning visitors get their history back on
 * the landing page without an account, a cookie or a server write.
 */
export function RecordVisit({ address, name, archetype, level }: RecordVisitProps) {
  useEffect(() => {
    pushRecent({ address, name, archetype, level });
  }, [address, name, archetype, level]);

  return null;
}
