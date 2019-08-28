import * as util from './util.js'
import { config } from './config.js'
import { MicroBooNE, ProtoDUNE, ICARUS, DUNE10ktWorkspace, DUNE35t } from './experiment.js'


let exp = new MicroBooNE();
console.log(exp);
console.log(new ProtoDUNE());
console.log(new ICARUS());
console.log(new DUNE10ktWorkspace());
console.log(new DUNE35t());
console.log(exp.toLocalXYZ([0, 0, 0]));

let xhr = $.getJSON(window.location.href, function (data) {
    $.extend(true, config, data);
    console.log('server config: ', data);
    console.log('user config: ', config);
}); // server config

xhr.then(function () {
    // $.extend(true, config, {
    //   material: {
    //     opacity: 0.2
    //   }
    // }); // user config
    console.log('init everthing ...')
    // let bee = $("#container").BEE(config);
});