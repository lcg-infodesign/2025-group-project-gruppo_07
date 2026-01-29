// =========================================================
// VARIABILI GLOBALI E CONFIGURAZIONE INIZIALE
// =========================================================
//layout del canvas per mettere il footer
let c;

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
let navbarHeight = 0; // Altezza dinamica della navbar
let distanzaDallaNavbar = -0.5; // Distanza dal navbar in valori relativi (0 = nessuno spazio, 1 = altezza navbar, 0.5 = metà navbar, ecc.)
let topOffset = 0; // Spazio totale dal top per posizionare gli elementi (navbarHeight + distanza)

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
// VARIABILI PER SCROLLBAR
// =========================================================
let scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight;
let scrollThumbHeight, scrollThumbY;
let isDraggingScrollbar = false;

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
  // Calcola altezza della navbar
  let headerElement = document.getElementById('header');
  navbarHeight = headerElement ? headerElement.offsetHeight : 80;
  
  // Calcola il top offset totale per tutti gli elementi
  topOffset = navbarHeight + (navbarHeight * distanzaDallaNavbar);
  
  // Applica margin-top al canvas-container usando la distanza relativa
  let canvasContainer = document.getElementById('canvas-container');
  if(canvasContainer) {
    canvasContainer.style.marginTop = topOffset + 'px';
  }
  
  // Crea canvas con altezza ridotta considerando la distanza
  let totalTopSpace = topOffset;
  c = createCanvas(windowWidth, windowHeight - totalTopSpace);
  c.parent("canvas-container");
  
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
  scrollHeight = (windowHeight - topOffset) * 0.77;
}

// =========================================================
// TOGGLE SLIDER CREATION
// =========================================================
function createToggleSlider() {
  // Minimal, single-color toggle inspired by the timeline in sketch.js
  // Use a sober dark grey as single color (timeline uses '#313131')
  let primary = '#313131';

  toggleSlider = createDiv('');
  toggleSlider.id('view-toggle');
  toggleSlider.parent('canvas-container');
  toggleSlider.style('position', 'absolute');
  toggleSlider.style('height', '30px');
  toggleSlider.style('border-radius', '0px');
  toggleSlider.style('background-color', 'transparent');
  toggleSlider.style('border', '1px solid #313131');
  toggleSlider.style('box-shadow', 'none');
  toggleSlider.style('cursor', 'pointer');
  toggleSlider.style('transition', 'none');
  toggleSlider.style('padding', '0');
  toggleSlider.style('font-family', 'Montserrat, sans-serif');
  toggleSlider.style('z-index', '1000');
  toggleSlider.style('display', 'flex');
  toggleSlider.style('align-items', 'center');
  toggleSlider.style('justify-content', 'space-between');
  toggleSlider.style('overflow', 'hidden');
  toggleSlider.style('padding', '4px');

  // Width: fixed width regardless of state
  toggleSlider.style('width', '150px');

  // Label text (centered with flexbox parent)
  let label = createDiv(isCompactView ? 'COLLAPSED' : 'EXTENDED');
  label.id('toggle-label');
  label.parent(toggleSlider);
  label.style('position', 'relative');
  label.style('z-index', '1');
  label.style('color', '#313131');
  label.style('font-weight', '600');
  label.style('letter-spacing', '0.6px');
  label.style('font-size', '11px');
  label.style('pointer-events', 'none');
  label.style('white-space', 'nowrap');
  label.style('line-height', '30px');
  label.style('text-align', 'center');
  label.style('flex', '1');

  // Knob: square with same border-radius as container, slides inside pill
  let knob = createDiv('');
  knob.id('toggle-knob');
  knob.parent(toggleSlider);
  knob.style('position', 'absolute');
  knob.style('width', '22px');
  knob.style('height', '22px');
  knob.style('border-radius', '0px');
  knob.style('background-color', '#313131');
  knob.style('border', 'solid 2px #E7E1D1');
  knob.style('box-shadow', '0 0 0 1px #313131');
  knob.style('top', '4px');
  knob.style('transition', 'left 0.28s cubic-bezier(0.22, 1, 0.36, 1)');
  knob.style('cursor', 'pointer');

  // Knob initial position: left for collapsed, right for extended
  knob.style('left', isCompactView ? '4px' : 'calc(100% - 28px)');

  // Click handler: toggle state, animate knob and width, keep timeline behavior
  toggleSlider.mousePressed(() => {
    // Trigger squeeze animation
    toggleSlider.style('animation', 'none');
    // Trigger reflow to restart animation
    void toggleSlider.elt.offsetWidth;
    toggleSlider.style('animation', 'toggleSqueeze 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)');
    
    isCompactView = !isCompactView;
    targetRowHeight = isCompactView ? 8 : 25;
    isAnimating = true;
    animationProgress = 0;
    localStorage.setItem('viewMode', isCompactView ? 'compact' : 'expanded');

    if(isCompactView){
      knob.style('left', '4px');
      select('#toggle-label').html('COLLAPSED');
      select('#toggle-label').style('font-size', '10px');
    } else {
      knob.style('left', 'calc(100% - 28px)');
      select('#toggle-label').html('EXTENDED');
      select('#toggle-label').style('font-size', '11px');
    }
  });
}

