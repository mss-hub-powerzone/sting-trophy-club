import {database,runtime,sameOrigin,json} from '../../../access.server';
import {requestCode} from '../../../auth-core.mjs';
export async function POST(req:Request){
 const raw=await req.text();if(raw.length>2048)return json({error:'Request too large.'},413);
 if(!sameOrigin(req))return json({error:'Refresh the page before signing in.'},403);
 try{
  const b=JSON.parse(raw),env=runtime();
  if(!env.TOURNAMENTS_EMAIL||!env.TOURNAMENTS_AUTH_SECRET||!env.TOURNAMENTS_FROM_EMAIL)return json({error:'Email sign-in is being configured. Please try again later.'},503);
  const result=await requestCode({db:database(),secret:env.TOURNAMENTS_AUTH_SECRET,email:b?.email,ip:req.headers.get('cf-connecting-ip')||'local',send:async(email:string,code:string)=>{
   await env.TOURNAMENTS_EMAIL!.send({from:{email:env.TOURNAMENTS_FROM_EMAIL!,name:'Sting Trophy Club'},to:email,subject:'Your Sting Trophy Club sign-in code',text:`Your sign-in code is ${code}. It expires in 10 minutes. Enter it at https://stingtrophyclub.com/tournaments. If you did not request this code, you can ignore this email. Never share this code.`});
  }});
  return json(result,'status' in result?result.status:200);
 }catch{return json({error:'Unable to send a code right now. Please try again later.'},503);}
}
