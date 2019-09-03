import * as util from './util.js'

// Simple Storage Tool (??)
class SST {
    constructor(name, store, bee) {
        this.name = name;
        this.store = store;
        this.bee = bee;
        this.scene = bee.scene3d.scene.main;
        this.gui = bee.gui;

        this.url = `${store.url.simple_url}${name}/`;
        this.index = store.event.sst.indexOf(name);
        this.initMaterial();
        this.initGui();
        this.loaded = false; // lazy loading
    }

    load() {
        this.process = $.getJSON(this.url, (data) => {
            this.initData(data);
            this.initPointCloud();
            this.loaded = true;
            this.bee.sst.loaded.push(this.name);
        })
            .fail(() => { console.log("load " + this.url + " failed") })
            .always(() => {
                this.process = null; // force garbage collection (a very large JSON object)
            });
    }

    initData(data) {
        this.data = {};
        let size = data.x.length; // all data must have x
        let indices = [];
        let QTHRESH = 0;
        if (this.name == "truth" || this.name == "L1") {
            QTHRESH = 500;
        }
        for (let i = 0; i < size; i++) {
            if (data.q != null && data.q[i] < QTHRESH) continue;
            indices.push(i);
        }
        let size_reduced = indices.length;
        // console.log(size_reduced, size)
        this.data.x = new Float32Array(size_reduced);
        this.data.y = new Float32Array(size_reduced);
        this.data.z = new Float32Array(size_reduced);
        this.data.q = new Float32Array(size_reduced);
        this.data.cluster_id = new Float32Array(size_reduced);
        // this.data.nq = [];
        this.data.runNo = data.runNo;
        this.data.subRunNo = data.subRunNo;
        this.data.eventNo = data.eventNo;
        this.data.eventTime = data.eventTime == null ? '' : data.eventTime;
        this.data.trigger = data.trigger == null ? '0' : data.trigger;
        this.data.bounding_box = data.bounding_box == null ? [] : data.bounding_box;
        this.data.clusterInfo = {};

        for (let i = 0; i < size_reduced; i++) {
            this.data.x[i] = data.x[indices[i]];
            this.data.y[i] = data.y[indices[i]];
            this.data.z[i] = data.z[indices[i]];
            this.data.q[i] = data.q == null ? 0 : data.q[indices[i]];
            this.data.cluster_id[i] = data.cluster_id == null ? 0 : data.cluster_id[indices[i]];

            let thisCluster = this.data.cluster_id[i];
            if (!(thisCluster in this.data.clusterInfo)) {
                this.data.clusterInfo[thisCluster] = {
                    'x_mean': 0,
                    'y_mean': 0,
                    'z_mean': 0,
                    'n': 0
                };
            }
            else {
                this.data.clusterInfo[thisCluster].x_mean += this.data.x[i];
                this.data.clusterInfo[thisCluster].y_mean += this.data.y[i];
                this.data.clusterInfo[thisCluster].z_mean += this.data.z[i];
                this.data.clusterInfo[thisCluster].n += 1;
            }
        }
        this.data.nCluster = 0;
        for (let id in this.data.clusterInfo) {
            this.data.nCluster += 1;
            this.data.clusterInfo[id].x_mean /= this.data.clusterInfo[id].n;
            this.data.clusterInfo[id].y_mean /= this.data.clusterInfo[id].n;
            this.data.clusterInfo[id].z_mean /= this.data.clusterInfo[id].n;
        }
    }

    initPointCloud() {
        this.pclBounds = {
            xmax: util.getMaxOfArray(this.data.x),
            xmin: util.getMinOfArray(this.data.x),
            ymax: util.getMaxOfArray(this.data.y),
            ymin: util.getMinOfArray(this.data.y),
            zmax: util.getMaxOfArray(this.data.z),
            zmin: util.getMinOfArray(this.data.z),
            xmean: util.getMeanOfArray(this.data.x),
            ymean: util.getMeanOfArray(this.data.y),
            zmean: util.getMeanOfArray(this.data.z)
        }

        this.drawInsideThreeFrames(false, this.store.config.box.box_mode);
    }

