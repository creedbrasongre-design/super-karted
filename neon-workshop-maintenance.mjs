import {loadIndex,saveIndex,maintain} from './neon-workshop-lib.mjs';
const index=loadIndex();maintain(index);saveIndex(index);console.log('Neon Workshop maintenance complete:',index.creations.length,'creations,',Object.keys(index.creators).length,'creators.');
