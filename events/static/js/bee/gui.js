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

        this.initDOM();
        this.initSSTPanel();
        this.initLogo();

    }

    initFolders() {
        this.folder = {};
        this.folder.general = this.gui.addFolder("General");
        this.folder.helper = this.gui.addFolder("Helper");
        this.folder.flash = this.gui.addFolder("Flash");
        this.folder.sst = this.gui.addFolder("Recon");
        this.folder.box = this.gui.addFolder("Box");
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
        folder.add(optionView, 'view', [ 'Front (YZ)', 'Side (XY)', ' Top (XZ)', 'U (XU)', 'V (XV)', 'W (XW)'])
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
        let maxId = this.store.event.nEvents -1;
        let newId = id + value;
        if (newId > maxId) { newId = newId - maxId - 1 }
        else if (newId < 0) { newId = maxId - newId - 1 }
        window.location.assign(this.store.url.event_url + newId + '/' + this.store.url.base_query);
    }

    toggleSidebar() { this.store.dom.panel_sst.el_container.toggle("slide") }
}

export { Gui }