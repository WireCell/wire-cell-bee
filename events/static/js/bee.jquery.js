// Utility
if ( typeof Object.create !== 'function' ) {
    Object.create = function( obj ) {
        function F() {};
        F.prototype = obj;
        return new F();
    };
}

(function( $, window, document, undefined ) {
    "use strict";
    var base_url = window.location.href.replace('#',"");
    var index_of_query_postion = base_url.indexOf('?');
    var base_query = "";
    if (index_of_query_postion>0) {
        base_query = base_url.substring(index_of_query_postion);
        base_url = base_url.substring(0, index_of_query_postion);
    }
    var event_url = base_url.substring(0, base_url.indexOf('event')) + 'event/';
    // console.log(index_of_query_postion, base_url, base_query, event_url);
    var root_url = base_url.substring(0, base_url.indexOf('set'));

    var listOfReconElems= {};
    var stats = new Stats();


    var USER_COLORS = {
        'dark' :     [
            0xffffff, // white
            0xFF8080, // light red
            0x96f97b, // light green
            0xffff14, // yellow
            0x95d0fc, // light blue
            0xe50000, // red
            0xbf77f6, // light purple
            0x0343df, // blue
            0xf97306, // orange
            0xc20078, // magenta
            0x15b01a, // green
            0x029386, // teal
            0xe6daa6, // beige
            0x7e1e9c // purple
        ],
        'light' : [
            0x0343df, // blue
            0xe50000, // red
            0x15b01a, // green
            0x7e1e9c, // purple
            0x95d0fc, // light blue
            0xc20078, // magenta
            0x029386, // teal
            0xff81c0, // pink
            0x96f97b, // light green
            0xbf77f6, // light purple
            0xe6daa6, // beige
            0xf97306, // orange
            0xffff14, // yellow
            0x000000, // black
        ]
    }

    // Tracks class
    var TRACK = {
        init: function(data) {
            var self = this;
            self.data = data;
            self.id = data.trackid;
            self.type = data.type;
            self.size = 0;
            self.initLine();
        },

        initLine: function() {
            var self = this;
            var material = new THREE.LineBasicMaterial( {
                color: 0xffffff,
                opacity: 1,
                linewidth: 3,
                vertexColors: THREE.VertexColors
            } );
            var geometry = new THREE.Geometry();
            var length = self.data['x'].length;
            for (var i=0; i<length; i++) {
                if (self.data['type'] != 1) {  // remove bad tracks for now
                    geometry.vertices.push(new THREE.Vector3(
                        toLocalX(self.data['x'][i]),
                        toLocalY(self.data['y'][i]),
                        toLocalZ(self.data['z'][i])));
                    var scale = 2;
                    var color = new THREE.Color();
                    color.setHSL(getColorAtScalar(self.data['dedx'][i], Math.pow(scale,2)*14000*2/3), 1, 0.5);
                    geometry.colors.push(color);
                    self.size +=1;
                }

            }
            // console.log(geometry);
            self.line = new THREE.Line(geometry, material);
        }
    }

    // clustering and tracking collections;
    var CT = {
        init: function(name) {
            var self = this;
            self.name = name;
            self.url = base_url + name + "-track/";
            self.tracks = [];

            self.loadData();

        },

        loadData: function() {
            var self = this;
            self.process = $.getJSON(self.url, function(data) {
                // console.log(data);
                var tracks = data['tracks'];
                for (var i=0; i<tracks.length; i++) {
                    var track = Object.create(TRACK);
                    var track_data = tracks[i];
                    track.init(track_data);
                    self.tracks.push(track);
                }
                // console.log(self.tracks);
                // self.initData(data);
                // self.initPointCloud();
            })
            .fail(function(){
                // console.log("load " + self.url + " failed");
            });
        }
    }

    // SST class
    var SST = {
        init: function(name, options) {
            var self = this;
            self.name = name;
            self.options = options;
            self.url = base_url + name + "/";
            self.index = -1;  // index in the options.sst
            self.containedIn = null; // caching the THREE.Group
            // self.COLORMAX = 14000*2/3.;
            self.chargeColor = new THREE.Color(0xFFFFFF);

            // self.setup();
        },

        setup: function() {
            var self = this;
            self.process = $.getJSON(self.url, function(data) {
                self.initData(data);
                self.initPointCloud();
                // self.process.responseJSON = null;
                // self.process.responseText = null;
            })
            .fail(function(){
                console.log("load " + self.url + " failed");
            });
            // console.log(self.process);
            return self.process;
        },

        initData: function(data) {
            var self = this;
            var size = data.x.length; // all data must have x
            var indices = [];
            for (var i = 0; i < size; i++) {
                if (data.q != undefined && data.q[i]<QTHRESH) continue;
                indices.push(i);
            }
            var size_reduced = indices.length;
            self.x = new Float32Array(size_reduced);
            self.y = new Float32Array(size_reduced);
            self.z = new Float32Array(size_reduced);
            self.q = new Float32Array(size_reduced);
            // self.nq = [];
            self.runNo = data.runNo;
            self.subRunNo = data.subRunNo;
            self.eventNo = data.eventNo;

            var QTHRESH = 0;
            if (self.name == "truth") {
                QTHRESH = 500;
            }
            for (var i = 0; i < size_reduced; i++) {
                // if (data.q != undefined && data.q[i]<QTHRESH) continue;
                self.x[i] = data.x[ indices[i] ];
                self.y[i] = data.y[ indices[i] ];
                self.z[i] = data.z[ indices[i] ];
                data.q == undefined
                    && (self.q[i] = 0)
                    || (self.q[i] = data.q[ indices[i] ]);
                // data.nq == undefined
                //     && self.nq.push(1)
                //     || self.nq.push(data.nq[i]);
            }
        },

        initPointCloud: function() {
            var self = this;
            var size = self.x.length;

            self.material = new THREE.PointCloudMaterial({
                vertexColors    : true,
                size            : 2,
                blending        : THREE.NormalBlending,
                opacity         : 0.,
                transparent     : true,
                depthWrite      : false,
                sizeAttenuation : false
            });
            if (self.name == self.options.sst[0]) self.material.opacity = self.options.material.opacity;
            self.bounds = {
                xmax: getMaxOfArray(self.x),
                xmin: getMinOfArray(self.x),
                ymax: getMaxOfArray(self.y),
                ymin: getMinOfArray(self.y),
                zmax: getMaxOfArray(self.z),
                zmin: getMinOfArray(self.z),
                xmean: getMeanOfArray(self.x),
                ymean: getMeanOfArray(self.y),
                zmean: getMeanOfArray(self.z)
            }
            self.drawInsideThreeFrames();
            // self.drawInsideBeamFrame()
        },

        drawInsideSlice: function(start, width) {
            var self = this;
            var size = self.x.length;

            if (!(self.containedIn == null)) {
                self.containedIn.remove(self.pointCloud);
            }

            // self.geometry = new THREE.Geometry();

            // for (var i=0; i<size; i++) {
            //     var x = toLocalX(self.x[i]);
            //     var y = toLocalY(self.y[i]);
            //     var z = toLocalZ(self.z[i]);
            //     if (x  < start || x > start+width) {
            //         continue;
            //     }
            //     self.geometry.vertices.push(new THREE.Vector3(x, y, z));
            //     // if (self.geometry.vertices.length==10) break;
            //     var color = new THREE.Color();
            //     if ($.fn.BEE.user_options.material.showCharge) {
            //         var scale = self.options.material.colorScale;
            //         color.setHSL(getColorAtScalar(self.q[i], Math.pow(scale,2)*14000*2/3), 1, 0.5);
            //         if ( self.name.indexOf('gray')>-1 ) {
            //             var gray = (color.r + color.g + color.b) / 3;
            //             color.setRGB(gray, gray, gray);
            //         }

            //     }
            //     else {
            //         color = self.chargeColor;
            //     }
            //     self.geometry.colors.push(color);
            // }

            var indices  = [];
            for (var i=0; i<size; i++) {
                var x = toLocalX(self.x[i]);
                var y = toLocalY(self.y[i]);
                var z = toLocalZ(self.z[i]);
                if (x  < start || x > start+width) {
                    continue;
                }
                indices.push(i);
            }
            var size_show = indices.length;
            var positions = new Float32Array( size_show * 3 );
            var colors = new Float32Array( size_show * 3 );
            for (var i=0; i<size_show; i++) {
                var ind = indices[i];
                // add position
                positions[i*3] = toLocalX(self.x[ind]);
                positions[i*3+1] = toLocalY(self.y[ind]);
                positions[i*3+2] = toLocalZ(self.z[ind]);
                // add color
                var color = new THREE.Color();
                if ($.fn.BEE.user_options.material.showCharge) {
                    var scale = self.options.material.colorScale;
                    color.setHSL(getColorAtScalar(self.q[ind], Math.pow(scale,2)*14000*2/3), 1, 0.5);
                    if ( self.name.indexOf('gray')>-1 ) {
                        var gray = (color.r + color.g + color.b) / 3;
                        color.setRGB(gray, gray, gray);
                    }
                }
                else {
                    color = self.chargeColor;
                }
                color.toArray( colors, i * 3 );
            }

            self.geometry = new THREE.BufferGeometry();
            self.geometry.dynamic = true;
            self.geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
            self.geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
            // geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
            // console.log(self.geometry.attributes.position);
            // console.log(self.geometry.attributes.color);

            self.geometry.attributes.position.needsUpdate = true;
            self.geometry.attributes.color.needsUpdate = true;

            self.pointCloud = new THREE.PointCloud(self.geometry, self.material);

            if (!(self.containedIn == null)) {
                self.containedIn.add(self.pointCloud);
            }
        },

        drawInsideThreeFrames: function() {
            this.drawInsideSlice(-3*this.options.geom.halfx, this.options.geom.halfx*6);
        },

        drawInsideBeamFrame: function() {
            this.drawInsideSlice(-this.options.geom.halfx, this.options.geom.halfx*2);
        },

        selected: function() {
            var self = this;
            $.fn.BEE.current_sst = this;
            // console.log($.fn.BEE.current_sst);
            var el = $('#sst');
            el.html(this.name);
            el.show();
            if (this.material == undefined) { // load sst on demand
                this.setup();
                this.scene3D.registerSST(this);
                this.process.then(function(){
                    $.fn.BEE.ui_sst.$el_size.slider("value", self.material.size);
                    $.fn.BEE.ui_sst.$el_opacity.slider("value", self.material.opacity);
                    $.fn.BEE.ui_sst.$el_color.val('#'+self.chargeColor.getHexString());
                }, function(){});
            }
            else {
                $.fn.BEE.ui_sst.$el_size.slider("value", self.material.size);
                $.fn.BEE.ui_sst.$el_opacity.slider("value", self.material.opacity);
                $.fn.BEE.ui_sst.$el_color.val('#'+self.chargeColor.getHexString());
            }
            for (var name in listOfReconElems) {
                listOfReconElems[name].css('color', 'white');
            }
            listOfReconElems[this.name].css('color', '#f97306');
            // console.log($.fn.BEE.ui_sst.$el_color.val());
        }

        // toLocalX: function(value) { return value - this.options.geom.center[0]; },
        // toLocalY: function(value) { return value - this.options.geom.center[1]; },
        // toLocalZ: function(value) { return value - this.options.geom.center[2]; }
    };


    // Scene3D class
    var Scene3D = {
        init: function(options, elem) {
            var self = this;
            self.$elem = elem;
            // self.$elem = $( elem );
            self.options = options;
            // self.el_slice_x = $('#slice_x');
            // self.el_slice_number = $('#slice_number');
            self.el_statusbar = $('#statusbar');
            self.el_bee = $('container');

            self.setup();
        },

        setup: function() {
            // shorthands
            var self = this;

            // keep the order of the following initilizaitons
            self.initGui();

            self.initCamera();
            self.initScene();

            self.initHelper();
            self.initSlice();

            self.initRenderer();
            self.initObitController();
            self.animate();

            if (self.options.hasMC) {
                self.initMC();  // load MC tracks
            }
            else {
                var loading_el = $('#loadingbar');
                loading_el.html(loading_el.html()
                    + "<br /><strong class='info'>Info:</strong> No MC found, skiping. ");
            }
            self.initSST(); // SST's are added asynchronously into the scene
            self.initCT();
            self.initDeadArea();

            self.initGuiSlice();
            self.initGuiCamera();

            self.initStats();

            self.addEventListener();
            $('.dg .c select').css({
                'width': 136,
                'padding': 0,
                'margin': '1px',
                'height': 'auto'
            });
            $('.dg .c input').css({
                'margin-top': 0
            });

        },

        initStats: function() {
            stats.dom.style.position = 'relative';
            stats.dom.style.float = 'left';
            stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            $('#statsbar').append(stats.dom);
        },

        initGui: function() {
            var self = this;
            self.gui = new dat.GUI();
            self.initGuiController();

            self.initGuiGeneral();
        },

        initGuiController: function() {
            var self = this;

            self.guiController = {
                display: "WireCell-charge",
                slice: {
                    sliced_mode: false,
                    width: self.options.slice.width,
                    position: -$.fn.BEE.user_options.geom.halfx + self.options.slice.width/2,
                    opacity: self.options.slice.opacity,
                    color: 0x00FFFF
                }
            };
            if (self.options.theme=='light') {
                self.guiController.slice.color = 0xFF0000;
            }
        },

        initGuiGeneral: function() {
            var self = this;
            var ctrl = self.guiController;

            var folder_general = self.gui.addFolder("General");
            var folder_recon = self.gui.addFolder("Recon");
            // console.log(self.gui.__folders.Recon)
            var options = {
                'id' : $.fn.BEE.user_options.id
            };
            folder_general.add(options, 'id', 0, $.fn.BEE.user_options.nEvents-1)
                .name("Event").step(1)
                .onFinishChange(function(value) {
                    // console.log($.fn.BEE.user_options.id, value);
                    if (value == $.fn.BEE.user_options.id) { return; }
                    window.location.assign(event_url + value + '/' + base_query);
                });

            folder_general.add(ctrl, 'display', self.options.sst)
               .name("Display")
               .onChange(function(value) {
                    var ssts = self.listOfSST;
                    var sst;
                    for (var name in ssts) {
                        sst = ssts[name];
                        if (name == value) sst.material.opacity = self.options.material.opacity;
                        else sst.material.opacity = 0;
                        sst.material.needsUpdate = true;
                        checkSST(sst);
                    }
               });

            folder_general.add($.fn.BEE.user_options, 'theme', ['dark', 'light'])
               .name("Theme")
               .onChange(function(value) {
                    clearLocalStorage();
                    $(window).unbind('beforeunload');
                    var new_query;
                    if (base_query.indexOf('theme=light')>0) {
                        new_query = base_query.replace('theme=light', 'theme='+value);
                    }
                    else if (base_query.indexOf('theme=dark')>0) {
                        new_query = base_query.replace('theme=dark', 'theme='+value);
                    }
                    else {
                        if (base_query == "") {
                            new_query = base_query+'?theme='+value;
                        }
                        else {
                            new_query = base_query+'&theme='+value;
                        }
                    }
                    window.location.assign(base_url+new_query);
               });

            folder_general.add($.fn.BEE.user_options.material, "showCharge")
                .name("Show Charge")
                .onChange(function(value) {
                    self.redrawAllSST();
                });
            folder_general.add($.fn.BEE.user_options.helper, "showTPCs")
                .name("Show TPCs")
                .onChange(function(value) {
                    if (value) {
                        self.group_main.add(self.group_helper);
                    }
                    else {
                        self.group_main.remove(self.group_helper);
                    }
                });
            folder_general.add($.fn.BEE.user_options.helper, "showAxises")
                .name("Show Axises")
                .onChange(function(value) {
                    if (value) {
                        self.scene.add(self.axises);
                    }
                    else {
                        self.scene.remove(self.axises);
                    }
                });
            folder_general.add($.fn.BEE.user_options.material, "colorScale", 0., 1.9)
                .name("Color-scale")
                .step(0.01)
                .onChange(function(value) {
                    if ($.fn.BEE.user_options.material.showCharge) {
                        for (var name in self.listOfSST) {
                            self.listOfSST[name].drawInsideThreeFrames();
                        }
                    }
                });
            folder_general.add($.fn.BEE.user_options.helper, "deadAreaOpacity", 0., 0.9)
                .name("Inactivity")
                .step(0.1)
                .onChange(function(value) {
                    if (value<0.05) {
                        if (self.isShowDeadArea) {
                            for (var i=0; i<self.listOfDeadAreas.length; i++) {
                                self.scene.remove(self.listOfDeadAreas[i]);
                                self.isShowDeadArea = false;
                                // console.log('removed');
                            }
                        }
                    }
                    else {
                        if (!self.isShowDeadArea) {
                            self.isShowDeadArea = true;
                            for (var i=0; i<self.listOfDeadAreas.length; i++) {
                                var obj = self.listOfDeadAreas[i];
                                self.scene.add(obj);
                                // console.log('added');
                            }
                        }
                        for (var i=0; i<self.listOfDeadAreas.length; i++) {
                            var obj = self.listOfDeadAreas[i];
                            obj.material.opacity = value;
                            obj.material.needsUpdate = true;
                        }
                    }

                });
            folder_general.open();
        },

        initGuiCamera: function() {
            var self = this;
            var ctrl = self.guiController;
            var prop = {
                'view' : ['-']
            }
            var folder_camera = self.gui.addFolder("Camera");
            folder_camera.add(self, 'centerToEvent').name('Center to Event');
            folder_camera.add($.fn.BEE.user_options.camera, "ortho")
                .name("Ortho Camera")
                .onChange(function(value) {
                    // saveLocalStorage();
                    var new_query;
                    if (base_query.indexOf('camera.ortho=true')>0) {
                        new_query = base_query.replace('camera.ortho=true', 'camera.ortho='+value);
                    }
                    else if (base_query.indexOf('camera.ortho=false')>0) {
                        new_query = base_query.replace('camera.ortho=false', 'camera.ortho='+value);
                    }
                    else {
                        if (base_query == "") {
                            new_query = base_query+'?camera.ortho='+value;
                        }
                        else {
                            new_query = base_query+'&camera.ortho='+value;
                        }
                    }
                    window.location.assign(base_url+new_query);
                });
            folder_camera.add(prop, 'view', [ 'YZ', 'XY', 'XZ', 'XU', 'XV'])
               .name("2D View ")
               .onChange(function(value) {
                    if (value == 'YZ') { self.yzView(); }
                    else if (value == 'XY') { self.xyView(); }
                    else if (value == 'XZ') { self.xzView(); }
                    else if (value == 'XU') { self.xuView(); }
                    else if (value == 'XV') { self.xvView(); }
                });
            folder_camera.add(self, 'resetCamera').name('Reset');
            folder_camera.open();
        },

        initGuiSlice: function() {
            var self = this;
            var ctrl = self.guiController;
            var w = self.options.slice.width;
            var halfx = $.fn.BEE.user_options.geom.halfx;

            var folder_slice = this.gui.addFolder("Slice");
            folder_slice.add(ctrl.slice, "sliced_mode")
                .name("sliced mode")
                .onChange(function(value) {
                    var sst;
                    for (var name in self.listOfSST) {
                        sst = self.listOfSST[name];
                        if(value) {
                            sst.drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
                        }
                        else {
                            sst.drawInsideThreeFrames();
                        }
                    }
                });
            folder_slice.add(ctrl.slice, "opacity", 0, 1)
                .onChange(function(value) {
                    self.slice.material.opacity = value;
                    $.fn.BEE.user_options.slice.opacity = value;
                });
            folder_slice.add(ctrl.slice, "width", w, halfx*2).step(w)
                .onChange(function(value){
                    $.fn.BEE.user_options.slice.width = value;
                    self.slice.scale.x = value/w; // SCALE
                });
            folder_slice.add(ctrl.slice, "position", -3*halfx+w/2, 3*halfx-w/2)
                .onChange(function(value) {
                    self.slice.position.x = value;
                    self.updateStatusBar();
                    if (ctrl.slice.sliced_mode) {
                        for (var name in self.listOfSST) {
                            self.listOfSST[name].drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
                        }
                    }
                });
        },

        initCamera: function() {
            var self = this;
            var ctrl = self.guiController;
            var depth = self.options.camera.depth;

            self.camera = $.fn.BEE.user_options.camera.ortho
                ? new THREE.OrthographicCamera(window.innerWidth/-2, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 4000)
                : new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 4000);
            var camera = self.camera;
            camera.position.z = depth*Math.cos(Math.PI/4);
            camera.position.x = -depth*Math.sin(Math.PI/4);
            camera.position.y = depth*Math.sin(Math.PI/6);

        },

        initScene: function() {
            var self = this;

            self.scene  = new THREE.Scene();
            self.scene_slice = new THREE.Scene();

            self.group_main = new THREE.Group();
            self.scene.add(self.group_main);

            self.axises = new THREE.AxisHelper( 100 );
            if ($.fn.BEE.user_options.helper.showAxises) {
                self.scene.add(self.axises);
            }

        },

        initHelper: function() {
            var self = this;
            self.group_helper = new THREE.Group();
            self.tpcHelpers = [];

            // $.fn.BEE.user_options.geom.name = "dune35t";

            if ($.fn.BEE.user_options.geom.name == "uboone") {
                self.tpcLoc = [
                    [0., 256., -116., 116., 0., 1040.]
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[0][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[0][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[0][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[0][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[0][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[0][5]+self.tpcLoc[0][4])/2;
            }

            else if ($.fn.BEE.user_options.geom.name == "dune35t") {
                self.tpcLoc = [
                    [-34.4523 , -7.27732, -84.4008, 115.087, -2.03813, 51.4085],
                    [-0.747073,  221.728, -84.4008, 115.087, -2.03813, 51.4085],
                    [-34.4523 , -7.27732, -84.4852, 0.015  , 51.4085 , 103.332],
                    [-0.747073,  221.728, -84.4852, 0.015  , 51.4085 , 103.332],
                    [-34.4523 , -7.27732, 0       , 115.087, 51.4085 , 103.332],
                    [-0.747073,  221.728, 0       , 115.087, 51.4085 , 103.332],
                    [-34.4523 , -7.27732, -84.4008, 115.087, 103.332 , 156.779],
                    [-0.747073,  221.728, -84.4008, 115.087, 103.332 , 156.779]
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[7][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[7][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[7][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[7][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[7][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[7][5]+self.tpcLoc[0][4])/2;
            }

            else if ($.fn.BEE.user_options.geom.name == "dune10kt_workspace") {
                // self.tpcLoc = [
                //     [-363.37605, -2.53305 , -628.57875, -20.75000, -106.39000, 126.00000],
                //     [2.53305   , 363.37605, -628.57875, -20.75000, -106.39000, 126.00000],
                //     [-363.37605, -2.53305 , -20.75000 , 587.07875, -106.39000, 126.00000],
                //     [2.53305   , 363.37605, -20.75000 , 587.07875, -106.39000, 126.00000],
                //     [-363.37605, -2.53305 , -628.57875, -20.75000, 126.00000 , 358.39000],
                //     [2.53305   , 363.37605, -628.57875, -20.75000, 126.00000 , 358.39000],
                //     [-363.37605, -2.53305 , -20.75000 , 587.07875, 126.00000 , 358.39000],
                //     [2.53305   , 363.37605, -20.75000 , 587.07875, 126.00000 , 358.39000]
                // ];
                self.tpcLoc = [
                    [-363.376, -2.53305, -607.829, 0      , -0.87625, 231.514],
                    [2.53305 ,  363.376, -607.829, 0      , -0.87625, 231.514],
                    [-363.376, -2.53305, 0       , 607.829, -0.87625, 231.514],
                    [2.53305 ,  363.376, 0       , 607.829, -0.87625, 231.514],
                    [-363.376, -2.53305, -607.829, 0      , 231.514 , 463.904],
                    [2.53305 ,  363.376, -607.829, 0      , 231.514 , 463.904],
                    [-363.376, -2.53305, 0       , 607.829, 231.514 , 463.904],
                    [2.53305 ,  363.376, 0       , 607.829, 231.514 , 463.904]
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[7][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[7][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[7][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[7][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[7][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[7][5]+self.tpcLoc[0][4])/2;
            }

            else if ($.fn.BEE.user_options.geom.name == "protodune") {
                self.tpcLoc = [
                    // [-387.36 , -365.917, -0.2, 607.629, -0.87625, 231.514],
                    // [-360.851, -0.008  , -0.2, 607.629, -0.87625, 231.514],
                    // [0.008   , 360.851 , -0.2, 607.629, -0.87625, 231.514],
                    // [365.917 , 387.36  , -0.2, 607.629, -0.87625, 231.514],
                    // [-387.36 , -365.917, -0.2, 607.629, 231.514 , 463.904],
                    // [-360.851, -0.008  , -0.2, 607.629, 231.514 , 463.904],
                    // [0.008   , 360.851 , -0.2, 607.629, 231.514 , 463.904],
                    // [365.917 , 387.36  , -0.2, 607.629, 231.514 , 463.904],
                    // [-387.36 , -365.917, -0.2, 607.629, 463.904 , 696.294],
                    // [-360.851, -0.008  , -0.2, 607.629, 463.904 , 696.294],
                    // [0.008   , 360.851 , -0.2, 607.629, 463.904 , 696.294],
                    // [365.917 , 387.36  , -0.2, 607.629, 463.904 , 696.294],

                    [-380.434 , -367.504 , 0.0, 607.499, -0.49375 , 231.166],
                    [-359.884 , -0.008   , 0.0, 607.499, -0.49375 , 231.166],
                    [0.008    , 359.884  , 0.0, 607.499, -0.49375 , 231.166],
                    [367.504  , 380.434  , 0.0, 607.499, -0.49375 , 231.166],
                    [-380.434 , -367.504 , 0.0, 607.499, 231.566  , 463.226],
                    [-359.884 , -0.008   , 0.0, 607.499, 231.566  , 463.226],
                    [0.008    , 359.884  , 0.0, 607.499, 231.566  , 463.226],
                    [367.504  , 380.434  , 0.0, 607.499, 231.566  , 463.226],
                    [-380.434 , -367.504 , 0.0, 607.499, 463.626  , 695.286],
                    [-359.884 , -0.008   , 0.0, 607.499, 463.626  , 695.286],
                    [ 0.008   , 359.884  , 0.0, 607.499, 463.626  , 695.286],
                    [ 367.504 , 380.434  , 0.0, 607.499, 463.626  , 695.286]
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[11][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[11][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[11][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[11][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[11][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[11][5]+self.tpcLoc[0][4])/2;

                self.guiController.slice.position = -$.fn.BEE.user_options.geom.halfx;

            }

            // console.log($.fn.BEE.user_options.geom)

            var helper, tpc, box;
            for (var i=0; i<self.tpcLoc.length; i++) {
                tpc = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        self.tpcLoc[i][1]-self.tpcLoc[i][0],
                        self.tpcLoc[i][3]-self.tpcLoc[i][2],
                        self.tpcLoc[i][5]-self.tpcLoc[i][4]
                        ),
                    new THREE.MeshBasicMaterial({
                        color: 0x333333,
                        transparent: true,
                        opacity: 0.1
                        })
                );
                // tpc.position.x = (self.tpcLoc[i][1]+self.tpcLoc[i][0])/2;
                // tpc.position.y = (self.tpcLoc[i][3]+self.tpcLoc[i][2])/2;
                // tpc.position.z = (self.tpcLoc[i][5]+self.tpcLoc[i][4])/2;
                helper = new THREE.Object3D;
                box = new THREE.BoxHelper(tpc);
                box.material.color.setHex(0x111111);
                helper.add(box);
                helper.position.x = toLocalX((self.tpcLoc[i][1]+self.tpcLoc[i][0])/2);
                helper.position.y = toLocalY((self.tpcLoc[i][3]+self.tpcLoc[i][2])/2);
                helper.position.z = toLocalZ((self.tpcLoc[i][5]+self.tpcLoc[i][4])/2);

                // console.log(helper);
                // helper.material.color.setHex(USER_COLORS['dark'][i]);

                // helper.material.transparent = true;
                self.tpcHelpers.push(helper);
                self.group_helper.add(helper);
            }

            // self.helper = new THREE.BoxHelper(new THREE.Mesh(
            //     new THREE.BoxGeometry($.fn.BEE.user_options.geom.halfx*2, $.fn.BEE.user_options.geom.halfy*2, $.fn.BEE.user_options.geom.halfz*2)));
            // self.helper.material.color.setHex(0x333333);
            // // self.helper.material.blending = THREE.AdditiveBlending;
            // self.helper.material.transparent = true;
            // self.group_helper.add(self.helper);
            if ($.fn.BEE.user_options.helper.showTPCs == true) {
                self.group_main.add(self.group_helper);
            }

        },

        initSlice: function() {
            var self = this;
            var ctrl = self.guiController;
            var halfy = $.fn.BEE.user_options.geom.halfy;
            var halfz = $.fn.BEE.user_options.geom.halfz;

            self.slice = new THREE.Mesh(
                new THREE.BoxGeometry(ctrl.slice.width, halfy*2, halfz*2 ),
                new THREE.MeshBasicMaterial( {
                    color: ctrl.slice.color,
                    transparent: true,
                    // blending: THREE.AdditiveBlending,
                    opacity: ctrl.slice.opacity
                }));
            self.slice.position.x = ctrl.slice.position;
            self.slice.position.y = toLocalY($.fn.BEE.user_options.geom.center[1]);
            self.slice.position.z = toLocalZ($.fn.BEE.user_options.geom.center[2]);
            self.scene_slice.add(self.slice);  // slice has its own scene
        },

        initDeadArea: function() {
            // console.log("init dead area");
            var self = this;
            self.listOfDeadAreas = [];
            var url = base_url + "channel-deadarea/";
            var xhr = $.getJSON(url, function(data) {
                // console.log(data);

                // var extrudeSettings = {
                //     steps           : 100,
                //     bevelEnabled    : false,
                //     extrudePath     : null
                // };
                var material = new THREE.MeshBasicMaterial({
                    color: 0x888888,
                    transparent: true,
                    depthWrite: true,
                    opacity: $.fn.BEE.user_options.helper.deadAreaOpacity,
                    wireframe: false
                });

                var worker_url = root_url;
                if (worker_url.indexOf('localhost') > 1) {
                    worker_url += "static/js/worker_deadarea.js";
                }
                else {
                    worker_url = worker_url.replace('bee', 'bee-static');
                    worker_url += "js/worker_deadarea.js";
                }
                // console.log(worker_url);
                var worker = new Worker(worker_url);
                worker.onmessage = function(e) {
                  // console.log('Message received from worker', e.data);
                  // var positions = new Float32Array(e.data);
                  var mergedGeometry = new THREE.BufferGeometry();
                  // console.log(e.data);
                  mergedGeometry.addAttribute( 'position', new THREE.BufferAttribute( e.data.position , 3 ) );
                  mergedGeometry.addAttribute( 'normal', new THREE.BufferAttribute( e.data.normal , 3 ) );
                  // var mergedGeometry = e.data;
                  var mesh = new THREE.Mesh( mergedGeometry, material );
                  self.listOfDeadAreas.push(mesh);
                  self.scene.add(mesh);
                  self.isShowDeadArea = true;
                };
                var geoForWorker = {
                    halfx: $.fn.BEE.user_options.geom.halfx,
                    center_y: $.fn.BEE.user_options.geom.center[1],
                    center_z: $.fn.BEE.user_options.geom.center[2]
                }
                worker.postMessage({
                    vertices: data,
                    geo: geoForWorker
                });

                // var mergedGeometry = new THREE.Geometry();
                // for (var i=0; i<data.length; i++) {
                //     var pts = [];
                //     var raw_pts = data[i];
                //     var cy = 0;
                //     var cz = 0;
                //     for (var j = 0; j < raw_pts.length; j ++ ) {
                //         cy += raw_pts[j][0];
                //         cz += raw_pts[j][1];
                //     }
                //     cy /= raw_pts.length;
                //     cz /= raw_pts.length;
                //     for (var j = 0; j < raw_pts.length; j ++ ) {
                //         pts.push( new THREE.Vector2(-raw_pts[j][1]+cz, raw_pts[j][0]-cy) );
                //     }
                //     var spline = new THREE.SplineCurve3( [
                //         new THREE.Vector3( -$.fn.BEE.user_options.geom.halfx, toLocalY(cy),  toLocalZ(cz)),
                //         // new THREE.Vector3( $.fn.BEE.user_options.geom.halfx, toLocalY(cy),  toLocalZ(cz)),
                //         new THREE.Vector3( -$.fn.BEE.user_options.geom.halfx+2, toLocalY(cy),  toLocalZ(cz)),
                //     ] );
                //     extrudeSettings.extrudePath = spline;
                //     var shape = new THREE.Shape(pts);
                //     var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                //     mergedGeometry.merge(geometry);

                //     // var mesh = new THREE.Mesh( geometry, material );
                //     // self.listOfDeadAreas.push(mesh);
                //     // self.scene.add(mesh);
                // };

                // var mesh = new THREE.Mesh( mergedGeometry, material );
                // self.listOfDeadAreas.push(mesh);
                // self.scene.add(mesh);
                // self.isShowDeadArea = true;
            });

            var el = $('#loadingbar');
            xhr.then( // add to the scence after all are set up
                function() {
                    el.html(el.html()+"<br /><strong class='success'>Success!</strong> loading Dead Channels ... done. ")
                },
                function() {
                }
            );
        },

        initMC: function() {
            var self = this;
            self.listOfMCObjects = [];

            var url = base_url +  "mc/";
            var xhr = $.getJSON(url, function(mc_data) {
                $('#mc')
                .on('changed.jstree', function (e, data) {
                    for (var i=0; i<self.listOfMCObjects.length; i++) {
                        self.scene.remove(self.listOfMCObjects[i]);
                    }
                    self.listOfMCObjects = [];


                    var nSelected = data.selected.length;
                    var line, node, geometry, material;
                    for (var i=0; i<nSelected; i++) {
                        node = data.instance.get_node(data.selected[i]);
                        if (node.text.indexOf("nu_")>=0
                            || node.text.indexOf("neutron")>=0
                            || node.text.indexOf('gamma')>=0) {
                            material = new THREE.LineBasicMaterial({
                                color: 0x59656d,
                                linewidth: 1,
                            });
                        }
                        else {
                            material = new THREE.LineBasicMaterial({
                                color: 0xff000d,
                                linewidth: 4,
                            });
                        }
                        geometry = new THREE.Geometry();
                        geometry.vertices.push(
                            new THREE.Vector3(
                                toLocalX(node.data.start[0]),
                                toLocalY(node.data.start[1]),
                                toLocalZ(node.data.start[2])
                            ),
                            new THREE.Vector3(
                                toLocalX(node.data.end[0]),
                                toLocalY(node.data.end[1]),
                                toLocalZ(node.data.end[2])
                            )
                        );
                        line = new THREE.Line( geometry, material );

                        self.listOfMCObjects.push(line);
                        self.scene.add(line);

                        // vertex balls
                        var geometry2 = new THREE.SphereGeometry( 2, 32, 32 );
                        var material2 = new THREE.MeshNormalMaterial({
                            blending: THREE.NormalBlending,
                            opacity: 0.8,
                            transparent: true,
                            depthWrite: false,
                            sizeAttenuation: false
                        });
                        var sphere = new THREE.Mesh( geometry2, material2 );
                        sphere.overdraw = true;
                        sphere.position.x = toLocalX(node.data.start[0]);
                        sphere.position.y = toLocalY(node.data.start[1]);
                        sphere.position.z = toLocalZ(node.data.start[2]);

                        self.scene.add(sphere);
                        self.listOfMCObjects.push(sphere);
                        self.scene.add(sphere);
                    }
                    // console.log( node );
                })
                .jstree({
                    'core': {
                        'themes': {
                            'icons': true,
                            'stripes': false
                        },
                        'dblclick_toggle': false,
                        'data': mc_data
                    },
                    "checkbox" : {
                        "keep_selected_style" : false,
                        "three_state": false,
                        "cascade": 'down'
                    },
                    "plugins" : [ "checkbox" ]
                });
                // console.log(data);

            });
            var el = $('#loadingbar');
            xhr.then( // add to the scence after all are set up
                function() {
                    el.html(el.html()+"<br /><strong class='success'>Success!</strong> loading MC ... done. ")
                },
                function() {
                    el.html(el.html()+"<br /><strong class='warning'>Warning!</strong> loading MC ... failed. ")
                }
            );
        },

        initCT: function() {
            var self = this;
            self.listOfCT = {};

            var ct = Object.create(CT);
            ct.init("WireCell-charge");
            ct.process.then( // add to the scence after all are set up
                $.proxy(function(){  // use proxy to set up the this context
                    // console.log(this)
                    for (var i=0; i<this.tracks.length; i++) {
                        self.group_main.add(ct.tracks[i].line);
                        // console.log('added ' + i)
                    }
                    this.containedIn = self.group_main;
                    self.listOfCT["WireCell-charge"] = this;
                    self.nLoadedCT += 1;
                }, ct),
                function() {
                }
            );

        },

        initSST: function() {
            var self = this;
            self.listOfSST = {};
            self.nRequestedSSTDone = 0;
            self.nLoadedSST = 0;
            var sst;
            var theme = self.options.theme;

            var color_index;

            for (var i=0; i<self.options.sst.length; i++) {
            // for (var i=0; i<1; i++) {
                sst = Object.create(SST);
                sst.scene3D = this;
                sst.init(self.options.sst[i], self.options);
                sst.index = i;
                color_index = i>=USER_COLORS[theme].length? i-USER_COLORS[theme].length : i;
                sst.chargeColor = new THREE.Color(USER_COLORS[theme][color_index]);
                self.initSSTGui(sst);
                self.gui.__folders.Recon.__controllers[i].name(i+1 + '. ' + self.options.sst[i]);
                if (i==0) {
                    sst.setup();
                    self.registerSST(sst);
                }
                // console.log(self.gui.__folders.Recon);
                // self.gui.__folders.Recon.__controllers[i].name(i+1 + '. ' + self.options.sst[i]);
            }

        },

        registerSST: function(sst) {
            var self = this;
            var el = $('#loadingbar');

            var sst_options = Lockr.get('sst_options');
            var options = Lockr.get('options');
            el.html(el.html()+"<br /><strong class='success'>Loading </strong>" + sst.name + " ... ");
            el.show();

            sst.process.then( // add to the scence after all are set up
                $.proxy(function(){  // use proxy to set up the this context
                    self.group_main.add(this.pointCloud);
                    this.containedIn = self.group_main;
                    self.listOfSST[sst.name] = sst;
                    self.nLoadedSST += 1;
                    if (sst_options && sst_options[sst.name]) {
                       sst.material.size = sst_options[sst.name]['size'];
                       sst.material.opacity = sst_options[sst.name]['opacity'];
                       sst.chargeColor = new THREE.Color(parseInt(sst_options[sst.name].chargeColor,16));

                       // console.log(sst_options[sst.name])
                    }
                    sst.drawInsideThreeFrames();
                    sst.selected();
                    self.selected_sst = sst.name;
                    // if (options && options['selected_sst'] && options['selected_sst'] == sst.name) {
                    //     sst.selected();
                    //     self.selected_sst = sst.name;
                    // }
                    // console.log(self.selected_sst)
                    if (sst.runNo) {
                        $('#runNo').html(sst.runNo + ' - ');
                        $('#subRunNo').html(sst.subRunNo + ' - ');
                        $('#eventNo').html(sst.eventNo);
                    }
                    // console.log(sst);

                    window.setTimeout(function(){
                        el.html('');
                        el.hide();
                    }, 1000);
                    checkSST(sst);

                }, sst),
                function() {
                    el.html(el.html()+"<br /><strong class='warning'>Warning!</strong> loading " + sst.name + " ... failed. ")
                }
            );
            sst.process.always(function(){
                self.nRequestedSSTDone += 1;
                sst.process = null; // force garbage collection (a very large JSON object)

                // if (self.nRequestedSSTDone == self.options.sst.length) {
                //     el.html(el.html()+"<br /> All done!");
                //     window.setTimeout(function(){
                //         el.hide();
                //     }, 500);

                //     if (!self.selected_sst) {
                //         // console.log($.fn.BEE.user_options.sst[0] + ' selected');
                //         self.listOfSST[$.fn.BEE.user_options.sst[0]].selected();
                //     }
                // }
                // console.log(self.nRequestedSSTDone, self.nLoadedSST);
            });
        },


        initSSTGui: function(sst) {
            var self = this;
            // var folder_recon = self.gui.addFolder("Recon (" + sst.name + ")");
            var opacity = sst.name == "WireCell-charge" ? self.options.material.opacity : 0;
            // var prop = {
            //     size: 2,
            //     opacity: opacity,
            //     select: function() {
            //         $.fn.BEE.current_sst = sst;
            //         // console.log($.fn.BEE.current_sst);
            //     }
            // };
            // folder_recon.add(prop, "size", 1, 6).step(1)
            //     .onChange(function(value) {
            //         sst.material.size = value;
            //     });
            // folder_recon.add(prop, "opacity", 0, 1)
            //     .onChange(function(value) {
            //         sst.material.opacity = value;
            //     });
            // if (sst.name == "WireCell-charge" || sst.name == "truth") {
            //     folder_recon.open();
            // }

            self.gui.__folders.Recon.add(sst, "selected")
                .name(sst.name);
            self.gui.__folders.Recon.open();
            $('.dg .cr.function .property-name').css({
                'width': '100%'
            })
            listOfReconElems[sst.name] = $(".dg .property-name:contains('"+sst.name+"')");
            // console.log(listOfReconElems[sst.name]);
            // if (sst.material.opacity > 0.01) {
            //     console.log(sst.name + ' visible');
            // }
        },

        initRenderer: function() {
            var self = this;
            self.renderer = new THREE.WebGLRenderer( { antialias: true } );
            var renderer = self.renderer;

            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth*self.options.camera.scale, window.innerHeight );
            renderer.gammaInput = true;
            renderer.gammaOutput = true;
            if (self.options.theme == 'light') {
                renderer.setClearColor(0xFFFFFF, 1);
                // renderer.setClearColor(0xdddddd, 1);
            }

            // container = document.getElementById( 'container' );
            var container = self.$elem[0];
            container.appendChild(renderer.domElement);
        },

        initObitController: function() {
            var self = this;
            self.orbitController = new THREE.OrbitControls(self.camera, self.renderer.domElement);
        },

        toggleMC: function() {
            var el = $('#toggleMC');
            if (el.html().indexOf("Show")>=0) {
                $("#mc").show();
                el.html(el.html().replace("Show", "Hide"));
            }
            else {
                $("#mc").hide();
                el.html(el.html().replace("Hide", "Show"));
            }
        },

        toggleStats: function() {
            var el = $('#toggleStats');
            if (el.html().indexOf("Show")>=0) {
                $("#statsbar").show();
                el.html(el.html().replace("Show", "Hide"));
            }
            else {
                $("#statsbar").hide();
                el.html(el.html().replace("Hide", "Show"));
            }
        },

        toggleSidebar: function() {
            $.fn.BEE.ui_sst.$el_container.toggle("slide");
        },

        updateStatusBar: function() {
            var ctrl = this.guiController;
            // this.el_slice_x.html();
            // this.el_slice_number.html();
            this.el_statusbar.html(
                'slice #: ' + ((ctrl.slice.position+this.options.geom.halfx)/ctrl.slice.width).toFixed(0)
                + ' | slice x: ' + (ctrl.slice.position+this.options.geom.halfx).toFixed(1)
            )
        },

        nextEvent: function() {
            var id = this.options.id;
            var maxId = this.options.nEvents -1;
            var newId = id >= maxId ? 0 : id+1;
            window.location.assign(event_url + newId + '/' + base_query);
        },

        prevEvent: function() {
            var id = this.options.id;
            var maxId = this.options.nEvents -1;
            var newId = id <= 0 ? maxId : id-1;
            window.location.assign(event_url + newId + '/' + base_query);
        },

        nextRecon: function() {
            var self = this;
            var disp = self.gui.__folders.General.__controllers[1];
            var currentIndex = self.options.sst.indexOf(self.guiController.display);
            var newIndex = currentIndex == self.options.sst.length - 1
                    ? 0
                    : currentIndex + 1;
            disp.setValue(self.options.sst[newIndex]);
        },

        prevRecon: function() {
            var self = this;
            var disp = self.gui.__folders.General.__controllers[1];
            var currentIndex = self.options.sst.indexOf(self.guiController.display);
            var newIndex = currentIndex == 0
                    ? self.options.sst.length - 1
                    : currentIndex - 1;
            disp.setValue(self.options.sst[newIndex]);
        },

        nextSlice: function () {
            var self = this;
            var ctrl = self.guiController;
            var slice = self.slice;

            ctrl.slice.position = ctrl.slice.position + ctrl.slice.width;
            slice.position.x = ctrl.slice.position;
            self.updateStatusBar();
            if (ctrl.slice.sliced_mode) {
                for (var name in self.listOfSST) {
                    self.listOfSST[name].drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
                }
            }
        },

        prevSlice: function () {
            var self = this;
            var ctrl = self.guiController;
            var slice = self.slice;

            ctrl.slice.position = ctrl.slice.position - ctrl.slice.width;
            slice.position.x = ctrl.slice.position;
            self.updateStatusBar();
            if (ctrl.slice.sliced_mode) {
                for (var name in self.listOfSST) {
                    self.listOfSST[name].drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
                }
            }
        },

        centerToEvent: function() {
            var self = this;
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;

            var sst = self.listOfSST[self.options.sst[0]];
            var halfx = $.fn.BEE.user_options.geom.halfx;
            var halfy = $.fn.BEE.user_options.geom.halfy;
            var halfz = $.fn.BEE.user_options.geom.halfz;
            var depth = self.options.camera.depth;

            self.camera.position.x = -depth;
            self.camera.position.y = (sst.bounds.ymean + sst.bounds.ymean)/2;
            self.camera.position.z = (sst.bounds.zmean + sst.bounds.zmean)/2 - halfz;

            // self.orbitController.target.set(
            //     (sst.bounds.xmin + sst.bounds.xmax)/2 - halfx,
            //     (sst.bounds.ymin + sst.bounds.ymax)/2,
            //     (sst.bounds.zmin + sst.bounds.zmax)/2 - halfz
            // );
            if (self.rotationCenter!=undefined) self.scene.remove(self.rotationCenter);
            self.orbitController.target.set(
                sst.bounds.xmean - halfx,
                sst.bounds.ymean,
                sst.bounds.zmean - halfz
            );

            self.camera.up = new THREE.Vector3(0,1,0);
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;
            self.orbitController.update();
        },

        resetCamera: function() {
            var self = this;
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;
            var depth = self.options.camera.depth;
            self.camera.position.z = depth*Math.cos(Math.PI/4);
            self.camera.position.x = -depth*Math.sin(Math.PI/4);
            self.camera.position.y = depth*Math.sin(Math.PI/6);
            self.camera.up = new THREE.Vector3(0,1,0);
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;
            self.orbitController.center.set(0,0,0);
            self.orbitController.update();
        },

        play: function() {
            var self = this;
            window.cancelAnimationFrame(self.animationId);
            self.options.camera.rotate = true;
            self.animate();
            self.gui.close();
            // $("#statusbar").hide();
            if (screenfull.enabled) {
                screenfull.request(document.getElementById('container'));
            }
        },

        stop: function() {
            var self = this;
            window.cancelAnimationFrame(self.animationId);
            self.options.camera.rotate = false;
            self.animate();
            self.gui.open();
            // $("#statusbar").show();
        },

        yzView: function() {
            var self = this;
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;
            TweenLite.to( self.camera.position, 0.6, {
                x: -self.options.camera.depth,
                y: self.orbitController.target.y,
                z: self.orbitController.target.z,
                onUpdate: function(){self.orbitController.update();}
            } )
            // self.camera.position.x = -self.options.camera.depth;
            // self.camera.position.y = self.orbitController.target.y;
            // self.camera.position.z = self.orbitController.target.z;

            // self.orbitController.target.set(
            //     (sst.bounds.xmin + sst.bounds.xmax)/2 - halfx,
            //     (sst.bounds.ymin + sst.bounds.ymax)/2,
            //     (sst.bounds.zmin + sst.bounds.zmax)/2 - halfz
            // );
            // if (self.rotationCenter!=undefined) self.scene.remove(self.rotationCenter);


            // self.camera.up = new THREE.Vector3(0,1,0);
            // self.scene.rotation.x = 0;
            // self.scene_slice.rotation.x = 0;
            // self.orbitController.update();
            // self.centerToEvent();
            // if (self.rotationCenter) {
            //     self.orbitController.target.set(
            //         self.rotationCenter.position.x,
            //         self.rotationCenter.position.y,
            //         self.rotationCenter.position.z
            //     );
            //     self.orbitController.update();
            // }
        },

        xyView: function() {
            var self = this;
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;
            // self.camera.position.x = self.orbitController.target.x;
            // self.camera.position.y = self.orbitController.target.y;
            // self.camera.position.z = self.options.camera.depth;
            TweenLite.to(self.camera.position, 0.6, {
                x: self.orbitController.target.x,
                y: self.orbitController.target.y,
                z: self.options.camera.depth,
                onUpdate: function(){self.orbitController.update();}
            });
            // var sst = self.listOfSST[self.options.sst[0]];

            // self.centerToEvent();
            // // TweenLite.to( self.camera.position, 1, {x:(sst.bounds.xmean + sst.bounds.xmean)/2 - $.fn.BEE.user_options.geom.halfx,
            // //     y:(sst.bounds.ymean + sst.bounds.ymean)/2,
            // //     z: self.options.camera.depth} )
            // // TweenLite.to(self.camera.up, 1, {x:0,y:0,z:1});
            // // TweenLite.to(self.scene.rotation, 1, {x: self.scene.rotation.x, y: self.scene.rotation.y, z: 0});
            // self.camera.position.x = (sst.bounds.xmean + sst.bounds.xmean)/2 - $.fn.BEE.user_options.geom.halfx;
            // self.camera.position.y = (sst.bounds.ymean + sst.bounds.ymean)/2;
            // self.camera.position.z = self.options.camera.depth;
            // self.camera.up = new THREE.Vector3(0,0,1);
            // self.scene.rotation.z = 0;
            // self.scene_slice.rotation.z = 0;
            // self.orbitController.update();

            // if (self.rotationCenter) {
            //     self.orbitController.target.set(
            //         self.rotationCenter.position.x,
            //         self.rotationCenter.position.y,
            //         self.rotationCenter.position.z
            //     );
            //     self.orbitController.update();
            // }
        },

        xzView: function() {
            var self = this;
            self.scene.rotation.x = 0;
            self.scene_slice.rotation.x = 0;
            self.camera.position.x = self.orbitController.target.x;
            self.camera.position.z = self.orbitController.target.z;
            self.camera.position.y = self.options.camera.depth;
            self.orbitController.rotateLeft(Math.PI/2);
            self.orbitController.update();
            // TweenLite.to(self.camera.position, 0.6, {
            //     x: self.orbitController.target.x,
            //     y: self.options.camera.depth,
            //     z: self.orbitController.target.z,
            //     onUpdate: function(){self.orbitController.update();},
            //     onComplete: function(){
            //         self.orbitController.rotateLeft(Math.PI/2);
            //         self.orbitController.update();
            //     }
            // });

            // var sst = self.listOfSST[self.options.sst[0]];

            // self.centerToEvent();
            // // self.scene.rotation.z = Math.PI /2;
            // // self.scene_slice.rotation.z= Math.PI /2;

            // self.camera.position.x = (sst.bounds.xmean + sst.bounds.xmean)/2 - $.fn.BEE.user_options.geom.halfx;
            // self.camera.position.y = self.options.camera.depth;
            // self.camera.position.z = (sst.bounds.zmean + sst.bounds.zmean)/2 - $.fn.BEE.user_options.geom.halfz;

            // self.scene.rotation.x = 0;
            // self.scene_slice.rotation.x = 0;
            // self.camera.up = new THREE.Vector3(1,0,0);
            // self.orbitController.autoRotate = true;
            // if (self.rotationCenter) {
            //     self.orbitController.target.set(
            //         self.rotationCenter.position.x,
            //         self.rotationCenter.position.y,
            //         self.rotationCenter.position.z
            //     );
            //     self.orbitController.update();
            // }
        },

        xuView: function() {
            var self = this;
            self.scene.rotation.x = -Math.PI /180 * $.fn.BEE.user_options.geom.angleU;
            self.scene_slice.rotation.x = -Math.PI /180 * $.fn.BEE.user_options.geom.angleU;

            self.camera.position.x = self.orbitController.target.x;
            self.camera.position.z = self.orbitController.target.z;
            self.camera.position.y = self.options.camera.depth;
            self.orbitController.rotateLeft(Math.PI/2);
            self.orbitController.update();
            // TweenLite.to(self.camera.position, 0.6, {
            //     x: self.orbitController.target.x,
            //     y: self.options.camera.depth,
            //     z: self.orbitController.target.z,
            //     onUpdate: function(){self.orbitController.update();},
            //     onComplete: function(){
            //         self.orbitController.rotateLeft(Math.PI/2);
            //         self.orbitController.update();
            //     }
            // });

            // var sst = self.listOfSST[self.options.sst[0]];

            // self.centerToEvent();
            // // self.scene.rotation.x = -Math.PI /180 * $.fn.BEE.user_options.geom.angleU;
            // // self.scene_slice.rotation.x = -Math.PI /180 * $.fn.BEE.user_options.geom.angleU;
            // // self.scene.rotation.z = Math.PI /2;
            // // self.scene_slice.rotation.z= Math.PI /2;


            // self.camera.position.x = (sst.bounds.xmean + sst.bounds.xmean)/2 - $.fn.BEE.user_options.geom.halfx;
            // self.camera.position.y = self.options.camera.depth;
            // self.camera.position.z = (sst.bounds.zmean + sst.bounds.zmean)/2 - $.fn.BEE.user_options.geom.halfz;

            // self.scene.rotation.x = -Math.PI /180 * $.fn.BEE.user_options.geom.angleU;
            // self.scene_slice.rotation.x = -Math.PI /180 * $.fn.BEE.user_options.geom.angleU;
            // self.camera.up = new THREE.Vector3(1,0,0);
            // self.orbitController.update();
            // if (self.rotationCenter) {
            //     self.orbitController.target.set(
            //         self.rotationCenter.position.x,
            //         self.rotationCenter.position.y,
            //         self.rotationCenter.position.z
            //     );
            //     self.orbitController.update();
            // }
        },

        xvView: function() {
            var self = this;
            self.scene.rotation.x = Math.PI /180 * $.fn.BEE.user_options.geom.angleV;
            self.scene_slice.rotation.x = Math.PI /180 * $.fn.BEE.user_options.geom.angleV;

            self.camera.position.x = self.orbitController.target.x;
            self.camera.position.z = self.orbitController.target.z;
            self.camera.position.y = self.options.camera.depth;
            self.orbitController.rotateLeft(Math.PI/2);
            self.orbitController.update();
            // TweenLite.to(self.camera.position, 0.6, {
            //     x: self.orbitController.target.x,
            //     y: self.options.camera.depth,
            //     z: self.orbitController.target.z,
            //     onUpdate: function(){self.orbitController.update();},
            //     onComplete: function(){
            //         self.orbitController.rotateLeft(Math.PI/2);
            //         self.orbitController.update();
            //     }
            // });
            // var sst = self.listOfSST[self.options.sst[0]];
            // self.centerToEvent();
            // self.camera.position.x = (sst.bounds.xmean + sst.bounds.xmean)/2 - $.fn.BEE.user_options.geom.halfx;
            // self.camera.position.y = self.options.camera.depth;
            // self.camera.position.z = (sst.bounds.zmean + sst.bounds.zmean)/2 - $.fn.BEE.user_options.geom.halfz;

            // self.scene.rotation.x = Math.PI /180 * $.fn.BEE.user_options.geom.angleV;
            // self.scene_slice.rotation.x = Math.PI /180 * $.fn.BEE.user_options.geom.angleV;
            // self.camera.up = new THREE.Vector3(1,0,0);
            // self.orbitController.update();
            // if (self.rotationCenter) {
            //     console.log(self.rotationCenter);
            //     self.orbitController.target.set(
            //         self.rotationCenter.position.x,
            //         self.rotationCenter.position.y,
            //         self.rotationCenter.position.z
            //     );
            //     self.orbitController.update();
            // }
        },

        redrawAllSST: function() {
            var self = this;
            var ctrl = self.guiController;
            var sst;
            for (var name in self.listOfSST) {
                sst = self.listOfSST[name];
                if(self.guiController.slice.sliced_mode) {
                    sst.drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
                }
                else {
                    sst.drawInsideThreeFrames();
                }
            }
        },

        toggleCharge: function() {
            var self = this;
            $.fn.BEE.user_options.material.showCharge = !($.fn.BEE.user_options.material.showCharge);
            self.gui.__folders.General.__controllers[3].updateDisplay();
            self.redrawAllSST();
        },

        increaseOpacity: function() {
            if ($.fn.BEE.current_sst.material.opacity >= 1) { return; }
            else { $.fn.BEE.current_sst.material.opacity += 0.05; }
            $.fn.BEE.ui_sst.$el_opacity.slider("value", $.fn.BEE.current_sst.material.opacity);
            checkSST($.fn.BEE.current_sst);
        },
        decreaseOpacity: function() {
            if ($.fn.BEE.current_sst.material.opacity <= 0) { return; }
            else { $.fn.BEE.current_sst.material.opacity -= 0.05; }
            $.fn.BEE.ui_sst.$el_opacity.slider("value", $.fn.BEE.current_sst.material.opacity);
            checkSST($.fn.BEE.current_sst);
        },
        increaseSize: function() {
            if ($.fn.BEE.current_sst.material.size >= 8) { return; }
            else { $.fn.BEE.current_sst.material.size += 0.5; }
            $.fn.BEE.ui_sst.$el_size.slider("value", $.fn.BEE.current_sst.material.size);
        },
        decreaseSize: function() {
            if ($.fn.BEE.current_sst.material.size <= 1) { return; }
            else { $.fn.BEE.current_sst.material.size -= 0.5; }
            $.fn.BEE.ui_sst.$el_size.slider("value", $.fn.BEE.current_sst.material.size);
        },
        minimizeOpacity: function() {
            $.fn.BEE.current_sst.material.opacity = 0.;
            $.fn.BEE.ui_sst.$el_opacity.slider("value", $.fn.BEE.current_sst.material.opacity);
            checkSST($.fn.BEE.current_sst);
        },
        maximizeOpacity: function() {
            $.fn.BEE.current_sst.material.opacity = 1.;
            $.fn.BEE.ui_sst.$el_opacity.slider("value", $.fn.BEE.current_sst.material.opacity);
            checkSST($.fn.BEE.current_sst);
        },

        locatePointUnderMouse: function(event) {
            var self = this;
            var mouse = { x: 1, y: 1 };
            mouse.x = ( event.clientX / window.innerWidth  ) * 2 - 1;
            mouse.y = -( event.clientY / window.innerHeight  ) * 2 + 1;

            var raycaster = new THREE.Raycaster();
            raycaster.params.PointCloud.threshold = 0.3;
            raycaster.setFromCamera( mouse, self.camera );

            // var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(self.camera);
            // raycaster.ray.set(self.camera.position, vector.sub(self.camera.position).normalize());
            // self.scene.updateMatrixWorld();
            var sst = self.listOfSST[$.fn.BEE.user_options.sst[0]];
            var intersects = raycaster.intersectObject(sst.pointCloud);

            // console.log(vector.x + ', ' + vector.y + ', ' + vector.z);
            if (intersects.length>0) {
                var index = intersects[0].index;
                // console.log(intersects[0]);
                // var x = sst.geometry.vertices[index].x; // local coordinates
                // var y = sst.geometry.vertices[index].y;
                // var z = sst.geometry.vertices[index].z;
                // var x = sst.geometry.attributes.position[index*3]; // local coordinates
                // var y = sst.geometry.attributes.position[index*3+1];
                // var z = sst.geometry.attributes.position[index*3+2];
                // console.log(index, x,y,z);
                var x = sst.geometry.attributes.position.array[index*3]; // local coordinates
                var y = sst.geometry.attributes.position.array[index*3+1];
                var z = sst.geometry.attributes.position.array[index*3+2];

                self.el_statusbar.html(
                    '(x, y, z) = ('
                    + toGlobalX(x).toFixed(1) + ', '
                    + toGlobalY(y).toFixed(1) + ', '
                    + toGlobalZ(z).toFixed(1) + ')'
                );
            }
            else {
                self.el_statusbar.html('none detected');
            }
        },

        LookAtUnderMouse: function(event) {
            var self = this;
            var mouse = { x: 1, y: 1 };
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

            var raycaster = new THREE.Raycaster();

            raycaster.params.PointCloud.threshold = 0.3;  // 1cm
            raycaster.setFromCamera( mouse, self.camera );

            // var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(self.camera);
            // raycaster.ray.set(self.camera.position, vector.sub(self.camera.position).normalize());
            // self.scene.updateMatrixWorld();
            var sst = self.listOfSST[$.fn.BEE.user_options.sst[0]];
            var intersects = raycaster.intersectObject(sst.pointCloud);

            // console.log(vector.x + ', ' + vector.y + ', ' + vector.z);
            if (intersects.length>0) {
                // console.log(intersects);
                var index = intersects[0].index;
                // console.log(intersects[0]);
                // var x = sst.geometry.vertices[index].x; // local coordinates
                // var y = sst.geometry.vertices[index].y;
                // var z = sst.geometry.vertices[index].z;
                var x = sst.geometry.attributes.position.array[index*3]; // local coordinates
                var y = sst.geometry.attributes.position.array[index*3+1];
                var z = sst.geometry.attributes.position.array[index*3+2];
                // console.log(index, x,y,z);

                if (self.rotationCenter!=undefined) self.scene.remove(self.rotationCenter);
                var geometry2 = new THREE.SphereGeometry( 0.2, 32, 32 );
                var material2 = new THREE.MeshNormalMaterial({
                    blending: THREE.NormalBlending,
                    opacity: 0.4,
                    transparent: true,
                    depthWrite: false,
                    sizeAttenuation: false
                });
                self.rotationCenter = new THREE.Mesh( geometry2, material2 );
                self.rotationCenter.overdraw = true;
                self.rotationCenter.position.x = x;
                self.rotationCenter.position.y = y;
                self.rotationCenter.position.z = z;
                self.scene.add(self.rotationCenter);
                self.orbitController.target.set(x, y, z);
            }
            else {
                self.el_statusbar.html('none detected');
            }
        },

        addClickEvent: function(jqObj, f, eventName) {
            var self = this;
            var name = eventName;
            if (name==undefined) { name="click"; }
            jqObj.on(name, function(e){
                e.preventDefault();
                f.call(self, e);
            });
        },

        addEvent: function(key, f) {
            e.preventDefault();
            f.call(this);
        },

        addKeyEvent: function(key, f) {
            var self = this;
            Mousetrap.bind(key, function(e, combo) {
                f.call(self);
            });
        },

        addEventListener: function() {
            var self = this;
            window.addEventListener('resize', function() {
                self.camera.aspect = window.innerWidth*self.options.camera.scale / window.innerHeight;
                self.camera.updateProjectionMatrix();
                self.renderer.setSize(window.innerWidth*self.options.camera.scale, window.innerHeight);
            }, false );

            if (screenfull.enabled) {
                document.addEventListener(screenfull.raw.fullscreenchange, function () {
                    if (!screenfull.isFullscreen) { self.stop(); }
                });
            }
            self.addClickEvent($('#toggleSidebar') , self.toggleSidebar);
            self.addClickEvent($('#preset-default'), clearLocalStorageAndReload);
            self.addClickEvent($('#toggleMC')      , self.toggleMC);
            self.addClickEvent($('#toggleStats')   , self.toggleStats);
            self.addClickEvent($('#toggleCharge')  , self.toggleCharge);
            self.addClickEvent($('#nextEvent')     , self.nextEvent);
            self.addClickEvent($('#prevEvent')     , self.prevEvent);
            self.addClickEvent($('#nextSlice')     , self.nextSlice);
            self.addClickEvent($('#prevSlice')     , self.prevSlice);
            self.addClickEvent($('#nextRecon')     , self.nextRecon);
            self.addClickEvent($('#prevRecon')     , self.prevRecon);
            self.addClickEvent($('#centerToEvent') , self.centerToEvent);
            self.addClickEvent($('#resetCamera')   , self.resetCamera);
            self.addClickEvent($('#xyView')        , self.xyView);
            self.addClickEvent($('#xzView')        , self.xzView);
            self.addClickEvent($('#xuView')        , self.xuView);
            self.addClickEvent($('#xvView')        , self.xvView);
            $('#play').on('click', function(e){
                e.preventDefault();
                var el = $(this);
                if (el.html() == 'Play (Fullscreen)') { self.play(); }
                else { self.stop(); }
            });
            self.addClickEvent($('#container'), self.locatePointUnderMouse);
            self.addClickEvent($('#container'), self.LookAtUnderMouse, 'dblclick');

            // $(document).on("keypress", function(e) {
            //     else if (e.which == 93)   { self.addEvent(e, self.nextRecon); } // ]
            //     else if (e.which == 91)   { self.addEvent(e, self.prevRecon); } // [
            //     else if (e.which == 99)   { self.addEvent(e, self.centerToEvent); } // c
            //     else if (e.which == 114)  { self.addEvent(e, self.resetCamera); } // r
            //     else if (e.which == 122)  { self.addEvent(e, self.xzView); } // z
            //     else if (e.which == 117)  { self.addEvent(e, self.xuView); }  // u
            //     else if (e.which == 118)  { self.addEvent(e, self.xvView); } // v
            //     else if (e.which == 61)   { self.addEvent(e, self.increaseOpacity); }  // =
            //     else if (e.which == 45)   { self.addEvent(e, self.decreaseOpacity); }  // -
            //     else if (e.which == 43)   { self.addEvent(e, self.increaseSize); }  // +
            //     else if (e.which == 95)   { self.addEvent(e, self.decreaseSize); }  // _
            //     // else if (e.which >= 49 && e.which <= 57 ) {
            //     //     e.preventDefault();
            //     //     var index = e.which - 49;
            //     //     if (index > $.fn.BEE.user_options.sst.length-1) { return; }
            //     //     var sst = self.listOfSST[$.fn.BEE.user_options.sst[index]];
            //     //     if (sst) { sst.selected(); }
            //     // }
            //     else if (e.which == 113)   { self.addEvent(e, self.toggleCharge); }  // q

            //     else {
            //         // console.log(event.which);
            //     }
            // });
            self.addKeyEvent('m', self.toggleMC);
            self.addKeyEvent('s', self.toggleStats);
            self.addKeyEvent('q', self.toggleCharge);
            self.addKeyEvent('shift+n', self.nextEvent);
            self.addKeyEvent('shift+p', self.prevEvent);
            self.addKeyEvent('k', self.nextSlice);
            self.addKeyEvent('j', self.prevSlice);
            self.addKeyEvent(']', self.nextRecon);
            self.addKeyEvent('[', self.prevRecon);
            self.addKeyEvent('c', self.centerToEvent);
            self.addKeyEvent('x', self.xyView);
            self.addKeyEvent('z', self.xzView);
            self.addKeyEvent('u', self.xuView);
            self.addKeyEvent('v', self.xvView);
            self.addKeyEvent('r', self.resetCamera);
            self.addKeyEvent('=', self.increaseOpacity);
            self.addKeyEvent('-', self.decreaseOpacity);
            self.addKeyEvent('+', self.increaseSize);
            self.addKeyEvent('_', self.decreaseSize);
            self.addKeyEvent('{', self.minimizeOpacity);
            self.addKeyEvent('}', self.maximizeOpacity);
            Mousetrap.bindGlobal('esc', function(){
                // console.log($('input'));
                $('input').blur(); // remove focus from input elements
                $('select').blur(); // remove focus from select elements
            });
            for (var i=1; i<=9; i++) {
                Mousetrap.bind(i.toString(), function(e, key) {
                    // console.log(key);
                    var index = Number(key)-1;
                    if (index > $.fn.BEE.user_options.sst.length-1) { return; }
                    var sst = self.listOfSST[$.fn.BEE.user_options.sst[index]];
                    if (sst) { sst.selected(); }
                });
            }
            Mousetrap.bind('shift+up', function(e){
                self.camera.zoom += 0.1;
                self.camera.updateProjectionMatrix();
                return false;
            });
            Mousetrap.bind('shift+down', function(e){
                self.camera.zoom -= 0.1;
                self.camera.updateProjectionMatrix();
                return false;
            });
        },

        animate: function() {
            var self = this;
            window.animate = function() {
                if (self.options.camera.rotate) {
                    var newPos = Date.now() * 0.0001;
                    self.scene.rotation.y = newPos;
                    self.scene_slice.rotation.y = newPos;
                }
                else {
                    self.scene.rotation.y = 0;
                    self.scene_slice.rotation.y = 0;
                }
                self.animationId = window.requestAnimationFrame(window.animate);
                self.renderer.autoClear = false;
                self.renderer.clear();
                self.renderer.render(self.scene, self.camera);
                self.renderer.clearDepth();
                self.renderer.render(self.scene_slice, self.camera);
                stats.update();
            }
            window.animate();
        }
        // toLocalX: function(value) { return value - this.options.geom.halfx; },
        // toLocalY: function(value) { return value; },
        // toLocalZ: function(value) { return value - this.options.geom.halfz; }
        // toLocalX: function(value) { return value - this.options.geom.center[0]; },
        // toLocalY: function(value) { return value - this.options.geom.center[1]; },
        // toLocalZ: function(value) { return value - this.options.geom.center[2]; }
    };

    $.fn.BEE = function( options ) {
        $.fn.BEE.user_options = $.extend(true, {}, $.fn.BEE.options, options, Lockr.get('options') ); // recursive extend
        // console.log($.fn.BEE.user_options);

        var scene3D = Object.create(Scene3D);
        scene3D.init($.fn.BEE.user_options, this);

        $.fn.BEE.scene3D = scene3D;
        // console.log($.fn.BEE.scene3D);
        return this;
    };


    $.fn.BEE.options = {
        nEvents  : 100,
        id       : 0,
        theme    : 'dark',
        hasMC    : false,
        helper   : {
            showTPCs : true,
            showAxises : false,
            deadAreaOpacity : 0.0,
        },
        geom     : {
            name  : 'uboone',
            halfx : 128.,
            halfy : 116.,
            halfz : 520.,
            center : [128, 0, 520],
            angleU : 60,
            angleV : 60
        },
        camera   : {
            scale : 0.85,
            depth : 2000,
            ortho : true,
            rotate: false
        },
        slice : {
            width: 0.32,
            opacity: 0.05
        },
        material : {
            colorScale: 1.0,
            opacity : 0.2,
            showCharge : true
        },
        sst : [
            // "WireCell-charge",
            // "truth",
            // "WireCell-simple",
            // "WireCell-deblob"
        ]
    };
    $.fn.BEE.user_options = $.fn.BEE.options;

    $.fn.BEE.current_sst = {
        material: {
            size: 0,
            opacity: 0
        }
    };

    $.fn.BEE.ui_sst = {
        $el_container: $('#sst-docker'),
        $el_size: $('#sst-size'),
        $el_opacity: $("#sst-opacity"),
        $el_color: $('#sst-color')
    }

    $.fn.BEE.ui_sst.$el_size.slider({
      min: 1, max: 8, step: 0.5, value: 0,
      slide: function(event, ui) {
        $.fn.BEE.current_sst.material.size = ui.value;
      }
    }).slider("pips").slider("float");
    $.fn.BEE.ui_sst.$el_opacity.slider({
      min: 0, max: 1, step: 0.05, value: 0,
      slide: function(event, ui) {
        $.fn.BEE.current_sst.material.opacity = ui.value;
        checkSST($.fn.BEE.current_sst);
      }
    }).slider("pips").slider("float");
    $.fn.BEE.ui_sst.$el_color.on('change', function(){
        $.fn.BEE.current_sst.chargeColor = new THREE.Color($(this).val());
        if (!($.fn.BEE.user_options.material.showCharge)) {
            $.fn.BEE.scene3D.redrawAllSST();
        }
    });

    function saveLocalStorage() {
        var options = {
            'material' : $.fn.BEE.user_options.material,
            'slice' : $.fn.BEE.user_options.slice,
            'theme' : $.fn.BEE.user_options.theme,
            'helper': $.fn.BEE.user_options.helper
        };
        if ($.fn.BEE.current_sst) {
            options['selected_sst'] = $.fn.BEE.current_sst.name;
        }
        var sst_options = {};
        for (var name in $.fn.BEE.scene3D.listOfSST) {
            var sst = $.fn.BEE.scene3D.listOfSST[name];
            sst_options[name] = {
                'size': sst.material.size,
                'opacity' : sst.material.opacity,
                'chargeColor' : sst.chargeColor.getHexString()
            }
            // console.log(sst_options[name].chargeColor);
        }
        Lockr.set('options', options);
        Lockr.set('sst_options', sst_options);
    }

    window.setInterval(saveLocalStorage, 30000);
    $(window).bind('beforeunload', saveLocalStorage);

    function clearLocalStorage() {
        Lockr.flush();
    }

    function clearLocalStorageAndReload() {
        $(window).unbind('beforeunload');
        Lockr.flush();
        window.location.reload();
    }

    //
    function checkSST(sst) {
        // var $el = $('.dg .property-name:contains('+sst.name+')');
        var $el = listOfReconElems[sst.name];
         // $('.dg .property-name:contains('+sst.name+')');
        var color = sst.chargeColor;
        var rgb_string = 'rgb(' + color.r*255 + ', ' + color.g*255 + ', ' + color.b*255 + ', ' + sst.material.opacity+')';
        // console.log(rgb_string)
        $el.css('background-color', rgb_string);


    }

    // Utility funcitons
    function getColorAtScalar(n, maxLength) {
        var value;
        if (n>maxLength) {
            value = 0;
        }
        else {
            // value = Math.pow((maxLength-n)/maxLength, 3) * 270 / 360;
            value = (maxLength-n)/maxLength * 240 / 360;
        }
        return value;
        // return 220./360;
    }

    function getMaxOfArray(arr) {
      // return Math.max.apply(null, numArray);
      var len = arr.length, max = -Infinity;
      while (len--) {
        if (arr[len] > max) {
          max = arr[len];
        }
      }
      return max;
    }

    function getMinOfArray(arr) {
        var len = arr.length, min = Infinity;
        while (len--) {
          if (arr[len] < min) {
            min = arr[len];
          }
        }
        return min;
    }

    function getMeanOfArray(arr) {
        var sum = arr.reduce(function(a, b) { return a + b }, 0);
        return sum / (arr.length || 1);
    }

    function toLocalX(value) { return value - $.fn.BEE.user_options.geom.center[0]; }
    function toLocalY(value) { return value - $.fn.BEE.user_options.geom.center[1]; }
    function toLocalZ(value) { return value - $.fn.BEE.user_options.geom.center[2]; }
    function toGlobalX(value) { return value + $.fn.BEE.user_options.geom.center[0]; }
    function toGlobalY(value) { return value + $.fn.BEE.user_options.geom.center[1]; }
    function toGlobalZ(value) { return value + $.fn.BEE.user_options.geom.center[2]; }

})( jQuery, window, document );
