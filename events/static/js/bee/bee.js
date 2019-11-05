import { store, LocalStore } from './store.js'
import { Scene3D } from './scene.js'
import { SST } from './physics/sst.js'
import { MC } from './physics/mc.js'
import { DeadArea } from './physics/deadarea.js'
import { OP } from './physics/op.js'
import { Helper } from './helper.js'
import { Gui } from './gui.js'
import { Scan } from './physics/scan.js'
import { Dispatcher } from './dispatcher.js';

class Bee {
    constructor() {
        store.process.init.then(() => {
            this.scene3d = new Scene3D(store, this);
            this.helper = new Helper(store, this);
            this.gui = new Gui(store, this);
            this.initSST();
            if (store.event.hasMC) { this.mc = new MC(store, this) }
            if (store.event.hasOP) { this.op = new OP(store, this) }
            if (store.event.hasDeadArea) { this.deadarea = new DeadArea(store, this) }
            this.localstore = new LocalStore(store, this);
            this.scan = new Scan(store, this);
            this.dispatcher = new Dispatcher(store, this);
        });
    }

    initSST() {
        this.sst = {}
        this.sst.list = {}
        this.sst.loaded = []
        this.current_sst = null;
        for (let i = 0; i < store.event.sst.length; i++) {
            let sst = new SST(store.event.sst[i], store, this)
            this.sst.list[sst.name] = sst;
            if (i == 0) {
                sst.selected();
                // sst.setup();
                // self.registerSST(sst);
            }
        }
    }

    redrawAllSST(randomClusterColor = false) {
        this.sst.loaded.forEach((name) => {
            let sst = this.sst.list[name];
            if (store.config.slice.enabled) {
                sst.drawInsideSlice(store.config.slice.position - store.config.slice.width / 2, store.config.slice.width);
            }
            else {
                sst.drawInsideThreeFrames(randomClusterColor);
            }
        });
    }

}

let bee = new Bee();

if (store.url.root_url.includes('127.0.0.1')) { // debug
    console.log('store: ', store);
    console.log('bee:', bee);
}


