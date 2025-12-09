// =========================================================
// VARIABILI GLOBALI E CONFIGURAZIONE INIZIALE
// =========================================================

// Tabelle dei dati CSV
let table, table3;
let tableDescriptions; // Variabile per le descrizioni specifiche per colonizzatore
let colonies = [];
let colDuration = [], colEndYear = [], colStartYear = [], colCountries = [];

// Range temporale della timeline
let minYear = 1450, maxYear = 2000;

// Scroll verticale e altezza dell'area visibile del grafico
let yOffset = 0;        // posizione corrente dello scroll
let scrollHeight;       // altezza del contenitore scrollabile

// Stati di selezione delle colonie
let clickedCountry = null;    // colonia cliccata manualmente
let selectedCountry = null;   // colonia selezionata da parametro URL (se presente)

// Gestione effetto "fade" per evidenziare solo la colonia selezionata
let fadeOpacity = {};   
let fadeSpeed = 0.12;

// Posizioni e dimensioni della timeline
let timelinePositions = [];
let chartX = 680;             // posizione orizzontale della timeline
let chartWidth = 0;           // larghezza calcolata dinamicamente

// Informazioni sul colonizzatore
let colonizer = null;
let colonizerTitle = "";
let colonizerDescriptions = {
  "britain":"United Kingdom","france":"France","spain":"Spain","portugal":"Portugal",
  "germany":"Germany","belgium":"Belgium","netherlands":"Netherlands","italy":"Italy"
};

// Colori associati a ciascun colonizzatore
let colonizerColors = {
  "britain":[139,0,0],"france":[77,72,113],"spain":[227,188,71],"portugal":[153,171,89],
  "germany":[135,153,189],"belgium":[202,93,132],"netherlands":[217,121,99],"italy":[126,193,175]
};

// Colore corrente scelto in base al colonizzatore
let currentColor = [0, 0, 0]; // Variabile per il colore RGB corrente
let currentDescription = "Caricamento della descrizione in corso..."; // Variabile per la descrizione dinamica
let currentParagraph = ""; // <--- PARTE PRINCIPALE DEL TESTO
let currentSourceLinkText = ""; // <--- TESTO DEL LINK (es. "Source: Encyclopaedia...")
let currentSourceLinkURL = ""; // <--- URL VERO E PROPRIO DEL LINK (se presente)
let sourceLinkElement; // <--- ELEMENTO LINK HTML DI P5.js

// Buffer grafico (p5.Graphics) per gestire il contenuto scrollabile
let coloniesLayer;

// Coordinata verticale iniziale del grafico
let chartY = 120;


// =========================================================
// FUNZIONE HELPER: SPLIT PARAGRAPH AND SOURCE
// =========================================================
function splitParagraphAndSource(fullText) {
    // Cerco l'indice dove inizia "Source:"
    let sourceIndex = fullText.indexOf("Source:");
    
    if (sourceIndex !== -1) {
        // Se trovo "Source:", separo il paragrafo
        let paragraph = fullText.substring(0, sourceIndex).trim();
        let sourceText = fullText.substring(sourceIndex).trim();
        
        // Rimuovo eventuali newline dal testo della fonte
        sourceText = sourceText.replace(/\n/g, ' '); 
        
        // Estraggo l'URL fittizio dalla fonte (questo dovrebbe essere dinamico dal CSV se necessario)
        // Uso un URL di ricerca per l'esempio
        let url = "https://www.google.com/search?q=" + encodeURIComponent(sourceText);

        return {
            paragraph: paragraph,
            sourceText: sourceText,
            url: url
        };
    }
    // Se non trovo "Source:", restituisco il testo completo come paragrafo
    return { paragraph: fullText, sourceText: "", url: "" };
}


// =========================================================
// PRELOAD — Carica i dati CSV prima dell'avvio
// =========================================================
function preload() {
  table = loadTable("assets/COLDAT_dyads - Foglio6.csv", "csv", "header");
  table3 = loadTable("assets/COLDAT_dyads - Foglio3.csv", "csv", "header");
  tableDescriptions = loadTable("assets/paragrafi-dettaglio.csv", "csv", "header"); // Caricamento del file descrittivo
}

