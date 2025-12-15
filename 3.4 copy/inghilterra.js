// =========================================================
// VARIABILI GLOBALI E CONFIGURAZIONE INIZIALE
// =========================================================

// Tabelle dei dati CSV
let table, table3;
let tableDescriptions;
let colonies = [];
let colDuration = [], colEndYear = [], colStartYear = [], colCountries = [];

// Range temporale della timeline
let minYear = 1450, maxYear = 2000;

// Scroll verticale e altezza dell'area visibile del grafico
let yOffset = 0;
let scrollHeight;

// Stati di selezione delle colonie
let clickedCountry = null;
let selectedCountry = null;

// Gestione effetto "fade"
let fadeOpacity = {};   
let fadeSpeed = 0.12;

// Posizioni e dimensioni della timeline
let timelinePositions = [];
let chartX = 680;
let chartWidth = 0;

// Informazioni sul colonizzatore
let colonizer = null;
let colonizerTitle = "";
let colonizerDescriptions = {
  "britain":"United Kingdom","france":"France","spain":"Spain","portugal":"Portugal",
  "germany":"Germany","belgium":"Belgium","netherlands":"Netherlands","italy":"Italy"
};

// Colori associati a ciascun colonizzatore
let colonizerColors = {
  "britain":[139,0,0],"france":[77,72,113],"spain":[196, 154, 0],"portugal":[153,171,89],
  "germany":[135,153,189],"belgium":[202,93,132],"netherlands":[217,121,99],"italy":[126,193,175]
};

// Colore corrente
let currentColor = [0, 0, 0];
let currentParagraph = "";
let currentSourceLinkText = "";
let currentSourceLinkURL = "";
let sourceLinkElement;

// Buffer grafico
let coloniesLayer;
let chartY = 120;

// =========================================================
// NUOVE VARIABILI PER ZOOM
// =========================================================
let isCompactView = true;
let currentRowHeight = 8;
let targetRowHeight = 8;
let animationProgress = 1;
let isAnimating = false;
let toggleSlider;

// =========================================================
// FUNZIONE HELPER: SPLIT PARAGRAPH AND SOURCE
// =========================================================
function splitParagraphAndSource(fullText) {
  let sourceIndex = fullText.indexOf("Source:");
  
  if (sourceIndex !== -1) {
    let paragraph = fullText.substring(0, sourceIndex).trim();
    let sourceText = fullText.substring(sourceIndex).trim();
    sourceText = sourceText.replace(/\n/g, ' '); 
    let url = "https://www.google.com/search?q=" + encodeURIComponent(sourceText);
    return { paragraph, sourceText, url };
  }
  return { paragraph: fullText, sourceText: "", url: "" };
}

// =========================================================
// EASING FUNCTION
// =========================================================
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// =========================================================
// PRELOAD
// =========================================================
function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
  table3 = loadTable("assets/COLDAT_dyads - Foglio3.csv", "csv", "header");
  tableDescriptions = loadTable("assets/paragrafi-dettaglio.csv", "csv", "header");
}

