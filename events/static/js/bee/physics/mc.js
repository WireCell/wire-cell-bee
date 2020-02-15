// Monte Carlo truth object

class MC {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        this.init();
    }

    init() {
        this.listOfMCObjects = [];
        this.loadData();
        this.process.then(() => {
            this.initJStree();
            this.initConnections();
        });

    }

    loadData() {
        this.url = this.store.url.base_url + 'mc/';
        let el = this.store.dom.el_loadingbar;
        this.process = $.getJSON(this.url, (data) => {
            this.data = data;
            el.html(el.html() + "<br /><strong class='success'>Loading</strong> MC ... done. ");
        })
            .fail(() => {
                console.log(`no mc found: ${this.url}`);
            });
    }

    initJStree() {
        this.store.dom.el_mc.jstree({
            'core': {
                'themes': {
                    'icons': true,
                    'stripes': false
                },
                'dblclick_toggle': false,
                'data': this.data
            },
            "checkbox": {
                "keep_selected_style": false,
                "three_state": false,
                "cascade": 'down'
            },
            "plugins": ["checkbox"]
        });
        if (this.store.config.mc.showMC) { this.store.dom.el_mc.show() }
    }

    initConnections() {

        this.store.dom.el_mc.on('changed.jstree', (e, data) => {
            this.selectionChanged(data);
        })

    }

    selectionChanged(data) {
        let scene = this.bee.scene3d.scene.main;
        let exp = this.store.experiment;
        for (let i = 0; i < this.listOfMCObjects.length; i++) {
            scene.remove(this.listOfMCObjects[i]);
        }
        this.listOfMCObjects = [];

        let line, node, geometry, material;
        let neutronMaterial = new THREE.LineBasicMaterial({color: 0x59656d});
        let gammaMaterial = new THREE.LineBasicMaterial({color: 'green'});
        let neutrinoMaterial = new THREE.LineBasicMaterial({color: 'yellow'});
        let chargedMaterial =  new THREE.LineBasicMaterial({
            color: 0xff000d,
            linewidth: 4, // webgl doesn't support line width for now
        });
        let vtxGeometry = new THREE.SphereGeometry(2, 32, 32);
        let vtxMaterial = new THREE.MeshNormalMaterial({
            blending: THREE.NormalBlending,
            opacity: 0.8,
            transparent: true,
            depthWrite: false
        });
        let nSelected = data.selected.length;
        for (let i = 0; i < nSelected; i++) {
            node = data.instance.get_node(data.selected[i]);
            // console.log( node );
            if (node.text.indexOf("neutron") >= 0) {
                if (this.store.config.mc.showNeutron) { material = neutronMaterial }
                else { continue }
            } 
            else if (node.text.indexOf("gamma") >= 0) {
                if (this.store.config.mc.showGamma) { material = gammaMaterial }
                else { continue }
            } 
            else if (node.text.indexOf("nu_") >= 0) {
                if (this.store.config.mc.showNeutrino) { material = neutrinoMaterial }
                else { continue }
            } 
            else { material = chargedMaterial }

            geometry = new THREE.Geometry();
            if (node.data.traj_x == null) {
                geometry.vertices.push(
                    new THREE.Vector3(...exp.toLocalXYZ(...node.data.start)),
                    new THREE.Vector3(...exp.toLocalXYZ(...node.data.end))
                );
            }
            else {
                let nPoints = node.data.traj_x.length;
                for (let j = 0; j < nPoints; j++) {
                    geometry.vertices.push(
                        new THREE.Vector3(...exp.toLocalXYZ(
                            node.data.traj_x[j], node.data.traj_y[j], node.data.traj_z[j])
                        )
                    );
                }
            }
            line = new THREE.Line(geometry, material);
            this.listOfMCObjects.push(line);
            scene.add(line);

            // vertex indicator
            let sphere = new THREE.Mesh(vtxGeometry, vtxMaterial);
            sphere.overdraw = true;
            sphere.position.set(...exp.toLocalXYZ(...node.data.start));
            scene.add(sphere);
            this.listOfMCObjects.push(sphere);
            scene.add(sphere);
        }
    }

}

export { MC }