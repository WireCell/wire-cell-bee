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

    draw() {
        let currentFlash = this.currentFlash;
        let t = this.data.op_t[currentFlash];
        let peTotal = this.data.op_peTotal[currentFlash];
        let pes = this.data.op_pes[currentFlash];
        let driftV = this.store.experiment.tpc.driftVelocity;
        console.log(currentFlash, t, peTotal, driftV * t);
    }

    enableDrawFlash() {
        this.bee.gui.folder.op.__controllers[1].setValue(true);
    }

    drawMachingCluster() {
        this.bee.gui.folder.op.__controllers[3].setValue(true);
    }

    next() {
        if (this.currentFlash < this.data.op_t.length - 1) { this.currentFlash += 1 }
        else { this.currentFlash = 0 }
        this.draw();
    }

    prev() {
        // this.enableDrawFlash();
        if (this.currentFlash > 0) { this.currentFlash -= 1 }
        else { this.currentFlash = this.data.op_t.length - 1 }
        this.draw();
    }

    nextMatching() {
        do {
            if (this.currentFlash < this.data.op_t.length - 1) { this.currentFlash += 1 }
            else { this.currentFlash = 0 }
        } while (this.data.op_cluster_ids[this.currentFlash].length == 0)
        this.drawMachingCluster();
    }

    prevMatching() {
        // this.enableMachingCluster();
        do {
            if (this.currentFlash > 0) { this.currentFlash -= 1 }
            else { this.currentFlash = this.data.op_t.length - 1 }
        } while (this.data.op_cluster_ids[this.currentFlash].length == 0)
        this.drawMachingCluster();
    }

    nextMatchingBeam() {
        let n = 0;
        do {
            if (this.currentFlash < this.data.op_t.length - 1) {
                this.currentFlash += 1;
                n += 1;
            }
            else {
                this.currentFlash = 0;
                n += 1
            }
            if (n > this.data.op_t.length) break;
        } while (
            this.data.op_cluster_ids[this.currentFlash].length == 0
            || this.data.op_t[this.currentFlash] < this.store.experiment.op.beamTimeMin
            || this.data.op_t[this.currentFlash] > this.store.experiment.op.beamTimeMax
        )
        if (n <= this.data.op_t.length) { this.drawMachingCluster() }
        else { this.store.dom.el_statusbar.html('No matching flash found inside beam window') }
        
    }

    toggle() {
        if (this.group_op == null) { this.draw() }
        else {
            this.bee.scene3d.scence.main.remove(this.group_op);
            this.group_op = null;
        }
    }



}

export { OP }