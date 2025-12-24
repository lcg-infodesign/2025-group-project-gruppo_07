let table;
let tableTime;
let colonne = []
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
  "spain": "#C49A00",   
  "portugal": "#99AB59",   
  "germany": "#8799BD",   
  "belgium": "#CA5D84",   
  "netherlands": "#D97963",   
  "italy": "#7EC1AF"    
};

let customPositions = {}; 

function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
  tableTime = loadTable("assets/colonie_per_anno.csv", "csv", "header")
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

    for(let i = 0; i < 2; i++){
      let colums = tableTime.getColumn(i);
      colonne[i] = colums.map(i => float(i))
      console.log(colonne)
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
  let sliderHover = false;
  let sliderX = 0;
  let sliderY = 0;
  let sliderW = 0;
  let sliderH = 0;
  let hoverAlpha = 0;   
  let hoverOffset = 20; 

  let paragraphs = [
  {
    start: 1500,
    end: 1600,
    title: "1500–1600: The Dawn of European Expansion",
    text: "During the sixteenth century, European powers began to extend their reach across the globe. Spain and Portugal led this early phase of colonization after the voyages of Columbus (1492) and Vasco da Gama (1498). Their maritime empires established control over the Americas, coastal Africa, and parts of Asia, creating the first global trading networks. Although colonization was significant, most of the world—particularly in Asia and Africa—remained independent.",
    alpha: 0,
    yOffset: 20,
    titleAlpha: 0,     
    titleOffset: 40
  },
  {
    start: 1750,
    end: 1820,
    title: "1750–1820: Expansion of Maritime Empires",
    text: "By the late eighteenth century, colonial empires became central to global economics and politics. Britain, France, and the Netherlands built vast networks of colonies linked by maritime trade. The Seven Years’ War (1756–1763) confirmed Britain’s dominance in India and North America, while Spain and Portugal’s American empires began to weaken. This period saw a substantial increase in the number of territories under European rule, as colonial economies fueled industrial growth at home.",
    alpha: 0,
    yOffset: 20,
    titleAlpha: 0,     
    titleOffset: 40
  },
  {
    start: 1880,
    end: 1914,
    title: "1880–1914: The Peak of Global Colonization",
    text: "The decades before World War I marked the absolute height of imperial expansion. Industrialization, nationalism, and competition among European powers drove the Scramble for Africa (1884–1885) and the annexation of territories in Asia and the Pacific. By 1914, over four-fifths of the world’s land area was controlled or dominated by colonial powers, with Britain and France leading global empires that spanned every continent. This period represents the maximum global extent of colonial domination in human history.",
    alpha: 0,
    yOffset: 20,
    titleAlpha: 0,     
    titleOffset: 40
  },
  {
    start: 1918,
    end: 1939,
    title: "1918–1939: Stagnation and Rising Nationalism",
    text: "After World War I, European empires reached their greatest territorial extent but began to weaken internally. Germany lost its colonies under the Treaty of Versailles (1919), and Britain and France assumed control of new League of Nations mandates. Despite apparent stability, nationalist and independence movements emerged in India, the Middle East, and Africa. The colonial world remained vast—about two-thirds of the global population lived under imperial rule—but cracks in the system were becoming visible.",
    alpha: 0,
    yOffset: 20,
    titleAlpha: 0,     
    titleOffset: 40
  },
  {
    start: 1945,
    end: 1975,
    title: "1945–1975: The Era of Decolonization",
    text: "The aftermath of World War II brought the most dramatic decline in global colonization. European powers were economically and militarily exhausted, and colonial subjects demanded independence. The process began with India in 1947 and spread rapidly across Asia and Africa. The United Nations, Cold War politics, and global public opinion accelerated the dismantling of empires. By the mid-1970s, most colonies had gained sovereignty, marking the end of the classical colonial era.",
    alpha: 0,
    yOffset: 20,
    titleAlpha: 0,     
    titleOffset: 40
  },
  {
    start: 1980,
    end: 2000,
    title: "1980–2000: The Postcolonial World",
    text: "By the late twentieth century, almost all former colonies had achieved independence. Portugal’s withdrawal from Africa (1975), Zimbabwe’s independence (1980), and the return of Hong Kong to China (1997) symbolized the close of five centuries of European expansion. Only a few dependent territories remained under European control. Formal colonialism disappeared, but new forms of economic and political influence—sometimes called neo-colonialism—continued to shape global relations.",
    alpha: 0,
    yOffset: 20,
    titleAlpha: 0,     
    titleOffset: 40
  }
];



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
    forceSlider.position(((p.windowWidth - sliderWidth)/2) + 200, p.windowHeight - 70);
    

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
  isPlaying = playCheckBox.checked()
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

    outerCluster = { x: (p.width/2) + 200, y: p.height/2, r: 400};

    // posizioni cluster
    let positions = {
    "britain": { x: (p.width * 0.48) + 200, y: p.height * 0.54 },
    "france": { x: (p.width * 0.38) + 200, y: p.height * 0.68 },
    "spain": { x: (p.width * 0.42) + 200, y: p.height * 0.23 },
    "portugal": { x: (p.width * 0.56) + 200, y: p.height * 0.30 },
    "germany": { x: (p.width * 0.65)+ 200, y: p.height * 0.43 },
    "belgium": { x: (p.width * 0.60) + 200, y: p.height * 0.60 },
    "netherlands": { x: (p.width * 0.53) + 200, y: p.height * 0.79 },
    "italy": { x: (p.width * 0.38) + 200, y: p.height * 0.37 }
    };

    Array.from(colonizerGroups.keys()).forEach(colonizer=>{
      let pos = positions[colonizer];
      let colr = clusterColorsByName[colonizer];
      let rad  = costumRadius[colonizer].r;
      localClusters.push(new Cluster(pos.x,pos.y,rad,colonizerGroups.get(colonizer),colonizer,colr));
    });

    // Ripristina la posizione della timeline se esiste
let savedSliderPosition = localStorage.getItem('timelinePosition');
if (savedSliderPosition) {
  forceSlider.value(parseFloat(savedSliderPosition));
  p.updateSliderGradient();
  // Pulisci il localStorage dopo il caricamento
  localStorage.removeItem('timelinePosition');
}
  }
  
  p.keyPressed = function () {
  // SPACE bar
  if (p.key === ' ') {
    isPlaying = !isPlaying;

    
    if (playCheckBox) {
      playCheckBox.checked(isPlaying);
    }

    // evita lo scroll della pagina
    return false;
  }
};


  p.draw = function(){
    p.clear();
    
    if (isPlaying) {
  let val = forceSlider.value();
  if (val < 100) {
    forceSlider.value(val + 0.05); 
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
      p.cursor('pointer');
      hoveredSphere = s;  
      p.push();
  
  
  p.stroke("#313131");
  p.fill("#e7e1d18b");

  p.textSize(14);
  let textW = p.textWidth(s.country);
  let textW2 = p.textWidth(cl.name)
  
  let padding = 20;              
  let boxW = textW + padding * 2;  
  let boxW2 = textW2 + padding * 2;  
  let boxH = 30;

  /*p.push()
  p.rectMode(p.CENTER)
  p.rect(cl.x, cl.y-30, boxW2, boxH, 5);
  p.pop()*/

  p.rect(p.mouseX + 10, p.mouseY - boxH - 5, boxW, boxH, 5);
  
  p.push()
  p.noStroke()
  p.fill(cl.colr);
  p.textFont("montserrat");
  p.textStyle(p.BOLD)
  p.textAlign(p.CENTER, p.CENTER);
  p.text(cl.name.toUpperCase(), p.mouseX + 10 + boxW / 2, p.mouseY - boxH / 2 - 30);
  p.pop()

  p.push()
  p.noStroke()
  p.fill("#313131");
  p.textFont("montserrat")
  p.textAlign(p.CENTER, p.CENTER);
  p.text(s.country, p.mouseX + 10 + boxW / 2, p.mouseY - boxH / 2 - 5);
  p.pop()
  p.pop()

  



    }
  }
}

