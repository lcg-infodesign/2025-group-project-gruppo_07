let table;
let table3;
let colonies = [];
let colDuration = [];
let colEndYear = [];
let colStartYear = [];
let colCountries = [];
let minYear = 1450;
let maxYear = 2000;

// Scrolling
let yOffset = 0;
let minYOffset = 0;
let maxYOffset = 0;
let contentMouseX = 0;
let contentMouseY = 0;
let contentHeight = 0;

//scrolling automatico 
let autoScrollDone = false;

// Click
let clickedCountry = null;

// Fade
let fadeOpacity = {};     // country → opacità corrente
let fadeSpeed = 0.12;     // più alto = fade più veloce

// Posizioni timeline
let timelinePositions = [];
let chartX = 200;
let chartWidth = 0;
let selectedCountry = null;

// Colonizzatore e titolo
let colonizer = null;
let colonizerTitle = "";
let colonizerDescriptions = {
  "britain": "United Kingdom",
  "france": "France",
  "spain": "Spain",
  "portugal": "Portugal",
  "germany": "Germany",
  "belgium": "Belgium",
  "netherlands": "Nertherland",
  "italy": "Italy"
};

// Mappa Colori RGB per i Colonizzatori
let colonizerColors = {
  "britain": [139, 0, 0],   
  "france": [77, 72, 113],  
  "spain": [227, 188, 71],   
  "portugal": [153, 171, 89], 
  "germany": [135, 153, 189], 
  "belgium": [202, 93, 132],  
  "netherlands": [217, 121, 99], 
  "italy": [126, 193, 175]    
};

let currentColor = [0, 0, 0]; // Variabile per il colore RGB corrente


function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
  table3 = loadTable("assets/COLDAT_dyads - Foglio3.csv", "csv", "header");
}


function setup() {
  createCanvas(windowWidth, windowHeight);

  // Leggi i parametri URL
  let urlParams = new URLSearchParams(window.location.search);
  colonizer = urlParams.get("colonizer");
  selectedCountry = urlParams.get("country"); 

  // --- IMPOSTAZIONE DEL COLORE DINAMICO ---
  if (colonizer && colonizerColors[colonizer]) {
    currentColor = colonizerColors[colonizer];
  } else {
    currentColor = colonizerColors["britain"]; 
  }


  if (!colonizer) {
    console.error("Nessun colonizzatore specificato!");
    return;
  }

  // Seleziona righe per il colonizzatore specificato
  let selected = table.findRows(colonizer, "colonizer");
  colonizerTitle = colonizerDescriptions[colonizer] || colonizer;

  for (let i = 0; i < selected.length; i++) {
    let row = selected[i];

    colonies.push(row);
    colDuration.push(parseFloat(row.get("Duration")));
    colEndYear.push(parseFloat(row.get("colend_max")));
    colStartYear.push(parseFloat(row.get("colstart_max")));
    
    let country = row.get("country");
    colCountries.push(country);
    fadeOpacity[country] = 255;
  }

  // inizializza scrolling bounds
  minYOffset = min(0, height - 3000);
  maxYOffset = 0;

  // Costruisci array ordinabile e ordina (dal più antico al più recente)
  let sortable = [];
  for (let i = 0; i < colonies.length; i++) {
    sortable.push({
      colony: colonies[i],
      start: colStartYear[i],
      end: colEndYear[i],
      country: colCountries[i],
      duration: colDuration[i]
    });
  }

  sortable.sort((a, b) => a.start - b.start);

  colonies = [];
  colStartYear = [];
  colEndYear = [];
  colCountries = [];
  colDuration = [];

  for (let item of sortable) {
    colonies.push(item.colony);
    colStartYear.push(item.start);
    colEndYear.push(item.end);
    colCountries.push(item.country);
    colDuration.push(item.duration);
  }
}


