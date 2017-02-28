importScripts('lib/three.min.js');
importScripts('lib/TypedArrayUtils.js');

onmessage = function(e) {
    console.log('Message received from main script', e.data);
    var kd_positions = e.data.kd_positions;

    var measureStart = new Date().getTime();
    var kdtree = new THREE.TypedArrayUtils.Kdtree(kd_positions,
      function(a, b){
          return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2);
      }, 3);
    console.log('TIME building kdtree', new Date().getTime() - measureStart);

    // console.log(kdtree);
    var totalPoints = kd_positions.length /3;
    postMessage({
      message: 'constructing kd-tree: done. '+ totalPoints + ' nodes.'
    });

    var all_nodes = {};
    for (var i=0; i<totalPoints; i++) {
        all_nodes[i] = true;
    }

    measureStart = new Date().getTime();
    var percentage = 0.;
    do {
        var count = 0;
        for (var key in all_nodes) {
            var position = [
                kd_positions[key*3],
                kd_positions[key*3+1],
                kd_positions[key*3+2]
            ]
            var clustered_nodes = cluster(position, 160, 6);
            for (var clustered_key in clustered_nodes) {
                delete all_nodes[clustered_key];
            }
            count += 1;
            if (count == 1) {
                break;
            }
        }
        percentage = (1 - countKeys(all_nodes)/totalPoints )*100;
        postMessage({
          message:  'clustering: '+percentage.toFixed(3)+'% done.',
          nodes: clustered_nodes,
          percentage: percentage
        });
    } while (percentage<100)
    console.log('TIME cluster', new Date().getTime() - measureStart);

    function cluster(position, maxNodes, maxDistance) {
        var clustered_nodes = {};
        var tobe_clustered_nodes = {};
        var new_nodes = {};
        var lastSize = 0;

        var positionsInRange = kdtree.nearest(position, maxNodes, maxDistance);
        var size = positionsInRange.length;
        for (var i=0; i<size; i++) {
            var pos = positionsInRange[i][0].obj;

            var index = positionsInRange[i][0].pos;
            tobe_clustered_nodes[index] = pos;
        }

        do {
            new_nodes = {};
            for (var key in tobe_clustered_nodes) {
                if (key in clustered_nodes) continue;
                var positionsInRange = kdtree.nearest(tobe_clustered_nodes[key], maxNodes, maxDistance);
                var size = positionsInRange.length;
                for (var i=0; i<size; i++) {
                    var pos = positionsInRange[i][0].obj;
                    var index = positionsInRange[i][0].pos;
                    new_nodes[index] = pos;
                }
                clustered_nodes[key] = tobe_clustered_nodes[key];
            }
            for (var key in new_nodes) {
                if (key in clustered_nodes) {
                    delete new_nodes[key];
                }
            }
            tobe_clustered_nodes = new_nodes;
            // console.log(countKeys(clustered_nodes), countKeys(new_nodes));
        } while (countKeys(new_nodes)>0);

        return clustered_nodes;
    }
}

function countKeys (o) {
    var i = 0;
    for (var key in o) {
        i += 1;
    }
    return i;
}