// Ottieni posizione reale dello slider
let r = forceSlider.elt.getBoundingClientRect();
sliderX = r.left - p.canvas.getBoundingClientRect().left;
sliderY = r.top  - p.canvas.getBoundingClientRect().top;
sliderW = r.width;
sliderH = r.height;

// Detect hover
if (
  p.mouseX >= sliderX &&
  p.mouseX <= sliderX + sliderW &&
  p.mouseY >= sliderY - 20 &&        // margine per attivare effetto prima della linea
  p.mouseY <= sliderY + sliderH
) {
  sliderHover = true;
} else {
  sliderHover = false;
}

// Animazione
if (sliderHover) {
  hoverAlpha = p.lerp(hoverAlpha, 200, 0.15); 
  hoverOffset = p.lerp(hoverOffset, 0, 0.15);   
} else {
  hoverAlpha = p.lerp(hoverAlpha, 0, 0.15);     
  hoverOffset = p.lerp(hoverOffset, 20, 0.15);  
}



if (hoverAlpha > 1) {   
  let fixedX = sliderX + sliderW / 2;

  // Rettangolo
  p.push();
  p.noStroke();
  //p.fill(49, 49, 49, hoverAlpha);  
  p.noFill()
  p.rectMode(p.CENTER);
  p.rect(fixedX, sliderY - 30 + hoverOffset, sliderW, 50, 3); 
  p.pop();

  // Grafico
  let graphHeight = 50;
  p.push();
  
  p.translate(sliderX, sliderY - 30 + hoverOffset - graphHeight / 2); 

  p.curveTightness(-0.2);
  p.beginShape();
  p.fill(49, 49, 49, hoverAlpha)
  p.stroke("#31313131")
  p.strokeWeight(1.2);
  
  
  let firstX = p.map(colonne[0][0], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0.05, sliderW * 0.95);
  let firstY = p.map(colonne[1][0], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight*0.95, graphHeight * 0.05);
  p.curveVertex(firstX, firstY); 
  
  for (let i = 0; i < colonne[0].length; i+= 40) {
    let x = p.map(colonne[0][i], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0.05, sliderW * 0.95);
    let y = p.map(colonne[1][i], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight*0.95, graphHeight * 0.05);

    p.curveVertex(x, y); 
  }
  
  
  let lastIndex = colonne[0].length - 1;
  let lastX = p.map(colonne[0][lastIndex], p.min(...colonne[0]), p.max(...colonne[0]), sliderW * 0.05, sliderW * 0.95);
  let lastY = p.map(colonne[1][lastIndex], p.min(...colonne[1]), p.max(...colonne[1]), graphHeight*0.95, graphHeight * 0.05);
  p.curveVertex(lastX, lastY); // Punto di controllo finale

  
  
  p.endShape(); 
  p.pop();
}

