import type {Stats} from "@/types";export const computeLevel=(s:Stats)=>Math.max(1,Math.min(99,Math.round((s.experience.score*1.3+s.trading.score+s.defi.score+s.holding.score+s.risk.score)/5.3)));
