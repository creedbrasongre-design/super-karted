import fs from 'node:fs';
import {loadIndex,saveIndex,extractCode,decodeCode,ingestCreation,ingestEventBatch,maintain} from './neon-workshop-lib.mjs';

function getInput(){
  if(process.env.WORKSHOP_CODE?.trim())return {code:process.env.WORKSHOP_CODE.trim(),issue:null};
  const eventPath=process.env.GITHUB_EVENT_PATH;if(!eventPath||!fs.existsSync(eventPath))throw new Error('No GitHub event or manual code was provided');
  const ev=JSON.parse(fs.readFileSync(eventPath,'utf8')),body=ev.issue?.body||'';return {code:extractCode(body),issue:ev.issue?.number||null};
}
let result={ok:false,status:'error',message:'Unknown error'};
try{
 const {code,issue}=getInput(),index=loadIndex();
 if(issue&&index.meta.processedIssues.includes(issue)){result={ok:true,status:'already-processed',message:'This GitHub issue was already processed.',issue};}
 else{
   const packet=decodeCode(code);let message='';
   if(packet?.kind==='creation'||packet?.creation){const c=ingestCreation(index,packet);message='Published '+c.title+' ('+c.id+') v'+c.version+'.';}
   else if(packet?.kind==='event-batch'||Array.isArray(packet?.events)){const n=ingestEventBatch(index,packet);message='Synced '+n+' new community event'+(n===1?'':'s')+'.';}
   else if(packet?.kind==='share'&&packet?.creation){const c=ingestCreation(index,{creation:packet.creation});message='Published shared creation '+c.title+'.';}
   else throw new Error('Unsupported Workshop packet');
   if(issue){index.meta.processedIssues.push(issue);if(index.meta.processedIssues.length>2500)index.meta.processedIssues.splice(0,index.meta.processedIssues.length-2500);}
   maintain(index);saveIndex(index);result={ok:true,status:'published',message,issue};
 }
}catch(e){console.error(e);result={ok:false,status:'error',message:String(e?.message||e)};process.exitCode=1;}
fs.writeFileSync('.workshop-result.json',JSON.stringify(result,null,2)+'\n');
console.log(result.message);
