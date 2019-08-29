// 2D canvas objects
import { store } from './store.js'

class Canvas {
    constructor() {
        store.xhr.init.then(() => {
            this.init();
            this.showLogo();
            // this.showStats();
        })
    }


    init() {
        $("#progressbar").progressbar({ value: 0 });
    }

    showLogo() {
        if (store.config.theme == 'light') {
            $('#event-info').removeClass('invert-color');
        }
        let name = store.experiment.name;
        if (name == 'uboone' || name == 'protodune') {
            let new_src = store.dom.el_logo.attr('src').replace('dummy', name);
            store.dom.el_logo.attr('src', new_src);
        }
        else {
            store.dom.el_logo.hide();
        }
    }

    showStats() {
        if (null == this.stats) {
            this.stats = new Stats();
            this.stats.dom.style.position = 'relative';
            this.stats.dom.style.float = 'left';
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            store.dom.el_statsbar.append(this.stats.dom);
        }

        var el = $('#toggleStats');
        if (el.html().indexOf("Show") >= 0) {
            store.dom.el_statsbar.show();
            el.html(el.html().replace("Show", "Hide"));
        }
        else {
            store.dom.el_statsbar.hide();
            el.html(el.html().replace("Hide", "Show"));
        }
    }

}

export { Canvas }