// =========================================================
// SETUP — Eseguito una volta all'avvio
// =========================================================
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Leggi i parametri URL
  let urlParams = new URLSearchParams(window.location.search);
  colonizer = urlParams.get("colonizer");
  selectedCountry = urlParams.get("country");

  // Imposta il colore in base al colonizzatore
  if(colonizer && colonizerColors[colonizer]) currentColor = colonizerColors[colonizer];
  else currentColor = colonizerColors["britain"];

  if(!colonizer){
    console.error("Nessun colonizzatore specificato!");
    return;
  }
  
  // ESTRAZIONE E SEPARAZIONE DEL PARAGRAFO (Testo dinamico e link)
  if (tableDescriptions) {
    let descRow = tableDescriptions.findRows(colonizer, "colonizer");
    if (descRow.length > 0) {
      let fullText = descRow[0].get("paragraph");
      let parts = splitParagraphAndSource(fullText);
      
      currentParagraph = parts.paragraph;
      currentSourceLinkText = parts.sourceText;
      currentSourceLinkURL = parts.url;
      currentDescription = fullText; // Mantiene la variabile originale per debug/fallback

    } else {
      currentParagraph = "Descrizione non trovata per questo colonizzatore.";
      currentSourceLinkText = "";
    }
  }
  
  // CREAZIONE DELL'ELEMENTO LINK HTML (per poterlo posizionare e non interferire con P5.js draw)
  if (currentSourceLinkText) {
      sourceLinkElement = createA(currentSourceLinkURL, currentSourceLinkText, '_blank');
      sourceLinkElement.style('font-size', '14px');
      sourceLinkElement.style('color', `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`); // Colore dinamico
      sourceLinkElement.style('position', 'absolute');
      sourceLinkElement.hide(); // Nascondi inizialmente
  }


  // Filtra le righe del dataset per il colonizzatore selezionato
  let selected = table.findRows(colonizer,"colonizer");
  colonizerTitle = colonizerDescriptions[colonizer] || colonizer;

  // Estrae i dati di ciascuna colonia
  for(let i=0;i<selected.length;i++){
    let row = selected[i];
    colonies.push(row);
    colDuration.push(parseFloat(row.get("Duration")));
    colEndYear.push(parseFloat(row.get("colend_max")));
    colStartYear.push(parseFloat(row.get("colstart_max")));
    let country = row.get("country");
    colCountries.push(country);
    fadeOpacity[country] = 255;
  }

  // Ordina le colonie per anno di inizio colonizzazione
  let sortable = [];
  for(let i=0;i<colonies.length;i++){
    sortable.push({
      colony:colonies[i],
      start:colStartYear[i],
      end:colEndYear[i],
      country:colCountries[i],
      duration:colDuration[i]
    });
  }
  sortable.sort((a,b)=>a.start-b.start);

  // Ricostruisce gli array ordinati
  colonies=[]; colStartYear=[]; colEndYear=[]; colCountries=[]; colDuration=[];
  for(let item of sortable){
    colonies.push(item.colony);
    colStartYear.push(item.start);
    colEndYear.push(item.end);
    colCountries.push(item.country);
    colDuration.push(item.duration);
  }

  // Crea il buffer per il contenuto scrollabile
  coloniesLayer = createGraphics(windowWidth, colonies.length*30 + 50);

  // Imposta altezza dell’area scrollabile (77% dell’altezza finestra)
  scrollHeight = windowHeight * 0.77;
}

// =========================================================
// DRAW — Ciclo principale di disegno
// =========================================================
function draw() {
  clear();

  drawTimeline();      // asse temporale e linee verticali
  drawSideInfo();      // testo e descrizione laterale dell'impero
  drawColoniesLayer(); // contenuto scrollabile (barre colonie)
  drawColonyInfo();    // info dettagliate della colonia selezionata
}

// =========================================================
// TIMELINE — Disegna la parte fissa del grafico con gli anni
// =========================================================
function drawTimeline(){
  push();
  chartWidth = windowWidth - 750;

  // Asse orizzontale inferiore
  stroke(100,150);
  strokeWeight(0.5);
  line(chartX, chartY+scrollHeight, chartX+chartWidth, chartY+scrollHeight);

  // Etichette degli anni + linee verticali
  textAlign(CENTER);
  textSize(12);
  fill(100);
  noStroke();
  for(let year=minYear; year<=maxYear; year+=50){
    let x = map(year, minYear, maxYear, chartX, chartX+chartWidth);
    text(year, x, chartY+scrollHeight+20);
    stroke(200);
    strokeWeight(0.5);
    line(x, chartY, x, chartY+scrollHeight);
  }
  pop();
}

