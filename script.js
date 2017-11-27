function getTilesFromGeometry(geometry, template, zoom){
  function long2tile(lon,zoom) {
    return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
  }
  function lat2tile(lat,zoom) {
    return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
  }
  function replaceInTemplate(point){
    return template.replace('{z}', point.z)
    .replace('{x}', point.x)
    .replace('{y}', point.y);
  }

  var allLat = geometry.map(function(point){
    return point.lat;
  });
  var allLng = geometry.map(function(point){
    return point.lng;
  });
  var minLat = Math.min.apply(null, allLat);
  var maxLat = Math.max.apply(null, allLat);
  var minLng = Math.min.apply(null, allLng);
  var maxLng = Math.max.apply(null, allLng);
  var top_tile    = lat2tile(maxLat, zoom); // eg.lat2tile(34.422, 9);
  var left_tile   = long2tile(minLng, zoom);
  var bottom_tile = lat2tile(minLat, zoom);
  var right_tile  = long2tile(maxLng, zoom);

  for (var y = top_tile; y < bottom_tile + 1; y++) {
    for (var x = left_tile; x < right_tile + 1; x++) {
      tiles.push(replaceInTemplate({x, y, z: zoom}))
    }
  }
  return tiles;
}

var tiles = [];
var tileList = document.querySelector('#tile-list');
var mapName;
new DroneDeploy({version: 1}).then(function(dronedeploy){
  dronedeploy.Plans.getCurrentlyViewed().then(function(plan){
    mapName = `${plan.name}-map-${plan.username}`;
    var zoom = 17;
    dronedeploy.Tiles.get({planId: plan.id, layerName: 'ortho', zoom: zoom})
    .then(function(res){
      tiles = getTilesFromGeometry(plan.geometry, res.template, zoom);
    });
  });
});

//Draws an item on the canvas
function drawCanvas(data, x, y){
  let newCanvas = document.getElementById("newCanvas");
  let ctx = newCanvas.getContext("2d");
  let img = new Image();
  //Base 64 data from call to proxy server
  img.src=data;
  img.onload = function(){
    ctx.drawImage(img, x, y, 320, 320);
    //once last tile has been drawn, call generate PDF function
    if (y >= 300) savePDF();
  }
}

//Saves the PDF
function savePDF(){
  document.getElementById('generatePDF').innerText = 'Saving PDF...'
  html2canvas(document.getElementById("newCanvas"), {
    onrendered: function(canvas) {
      var imgData = canvas.toDataURL(
        'image/png');
      var doc = new jsPDF('p', 'mm');
      doc.addImage(imgData, 'png', 10, 10);
      doc.save(`${mapName}.pdf`);
      //Change text of button back after PDF has been saved
      document.getElementById('generatePDF').innerText = 'Generate PDF';
    }
  });
}

//Loops through tile array, gets base 64 string of tile from proxy server, and draws to canvas
function generatePDF() {
  //Change text of button to show user PDF is being generated
  document.getElementById('generatePDF').innerText = 'Generating PDF...'
  let x = 0;
  let y = 0;
  // Loop through array of tiles returned from API request, for each tile send AJAX get request to my proxy server
  tiles.forEach(function(element, index){
    $.get( `https://pure-gorge-83413.herokuapp.com/?url=${element}`, function( data ) {
      drawCanvas(data, x, y)
      y += 300;
    });
  });
};



// onClick for generate PDF button
var generatePDFButton = document.getElementById("generatePDF")
generatePDFButton.addEventListener('click', generatePDF)




