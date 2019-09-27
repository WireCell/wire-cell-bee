// DeadArea due to dead wires

class DeadArea {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        this.init();
    }

    init() {
        this.url = this.store.url.base_url + 'channel-deadarea/';
        let el = this.store.dom.el_loadingbar;
        this.process = $.getJSON(this.url, (data) => {
            this.data = data;
            el.html(el.html() + "<br /><strong class='success'>Loading</strong> DeadArea ... done. ");
            this.initWorker();
        })
            .fail(() => {
                // console.log(`no deadarea found: ${this.url}`);
            });
    }

    initWorker() {
        this.worker_url = this.store.url.root_url;
        if (this.worker_url.indexOf('localhost') > 1
            || this.worker_url.indexOf('127.0.0.1') > 1) {
            this.worker_url = this.worker_url.replace('es6/', ''); // please remove this line later
            this.worker_url += "static/js/worker_deadarea.js";
        }
        else if (this.worker_url.indexOf('twister') > 1) {
            this.worker_url = this.worker_url.replace('bee/', 'static/js/worker_deadarea.js');
        }
        else {
            this.worker_url = this.worker_url.replace('bee', 'bee-static');
            this.worker_url += "js/worker_deadarea.js";
        }
        let worker = new Worker(this.worker_url);
        worker.onmessage = (e) => {
            // console.log('Message received from worker', e.data);
            let mergedGeometry = new THREE.BufferGeometry();
            mergedGeometry.addAttribute('position', new THREE.BufferAttribute(e.data.position, 3));
            mergedGeometry.addAttribute('normal', new THREE.BufferAttribute(e.data.normal, 3));
            let material = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                depthWrite: true,
                opacity: this.store.config.helper.deadAreaOpacity,
                side: THREE.DoubleSide,
                wireframe: false
            });
            this.mesh = new THREE.Mesh(mergedGeometry, material);
            this.bee.scene3d.scene.main.add(this.mesh);

        };
        worker.postMessage({
            vertices: this.data,
            geo: {
                halfx: this.store.experiment.tpc.halfxyz[0],
                center_y: this.store.experiment.tpc.center[1],
                center_z: this.store.experiment.tpc.center[2]
            }
        });
    }

}

export { DeadArea }