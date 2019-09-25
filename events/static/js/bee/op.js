// optical detector object

class OP {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        this.url = this.store.url.base_url + 'op/';
        this.currentFlash = 0;
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
        let pes_pred = this.data.op_pes_pred[currentFlash];
        let driftV = this.store.experiment.tpc.driftVelocity;
        // console.log(currentFlash, t, peTotal, driftV * t);

        if(this.group_op != null) { this.bee.scene3d.scene.main.remove(this.group_op) }
        this.group_op = new THREE.Group();
        let boxhelper = new THREE.Object3D;

        let exp = this.store.experiment;
        let [halfx, halfy, halfz] = exp.tpc.halfxyz;
        let opBox = new THREE.Mesh(
            new THREE.BoxGeometry(halfx*2, halfy*2, halfz*2 ),
            new THREE.MeshBasicMaterial( {
                color: 0x96f97b,
                transparent: true,
                depthWrite: true,
                opacity: 0.5,
        }));
        let box = new THREE.BoxHelper(opBox);
        box.material.color.setHex(0xff0000);
        boxhelper.add(box);
        boxhelper.position.set(...exp.toLocalXYZ(exp.tpc.center[0]+driftV*t, exp.tpc.center[1], exp.tpc.center[2]));
        this.group_op.add(boxhelper);

        let location = this.store.experiment.op.location;
        let nDet = this.store.experiment.op.nDet;
        for (let i=0; i<nDet; i++) {
            let radius = 10;
            let segments = 32; //<-- Increase or decrease for more resolution I guess

            let circleGeometry = new THREE.CircleGeometry( radius, segments );
            let circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
                color: 0xbbbbbb,
                opacity: 0.01,
                side: THREE.DoubleSide
            }));
            circle.rotation.y = Math.PI / 2;
            circle.position.set(...exp.toLocalXYZ(location[i][0]+driftV*t, location[i][1], location[i][2]));
            this.group_op.add(circle);

            if (this.store.config.op.showPMTClone) {
                let circle2 =circle.clone();
                circle2.rotation.x = Math.PI / 2;
                circle2.rotation.y = 0;
                circle2.position.x = boxhelper.position.x + exp.toLocalXYZ(...location[i])[1];
                circle2.position.y = boxhelper.position.y + halfy;
                this.group_op.add(circle2);
            }
        }

        for (let i=0; i<nDet; i++) {
            if (pes[i] > 0.01 ) {
                let radius = Math.sqrt(pes[i]);
                let segments = 32; //<-- Increase or decrease for more resolution I guess

                let circleGeometry = new THREE.CircleGeometry( radius, segments );
                let circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    opacity: 0.2,
                    side: THREE.DoubleSide
                }));
                circle.rotation.y = Math.PI / 2;
                circle.position.set(...exp.toLocalXYZ(location[i][0]+driftV*t, location[i][1], location[i][2]));
                this.group_op.add(circle);

                if (this.store.config.op.showPMTClone) {
                    let circle2 =circle.clone();
                    circle2.rotation.x = Math.PI / 2;
                    circle2.rotation.y = 0;
                    circle2.position.x = boxhelper.position.x + exp.toLocalXYZ(...location[i])[1];
                    circle2.position.y = boxhelper.position.y + halfy;
                    this.group_op.add(circle2);
                }
            }

            if (this.store.config.op.showPred) {
                try {
                    if (pes_pred[i] > 0.01 ) {
                        let radius_pred = Math.sqrt(pes_pred[i]);
                        let segments_pred = 32;
                        let circleGeometry_pred = new THREE.CircleGeometry( radius_pred, segments_pred );
                        let circle_pred = new THREE.Mesh(circleGeometry_pred, new THREE.MeshBasicMaterial({
                            color: 0x15b01a,
                            opacity: 0.2,
                            side: THREE.DoubleSide
                        }));
                        circle_pred.rotation.y = Math.PI / 2;
                        circle_pred.position.set(...exp.toLocalXYZ(location[i][0]+driftV*t, location[i][1]-halfy*2, location[i][2]));
                        this.group_op.add(circle_pred);
                    }
                }
                catch(err) {
                    // console.log(err);
                }
            }

        }

        if (this.store.config.op.matchTiming) {
            this.bee.current_sst.drawInsideSlice(boxhelper.position.x-halfx, 2*halfx);
        }
        else {
            this.bee.current_sst.drawInsideThreeFrames();
        }

        this.bee.scene3d.scene.main.add(this.group_op);

        // add status bar text
        this.store.dom.el_statusbar.html(`#${this.currentFlash}: (${t} us, ${peTotal} pe)`);
        if (this.data.op_l1_t) {
            let l1size = this.data.op_l1_t[this.currentFlash].length;
            if (l1size>1) {
                let txt = this.store.dom.el_statusbar.html();
                for (let i=0; i<l1size; i++) {
                    txt += `<br/>L1: (${this.data.op_l1_t[this.currentFlash][i]} us, ${this.data.op_l1_pe[this.currentFlash][i]} pe)`;
                }
                this.store.dom.el_statusbar.html(txt);
            }
        }
        if (this.data.op_cluster_ids) {
            this.store.dom.el_statusbar.html(
                this.store.dom.el_statusbar.html() +
               '<br/>matching: ' + this.data.op_cluster_ids[this.currentFlash]
            )
        }

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