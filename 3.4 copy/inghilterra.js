// VARIABILI GLOBALI E CONFIGURAZIONE INIZIALE
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
let distanzaDallaNavbar = -1; // Distanza dal navbar in valori relativi (0 = nessuno spazio, 1 = altezza navbar, 0.5 = metà navbar, ecc.)
let topOffset = 0; // Spazio totale dal top per posizionare gli elementi (navbarHeight + distanza)

// Stati di selezione delle colonie
let clickedCountry = null;
let selectedCountry = null;

// Gestione effetto "fade"
let fadeOpacity = {};   
let fadeSpeed = 0.12;
let nameShift = {};

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
    let paragraph = fullText.substring(0, sourceIndex).trim().replace(/\n/g, ' ');
    let sourceText = fullText.substring(sourceIndex).trim();
    sourceText = sourceText.replace(/\n/g, ' '); 
    let url = "https://www.google.com/search?q=" + encodeURIComponent(sourceText);
    return { paragraph, sourceText, url };
  }
  return { paragraph: fullText.trim().replace(/\n/g, ' '), sourceText: "", url: "" };
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Funzione helper per impostare stile del testo
function setTextStyle(font, size, style, align, fillColor) {
  textFont(font);
  textSize(size);
  textStyle(style);
  textAlign(align);
  if(fillColor !== undefined) fill(fillColor);
}

