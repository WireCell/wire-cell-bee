import { store, LocalStore } from './store.js'
import { Scene3D } from './scene.js'
import { SST } from './sst.js'
import { MC } from './mc.js'
import { OP } from './op.js'
import { Helper } from './helper.js'
import { Gui } from './gui.js'
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
            this.localstore = new LocalStore(store, this);
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

    redrawAllSST() {
        this.sst.loaded.forEach((name) => {
            let sst = this.sst.list[name];
            if(store.config.slice.enabled) {
                // sst.drawInsideSlice(ctrl.slice.position-ctrl.slice.width/2, ctrl.slice.width);
            }
            else {
                sst.drawInsideThreeFrames();
            }
        });
    }

    toggleCharge() {
        store.config.material.showCharge = !(store.config.material.showCharge);
        this.redrawAllSST();
        this.gui.folder.general.__controllers[2].updateDisplay();
    }

}

let bee = new Bee();
console.log('store: ', store);
console.log('bee:', bee);

