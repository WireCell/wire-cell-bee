importScripts('/static/js/lib/three.min.js');

onmessage = function(e) {
  // console.log('Message received from main script', e.data);
  var data = e.data.vertices;
  var halfx = e.data.geo.halfx;
  var center_y = e.data.geo.center_y;
  var center_z = e.data.geo.center_z;
  var extrudeSettings = {
      steps           : 100,
      bevelEnabled    : false,
      extrudePath     : null
  };

  var mergedGeometry = new THREE.Geometry();
  for (var i=0; i<data.length; i++) {
    // console.log(i);
      var pts = [];
      var raw_pts = data[i];
      var cy = 0;
      var cz = 0;
      for (var j = 0; j < raw_pts.length; j ++ ) {
          cy += raw_pts[j][0];
          cz += raw_pts[j][1];
      }
      cy /= raw_pts.length;
      cz /= raw_pts.length;
      for (var j = 0; j < raw_pts.length; j ++ ) {
          pts.push( new THREE.Vector2(-raw_pts[j][1]+cz, raw_pts[j][0]-cy) );
      }
      var spline = new THREE.SplineCurve3( [
          new THREE.Vector3( -halfx, cy-center_y,  cz-center_z),
          // new THREE.Vector3( $.fn.BEE.user_options.geom.halfx, toLocalY(cy),  toLocalZ(cz)),
          new THREE.Vector3( -halfx+2, cy-center_y,  cz-center_z),
      ] );
      extrudeSettings.extrudePath = spline;
      var shape = new THREE.Shape(pts);
      var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      mergedGeometry.merge(geometry);
  }
  // console.log(mergedGeometry);
  // console.log('Posting message back to main script', e.data);
  var bufferGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry);
  postMessage({
    position: bufferGeometry.attributes.position.array,
    normal: bufferGeometry.attributes.normal.array
  });
  return close();
}