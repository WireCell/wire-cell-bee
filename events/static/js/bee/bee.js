// import * as util from './util.js'
import { store } from './store.js'
import { Scene3D } from './scene.js'
// import { Canvas } from './canvas.js'
import { SST } from './sst.js'
import { Helper } from './helper.js'
import { Gui } from './gui.js'


// console.log(new ProtoDUNE());
// console.log(new ICARUS());
// console.log(new DUNE10ktWorkspace());
// console.log(new DUNE35t());
// console.log(exp.toLocalXYZ([0, 0, 0]));


class Bee {
    constructor() {
        store.xhr.init.then(() => {
            this.scene3d = new Scene3D(store);
            // this.canvas = new Canvas(store, this);
            this.helper = new Helper(store, this);
            this.gui = new Gui(store, this);
            this.initSST();

        });
    }

    initSST() {
        // self.nRequestedSSTDone = 0;
        // self.nLoadedSST = 0;
        // let theme = store.config.theme;
        // let color_index;
        this.sst = {}
        this.sst.list = {}
        this.current_sst = null;
        for (let i = 0; i < store.event.sst.length; i++) {
            let sst = new SST(store.event.sst[i], store, this)
            this.sst.list[sst.name] = sst;
            sst.initGui();
            if (i == 0) {
                sst.selected();
                // sst.setup();
                // self.registerSST(sst);
            }
        }
    }

}

let bee = new Bee();
console.log('store: ', store);
console.log('bee:', bee);

