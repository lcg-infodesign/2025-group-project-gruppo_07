let table;
let costumRadius = {
  "britain": {r: 295},
  "france": {r: 255},
  "spain": {r: 255},
  "portugal": {r: 180},
  "germany": {r: 200},
  "belgium": {r: 90},
  "netherlands": {r: 110},
  "italy": {r: 90}
};
let clusters = [];
let outerCluster;
let forceSlider;
let colonizerGroups = new Map();
let clusterColorsByName = {
  "britain": "#81201A",   
  "france": "#4D4871",   
  "spain": "#E3BC47",   
  "portugal": "#99AB59",   
  "germany": "#8799BD",   
  "belgium": "#CA5D84",   
  "netherlands": "#D97963",   
  "italy": "#7EC1AF"    
};

let customPositions = {}; 

function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
}

//Prova animazione javascript    
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.2
});


document.querySelectorAll('.bg_wrapper,.text, .text2, .pointer, .pointer2, .pointer3, .text3, .falseBtn,.falseTimeLine, .text4, .text5').forEach(el => observer.observe(el));



function setup(){
  noCanvas()

  for (let i = 0; i < table.getRowCount(); i++) {
      let row = table.getRow(i);
      let colonizer = row.get("colonizer");
      let country = row.get("country");
      let duration = parseFloat(row.get("Duration")) || 0;
      let endYear = parseFloat(row.get("colend_max")) || 0;
      let startYear = parseFloat(row.get("colstart_max")) || 0;

      if (!colonizerGroups.has(colonizer)) colonizerGroups.set(colonizer, []);
      colonizerGroups.get(colonizer).push({ country, duration, endYear, startYear });
    }

  //new p5(sketch, 'general_view')
  new p5(sketch1, 'time_view')
}



/*let sketch = function(p){
  p.createContainerCanvas = function(container){
    let w = container.width
    let h = container.height
    let canvas = p.createCanvas(w, h)
    canvas.parent(container)
  }
  p.setup = function(){
    let container = p.select('#general_view')
    p.createContainerCanvas(container)
   
  
   // Posizioni
  customPositions = {
    "britain": { x: (p.width * 0.63) + 150, y: p.height * 0.63 },
    "france": { x: (p.width * 0.44) + 150, y: p.height * 0.72 },
    "spain": { x: (p.width * 0.42) + 150, y: p.height * 0.35 },
    "portugal": { x: (p.width * 0.60) + 150, y: p.height * 0.30 },
    "germany": { x: (p.width * 0.75) + 150, y: p.height * 0.40 },
    "belgium": { x: (p.width * 0.78) + 150, y: p.height * 0.65 },
    "netherlands": { x: (p.width * 0.56) + 150, y: p.height * 0.88 },
    "italy": { x: (p.width * 0.32) + 150, y: p.height * 0.55 }
  };
  const contractionFactor = 0.88;

  // Creo cluster
  let colonizers = Array.from(colonizerGroups.keys());
  colonizers.forEach((colonizer, i) => {
    let pos = customPositions[colonizer];
    
    // Applica contrazione verso il centro
    let dx = pos.x - width / 2;
    let dy = pos.y - height / 2;
    let x = width / 2 + dx * contractionFactor;
    let y = height / 2 + dy * contractionFactor;

    let colr = clusterColorsByName[colonizer] || "#ffffff";
    let rad = costumRadius[colonizer].r;

    clusters.push(new Cluster(x, y, rad, colonizerGroups.get(colonizer), colonizer, colr));
  });

  }

  p.draw = function(){
    p.clear();
  for(let cl of clusters){
    cl.update();
    cl.show();
  }
  }
class Cluster {
  constructor(x, y, r, dataArray, name, colr){
    this.x = x;
    this.y = y;
    this.r = r;
    this.name = name;
    this.colr = colr;
    this.data = dataArray;
    this.sphere = [];
    
    let endYears = this.data.map(d => d.endYear);
    this.minEnd = min(...endYears);
    this.maxEnd = max(...endYears);

    this.createBubbles();
  }

  createBubbles(){
    for(let rec of this.data){
      let br = map(rec.duration, 0, max(...this.data.map(d=>d.duration)), 5, 36);
      let angle = random(0, TWO_PI);
      let radius = random(0, this.r - br);
      let x = this.x + cos(angle) * radius;
      let y = this.y + sin(angle) * radius;

      this.sphere.push({
        x, y, r: br, v: createVector(0,0), 
        endYear: rec.endYear,
        startYear: rec.startYear  
      });
    }
  }

  update(){
    
    
    for(let s of this.sphere){
      // Forza interna verso centro del cluster
      let dInternal = createVector(this.x - s.x, this.y - s.y);
      dInternal.mult(0.01);
      s.v.add(dInternal);
    }

    // Collisioni tra sfere
    for(let i = 0; i < this.sphere.length; i++){
      for(let j = i + 1; j < this.sphere.length; j++){
        let A = this.sphere[i];
        let B = this.sphere[j];

        let dx = B.x - A.x;
        let dy = B.y - A.y;
        let distAB = sqrt(dx*dx + dy*dy);
        let minDist = A.r + B.r + 2;

        if(distAB < minDist){
          let overlap = (minDist - distAB) * 0.05;
          let ang = atan2(dy, dx);

          A.v.x -= cos(ang) * overlap;
          A.v.y -= sin(ang) * overlap;
          B.v.x += cos(ang) * overlap;
          B.v.y += sin(ang) * overlap;
        }
      }
    }

    // Aggiorno posizioni
    for(let s of this.sphere){
      s.x += s.v.x;
      s.y += s.v.y;
      s.v.mult(0.88);
    }
  }

  show(){
    for(let s of this.sphere){
      p.fill(this.colr);
        p.noStroke();
        p.circle(s.x,s.y,s.r);
    }

  }

}
}
*/