//data 

p.push()
let currentYear = Math.round( p.map(forceSlider.value(), 0, 100, 1433, 2010));
p.textSize(14)

let padding = 10
let dateWidth = p.textWidth(currentYear) + padding*2
p.rectMode(p.CENTER)
p.stroke("#313131")
p.strokeWeight(0.5)
p.noFill()
p.rect(sliderX + p.width * 0.43, sliderY+10, dateWidth, 30, 5);

p.push()
p.noStroke()
p.textFont("montserrat")
p.textAlign(p.CENTER, p.CENTER)
p.textStyle(p.BOLD)
p.fill("#313131")
p.text(currentYear, (sliderX + p.width * 0.43), sliderY+10)
/*p.text(forceSlider.value(), sliderX, sliderY + 40)*/
p.push()
p.textSize(12)
p.textStyle(p.NORMAL)
p.textAlign(p.CENTER, p.CENTER)
p.text("YEARS", (sliderX + p.width * 0.43), sliderY-15)
p.pop()
p.pop()
p.pop()

for (let pg of paragraphs) {
  let inRange = currentYear >= pg.start && currentYear <= pg.end;

  let targetAlpha = inRange ? 255 : 0;
  let targetOffset = inRange ? 0 : 30;

  pg.alpha   = p.lerp(pg.alpha, targetAlpha, 0.08);
  pg.yOffset = p.lerp(pg.yOffset, targetOffset, 0.08);

  
  let titleTarget = inRange ? 255 : 0;
  let titleOffsetTarget = inRange ? 0 : 40;

  pg.titleAlpha  = p.lerp(pg.titleAlpha, titleTarget, 0.1);
  pg.titleOffset = p.lerp(pg.titleOffset, titleOffsetTarget, 0.1);
}

