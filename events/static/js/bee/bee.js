import * as util from './util.js'
import { store } from './store.js'
import { MicroBooNE, ProtoDUNE, ICARUS, DUNE10ktWorkspace, DUNE35t } from './experiment.js'


const exp = new MicroBooNE();
console.log(exp);
console.log(new ProtoDUNE());
console.log(new ICARUS());
console.log(new DUNE10ktWorkspace());
console.log(new DUNE35t());
console.log(exp.toLocalXYZ([0, 0, 0]));

// init data store
let xhr = $.getJSON(window.location.href, function (data) {
    $.extend(true, store.event, data);
    $.extend(true, store.experiment.tpc, exp.tpc);
    console.log('server data: ', data);
    console.log('bee store: ', store);
}); // server config



// init scene
xhr.then(function () {
    // let bee = $("#container").BEE(config);
});