import baseline from "./baseline.json";import type {StatKey,StatResult} from "@/types";
export const clamp=(n:number)=>Math.max(12,Math.min(99,Math.round(Number.isFinite(n)?n:0)));
export function percentile(key:StatKey,raw:number):number{const points=baseline[key];let i=0;while(i<points.length&&raw>=points[i])i++;if(i===0)return 12;if(i>=points.length)return 99;const t=(raw-points[i-1])/Math.max(1,points[i]-points[i-1]);return clamp(12+((i-1+t)/(points.length-1))*87)}
export const result=(key:StatKey,raw:number,reasons:string[]):StatResult=>({score:percentile(key,raw),raw:Number.isFinite(raw)?raw:0,reasons:reasons.slice(0,3)});
