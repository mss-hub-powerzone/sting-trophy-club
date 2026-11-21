import {database} from '../tournaments/access.server';
export async function springDb(){const db=database();await db.batch([
 db.prepare("CREATE TABLE IF NOT EXISTS spring_2027_responses (player_id TEXT PRIMARY KEY,answers TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL)"),
 db.prepare("CREATE TABLE IF NOT EXISTS spring_2027_guests (id TEXT PRIMARY KEY,dedupe TEXT UNIQUE NOT NULL,details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL)"),
 db.prepare("CREATE TABLE IF NOT EXISTS spring_2027_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)")]);return db;}
export async function details(db:any){const r=await db.prepare("SELECT value FROM spring_2027_settings WHERE key='plan'").first();return r?JSON.parse(r.value):{updates:'All events are proposed. Team entry, acceptance, final player fees and travel plans will be announced here.',events:{}};}