// =========================================================
// DRAW
// =========================================================
function draw() {
  clear();

  // Validazione: ricarica coloniesLayer se nullo
  if(!coloniesLayer) {
    coloniesLayer = createGraphics(windowWidth, colonies.length * currentRowHeight + 200);
  }

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
    
    // Aggiusta yOffset se ha superato i limiti durante l'animazione
    let totalHeight = colonies.length * currentRowHeight;
    yOffset = constrain(yOffset, -Math.max(totalHeight - scrollHeight, 0), 0);
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
    let normalStroke = isCompactView ? 5 : 2.2;
    let selectedStroke = isCompactView ? 7 : 4.5;

    // Bande leggere solo in vista estesa
    if(!isCompactView && i % 2 === 0) {
      let bandY = yPos - currentRowHeight * 0.5;
      coloniesLayer.noStroke();
      coloniesLayer.fill(49, 49, 49, 8);
      coloniesLayer.rect(chartX, bandY, chartWidth, currentRowHeight);
    }

    // Barra selezionata
    if(isClicked || isSelected){
      coloniesLayer.stroke(currentColor[0], currentColor[1], currentColor[2], op);
      coloniesLayer.strokeWeight(selectedStroke);
      coloniesLayer.line(xStart, yPos, xEnd, yPos);
      coloniesLayer.noStroke();

      // Pallini solo in vista espansa
      if(!isCompactView) {
        coloniesLayer.fill(currentColor[0], currentColor[1], currentColor[2], op);
        coloniesLayer.circle(xStart, yPos, 10);
        coloniesLayer.circle(xEnd, yPos, 10);
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
        coloniesLayer.circle(xStart, yPos, 6);
        coloniesLayer.circle(xEnd, yPos, 6);
      }
    }

  }

  if(chartWidth > 0 && scrollHeight > 0) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(chartX, chartY, chartWidth, scrollHeight);
    drawingContext.clip();
    image(coloniesLayer, 0, chartY);
    drawingContext.restore();
    pop();
  } else {
    image(coloniesLayer, 0, chartY);
  }

  push();
  textFont("Montserrat", 11);
  textAlign(RIGHT, CENTER);

  for(let p of timelinePositions){
    if(p.yPos + 10 < 0 || p.yPos - 10 > scrollHeight) continue;

    let isClicked = (p.country === clickedCountry);
    let isSelected = (p.country === selectedCountry);

    if(!isCompactView || (isCompactView && (isClicked || isSelected))) {
      let op = (fadeOpacity[p.country] === undefined) ? 255 : fadeOpacity[p.country];

      noStroke();
      if(isClicked || isSelected){
        textSize(14);
        fill(currentColor[0], currentColor[1], currentColor[2], op);
        textStyle(BOLD);
      } else {
        textSize(11);
        fill(80, 80, 80, op);
        textStyle(NORMAL);
      }

      text(p.country.toUpperCase(), chartX - 15, chartY + p.yPos);
    }
  }

  pop();
  
  drawScrollbar();
}

// =========================================================
// SCROLLBAR
// =========================================================
function drawScrollbar(){
  let totalHeight = colonies.length * currentRowHeight;
  let maxScroll = Math.max(totalHeight - scrollHeight, 0);
  
  // Se non c'è scroll necessario, non disegna la scrollbar
  if(maxScroll <= 0) return;
  
  // Posizione e dimensioni della scrollbar
  scrollbarX = chartX + chartWidth + 15;
  scrollbarY = chartY;
  scrollbarWidth = 8;
  scrollbarHeight = scrollHeight;
  
  // Calcola l'altezza del thumb in proporzione
  scrollThumbHeight = (scrollbarHeight / totalHeight) * scrollbarHeight;
  scrollThumbHeight = Math.max(scrollThumbHeight, 15); // Minimo 15px
  
  // Calcola la posizione del thumb basato su yOffset
  let scrollRatio = maxScroll > 0 ? (-yOffset) / maxScroll : 0;
  scrollThumbY = scrollbarY + (scrollbarHeight - scrollThumbHeight) * scrollRatio;
  
  // Disegna background della scrollbar (più grande)
  push();
  stroke(49, 49, 49); // #313131 - stesso colore del thumb
  strokeWeight(1);
  fill(255, 0); // Trasparente
  rect(scrollbarX - 3, scrollbarY - 3, scrollbarWidth + 6, scrollbarHeight + 6);
  
  // Disegna il thumb della scrollbar con stile spigoloso e trasparente
  stroke(49, 49, 49); // #313131
  strokeWeight(1);
  fill(49, 49, 49); 
  rect(scrollbarX + 1, scrollThumbY, scrollbarWidth - 2, scrollThumbHeight);
  
  pop();
}

