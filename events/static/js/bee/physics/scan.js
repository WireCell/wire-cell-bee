// hand scan 

class Scan {
    constructor(store, bee) {
        this.store = store;
        this.bee = bee;

        this.initDOM();
    }

    initDOM() {
        $('#scanResultsModalLink').click(() => {
            let results = Lockr.get("scan_results");
            let txt = '<pre>';
            for (let event in results) {
                let thisEvent = results[event];
                txt += event + ' '
                    + (thisEvent['event_type'] ? thisEvent['event_type'] : -1) + ' '
                    + (thisEvent['unsure'] ? 'unsure' : 'sure') + ' '
                    + thisEvent['url']
                    + '\n';
            }
            txt += '</pre>'
            $('#scanResultsModelBody').html(txt);
        });
        $('#clear-scan').click((e) => {
            e.preventDefault();
            Lockr.set('scan_results', {});
        });
    }

    loadPreviousScanResults() {
        let sst = this.bee.current_sst;
        let scan_id = `${sst.data.runNo}-${sst.data.subRunNo}-${sst.data.eventNo}`;
        let results = Lockr.get('scan_results');
        if (!results) return;
        let thisEvent = results[scan_id];
        if (!thisEvent) return;
        let event_type = thisEvent['event_type'];
        if (event_type) {
            $('#scanResult' + event_type).prop('checked', true);
        }
        let unsure = thisEvent['unsure'];
        if (unsure) {
            $('#sureCheck').prop('checked', true);
        }
    }

}

export { Scan }