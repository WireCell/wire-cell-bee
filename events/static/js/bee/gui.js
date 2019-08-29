// DAT.GUI object

class Gui {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;
        this.gui = new dat.GUI();

        this.initGuiHelper();
    }

    initGuiHelper() {
        let exp = this.store.experiment;
        let folder = this.gui.addFolder("Helper");

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


}

export { Gui }