import { resilient } from "./shared";
export async function resolveEns(address:string):Promise<string|null>{return resilient("ens",async()=>{const r=await fetch(`https://api.ensideas.com/ens/resolve/${address}`,{next:{revalidate:86400}});if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json() as {name?:unknown};return typeof j.name==="string"?j.name:null},null)}
