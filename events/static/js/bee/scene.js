import { store } from './store.js'

class Scene3D {
    constructor() {
        store.xhr.init.then(() => {
            this.initCamera();
            this.initScene();
            // console.log(store.experiment.name);
        })
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene_slice = new THREE.Scene();

        this.group_main = new THREE.Group();
        this.scene.add(this.group_main);

        this.axises = new THREE.AxesHelper(100);
        if (store.config.helper.showAxises) {
            this.scene.add(this.axises);
        }

    }

    initCamera() {
        this.camera = {};
        let camera = null;

        let scale = store.config.camera.scale;
        let depth = store.config.camera.depth;
        let width = window.innerWidth;
        let height = window.innerHeight;

        let near = 1;
        let far = 8000;
        // orthographic camera: frustum aspect ratio mush match viewport's aspect ratio
        this.camera.ortho = new THREE.OrthographicCamera(width / -2 * scale, width / 2 * scale, height / 2, height / -2, near, far);
        camera = this.camera.ortho;
        camera.position.set(-depth * Math.sin(Math.PI / 4), depth * Math.sin(Math.PI / 6), depth * Math.cos(Math.PI / 4));
        camera.zoom = 1500. / depth;
        camera.updateProjectionMatrix();

        let fov = 25;
        this.camera.perspective = new THREE.PerspectiveCamera(fov, width * scale / height, near, far);
        camera = this.camera.perspective;
        camera.position.set(-depth * Math.sin(Math.PI / 4), depth * Math.sin(Math.PI / 6), depth * Math.cos(Math.PI / 4));

        this.camera.main = store.config.camera.ortho ? this.camera.ortho : this.camera.perspective;

        // three smaller cameras
        far = 4000;
        this.camera.front = new THREE.OrthographicCamera(width / -2 * scale, width / 2, height / 2, height / -2, near, far);
        camera = this.camera.front;
        camera.position.set(-1000, 0, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.camera.side = new THREE.OrthographicCamera(width / -2 * scale, width / 2, height / 2, height / -2, near, far);
        camera = this.camera.side;
        camera.position.set(0, 0, 1000);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.camera.top = new THREE.OrthographicCamera(width / -2 * scale, width / 2, height / 2, height / -2, near, far);
        camera = this.camera.top;
        camera.position.set(0, 1000, 0);
        camera.up.set(1, 0, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

}

export { Scene3D }
