// DAT.GUI object

class Gui {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;
        this.gui = new dat.GUI();

        this.initFolders();
        this.initGuiHelper();

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

        this.folder.sst.open();
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
        
        panel.el_size.slider({
            min: 1, max: 8, step: 0.5, value: 0,
            slide: function (event, ui) {
                bee.current_sst.material.size = ui.value;
            }
        }).slider("pips").slider("float");

        panel.el_opacity.slider({
            min: 0, max: 1, step: 0.05, value: 0,
            slide: function (event, ui) {
                bee.current_sst.material.opacity = ui.value;
                bee.current_sst.setGuiColor();
                // console.log(bee.current_sst);
            }
        }).slider("pips").slider("float");
        
        panel.el_color.on('change', function () {
            bee.current_sst.material.chargeColor = new THREE.Color($(this).val());
            // if (!($.fn.BEE.user_options.material.showCharge)) {
            //     $.fn.BEE.scene3D.redrawAllSST();
            // }
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

    showStats() {
        if (null == this.stats) {
            this.stats = new Stats();
            this.stats.dom.style.position = 'relative';
            this.stats.dom.style.float = 'left';
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            store.dom.el_statsbar.append(this.stats.dom);
        }

        var el = $('#toggleStats');
        if (el.html().indexOf("Show") >= 0) {
            store.dom.el_statsbar.show();
            el.html(el.html().replace("Show", "Hide"));
        }
        else {
            store.dom.el_statsbar.hide();
            el.html(el.html().replace("Hide", "Show"));
        }
    }

}

export { Gui }