let sketch1 = function(p){
  let localClusters = [];
  let outerCluster;
  let forceSlider;
  let globalMinStart = Infinity;
  let globalMaxStart = -Infinity;
  let globalMinEnd   = Infinity;
  let globalMaxEnd   = -Infinity;
  let playCheckBox;
  let isPlaying = false;
  let hoveredSphere = null;
  let morphWidth = 0

  p.createContainerCanvas = function(container){
    let w = container.width;
    let h = container.height;
    let canvas = p.createCanvas(w, h);
    canvas.parent(container);
  }

  p.setup = function(){
    let container = p.select('#time_view');
    p.createContainerCanvas(container);

    forceSlider = p.createSlider(0, 100, 0, 0.01);
    let sliderWidth = p.constrain(p.floor(p.windowWidth * 0.4), 200, 800);
    forceSlider.style('width', sliderWidth + 'px');
    forceSlider.style("z-index", "99999")
    forceSlider.position(((p.windowWidth - sliderWidth)/2) + 150, p.windowHeight - 70);
    

 p.updateSliderGradient= function() {
  let val = forceSlider.value();
  let min = forceSlider.elt.min;
  let max = forceSlider.elt.max;
  let percent = ((val - min) / (max - min)) * 100;

  let leftOffset = 1;
  let rightOffset = 1;
  let fillPercent = leftOffset + ((percent / 100) * (100 - leftOffset - rightOffset));

  forceSlider.elt.style.background = `
    linear-gradient(
      to right,
      transparent 0.9%,
      #313131 ${leftOffset}%,
      #313131 ${fillPercent}%,
      transparent ${fillPercent}%,
      transparent ${100 - rightOffset}%
    )
  `;
}

  
 forceSlider.input(p.updateSliderGradient);

  playCheckBox = p.select('#playBtn')
  playCheckBox.changed(() => {
  isPlaying = playCheckBox.checked();
});
 


    // calcolo timeline globale
    for(let i = 0; i < table.getRowCount(); i++){
      let row = table.getRow(i);
      let start = parseFloat(row.get("colstart_max")) || 0;
      let end   = parseFloat(row.get("colend_max")) || 0;
      if(start < globalMinStart) globalMinStart = start;
      if(start > globalMaxStart) globalMaxStart = start;
      if(end   < globalMinEnd)   globalMinEnd   = end;
      if(end   > globalMaxEnd)   globalMaxEnd   = end;
    }

    outerCluster = { x: (p.width/2) + 150, y: p.height/2, r: 400};

    // posizioni cluster
    let positions = {
    "britain": { x: (p.width * 0.54) + 150, y: p.height * 0.61 },
    "france": { x: (p.width * 0.42) + 150, y: p.height * 0.70 },
    "spain": { x: (p.width * 0.42) + 150, y: p.height * 0.35 },
    "portugal": { x: (p.width * 0.53) + 150, y: p.height * 0.41 },
    "germany": { x: (p.width * 0.65)+ 150, y: p.height * 0.45 },
    "belgium": { x: (p.width * 0.65) + 150, y: p.height * 0.63 },
    "netherlands": { x: (p.width * 0.50) + 150, y: p.height * 0.78 },
    "italy": { x: (p.width * 0.36) + 150, y: p.height * 0.55 }
    };

    Array.from(colonizerGroups.keys()).forEach(colonizer=>{
      let pos = positions[colonizer];
      let colr = clusterColorsByName[colonizer];
      let rad  = costumRadius[colonizer].r;
      localClusters.push(new Cluster(pos.x,pos.y,rad,colonizerGroups.get(colonizer),colonizer,colr));
    });
  }


  p.draw = function(){
    p.clear();
    
    if (isPlaying) {
  let val = forceSlider.value();
  if (val < 100) {
    forceSlider.value(val + 0.1); 
    p.updateSliderGradient();
  } else {
    isPlaying = false;
    playCheckBox.checked(false);
  }
}

    for(let cl of localClusters){
      cl.update();
      cl.show();
       
    }

    hoveredSphere = null;

for (let cl of localClusters) {
  for (let s of cl.sphere) {

    let d = p.dist(p.mouseX, p.mouseY, s.x, s.y);
    let distToClusterCenter = p.dist(cl.x, cl.y, s.x, s.y);

    let sliderVal = forceSlider.value() / 100;
    let tStart = p.map(s.startYear, globalMinStart, globalMaxStart, 0.05, 0.85);
    let tEnd   = p.map(s.endYear, globalMinEnd,   globalMaxEnd,   0.15, 0.95);


    if (sliderVal < tStart || sliderVal > tEnd) continue;
    if (distToClusterCenter > cl.r) continue;
    if (d < s.r/2) {
      hoveredSphere = s;  
      p.push();
  
  
  p.stroke("#313131");
  p.fill("#e7e1d18b");

  p.textSize(14);
  let textW = p.textWidth(s.country);
  
  let padding = 20;              
  let boxW = textW + padding * 2;  
  let boxH = 30;

  p.rect(p.mouseX + 10, p.mouseY - boxH - 5, boxW, boxH, 5);

  p.fill("#313131");
  p.textFont("montserrat")
  p.textAlign(p.CENTER, p.CENTER);
  p.text(s.country, p.mouseX + 10 + boxW / 2, p.mouseY - boxH / 2 - 5);

  p.pop




    } 
  }
}
}

  p.mousePressed = function () {

  let sliderBox = forceSlider.elt.getBoundingClientRect();
  let mx = p.mouseX + window.scrollX;
  let my = p.mouseY + window.scrollY;

  if (
    mx >= sliderBox.left && mx <= sliderBox.right &&
    my >= sliderBox.top  && my <= sliderBox.bottom
  ) {
    return; 
  }

  for (let cl of localClusters) {
    for (let s of cl.sphere) {

      let d = p.dist(p.mouseX, p.mouseY, s.x, s.y);

      let sliderVal = forceSlider.value() / 100;
      let tStart = p.map(s.startYear, globalMinStart, globalMaxStart, 0.05, 0.85);
      let tEnd   = p.map(s.endYear, globalMinEnd,   globalMaxEnd,   0.15, 0.95);


      if (sliderVal < tStart || sliderVal > tEnd) continue;
      let distToClusterCenter = p.dist(cl.x, cl.y, s.x, s.y);
      if (distToClusterCenter > cl.r) continue;

  
      if (d < s.r) {
        let pageUrl = "inghilterra.html?colonizer=" + cl.name + "&country=" + encodeURIComponent(s.country);
         window.location.href = pageUrl;
         return;
      }

    }
  }
};

  class Cluster{
    constructor(x, y, r, data, name, colr){
      this.x = x;
      this.y = y;
      this.r = r;
      this.name = name;
      this.colr = colr;
      this.data = data;
      this.sphere = [];
      this.rectWidth = 0;
      this.rectHeight = 0;
      this.alpha = 255

      let maxDur = Math.max(...data.map(d=>d.duration));
      for(let rec of data){
        let angle = p.random(0,p.TWO_PI);
        let x = outerCluster.x + p.cos(angle)*outerCluster.r;
        let y = outerCluster.y + p.sin(angle)*outerCluster.r;
        let br = p.map(rec.duration,0,maxDur,5,36);
        
        this.sphere.push({
          x, y, r: 10, targetR: br,
          v: p.createVector(0,0),
          startYear: rec.startYear,
          endYear: rec.endYear,
          country: rec.country,
          colr: p.color(colr),
          currentColor: p.color(180),
          fadeAlpha: 255
        });
      }
    }

update() { 
  let sliderVal = forceSlider.value(); 
  for (let s of this.sphere) { 
  let entryProgress = p.constrain(sliderVal / 100, 0, 1); 
  // Timeline globale corretta 
  let tStart = p.map(s.startYear, globalMinStart, globalMaxStart, 0.05, 0.85); 
  let tEnd = p.map(s.endYear, globalMinEnd, globalMaxEnd, 0.15, 0.95); 
  if (entryProgress < tStart) { 
    let angle = p.atan2(s.y - outerCluster.y, s.x - outerCluster.x); 
    s.x = outerCluster.x + p.cos(angle) * outerCluster.r; 
    s.y = outerCluster.y + p.sin(angle) * outerCluster.r; 
    s.r = 10; 
    s.currentColor = p.color(180);
   } else if (entryProgress >= tStart && entryProgress < tEnd) { 
    s.currentColor = p.lerpColor(s.currentColor, s.colr, 0.1); 
    let dInternal = p.createVector(this.x - s.x, this.y - s.y); 
    dInternal.mult(0.005); 
    s.v.add(dInternal); 
    let distToCenter = p.dist(s.x, s.y, this.x, this.y); 
    let localProgress = p.map(entryProgress, tStart, tEnd, 0, 1); 
    localProgress = p.constrain(localProgress, 0, 1); 
    if (distToCenter < this.r * 0.9) { 
      s.r = p.lerp(10, s.targetR, localProgress); 
    } else { 
      s.r = p.lerp(s.r, 10, 0.2); 

    } 
  } else { 
    s.currentColor = p.lerpColor(s.currentColor, p.color(100), 0.05); 
    let toCenter = p.createVector(s.x - outerCluster.x, s.y - outerCluster.y); 
    if(toCenter.mag() > 0) toCenter.normalize(); 
    let targetPos = p5.Vector.add(p.createVector(outerCluster.x, outerCluster.y), toCenter.mult(outerCluster.r)); 
    let current = p.createVector(s.x, s.y); 
    let newPos = p5.Vector.lerp(current, targetPos, 0.001); 
    let moveForce = newPos.sub(current); 
    s.v.add(moveForce); 
    s.r = p.lerp(s.r, 10, 0.05); 
  } 
  s.x += s.v.x; 
  s.y += s.v.y; 
  s.v.mult(0.88); 
} 

// Collisioni tra sfere 
  for (let i = 0; i < this.sphere.length; i++){ 
    for (let j = i+1; j < this.sphere.length; j++){ 
      let A = this.sphere[i]; 
      let B = this.sphere[j]; 
      let dx = B.x - A.x; 
      let dy = B.y - A.y; 
      let distAB = p.sqrt(dx*dx + dy*dy); 
      let minDist = A.r + B.r + 1; 
      if(distAB < minDist){ 
        let overlap = (minDist - distAB) * 0.04; 
        let ang = p.atan2(dy, dx); 
        A.v.x -= p.cos(ang) * overlap; 
        A.v.y -= p.sin(ang) * overlap; 
        B.v.x += p.cos(ang) * overlap;
         B.v.y += p.sin(ang) * overlap; 
        } 
      } 
    } 
  }

    show(){

  for (let s of this.sphere) {

  if (hoveredSphere) {

    if (s === hoveredSphere) {
      s.fadeAlpha = p.lerp(s.fadeAlpha, 255, 0.2);
    } else {
      s.fadeAlpha = p.lerp(s.fadeAlpha, 50, 0.15);
    }

  } else {
    s.fadeAlpha = p.lerp(s.fadeAlpha, 255, 0.1);
  }

  let c = p.color(s.currentColor);
  c.setAlpha(s.fadeAlpha);
  
  p.fill(c);
  p.noStroke();
  p.circle(s.x, s.y, s.r);
}
  

   p.push()

      p.stroke(this.colr);
      p.strokeWeight(2)
      p.fill("#E7E1D1")
      p.circle(this.x, this.y, 10);;

    p.pop()
    }
  
  }
}



