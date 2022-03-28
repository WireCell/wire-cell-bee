// DAT.GUI object

class Gui {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;
        this.gui = new dat.GUI();

        this.initFolders();
        this.initGuiGeneral();
        this.initGuiHelper();
        this.initGuiCamera();
        this.initGuiBox();
        this.initGuiSlice();

        this.initDOM();
        this.initSSTPanel();
        this.initLogo();

    }

    initFolders() {
        this.folder = {};
        this.folder.general = this.gui.addFolder("General");
        this.folder.helper = this.gui.addFolder("Helper");
        if (this.store.event.hasMC) {
            this.folder.mc = this.gui.addFolder("Monte Carlo");
            this.initGuiMC();
        }
        if (this.store.event.hasOP) {
            this.folder.op = this.gui.addFolder("Optical Flash");
            this.initGuiOP();
        }
        if (this.store.url.base_url.indexOf("live") > 0 || this.store.url.base_url.indexOf("gallery") > 0) {
            this.folder.live = this.gui.addFolder("Live");
            this.initGuiLive();
            this.folder.live.open();
        }
        this.folder.sst = this.gui.addFolder("3-D Imaging");
        this.folder.box = this.gui.addFolder("Box of Interest");
        this.folder.slice = this.gui.addFolder("Time Slice");
        this.folder.camera = this.gui.addFolder("Camera");

        this.folder.general.open();
        this.folder.sst.open();
        this.folder.camera.open();
    }

    initGuiGeneral() {
        let folder = this.folder.general;
        let config = this.store.config

        let tmp = { id: this.store.event.id }
        folder.add(tmp, 'id', 0, this.store.event.nEvents - 1)
            .name("Event").step(1)
            .onFinishChange((value) => {
                if (value == this.store.event.id) { return; }
                window.location.assign(this.store.url.event_url + value + '/' + this.store.url.base_query);
            });

        folder.add(config, 'theme', ['light', 'dark'])
            .name("Theme")
            .onChange((value) => {
                // clearLocalStorage();
                $(window).unbind('beforeunload');
                let base_query = this.store.url.base_query;
                let new_query;
                if (base_query.indexOf('theme=light') > 0) {
                    new_query = base_query.replace('theme=light', 'theme=' + value);
                }
                else if (base_query.indexOf('theme=dark') > 0) {
                    new_query = base_query.replace('theme=dark', 'theme=' + value);
                }
                else {
                    let c = base_query == '' ? '?' : '&';
                    new_query = `${base_query}${c}theme=${value}`;
                }
                window.location.assign(this.store.url.base_url + new_query);
            });

        folder.add(config.material, "showCharge")
            .name("Show Charge")
            .onChange(() => {
                this.bee.redrawAllSST();
            });
        folder.add(config.material, "colorScale", 0., 1.9)
            .name("Color-scale").step(0.01)
            .onChange(() => {
                if (!config.material.showCharge) { return; }
                this.bee.redrawAllSST();
            });
        folder.add(config.material, "showCluster")
            .name("Show Cluster")
            .onChange(() => {
                this.bee.redrawAllSST();
            });
        folder.add(config.material, "overlay")
            .name("Overlay Reco")
            .onChange(() => {
                this.bee.redrawAllSST()
            });
    }

    initGuiHelper() {
        let exp = this.store.experiment;
        let folder = this.folder.helper;
        folder.add(this.store.config.helper, "showAxes")
            .name("Show Axes")
            .onChange(() => { this.bee.helper.showAxes() });

        folder.add(this.store.config.helper, "showTPC")
            .name("Show TPC")
            .onChange(() => { this.bee.helper.showTPC() });

        if (exp.beam.dir != null && exp.beam.center != null) {
            folder.add(this.store.config.helper, "showBeam")
                .name("Show Beam")
                .onChange(() => { this.bee.helper.showBeam() });
        }

        if (exp.name == "protodune" || exp.name == "icarus") {
            folder.add(this.store.config.helper, "showPD")
                .name("Show Ph. Det.")
                .onChange(() => { this.bee.helper.showPD() });
        }

        if (this.store.event.hasDeadArea) {
            folder.add(this.store.config.helper, "deadAreaOpacity", 0., 0.9)
                .name("Inactivity").step(0.1)
                .onChange((value) => {
                    if (this.bee.deadarea.mesh != null) {
                        this.bee.deadarea.mesh.material.opacity = value;
                    }
                });
        }

        let scene3d = this.bee.scene3d;
        if (exp.name == 'uboone') {
            folder.add(this.store.config.helper, "showSCB")
                .name("Show SCB")
                .onChange((value) => {
                    if (value) {
                        let op = this.bee.op;
                        if (op.data.op_t != undefined) {
                            scene3d.drawSpaceChargeBoundary(op.data.op_t[op.currentFlash] * exp.tpc.driftVelocity);
                        }
                        else {
                            scene3d.drawSpaceChargeBoundary();
                        }
                    }
                    else {
                        if (scene3d.listOfSCBObjects != undefined) {
                            for (let i = 0; i < scene3d.listOfSCBObjects.length; i++) {
                                scene3d.scene.main.remove(scene3d.listOfSCBObjects[i]);
                            }
                            scene3d.listOfSCBObjects = [];
                        }
                    }
                });
        }
    }

    initGuiLive() {
        let folder = this.folder.live;
        folder.add(this.store.config.live, "refresh")
            .name("Refresh")
            .onChange((value) => {
                if (value) { this.bee.current_sst.refresh(this.store.config.live.interval) }
                else { this.bee.current_sst.stopRefresh() }
            });
        folder.add(this.store.config.live, "interval").name("Interval");
    }

    initGuiMC() {
        let folder = this.folder.mc;
        folder.add(this.store.config.mc, "showMC")
            .name("Always Show")
            .onChange(() => { this.toggleMC() });

        folder.add(this.store.config.mc, "showNeutron")
            .name("Show Neutron")
            .onChange(() => { this.store.dom.el_mc.jstree(true).refresh() });

        folder.add(this.store.config.mc, "showGamma")
            .name("Show Gamma")
            .onChange(() => { this.store.dom.el_mc.jstree(true).refresh() });

        folder.add(this.store.config.mc, "showNeutrino")
            .name("Show Neutrino")
            .onChange(() => { this.store.dom.el_mc.jstree(true).refresh() });
    }

    initGuiOP() {
        let folder = this.folder.op;

        let tmp = { 'flash_id': 0 };
        folder.add(tmp, 'flash_id', 0, 200)
            .name("Flash ID").step(1)
            .onFinishChange((value) => {
                if (value < this.bee.op.data.op_t.length) {
                    this.bee.op.currentFlash = value;
                    this.bee.op.draw();
                }
            });

        folder.add(this.store.config.op, "showFlash")
            .name("Show Flash")
            .onChange(() => { this.bee.op.toggle() });

        folder.add(this.store.config.op, "showPMTClone")
            .name("Show PMT Clone")
            .onChange(() => { this.bee.op.draw() });

        folder.add(this.store.config.op, "showMatchingCluster")
            .name("Matching Cluster")
            .onChange(() => { this.bee.op.draw() });

        folder.add(this.store.config.op, "matchTiming")
            .name("Matching Box")
            .onChange(() => { this.bee.op.draw() });

        folder.add(this.store.config.op, "showPred")
            .name("Prediction")
            .onChange(() => { this.bee.op.draw() });

        folder.add(this.store.config.op, "showNonMatchingCluster")
            .name("Non-matching")
            .onChange((value) => {
                this.bee.op.draw();
                if (value) {
                    this.store.dom.el_statusbar.html(
                        'non-matching: ' + this.bee.op.op_nomatching_cluster_ids
                    );
                }
            });

        folder.add(this.store.config.op, 'tpc_cluster_id', -1, 200)
            .name("Cluster ID").step(1)
            .onFinishChange(() => { this.bee.op.draw() });

    }

    initGuiCamera() {
        let folder = this.folder.camera;
        let config = this.store.config;
        let scene3d = this.bee.scene3d;
        let camera = this.bee.scene3d.camera;

        folder.add(config.camera, 'ortho')
            .name("Ortho Camera")
            .onChange((value) => {
                camera.active = value ? camera.orthoCamera : camera.pspCamera;
                this.bee.scene3d.controller.orbitController.object = camera.active;
                this.bee.scene3d.controller.orbitController.update();
            });

        folder.add(config.camera, "multiview")
            .name("Multi-view")
            .onChange(() => {
            });

        let optionView = { 'view': ['-'] };
        folder.add(optionView, 'view', ['Front (YZ)', 'Side (XY)', ' Top (XZ)', 'U (XU)', 'V (XV)', 'W (XW)'])
            .name("2D View ")
            .onChange((value) => {
                if (value.indexOf('YZ') > 0) { scene3d.yzView(); }
                else if (value.indexOf('XY') > 0) { scene3d.xyView(); }
                else if (value.indexOf('XZ') > 0) { scene3d.xzView(); }
                else if (value.indexOf('XU') > 0) { scene3d.xuView(); }
                else if (value.indexOf('XV') > 0) { scene3d.xvView(); }
                else if (value.indexOf('XW') > 0) { scene3d.xwView(); }
            });

        folder.add(scene3d, 'resetCamera').name('Reset Camera');
        folder.add(scene3d, 'play').name('Fullscreen');

        if (this.store.experiment.name == "protodune") {
            folder.add(config.camera, "photo_booth")
                .name("Photo Booth")
                .onChange(function (value) {
                    if (value && config.camera.ortho) {
                        alert("Photo booth mode is designed to work under Perspective Camera!");
                    }
                });
        }

        if ('webkitSpeechRecognition' in window) {
            folder.add(config.helper, "speech")
            .name("&#9835 Voice Control")
            .onChange(() => {
                if (config.helper.speech) {
                    this.bee.speech.recognition.start();
                }
                else {
                    this.bee.speech.recognition.stop();
                }
            });
        }


    }

    loadDefaultBoxROI() {
        let config = this.store.config;
        let exp = this.store.experiment;
        config.box.xmin = exp.tpc.boxROI[0];
        config.box.xmax = exp.tpc.boxROI[1];
        config.box.ymin = exp.tpc.boxROI[2];
        config.box.ymax = exp.tpc.boxROI[3];
        config.box.zmin = exp.tpc.boxROI[4];
        config.box.zmax = exp.tpc.boxROI[5];

        this.folder.box.__controllers[0].setValue(true);
        for (let i = 1; i <= 6; i++) {
            this.folder.box.__controllers[i].updateDisplay();
        }
        this.folder.box.__controllers[7].setValue(-1);
        this.bee.current_sst.drawInsideBoxHelper();
    }

    initGuiBox() {
        let folder = this.folder.box;
        let config = this.store.config;

        folder.add(config.box, "box_mode")
            .name("Box Mode")
            .onChange((value) => {
                if (value) { this.bee.current_sst.drawInsideBoxHelper() }
                else { this.bee.current_sst.drawInsideThreeFrames() }
            });

        folder.add(config.box, "xmin").name("x min");
        folder.add(config.box, "xmax").name("x max");
        folder.add(config.box, "ymin").name("y min");
        folder.add(config.box, "ymax").name("y max");
        folder.add(config.box, "zmin").name("z min");
        folder.add(config.box, "zmax").name("z max");
        folder.add(config.box, "tpcNo", -1, 11)
            .name("TPC No.").step(1)
            .onChange((value) => {
                if (value >= 0) { this.bee.current_sst.drawInsideBoxHelper() }
                else { this.bee.current_sst.drawInsideThreeFrames() }
            });
        folder.add(this, 'loadDefaultBoxROI').name('Load Default Box');

    }

    initGuiSlice() {
        let config = this.store.config;
        let folder = this.folder.slice;
        let bee = this.bee;
        let w = config.slice.width;
        let halfx = this.store.experiment.tpc.halfxyz[0];
        let step = 0.32;

        folder.add(config.slice, "enabled")
            .name("sliced mode")
            .onChange((value) => {
                bee.helper.showSlice();
                bee.sst.loaded.forEach((name) => {
                    let sst = bee.sst.list[name];
                    if (value) {
                        sst.drawInsideSlice(config.slice.position - config.slice.width / 2, config.slice.width);
                    }
                    else { sst.drawInsideThreeFrames() }
                });
            });

        folder.add(config.slice, "opacity", 0., 1.0)
            .onChange((value) => {
                bee.helper.slice.material.opacity = value;
            });

        folder.add(config.slice, "width", step, halfx * 2 * 3).step(step)
            .onChange((value) => {
                bee.helper.slice.scale.x = value / w; // SCALE
            });

        folder.add(config.slice, "position", -3 * halfx * 3 + w / 2, 3 * halfx - w / 2)
            .onChange(() => {
                this.updateSlice();
            });
    }

    updateSlice() {
        let config = this.store.config;
        this.bee.helper.slice.position.x = config.slice.position;
        if (config.slice.enabled) {
            this.bee.sst.loaded.forEach((name) => {
                this.bee.sst.list[name].drawInsideSlice(config.slice.position - config.slice.width / 2, config.slice.width);
            });
            let [halfx, halfy, halfz] = this.store.experiment.tpc.halfxyz;
            this.store.dom.el_statusbar.html(
                'slice #: ' + ((config.slice.position + halfx) / config.slice.width).toFixed(0)
                + ' | slice x: ' + (config.slice.position + halfx).toFixed(1)
            )
        }
    }

    nextSlice(value = 1) {
        let config = this.store.config;
        config.slice.position = config.slice.position + value * config.slice.width;
        this.updateSlice();
    }

    initDOM() {
        $("#progressbar").progressbar({ value: 0 });
        $('.dg .c select').css({
            'width': 136,
            'padding': 0,
            'margin': '1px',
            'height': 'auto'
        });
        $('.dg .c input').css({
            'margin-top': 0
        });
    }

    initSSTPanel() {
        let panel = this.store.dom.panel_sst;
        let bee = this.bee;
        let store = this.store;

        panel.el_size.slider({
            min: 1, max: 8, step: 0.5, value: 0,
            slide: function (event, ui) {
                bee.current_sst.pointCloud.material.size = ui.value;
                bee.current_sst.material.size = ui.value;
            }
        }).slider("pips").slider("float");

        panel.el_opacity.slider({
            min: 0, max: 1, step: 0.05, value: 0,
            slide: function (event, ui) {
                bee.current_sst.pointCloud.material.opacity = ui.value;
                bee.current_sst.material.opacity = ui.value;
                bee.current_sst.setGuiColor();
            }
        }).slider("pips").slider("float");

        panel.el_color.on('change', function () {
            bee.current_sst.material.chargeColor = new THREE.Color($(this).val());
            bee.current_sst.drawInsideThreeFrames(false, store.config.box.box_mode);
            bee.current_sst.setGuiColor();
        });
    }

    initLogo() {
        let store = this.store;
        if (store.config.theme == 'light') {
            $('#event-info').removeClass('invert-color');
        }
        let name = store.experiment.name;
        if (name == 'uboone' || name == 'protodune') {
            let new_src = store.dom.el_logo.attr('src').replace('dummy', name);
            store.dom.el_logo.attr('src', new_src);
        }
        else {
            store.dom.el_logo.hide();
        }
    }

    increaseEvent(value) {
        let id = this.store.event.id;
        let maxId = this.store.event.nEvents - 1;
        let newId = id + value;
        if (newId > maxId) { newId = newId - maxId - 1 }
        else if (newId < 0) { newId = maxId - newId - 1 }
        window.location.assign(this.store.url.event_url + newId + '/' + this.store.url.base_query);
    }

    toggleCharge() {
        this.store.config.material.showCharge = !(this.store.config.material.showCharge);
        this.bee.redrawAllSST();
        this.folder.general.__controllers[2].updateDisplay();
    }

    toggleTPC() {
        this.store.config.helper.showTPC = !(this.store.config.helper.showTPC);
        this.bee.helper.showTPC();
        this.folder.helper.__controllers[1].updateDisplay();
    }

    toggleBox() {
        this.store.config.box.box_mode = !(this.store.config.box.box_mode);
        if (this.store.config.box.box_mode) { this.bee.current_sst.drawInsideBoxHelper() }
        else { this.bee.current_sst.drawInsideThreeFrames() }
        this.folder.box.__controllers[0].updateDisplay();
    }

    nextTPC() {
        let nTPC = this.store.experiment.nTPC();
        this.bee.current_sst.drawInsideBoxHelper();
        if (this.store.config.box.tpcNo < nTPC - 1) { this.store.config.box.tpcNo += 1 }
        else { this.store.config.box.tpcNo = 0 }
        this.folder.box.__controllers[7].updateDisplay();
        this.folder.box.__controllers[0].setValue(true);
    }

    toggleSidebar() { this.store.dom.panel_sst.el_container.toggle('slide') }

    toggleMC() { this.store.dom.el_mc.toggle('slide') }

    toggleScan() {
        $('#scan').slideToggle('fast');
        this.bee.scan.loadPreviousScanResults();
    }

}

export { Gui }