// =========================================================
// SETUP
// =========================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Leggi i parametri URL
  let urlParams = new URLSearchParams(window.location.search);
  colonizer = urlParams.get("colonizer");
  selectedCountry = urlParams.get("country");

  // Imposta il colore
  if(colonizer && colonizerColors[colonizer]) {
    currentColor = colonizerColors[colonizer];
  } else {
    currentColor = colonizerColors["britain"];
  }

  if(!colonizer){
    console.error("Nessun colonizzatore specificato!");
    return;
  }

  // Lettura localStorage per modalità zoom
  let savedView = localStorage.getItem('viewMode');
  if(selectedCountry) {
    // Se c'è selezione da URL, parte in zoom-out
    isCompactView = false;
  } else if(savedView) {
    isCompactView = (savedView === 'compact');
  }
  currentRowHeight = isCompactView ? 8 : 25;
  targetRowHeight = currentRowHeight;
  
  // Estrazione paragrafo e source
  if (tableDescriptions) {
    let descRow = tableDescriptions.findRows(colonizer, "colonizer");
    if (descRow.length > 0) {
      let fullText = descRow[0].get("paragraph");
      let parts = splitParagraphAndSource(fullText);
      
      currentParagraph = parts.paragraph;
      currentSourceLinkText = parts.sourceText;
      currentSourceLinkURL = parts.url;
    } else {
      currentParagraph = "Descrizione non trovata per questo colonizzatore.";
      currentSourceLinkText = "";
    }
  }
  
  // Creazione link HTML
  if (currentSourceLinkText) {
    sourceLinkElement = createA(currentSourceLinkURL, currentSourceLinkText, '_blank');
    sourceLinkElement.style('font-size', '14px');
    sourceLinkElement.style('font-family', 'Montserrat, sans-serif');
    sourceLinkElement.style('color', `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`);
    sourceLinkElement.style('position', 'absolute');
    sourceLinkElement.style('text-decoration', 'none');
    sourceLinkElement.hide();
  }

  // Creazione toggle slider
  createToggleSlider();

  // Filtra dataset
  let selected = table.findRows(colonizer,"colonizer");
  colonizerTitle = colonizerDescriptions[colonizer] || colonizer;

  // Estrae dati
  for(let i=0; i<selected.length; i++){
    let row = selected[i];
    colonies.push(row);
    colDuration.push(parseFloat(row.get("Duration")));
    colEndYear.push(parseFloat(row.get("colend_max")));
    colStartYear.push(parseFloat(row.get("colstart_max")));
    let country = row.get("country");
    colCountries.push(country);
    fadeOpacity[country] = 255;
  }

  // Ordina per anno di inizio
  let sortable = [];
  for(let i=0; i<colonies.length; i++){
    sortable.push({
      colony: colonies[i],
      start: colStartYear[i],
      end: colEndYear[i],
      country: colCountries[i],
      duration: colDuration[i]
    });
  }
  sortable.sort((a,b) => a.start - b.start);

  // Ricostruisce array ordinati
  colonies = []; 
  colStartYear = []; 
  colEndYear = []; 
  colCountries = []; 
  colDuration = [];
  
  for(let item of sortable){
    colonies.push(item.colony);
    colStartYear.push(item.start);
    colEndYear.push(item.end);
    colCountries.push(item.country);
    colDuration.push(item.duration);
  }

  // Crea buffer grafico
  coloniesLayer = createGraphics(windowWidth, colonies.length * 30 + 200);
  scrollHeight = windowHeight * 0.77;
}

// =========================================================
// TOGGLE SLIDER CREATION
// =========================================================
function createToggleSlider() {
  toggleSlider = createDiv('');
  toggleSlider.style('position', 'absolute');
  toggleSlider.style('width', '200px');
  toggleSlider.style('height', '40px');
  toggleSlider.style('border-radius', '5px');
  toggleSlider.style('background-color', '#e0e0e0');
  toggleSlider.style('cursor', 'pointer');
  toggleSlider.style('display', 'flex');
  toggleSlider.style('align-items', 'center');
  toggleSlider.style('padding', '0');
  toggleSlider.style('overflow', 'hidden');
  toggleSlider.style('font-family', 'Montserrat, sans-serif');
  toggleSlider.style('font-size', '11px');
  toggleSlider.style('font-weight', 'bold');
  toggleSlider.style('user-select', 'none');
  toggleSlider.style('z-index', '1000');
  
  // Slider interno colorato
  let slider = createDiv('');
  slider.id('slider-inner');
  slider.style('position', 'absolute');
  slider.style('width', '100px');
  slider.style('height', '40px');
  slider.style('border-radius', '5px');
  slider.style('background-color', `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`);
  slider.style('transition', 'left 1s cubic-bezier(0.65, 0, 0.35, 1)');
  slider.style('left', isCompactView ? '0px' : '100px');
  slider.parent(toggleSlider);

  // Label sinistra (ZOOM-IN)
  let labelLeft = createDiv('ZOOM-IN');
  labelLeft.id('label-left');
  labelLeft.style('position', 'absolute');
  labelLeft.style('left', '0');
  labelLeft.style('width', '100px');
  labelLeft.style('text-align', 'center');
  labelLeft.style('line-height', '40px');
  labelLeft.style('color', isCompactView ? 'white' : '#666');
  labelLeft.style('transition', 'color 0.3s');
  labelLeft.style('z-index', '2');
  labelLeft.style('pointer-events', 'none');
  labelLeft.parent(toggleSlider);

  // Label destra (ZOOM-OUT)
  let labelRight = createDiv('ZOOM-OUT');
  labelRight.id('label-right');
  labelRight.style('position', 'absolute');
  labelRight.style('right', '0');
  labelRight.style('width', '100px');
  labelRight.style('text-align', 'center');
  labelRight.style('line-height', '40px');
  labelRight.style('color', isCompactView ? '#666' : 'white');
  labelRight.style('transition', 'color 0.3s');
  labelRight.style('z-index', '2');
  labelRight.style('pointer-events', 'none');
  labelRight.parent(toggleSlider);

  // Click handler
  toggleSlider.mousePressed(() => {
    isCompactView = !isCompactView;
    targetRowHeight = isCompactView ? 8 : 25;
    isAnimating = true;
    animationProgress = 0;
    
    // Salva preferenza
    localStorage.setItem('viewMode', isCompactView ? 'compact' : 'expanded');
    
    // Aggiorna UI del toggle
    select('#slider-inner').style('left', isCompactView ? '0px' : '100px');
    select('#label-left').style('color', isCompactView ? 'white' : '#666');
    select('#label-right').style('color', isCompactView ? '#666' : 'white');
  });
}

