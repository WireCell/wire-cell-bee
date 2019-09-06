// optical detector object

class OP {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        this.url = this.store.url.base_url + 'op/';
        // this.driftV = this.store.experiment.tpc.driftVelocity // drift velocity cm/us
        this.currentFlash = 0;
        // this.locations = {};
        // this.loadOpLocations();
        this.loadData();
    }

    loadData() {
        this.process = $.getJSON(this.url, (data) => {
            this.data = data;
        })
            .fail(() => {
                console.log("no op found: " + this.url);
            });
    }

    enableDrawFlash() {
        this.bee.gui.folder.op.__controllers[1].setValue(true);
    }

    enableMachingCluster() {
        this.enableDrawFlash();
        this.bee.gui.folder.op.__controllers[3].setValue(true);
    }

    toggle() {

    }

    draw() {
        
    }

}

export { OP }