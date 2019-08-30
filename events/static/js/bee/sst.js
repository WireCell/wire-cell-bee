// Simple Storage Tool (??)

class SST {
    constructor(name, store, bee) {
        this.name = name;
        this.store = store;
        this.bee = bee;
        this.scene = bee.scene3d.scene.main;
        this.gui = bee.gui;

        this.url = `store.url.base_url{name}/`;
        this.index = store.event.sst.indexOf(name);
        this.initMaterial();

    }

    initMaterial() {
        this.material = {};

        const theme = this.store.config.theme;
        const USER_COLORS = this.store.ui.USER_COLORS;
        const i = this.index;
        const color_index = i >= USER_COLORS[theme].length ? i - USER_COLORS[theme].length : i;
        this.material.chargeColor = new THREE.Color(USER_COLORS[theme][color_index]);
        this.material.opacity = this.store.config.material.opacity;
        this.material.size = this.store.config.material.size;
    }

    initGui() {
        let name = this.name;
        let folder = this.gui.folder.sst;
        // let opacity = sst.name == "WireCell-charge" ? self.options.material.opacity : 0;

        folder.add(this, "selected").name(name);
        let el = $(`.dg .property-name:contains(${name})`);
        this.store.dom.gui_sst[name] = el;
        el.css({ 'width': '100%' });

        folder.__controllers[this.index].name(`${this.index+1}. ${name}`);
    }

    selected() {
        this.bee.current_sst = this;
        let el = $('#sst');
        el.html(this.name);
        el.show();
        // if (this.material == undefined) { // load sst on demand
        //     this.setup();
        //     this.scene3D.registerSST(this);
        //     this.process.then(function(){
        //         self.setProp();
        //     }, function(){});
        // }
        // else {
        //     self.setProp();
        // }
        // for (let name in this.store.dom.gui_sst) {
        //     this.store.dom.gui_sst[name].css('color', 'white');
        // }
        // this.store.dom.gui_sst[this.name].css('color', '#f97306');

        this.setGuiColor();
        this.setProp()
        // console.log(`${this.name} selected`);
    }

    setGuiColor() {
        let $el = this.store.dom.gui_sst[this.name];
        let color = this.material.chargeColor;
        let rgb_string = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${this.material.opacity})`;
        $el.css('background-color', rgb_string);
    }

    setProp() {
        // if (!this.store.config.overlay) {
        //     for (let name in this.bee.sst.list) {
        //         this.bee.sst.list[name].material.opacity = 0;
        //     }
        //     this.material.opacity = this.store.config.material.opacity;
        // }
        let panel = this.store.dom.panel_sst;
        panel.el_size.slider("value", this.material.size);
        panel.el_opacity.slider("value", this.material.opacity);
        panel.el_color.val('#' + this.material.chargeColor.getHexString());
    }
}

export { SST }