function drawTimeline() {
  push();

  chartX = 680;
  let chartY = 180;
  chartWidth = windowWidth - 750; 
  let chartHeight = colonies.length * 25;

  let minYear = 1450;
  let maxYear = 2000;

  textAlign(LEFT);
  
  
  // Strisce colorate per periodi storici (Colore dinamico con opacità)
  noStroke();
  let x1900 = map(1900, minYear, maxYear, chartX, chartX + chartWidth);
  let x1950 = map(1950, minYear, maxYear, chartX, chartX + chartWidth);
  fill(currentColor[0], currentColor[1], currentColor[2], 30);
  rect(x1900, chartY, x1950 - x1900, chartHeight);

  // Assi
  stroke(100, 150);
  strokeWeight(0.5); 
  line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  // Anni e linee verticali
  textAlign(CENTER);
  textSize(12);
  fill(100);
  noStroke();
  let yearStep = 50;

  for (let year = minYear; year <= maxYear; year += yearStep) {
    let x = map(year, minYear, maxYear, chartX, chartX + chartWidth);
    text(year, x, chartY + chartHeight + 25);
    stroke(200);
    strokeWeight(0.5);
    line(x, chartY, x, chartY + chartHeight);
  }

  noStroke();
  timelinePositions = [];
  let dotSize = 8; 
  let rowHeight = 25;

  hoveredIndex = -1;


  // Disegna righe per ogni colonia
  for (let i = 0; i < colonies.length; i++) {
    let start = colStartYear[i];
    let end = colEndYear[i];
    let country = colCountries[i];

    let yPos = chartY + (i * rowHeight) + 12;

    let xStart = map(start, minYear, maxYear, chartX, chartX + chartWidth);
    let xEnd = map(end, minYear, maxYear, chartX, chartX + chartWidth);

    timelinePositions.push({ index: i, xStart, xEnd, yPos, chartX, chartY, country });

    let mouseDist = abs(contentMouseY - yPos);
    let isClicked = (country === clickedCountry);
    let isSelected = (country === selectedCountry); 
    let someoneSelected = clickedCountry || selectedCountry;
    
    let targetOpacity =
      someoneSelected
        ? (isClicked || isSelected ? 255 : 100)
        : 255;

    // LERP FADE
    fadeOpacity[country] = lerp(fadeOpacity[country], targetOpacity, fadeSpeed);
    let op = fadeOpacity[country];

    // Disegno
    if (isClicked || isSelected) {

      hoveredIndex = i;

      // BARRA SELEZIONATA (Colore dinamico) 
      stroke(currentColor[0], currentColor[1], currentColor[2], op); 
      strokeWeight(6); 
      line(xStart, yPos, xEnd, yPos);
      strokeWeight(2); 

      // Pallino Inizio (Pieno - Colore dinamico)
      noStroke();
      fill(currentColor[0], currentColor[1], currentColor[2], op); 
      circle(xStart, yPos, dotSize + 4);

      // Pallino Fine (Pieno - Colore dinamico)
      fill(currentColor[0], currentColor[1], currentColor[2], op); 
      circle(xEnd, yPos, dotSize + 4);

      // Etichetta Anni
      let label = `${int(start)} - ${int(end)}`;
      textSize(15); 
      textStyle(BOLD);
      
      let isLightColor = (currentColor[0] + currentColor[1] + currentColor[2]) / 3 > 180;

      // Logica Contorno per Leggibilità (Utile per colori chiari come il Giallo)
      if (isLightColor) {
        stroke(40, op); 
        strokeWeight(1); 
      } else {
        noStroke();
      }

      // Etichetta Inizio (Testo colorato)
      
      fill(currentColor[0], currentColor[1], currentColor[2], op); 
      textAlign(RIGHT, CENTER);
      text(int(start), xStart - 10, yPos);

      // Etichetta Fine (Testo colorato)
      fill(currentColor[0], currentColor[1], currentColor[2], op); 
      textAlign(LEFT, CENTER);
      text(int(end), xEnd + 10, yPos);

      noStroke(); // Reset dello stroke
    
    } else {
      // BARRA NORMALE (Colore dinamico più scuro/opaco)
      
      // La linea della barra non selezionata
      stroke(currentColor[0], currentColor[1], currentColor[2], op * 0.7); 
      strokeWeight(1.2); 
      line(xStart, yPos, xEnd, yPos);

      // Pallino Inizio (Vuoto - Bordo dinamico)
      stroke(currentColor[0], currentColor[1], currentColor[2], op * 0.7); 
      strokeWeight(1);
      fill(255, 255, 255, op); 
      circle(xStart, yPos, dotSize);

      // Pallino Fine (Vuoto - Bordo dinamico)
      stroke(currentColor[0], currentColor[1], currentColor[2], op * 0.7); 
      strokeWeight(1);
      fill(255, 255, 255, op); 
      circle(xEnd, yPos, dotSize);
    
    }

    // Nome della colonia a sinistra
    push()
    if (country === clickedCountry || country === selectedCountry) {
      fill(currentColor[0], currentColor[1], currentColor[2]);  // Colore dinamico
    } else {
      fill(40, op);            
    }

    textAlign(RIGHT, CENTER);
    textSize(11);
    text(country, chartX - 15, yPos);
    }

  contentHeight = chartY + chartHeight + 300;

  pop();
}


// Didascalia Colonia Selezionata

