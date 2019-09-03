// Helper 3D objects

class Helper {

    constructor(store, bee) {
        this.scene = bee.scene3d.scene.main;
        this.store = store;
        this.showAxes();
        this.showTPC();
        this.showBeam();
    }

    show(condition, obj) {
        if (condition) { this.scene.add(obj) }
        else { this.scene.remove(obj) }
    }

    showAxes() {
        if (null == this.axes) { // init if not exist
            let length = 100; // cm
            this.axes = new THREE.AxesHelper(length);
        }
        this.show(this.store.config.helper.showAxes, this.axes);
    }

    showTPC() {
        if (null == this.tpc) {
            this.tpc = new THREE.Group();
            let exp = this.store.experiment;
            let size = exp.nTPC();
            let loc = exp.tpc.location;
            for (let i = 0; i < size; i++) {
                let box = new THREE.BoxHelper(new THREE.Mesh(
                    new THREE.BoxGeometry(loc[i][1] - loc[i][0], loc[i][3] - loc[i][2], loc[i][5] - loc[i][4]),
                    new THREE.MeshBasicMaterial()
                ));
                box.material.color.setHex(0x666666);
                box.material.transparent = true;
                box.material.opacity = 0.5;

                let one = new THREE.Object3D;
                one.add(box);
                let [x, y, z] = exp.toLocalXYZ(
                    (loc[i][1] + loc[i][0]) / 2,
                    (loc[i][3] + loc[i][2]) / 2,
                    (loc[i][5] + loc[i][4]) / 2
                );
                one.position.set(x, y, z);
                this.tpc.add(one);
            }
        }
        this.show(this.store.config.helper.showTPC, this.tpc);

    }

    showBeam() {
        if (null == this.beam) { // init if not exist
            let exp = this.store.experiment;
            if (null == exp.beam.dir || null == exp.beam.center) { return }

            this.beam = new THREE.Group();
            let radius = 12.5;
            let segments = 300; //<-- Increase or decrease for more resolution

            let circleGeometry = new THREE.CircleGeometry(radius, segments);
            circleGeometry.vertices.shift(); // remove center vertex
            let beamWindow = new THREE.LineLoop(circleGeometry, new THREE.MeshBasicMaterial({
                color: 0xff0000,
                opacity: 0.2,
                side: THREE.DoubleSide
            }));
            beamWindow.position.set(...exp.toLocalXYZ(...exp.beam.center))
            this.beam.add(beamWindow);

            let dir = new THREE.Vector3(...exp.beam.dir);
            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();
            let length = 200;
            let hex = 0xfcb001;
            let origin = new THREE.Vector3(
                beamWindow.position.x - length * dir.x,
                beamWindow.position.y - length * dir.y,
                beamWindow.position.z - length * dir.z
            );
            let arrow = new THREE.ArrowHelper(dir, origin, length, hex);
            this.beam.add(arrow);

        }
        this.show(this.store.config.helper.showBeam, this.beam);
    }


}

export { Helper }