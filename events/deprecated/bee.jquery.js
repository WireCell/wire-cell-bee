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
    var root_url = base_url.substring(0, base_url.indexOf('set'));
    // console.log(index_of_query_postion, base_url, base_query, event_url, root_url);

    $( "#progressbar" ).progressbar({
      value: 0
    });

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
            0x00035b, // dark blue
            0xc20078, // magenta
            0x029386, // teal
            0xff81c0, // pink
            0x0a888a, // dark cyan
            0x014d4e, // dark teal
            0x960056, // dark magenta
            0xf97306, // orange
            0xcb416b, // dark pink
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

    // optical infomation
    var OP = {
        init: function() {
            var self = this;
            self.url = base_url + 'op/';
            self.driftV = 0.1101; // drift velocity cm/us
            self.currentFlash = 0;
            self.locations = {};
            self.loadOpLocations();
            self.loadData();
        },
        loadOpLocations: function() {
            var self = this;
            if ($.fn.BEE.user_options.geom.name == "uboone") {
                self.locations = {
                   4 : [2.645, -28.625, 990.356],
                   2 : [2.682, 27.607 , 989.712],
                   5 : [2.324, -56.514, 951.865],
                   0 : [2.458, 55.313 , 951.861],
                   6 : [2.041, -56.309, 911.939],
                   1 : [2.265, 55.822 , 911.066],
                   3 : [1.923, -0.722 , 865.598],
                   9 : [1.795, -0.502 , 796.208],
                   11: [1.495, -56.284, 751.905],
                   7 : [1.559, 55.625 , 751.884],
                   12: [1.487, -56.408, 711.274],
                   8 : [1.438, 55.8   , 711.073],
                   10: [1.475, -0.051 , 664.203],
                   15: [1.448, -0.549 , 585.284],
                   13: [1.226, 55.822 , 540.929],
                   17: [1.479, -56.205, 540.616],
                   18: [1.505, -56.323, 500.221],
                   14: [1.116, 55.771 , 500.134],
                   16: [1.481, -0.875 , 453.096],
                   21: [1.014, -0.706 , 373.839],
                   23: [1.451, -57.022, 328.341],
                   19: [0.913, 54.693 , 328.212],
                   20: [0.682, 54.646 , 287.976],
                   24: [1.092, -56.261, 287.639],
                   22: [0.949, -0.829 , 242.014],
                   28: [0.658, -0.303 , 173.743],
                   25: [0.703, 55.249 , 128.355],
                   30: [0.821, -56.203, 128.179],
                   31: [0.862, -56.615, 87.8695],
                   26: [0.558, 55.249 , 87.7605],
                   27: [0.665, 27.431 , 51.1015],
                   29: [0.947, -28.576, 50.4745]
                };
            }
            // console.log(self.locations);
        },
        loadData: function() {
            var self = this;
            self.process = $.getJSON(self.url, function(data) {
                // console.log(data);
                self.t = data.op_t;
                self.peTotal = data.op_peTotal;
                self.pes = data.op_pes;
                self.cluster_ids = data.op_cluster_ids;
                self.pes_pred = data.op_pes_pred;
                self.nomatching_cluster_ids = data.op_nomatching_cluster_ids;
                self.op_l1_t = data.op_l1_t;
                self.op_l1_pe = data.op_l1_pe;
            })
            .fail(function(){
                console.log("load " + self.url + " failed");
            });
        },
        enableDrawFlash: function() {
            var disp = $.fn.BEE.scene3D.gui.__folders.Flash.__controllers[1];
            disp.setValue(true);
        },
        enableMachingCluster: function() {
            this.enableDrawFlash();
            var disp = $.fn.BEE.scene3D.gui.__folders.Flash.__controllers[3];
            disp.setValue(true);
        },
        next: function() {
            var self = this;
            self.enableDrawFlash();
            if(self.currentFlash<self.t.length-1) {
                self.currentFlash+=1;
            }
            else {
                self.currentFlash=0;
            }
            self.draw(self.currentFlash);
        },
        prev: function() {
            var self = this;
            self.enableDrawFlash();
            if(self.currentFlash>0) {
                self.currentFlash-=1;
            }
            else {
                self.currentFlash=self.t.length-1;
            }
            self.draw(self.currentFlash);
        },
        nextMatching: function() {
            var self = this;
            self.enableMachingCluster();
            do {
               if(self.currentFlash<self.t.length-1) {
                   self.currentFlash+=1;
               }
               else {
                   self.currentFlash=0;
               }
            } while (self.cluster_ids[self.currentFlash].length==0)
            // console.log(self.cluster_ids[self.currentFlash]);
            self.draw(self.currentFlash);
        },
        prevMatching: function() {
            var self = this;
            self.enableMachingCluster();
            do {
                if(self.currentFlash>0) {
                    self.currentFlash-=1;
                }
                else {
                    self.currentFlash=self.t.length-1;
                }
            } while (self.cluster_ids[self.currentFlash].length==0)
            // console.log(self.cluster_ids[self.currentFlash]);
            self.draw(self.currentFlash);
        },
        nextMatchingBeam: function() {
            var self = this;
            self.enableMachingCluster();
            var n = 0;
            do {
               if(self.currentFlash<self.t.length-1) {
                   self.currentFlash+=1;
                   n+=1;
               }
               else {
                   self.currentFlash=0;
                   n+=1
               }
               // console.log(self.t[self.currentFlash]);
               if (n>self.t.length) break;
            } while (
                self.cluster_ids[self.currentFlash].length==0
                || self.t[self.currentFlash] < 2
                || self.t[self.currentFlash] > 6
            )
            // console.log(self.cluster_ids[self.currentFlash]);
            if (n<=self.t.length) {
                self.draw(self.currentFlash);
            }
            else {
                $.fn.BEE.scene3D.el_statusbar.html(
                   'No matching flash found inside (2us , 6us)'
                )
            }
        },
        toggle: function() {
            var self = this;
            if(self.group_op == undefined) {
                self.draw();
            }
            else {
                $.fn.BEE.scene3D.scene.remove(self.group_op);
                self.group_op = undefined;
                // console.log('cleared')
            }
        },
        draw: function() {
            var self = this;
            var currentFlash = self.currentFlash;
            var t = self.t[currentFlash];
            var peTotal = self.peTotal[currentFlash];
            var pes = self.pes[currentFlash];
            // console.log(t, peTotal, self.driftV*t);

            if(self.group_op != undefined) {
                $.fn.BEE.scene3D.scene.remove(self.group_op);
                // $.fn.BEE.scene3D.scene.remove(self.boxhelper);
            }
            self.group_op = new THREE.Group();
            var boxhelper = new THREE.Object3D;

            var halfx = $.fn.BEE.user_options.geom.halfx;
            var halfy = $.fn.BEE.user_options.geom.halfy;
            var halfz = $.fn.BEE.user_options.geom.halfz;
            var opBox = new THREE.Mesh(
                new THREE.BoxGeometry(halfx*2, halfy*2, halfz*2 ),
                new THREE.MeshBasicMaterial( {
                    color: 0x96f97b,
                    transparent: true,
                    depthWrite: true,
                    // blending: THREE.AdditiveBlending,
                    opacity: 0.5,
                    // wireframe: true
            }));
            var box = new THREE.BoxHelper(opBox);
            box.material.color.setHex(0xff0000);
            boxhelper.add(box);
            boxhelper.position.x = toLocalX($.fn.BEE.user_options.geom.center[0]+self.driftV*t);
            boxhelper.position.y = toLocalY($.fn.BEE.user_options.geom.center[1]);
            boxhelper.position.z = toLocalZ($.fn.BEE.user_options.geom.center[2]);
            self.group_op.add(boxhelper);
            // $.fn.BEE.scene3D.scene.add(self.boxhelper);  // slice has its own scene

            for (var i=0; i<32; i++) {
                var radius = 10;
                var segments = 32; //<-- Increase or decrease for more resolution I guess

                var circleGeometry = new THREE.CircleGeometry( radius, segments );
                var circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
                    color: 0xbbbbbb,
                    opacity: 0.01,
                    side: THREE.DoubleSide
                    // depthWrite: false
                    // wireframe: true
                }));
                // console.log(self.locations);
                circle.rotation.y = Math.PI / 2;
                circle.position.x = toLocalX(self.locations[i][0]+self.driftV*t);
                circle.position.y = toLocalY(self.locations[i][1]);
                circle.position.z = toLocalZ(self.locations[i][2]);
                self.group_op.add(circle);

                if ($.fn.BEE.options.flash.showPMTClone) {
                    // console.log('hah', $.fn.BEE.options.flash.showPMTClone)
                    var circle2 =circle.clone();
                    circle2.rotation.x = Math.PI / 2;
                    circle2.rotation.y = 0;
                    circle2.position.x = boxhelper.position.x + toLocalY(self.locations[i][1]);
                    circle2.position.y = boxhelper.position.y + $.fn.BEE.user_options.geom.halfy;
                    self.group_op.add(circle2);
                }
            }

            for (var i=0; i<32; i++) {
                if (pes[i] > 0.01 ) {
                    var radius = Math.sqrt(pes[i]);
                    var segments = 32; //<-- Increase or decrease for more resolution I guess

                    var circleGeometry = new THREE.CircleGeometry( radius, segments );
                    var circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
                        color: 0xff0000,
                        opacity: 0.2,
                        side: THREE.DoubleSide
                        // depthWrite: false
                        // wireframe: true
                    }));
                    // console.log(self.locations);
                    circle.rotation.y = Math.PI / 2;
                    circle.position.x = toLocalX(self.locations[i][0]+self.driftV*t);
                    circle.position.y = toLocalY(self.locations[i][1]);
                    circle.position.z = toLocalZ(self.locations[i][2]);
                    self.group_op.add(circle);


                    if ($.fn.BEE.options.flash.showPMTClone) {
                        var circle2 =circle.clone();
                        circle2.rotation.x = Math.PI / 2;
                        circle2.rotation.y = 0;
                        circle2.position.x = boxhelper.position.x + toLocalY(self.locations[i][1]);
                        circle2.position.y = boxhelper.position.y + $.fn.BEE.user_options.geom.halfy;
                        self.group_op.add(circle2);
                    }
                }

                if ($.fn.BEE.options.flash.showPred) {
                    try {
                        var pes_pred = self.pes_pred[currentFlash];
                        if (pes_pred[i] > 0.01 ) {
                            var radius_pred = Math.sqrt(self.pes_pred[currentFlash][i]);
                            var circleGeometry_pred = new THREE.CircleGeometry( radius_pred, segments );
                            // console.log(radius, radius_pred);
                            var circle_pred = new THREE.Mesh(circleGeometry_pred, new THREE.MeshBasicMaterial({
                                color: 0x15b01a,
                                opacity: 0.2,
                                side: THREE.DoubleSide
                            }));
                            circle_pred.rotation.y = Math.PI / 2;
                            circle_pred.position.x = toLocalX(self.locations[i][0]+self.driftV*t);
                            circle_pred.position.y = toLocalY(self.locations[i][1]-halfy*2);
                            circle_pred.position.z = toLocalZ(self.locations[i][2]);
                            self.group_op.add(circle_pred);
                        }
                    }
                    catch(err) {
                        // console.log(err);
                    }
                }


            }

            if ($.fn.BEE.options.flash.matchTiming) {
                $.fn.BEE.current_sst.drawInsideSlice(boxhelper.position.x-halfx, 2*halfx);
            }
            else {
                $.fn.BEE.current_sst.drawInsideThreeFrames();
            }

            $.fn.BEE.scene3D.scene.add( self.group_op );

            $.fn.BEE.scene3D.el_statusbar.html(
               '#' + self.currentFlash + ': (' + t + ' us, ' + peTotal + ' pe)'
            )
            if (self.op_l1_t) {
                var l1size = self.op_l1_t[self.currentFlash].length;
                if (l1size>1) {
                    var txt = $.fn.BEE.scene3D.el_statusbar.html();
                    for (var i=0; i<l1size; i++) {
                        txt += '<br/>L1: (' + self.op_l1_t[self.currentFlash][i] + ' us, ' + self.op_l1_pe[self.currentFlash][i] + ' pe)';
                    }

                    $.fn.BEE.scene3D.el_statusbar.html(txt);
                }
            }
            if (self.cluster_ids) {
                $.fn.BEE.scene3D.el_statusbar.html(
                    $.fn.BEE.scene3D.el_statusbar.html() +
                   '<br/>matching: ' + self.cluster_ids[self.currentFlash]
                )

            }
            if($.fn.BEE.user_options.helper.showSCB) {
                $.fn.BEE.scene3D.drawSpaceChargeBoundary(self.driftV*t);
            }

        }
    };

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

    var AutoSel = {
        init: function(name) {
            var self = this;
            self.name = name;
            self.url = base_url + name + "auto-sel/";
            self.loadData();
        },

        loadData: function() {
            var self = this;
            self.process = $.getJSON(self.url, function(data) {
                self.vtx = data['vtx'];
                // console.log(data);
                // var tracks = data['tracks'];
                // for (var i=0; i<tracks.length; i++) {
                //     var track = Object.create(TRACK);
                //     var track_data = tracks[i];
                //     track.init(track_data);
                //     self.tracks.push(track);
                // }
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

        setEventText: function() {
            // $("#fullscreeninfo").html(text);
            if ($.fn.BEE.user_options.geom.name == "protodune") {
                var text = '';
                var momentumMap = {
                  // '3936' : '2 GeV',
                  '5762' : '2 GeV',
                  '5145' : '7 GeV',
                  '5387' : '1 GeV',
                  '5432' : '2 GeV',
                  '5770' : '6 GeV',
                  '5786' : '3 GeV',
                  '5826' : '0.5 GeV',
                  '5834' : '0.3 GeV'
                };
                var triggerMap = {
                    '12': 'Beam',
                    '13': 'CRT',
                    '8': 'Random'
                };
                var eventStr = "Event: " + $.fn.BEE.current_sst.runNo + " - " + $.fn.BEE.current_sst.subRunNo + " - " + $.fn.BEE.current_sst.eventNo;
                text += eventStr;

                var triggerStr = triggerMap[$.fn.BEE.current_sst.trigger];
                if (triggerStr) {
                    triggerStr = $.fn.BEE.current_sst.trigger + ' [' + triggerStr + ']';
                }
                else {
                    triggerStr = 'N/A';
                }
                text += '<br /> Trigger: ' + triggerStr;

                var momentum = momentumMap[$.fn.BEE.current_sst.runNo];
                if (momentum) {
                    text += ' [momentum = ' + momentum + ']';
                }

                var timeStr =  $.fn.BEE.current_sst.eventTime;
                text += "<br />" + timeStr;
                $("#event-text").html(text);
            }
        },

        reload: function() {
            var self = this;
            if (base_url.indexOf("gallery")>0) {
                var event_index = base_url.indexOf(event_url);
                var eventNo = parseInt(base_url.substring(event_url.length));
                if (eventNo == $.fn.BEE.user_options.nEvents-1) { eventNo = 0; }
                else { eventNo += 1; }
                base_url = event_url + eventNo + '/';
                self.url =  base_url + self.name + "/";
                // console.log($.fn.BEE.user_options.nEvents);
            }

            self.setup().then(function() {
                $('#runNo').html(self.runNo);
                $('#eventNo').html(self.eventNo);
                self.setEventText();
                console.log('reloading: ', self.url);
            });
        },

        refresh: function(sec) {
            var self = this;
            console.log("start refreshing at interval", sec, "sec");
            self.refreshInterval = setInterval(function(){
                self.reload();
            }, sec*1000);
        },

        stopRefresh: function() {
            clearInterval(this.refreshInterval);
            console.log("stop refreshing");
        },

        setup: function() {
            var self = this;
            self.process = $.getJSON(self.url, function(data) {
                self.initData(data);
                self.initPointCloud();
                // self.initKdTree();
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
            var QTHRESH = 0;
            if (self.name == "truth" || self.name == "L1") {
                QTHRESH = 500;
            }
            for (var i = 0; i < size; i++) {
                if (data.q != undefined && data.q[i]<QTHRESH) continue;
                indices.push(i);
            }
            var size_reduced = indices.length;
            // console.log(size_reduced, size)
            self.x = new Float32Array(size_reduced);
            self.y = new Float32Array(size_reduced);
            self.z = new Float32Array(size_reduced);
            self.q = new Float32Array(size_reduced);
            self.cluster_id = new Float32Array(size_reduced);
            // self.nq = [];
            self.runNo = data.runNo;
            self.subRunNo = data.subRunNo;
            self.eventNo = data.eventNo;
            if (data.eventTime == undefined) {self.eventTime = "";}
            else {self.eventTime = data.eventTime;}
            if (data.trigger == undefined) {self.trigger = "0";}
            else {self.trigger = data.trigger;}
            // console.log(data);
            if (data.bounding_box == undefined) { self.bounding_box = []; }
            else { self.bounding_box = data.bounding_box;}
            self.clusterInfo = {};

            for (var i = 0; i < size_reduced; i++) {
                // if (data.q != undefined && data.q[i]<QTHRESH) continue;
                self.x[i] = data.x[ indices[i] ];
                self.y[i] = data.y[ indices[i] ];
                self.z[i] = data.z[ indices[i] ];
                if (data.q == undefined) {
                    self.q[i] = 0;
                }
                else {
                    self.q[i] = data.q[ indices[i] ];
                }

                if (data.cluster_id == undefined) {
                    self.cluster_id[i] = 0;
                }
                else {
                    self.cluster_id[i] = data.cluster_id[ indices[i] ];
                }

                var thisCluster = self.cluster_id[i];
                if (!(thisCluster in self.clusterInfo)) {
                    self.clusterInfo[thisCluster] = {
                        'x_mean': 0,
                        'y_mean': 0,
                        'z_mean': 0,
                        'n': 0
                    };
                }
                else {
                    self.clusterInfo[thisCluster].x_mean += self.x[i];
                    self.clusterInfo[thisCluster].y_mean += self.y[i];
                    self.clusterInfo[thisCluster].z_mean += self.z[i];
                    self.clusterInfo[thisCluster].n += 1;
                }
            }
            self.nCluster = 0;
            for (var id in self.clusterInfo) {
                // console.log(attr)
                self.nCluster += 1;
                self.clusterInfo[id].x_mean /= self.clusterInfo[id].n;
                self.clusterInfo[id].y_mean /= self.clusterInfo[id].n;
                self.clusterInfo[id].z_mean /= self.clusterInfo[id].n;
            }
            // console.log(self.cluster_id);
            // console.log(self.clusterInfo, self.nCluster);
        },

        initPointCloud: function() {
            var self = this;
            var size = self.x.length;
            if(self.material) {
                var current_size = self.material.size;
                var current_opacity = self.material.opacity;
                var current_chargeColor = self.chargeColor;
                // console.log(current_size, current_opacity, current_chargeColor);
            }

            self.material = new THREE.PointsMaterial({
                vertexColors    : true,
                size            : 2,
                blending        : THREE.NormalBlending,
                opacity         : 0.,
                transparent     : true,
                depthWrite      : false,
                sizeAttenuation : false
            });
            if (self.name == self.options.sst[0]) self.material.opacity = self.options.material.opacity;
            if (current_size) {
                self.material.size = current_size;
                self.material.opacity = current_opacity;
                self.chargeColor = current_chargeColor;
            }

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
            self.drawInsideThreeFrames(false, $.fn.BEE.user_options.box.box_mode);
            // self.drawInsideBeamFrame()
        },

        doCluster: function() {
            var self = this;
            self.listOfClusteredPoints = {};

            var size = self.x.length;
            var kd_positions = new Float32Array( size * 3 );

            for (var i=0; i<size; i++) {
                kd_positions[i*3] = toLocalX(self.x[i]);
                kd_positions[i*3+1] = toLocalY(self.y[i]);
                kd_positions[i*3+2] = toLocalZ(self.z[i]);
            }

            var worker_url = root_url;
            if (worker_url.indexOf('localhost')>1
                || worker_url.indexOf('127.0.0.1')>1) {
                worker_url += "static/js/worker_cluster.js";
            }
            else if (worker_url.indexOf('twister')>1) {
                worker_url = worker_url.replace('bee/', 'static/js/worker_cluster.js');
            }
            else {
                worker_url = worker_url.replace('bee', 'bee-static');
                worker_url += "js/worker_cluster.js";
            }
            console.log(worker_url);
            var worker = new Worker(worker_url);
            worker.postMessage({
                kd_positions: kd_positions
            });

            var nClusters = 0;
            worker.onmessage = function(e) {
                $('#cluster-message').html(e.data.message);
                if (!('nodes' in e.data)) return;
                $('#progressbar').progressbar('value', e.data.percentage);
                var clustered_positions = [];
                for (var key in e.data.nodes) {
                    clustered_positions.push(e.data.nodes[key]);
                }
                var size = clustered_positions.length;

                // if (size < 20) return;

                var positions = new Float32Array( size * 3 );
                for (var i=0; i<size; i++) {
                  positions[i*3]   = clustered_positions[i][0];
                  positions[i*3+1] = clustered_positions[i][1];
                  positions[i*3+2] = clustered_positions[i][2];
                }

                var theme = $.fn.BEE.user_options['theme'];
                var color = Math.floor(Math.random() * USER_COLORS[theme].length);
                var material = new THREE.PointsMaterial({
                  // vertexColors    : true,
                  color           :  USER_COLORS[theme][color],
                  size            : 2,
                  blending        : THREE.NormalBlending,
                  opacity         : 0.5,
                  transparent     : true,
                  depthWrite      : false,
                  sizeAttenuation : false
                });
                var geometry = new THREE.BufferGeometry();
                geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                var clusterPointCloud = new THREE.Points(geometry, material);
                if (!(self.containedIn == null)) {
                  self.containedIn.add(clusterPointCloud);
                }
                self.listOfClusteredPoints[nClusters] = clusterPointCloud;
                nClusters += 1;
            };

        },

        cleanUpCluster: function(minPoints) {
            var self = this;
            for (var key in self.listOfClusteredPoints) {
                var cluster = self.listOfClusteredPoints[key];
                var positions = cluster.geometry.attributes.position.array;
                if (positions.length < minPoints) {
                    self.containedIn.remove(cluster);
                }
            }
        },

        clusterAll: function() {
            var self = this;
            var totalPoints = self.kd_positions.length /3;
            var all_nodes = {};
            for (var i=0; i<totalPoints; i++) {
                all_nodes[i] = true;
            }

            var measureStart = new Date().getTime();
            var percentage = 0.;
            // setInterval( function(){
            //     $('#progressbar').progressbar( "value", percentage );
            //     console.log(percentage);
            // }, 2000);
            do {
                var count = 0;
                for (var key in all_nodes) {
                    var position = [
                        self.kd_positions[key*3],
                        self.kd_positions[key*3+1],
                        self.kd_positions[key*3+2]
                    ]
                    var clustered_nodes = self.drawCluster(position, 100, 4);
                    for (var clustered_key in clustered_nodes) {
                        delete all_nodes[clustered_key];
                    }
                    count += 1;
                    if (count == 1) {
                        break;
                    }
                }
                percentage = (1 - countKeys(all_nodes)/totalPoints )*100;
                console.log( percentage+'% done' );
            } while (percentage<1)

            console.log('TIME cluster', new Date().getTime() - measureStart);

        },

        drawCluster: function(position, maxNodes, maxDistance) {
            var self = this;

            var clustered_nodes = {};
            var tobe_clustered_nodes = {};
            var new_nodes = {};
            var lastSize = 0;

            var positionsInRange = self.kdtree.nearest(position, maxNodes, maxDistance);
            var size = positionsInRange.length;
            for (var i=0; i<size; i++) {
                var pos = positionsInRange[i][0].obj;
                // clustered_positions.push(pos);

                var index = positionsInRange[i][0].pos;
                tobe_clustered_nodes[index] = pos;
            }

            do {
                new_nodes = {};
                for (var key in tobe_clustered_nodes) {
                    if (key in clustered_nodes) continue;
                    var positionsInRange = self.kdtree.nearest(tobe_clustered_nodes[key], maxNodes, maxDistance);
                    var size = positionsInRange.length;
                    for (var i=0; i<size; i++) {
                        var pos = positionsInRange[i][0].obj;
                        var index = positionsInRange[i][0].pos;
                        new_nodes[index] = pos;
                    }
                    clustered_nodes[key] = tobe_clustered_nodes[key];
                }
                for (var key in new_nodes) {
                    if (key in clustered_nodes) {
                        delete new_nodes[key];
                    }
                }
                tobe_clustered_nodes = new_nodes;
                // console.log(countKeys(clustered_nodes), countKeys(new_nodes));
            } while (countKeys(new_nodes)>0);


            var clustered_positions = [];
            for (var key in clustered_nodes) {
                clustered_positions.push(clustered_nodes[key]);
            }

        },

        drawInsideBox: function(xmin, xmax, ymin, ymax, zmin, zmax, randomClusterColor=false) {
            var self = this;
            var size = self.x.length;

            if(self.boxhelper != undefined) {
                // $.fn.BEE.scene3D.scene.remove(self.group_box);
                $.fn.BEE.scene3D.scene.remove(self.boxhelper);
            }

            if (!(self.containedIn == null)) {
                self.containedIn.remove(self.pointCloud);
            }

            var indices  = [];
            for (var i=0; i<size; i++) {
                var x = toLocalX(self.x[i]);
                var y = toLocalY(self.y[i]);
                var z = toLocalZ(self.z[i]);
                if (x<xmin || x>xmax || y<ymin || y>ymax || z<zmin || z>zmax ) {
                    continue;
                }
                indices.push(i);
            }
            var size_show = indices.length;
            var positions = new Float32Array( size_show * 3 );
            var colors = new Float32Array( size_show * 3 );

            var ran = Math.floor(Math.random()*5);
            if (!randomClusterColor) {ran = 0;}
            // console.log( $.fn.BEE.scene3D.op.currentFlash );
            // console.log( $.fn.BEE.user_options.flash.showMatchingCluster );
            var size_actual = 0;
            for (var i=0; i<size_show; i++) {
                var ind = indices[i];
                if ($.fn.BEE.user_options.flash.tpc_cluster_id != -1) {
                    if (self.cluster_id[ind] != $.fn.BEE.user_options.flash.tpc_cluster_id) {
                        continue;
                    }
                }
                if ($.fn.BEE.options.flash.showNonMatchingCluster) {
                    try {
                        var op = $.fn.BEE.scene3D.op;
                        if(! op.nomatching_cluster_ids.includes(self.cluster_id[ind]) ) {
                            continue;
                        }
                        else {
                            // console.log(op_cluster_ids, self.cluster_id[ind]);
                        }
                    }
                    catch(err) {
                        // console.log(err);
                    }
                }
                else if ($.fn.BEE.user_options.flash.showMatchingCluster) {
                    try {
                        var op = $.fn.BEE.scene3D.op;
                        var op_cluster_ids = op.cluster_ids[op.currentFlash];
                        if(! op_cluster_ids.includes(self.cluster_id[ind]) ) {
                            continue;
                        }
                        else {
                            // console.log(op_cluster_ids, self.cluster_id[ind]);
                        }
                    }
                    catch(err) {
                        // console.log(err);
                    }

                }
                // add position
                positions[size_actual*3] = toLocalX(self.x[ind]);
                positions[size_actual*3+1] = toLocalY(self.y[ind]);
                positions[size_actual*3+2] = toLocalZ(self.z[ind]);
                // add color
                var color = new THREE.Color();
                if ($.fn.BEE.user_options.material.showCluster) {
                    var theme = $.fn.BEE.user_options['theme'];
                    var length = USER_COLORS[theme].length;
                    var color_id = Math.floor( (self.cluster_id[ind]+length) % (length-ran) );
                    color = new THREE.Color(USER_COLORS[theme][color_id]);
                }
                else if ($.fn.BEE.user_options.material.showCharge) {
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
                color.toArray( colors, size_actual * 3 );

                size_actual += 1;

            }

            positions = positions.slice(0, size_actual*3);
            colors = colors.slice(0, size_actual*3);
            // console.log(positions);

            self.geometry = new THREE.BufferGeometry();
            self.geometry.dynamic = true;
            self.geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
            self.geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
            // geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
            // console.log(self.geometry.attributes.position);
            // console.log(self.geometry.attributes.color);

            self.geometry.attributes.position.needsUpdate = true;
            self.geometry.attributes.color.needsUpdate = true;

            self.pointCloud = new THREE.Points(self.geometry, self.material);

            if (!(self.containedIn == null)) {
                self.containedIn.add(self.pointCloud);
            }
        },

        drawInsideSlice: function(start, width, randomClusterColor=false) {
            var self = this;
            self.drawInsideBox(start, start+width, -1e9, 1e9, -1e9, 1e9, randomClusterColor);
        },

        drawInsideThreeFrames: function(randomClusterColor=false, box_mode=false) {
            if (box_mode) {
                this.drawInsideBoxHelper();
            }
            else {
                this.drawInsideSlice(-3*this.options.geom.halfx, this.options.geom.halfx*6, randomClusterColor);
            }
        },

        drawInsideBeamFrame: function() {
            this.drawInsideSlice(-this.options.geom.halfx, this.options.geom.halfx*2);
        },

        drawInsideTPC: function(tpcNo) {
            var self = this;
            var r = $.fn.BEE.scene3D.tpcLoc[tpcNo];
            self.drawInsideBox(
                toLocalX(r[0]), toLocalX(r[1]),
                toLocalY(r[2]), toLocalY(r[3]),
                toLocalZ(r[4]), toLocalZ(r[5]));
        },

        drawInsideBoxHelper: function() {
            var self = this;

            var xmin = toLocalX($.fn.BEE.user_options.box.xmin);
            var xmax = toLocalX($.fn.BEE.user_options.box.xmax);
            var ymin = toLocalY($.fn.BEE.user_options.box.ymin);
            var ymax = toLocalY($.fn.BEE.user_options.box.ymax);
            var zmin = toLocalZ($.fn.BEE.user_options.box.zmin);
            var zmax = toLocalZ($.fn.BEE.user_options.box.zmax);
            var tpcNo = $.fn.BEE.user_options.box.tpcNo;

            if (tpcNo >= 0) {
                var r = $.fn.BEE.scene3D.tpcLoc[tpcNo];
                xmin = toLocalX(r[0]);
                xmax = toLocalX(r[1]);
                // xmin = toLocalX(r[0]-$.fn.BEE.scene3D.driftVelocity*$.fn.BEE.scene3D.daqTimeBeforeTrigger);
                // xmax = toLocalX(r[0]+$.fn.BEE.scene3D.driftVelocity*$.fn.BEE.scene3D.daqTimeAfterTrigger);
                ymin = toLocalY(r[2]);
                ymax = toLocalY(r[3]);
                zmin = toLocalZ(r[4]);
                zmax = toLocalZ(r[5]);
            }

            self.drawInsideBox(xmin, xmax, ymin, ymax, zmin, zmax);

            if(self.boxhelper != undefined) {
                // $.fn.BEE.scene3D.scene.remove(self.group_box);
                $.fn.BEE.scene3D.scene.remove(self.boxhelper);
            }
            // self.group_box = new THREE.Group();
            self.boxhelper = new THREE.Object3D;
            var aBox = new THREE.Mesh(
                new THREE.BoxGeometry(xmax-xmin, ymax-ymin, zmax-zmin ),
                new THREE.MeshBasicMaterial( {
                    color: 0x96f97b,
                    transparent: true,
                    depthWrite: true,
                    opacity: 0.5,
            }));
            var box = new THREE.BoxHelper(aBox);
            box.material.color.setHex(0xff0000);
            self.boxhelper.add(box);
            self.boxhelper.position.x = (xmax+xmin)/2;
            self.boxhelper.position.y = (ymax+ymin)/2;
            self.boxhelper.position.z = (zmax+zmin)/2;
            // self.group_box.add(self.boxhelper);
            // $.fn.BEE.scene3D.scene.add( self.group_op );
            $.fn.BEE.scene3D.scene.add( self.boxhelper );

        },

        // drawROI: function() {
        //     var self = this;
        //     $.fn.BEE.scene3D.drawROI = true;
        //     for (var i=0; i<$.fn.BEE.scene3D.tpcHelpers.length; i++) {
        //         if (i!=$.fn.BEE.scene3D.roiTPC) {
        //             $.fn.BEE.scene3D.tpcHelpers[i].visible = false;
        //         }
        //         else {
        //             $.fn.BEE.scene3D.tpcHelpers[i].visible = true;
        //         }
        //     }
        //     self.drawInsideTPC($.fn.BEE.scene3D.roiTPC);
        // },

        toggleROI: function() {
            var self = this;
            $.fn.BEE.scene3D.drawROI = !$.fn.BEE.scene3D.drawROI
            if ($.fn.BEE.scene3D.drawROI) {
                for (var i=0; i<$.fn.BEE.scene3D.tpcHelpers.length; i++) {
                    if (i!=$.fn.BEE.scene3D.roiTPC) {
                        $.fn.BEE.scene3D.tpcHelpers[i].visible = false;
                    }
                    else {
                        $.fn.BEE.scene3D.tpcHelpers[i].visible = true;
                    }
                }
                self.drawInsideTPC($.fn.BEE.scene3D.roiTPC);
            }
            else {
                for (var i=0; i<$.fn.BEE.scene3D.tpcHelpers.length; i++) {
                    $.fn.BEE.scene3D.tpcHelpers[i].visible = true;
                }
                self.drawInsideThreeFrames();
            }
        },

        setProp: function() {
            var self = this;
            if (!$.fn.BEE.user_options.material.overlay) {
                for (var name in $.fn.BEE.scene3D.listOfSST) {
                    $.fn.BEE.scene3D.listOfSST[name].material.opacity = 0;
                }
                self.material.opacity = $.fn.BEE.user_options.material.opacity;
            }
            $.fn.BEE.ui_sst.$el_size.slider("value", self.material.size);
            $.fn.BEE.ui_sst.$el_opacity.slider("value", self.material.opacity);
            $.fn.BEE.ui_sst.$el_color.val('#'+self.chargeColor.getHexString());
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
                    self.setProp();
                    // $.fn.BEE.ui_sst.$el_size.slider("value", self.material.size);
                    // $.fn.BEE.ui_sst.$el_opacity.slider("value", self.material.opacity);
                    // $.fn.BEE.ui_sst.$el_color.val('#'+self.chargeColor.getHexString());
                }, function(){});
            }
            else {
                self.setProp();
                // $.fn.BEE.ui_sst.$el_size.slider("value", self.material.size);
                // $.fn.BEE.ui_sst.$el_opacity.slider("value", self.material.opacity);
                // $.fn.BEE.ui_sst.$el_color.val('#'+self.chargeColor.getHexString());
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

            // if (! $.fn.BEE.user_options.geom.name == "dl") {
                self.initHelper();
            // }
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
            self.initAutoSel();
            self.initOP();
            self.initCT();
            self.initDeadArea();
            // if ($.fn.BEE.user_options.helper.showSCB) {
            //     self.drawSpaceChargeBoundary();
            // }
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

            self.setLogo();
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
            var folder_helper = self.gui.addFolder("Helper");
            folder_helper.add($.fn.BEE.user_options.helper, "showTPCs")
                .name("Show TPCs")
                .onChange(function(value) {
                    if (value) {
                        self.group_main.add(self.group_helper);
                    }
                    else {
                        self.group_main.remove(self.group_helper);
                    }
                });
            folder_helper.add($.fn.BEE.user_options.helper, "showAxises")
                .name("Show Axes")
                .onChange(function(value) {
                    if (value) {
                        self.scene.add(self.axises);
                    }
                    else {
                        self.scene.remove(self.axises);
                    }
                });
            folder_helper.add($.fn.BEE.user_options.helper, "showMCNeutral")
                .name("Show Neutral Particles (MC)")
                .onChange(function(value) {
                    $('#mc').jstree(true).refresh();
                });
            folder_helper.add($.fn.BEE.user_options.helper, "showBeam")
                .name("Show Beam")
                .onChange(function(value) {
                    if (value) {
                        self.group_main.add(self.arrowHelper);
                    }
                    else {
                        self.group_main.remove(self.arrowHelper);
                    }
                });
            folder_helper.add($.fn.BEE.user_options.helper, "showSCB")
            .name("Show SCB")
            .onChange(function(value) {
                if (value) {
                    var op = $.fn.BEE.scene3D.op;
                    if (op.t != undefined) {
                        self.drawSpaceChargeBoundary(
                            op.t[op.currentFlash]*op.driftV
                        );
                    }
                    else {
                        self.drawSpaceChargeBoundary();
                    }

                }
                else {
                    if (self.listOfSCBObjects != undefined) {
                        for (var i=0; i<self.listOfSCBObjects.length; i++){
                            self.scene.remove(self.listOfSCBObjects[i]);
                        }
                        self.listOfSCBObjects= [];            
                    }
                }
            });
            folder_helper.add($.fn.BEE.user_options.helper, "deadAreaOpacity", 0., 0.9)
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
            if (base_url.indexOf("live")>0 || base_url.indexOf("gallery")>0) {
                var folder_live = self.gui.addFolder("Live");
                folder_live.add($.fn.BEE.user_options.live, "refresh")
                    .name("Refresh")
                    .onChange(function(value) {
                        if(value) {
                           $.fn.BEE.current_sst.refresh( $.fn.BEE.user_options.live.interval );
                        }
                        else {
                            $.fn.BEE.current_sst.stopRefresh();
                        }
                    });
                folder_live.add($.fn.BEE.user_options.live, "interval")
                    .name("Interval");
                folder_live.open();
            }

            var folder_flash = self.gui.addFolder("Flash");
            var folder_recon = self.gui.addFolder("Recon");

            var folder_box = self.gui.addFolder("Box");
            folder_box.add($.fn.BEE.user_options.box, "box_mode")
                .name("Box Mode")
                .onChange(function(value) {
                    if(value) {
                       $.fn.BEE.current_sst.drawInsideBoxHelper();
                    }
                    else {
                        $.fn.BEE.current_sst.drawInsideThreeFrames();
                    }
                });
            folder_box.add($.fn.BEE.user_options.box, "xmin")
                .name("x min");
            folder_box.add($.fn.BEE.user_options.box, "xmax")
                .name("x max");
            folder_box.add($.fn.BEE.user_options.box, "ymin")
                .name("y min");
            folder_box.add($.fn.BEE.user_options.box, "ymax")
                .name("y max");
            folder_box.add($.fn.BEE.user_options.box, "zmin")
                .name("z min");
            folder_box.add($.fn.BEE.user_options.box, "zmax")
                .name("z max");
            folder_box.add($.fn.BEE.user_options.box, "tpcNo", -1, 11)
                .name("TPC No.").step(1)
                .onChange(function(value) {
                    // console.log(value);
                    if (value >= 0) {
                        $.fn.BEE.current_sst.drawInsideBoxHelper();
                    }
                    else {
                        $.fn.BEE.current_sst.drawInsideThreeFrames();
                    }
                    // $.fn.BEE.scene3D.roiTPC = value;
                    // $.fn.BEE.current_sst.drawROI();
                });
            // console.log(self.gui.__folders.Recon)
            var options = {
                'id' : $.fn.BEE.user_options.id,
                'flash_id': 0
            };
            folder_general.add(options, 'id', 0, $.fn.BEE.user_options.nEvents-1)
                .name("Event").step(1)
                .onFinishChange(function(value) {
                    // console.log($.fn.BEE.user_options.id, value);
                    if (value == $.fn.BEE.user_options.id) { return; }
                    window.location.assign(event_url + value + '/' + base_query);
                });

            folder_general.add($.fn.BEE.user_options, 'theme', ['dark', 'light'])
               .name("Theme")
               .onChange(function(value) {
                    // clearLocalStorage();
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

            // folder_general.add(self, 'toggleOp').name('Toggle Flash');

            folder_general.add($.fn.BEE.user_options.material, "showCluster")
                .name("Show Cluster")
                .onChange(function(value) {
                    self.redrawAllSST();
                });

            folder_general.add($.fn.BEE.user_options.material, "overlay")
                .name("Overlay Reco")
                .onChange(function(value) {
                    // self.redrawAllSST()
                    // console.log($.fn.BEE.user_options.overlay);
                });

            folder_general.open();

            folder_flash.add(options, 'flash_id', 0, 200)
                .name("Flash ID").step(1)
                .onFinishChange(function(value) {
                    var nFlash = self.op.t.length;
                    if (value<nFlash) {
                        self.op.currentFlash = value;
                        self.drawOp();
                    }
                });
            folder_flash.add($.fn.BEE.user_options.flash, "showFlash")
                .name("Show Flash")
                .onChange(function(value) {
                    self.toggleOp();
                });
            folder_flash.add($.fn.BEE.user_options.flash, "showPMTClone")
                .name("Show PMT Clone")
                .onChange(function(value) {
                    $.fn.BEE.options.flash.showPMTClone = value;
                    self.drawOp();
                });
            folder_flash.add($.fn.BEE.user_options.flash, "showMatchingCluster")
                .name("Matching Cluster")
                .onChange(function(value) {
                    $.fn.BEE.options.flash.showMatchingCluster = value;
                    self.drawOp();
                });
            folder_flash.add($.fn.BEE.user_options.flash, "matchTiming")
                .name("Matching Box")
                .onChange(function(value) {
                    $.fn.BEE.options.flash.matchTiming = value;
                    self.drawOp();
                });
            folder_flash.add($.fn.BEE.user_options.flash, "showPred")
                .name("Prediction")
                .onChange(function(value) {
                    $.fn.BEE.options.flash.showPred = value;
                    self.drawOp();
                });
            folder_flash.add($.fn.BEE.user_options.flash, "showNonMatchingCluster")
                .name("Non-matching")
                .onChange(function(value) {
                    $.fn.BEE.options.flash.showNonMatchingCluster = value;
                    self.drawOp();
                    if (value) {
                      $.fn.BEE.scene3D.el_statusbar.html(
                          'non-matching: ' + self.op.nomatching_cluster_ids
                      );
                    }
                });
            folder_flash.add($.fn.BEE.user_options.flash, 'tpc_cluster_id', -1, 200)
                .name("Cluster ID").step(1)
                .onFinishChange(function(value) {
                    $.fn.BEE.user_options.flash.tpc_cluster_id = value;
                    self.drawOp();
                });

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
            folder_camera.add($.fn.BEE.user_options.camera, "multiview")
                .name("Multi-view")
                .onChange(function(value) {
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
            if ($.fn.BEE.user_options.geom.name == "protodune") {
                folder_camera.add($.fn.BEE.user_options.camera, "photo_booth")
                    .name("Photo Booth")
                    .onChange(function(value) {
                        if(value && $.fn.BEE.user_options.camera.ortho) {
                            alert("Photo booth mode is designed to work under Perspective Camera!");
                        }
                    });
            }
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
            folder_slice.add(ctrl.slice, "width", 0.32, halfx*2).step(0.32)
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
            // console.log(self.options);

            // orthographic camera: frustum aspect ratio mush match viewport's aspect ratio
            self.camera = $.fn.BEE.user_options.camera.ortho
                ? new THREE.OrthographicCamera(window.innerWidth/-2*self.options.camera.scale, window.innerWidth/2*self.options.camera.scale, window.innerHeight/2, window.innerHeight/-2, 1, 8000)
                : new THREE.PerspectiveCamera(25, window.innerWidth*self.options.camera.scale / window.innerHeight, 1, 8000);
            var camera = self.camera;
            camera.position.z = depth*Math.cos(Math.PI/4);
            camera.position.x = -depth*Math.sin(Math.PI/4);
            camera.position.y = depth*Math.sin(Math.PI/6);
            // var depth0 = 3000;
            // camera.position.z = depth0*Math.cos(Math.PI/4);
            // camera.position.x = -depth0*Math.sin(Math.PI/4);
            // camera.position.y = depth0*Math.sin(Math.PI/6);
            if ($.fn.BEE.user_options.camera.ortho) {
                camera.zoom = 1500./depth;
                camera.updateProjectionMatrix();
            }
            // camera.zoom = depth0/depth;
            // camera.updateProjectionMatrix();


            self.frontCamera = new THREE.OrthographicCamera(window.innerWidth/-2*self.options.camera.scale, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 4000);
            self.frontCamera.position.set (-1000,0,0);
            self.frontCamera.lookAt (new THREE.Vector3(0,0,0));

            self.sideCamera = new THREE.OrthographicCamera(window.innerWidth/-2*self.options.camera.scale, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 4000);
            self.sideCamera.position.set(0,0,1000);
            self.sideCamera.lookAt (new THREE.Vector3(0,0,0));

            self.topCamera = new THREE.OrthographicCamera(window.innerWidth/-2*self.options.camera.scale, window.innerWidth/2, window.innerHeight/2, window.innerHeight/-2, 1, 4000);
            self.topCamera.position.set(0,1000,0);
            self.topCamera.up.set(1,0,0);
            self.topCamera.lookAt(new THREE.Vector3(0,0,0));

        },

        initScene: function() {
            var self = this;

            self.scene  = new THREE.Scene();
            self.scene_slice = new THREE.Scene();

            self.group_main = new THREE.Group();
            self.scene.add(self.group_main);

            // self.axises = new THREE.AxisHelper( 100 );
            self.axises = new THREE.AxesHelper( 100 );
            if ($.fn.BEE.user_options.helper.showAxises) {
                self.scene.add(self.axises);
            }

        },

        initHelper: function() {
            var self = this;
            self.group_helper = new THREE.Group();
            self.tpcHelpers = [];
            self.roiTPC = 0;
            self.drawROI = false;
            // default are for protodune
            self.driftVelocity = 0.16; // cm/us
            self.daqTimeBeforeTrigger = 500*0.5; //us
            self.daqTimeAfterTrigger = 5500*0.5; //us

            // $.fn.BEE.user_options.geom.name = "dune35t";

            if ($.fn.BEE.user_options.geom.name == "uboone") {
                self.tpcLoc = [
                    // [0., 256., -116., 116., 0., 1040.]
                    [0., 256., -115.51, 117.45, 0., 1036.96]
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[0][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[0][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[0][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[0][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[0][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[0][5]+self.tpcLoc[0][4])/2;
                self.driftVelocity = 0.1101; // cm/us
                self.daqTimeBeforeTrigger = (3200+10)*0.5; //us
                self.daqTimeAfterTrigger = (6400-10)*0.5; //us
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
                self.roiTPC = 1;
            }

            else if ($.fn.BEE.user_options.geom.name == "icarus") {
                self.tpcLoc = [
                    [-369.06, -220.86, -181.86, 134.96, -894.951, 894.951],
                    [-219.57, -71.37, -181.86, 134.96, -894.951, 894.951],
                    [71.37, 219.57, -181.86, 134.96, -894.951, 894.951],
                    [220.86, 369.06, -181.86, 134.96, -894.951, 894.951],
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[3][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[3][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[3][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[3][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[3][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[3][5]+self.tpcLoc[0][4])/2;

                self.guiController.slice.position = -$.fn.BEE.user_options.geom.halfx;
                // self.roiTPC = 1;
            }

            if ($.fn.BEE.user_options.geom.name == "dl") {
                self.tpcLoc = [
                    // [0., 256., -115.51, 117.45, 0., 1036.96]
                    // [13.77, 59.84, -14.39, 31.6, 129.32, 175.4]
                    $.fn.BEE.user_options.geom.bounding_box
                ];
                $.fn.BEE.user_options.geom.halfx = (self.tpcLoc[0][1]-self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.halfy = (self.tpcLoc[0][3]-self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.halfz = (self.tpcLoc[0][5]-self.tpcLoc[0][4])/2;
                $.fn.BEE.user_options.geom.center[0] = (self.tpcLoc[0][1]+self.tpcLoc[0][0])/2;
                $.fn.BEE.user_options.geom.center[1] = (self.tpcLoc[0][3]+self.tpcLoc[0][2])/2;
                $.fn.BEE.user_options.geom.center[2] = (self.tpcLoc[0][5]+self.tpcLoc[0][4])/2;
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
                // box.material.color.setHex(0x111111);
                box.material.color.setHex(0x666666);
                box.material.transparent = true;
                box.material.opacity = 0.5;
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

            // add beam window
            if ($.fn.BEE.user_options.geom.name == "protodune") {
                var radius = 12.5;
                var segments = 300; //<-- Increase or decrease for more resolution I guess

                var circleGeometry = new THREE.CircleGeometry( radius, segments );
                circleGeometry.vertices.shift(); // remove center vertex
                var bw = new THREE.LineLoop(circleGeometry, new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    opacity: 0.2,
                    side: THREE.DoubleSide
                    // depthWrite: false
                    // wireframe: true
                }));
                // console.log(self.locations);
                // bw.rotation.y = Math.PI / 2;
                bw.position.x = toLocalX(-27.173);
                bw.position.y = toLocalY(421.445);
                bw.position.z = toLocalZ(0);
                self.group_main.add(bw);

                var dir = new THREE.Vector3( -0.178177, -0.196387, 0.959408 );
                //normalize the direction vector (convert to vector of length 1)
                dir.normalize();
                var length = 200;
                var hex = 0xfcb001;
                var origin = new THREE.Vector3(
                    bw.position.x-length*dir.x,
                    bw.position.y-length*dir.y,
                    bw.position.z-length*dir.z
                );
                self.arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex);
                if ($.fn.BEE.user_options.helper.showBeam) {
                    self.group_main.add( self.arrowHelper );
                }
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
                    side: THREE.DoubleSide,
                    wireframe: false
                });

                var worker_url = root_url;
                if (worker_url.indexOf('localhost')>1
                    || worker_url.indexOf('127.0.0.1')>1) {
                    worker_url += "static/js/worker_deadarea.js";
                }
                else if (worker_url.indexOf('twister')>1) {
                    worker_url = worker_url.replace('bee/', 'static/js/worker_deadarea.js');
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
                  if ($.fn.BEE.user_options.helper.deadAreaOpacity>0.05) {
                    self.scene.add(mesh);
                    self.isShowDeadArea = true;
                  }
                  else {
                    self.isShowDeadArea = false;
                  }

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

        drawSpaceChargeBoundary: function(shiftx=0) {
            // console.log(shiftx);
            var self = this;
            if (self.listOfSCBObjects != undefined) {
                for (var i=0; i<self.listOfSCBObjects.length; i++){
                    self.scene.remove(self.listOfSCBObjects[i]);
                }
            }
            self.listOfSCBObjects = [];

            var detector = $.fn.BEE.user_options.geom.name;
            if ( detector != 'uboone') {
                return; // only implemented in uboone
            }
            // console.log(detector, ': init scb');

            var material = new THREE.LineDashedMaterial({
                color: 0xff796c,
                linewidth: 1,
                scale: 1,
                dashSize: 3,
                gapSize: 1,
            });
            var z = self.tpcLoc[0][5];
            var ymax = self.tpcLoc[0][3];
            var ymin = self.tpcLoc[0][2];
            var all_vtx = [
                [[80, -116, 0], [256, -99, 0]],
                [[80, -116, z], [256, -99, z]],
                [[100, 116, 0], [256, 102, 0]],
                [[100, 116, z], [256, 102, z]],
                [[120, ymax, 0], [256, ymax, 11]],
                [[120, ymax, 1037], [256, ymax, 1026]],
                [[120, ymin, 0], [256, ymin, 11]],
                [[120, ymin, 1037], [256, ymin, 1026]],
            ]
            for (var i=0; i<all_vtx.length; i++) {
                var geometry = new THREE.Geometry();
                for (var j=0; j<=1; j++) {
                    geometry.vertices.push(
                        new THREE.Vector3(
                            toLocalX(all_vtx[i][j][0]+shiftx),
                            toLocalY(all_vtx[i][j][1]),
                            toLocalZ(all_vtx[i][j][2])
                        )
                    )
                }
                // geometry.computeLineDistances();
                var line = new THREE.Line( geometry, material );
                line.computeLineDistances();
                self.listOfSCBObjects.push(line);
                self.scene.add(line);
            }

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
                            if ($.fn.BEE.user_options.helper.showMCNeutral) {
                                material = new THREE.LineBasicMaterial({
                                    color: 0x59656d,
                                    linewidth: 1,
                                });
                            }
                            else {
                                continue; // skip neutral particles
                            }

                        }
                        else {
                            material = new THREE.LineBasicMaterial({
                                color: 0xff000d,
                                linewidth: 4, // webgl doesn't support line width for now
                            });
                        }
                        geometry = new THREE.Geometry();
                        if (node.data.traj_x == undefined) {
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
                        }
                        else {
                            var trajPoints = node.data.traj_x.length;
                            for (var j=0; j<trajPoints; j++) {
                                geometry.vertices.push(
                                    new THREE.Vector3(
                                        toLocalX(node.data.traj_x[j]),
                                        toLocalY(node.data.traj_y[j]),
                                        toLocalZ(node.data.traj_z[j])
                                    )
                                );
                            }
                        }

                        line = new THREE.Line( geometry, material );

                        self.listOfMCObjects.push(line);
                        self.scene.add(line);

                        // vertex balls
                        var geometry2 = new THREE.SphereGeometry( 2, 32, 32 );
                        var material2 = new THREE.MeshNormalMaterial({
                            blending: THREE.NormalBlending,
                            opacity: 0.8,
                            transparent: true,
                            depthWrite: false
                            // sizeAttenuation: false
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

        initAutoSel: function() {
            var self = this;
            self.autoSel = Object.create(AutoSel);
            self.autoSel.init("");
            self.showAutoVtx = false;
        },

        toggleShowAutoVtx: function() {
            var self = this;

            if (! self.autoSel.vtx) {
                var el = $('#loadingbar');
                el.html('No auto-selection vertex found');
                el.show();
                window.setTimeout(function(){
                    el.html('');
                    el.hide();
                }, 1000);
                return;
            }
            if (self.showAutoVtx == false) {
                self.showAutoVtx = true;
                if (self.autoVtxSphere) {
                    self.scene.add(self.autoVtxSphere);
                }
                else {
                    var geometry2 = new THREE.SphereGeometry( 6, 32, 32 );
                    var material2 = new THREE.MeshBasicMaterial({
                        blending: THREE.NormalBlending,
                        color: 0xff0000,
                        opacity: 0.5,
                        transparent: true,
                        depthWrite: false
                        // sizeAttenuation: false
                    });
                    self.autoVtxSphere = new THREE.Mesh( geometry2, material2 );
                    self.autoVtxSphere.overdraw = true;
                    self.autoVtxSphere.position.x = toLocalX(self.autoSel.vtx[0]);
                    self.autoVtxSphere.position.y = toLocalY(self.autoSel.vtx[1]);
                    self.autoVtxSphere.position.z = toLocalZ(self.autoSel.vtx[2]);
                    self.scene.add(self.autoVtxSphere);
                }
            }
            else {
                self.showAutoVtx = false;
                if (self.autoVtxSphere) {
                    self.scene.remove(self.autoVtxSphere);
                }
            }

        },

        initOP: function() {
            var self = this;
            var op = Object.create(OP);
            self.op = op;
            op.init();
            op.process.done(function(){
                // op.draw();
            });
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
                    sst.selected();
                    self.selected_sst = sst.name;
                    // console.log('here');
                    // sst.drawInsideThreeFrames();


                    // if (options && options['selected_sst'] && options['selected_sst'] == sst.name) {
                    //     sst.selected();
                    //     self.selected_sst = sst.name;
                    // }
                    // console.log(self.selected_sst)
                    if (sst.runNo) {
                        $('#runNo').html(sst.runNo);
                        // $('#subRunNo').html(sst.subRunNo + ' - ');
                        $('#eventNo').html(sst.eventNo);
                        var thousands = Math.floor(sst.runNo/1000) * 1000;
                        // console.log(thousands)
                        thousands = "000000".substr(0, 6 - thousands.toString().length) + thousands
                        // var plotUrl = $('#diag-plots').attr('href')
                        var plotUrl = 'https://www.phy.bnl.gov/twister/static/plots/'
                            + $.fn.BEE.user_options.geom.name + '/'
                            + thousands + '/'
                            + sst.runNo + '/'
                            + sst.subRunNo + '/'
                            + sst.eventNo + '/';

                        $('#diag-plots').attr('href', plotUrl);
                        sst.setEventText();

                        // var eventStr = "Event: " + $.fn.BEE.current_sst.runNo + " - " + $.fn.BEE.current_sst.subRunNo + " - " + $.fn.BEE.current_sst.eventNo;
                        // var timeStr =  $.fn.BEE.current_sst.eventTime;
                        // var text = eventStr + " | trigger: " + $.fn.BEE.current_sst.trigger;
                        // text = text + "<br/>" + timeStr;
                        // // $("#fullscreeninfo").html(text);
                        // if ($.fn.BEE.user_options.geom.name == "protodune") {
                        //     $("#event-text").html(text);
                        // }

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

        setLogo: function() {
            if ($.fn.BEE.user_options.theme == 'light') {
              $('#event-info').removeClass('invert-color');
            }
            var detector = $.fn.BEE.user_options.geom.name;
            if ( detector == 'uboone' || detector == 'protodune') {
              var $logo = $('#event-logo');
              var new_src = $logo.attr('src').replace('dummy', $.fn.BEE.user_options.geom.name);
              $logo.attr('src', new_src);
            }
            else {
                var $logo = $('#event-logo');
                $logo.hide();
            }
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

        toggleCluster: function() {
            $('#cluster').slideToggle();
        },

        toggleScan: function() {
            $('#scan').slideToggle('fast');
            loadPreviousScanResults();
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

        toggleOp: function() { this.op.toggle(); },
        drawOp: function() { this.op.draw(); },
        nextOp: function() { this.op.next(); },
        prevOp: function() { this.op.prev(); },
        nextMatchingOp: function() { this.op.nextMatching(); },
        prevMatchingOp: function() { this.op.prevMatching(); },
        nextMatchingBeamOp: function() { this.op.nextMatchingBeam(); },


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
            // var eventStr = "Event: " + $.fn.BEE.current_sst.runNo + " - " + $.fn.BEE.current_sst.subRunNo + " - " + $.fn.BEE.current_sst.eventNo;
            // var timeStr =  $.fn.BEE.current_sst.eventTime;
            // var text = eventStr + "<br/>" + timeStr;

            if ($.fn.BEE.user_options.geom.name == "protodune" && $.fn.BEE.user_options.camera.photo_booth) {
                // self.playInterval = setInterval(function(){
                //     self.toggleBox();
                //     self.toggeleTPCs();
                // }, 3000);
                self.tl = new TimelineLite({
                    onComplete:function() {this.restart();}
                });
                var x0 = $.fn.BEE.scene3D.camera.position.x;
                var y0 = $.fn.BEE.scene3D.camera.position.y;
                var z0 = $.fn.BEE.scene3D.camera.position.z;
                var zoomIn = 0.5;
                var dummy = {};
                var xBox = toLocalX(($.fn.BEE.user_options.box.xmin+$.fn.BEE.user_options.box.xmax)/2);
                var yBox = toLocalY(($.fn.BEE.user_options.box.ymin+$.fn.BEE.user_options.box.ymax)/2);
                var zBox = toLocalZ(($.fn.BEE.user_options.box.zmin+$.fn.BEE.user_options.box.zmax)/2);
                console.log(xBox, yBox, zBox);
                self.tl
                .to($.fn.BEE.scene3D.camera.position, 5, {
                    onComplete: function(){self.toggleBox();}
                }) // rotate 5 seconds, then turn on box
                .to(dummy, 5, {}) // rotate 5 seconds
                .to($.fn.BEE.scene3D.camera.position, 5, {
                    x: x0 * zoomIn, y: y0 * zoomIn, z: z0 * zoomIn,
                }) // zoom in for 5 sec
                // .to($.fn.BEE.scene3D.orbitController.target, 5, {
                //     x: xBox, y: yBox, z: zBox,
                //     onUpdate: function(){self.orbitController.update();},
                // }) // change rotation to around box for 5 sec
                .to($.fn.BEE.scene3D.camera.position, 5, {
                    onComplete: function(){self.toggeleTPCs();}
                }) // rotate 5 sec, then turn off tpc
                .to($.fn.BEE.scene3D.camera.position, 5, {
                    x: x0 * zoomIn * 0.75, y: y0 * zoomIn * 0.75, z: z0 * zoomIn * 0.75,
                }) // zoom in another 50% for 5 sec
                .to($.fn.BEE.scene3D.camera.position, 10, {
                    onComplete: function(){self.toggeleTPCs();}
                }) // rotate 10 sec, then turn on tpc
                .to($.fn.BEE.scene3D.camera.position, 5, {
                    onComplete: function(){self.toggleBox();}
                }) // rotate 5 sec, then turn off box
                // .to($.fn.BEE.scene3D.orbitController.target, 5, {
                //     x: 0, y: 0, z: 0,
                //     onUpdate: function(){self.orbitController.update();},
                // }) // change rotation to center for 5 sec
                .to(dummy, 5, {}) // rotate 5 seconds
                .to($.fn.BEE.scene3D.camera.position, 5, {
                    x: x0, y: y0, z: z0,
                }) // zoom out for 5 sec

            }
            if (screenfull.enabled) {
                // $("#fullscreeninfo").show();
                screenfull.request(document.getElementById('container'));
            }

        },

        stop: function() {
            var self = this;
            window.cancelAnimationFrame(self.animationId);
            self.options.camera.rotate = false;
            self.animate();
            self.gui.open();
            $("#fullscreeninfo").hide();
            if (self.playInterval) {
                clearInterval(self.playInterval);
            }
            if (self.tl) {
                self.tl.kill();
            }

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

        doCluster: function() {
            $.fn.BEE.current_sst.doCluster();
        },

        cleanUpCluster: function() {
            $.fn.BEE.current_sst.cleanUpCluster(40);
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

        redrawAllSSTRandom: function() {
            var self = this;
            var ctrl = self.guiController;
            var sst;
            for (var name in self.listOfSST) {
                sst = self.listOfSST[name];
                if(self.guiController.slice.sliced_mode) {
                    sst.drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
                }
                else {
                    sst.drawInsideThreeFrames(true);
                }
            }
        },

        toggleCharge: function() {
            var self = this;
            $.fn.BEE.user_options.material.showCharge = !($.fn.BEE.user_options.material.showCharge);
            self.gui.__folders.General.__controllers[3].updateDisplay();
            self.redrawAllSST();
        },

        toggleROI: function() {
            var self = this;
            $.fn.BEE.current_sst.toggleROI();
        },

        toggleBox: function() {
            $.fn.BEE.user_options.box.box_mode = !$.fn.BEE.user_options.box.box_mode
            if($.fn.BEE.user_options.box.box_mode) {
               $.fn.BEE.current_sst.drawInsideBoxHelper();
            }
            else {
                $.fn.BEE.current_sst.drawInsideThreeFrames();
            }
        },
        
        nextTPC: function() {
            var length = $.fn.BEE.scene3D.tpcLoc.length;
            $.fn.BEE.current_sst.drawInsideBoxHelper();
            if ($.fn.BEE.user_options.box.tpcNo < length-1) {
                $.fn.BEE.user_options.box.tpcNo += 1;
            }
            else {
                $.fn.BEE.user_options.box.tpcNo = 0;
            }
        },

        toggeleTPCs: function() {
            var self = this;
            $.fn.BEE.user_options.helper.showTPCs = !$.fn.BEE.user_options.helper.showTPCs;
            if ($.fn.BEE.user_options.helper.showTPCs) {
                self.group_main.add(self.group_helper);
            }
            else {
                self.group_main.remove(self.group_helper);
            }
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
            raycaster.params.Points.threshold = 5;
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
                var x = sst.geometry.attributes.position.array[index*3]; // local coordinates
                var y = sst.geometry.attributes.position.array[index*3+1];
                var z = sst.geometry.attributes.position.array[index*3+2];
                // console.log(index, x,y,z);

                self.el_statusbar.html(
                    '(x, y, z) = ('
                    + toGlobalX(x).toFixed(1) + ', '
                    + toGlobalY(y).toFixed(1) + ', '
                    + toGlobalZ(z).toFixed(1) + ')'
                );
            }
            else {
                // self.el_statusbar.html('none detected');
            }
        },

        LookAtUnderMouse: function(event) {
            var self = this;
            var mouse = { x: 1, y: 1 };
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

            var raycaster = new THREE.Raycaster();

            raycaster.params.Points.threshold = 5;  // 1cm
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
                var geometry2 = new THREE.SphereGeometry( 2, 32, 32 );
                var material2 = new THREE.MeshNormalMaterial({
                    blending: THREE.NormalBlending,
                    opacity: 0.4,
                    transparent: true,
                    depthWrite: false
                    // sizeAttenuation: false
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
            self.addClickEvent($('#toggleCluster') , self.toggleCluster);
            self.addClickEvent($('#toggleScan')    , self.toggleScan);
            self.addClickEvent($('#preset-default'), clearLocalStorageAndReload);
            self.addClickEvent($('#toggleMC')      , self.toggleMC);
            self.addClickEvent($('#toggleStats')   , self.toggleStats);
            self.addClickEvent($('#toggleCharge')  , self.toggleCharge);
            self.addClickEvent($('#nextEvent')     , self.nextEvent);
            self.addClickEvent($('#prevEvent')     , self.prevEvent);
            self.addClickEvent($('#nextSlice')     , self.nextSlice);
            self.addClickEvent($('#prevSlice')     , self.prevSlice);
            // self.addClickEvent($('#nextRecon')     , self.nextRecon);
            // self.addClickEvent($('#prevRecon')     , self.prevRecon);
            self.addClickEvent($('#centerToEvent') , self.centerToEvent);
            self.addClickEvent($('#resetCamera')   , self.resetCamera);
            self.addClickEvent($('#xyView')        , self.xyView);
            self.addClickEvent($('#xzView')        , self.xzView);
            self.addClickEvent($('#xuView')        , self.xuView);
            self.addClickEvent($('#xvView')        , self.xvView);
            self.addClickEvent($('#btn-cluster')   , self.doCluster);
            self.addClickEvent($('#btn-cleanUpCluster') , self.cleanUpCluster);

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
            self.addKeyEvent('a', self.toggleShowAutoVtx);
            self.addKeyEvent('s', self.toggleStats);
            self.addKeyEvent('q', self.toggleCharge);
            self.addKeyEvent('shift+n', self.nextEvent);
            self.addKeyEvent('shift+p', self.prevEvent);
            self.addKeyEvent('k', self.nextSlice);
            self.addKeyEvent('j', self.prevSlice);
            // self.addKeyEvent(']', self.nextRecon);
            // self.addKeyEvent('[', self.prevRecon);
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
            self.addKeyEvent('<', self.prevOp);
            self.addKeyEvent('>', self.nextOp);
            self.addKeyEvent('.', self.nextMatchingOp);
            self.addKeyEvent(',', self.prevMatchingOp);
            self.addKeyEvent('/', self.nextMatchingBeamOp);
            self.addKeyEvent('o', self.redrawAllSSTRandom);
            self.addKeyEvent('shift+f', self.play);
            self.addKeyEvent('shift+i', self.toggleROI);
            self.addKeyEvent('b', self.toggleBox);
            self.addKeyEvent('shift+t', self.nextTPC);

            self.addKeyEvent('\\', self.toggleScan);

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
                // self.renderer.clear();
                // self.renderer.render(self.scene, self.camera);
                // self.renderer.clearDepth();
                // self.renderer.render(self.scene_slice, self.camera);

                var SCREEN_W, SCREEN_H;
                SCREEN_W = window.innerWidth*self.options.camera.scale;
                SCREEN_H = window.innerHeight;
                var left,bottom,width,height;
                var renderer = self.renderer;

                renderer.setViewport(0, 0, SCREEN_W, SCREEN_H);
                renderer.setScissor(0, 0, SCREEN_W, SCREEN_H);
                renderer.setScissorTest(true);
                self.renderer.clear();
                self.renderer.render(self.scene, self.camera);
                self.renderer.clearDepth();
                self.renderer.render(self.scene_slice, self.camera);

                if ($.fn.BEE.user_options.camera.multiview) {
                    // front camera
                    // width = SCREEN_W*0.3; height = SCREEN_H*0.3; left = 20; bottom = SCREEN_H-300; 
                    width = SCREEN_W*0.3; height = SCREEN_H*0.3; left = 10; bottom = 50; 
                    renderer.setViewport(left,bottom,width,height);
                    renderer.setScissor(left,bottom,width,height);
                    renderer.setScissorTest(true);
                    // frontCamera.aspect = width/height;
                    self.frontCamera.updateProjectionMatrix();
                    renderer.render(self.scene, self.frontCamera);

                    // side camera
                    // width = SCREEN_W*0.3; height = SCREEN_H*0.3; left = SCREEN_W-650; bottom = -40;
                    width = SCREEN_W*0.3; height = SCREEN_H*0.3; left = SCREEN_W-650; bottom = SCREEN_H-200;
                    renderer.setViewport(left,bottom,width,height);
                    renderer.setScissor(left,bottom,width,height);
                    renderer.setScissorTest(true);
                    self.sideCamera.updateProjectionMatrix();
                    renderer.render(self.scene, self.sideCamera);

                    // top camera
                    // width = SCREEN_W*0.3; height = SCREEN_H*0.3; left = SCREEN_W-400; bottom = -10;
                    width = SCREEN_W*0.3; height = SCREEN_H*0.3; left = SCREEN_W-400; bottom = SCREEN_H-200;
                    renderer.setViewport(left,bottom,width,height);
                    renderer.setScissor(left,bottom,width,height);
                    renderer.setScissorTest(true);
                    self.topCamera.updateProjectionMatrix();
                    renderer.render(self.scene, self.topCamera);
                }

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
        $.fn.BEE.user_options = $.extend(true, {}, $.fn.BEE.options, Lockr.get('options'), options ); // recursive extend
        // console.log($.fn.BEE.user_options);
        // console.log(Lockr.get('options'));

        var scene3D = Object.create(Scene3D);
        scene3D.init($.fn.BEE.user_options, this);

        $.fn.BEE.scene3D = scene3D;
        // console.log($.fn.BEE.scene3D);
        return this;
    };


    $.fn.BEE.options = {
        nEvents  : 100,
        id       : 0,
        theme    : 'light',
        hasMC    : false,
        helper   : {
            showTPCs : true,
            showAxises : false,
            deadAreaOpacity : 0.0,
            showFlash: false,
            showMCNeutral: false,
            showBeam: false,
            showSCB: true
        },
        flash    : {
            showFlash: false,
            showPMTClone: false,
            matchTiming: false,
            showMatchingCluster: false,
            showPred: true,
            showNonMatchingCluster: false,
            tpc_cluster_id: -1
        },
        geom     : {
            name  : 'uboone',
            halfx : 128.,
            halfy : 116.,
            halfz : 520.,
            center : [128, 0, 520],
            angleU : 60,
            angleV : 60,
            bounding_box: []
        },
        camera   : {
            scale : 1.,
            depth : 2000,
            ortho : true,
            rotate: false,
            multiview: false,
            photo_booth: false
        },
        slice : {
            opacity: 0.0,
            width: 0.32
        },
        box: {
            box_mode: false,
            xmin: 0.,
            xmax: 0.,
            ymin: 0.,
            ymax: 0.,
            zmin: 0.,
            zmax: 0.,
            tpcNo: -1
        },
        live : {
            refresh: false,
            interval: 60
        },
        material : {
            colorScale: 1.0,
            opacity : 0.2,
            showCharge : true,
            showCluster : false,
            overlay  : true
        },
        sst : [
            // "WireCell-charge",
            // "truth",
            // "WireCell-simple",
            // "WireCell-deblob"
        ]
    };
    $.fn.BEE.user_options = $.fn.BEE.options;
    if ($.fn.BEE.user_options.geom.name == "protodune") {
        $.fn.BEE.user_options.box.xmin = -100;
        $.fn.BEE.user_options.box.xmax = 0;
        $.fn.BEE.user_options.box.ymin = 250;
        $.fn.BEE.user_options.box.ymax = 500;
        $.fn.BEE.user_options.box.zmin = 0;
        $.fn.BEE.user_options.box.zmax = 400;
    }

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

    $.fn.BEE.ui_scan = {
        $el_radio: $('input[name=scanResult]:checked'),
        $el_sure: $('input[name=sureCheck]:checked'),
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
            'box' : $.fn.BEE.user_options.box,
            'slice' : $.fn.BEE.user_options.slice,
            'theme' : $.fn.BEE.user_options.theme,
            'helper': $.fn.BEE.user_options.helper,
            'camera': $.fn.BEE.user_options.camera
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

        var scan_results = Lockr.get('scan_results');
        if (!scan_results) scan_results = {};
        var scan_id = $.fn.BEE.current_sst.runNo + '-' + $.fn.BEE.current_sst.subRunNo + '-' + $.fn.BEE.current_sst.eventNo;
        var event_type = $('input[name=scanResult]:checked').val();
        if (event_type) {
            scan_results[scan_id] = {
                'url': base_url,
                'event_type': event_type,
                'unsure': $('input[name=sureCheck]').is(':checked')
            };
            // console.log(scan_results);
            Lockr.set('scan_results', scan_results);
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

    function loadPreviousScanResults() {
        var scan_id = $.fn.BEE.current_sst.runNo + '-' + $.fn.BEE.current_sst.subRunNo + '-' + $.fn.BEE.current_sst.eventNo;
        var results = Lockr.get('scan_results');
        if (results) {
            var thisEvent = results[scan_id];
            if (thisEvent) {
                var event_type = thisEvent['event_type'];
                if (event_type) {
                    $('#scanResult'+event_type).prop('checked', true);
                }
                var unsure = thisEvent['unsure'];
                if (unsure) {
                    $('#sureCheck').prop('checked', true);
                }
                // console.log(thisEvent);
            }
        }
    }

    function printScanResults() {
        var results = Lockr.get("scan_results");
        var txt = '<pre>';
        for (var event in results) {
            var thisEvent = results[event];
            txt += event + ' '
                + (thisEvent['event_type']?thisEvent['event_type']:-1) + ' '
                + (thisEvent['unsure']?'unsure':'sure') + ' '
                + thisEvent['url']
                + '\n';
        }
        txt += '</pre>'
        return txt;
    }
    $('#scanResultsModalLink').click(function(e){
        $('#scanResultsModelBody').html(printScanResults());
    });
    $('#clear-scan').click(function(e){
        e.preventDefault();
        Lockr.set('scan_results', {});
    });

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

    function countKeys (o) {
        var i = 0;
        for (var key in o) {
            i += 1;
        }
        return i;
    }

})( jQuery, window, document );