// Funzione helper per testo Montserrat standard
function setMontserrat(size, style, align, fillColor) {
  setTextStyle("Montserrat", size, style, align, fillColor);
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
  
  // Logica di priorità:
  // 1. Se l'utente ha già fatto una scelta (savedView esiste), rispettala
  // 2. Altrimenti, parti sempre in collapsed (default)
  if(savedView) {
    isCompactView = (savedView === 'compact');
  } else {
    // Default: sempre collapsed
    isCompactView = true;
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
    let endYear = parseFloat(row.get("colend_max"));
    let startYear = parseFloat(row.get("colstart_max"));
    colEndYear.push(endYear);
    colStartYear.push(startYear);
    let duration = endYear - startYear;
    if (!Number.isFinite(duration) || duration < 0) {
      duration = 0;
    }
    colDuration.push(duration);
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
  
  // Auto-scroll alla colonia selezionata da URL
  if(selectedCountry) {
    let index = colCountries.indexOf(selectedCountry);
    if(index !== -1) {
      // Calcola la posizione Y della colonia nel grafico
      let colonyY = index * currentRowHeight;
      // Centro dello schermo visibile
      let screenCenter = scrollHeight / 2;
      // Calcola lo yOffset necessario per centrare la colonia
      yOffset = -(colonyY - screenCenter);
      // Assicurati che yOffset sia nei limiti
      let totalHeight = colonies.length * currentRowHeight;
      let maxScroll = Math.max(totalHeight - scrollHeight, 0);
      yOffset = constrain(yOffset, -maxScroll, 0);
    }
  }
}

function createToggleSlider() {
  let borderColor = '#4A4A4A';  // Grigio del bordo
  let bgColor = '#E7E1D1';      // Sfondo beige
  let knobColor = '#3D3D3D';    // Quadratino grigio scuro

  toggleSlider = createDiv('');
  toggleSlider.id('view-toggle');
  toggleSlider.parent('canvas-container');
  toggleSlider.style('position', 'absolute');
  toggleSlider.style('height', '24px');  // Molto più sottile
  toggleSlider.style('width', '160px');
  toggleSlider.style('border-radius', '2px');
  toggleSlider.style('background-color', bgColor);
  toggleSlider.style('border', '1.5px solid ' + borderColor);
  toggleSlider.style('box-shadow', 'none');
  toggleSlider.style('cursor', 'pointer');
  toggleSlider.style('transition', 'none');
  toggleSlider.style('padding', '0');
  toggleSlider.style('font-family', 'Montserrat, sans-serif');
  toggleSlider.style('z-index', '1000');
  toggleSlider.style('display', 'flex');
  toggleSlider.style('align-items', 'center');
  toggleSlider.style('justify-content', 'center');
  toggleSlider.style('overflow', 'visible');

  // Label text (centered)
  let label = createDiv(isCompactView ? 'COLLAPSED' : 'EXTENDED');
  label.id('toggle-label');
  label.parent(toggleSlider);
  label.style('position', 'relative');
  label.style('z-index', '1');
  label.style('color', '#313131');  // Grigio per il testo
  label.style('font-weight', 'BOLD');
  label.style('letter-spacing', '0.8px');
  label.style('font-size', '12px');
  label.style('pointer-events', 'none');
  label.style('white-space', 'nowrap');
  label.style('text-align', 'center');
  label.style('flex', '1');

  // Knob: quadratino grigio scuro
  let knob = createDiv('');
  knob.id('toggle-knob');
  knob.parent(toggleSlider);
  knob.style('position', 'absolute');
  knob.style('width', '18px');
  knob.style('height', '18px');
  knob.style('border-radius', '1px');
  knob.style('background-color', knobColor);
  knob.style('border', 'none');
  knob.style('box-shadow', 'none');
  knob.style('top', '50%');
  knob.style('transform', 'translateY(-50%)');
  knob.style('transition', 'left 0.3s cubic-bezier(0.22, 1, 0.36, 1)');
  knob.style('cursor', 'pointer');

  // Posizione iniziale del knob
  knob.style('left', isCompactView ? '3px' : 'calc(100% - 21px)');

  // Click handler
  toggleSlider.mousePressed(() => {
    isCompactView = !isCompactView;
    targetRowHeight = isCompactView ? 8 : 25;
    
    // Salva la scelta dell'utente nel localStorage
    localStorage.setItem('viewMode', isCompactView ? 'compact' : 'extended');
    isAnimating = true;
    animationProgress = 0;

    if(isCompactView){
      knob.style('left', '3px');
      select('#toggle-label').html('COLLAPSED');
    } else {
      knob.style('left', 'calc(100% - 21px)');
      select('#toggle-label').html('EXTENDED');
    }
  });
}

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

      // Le date verranno disegnate dopo sul canvas principale per evitare il clipping

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

      const nameText = p.country.toUpperCase();
      let targetShift = 0;

      if (isClicked || isSelected) {
        const nameRight = chartX - 15;
        const nameWidth = textWidth(nameText);
        const nameLeft = nameRight - nameWidth;

        push();
        textFont("Montserrat");
        textSize(15);
        textStyle(BOLD);
        const dateText = String(int(p.start));
        const dateWidth = textWidth(dateText);
        pop();

        const dateRight = p.xStart - 10;
        const dateLeft = dateRight - dateWidth;
        const overlap = nameRight - dateLeft;

        if (overlap > 0) targetShift = overlap + 12;
      }

      const currentShift = nameShift[p.country] ?? 0;
      nameShift[p.country] = lerp(currentShift, targetShift, 0.15);

      text(nameText, chartX - 15 - nameShift[p.country], chartY + p.yPos);
    }
  }

  pop();
  
  // Disegna le date FUORI dal clip per evitare che vengano tagliate
  push();
  textFont("Montserrat");
  
  for(let p of timelinePositions){
    if(p.yPos + 10 < 0 || p.yPos - 10 > scrollHeight) continue;

    let isClicked = (p.country === clickedCountry);
    let isSelected = (p.country === selectedCountry);
    
    if(isClicked || isSelected) {
      let op = (fadeOpacity[p.country] === undefined) ? 255 : fadeOpacity[p.country];
      
      textSize(15);
      textStyle(BOLD);
      fill(currentColor[0], currentColor[1], currentColor[2], op);
      
      // Data di inizio (allineata a destra)
      textAlign(RIGHT, CENTER);
      text(int(p.start), p.xStart - 10, chartY + p.yPos);
      
      // Data di fine (allineata a sinistra)
      textAlign(LEFT, CENTER);
      text(int(p.end), p.xEnd + 10, chartY + p.yPos);
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
  scrollbarX = chartX + chartWidth + 25;
  scrollbarY = chartY;
  scrollbarWidth = 4;
  scrollbarHeight = scrollHeight;
  
  // Calcola l'altezza del thumb in proporzione
  scrollThumbHeight = (scrollbarHeight / totalHeight) * scrollbarHeight;
  scrollThumbHeight = Math.max(scrollThumbHeight, 20); // Minimo 20px
  
  // Calcola la posizione del thumb basato su yOffset
  let scrollRatio = maxScroll > 0 ? (-yOffset) / maxScroll : 0;
  scrollThumbY = scrollbarY + (scrollbarHeight - scrollThumbHeight) * scrollRatio;
  
  // Disegna il thumb della scrollbar - stile minimalista
  push();
  noStroke();
  fill(49, 49, 49); // #313131
  rect(scrollbarX, scrollThumbY, scrollbarWidth, scrollThumbHeight);
  pop();
}

// =========================================================
// SIDE INFO
// =========================================================
function drawSideInfo(){
  push();
  let sideX = windowWidth * 0.07;
  
  // Setup parametri
  let columnWidth = 330;
  let estimatedLineHeight = 22;
  let titleHeight = 45;
  let titleToParaSpacing = 60;


  let paragraphToLinkSpacing = 0;    // spazio tra paragrafo e link
  let blockToToggleSpacing = 40;     // spazio tra fine blocco (testo+link) e toggle
  
  // Calcola dimensioni del testo
  setMontserrat(14, NORMAL);
  let paragraphText = currentParagraph;
  let requiredLines = Math.ceil(textWidth(paragraphText) / columnWidth);
  let totalTextHeight = requiredLines * estimatedLineHeight;
  
  // Calcola posizioni (dal basso verso l'alto)
  let toggleHeight = toggleSlider?.elt?.offsetHeight || 30;
  let graphicsBottom = chartY + scrollHeight;
  let toggleYPos = graphicsBottom - toggleHeight;
  
  // Il blocco si posiziona sopra il toggle con offset regolabile
  let blockHeight = titleHeight + titleToParaSpacing + totalTextHeight;
  let blockYPos = toggleYPos - blockHeight + blockToToggleSpacing;
  
  // === Disegna Titolo ===
  setTextStyle("benton-modern-display", 45, NORMAL, LEFT, currentColor);
  textAlign(LEFT, TOP);
  text(colonizerTitle, sideX, blockYPos);

  // === Disegna Paragrafo ===
  let descY = blockYPos + titleToParaSpacing;
  setMontserrat(14, NORMAL, LEFT, 60);
  textAlign(LEFT, TOP);
  
  let lineHeight = textAscent() + textDescent();
  let actualTextHeight = requiredLines * lineHeight;
  
  stroke(currentColor);
  strokeWeight(1);
  line(sideX - 15, descY, sideX - 15, descY + actualTextHeight);
  noStroke();
  
  text(paragraphText, sideX, descY, columnWidth);
  
  // === Posiziona link ===
  if (sourceLinkElement) {
    sourceLinkElement.show();
    sourceLinkElement.position(sideX, descY + actualTextHeight + paragraphToLinkSpacing);
  }

  // === Posiziona toggle (fisso) ===
  if (toggleSlider) {
    toggleSlider.position(sideX, toggleYPos);
  }
  
  pop();
}


// =========================================================
// COLONY INFO
// =========================================================

function drawColonyInfo() {
  if (!clickedCountry && !selectedCountry) return;

  let currentCountry = clickedCountry || selectedCountry;
  let index = colCountries.indexOf(currentCountry);
  if (index === -1) return;

  let start = colStartYear[index],
      end = colEndYear[index],
      duration = colDuration[index];

  let infoX = windowWidth * 0.07;
  let infoY = topOffset + 120;

  push();
  setMontserrat(28, BOLD, LEFT, currentColor);
  textAlign(LEFT, TOP);
  text(currentCountry, infoX, infoY);

  // === BLOCCO INFORMAZIONI TEMPORALI ===
  let blockY = infoY + 65;
  let leftBlockX = infoX;
  let rightBlockX = infoX + 220;
  
  const darkGray = "#313131";

  // Duration label
  setMontserrat(14, NORMAL, LEFT, darkGray);
  text("duration", leftBlockX, blockY-15);

  // Valore durata
  setMontserrat(36, NORMAL, LEFT, currentColor);
  text(`${int(duration)} yr.`, leftBlockX, blockY + 3);

  // Linea verticale
  stroke(darkGray);
  strokeWeight(1);
  line(rightBlockX - 85, blockY - 5, rightBlockX - 85, blockY + 50);
  noStroke();

  // Labels
  setMontserrat(14, NORMAL, LEFT, darkGray);
  text(`start of colonization:`, rightBlockX - 55, blockY);
  text(`end of colonization:`, rightBlockX - 55, blockY + 25);

  // Anni
  setMontserrat(14, BOLD, LEFT, darkGray);
  text(`${int(start)}`, rightBlockX + 100, blockY);
  text(`${int(end)}`, rightBlockX + 100, blockY + 25);

  // === BOTTONE WIKIPEDIA ===
  let buttonY = blockY + 70;
  let buttonWidth = 250;
  let buttonHeight = 30;

  let isHover = mouseX >= infoX && mouseX <= infoX + buttonWidth &&
                mouseY >= buttonY && mouseY <= buttonY + buttonHeight;
  
  noStroke();
  fill(isHover ? currentColor[0] * 0.8 : currentColor[0], 
       isHover ? currentColor[1] * 0.8 : currentColor[1], 
       isHover ? currentColor[2] * 0.8 : currentColor[2]);
  cursor(isHover ? HAND : ARROW);

  rect(infoX, buttonY, buttonWidth, buttonHeight);
  setMontserrat(12, NORMAL, CENTER, 255);
  textAlign(CENTER, CENTER);
  text("MORE INFORMATION ON WIKIPEDIA", infoX + buttonWidth/2, buttonY + buttonHeight/2);

  pop();
}


// =========================================================
// MOUSE MOVED
// =========================================================
function mouseMoved(){
  let mx = mouseX;
  let my = mouseY;
  
  // Check hover sulla scrollbar
  if(scrollbarX && mx >= scrollbarX && mx <= scrollbarX + scrollbarWidth && 
     my >= scrollbarY && my <= scrollbarY + scrollbarHeight) {
    if(my >= scrollThumbY && my <= scrollThumbY + scrollThumbHeight) {
      cursor(HAND);
      return;
    }
  }

// Check hover sul bottone Wikipedia
  if(clickedCountry || selectedCountry) {
    let currentCountry = clickedCountry || selectedCountry;
    let index = colCountries.indexOf(currentCountry);
    
    if(index !== -1) {
      let infoX = windowWidth * 0.07;
      let infoY = topOffset + 120;
      let blockY = infoY + 65;
      let buttonY = blockY + 70;
      let buttonWidth = 250;
      
      if(mx >= infoX && mx <= infoX + buttonWidth && 
         my >= buttonY && my <= buttonY + 30) {
        cursor(HAND);
        return;
      }
    }
  }

  // Check hover sulle colonie nella timeline
  for(let p of timelinePositions){
    let mouseRelativeY = my - chartY - yOffset;
    let rowY = p.index * currentRowHeight + 12;

    // Hover sul nome
    let nameX1 = chartX - 90, nameX2 = chartX - 10;
    let nameY1 = rowY - 10, nameY2 = rowY + 10;
    
    if(mx >= nameX1 && mx <= nameX2 && mouseRelativeY >= nameY1 && mouseRelativeY <= nameY2){
      cursor(HAND);
      return;
    }

    // Hover sulla barra
    let hitArea = isCompactView ? 5 : 10;
    if(mx >= p.xStart && mx <= p.xEnd && abs(mouseRelativeY - rowY) < hitArea){
      cursor(HAND);
      return;
    }

    // Hover sui pallini (solo in vista espansa)
    if(!isCompactView) {
      let dStart = dist(mx, mouseRelativeY, p.xStart, rowY);
      let dEnd = dist(mx, mouseRelativeY, p.xEnd, rowY);
      
      if(dStart < 10 || dEnd < 10){
        cursor(HAND);
        return;
      }
    }
  }

  cursor(ARROW);
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
      // Coordinate coerenti con drawColonyInfo
      let infoX = windowWidth * 0.07;
      let infoY = topOffset + 120;
      let blockY = infoY + 65;
      let buttonY = blockY + 70;
      let buttonWidth = 250;
      let buttonHeight = 30;
      
      if(mx >= infoX && mx <= infoX + buttonWidth && 
         my >= buttonY && my <= buttonY + buttonHeight) {
        let wikiLink = colonies[index].get("wiki");
        if(wikiLink && wikiLink.trim() !== "") {
          window.open(wikiLink, '_blank');
        }
        return; 
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
      nameShift = {};
      nameShift[p.country] = 0;
      clickedSomething = true;
      break;
    }

    // Click sulla barra
    let hitArea = isCompactView ? 5 : 10;
    if(mx >= p.xStart && mx <= p.xEnd && abs(mouseRelativeY - rowY) < hitArea){
      clickedCountry = p.country;
      selectedCountry = null;
      nameShift = {};
      nameShift[p.country] = 0;
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
        nameShift = {};
        nameShift[p.country] = 0;
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