    drawInsideBox(xmin, xmax, ymin, ymax, zmin, zmax, randomClusterColor = false) {

        // if(this.boxhelper != null) {
        //     this.scene.remove(this.boxhelper);
        // }

        if (this.pointCloud != null) {
            this.scene.remove(this.pointCloud);
        }

        let config = this.store.config;
        let theme = config.theme;
        let USER_COLORS = this.store.ui.USER_COLORS;
        let size = this.data.x.length;
        let indices = [];
        for (let i = 0; i < size; i++) {
            let [x, y, z] = this.store.experiment.toLocalXYZ(this.data.x[i], this.data.y[i], this.data.z[i]);
            if (x < xmin || x > xmax || y < ymin || y > ymax || z < zmin || z > zmax) {
                continue;
            }
            indices.push(i);
        }
        let size_show = indices.length;
        let positions = new Float32Array(size_show * 3);
        let colors = new Float32Array(size_show * 3);

        let ran = Math.floor(Math.random() * 5);
        if (!randomClusterColor) { ran = 0; }

        let size_actual = 0;
        for (let i = 0; i < size_show; i++) {
            let ind = indices[i];
            if (config.flash.tpc_cluster_id != -1) {
                if (this.data.cluster_id[ind] != this.store.flash.tpc_cluster_id) {
                    continue;
                }
            }
            if (config.flash.showNonMatchingCluster) {
                try {
                    let op = bee.op;
                    if (!op.nomatching_cluster_ids.includes(this.data.cluster_id[ind])) {
                        continue;
                    }
                    else {
                        // console.log(op_cluster_ids, this.data.cluster_id[ind]);
                    }
                }
                catch (err) {
                    // console.log(err);
                }
            }
            else if (config.flash.showMatchingCluster) {
                try {
                    let op = bee.op;
                    let op_cluster_ids = op.cluster_ids[op.currentFlash];
                    if (!op_cluster_ids.includes(this.data.cluster_id[ind])) {
                        continue;
                    }
                    else {
                        // console.log(op_cluster_ids, this.data.cluster_id[ind]);
                    }
                }
                catch (err) {
                    // console.log(err);
                }

            }
            // add position
            [positions[size_actual * 3], positions[size_actual * 3 + 1], positions[size_actual * 3 + 2]] =
                this.store.experiment.toLocalXYZ(this.data.x[ind], this.data.y[ind], this.data.z[ind]);

            // add color
            let color = new THREE.Color();
            if (config.material.showCluster) {
                let length = USER_COLORS[theme].length;
                let color_id = Math.floor((this.data.cluster_id[ind] + length) % (length - ran));
                color = new THREE.Color(USER_COLORS[theme][color_id]);
            }
            else if (config.material.showCharge) {
                let scale = config.material.colorScale;
                color.setHSL(util.getColorAtScalar(this.data.q[ind], Math.pow(scale, 2) * 14000 * 2 / 3), 1, 0.5);
                if (this.name.indexOf('gray') > -1) {
                    let gray = (color.r + color.g + color.b) / 3;
                    color.setRGB(gray, gray, gray);
                }
            }
            else {
                color = this.material.chargeColor;
            }
            color.toArray(colors, size_actual * 3);

            size_actual += 1;
        }

        positions = positions.slice(0, size_actual * 3);
        colors = colors.slice(0, size_actual * 3);

        let geometry = new THREE.BufferGeometry();
        geometry.dynamic = true;
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;

        let material = new THREE.PointsMaterial({
            vertexColors: true,
            size: this.material.size,
            // blending: THREE.NormalBlending,
            opacity: this.material.opacity,
            transparent: true,
            depthWrite: false,
            // depthTest: false,
            sizeAttenuation: false
        });

        this.pointCloud = new THREE.Points(geometry, material);
        this.scene.add(this.pointCloud);

    }

    drawInsideThreeFrames(randomClusterColor = false, box_mode = false) {
        let tpc = this.store.experiment.tpc;
        if (box_mode) {
            this.drawInsideBoxHelper();
        }
        else {
            this.drawInsideSlice(-3 * tpc.halfxyz[0], tpc.halfxyz[0] * 6, randomClusterColor);
        }
    }

    drawInsideSlice(start, width, randomClusterColor = false) {
        this.drawInsideBox(start, start + width, -1e9, 1e9, -1e9, 1e9, randomClusterColor);
    }

    drawInsideBoxHelper() {

    }

    initMaterial() {
        this.material = {};

        const theme = this.store.config.theme;
        const USER_COLORS = this.store.ui.USER_COLORS;
        const i = this.index;
        const color_index = i >= USER_COLORS[theme].length ? i - USER_COLORS[theme].length : i;
        this.material.chargeColor = new THREE.Color(USER_COLORS[theme][color_index]);
        this.material.opacity = this.store.config.material.opacity;
        this.material.size = this.store.config.material.size;
    }

    initGui() {
        let name = this.name;
        let folder = this.gui.folder.sst;
        // let opacity = sst.name == "WireCell-charge" ? this.options.material.opacity : 0;

        folder.add(this, "selected").name(name);
        let el = $(`.dg .property-name:contains(${name})`);
        this.store.dom.gui_sst[name] = el;
        el.css({ 'width': '100%' });

        folder.__controllers[this.index].name(`${this.index + 1}. ${name}`);
    }

    selected() {
        this.bee.current_sst = this;
        let el = $('#sst');
        el.html(this.name);
        el.show();
        if (!this.loaded) { this.load() }

        // if (this.material == null) { // load sst on demand
        //     this.setup();
        //     this.scene3D.registerSST(this);
        //     this.process.then(function(){
        //         this.setProp();
        //     }, function(){});
        // }
        // else {
        //     this.setProp();
        // }
        // for (let name in this.store.dom.gui_sst) {
        //     this.store.dom.gui_sst[name].css('color', 'white');
        // }
        // this.store.dom.gui_sst[this.name].css('color', '#f97306');

        this.setGuiColor();
        this.setProp()
        // console.log(`${this.name} selected`);
    }

    setGuiColor() {
        let $el = this.store.dom.gui_sst[this.name];
        let color = this.material.chargeColor;
        let rgb_string = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${this.material.opacity})`;
        $el.css('background-color', rgb_string);
    }

    setProp() {
        // if (!this.store.config.overlay) {
        //     for (let name in this.bee.sst.list) {
        //         this.bee.sst.list[name].material.opacity = 0;
        //     }
        //     this.material.opacity = this.store.config.material.opacity;
        // }
        let panel = this.store.dom.panel_sst;
        panel.el_size.slider("value", this.material.size);
        panel.el_opacity.slider("value", this.material.opacity);
        panel.el_color.val('#' + this.material.chargeColor.getHexString());
    }
}

export { SST }
