import type {Rarity} from "@/types";export function RarityBadge({rarity}:{rarity:Rarity}){return <span className={`badge ${rarity}`}>{rarity}</span>}