// =========================================================
// DRAW
// =========================================================
function draw() {
  clear();

  // Animazione smooth del row height
  if(isAnimating) {
    animationProgress += 0.016; // ~1 secondo a 60fps
    if(animationProgress >= 1) {
      animationProgress = 1;
      isAnimating = false;
      currentRowHeight = targetRowHeight;
    } else {
      let startHeight = isCompactView ? 25 : 8;
      let endHeight = isCompactView ? 8 : 25;
      currentRowHeight = lerp(startHeight, endHeight, easeInOutCubic(animationProgress));
    }
    
    // Ridimensiona il buffer durante l'animazione
    let newHeight = colonies.length * currentRowHeight + 200;
    coloniesLayer.resizeCanvas(windowWidth, newHeight);
  }

  drawTimeline();
  drawSideInfo();
  drawColoniesLayer();
  drawColonyInfo();
}

// =========================================================
// TIMELINE
// =========================================================
function drawTimeline(){
  push();
  chartWidth = windowWidth - 750;

  stroke(100, 150);
  strokeWeight(0.5);
  line(chartX, chartY + scrollHeight, chartX + chartWidth, chartY + scrollHeight);

  textAlign(CENTER);
  textSize(12);
  fill(100);
  noStroke();
  textFont("Montserrat", 12);
  
  for(let year = minYear; year <= maxYear; year += 50){
    let x = map(year, minYear, maxYear, chartX, chartX + chartWidth);
    text(year, x, chartY + scrollHeight + 20);
    stroke(200);
    strokeWeight(0.5);
    line(x, chartY, x, chartY + scrollHeight);
  }
  pop();
}

