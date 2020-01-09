// 3D scence objects

class Speech {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.transcript = [];

            // note: gramma not supported in Chrome!
            this.commands = ['top' , 'side', 'front'];
            let grammar = '#JSGF V1.0; grammar colors; public <color> = ' + this.commands.join(' | ') + ' ;'
            let speechRecognitionList = new webkitSpeechGrammarList();
            speechRecognitionList.addFromString(grammar, 1);
            this.recognition.grammars = speechRecognitionList;
            
            this.initSpeech();
        }
        else {
            console.log('speech api not supported in this browser.')
        }

    }

    initSpeech() {
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 5;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => { this.recognizing = true; };
        this.recognition.onend = () => { 
            this.recognizing = false; 
            let ctrls = this.bee.gui.folder.camera.__controllers;
            ctrls[ctrls.length-1].setValue(false);
        };
        this.recognition.onerror = (e) => { console.log(e.error); };
        this.recognition.onnomatch = (e) => {
            console.log("I didn't recognise this command.");
        }

        this.recognition.onresult = (event) => {
            let last = event.results.length - 1;
            this.transcript = [];
            for (let result of event.results[last]) {
                this.transcript.push(result.transcript.trim().toLowerCase());
            }
            // console.log(this.transcript)
            this.action();
        };

        if (this.store.config.helper.speech) {
            this.recognition.start();
        }
    }

    action() {
        let scene3d = this.bee.scene3d;
        // let camera = this.bee.scene3d.camera.active;
        let cmd = this.transcript;
        console.log(cmd);
        if (cmd.includes('side') || cmd.includes('site')) { scene3d.yzView() } // x
        else if (cmd.includes('top')) { scene3d.xzView() } // y
        else if (cmd.includes('front')) { scene3d.xyView() } // z
        else if (cmd.includes('u')) { scene3d.xuView() } // u
        else if (cmd.includes('v') || cmd.includes('we') || cmd.includes('me') ) { scene3d.xvView() } // v
        else if (cmd.includes('w')) { scene3d.xwView() } // w
        else if (cmd.includes('reset')) { scene3d.resetCamera() } // r
        else if (cmd.includes('next event')) { this.bee.gui.increaseEvent(1) } // shift+n
        else if (cmd.includes('previous event')) { this.bee.gui.increaseEvent(-1) } // shift+p
        else {
            for (let c of cmd) {
                if (c.includes('event number')) {
                    let value = c.replace('event number', '').trim();
                    if (!isNaN(value)) {
                        let v = parseInt(value, 10);
                        if (v < this.store.event.nEvents) {
                            window.location.assign(this.store.url.event_url + value + '/' + this.store.url.base_query);
                        }
                    }
                }
            }
        }

        if (null != this.bee.op) {
            if (cmd.includes('previous flash')) { this.bee.op.prev() } // <
            else if (cmd.includes('next flash')) { this.bee.op.next() } // >
            else if (cmd.includes('previous match')) { this.bee.op.prevMatching() } // ,
            else if (cmd.includes('next match')) { this.bee.op.nextMatching() } // .
            else if (cmd.includes('neutrino')) { this.bee.op.nextMatchingBeam() } // /
            else if (cmd.includes('everthing')) { 
                let ctrls = this.bee.gui.folder.op.__controllers;
                ctrls[3].setValue(false);            } 
        }

    }
}

export { Speech }