// =========================================================
// COLONIES LAYER — Disegna le barre delle colonie nello spazio scrollabile
// =========================================================
function drawColoniesLayer(){
  coloniesLayer.clear();
  timelinePositions = [];

  let rowHeight = 25;  // distanza verticale tra barre
  let dotSize = 8;     // dimensione dei pallini alle estremità

  for(let i=0;i<colonies.length;i++){
    let start = colStartYear[i],
        end = colEndYear[i],
        country = colCountries[i];

    // Calcola la posizione verticale della riga in base allo scroll
    let yPos = (i * rowHeight) + 12 + yOffset;

    // Calcola posizione orizzontale nel grafico (anni → coordinate)
    let xStart = map(start, minYear, maxYear, chartX, chartX + chartWidth);
    let xEnd   = map(end, minYear, maxYear, chartX, chartX + chartWidth);

    // Memorizza la posizione per gestire i click
    timelinePositions.push({ index:i, xStart, xEnd, yPos, country, start, end });

    // Disegna solo se la barra è visibile nel contenitore
    if(yPos + dotSize/2 < 0 || yPos - dotSize/2 > scrollHeight) continue;

    // Gestione fade-in/out per evidenziare la colonia selezionata
    let isClicked = (country === clickedCountry);
    let isSelected = (country === selectedCountry);
    let someoneSelected = clickedCountry || selectedCountry;
    let targetOpacity = someoneSelected ? (isClicked || isSelected ? 255 : 100) : 255;
    fadeOpacity[country] = lerp(fadeOpacity[country], targetOpacity, fadeSpeed);
    let op = fadeOpacity[country];

    // --- Disegno barra selezionata ---
    if(isClicked || isSelected){
      coloniesLayer.stroke(currentColor[0], currentColor[1], currentColor[2], op);
      coloniesLayer.strokeWeight(6);
      coloniesLayer.line(xStart, yPos, xEnd, yPos);
      coloniesLayer.noStroke();

      // Pallini e etichette anni
      coloniesLayer.fill(currentColor[0], currentColor[1], currentColor[2], op);
      coloniesLayer.circle(xStart, yPos, 12);
      coloniesLayer.circle(xEnd, yPos, 12);
      coloniesLayer.textSize(15);
      coloniesLayer.textStyle(BOLD);
      coloniesLayer.fill(currentColor);
      coloniesLayer.textAlign(RIGHT, CENTER);
      coloniesLayer.text(int(start), xStart - 10, yPos);
      coloniesLayer.textAlign(LEFT, CENTER);
      coloniesLayer.text(int(end), xEnd + 10, yPos);

    } else {
      // --- Barre non selezionate ---
      coloniesLayer.stroke(currentColor[0], currentColor[1], currentColor[2], op*0.7);
      coloniesLayer.strokeWeight(1.2);
      coloniesLayer.line(xStart, yPos, xEnd, yPos);
      coloniesLayer.fill(255);
      coloniesLayer.circle(xStart, yPos, 8);
      coloniesLayer.circle(xEnd, yPos, 8);
    }

    // Nome del paese a sinistra della barra
    coloniesLayer.textAlign(RIGHT, CENTER);
    coloniesLayer.textSize(11);
    coloniesLayer.fill(country === clickedCountry || country === selectedCountry ? currentColor : [40, op]);
    coloniesLayer.text(country, chartX - 15, yPos);
  }

  // Disegna il buffer sul canvas principale
  image(coloniesLayer, 0, chartY);
}

// =========================================================
// SIDE INFO — Mostra titolo e descrizione dell’impero colonizzatore
// =========================================================
function drawSideInfo(){
  push();
  let sideX = windowWidth * 0.06;
  let topY = windowHeight * 0.73; // Punto di partenza in basso a sinistra
  let columnWidth = 400;
  let estimatedLineHeight = 22; // Altezza stimata per textSize(16) + interlinea

  // 1. Titolo colonizzatore
  fill(currentColor);
  textFont("Montserrat");
  textSize(32);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(colonizerTitle, sideX, topY - 70);

  // 2. Setup per il paragrafo
  let descY = topY -15;
  fill(60);
  textSize(16);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);
  
  // Impostazione delle proprietà per calcolare l'altezza
  // (P5.js non ha un modo diretto, quindi usiamo la stima di righe)
  // Nota: textWidth() richiede che il font sia caricato e la dimensione settata
  
  let paragraphText = currentParagraph;
  
  // Calcolo approssimativo dell'altezza del testo:
  // 1. Calcola la larghezza totale che il testo occuperebbe se fosse su una riga.
  let totalTextWidth = textWidth(paragraphText);
  
  // 2. Calcola quante righe intere sono necessarie data la columnWidth.
  let requiredLines = Math.ceil(totalTextWidth / columnWidth);
  
  // 3. Calcola l'altezza verticale totale del blocco di testo.
  let totalTextHeight = requiredLines * estimatedLineHeight;
  
  // 4. Aggiustamento per il link, se presente (stimato in 30px aggiuntivi)
  let linkOffset = currentSourceLinkText ? 30 : 0;
  let lineLength = totalTextHeight + linkOffset + 10; // Aggiungo 10px di padding in basso


  // Disegna la linea verticale (DINAMICA)
  stroke(currentColor);
  strokeWeight(3);
  line(sideX - 15, descY, sideX - 15, descY + lineLength-5); // <--- LUNGHEZZA DINAMICA
  noStroke();
  
  // Disegna il paragrafo (solo il testo principale)
  text(paragraphText, sideX, descY, columnWidth);
  
  // Posiziona il link HTML se esiste
  if (sourceLinkElement) {
    sourceLinkElement.show();
    // Posizionamento del link subito sotto il paragrafo
    sourceLinkElement.position(sideX, descY + totalTextHeight + 5); 
  } else if (sourceLinkElement) {
    sourceLinkElement.hide();
  }
  
  pop();
}