// =========================================================
// SIDE INFO
// =========================================================
function drawSideInfo(){
  push();
  let sideX = windowWidth * 0.04;
  
  // ===== OFFSET DEL BLOCCO: modifica questi valori per spostare tutto insieme =====
  let blockOffsetX = 0;        // Offset orizzontale (in pixel)
  let blockOffsetY = chartY + 310;   // Offset verticale (in pixel)
  // =================================================================================
  
  let columnWidth = 350;
  let estimatedLineHeight = 22;

  // Titolo colonizzatore
  let titleY = blockOffsetY;
  fill(currentColor);
  textFont("Montserrat");
  textSize(32);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(colonizerTitle, sideX + blockOffsetX, titleY);

  // Paragrafo
  let descY = titleY + 50;
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
  line(sideX + blockOffsetX - 15, descY, sideX + blockOffsetX - 15, descY + lineLength - 10);
  noStroke();
  
  text(paragraphText, sideX + blockOffsetX, descY, columnWidth);
  
  // Posiziona link
  if (sourceLinkElement) {
    sourceLinkElement.show();
    sourceLinkElement.position(sideX + blockOffsetX, descY + totalTextHeight + 5);
  }

  // Posiziona toggle allineato al margine inferiore del grafico
  if(toggleSlider) {
    let toggleHeight = 30;
    if (toggleSlider.elt) {
      let rect = toggleSlider.elt.getBoundingClientRect();
      toggleHeight = rect.height || toggleSlider.elt.offsetHeight || 30;
    }
    let toggleY = chartY + scrollHeight - toggleHeight;
    toggleSlider.position(sideX + blockOffsetX, toggleY);
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

  let infoX = 80, infoY = topOffset + 20;
  
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

  // Check click sulla scrollbar
  if(scrollbarX && mx >= scrollbarX && mx <= scrollbarX + scrollbarWidth && 
     my >= scrollbarY && my <= scrollbarY + scrollbarHeight) {
    if(my >= scrollThumbY && my <= scrollThumbY + scrollThumbHeight) {
      // Click sul thumb della scrollbar
      isDraggingScrollbar = true;
      document.body.style.cursor = 'grab';
      return; // Non fare altro
    } else if(my < scrollThumbY) {
      // Click sopra il thumb - scroll up
      yOffset += scrollHeight * 0.3;
    } else {
      // Click sotto il thumb - scroll down
      yOffset -= scrollHeight * 0.3;
    }
    
    let totalHeight = colonies.length * currentRowHeight;
    let maxScroll = Math.max(totalHeight - scrollHeight, 0);
    yOffset = constrain(yOffset, -maxScroll, 0);
    return;
  }

  // Check se ho cliccato sul bottone Wikipedia
  if(clickedCountry || selectedCountry) {
    let currentCountry = clickedCountry || selectedCountry;
    let index = colCountries.indexOf(currentCountry);
    
    if(index !== -1) {
      let infoX = 80, infoY = topOffset + 20;
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
// MOUSE DRAGGED
// =========================================================
function mouseDragged(){
  if(isDraggingScrollbar) {
    document.body.style.cursor = 'grabbing';
    let totalHeight = colonies.length * currentRowHeight;
    let maxScroll = Math.max(totalHeight - scrollHeight, 0);
    
    if(maxScroll <= 0) return false;
    
    // Calcola il delta del movimento del mouse
    let deltaY = mouseY - pmouseY;
    
    // Converte il movimento del mouse al movimento dello scroll
    let scrollRatio = maxScroll / (scrollbarHeight - scrollThumbHeight);
    yOffset -= deltaY * scrollRatio;
    
    // Applica i vincoli
    yOffset = constrain(yOffset, -maxScroll, 0);
    
    return false;
  }
}

// =========================================================
// MOUSE RELEASED
// =========================================================
function mouseReleased(){
  isDraggingScrollbar = false;
  document.body.style.cursor = 'default';
}

// =========================================================
function mouseWheel(event){
  // Disabilita scroll durante l'animazione di zoom
  if(isAnimating) {
    return false;
  }
  
  let totalHeight = colonies.length * currentRowHeight;
  let maxScroll = Math.max(totalHeight - scrollHeight, 0);
  
  // Disabilita scroll se tutto è visibile
  if(maxScroll <= 0) {
    yOffset = 0;
    return false;
  }

  yOffset -= event.delta;
  yOffset = constrain(yOffset, -maxScroll, 0);
  return false;
}

// =========================================================
// WINDOW RESIZED
// =========================================================
function windowResized(){ 
  // Ricalcola altezza navbar in caso di resize
  let headerElement = document.getElementById('header');
  navbarHeight = headerElement ? headerElement.offsetHeight : 80;
  
  // Calcola il top offset totale
  topOffset = navbarHeight + (navbarHeight * distanzaDallaNavbar);
  
  // Aggiorna margin-top del canvas-container
  let canvasContainer = document.getElementById('canvas-container');
  if(canvasContainer) {
    canvasContainer.style.marginTop = topOffset + 'px';
  }
  
  let canvasHeight = windowHeight - topOffset;
  resizeCanvas(windowWidth, canvasHeight);
  if(coloniesLayer) {
    coloniesLayer.resizeCanvas(windowWidth, colonies.length * currentRowHeight + 200);
  }
  // Reset scroll e animazione al resize
  scrollHeight = canvasHeight * 0.77;
  yOffset = 0;
  isAnimating = false;
  animationProgress = 1;
}