p.push()
p.stroke("#313131")
p.strokeWeight(1)

/*1500-1600
p.line(sliderX + sliderX * 0.123 , sliderY-70, sliderX + sliderX * 0.123, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.123) - 4, sliderY-70, (sliderX + sliderX * 0.123) +4, sliderY-70, sliderX + sliderX * 0.123,sliderY-74)
p.pop()
p.line(sliderX + sliderX * 0.2949 , sliderY-40, sliderX + sliderX * 0.2949, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.2949) - 4, sliderY-44, (sliderX + sliderX * 0.2949) +4, sliderY-44, sliderX + sliderX * 0.2949,sliderY-40)
p.pop()

//1750–1820
p.line(sliderX + sliderX * 0.5486 , sliderY-80, sliderX + sliderX * 0.5486, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.5486) - 4, sliderY-80, (sliderX + sliderX * 0.5486) +4, sliderY-80, sliderX + sliderX * 0.5486,sliderY-84)
p.pop()
p.line(sliderX + sliderX * 0.665 , sliderY-40, sliderX + sliderX * 0.665, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.665) - 4, sliderY-44, (sliderX + sliderX * 0.665) +4, sliderY-44, sliderX + sliderX * 0.665,sliderY-40)
p.pop()

//1880-1914
p.line(sliderX + sliderX * 0.77 , sliderY-80, sliderX + sliderX * 0.77, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.77) - 4, sliderY-80, (sliderX + sliderX * 0.77) +4, sliderY-80, sliderX + sliderX * 0.77,sliderY-84)
p.pop()
p.line(sliderX + sliderX * 0.824 , sliderY-40, sliderX + sliderX * 0.824, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.824) - 4, sliderY-44, (sliderX + sliderX * 0.824) +4, sliderY-44, sliderX + sliderX * 0.824,sliderY-40)
p.pop()


//1918-1939
p.line(sliderX + sliderX * 0.834 , sliderY-70, sliderX + sliderX * 0.834, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.834) - 4, sliderY-70, (sliderX + sliderX * 0.834) +4, sliderY-70, sliderX + sliderX * 0.834,sliderY-74)
p.pop()
p.line(sliderX + sliderX * 0.869 , sliderY-40, sliderX + sliderX * 0.869, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.869) - 4, sliderY-44, (sliderX + sliderX * 0.869) +4, sliderY-44, sliderX + sliderX * 0.869,sliderY-40)
p.pop()

//1945-1975
p.line(sliderX + sliderX * 0.877 , sliderY-70, sliderX + sliderX * 0.877, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.877) - 4, sliderY-70, (sliderX + sliderX * 0.877) +4, sliderY-70, sliderX + sliderX * 0.877,sliderY-74)
p.pop()
p.line(sliderX + sliderX * 0.869 , sliderY-40, sliderX + sliderX * 0.869, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.869) - 4, sliderY-44, (sliderX + sliderX * 0.869) +4, sliderY-44, sliderX + sliderX * 0.869,sliderY-40)
p.pop()

//1980-2000
p.line(sliderX + sliderX * 0.9383 , sliderY-70, sliderX + sliderX * 0.9383, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.9383) - 4, sliderY-70, (sliderX + sliderX * 0.9383) +4, sliderY-70, sliderX + sliderX * 0.9383,sliderY-74)
p.pop()
p.line(sliderX + sliderX * 0.97 , sliderY-40, sliderX + sliderX * 0.97, sliderY+25 )
p.push()
p.fill("#313131")
p.triangle((sliderX + sliderX * 0.97) - 4, sliderY-44, (sliderX + sliderX * 0.97) +4, sliderY-44, sliderX + sliderX * 0.97,sliderY-40)
p.pop()
p.pop()*/


//paragrafi





let baseX = p.width * 0.10;
let baseY = p.height * 0.2;
let boxW  = 350;