// =========================================================
// COLONY INFO — Mostra dettagli della colonia selezionata
// =========================================================
function drawColonyInfo(){
  if(!clickedCountry && !selectedCountry) return;
  let currentCountry = clickedCountry || selectedCountry;
  let index = colCountries.indexOf(currentCountry);
  if(index === -1) return;

  let start = colStartYear[index],
      end = colEndYear[index],
      duration = colDuration[index];

  // Posizionamento in alto a sinistra (separato dalla SideInfo in basso)
  let infoX = 80, infoY = windowHeight * 0.1; 
  push();
  fill(currentColor);
  textFont("Montserrat");
  textSize(26);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text(currentCountry, infoX, infoY);

  // Dati principali
  fill(40);
  textSize(16);
  textStyle(NORMAL);
  let lineSpacing = 25, startY = infoY + 50;
  text(`• Beginning of colonization: ${int(start)}`, infoX, startY);
  text(`• End of colonization: ${int(end)}`, infoX, startY + lineSpacing);
  text(`• Colonization duration: ${nf(duration,0,1)} years`, infoX, startY + lineSpacing * 2);

  // Pulsante fittizio
  noStroke();
  fill(currentColor);
  rect(infoX, startY + lineSpacing * 3.5, 250, 30, 5);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("MORE INFORMATION ON WIKIPEDIA", infoX + 125, startY + lineSpacing * 3.5 + 15);
  pop();
}

// =========================================================
// INTERAZIONE MOUSE — Selezione e deselezione delle colonie
// =========================================================
function mousePressed(){
  let mx = mouseX;
  let my = mouseY;
  let clickedSomething = false;

  for(let p of timelinePositions){
    let mouseRelativeY = my - chartY - yOffset;
    let rowY = p.index * 25 + 12;

    // Click sul nome
    let nameX1 = chartX - 90, nameX2 = chartX - 10, nameY1 = rowY - 10, nameY2 = rowY + 10;
    if(mx >= nameX1 && mx <= nameX2 && mouseRelativeY >= nameY1 && mouseRelativeY <= nameY2){
      clickedCountry = p.country;
      selectedCountry = null; // annulla selezione da URL
      clickedSomething = true;
      break;
    }

    // Click sulla barra
    if(mx >= p.xStart && mx <= p.xEnd && abs(mouseRelativeY - rowY) < 10){
      clickedCountry = p.country;
      selectedCountry = null; // annulla selezione da URL
      clickedSomething = true;
      break;
    }

    // Click sui pallini
    let dStart = dist(mx, mouseRelativeY, p.xStart, rowY);
    let dEnd = dist(mx, mouseRelativeY, p.xEnd, rowY);
    if(dStart < 10 || dEnd < 10){
      clickedCountry = p.country;
      selectedCountry = null; // annulla selezione da URL
      clickedSomething = true;
      break;
    }
  }

  // Click fuori: deseleziona tutto
  if(!clickedSomething){
    clickedCountry = null;
    selectedCountry = null;
    // Nascondi il link quando si deseleziona
    if (sourceLinkElement) {
      sourceLinkElement.hide();
    }
  }

  // Reset opacità
  for(let c in fadeOpacity) fadeOpacity[c] = 255;
}

// =========================================================
// SCROLL MOUSE — Gestione dello scroll verticale del grafico
// =========================================================
function mouseWheel(event){
  yOffset -= event.delta;
  yOffset = constrain(yOffset, -colonies.length*25 + scrollHeight, 0);
  return false;
}

// =========================================================
// RESIZE — Aggiorna dimensioni al ridimensionamento finestra
// =========================================================
function windowResized(){ 
  resizeCanvas(windowWidth, windowHeight); 
  coloniesLayer.resizeCanvas(windowWidth, colonies.length*30 + 50);
}