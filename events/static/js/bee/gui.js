// DAT.GUI object

class Gui {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;
        this.gui = new dat.GUI();

        this.initGuiHelper();
    }

    initGuiHelper() {
        let folder = this.gui.addFolder("Helper");

        folder.add(this.store.config.helper, "showAxises")
            .name("Show Axes")
            .onChange(() => { this.bee.helper.toggleAxes() });
    }


}

export { Gui }