// =========================================================
// COLONIES LAYER
// =========================================================
function drawColoniesLayer(){
  coloniesLayer.clear();
  timelinePositions = [];

  coloniesLayer.textFont("Montserrat", 11);

  for(let i = 0; i < colonies.length; i++){
    let start = colStartYear[i],
        end = colEndYear[i],
        country = colCountries[i];

    let yPos = (i * currentRowHeight) + 12 + yOffset;
    let xStart = map(start, minYear, maxYear, chartX, chartX + chartWidth);
    let xEnd = map(end, minYear, maxYear, chartX, chartX + chartWidth);

    timelinePositions.push({ 
      index: i, 
      xStart, 
      xEnd, 
      yPos, 
      country, 
      start, 
      end 
    });

    // Skip se fuori viewport
    if(yPos + 10 < 0 || yPos - 10 > scrollHeight) continue;

    let isClicked = (country === clickedCountry);
    let isSelected = (country === selectedCountry);
    let someoneSelected = clickedCountry || selectedCountry;
    
    let targetOpacity = someoneSelected ? (isClicked || isSelected ? 255 : 40) : 255;
    fadeOpacity[country] = lerp(fadeOpacity[country], targetOpacity, fadeSpeed);
    let op = fadeOpacity[country];

    // Spessore dinamico
    let normalStroke = isCompactView ? 2.5 : 1.2;
    let selectedStroke = isCompactView ? 5 : 6;

    // Barra selezionata
    if(isClicked || isSelected){
      coloniesLayer.stroke(currentColor[0], currentColor[1], currentColor[2], op);
      coloniesLayer.strokeWeight(selectedStroke);
      coloniesLayer.line(xStart, yPos, xEnd, yPos);
      coloniesLayer.noStroke();

      // Pallini solo in vista espansa
      if(!isCompactView) {
        coloniesLayer.fill(currentColor[0], currentColor[1], currentColor[2], op);
        coloniesLayer.circle(xStart, yPos, 12);
        coloniesLayer.circle(xEnd, yPos, 12);
      }

      // Anni sempre visibili
      coloniesLayer.textSize(15);
      coloniesLayer.textStyle(BOLD);
      coloniesLayer.fill(currentColor);
      coloniesLayer.textAlign(RIGHT, CENTER);
      coloniesLayer.text(int(start), xStart - 10, yPos);
      coloniesLayer.textAlign(LEFT, CENTER);
      coloniesLayer.text(int(end), xEnd + 10, yPos);

    } else {
      // Barre non selezionate
      coloniesLayer.stroke(currentColor[0], currentColor[1], currentColor[2], op * 0.7);
      coloniesLayer.strokeWeight(normalStroke);
      coloniesLayer.line(xStart, yPos, xEnd, yPos);
      
      // Pallini solo in vista espansa
      if(!isCompactView) {
        coloniesLayer.fill(255, op);
        coloniesLayer.circle(xStart, yPos, 8);
        coloniesLayer.circle(xEnd, yPos, 8);
      }
    }

    // Nome paese: solo se espanso O se selezionato in compact
    if(!isCompactView || (isCompactView && (isClicked || isSelected))) {
      coloniesLayer.noStroke(); 
      coloniesLayer.textAlign(RIGHT, CENTER);
      
      if(country === clickedCountry || country === selectedCountry){
        coloniesLayer.textSize(14);
        coloniesLayer.fill(currentColor[0], currentColor[1], currentColor[2], op);
        coloniesLayer.textStyle(BOLD);
      } else {
        coloniesLayer.textSize(11);
        coloniesLayer.fill(80, 80, 80, op);
        coloniesLayer.textStyle(NORMAL);
      }
      
      coloniesLayer.text(country.toUpperCase(), chartX - 15, yPos); 
    }
  }

  image(coloniesLayer, 0, chartY);
}

// =========================================================
// SIDE INFO
// =========================================================
function drawSideInfo(){
  push();
  let sideX = windowWidth * 0.06;
  
  // Calcola la posizione del bottone toggle
  let toggleY = chartY + scrollHeight - 20;
  
  // Il testo deve essere totpx sopra il bottone
  let topY = toggleY - 190;
  
  let columnWidth = 350;
  let estimatedLineHeight = 22;

  // Titolo colonizzatore
  fill(currentColor);
  textFont("Montserrat");
  textSize(32);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(colonizerTitle, sideX, topY - 70);

  // Paragrafo
  let descY = topY - 15;
  fill(60);
  textFont("Montserrat");
  textSize(16);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  
  let paragraphText = currentParagraph;
  let totalTextWidth = textWidth(paragraphText);
  let requiredLines = Math.ceil(totalTextWidth / columnWidth);
  let totalTextHeight = requiredLines * estimatedLineHeight;
  let linkOffset = currentSourceLinkText ? 30 : 0;
  let lineLength = totalTextHeight + linkOffset + 2;

  // Linea verticale
  stroke(currentColor);
  strokeWeight(3);
  line(sideX - 15, descY, sideX - 15, descY + lineLength - 10);
  noStroke();
  
  text(paragraphText, sideX, descY, columnWidth);
  
  // Posiziona link
  if (sourceLinkElement) {
    sourceLinkElement.show();
    sourceLinkElement.position(sideX, descY + totalTextHeight + 5);
  }

  // Posiziona toggle slider alla base del grafico
  if(toggleSlider) {
    toggleSlider.position(sideX, toggleY);
  }
  
  pop();
}

