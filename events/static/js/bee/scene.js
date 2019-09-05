// 3D scence objects

class Scene3D {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;
        
        this.raycaster = new THREE.Raycaster();
        this.initCamera();
        this.initScene();
        this.initRenderer();
        this.initController();
        this.animate();
    }

    initScene() {
        this.scene = {}

        this.scene.main = new THREE.Scene();
        this.scene.slice = new THREE.Scene();
    }

    initCamera() {
        this.camera = {};
        let camera = null;

        let scale = this.store.config.camera.scale;
        let depth = this.store.config.camera.depth;
        let width = window.innerWidth;
        let height = window.innerHeight;

        let near = 1;
        let far = 8000;
        // orthographic camera: frustum aspect ratio mush match viewport's aspect ratio
        this.camera.orthoCamera = new THREE.OrthographicCamera(width / -2 * scale, width / 2 * scale, height / 2, height / -2, near, far);
        camera = this.camera.orthoCamera;
        camera.position.set(-depth * Math.sin(Math.PI / 4), depth * Math.sin(Math.PI / 6), depth * Math.cos(Math.PI / 4));
        camera.zoom = 1500. / depth;
        camera.updateProjectionMatrix();

        let fov = 25;
        this.camera.pspCamera = new THREE.PerspectiveCamera(fov, width * scale / height, near, far);
        camera = this.camera.pspCamera;
        camera.position.set(-depth * Math.sin(Math.PI / 4), depth * Math.sin(Math.PI / 6), depth * Math.cos(Math.PI / 4));

        // three smaller cameras
        far = 4000;
        this.camera.frontCamera = new THREE.OrthographicCamera(width / -2 * scale, width / 2, height / 2, height / -2, near, far);
        camera = this.camera.frontCamera;
        camera.position.set(-1000, 0, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.camera.sideCamera = new THREE.OrthographicCamera(width / -2 * scale, width / 2, height / 2, height / -2, near, far);
        camera = this.camera.sideCamera;
        camera.position.set(0, 0, 1000);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.camera.topCamera = new THREE.OrthographicCamera(width / -2 * scale, width / 2, height / 2, height / -2, near, far);
        camera = this.camera.topCamera;
        camera.position.set(0, 1000, 0);
        camera.up.set(1, 0, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.camera.active = this.store.config.camera.ortho ? this.camera.orthoCamera : this.camera.pspCamera;
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        let renderer = this.renderer;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth * this.store.config.camera.scale, window.innerHeight);
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        if (this.store.config.theme == 'light') {
            renderer.setClearColor(0xFFFFFF, 1);
        }

        this.store.dom.canvas.appendChild(renderer.domElement);
    }

    initController() {
        this.controller = {};
        this.controller.orbitController = new THREE.OrbitControls(this.camera.active, this.renderer.domElement);

        this.controller.active = this.controller.orbitController;
    }

    animate() {
        let self = this;
        window.animate = () => {
            if (this.store.config.camera.rotate) {
                let newPos = Date.now() * 0.0001;
                self.scene.main.rotation.y = newPos;
                self.scene.slice.rotation.y = newPos;
            }
            else {
                self.scene.main.rotation.y = 0;
                self.scene.slice.rotation.y = 0;
            }
            self.animationId = window.requestAnimationFrame(window.animate);
            self.renderer.autoClear = false;

            let SCREEN_W = window.innerWidth * this.store.config.camera.scale;
            let SCREEN_H = window.innerHeight;
            let left, bottom, width, height;
            let renderer = self.renderer;

            renderer.setViewport(0, 0, SCREEN_W, SCREEN_H);
            renderer.setScissor(0, 0, SCREEN_W, SCREEN_H);
            renderer.setScissorTest(true);
            renderer.clear();
            renderer.render(self.scene.main, self.camera.active);
            renderer.clearDepth();
            renderer.render(self.scene.slice, self.camera.active);
            // console.log(self.camera.active)

            if (this.store.config.camera.multiview) {
                // front camera
                width = SCREEN_W * 0.3; height = SCREEN_H * 0.3; left = 10; bottom = 50;
                renderer.setViewport(left, bottom, width, height);
                renderer.setScissor(left, bottom, width, height);
                renderer.setScissorTest(true);
                self.camera.frontCamera.updateProjectionMatrix();
                renderer.render(self.scene.main, self.camera.frontCamera);

                // side camera
                width = SCREEN_W * 0.3; height = SCREEN_H * 0.3; left = SCREEN_W - 650; bottom = SCREEN_H - 200;
                renderer.setViewport(left, bottom, width, height);
                renderer.setScissor(left, bottom, width, height);
                renderer.setScissorTest(true);
                self.camera.sideCamera.updateProjectionMatrix();
                renderer.render(self.scene.main, self.camera.sideCamera);

                // top camera
                width = SCREEN_W * 0.3; height = SCREEN_H * 0.3; left = SCREEN_W - 400; bottom = SCREEN_H - 200;
                renderer.setViewport(left, bottom, width, height);
                renderer.setScissor(left, bottom, width, height);
                renderer.setScissorTest(true);
                self.camera.topCamera.updateProjectionMatrix();
                renderer.render(self.scene.main, self.camera.topCamera);
            }
        }
        window.animate();
    }

    yzView() {
        this.resetScence();
        this.camera.active.up.set(0, 1, 0);
        TweenLite.to(this.camera.active.position, this.store.config.camera.tween_duration, {
            x: -this.store.config.camera.depth,
            y: this.controller.active.target.y,
            z: this.controller.active.target.z,
            onUpdate: () => { this.controller.active.update() }
        });
    }

    xyView() {
        this.resetScence();
        this.camera.active.up.set(0, 1, 0);
        TweenLite.to(this.camera.active.position, this.store.config.camera.tween_duration, {
            x: this.controller.active.target.x,
            y: this.controller.active.target.y,
            z: this.store.config.camera.depth,
            onUpdate: () => { this.controller.active.update() }
        });
    }

    xzView() {
        this.resetScence();
        this.camera.active.up.set(1, 0, 0);
        TweenLite.to(this.camera.active.position, this.store.config.camera.tween_duration, {
            x: this.controller.active.target.x,
            y: this.store.config.camera.depth,
            z: this.controller.active.target.z,
            onUpdate: () => { this.controller.active.update() }
        });
    }

    xuView() { this.tpcView(0) }

    xvView() { this.tpcView(1) }

    xwView() { this.tpcView(2) }

    tpcView(index) {
        let rot = Math.PI / 180 * this.store.experiment.tpc.viewAngle[index];
        this.scene.main.rotation.x = rot;
        this.scene.slice.rotation.x = rot;
        this.camera.active.up.set(1, 0, 0);
        TweenLite.to(this.camera.active.position, this.store.config.camera.tween_duration, {
            x: this.controller.active.target.x,
            y: this.store.config.camera.depth,
            z: this.controller.active.target.z,
            onUpdate: () => { this.controller.active.update() }
        });
    }

    resetCamera() {
        this.resetScence();
        this.camera.active.up.set(0, 1, 0);
        this.controller.active.reset();
        this.controller.active.target.set(0, 0, 0);
    }

    resetScence() {
        this.scene.main.rotation.x = 0;
        this.scene.slice.rotation.x = 0;
    }

    getIntersect(e) {
        let mouse = { x: 1, y: 1 };
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        let raycaster = this.raycaster;
        raycaster.params.Points.threshold = 5;
        raycaster.setFromCamera(mouse, this.camera.active);

        let pcl = this.bee.current_sst.pointCloud;
        let intersects = raycaster.intersectObject(pcl);

        if (intersects.length > 0) {
            let index = intersects[0].index;
            let x = pcl.geometry.attributes.position.array[index * 3]; // local coordinates
            let y = pcl.geometry.attributes.position.array[index * 3 + 1];
            let z = pcl.geometry.attributes.position.array[index * 3 + 2];
            return [x, y, z]
        }
        else { return null }
    }

    showIntersect(e) {
        let loc = this.getIntersect(e);
        if (null == loc) return;
        let [x, y, z] = this.store.experiment.toGlobalXYZ(...loc);
        this.store.dom.el_statusbar.html(`(x, y, z) = (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
    }

    setTargetSphere(e) {
        let loc = this.getIntersect(e);
        if (null == loc) {
            this.store.dom.el_statusbar.html('none detected');
            return;
        }
        else {
            if (this.targetSphere != null) { this.scene.main.remove(this.targetSphere) }
            let geometry = new THREE.SphereGeometry(2, 32, 32);
            let material = new THREE.MeshNormalMaterial({
                blending: THREE.NormalBlending,
                opacity: 0.4,
                transparent: true,
                depthWrite: false
            });
            this.targetSphere = new THREE.Mesh(geometry, material);
            this.targetSphere.overdraw = true;
            this.targetSphere.position.x = loc[0];
            this.targetSphere.position.y = loc[1];
            this.targetSphere.position.z = loc[2];
            this.scene.main.add(this.targetSphere);
            this.controller.active.target.set(...loc);
        }
    }

}

export { Scene3D }