for (let pg of paragraphs) {

  // TITOLO
  if (pg.titleAlpha > 1) {
    p.push();
    p.noStroke();
    p.fill(49, 49, 49, pg.titleAlpha);
    p.textFont("benton-modern-display");
    p.textSize(22);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);

    p.text(
      pg.title,
      baseX,
      (baseY + pg.titleOffset) - 30 ,
      boxW
    );
    p.pop();
  }

  // TESTO
  if (pg.alpha > 1) {
    p.push();
    p.noStroke();
    p.fill(49, 49, 49, pg.alpha);
    p.textFont("montserrat");
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);

    p.text(
      pg.text,
      baseX,
      baseY + 28 + pg.yOffset,
      boxW,
      190
    );

  p.push()
  p.noStroke()
  p.fill(49, 49, 49, pg.alpha);
      p.rect(baseX - 10, baseY + 28 + pg.yOffset, 1, 170)
  p.pop()
    p.pop();
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
    // Click sui pallini grandi (paesi)
    for (let s of cl.sphere) {
      let d = p.dist(p.mouseX, p.mouseY, s.x, s.y);
      let sliderVal = forceSlider.value() / 100;
      let tStart = p.map(s.startYear, globalMinStart, globalMaxStart, 0.05, 0.85);
      let tEnd   = p.map(s.endYear, globalMinEnd,   globalMaxEnd,   0.15, 0.95);

      if (sliderVal < tStart || sliderVal > tEnd) continue;
      let distToClusterCenter = p.dist(cl.x, cl.y, s.x, s.y);
      if (distToClusterCenter > cl.r) continue;

      if (d < s.r) {
        // SALVA la posizione dello slider prima di andare alla pagina
        localStorage.setItem('timelinePosition', forceSlider.value());
        let pageUrl = "inghilterra.html?colonizer=" + cl.name + "&country=" + encodeURIComponent(s.country);
        window.location.href = pageUrl;
        return;
      }
    }

    // Click sul pallini centrale (colonizzatore)
    let dCenter = p.dist(p.mouseX, p.mouseY, cl.x, cl.y);
    if (dCenter < 10) {
      // SALVA la posizione dello slider
      localStorage.setItem('timelinePosition', forceSlider.value());
      let pageUrl = "inghilterra.html?colonizer=" + cl.name;
      window.location.href = pageUrl;
      return;
    }

    // Click sul nome colonizzatore
    if (cl.nameAlpha > 2) {
      let textX = cl.x;
      let textY = cl.y - 25;
      let textWidth = p.textWidth(cl.name.toUpperCase());
      let textHeight = 12;
      let padding = 10;

      if (p.mouseX > textX - textWidth / 2 - padding &&
          p.mouseX < textX + textWidth / 2 + padding &&
          p.mouseY > textY - textHeight / 2 - padding &&
          p.mouseY < textY + textHeight / 2 + padding) {
        // SALVA la posizione dello slider
        localStorage.setItem('timelinePosition', forceSlider.value());
        let pageUrl = "inghilterra.html?colonizer=" + cl.name;
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
      this.alpha = 255;
      this.nameAlpha = 255;

      let maxDur = Math.max(...data.map(d=>d.duration));
      for(let rec of data){
        let angle = p.random(0,p.TWO_PI);
        let x = outerCluster.x + p.cos(angle)*outerCluster.r;
        let y = outerCluster.y + p.sin(angle)*outerCluster.r;
        let br = p.map(rec.duration,0,maxDur,5,36); //grandezza delle sfere compresa tra 5 e 36
        
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
        let overlap = (minDist - distAB) * 0.02; 
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

      p.push();
      p.stroke(this.colr);
      p.strokeWeight(2);
      p.fill("#E7E1D1");
      p.circle(this.x, this.y, 10);
   p.pop();

      // Aggiorna alpha del nome in base allo slider
      if (forceSlider.value() === 0) {
        this.nameAlpha = p.lerp(this.nameAlpha, 255, 0.1);
      } else {
        this.nameAlpha = p.lerp(this.nameAlpha, 0, 0.08);
      }

      // Mostra nome colonizzatore con transizione smooth
      if (this.nameAlpha > 2) {
        p.push();
        let textColor = p.color("#313131");
        textColor.setAlpha(this.nameAlpha);
        p.fill(textColor);
        p.noStroke();
        p.textFont("montserrat");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.name.toUpperCase(), this.x, this.y - 25);
        p.pop();
      }

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
  

   
    }
  
  }
}




