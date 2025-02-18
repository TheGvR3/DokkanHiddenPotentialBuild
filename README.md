# Dokkan Battle Hidden Abilities Database

Un database web interattivo per Dokkan Battle che permette di cercare e visualizzare i personaggi con le loro abilità nascoste (Hidden Potential).

## Descrizione

Questa applicazione web permette agli utenti di:
- Cercare personaggi per nome
- Filtrare per categoria (Super/Extreme)
- Filtrare per tipo (AGL/TEQ/INT/STR/PHY)
- Visualizzare i valori di Critical, Additional e Dodge per ogni personaggio
- Navigare tra le pagine di risultati

## Tecnologie Utilizzate

- **HTML5**
- **CSS3** (Tailwind CSS)
- **JavaScript** (jQuery)
- **Supabase** (Database)

## Struttura del Progetto

```
dokkan-database/
├── index.html        # Pagina principale
├── script.js         # Logica dell'applicazione
├── config.prod.js    # Configurazione per produzione
├── config.dev.js     # Configurazione per sviluppo (non committato)
├── img/              # Cartella immagini
│   ├── Pot_skill_critical.webp
│   ├── Pot_skill_additional.webp
│   └── Pot_skill_dodge.webp
└── README.md
```

## Configurazione

Il progetto utilizza due file di configurazione:
- `config.dev.js` per lo sviluppo locale
- `config.prod.js` per l'ambiente di produzione (GitHub Pages)

Entrambi i file devono avere questa struttura:

```javascript
window.ENV = {
    SUPABASE_URL: 'your-supabase-url',
    SUPABASE_KEY: 'your-supabase-anon-key'
};
```

## Installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/tuousername/dokkan-database.git
   ```
2. Crea un file `config.dev.js` con le tue credenziali Supabase.
3. Apri `index.html` nel tuo browser.

## Deployment

Il progetto è configurato per essere deployato su **GitHub Pages**. Il file `config.prod.js` verrà utilizzato automaticamente quando il sito è hostato su `github.io`.

## Funzionalità

### Ricerca
- Ricerca testuale per nome del personaggio
- Filtri per categoria (**Super/Extreme**)
- Filtri per tipo (**AGL/TEQ/INT/STR/PHY**)

### Paginazione
- 20 risultati per pagina
- Navigazione tra le pagine
- Indicatore del numero totale di pagine

### Visualizzazione
- Card per ogni personaggio con:
  - Immagine
  - Nome
  - Categoria
  - Tipo
  - Valori Hidden Potential (**Critical, Additional, Dodge**)

## Note Legali

**DRAGON BALL Z: DOKKAN BATTLE** è un marchio registrato di **BANDAI NAMCO Entertainment Inc.**  
Questo è un fan site non ufficiale senza scopo di lucro.  
Tutti i contenuti appartengono ai rispettivi proprietari.
