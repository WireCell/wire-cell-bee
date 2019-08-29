// Helper 3D objects

class Helper {

    constructor(scene, store) {
        this.scene = scene;
        this.store = store;
        this.toggleAxes();
    }


    toggleAxes() {
        if (this.axes == null) { // init if not exist
            let length = 100; // cm
            this.axes = new THREE.AxesHelper(length);
        }
        this.toggle(this.store.config.helper.showAxises, this.axes);
    }

    toggle(condition, obj) {
        if (condition) { this.scene.add(obj) }
        else { this.scene.remove(obj) }
    }
}

export { Helper }