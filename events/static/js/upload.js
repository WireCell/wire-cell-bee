Dropzone.options.myAwesomeDropzone = false;
Dropzone.autoDiscover = false;

(function( $, window, document, undefined ) {
    var base_url = window.location.href.replace('#',"");
    base_url = base_url.replace(/\/?$/, '/');

    var dz = new Dropzone("#dropzone", {
        // autoProcessQueue : false,
        maxFilesize: 500,  // MB
        accept: function(file, done) {
            if (file.name.substr(-3) == "zip") {
                done();
            }
            else {
                console.log(file.name.substr(-3));
                done("incorrect file format");
            }
        },

        init : function() {
            this.on("success", function(f) {
                var name = f.xhr.response;
                // console.log();
                window.location.replace(base_url+'set/'+name+'/event/list/')
            });
        }
    });

})( jQuery, window, document );
