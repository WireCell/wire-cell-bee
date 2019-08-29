class Experiment {

    constructor(name = 'unkown') {
        this.name = name; // name is same as in larsoft
        this.tpc = {
            location: [ // array of TPC locations in cm: [xmin, xmax, ymin, ymax, zmin, zmax]
                [0, 0, 0, 0, 0, 0.]
            ],
            viewAngle: [-60, 60, 0], // angle in degrees w.r.t vertical 
            halfxyz: [0, 0, 0],
            center: [0, 0, 0],
            boxROI: [0, 0, 0, 0, 0, 0], // box of interest, e.g. near the beam
            driftVelocity: 0.16, // cm/us
        };
        this.daq = {
            timeBeforeTrigger: 500 * 0.5, // us
            timeAfterTrigger: 5500 * 0.5, // us        
        };
        this.beam = {
            dir: null,
            center: null,
        }
    }

    nTPC() { return this.tpc.location.length; }
    toString() { return `${this.name}`; }

    updateTPCLocation(loc) {
        this.tpc.location = loc;
        this.updateDimensions(0, this.nTPC() - 1);
    }

    updateDimensions(first, last) {
        this.tpc.halfxyz[0] = (this.tpc.location[last][1] - this.tpc.location[first][0]) / 2;
        this.tpc.halfxyz[1] = (this.tpc.location[last][3] - this.tpc.location[first][2]) / 2;
        this.tpc.halfxyz[2] = (this.tpc.location[last][5] - this.tpc.location[first][4]) / 2;
        this.tpc.center[0] = (this.tpc.location[last][1] + this.tpc.location[first][0]) / 2;
        this.tpc.center[1] = (this.tpc.location[last][3] + this.tpc.location[first][2]) / 2;
        this.tpc.center[2] = (this.tpc.location[last][5] + this.tpc.location[first][4]) / 2;
    }

    toLocalXYZ(xyz) { // global (larsoft) coordinate to local (bee) coordinate
        return [
            xyz[0] - this.tpc.center[0],
            xyz[1] - this.tpc.center[1],
            xyz[2] - this.tpc.center[2],
        ];
    }

    toGlobalXYZ(xyz) { // local (bee) coordinate to global (larsoft) coordinate
        return [
            xyz[0] + this.tpc.center[0],
            xyz[1] + this.tpc.center[1],
            xyz[2] + this.tpc.center[2],
        ];
    }

}


// --------------------------------------------------------
class MicroBooNE extends Experiment {

    constructor() {
        super('uboone');
        this.updateTPCLocation([
            [0., 256., -115.51, 117.45, 0., 1036.96]
        ]);
        this.tpc.viewAngle = [-60, 60, 0];
        this.tpc.driftVelocity = 0.1101; // cm/us
        this.daq.timeBeforeTrigger = (3200 + 10) * 0.5; //us
        this.daq.timeAfterTrigger = (6400 - 10) * 0.5; //us
    }

}

// --------------------------------------------------------
class ProtoDUNE extends Experiment {

    constructor() {
        super('protodune');
        this.updateTPCLocation([
            [-380.434, -367.504, 0.0, 607.499, -0.49375, 231.166],
            [-359.884, -0.008, 0.0, 607.499, -0.49375, 231.166],
            [0.008, 359.884, 0.0, 607.499, -0.49375, 231.166],
            [367.504, 380.434, 0.0, 607.499, -0.49375, 231.166],
            [-380.434, -367.504, 0.0, 607.499, 231.566, 463.226],
            [-359.884, -0.008, 0.0, 607.499, 231.566, 463.226],
            [0.008, 359.884, 0.0, 607.499, 231.566, 463.226],
            [367.504, 380.434, 0.0, 607.499, 231.566, 463.226],
            [-380.434, -367.504, 0.0, 607.499, 463.626, 695.286],
            [-359.884, -0.008, 0.0, 607.499, 463.626, 695.286],
            [0.008, 359.884, 0.0, 607.499, 463.626, 695.286],
            [367.504, 380.434, 0.0, 607.499, 463.626, 695.286]
        ]);
        this.tpc.viewAngle = [-35.7, 35.7, 0];
        this.tpc.boxROI = [-100, 0, 250, 500, 0, 400];
        this.tpc.driftVelocity = 0.16; // cm/us
        this.daq.timeBeforeTrigger = 500 * 0.5; //us
        this.daq.timeAfterTrigger = 5500 * 0.5; //us
        this.beam.dir = [-0.178177, -0.196387, 0.959408];
        this.beam.center = [-27.173, 421.445, 0];
    }

}

