import * as util from './util.js'
import { store } from './store.js'

// const exp = new MicroBooNE();
// console.log(exp);
// console.log(new ProtoDUNE());
// console.log(new ICARUS());
// console.log(new DUNE10ktWorkspace());
// console.log(new DUNE35t());
// console.log(exp.toLocalXYZ([0, 0, 0]));



// // init scene
// xhr.then(function () {
//     // let bee = $("#container").BEE(config);
// });


store.xhr.init.then(() => {
    console.log('bee store: ', store);
});

