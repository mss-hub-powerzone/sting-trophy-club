// Minimal structural contracts used by this application (provided by Workers).
interface D1Result<T=Record<string,unknown>> {results:T[];meta:{changes:number};success:boolean;}
interface D1PreparedStatement {
 bind(...values:unknown[]):D1PreparedStatement;
 first<T=Record<string,unknown>>(column?:string):Promise<T|null>;
 all<T=Record<string,unknown>>():Promise<D1Result<T>>;
 run<T=Record<string,unknown>>():Promise<D1Result<T>>;
}
interface D1Database {prepare(sql:string):D1PreparedStatement;batch(statements:D1PreparedStatement[]):Promise<D1Result[]>;}
interface Fetcher {fetch(request:Request):Promise<Response>;}
declare module 'cloudflare:workers' {export const env:{[key:string]:any};}
