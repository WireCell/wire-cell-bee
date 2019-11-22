// Helper 3D objects

class Helper {

    constructor(store, bee) {
        this.bee = bee;
        this.scene = bee.scene3d.scene.main;
        this.store = store;
        this.showAxes();
        this.showTPC();
        this.showBeam();
        this.showPD();
        this.showSlice();
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

    showPD() { // show optical detectors
        let exp = this.store.experiment;
        let location = exp.op.location;
        // let nDet = exp.op.nDet;
        const addBar = (bar, barInd) => {
            for (let i=0; i<barInd.length; i++) {
                let barC = bar.clone();
                let ind = barInd[i];
                barC.position.set(...exp.toLocalXYZ(location[ind][0], location[ind][1], location[ind][2]));
                this.pd.add(barC);
            }
        };
        if (null == this.pd && this.store.experiment.name == 'protodune') { // init if not exist
            this.pd = new THREE.Group();

            let dsBar = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.PlaneGeometry(209.6825, 10.16)), 
                new THREE.LineBasicMaterial({color: 0x15b01a})
            );
            dsBar.rotation.y = Math.PI / 2;
            let dsBarArr = [
                0,2,4,6,8, 10,12,14,15,17, 19,21,23,25,27, 
                61,63,65,67,69, 71,73,75,77,79, 81,83,84,86,88
            ]
            addBar(dsBar, dsBarArr);

            let dipBar = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.PlaneGeometry(209.6825, 10.16)), 
                new THREE.LineBasicMaterial({color: 0x0343df})
            );
            dipBar.rotation.y = Math.PI / 2;
            let dipBarArr = [
                1,3,5,7,9, 11,13,16,18, 20,22,24,26,28, 
                62,64,66,68,70, 72,74,76,78,80, 82,85,87,89
            ]
            addBar(dipBar, dipBarArr);

            // Arapuca bar, large
            let apuBar = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.PlaneGeometry(20, 8)), 
                new THREE.LineBasicMaterial({color: 0xf97306})
            );
            apuBar.rotation.y = Math.PI / 2;
            let apuBarArr = [
                29,31,33,35,
                45,47,49,51
            ]
            addBar(apuBar, apuBarArr);

            // Arapuca bar, small
            let apuBar2 = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.PlaneGeometry(10, 8)), 
                new THREE.LineBasicMaterial({color: 0xf97306})
            );
            apuBar2.rotation.y = Math.PI / 2;
            let apuBar2Arr = [
                37,38,39,40,41,42,43,44,
                53,54,55,56,57,58,59,60
            ]
            addBar(apuBar2, apuBar2Arr);

        }
        this.show(this.store.config.helper.showPD, this.pd);
    }

    showSlice() {
        if (null == this.slice) { // init if not exist
            let config = this.store.config;
            let exp = this.store.experiment;
            let [halfx, halfy, halfz] = exp.tpc.halfxyz;
            let [centerx, centery, centerz] = exp.toLocalXYZ(...exp.tpc.center)

            if (config.theme == 'light') { config.slice.color = 0xFF0000 }

            this.slice = new THREE.Mesh(
                new THREE.BoxGeometry(config.slice.width, halfy * 2, halfz * 2),
                new THREE.MeshBasicMaterial({
                    color: config.slice.color,
                    transparent: true,
                    opacity: config.slice.opacity
                }));
            this.slice.position.set(config.slice.position, centery, centerz);
            this.bee.scene3d.scene.slice.add(this.slice);  // slice has its own scene
        }
        if (this.store.config.slice.enabled) { this.bee.scene3d.scene.slice.add(this.slice) }
        else { this.bee.scene3d.scene.slice.remove(this.slice) }
    }

}

export { Helper }