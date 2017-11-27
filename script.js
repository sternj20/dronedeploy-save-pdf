
/*

1. Get tiles from Drone Deploy console
2. Loop through array of tiles returned from API request, for each tile send AJAX get request to my proxy server
3. Get what is returned which is what should be base 64 representation of that image
4. Add new image with that base64 src to the canvas
5. Generate PDF from canvas


additional steps between 4 and 5 are additional css to make sure that tile layers look correct

*/

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

var tiles = []
var tileList = document.querySelector('#tile-list');
new DroneDeploy({version: 1}).then(function(dronedeploy){
  dronedeploy.Plans.getCurrentlyViewed().then(function(plan){
    var zoom = 17;
    dronedeploy.Tiles.get({planId: plan.id, layerName: 'ortho', zoom: zoom})
    .then(function(res){
      tiles = getTilesFromGeometry(plan.geometry, res.template, zoom);
      console.log(tiles)
    });
  });
});

//Draws an item on the canvas
function drawCanvas(data, x, y){
  let newCanvas = document.getElementById("newCanvas")
  let ctx = newCanvas.getContext("2d") 
  let img = new Image()
  img.src=data
  img.onload = function(){

    ctx.drawImage(img,x,y, 320,320)
    if (y >= 300) reallyGeneratePDF();
  }
}

//Actually generates the PDF
function reallyGeneratePDF(){
  html2canvas(document.getElementById("newCanvas"), {
    logging:true,
    onrendered: function(canvas) {
      var imgData = canvas.toDataURL(
        'image/png');              
      var doc = new jsPDF('p', 'mm');
      doc.addImage(imgData, 'png', 10, 10);
      console.log(imgData)
      doc.save('sample-file=map.pdf');
    }
  });
}
//Loops through tile array, gets base 64 string of tile from proxy server, and draws to canvas
function generatePDF() {
  let x = 0;
  let y = 0
  console.log('drawing tiles onto canvas')
  // Loop through array of tiles returned from API request, for each tile send AJAX get request to my proxy server
  tiles.forEach(function(element, index){
    $.get( `https://pure-gorge-83413.herokuapp.com/?url=${element}`, function( data ) {
      drawCanvas(data, x, y)
      y += 300
    })
  })
}



// onClick for generate PDF button
var generatePDFButton = document.getElementById("generatePDF")
generatePDFButton.addEventListener('click', generatePDF)