// --------------------------------------------------------
class ICARUS extends Experiment {

    constructor() {
        super('icarus');
        this.updateTPCLocation([
            [-369.06, -220.86, -181.86, 134.96, -894.951, 894.951],
            [-219.57, -71.37, -181.86, 134.96, -894.951, 894.951],
            [71.37, 219.57, -181.86, 134.96, -894.951, 894.951],
            [220.86, 369.06, -181.86, 134.96, -894.951, 894.951],
        ]);
        this.tpc.viewAngle = [90, -60, 60];
        // this.tpc.driftVelocity = 0.16; // cm/us
        // this.daq.timeBeforeTrigger = 500*0.5; //us
        // this.daq.timeAfterTrigger = 5500*0.5; //us
    }

}

// --------------------------------------------------------
class DUNE10ktWorkspace extends Experiment {

    constructor() {
        super('dune10kt_workspace');
        this.updateTPCLocation([
            [-363.376, -2.53305, -607.829, 0, -0.87625, 231.514],
            [2.53305, 363.376, -607.829, 0, -0.87625, 231.514],
            [-363.376, -2.53305, 0, 607.829, -0.87625, 231.514],
            [2.53305, 363.376, 0, 607.829, -0.87625, 231.514],
            [-363.376, -2.53305, -607.829, 0, 231.514, 463.904],
            [2.53305, 363.376, -607.829, 0, 231.514, 463.904],
            [-363.376, -2.53305, 0, 607.829, 231.514, 463.904],
            [2.53305, 363.376, 0, 607.829, 231.514, 463.904]
        ]);
        this.tpc.viewAngle = [-35.7, 35.7, 0];
    }

}

// --------------------------------------------------------
class DUNE35t extends Experiment {

    constructor() {
        super('dune35t');
        this.updateTPCLocation([
            [-34.4523, -7.27732, -84.4008, 115.087, -2.03813, 51.4085],
            [-0.747073, 221.728, -84.4008, 115.087, -2.03813, 51.4085],
            [-34.4523, -7.27732, -84.4852, 0.015, 51.4085, 103.332],
            [-0.747073, 221.728, -84.4852, 0.015, 51.4085, 103.332],
            [-34.4523, -7.27732, 0, 115.087, 51.4085, 103.332],
            [-0.747073, 221.728, 0, 115.087, 51.4085, 103.332],
            [-34.4523, -7.27732, -84.4008, 115.087, 103.332, 156.779],
            [-0.747073, 221.728, -84.4008, 115.087, 103.332, 156.779]
        ]);
        this.tpc.viewAngle = [-45, 45, 0];
    }

}

// --------------------------------------------------------

function createExperiment(name) {
    let exp = null;
    if (name == 'uboone') { exp = new MicroBooNE(); } 
    else if (name == 'protodune') { exp = new ProtoDUNE(); }
    else if (name == 'icarus') { exp = new ICARUS(); }
    else if (name == 'dune10kt_workspace') { exp = new DUNE10ktWorkspace(); }
    else if (name == 'dune35t') { exp = new DUNE35t(); }
    else { exp = new MicroBooNE(); } // default
    return exp;
}

export { createExperiment }
