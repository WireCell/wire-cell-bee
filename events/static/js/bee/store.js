// global data store
import { createExperiment } from './experiment.js'

let store = {}

//--------------------------------------------------
store.event = {
    nEvents: 100,
    id: 0,
    hasMC: false,
    reco: [ // list of reco algorithms
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
    flash: {
        showFlash: false,
        showPMTClone: false,
        matchTiming: false,
        showMatchingCluster: false,
        showPred: true,
        showNonMatchingCluster: false,
        tpc_cluster_id: -1
    },
    slice: {
        opacity: 0.0,
        width: 0.32
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
        showCharge: true,
        showCluster: false,
        overlay: true
    },
    camera: {
        scale: 1.,
        depth: 2000,
        ortho: true,
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
    panel_reco: {
        el_container: $('#sst-docker'),
        el_size: $('#sst-size'),
        el_opacity: $("#sst-opacity"),
        el_color: $('#sst-color'),
    },
    panel_scan: {
        el_radio: $('input[name=scanResult]:checked'),
        el_sure: $('input[name=sureCheck]:checked'),
    },
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

//--------------------------------------------------
store.xhr = {} // store ajax request objects
store.xhr.init = $.getJSON(window.location.href, (data) => {
    $.extend(true, store.event, data);
    store.experiment = createExperiment(data.experiment);
    // console.log('server data: ', data);
}); // config from server


export { store }
