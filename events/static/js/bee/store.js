// global data store
import { createExperiment } from './experiment.js'

let store = {}

store.event = {
    nEvents: 100,
    id: 0,
    hasMC: false,
    reco: [ // list of reco algorithms
        // "WireCell-charge", "truth", "WireCell-simple"
    ],
}

store.config = {
    theme: 'light',
    helper: {
        showTPCs: true,
        showAxises: false,
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

store.xhr = {} // store ajax request objects

store.xhr.init = $.getJSON(window.location.href, (data) => {
    $.extend(true, store.event, data);
    store.experiment = createExperiment(data.experiment);
    // console.log('server data: ', data);
}); // config from server


export { store }