// =========================================================
// COLONY INFO
// =========================================================
function drawColonyInfo(){
  if(!clickedCountry && !selectedCountry) return;
  
  let currentCountry = clickedCountry || selectedCountry;
  let index = colCountries.indexOf(currentCountry);
  if(index === -1) return;

  let start = colStartYear[index],
      end = colEndYear[index],
      duration = colDuration[index];

  let infoX = 80, infoY = windowHeight * 0.1;
  
  push();
  fill(currentColor);
  textFont("Montserrat");
  textSize(26);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(currentCountry, infoX, infoY);

  fill(40);
  textFont("Montserrat");
  textSize(16);
  textStyle(NORMAL);
  let lineSpacing = 25, startY = infoY + 50;
  text(`• Beginning of colonization: ${int(start)}`, infoX, startY);
  text(`• End of colonization: ${int(end)}`, infoX, startY + lineSpacing);
  text(`• Colonization duration: ${nf(duration, 0, 1)} years`, infoX, startY + lineSpacing * 2);

  // Pulsante Wikipedia
  noStroke();
  let buttonY = startY + lineSpacing * 3.5;
  
  // Cambia colore se il mouse è sopra
  if(mouseX >= infoX && mouseX <= infoX + 250 && 
     mouseY >= buttonY && mouseY <= buttonY + 30) {
    fill(currentColor[0] * 0.8, currentColor[1] * 0.8, currentColor[2] * 0.8);
    cursor(HAND);
  } else {
    fill(currentColor);
    cursor(ARROW);
  }
  
  rect(infoX, buttonY, 250, 30, 5);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("MORE INFORMATION ON WIKIPEDIA", infoX + 125, buttonY + 15);
  
  pop();
}

// =========================================================
// MOUSE PRESSED
// =========================================================
function mousePressed(){
  let mx = mouseX;
  let my = mouseY;
  let clickedSomething = false;

  // Check se ho cliccato sul bottone Wikipedia
  if(clickedCountry || selectedCountry) {
    let currentCountry = clickedCountry || selectedCountry;
    let index = colCountries.indexOf(currentCountry);
    
    if(index !== -1) {
      let infoX = 80, infoY = windowHeight * 0.1;
      let lineSpacing = 25, startY = infoY + 50;
      let buttonY = startY + lineSpacing * 3.5;
      
      // Click sul bottone Wikipedia
      if(mx >= infoX && mx <= infoX + 250 && 
         my >= buttonY && my <= buttonY + 30) {
        let wikiLink = colonies[index].get("wiki");
        if(wikiLink && wikiLink.trim() !== "") {
          window.open(wikiLink, '_blank');
        }
        return; // Non fare altro
      }
    }
  }

  // Check click sulle colonie nella timeline
  for(let p of timelinePositions){
    let mouseRelativeY = my - chartY - yOffset;
    let rowY = p.index * currentRowHeight + 12;

    // Click sul nome - SEMPRE cliccabile in entrambe le viste
    let nameX1 = chartX - 90, nameX2 = chartX - 10;
    let nameY1 = rowY - 10, nameY2 = rowY + 10;
    
    if(mx >= nameX1 && mx <= nameX2 && mouseRelativeY >= nameY1 && mouseRelativeY <= nameY2){
      clickedCountry = p.country;
      selectedCountry = null;
      clickedSomething = true;
      break;
    }

    // Click sulla barra
    let hitArea = isCompactView ? 5 : 10;
    if(mx >= p.xStart && mx <= p.xEnd && abs(mouseRelativeY - rowY) < hitArea){
      clickedCountry = p.country;
      selectedCountry = null;
      clickedSomething = true;
      break;
    }

    // Click sui pallini (solo in vista espansa)
    if(!isCompactView) {
      let dStart = dist(mx, mouseRelativeY, p.xStart, rowY);
      let dEnd = dist(mx, mouseRelativeY, p.xEnd, rowY);
      
      if(dStart < 10 || dEnd < 10){
        clickedCountry = p.country;
        selectedCountry = null;
        clickedSomething = true;
        break;
      }
    }
  }

  // Deseleziona se click fuori
  if(!clickedSomething){
    clickedCountry = null;
    selectedCountry = null;
  }

  // Reset opacità
  for(let c in fadeOpacity) fadeOpacity[c] = 255;
}

// =========================================================
// MOUSE WHEEL
// =========================================================
function mouseWheel(event){
  let totalHeight = colonies.length * currentRowHeight;
  
  // Disabilita scroll se tutto è visibile in compact
  if(isCompactView && totalHeight < scrollHeight) {
    return false;
  }

  yOffset -= event.delta;
  yOffset = constrain(yOffset, -colonies.length * currentRowHeight + scrollHeight, 0);
  return false;
}

// =========================================================
// WINDOW RESIZED
// =========================================================
function windowResized(){ 
  resizeCanvas(windowWidth, windowHeight);
  coloniesLayer.resizeCanvas(windowWidth, colonies.length * currentRowHeight + 200);
}