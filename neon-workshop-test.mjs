import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {emptyIndex,extractCode,decodeCode,ingestCreation,ingestEventBatch,maintain,difficulty} from './neon-workshop-lib.mjs';
function code(prefix,obj){return prefix+'1'+zlib.gzipSync(Buffer.from(JSON.stringify(obj))).toString('base64url');}
const creationPacket={schema:1,kind:'creation',creation:{kind:'race',title:'TEST TRACK',creator:{id:'tester-1',name:'TESTER'},version:1,tags:['RACE','STUNT'],rules:{mode:'race',laps:3},payload:{level:{version:1,name:'TEST TRACK',data:{edMode:'race',edCells:[]}}}}};
const ndw=code('NDW',creationPacket);
assert.deepEqual(decodeCode(ndw).creation.title,'TEST TRACK');
assert.equal(extractCode('### Workshop code\n```text\n'+ndw+'\n```'),ndw);
const index=emptyIndex(),c=ingestCreation(index,decodeCode(ndw));
assert.equal(index.creations.length,1);assert.equal(c.kind,'race');
const batch={schema:1,kind:'event-batch',events:[
 {id:'e1',type:'play',creationId:c.id,actor:{id:'p1',name:'P1'},data:{}},
 {id:'e2',type:'finish',creationId:c.id,actor:{id:'p1',name:'P1'},data:{won:true,time:62}},
 {id:'e3',type:'like',creationId:c.id,actor:{id:'p1',name:'P1'},data:{}},
 {id:'e4',type:'rating',creationId:c.id,actor:{id:'p1',name:'P1'},data:{key:'fun',value:5}},
 {id:'e5',type:'reaction',creationId:c.id,actor:{id:'p1',name:'P1'},data:{reaction:'creative'}},
 {id:'e6',type:'comment',creationId:c.id,actor:{id:'p1',name:'P1'},data:{text:'Great track'}},
 {id:'e7',type:'fall',creationId:c.id,actor:{id:'p1',name:'P1'},data:{x:123,z:456}},
 {id:'e8',type:'follow',creationId:null,actor:{id:'p1',name:'P1'},data:{creatorId:'tester-1',creatorName:'TESTER'}}
]};
const nde=code('NDE',batch);assert.equal(decodeCode(nde).events.length,8);assert.equal(ingestEventBatch(index,decodeCode(nde)),8);maintain(index);
assert.equal(c.stats.plays,1);assert.equal(c.stats.finishes,1);assert.equal(c.stats.likes,1);assert.equal(c.ratings.fun,5);assert.equal(c.comments.length,1);assert.equal(c.stats.falls,1);assert.match(c.analytics.topFallZone,/100,500/);assert.equal(index.creators['tester-1'].followers,1);assert.equal(difficulty({...c,stats:{plays:100,completionRate:.1}}),'LEGENDARY');
// Event ID idempotency.
assert.equal(ingestEventBatch(index,batch),0);assert.equal(c.stats.plays,1);
console.log('Neon Workshop tests passed.');
