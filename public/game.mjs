const cylinderarea = document.getElementById("cylinderarea");
const cylinder = document.getElementById("cylinder");
const cols = document.getElementsByClassName("col");
var cylinderroty = 0;

export function cylinderGame(){
  applyCylinderShadow();
  cylinderarea.addEventListener("wheel", function (e) {
    cylinderroty += e.deltaY/10;
    cylinder.style.transform = 'rotateY('+cylinderroty.toString()+'deg)';
    applyCylinderShadow();
  });
}

function applyCylinderShadow(){
  var i=0;
  for (var col of cols) {
    col.style.filter = 'brightness('+(0.5+Math.cos(2*Math.PI*(i/8 + cylinderroty/360))/2).toString()+')';
    i+=1;
  }
}