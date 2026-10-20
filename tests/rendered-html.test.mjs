import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('public pages render inside the Cloudflare runtime',async()=>{
 process.env.WRANGLER_LOG_PATH='.wrangler/logs';
 process.env.WRANGLER_REGISTRY_PATH='.wrangler/test-registry';
 process.env.WRANGLER_SEND_METRICS='false';
 const config=JSON.parse(fs.readFileSync('dist/server/wrangler.json','utf8'));
 config.name='sting-render-test';config.main=path.resolve('dist/server/index.js');
 config.assets.directory=path.resolve('dist/client');config.d1_databases=[];config.send_email=[];config.vars={};
 fs.mkdirSync('.sites-runtime',{recursive:true});
 const configPath=path.resolve('.sites-runtime/render-test.json');fs.writeFileSync(configPath,JSON.stringify(config));
 const {unstable_dev}=await import('wrangler');
 const worker=await unstable_dev(config.main,{config:configPath,local:true,port:0,inspectorPort:0,logLevel:'error',experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false}});
 try{
  const root=await worker.fetch('/');assert.equal(root.status,200);const home=await root.text();assert.match(home,/Sting Trophy Club/);assert.doesNotMatch(home,/<meta[^>]*name=["']codex-preview["']/i);
  const hub=await worker.fetch('/tournaments');assert.equal(hub.status,200);const html=await hub.text();assert.match(html,/Fall 2026 Family Hub/);assert.match(html,/Family sign in/);assert.doesNotMatch(html,/photos\.app\.goo\.gl|signin-with-chatgpt/);
 }finally{await worker.stop();}
});

