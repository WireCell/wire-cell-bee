// event dispatcher

class Dispatcher {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        this.initKeyEvents();
        this.initClickEvents();
    }

    addClickEvent(jqObj, f, obj, eventName) {
        let name = eventName == null? 'click' : eventName;
        jqObj.on(name, (e) => {
            e.preventDefault();
            f.call(obj);
        });
    }

    initKeyEvents() {
        Mousetrap.bindGlobal('esc', () => {
            $('input').blur(); // remove focus from input elements
            $('select').blur(); // remove focus from select elements
        });

        let scene3d = this.bee.scene3d;
        let camera = this.bee.scene3d.camera.active;

        Mousetrap.bind('x', () => { scene3d.yzView() });
        Mousetrap.bind('y', () => { scene3d.xzView() });
        Mousetrap.bind('z', () => { scene3d.xyView() });
        Mousetrap.bind('u', () => { scene3d.xuView() });
        Mousetrap.bind('v', () => { scene3d.xvView() });
        Mousetrap.bind('w', () => { scene3d.xwView() });
        Mousetrap.bind('r', () => { scene3d.resetCamera() });
        Mousetrap.bind('shift+up', () => { camera.zoom += 0.1; camera.updateProjectionMatrix() });
        Mousetrap.bind('shift+down', () => { camera.zoom -= 0.1; camera.updateProjectionMatrix() });

        Mousetrap.bind('=', () => { this.bee.current_sst.increaseOpacity(0.05) });
        Mousetrap.bind('-', () => { this.bee.current_sst.increaseOpacity(-0.05) });
        Mousetrap.bind('{', () => { this.bee.current_sst.increaseOpacity(-1) }); // fully transparent 
        Mousetrap.bind('}', () => { this.bee.current_sst.increaseOpacity(1) }); // fully opaque
        Mousetrap.bind('+', () => { this.bee.current_sst.increaseSize(0.5) });
        Mousetrap.bind('_', () => { this.bee.current_sst.increaseSize(-0.5) });

        // this.addKeyEvent('m', self.toggleMC);
        // this.addKeyEvent('a', self.toggleShowAutoVtx);
        // this.addKeyEvent('q', self.toggleCharge);
        // this.addKeyEvent('shift+n', self.nextEvent);
        // this.addKeyEvent('shift+p', self.prevEvent);
        // this.addKeyEvent('k', self.nextSlice);
        // this.addKeyEvent('j', self.prevSlice);
        // this.addKeyEvent('<', self.prevOp);
        // this.addKeyEvent('>', self.nextOp);
        // this.addKeyEvent('.', self.nextMatchingOp);
        // this.addKeyEvent(',', self.prevMatchingOp);
        // this.addKeyEvent('/', self.nextMatchingBeamOp);
        // this.addKeyEvent('o', self.redrawAllSSTRandom);
        // this.addKeyEvent('shift+f', self.play);
        // this.addKeyEvent('shift+i', self.toggleROI);
        // this.addKeyEvent('b', self.toggleBox);
        // this.addKeyEvent('shift+t', self.nextTPC);
        // this.addKeyEvent('\\', self.toggleScan);

        for (let i = 1; i <= 9; i++) {
            Mousetrap.bind(i.toString(), (e, key) => {
                let index = Number(key) - 1;
                let sstList = this.store.event.sst;
                if (index > sstList.length - 1) { return }
                let sst = this.bee.sst.list[sstList[index]];
                if (sst) { sst.selected() }
            });
        }
    }

    initClickEvents() {
        let scene3d = this.bee.scene3d;

        this.addClickEvent($('#resetCamera'), scene3d.resetCamera, scene3d);
        this.addClickEvent($('#xyView'), scene3d.xyView, scene3d);
        this.addClickEvent($('#xzView'), scene3d.xzView, scene3d);
        this.addClickEvent($('#xuView'), scene3d.xuView, scene3d);
        this.addClickEvent($('#xvView'), scene3d.xvView, scene3d);

        this.addClickEvent($('#preset-default'), this.bee.localstore.clearAndReload, this.bee.localstore);

    }
}

export { Dispatcher }