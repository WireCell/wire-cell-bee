import { config } from './config.js'
import { MicroBooNE, ProtoDUNE, ICARUS, DUNE10ktWorkspace, DUNE35t } from './experiment.js'


console.log(new MicroBooNE());
console.log(new ProtoDUNE());
console.log(new ICARUS());
console.log(new DUNE10ktWorkspace());
console.log(new DUNE35t());

let xhr = $.getJSON(window.location.href, function(data){
    $.extend(true, config, data);
    console.log('server config: ', data);
    console.log('user config: ', config);
}); // server config

xhr.then(function(){
    // $.extend(true, config, {
    //   material: {
    //     opacity: 0.2
    //   }
    // }); // user config
    console.log('init everthing ...')
    // let bee = $("#container").BEE(config);
});