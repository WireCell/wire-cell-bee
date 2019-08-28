import { Config } from './config.js'



let xhr = $.getJSON(window.location.href, function(data){
    $.extend(true, Config, data);
    console.log('server Config: ', Config);
}); // server Config

xhr.then(function(){
    // $.extend(true, Config, {
    //   material: {
    //     opacity: 0.2
    //   }
    // }); // user Config
    console.log('init everthing ...')
    // let bee = $("#container").BEE(Config);
});