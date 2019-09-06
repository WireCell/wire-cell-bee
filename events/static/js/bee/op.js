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

}

export { OP }