function drawColonyInfo() {
  if (clickedCountry || selectedCountry) {
    
    let currentCountryName = clickedCountry || selectedCountry;
    let index = colCountries.indexOf(currentCountryName);

    if (index === -1) return;

    let start = colStartYear[index];
    let end = colEndYear[index];
    let duration = colDuration[index]; 

    // Variabili di riferimento usate in drawSideInfo()
    let sideX = chartX + chartWidth + 50; 
    let sideY = 180;

    // Posizionamento sotto la descrizione generale (stimato a circa y + 350)
    let infoX = 80; 
    let infoY = 150; // Inizia sotto il testo descrittivo

    push();
    
  
    // Titolo colonia
fill(currentColor[0], currentColor[1], currentColor[2]);
textFont("Montserrat");
textSize(26);
textStyle(BOLD);
textAlign(LEFT, TOP);
text(currentCountryName, infoX, infoY);

    textFont("Montserrat");
text(currentCountryName, infoX, infoY);
textFont("sans-serif");

    // Dettagli (Lista Punti)
    fill(40);
    textSize(16);
    textStyle(NORMAL);
    let lineSpacing = 25;
    let startY = infoY + 50;
    
    // Lista di Dettagli
    textFont("Montserrat");
text(`• Inizio colonizzazione: ${int(start)}`, infoX, startY);
text(`• Fine colonizzazione: ${int(end)}`, infoX, startY + lineSpacing);
text(`• Durata colonizzazione: ${nf(duration, 0, 1)} anni`, infoX, startY + lineSpacing * 2);
textFont("sans-serif");

    
    // Pulsante Fittizio 
    noStroke();
    fill(currentColor[0], currentColor[1], currentColor[2]); 
    rect(infoX, startY + lineSpacing * 3.5, 200, 30, 5);
    
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    text("PER ULTERIORI INFORMAZIONI", infoX + 100, startY + lineSpacing * 3.5 + 15);

    pop();
  }
}


function mousePressed() {
  let mx = mouseX;
  let my = mouseY - yOffset;

  for (let p of timelinePositions) {
    // CLICK SUL NOME
    let nameX1 = chartX - 90;
    let nameX2 = chartX - 10;
    let nameY1 = p.yPos - 10;
    let nameY2 = p.yPos + 10;

    if (mx >= nameX1 && mx <= nameX2 && my >= nameY1 && my <= nameY2) {
      selectedCountry = null;  
      clickedCountry = p.country;
      return;
    }

    // CLICK SULLA BARRA
    if (mx >= p.xStart && mx <= p.xEnd && abs(my - p.yPos) < 10) {
      selectedCountry = null;
      clickedCountry = p.country;
      return;
    }

    // CLICK SULLE PALLINE
    let dStart = dist(mx, my, p.xStart, p.yPos);
    let dEnd   = dist(mx, my, p.xEnd, p.yPos);

    if (dStart < 10 || dEnd < 10) {
      selectedCountry = null;
      clickedCountry = p.country;
      return;
    }
  }

  // Deseleziona se clicchi fuori
  clickedCountry = null;
  selectedCountry = null;

  for (let c in fadeOpacity) {
    fadeOpacity[c] = 255;
  }
}


function drawSideInfo() {
  push();
  

  // COLONNA SINISTRA
  let sideX = windowWidth*0.06;       // distanza dal bordo sinistro
  let topY = windowHeight*0.73;       // margine alto
  let columnWidth = 350;

  
  // 1. TITOLO COLONIZZATORE
  
  fill(currentColor[0], currentColor[1], currentColor[2]);
  textFont("Montserrat");
  textSize(32);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(colonizerTitle, sideX, topY);

  
  // 2. TESTO DESCRITTIVO IMPERO
  
  let descY = topY + 60;

  // Linea verticale
  stroke(currentColor[0], currentColor[1], currentColor[2]);
  strokeWeight(3);
  line(sideX - 15, descY, sideX - 15, descY + 100);
  noStroke();

  // Testo
  fill(60);
  textSize(16);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);

  let desc =
    "Qui puoi vedere il periodo di dominazione coloniale esercitato da questo impero. " +
    "Ogni barra rappresenta una colonia, con le date di inizio e fine del controllo, " +
    "e una visualizzazione chiara del rapporto storico tra impero e territorio.";

  text(desc, sideX, descY, columnWidth);

  pop();
}



function draw() {
  clear();

  if (!autoScrollDone && timelinePositions.length > 0 && selectedCountry) {
    let row = timelinePositions.find(p => p.country === selectedCountry);

    if (row) {
      let targetY = -(row.yPos - height / 2);
      yOffset = constrain(targetY, minYOffset, maxYOffset);
      autoScrollDone = true;
    }
  }

  contentMouseX = mouseX;
  contentMouseY = mouseY - yOffset;

  push();
  translate(0, yOffset);

  drawTimeline();
  drawSideInfo();
  drawColonyInfo(); 

  pop();

  minYOffset = min(0, height - contentHeight);
}


function mouseWheel(event) {
  yOffset -= event.delta;
  yOffset = constrain(yOffset, minYOffset, maxYOffset);
  return false;
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}