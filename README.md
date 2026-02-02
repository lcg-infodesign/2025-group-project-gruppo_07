[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ScyD1Fym)

# 1. Autori e CC

**Autori:**  
Simone Busato – Martina De Boni – Nina De Michele – Filippo Carlo Esposito – Silvia Nicosia – Carla Maria Parisi – Matilde Pinarello  

**Creative Commons:**  
The Bubble of Colonialism © 2026 by Simone Busato, Martina De Boni, Nina De Michele, Filippo Carlo Esposito, Silvia Nicosia, Carla Maria Parisi, Matilde Pinarello is licensed under **[CC BY 4.0] (https://creativecommons.org/licenses/by/4.0/)**

---

# 2. Introduzione

Il progetto **"The Bubble of Colonialism"** mira a illustrare la dimensione temporale del colonialismo. Abbiamo scelto questo tema perché spesso percepito come un fenomeno storico remoto, mentre l'ultima dominazione coloniale è terminata solo nel 1984 e molti paesi convivono ancora con le sue conseguenze. La visualizzazione copre il periodo **1450-2000**, includendo sia le fasi di colonizzazione che di decolonizzazione per offrire una panoramica completa del fenomeno.

---

# 3. Obiettivi di Conoscenza

La ricerca si fonda su quattro aspetti chiave del dataset:

- Il colonialismo è un fenomeno che inizia nel XV secolo e si estende fino al XX secolo, coinvolgendo il mondo intero.
- Il colonialismo non è stato un fenomeno omogeneo, ci sono stati periodi di maggiore colonizzazione e decolonizzazione.
- Gran Bretagna, Francia, Paesi Bassi, Belgio, Germania, Italia, Spagna e Portogallo sono state le otto potenze coloniali centrali.
- Su 196 paesi, 161 sono stati colonizzati.

Partendo da questi aspetti abbiamo formulato degli obiettivi di conoscenza:

- Comprendere l'evoluzione temporale del colonialismo come fenomeno globale.
- Identificare i periodi di maggiore colonizzazione e decolonizzazione nel contesto storico.
- Riconoscere gli otto principali imperi coloniali e il loro diverso impatto nel fenomeno della colonizzazione.
- Identificare nel dettaglio ogni colonia, da chi è stata colonizzata, per quanto tempo e quando è stata decolonizzata.

---

# 4. Scelte progettuali e modalità di visualizzazione

Il progetto esplora la colonizzazione attraverso due livelli di visualizzazione: quello generale, basato su una **bubble chart**, mostra l’evoluzione e la distribuzione globale del fenomeno evidenziando i periodi di espansione e decolonizzazione; qui, variabili come durata, date e potenza colonizzatrice sono tradotte in dimensione, posizione e colore delle bolle. Da questa panoramica si passa poi a un livello di dettaglio, dedicato all’analisi specifica della storia dei singoli paesi.

Nel grafico principale è presente una **timeline interattiva** che permette di identificare, tramite hover, i picchi di colonizzazione e decolonizzazione. Al passaggio della timeline, compaiono brevi paragrafi esplicativi che descrivono il contesto politico, economico e sociale, aiutando a collocare il fenomeno nella storia globale.

Ogni paese colonizzatore è rappresentato da un pallino vuoto con bordo colorato, mentre le colonie sono rappresentate da pallini pieni dello stesso colore. Quando un paese viene colonizzato, si sposta dal cluster esterno verso il colonizzatore assumendone il colore; in fase di decolonizzazione, torna nel cluster esterno tinto di grigio scuro. Ogni elemento è cliccabile per accedere direttamente alla visione di dettaglio, già filtrata sul paese selezionato.

La visione di dettaglio, accessibile anche tramite navbar, utilizza un **grafico a barre temporali** per mostrare la cronologia coloniale di ogni stato. Qui è possibile consultare date e durate specifiche, con la possibilità di approfondire l'argomento tramite un link diretto alla pagina Wikipedia che nasce dal desiderio di restituire dignità e centralità ai paesi colonizzati, offrendo uno spazio di approfondimento che sovverte la narrazione tradizionale focalizzata sulle potenze colonizzatrici.

La visione di dettaglio è disponibile in due modalità:
- **extended**, che mostra informazioni approfondite sulla durata totale della colonizzazione;
- **collapsed**, che consente di visualizzare in modo sintetico l’insieme delle colonie di una potenza per facilitarne il confronto.

Per quanto riguarda invece il profilo estetico e funzionale, è stato adottato un approccio **minimalista**, con una palette cromatica limitata, per garantire che l’attenzione dell’utente rimanga focalizzata esclusivamente sulla chiarezza dei dati. Per preparare l’utente alla lettura di queste informazioni dinamiche, il progetto utilizza lo **storytelling** come meccanismo introduttivo e didattico, un percorso guidato che fornisce il contesto concettuale e storico necessario prima di lasciare spazio all’interazione.

Infine, l'interfaccia dinamica trasforma la consultazione in un'esperienza di esplorazione attiva dove l'utente non è un osservatore passivo, ma può controllare il flusso temporale, mettendo in pausa o utilizzando appositi comandi di accelerazione (come il pulsante **2x**) far avanzare velocemente il tempo e analizzare in autonomia specifici momenti della storia globale.

Per garantire accessibilità e coerenza con il dataset di riferimento, il progetto è realizzato in **lingua inglese**.

---

# 5. Dataset e fonti

Il **[Colonial Dates Dataset] (https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/T9SDEW)** (COLDAT) è un dataset pubblicato nel 2019 da Harvard che aggrega informazioni sulla portata e la durata degli imperi coloniali europei da fonti di rilevanza internazionale quali Correlates of War (CoW), Lange et al., Olsson, Wimmer & Min. Il dataset riflette le conoscenze accumulate nella disciplina e mira a sollevare i ricercatori dalla necessità di operare scelte difficili da giustificare tra diversi dataset storici.

Il dataset offre due versioni organizzate diversamente ma contenenti le medesime informazioni. Abbiamo scelto di lavorare sulla versione verticale, strutturata nel modo seguente:

- **Prima colonna:** elenco dei 196 paesi, ripetuti otto volte (una per ogni colonizzatore)
- **Seconda colonna:** paese colonizzatore, assegnato progressivamente a ciascun blocco di 196 paesi (Belgio, Gran Bretagna, Francia, Germania, Paesi Bassi, Portogallo, Spagna, Italia)
- **Terza colonna:** valore binario (0 o 1) che indica se il paese è stato colonizzato dal rispettivo colonizzatore
- **Colonne quattro e cinque (colstart_max e colend_max):** date di inizio e fine colonizzazione basate sul "last date mentioned"
- **Colonne sei e sette (colstart_mean e colend_mean):** date di inizio e fine colonizzazione calcolate sulla media delle fonti citate
- **Ottava colonna:** durata della colonizzazione

Inoltre abbiamo aggiunto una colonna in cui sono stai inseriti i link alle pagine wikipedia dei paesi colonizzati, utilizzati poi nella pagina di dettaglio.

Nel progetto abbiamo privilegiato le date calcolate sul **"last date mentioned"** perché, come specifica il dataset, le date medie non sempre rispecchiano il momento specifico della colonizzazione/decolonizzazione in quanto risultano da aggregazione. Maggiori informazioni sulla costruzione del dataset e sui metodi di aggregazioni sono nel pdf **“introducing COLDAT”** nella cartella **“COLDAT”**.

Per i contenuti storici e le pagine di dettaglio abbiamo utilizzato come fonte l'**Enciclopedia Britannica**.

---

# 6. Utilizzo dell’IA

Nella realizzazione del progetto abbiamo usato anche l’IA, in particolare **ChatGPT** e **Gemini** principalmente per operazioni di debugging e ottimizzazione.

---

# 7. Organizzazione del lavoro

Il progetto è stato realizzato grazie alla collaborazione di tutto il gruppo, con una suddivisione dei compiti basata sulle attitudini e sui punti di forza di ciascun componente. L’organizzazione del lavoro si è articolata in tre fasi principali:

1. Ideazione e definizione del concept del progetto  
2. Prototipazione, comprendente la realizzazione del mock-up e una prima fase di sviluppo informatico  
3. Messa a punto finale del progetto informatico  

Durante la prima e l’ultima fase, tutti i membri del gruppo hanno contribuito in modo omogeneo, collaborando su ogni aspetto del lavoro. L’ideazione e il concept sono stati sviluppati in presenza, con il contributo attivo dell’intero team; allo stesso modo, nella fase conclusiva di rifinitura del progetto informatico, ciascun membro ha partecipato in modo equilibrato allo sviluppo del codice.

La fase in cui la divisione dei ruoli è stata più specifica è stata la seconda, dedicata alla progettazione e realizzazione del prototipo, sviluppato in parallelo su Figma e tramite codice. In questo contesto, i membri del gruppo si sono suddivisi in base alle rispettive aree di competenza, concentrandosi su uno dei due ambiti principali:

- **Simone:** Responsabile della realizzazione tecnica, ha curato dall’inizio alla fine la scrittura del codice e l’implementazione delle funzionalità interattive del sito.
- **Nina:** Ha sviluppato tramite codice diverse funzionalità, assicurando che le soluzioni tecniche rispondessero agli obiettivi di conoscenza del progetto.
- **Silvia:** Ha gestito l’organizzazione generale del lavoro, definendo lo stile visivo e lavorando attivamente sia sul prototipo sia sul codice.
- **Martina:** Si è occupata della prototipazione su Figma e della stesura dei testi, fornendo inoltre supporto tecnico nella fase di programmazione.
- **Carla:** Si è occupata dello sviluppo del sistema visivo e prototipazione su Figma, stesura dei testi e supporto tecnico nella fase di programmazione.
- **Filippo:** Ha ideato la struttura narrativa dello SlideShow, si è occupato della struttura della pagina di dettaglio, implementando animazioni e interazioni.
- **Matilde:** Ha garantito un supporto trasversale a tutto il gruppo, assistendo nelle diverse attività e curando la revisione generale del progetto.