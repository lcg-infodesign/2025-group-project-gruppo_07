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
  "britain": "Inghilterra",
  "france": "Francia",
  "spain": "Spagna",
  "portugal": "Portogallo",
  "germany": "Germania",
  "belgium": "Belgio",
  "netherlands": "Paesi Bassi",
  "italy": "Italia"
};


function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
  table3 = loadTable("assets/COLDAT_dyads - Foglio3.csv", "csv", "header");
}


function setup() {
  createCanvas(windowWidth, windowHeight);

  // Leggi i parametri URL
  let urlParams = new URLSearchParams(window.location.search);
  colonizer = urlParams.get("colonizer");
  selectedCountry = urlParams.get("country");  // Sarà null se vieni dalla navbar

  console.log("Colonizer:", colonizer);
  console.log("Selected Country:", selectedCountry);

  // Se non hai colonizer, mostra messaggio di errore o torna a home
  if (!colonizer) {
    console.error("Nessun colonizzatore specificato!");
    // Opzionale: reindirizzare a home
    // window.location.href = "index.html";
    return;
  }

  // Seleziona righe per il colonizzatore specificato
  let selected = table.findRows(colonizer, "colonizer");
  colonizerTitle = colonizerDescriptions[colonizer] || colonizer;

  console.log("Found rows:", selected.length);

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

  // Costruisci array ordinabile
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

// Ordina dal più recente (start grande) → al più antico (start piccolo)
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

  chartX = 200;
  let chartY = 180;
  chartWidth = width - 750;
  let chartHeight = colonies.length * 25;

  let minYear = 1450;
  let maxYear = 2000;

  // Background box
  textAlign(LEFT);
  noStroke();
  fill(200, 200, 200, 100);
  rect(chartX - 150, chartY - 10, chartWidth + 170, chartHeight + 60, 12);

  // Strisce colorate per periodi storici
  noStroke();
  let x1900 = map(1900, minYear, maxYear, chartX, chartX + chartWidth);
  let x1950 = map(1950, minYear, maxYear, chartX, chartX + chartWidth);
  fill(139, 0, 0, 30);
  rect(x1900, chartY, x1950 - x1900, chartHeight);

  // Assi
  stroke(100);
  strokeWeight(2);
  line(chartX, chartY, chartX, chartY + chartHeight);
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
    strokeWeight(1);
    line(x, chartY, x, chartY + chartHeight);
  }

  noStroke();
  timelinePositions = [];
  let dotSize = 10;
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

    // Calcola distanza del mouse dalla linea
    let mouseDist = abs(contentMouseY - yPos);
    let isOnLine = (contentMouseX >= xStart && contentMouseX <= xEnd) && mouseDist < 10;
    let isClicked = (country === clickedCountry);
    let isSelected = (country === selectedCountry);  // viene dal link principale
    let someoneSelected = clickedCountry || selectedCountry;
    
    // Target opacities
    let targetOpacity =
      someoneSelected
        ? (isClicked || isSelected ? 255 : 100)
        : 255;

    // LERP FADE
    fadeOpacity[country] = lerp(fadeOpacity[country], targetOpacity, fadeSpeed);
    let op = fadeOpacity[country];

    //disegno
    if (isClicked || isSelected) {

  hoveredIndex = i;

  // ---- BARRA ROSSA ARROTONDATA ----
  noStroke();
      fill(230, 50, 40, op);
      let barHeight = 20;
      let barY = yPos - barHeight / 2;
      let barWidth = xEnd - xStart;
      rect(xStart, barY, barWidth, barHeight, barHeight);

      let label = `${int(start)}-${int(end)}`;
      textSize(16);
      let labelW = textWidth(label) + 20;
      let labelH = 28;
      let labelX = xStart + barWidth + 10;
      let labelY = yPos - labelH / 2;

      fill(30, op);
      rect(labelX, labelY, labelW, labelH, 6);

      fill(255, op);
      textAlign(CENTER, CENTER);
      text(label, labelX + labelW / 2, labelY + labelH / 2);


} else {
  // BARRA NORMALE
      stroke(160, 82, 45, op);
      strokeWeight(4);
      line(xStart, yPos, xEnd, yPos);

      noStroke();
      fill(160, 82, 45, op);
      circle(xStart, yPos, dotSize);

      fill(192, 192, 192, op);
      circle(xEnd, yPos, dotSize);
    
}

      // Tooltip con informazioni - SOLO se il mouse è effettivamente sopra
      /*if (isOnLine) {
        push();
        let tipText = `${country}, ${int(start)}-${int(end)}`;
        textSize(12);
        textStyle(NORMAL);
        let boxWidth = textWidth(tipText) + 16;
        let boxHeight = 28;

        let boxX = contentMouseX + 12;
        let boxY = contentMouseY - 15;

        rectMode(CORNER);
        fill(50, 50, 50, 240);
        stroke(139, 0, 0);
        strokeWeight(1.5);
        rect(boxX, boxY, boxWidth, boxHeight, 4);

        textAlign(LEFT, CENTER);
        fill(255);
        text(tipText, boxX + 8, boxY + boxHeight / 2);
        pop();
      }
      noStroke();
        } else {
      stroke(160, 82, 45, 150);
      strokeWeight(4);
      line(xStart, yPos, xEnd, yPos);

      noStroke();
      fill(160, 82, 45);
      circle(xStart, yPos, dotSize);
      fill(192, 192, 192);
      circle(xEnd, yPos, dotSize);
    } */

    // Nome della colonia a sinistra
    // Nome rosso se selezionato o cliccato
    if (country === clickedCountry || country === selectedCountry) {
      fill(230, 50, 40);  // rosso
    } else {
      fill(40, op);            // colore normale
    }

    textAlign(RIGHT, CENTER);
    textSize(11);
    text(country, chartX - 15, yPos);
    }

  // Aggiorna contentHeight per lo scrolling
  contentHeight = chartY + chartHeight + 300;

  pop();
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
      selectedCountry = null;   // <-- disattiva selezione iniziale
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

  clickedCountry = null;
  selectedCountry = null;

  for (let c in fadeOpacity) {
    fadeOpacity[c] = 255;
  }
}


function drawSideInfo() {
  push();

  let sideX = chartX + chartWidth + 50;
  let sideY = 180;
  let sideWidth = 400;
  let sideHeight = 300;

  // Background
  noStroke();
  fill(200, 200, 200, 100);
  rect(sideX, sideY - 10 , sideWidth, sideHeight, 8);

  // Titolo
  fill(139, 0, 0);
  textSize(24);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(colonizerTitle, sideX + 20, sideY);

  // Testo
  fill(60);
  textSize(16);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Questo è un testo di prova per vedere come viene il layout a destra del grafico. qui un po' di dettagli su questo impero coloniale.", sideX + 20, sideY + 50, sideWidth - 40, sideHeight - 70);

  pop();
}


/*function drawTitle() {
  push();
  let titleY = 50;
  translate(0, titleY);

  fill(40);
  textSize(32);
  textAlign(CENTER);
  text("L'Impero " + colonizerTitle + ": Cronologia Coloniale", width / 2, 20);
  pop();
}*/


function draw() {
  clear();

  if (!autoScrollDone && timelinePositions.length > 0 && selectedCountry) {
    // Trova riga della colonia selezionata
    let row = timelinePositions.find(p => p.country === selectedCountry);

    if (row) {
      // Calcola offset per centrare la riga
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

  pop();

  // Aggiorna i limiti di scroll basandosi su contentHeight
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