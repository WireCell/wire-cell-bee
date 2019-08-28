let config = {
    nEvents: 100,
    id: 0,
    theme: 'light',
    hasMC: false,
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
    geom: {
        name: 'uboone',
        halfx: 128.,
        halfy: 116.,
        halfz: 520.,
        center: [128, 0, 520],
        angleU: 60,
        angleV: 60,
        bounding_box: []
    },
    camera: {
        scale: 1.,
        depth: 2000,
        ortho: true,
        rotate: false,
        multiview: false,
        photo_booth: false
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
    sst: [
        // "WireCell-charge",
        // "truth",
        // "WireCell-simple",
        // "WireCell-deblob"
    ]
};


export { config }
