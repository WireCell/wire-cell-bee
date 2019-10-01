// global data store
import { createExperiment } from './physics/experiment.js'

let store = {}

//--------------------------------------------------
store.event = {
    nEvents: 100,
    id: 0,
    hasMC: false,
    hasOP: false,
    sst: [ // list of reco algorithms
        // "WireCell-charge", "truth", "WireCell-simple"
    ],
}

//--------------------------------------------------
store.config = {
    theme: 'light',
    helper: {
        showTPC: true,
        showAxes: false,
        deadAreaOpacity: 0.0,
        showFlash: false,
        showMCNeutral: false,
        showBeam: false,
        showSCB: true
    },
    mc: {
        showMC: false,
        showNeutron: false,
        showGamma: false,
        showNeutrino: false
    },
    op: {
        showFlash: false,
        showPMTClone: false,
        matchTiming: false,
        showMatchingCluster: false,
        showPred: true,
        showNonMatchingCluster: false,
        tpc_cluster_id: -1
    },
    slice: {
        enabled: false,
        opacity: 0.0,
        width: 0.32,
        position: 0,
        color: 0x00FFFF
    },
    box: {
        box_mode: false,
        xmin: 0.,
        xmax: 0.,
        ymin: 0.,
        ymax: 0.,
        zmin: 0.,
        zmax: 0.,
        tpcNo: -1
    },
    live: {
        refresh: false,
        interval: 60
    },
    material: {
        colorScale: 1.0,
        opacity: 0.2,
        size: 2,
        showCharge: false,
        showCluster: false,
        overlay: true
    },
    camera: {
        scale: 1.,
        depth: 2000,
        ortho: true,
        tween_duration: 0.4,
        rotate: false,
        multiview: false,
        photo_booth: false
    }
}

//--------------------------------------------------
store.ui = {
    USER_COLORS: {
        'dark': [
            0xffffff, // white
            0xFF8080, // light red
            0x96f97b, // light green
            0xffff14, // yellow
            0x95d0fc, // light blue
            0xe50000, // red
            0xbf77f6, // light purple
            0x0343df, // blue
            0xf97306, // orange
            0xc20078, // magenta
            0x15b01a, // green
            0x029386, // teal
            0xe6daa6, // beige
            0x7e1e9c // purple
        ],
        'light': [
            0x0343df, // blue
            0xe50000, // red
            0x15b01a, // green
            0x7e1e9c, // purple
            0x00035b, // dark blue
            0xc20078, // magenta
            0x029386, // teal
            0xff81c0, // pink
            0x0a888a, // dark cyan
            0x014d4e, // dark teal
            0x960056, // dark magenta
            0xf97306, // orange
            0xcb416b, // dark pink
            0x000000, // black
        ]
    }
}

//--------------------------------------------------
store.dom = {
    canvas: document.getElementById('container'),
    el_statusbar: $('#statusbar'),
    el_logo: $('#event-logo'),
    el_statsbar: $('#statsbar'),
    el_loadingbar: $('#loadingbar'),
    el_mc: $('#mc'),
    panel_sst: {
        el_container: $('#sst-docker'),
        el_size: $('#sst-size'),
        el_opacity: $("#sst-opacity"),
        el_color: $('#sst-color'),
    },
    panel_scan: {
        el_radio: $('input[name=scanResult]:checked'),
        el_sure: $('input[name=sureCheck]:checked'),
    },
    gui_sst: {}
}

//--------------------------------------------------
store.url = {
    base_url: '',
    event_url: '',
    root_url: '',
    base_query: '',
}
store.url.base_url = window.location.href.replace('#', "");
let index_of_query_postion = store.url.base_url.indexOf('?');
if (index_of_query_postion > 0) {
    store.url.base_query = store.url.base_url.substring(index_of_query_postion);
    store.url.base_url = store.url.base_url.substring(0, index_of_query_postion);
}
store.url.event_url = store.url.base_url.substring(0, store.url.base_url.indexOf('event')) + 'event/';
store.url.root_url = store.url.base_url.substring(0, store.url.base_url.indexOf('set'));
store.url.simple_url = store.url.base_url.substring(store.url.base_url.indexOf('set') - 1);

// ----- html5 local storage ------------------------------
class LocalStore {

    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        window.setInterval(() => { this.save() }, 30000);
        $(window).bind('beforeunload', () => { this.save() });
    }

    save() {
        let store_config = {
            'material': store.config.material,
            'box': store.config.box,
            'slice': store.config.slice,
            'theme': store.config.theme,
            'helper': store.config.helper,
            'camera': store.config.camera,
            'mc': store.config.mc
        };
        Lockr.set('store_config', store_config);

        let sst_config = {};
        for (let name in this.bee.sst.list) {
            let sst = this.bee.sst.list[name];
            sst_config[name] = {
                'size': sst.material.size,
                'opacity': sst.material.opacity,
                // 'chargeColor': sst.material.chargeColor.getHexString()
            }
        }
        Lockr.set('sst_config', sst_config);


        let scan_results = Lockr.get('scan_results');
        if (scan_results == null) scan_results = {};
        let sst = this.bee.current_sst;
        let scan_id = sst.runNo + '-' + sst.subRunNo + '-' + sst.eventNo;
        let event_type = $('input[name=scanResult]:checked').val();
        if (event_type) {
            scan_results[scan_id] = {
                'url': base_url,
                'event_type': event_type,
                'unsure': $('input[name=sureCheck]').is(':checked')
            };
            Lockr.set('scan_results', scan_results);
        }
    }

    clear() { Lockr.flush() }

    clearAndReload() {
        $(window).unbind('beforeunload');
        Lockr.flush();
        window.location.reload();
    }
}

//--------------------------------------------------
store.process = {} // store ajax request objects
store.process.init = $.getJSON(window.location.href, (data) => {
    store.experiment = createExperiment(data.experiment);
    
    store.config.box.xmin = store.experiment.tpc.boxROI[0];
    store.config.box.xmax = store.experiment.tpc.boxROI[1];
    store.config.box.ymin = store.experiment.tpc.boxROI[2];
    store.config.box.ymax = store.experiment.tpc.boxROI[3];
    store.config.box.zmin = store.experiment.tpc.boxROI[4];
    store.config.box.zmax = store.experiment.tpc.boxROI[5];
    store.config.slice.position = -store.experiment.tpc.halfxyz[0];
    store.config.camera.depth = store.experiment.camera.depth;

    $.extend(true, store.event, data);
    $.extend(true, store.config, Lockr.get('store_config'), data.config); // priority: server > lockr > store
});

export { store, LocalStore }
