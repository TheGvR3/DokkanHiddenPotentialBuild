$(document).ready(function() {
    // Verifica il caricamento corretto del file di configurazione
    if (!window.configLoaded || !window.ENV) {
        console.error('Errore: config.js non caricato correttamente');
        return;
    }
    
    // Inizializzazione delle variabili di configurazione Supabase
    const SUPABASE_URL = window.ENV.SUPABASE_URL;
    const SUPABASE_KEY = window.ENV.SUPABASE_KEY;
    
    // Variabili per la gestione della paginazione
    let currentPage = 0;              // Pagina corrente (0-based)
    const unitsPerPage = 20;          // Numero di unità per pagina
    let isLoading = false;            // Flag per evitare richieste multiple
    let totalUnits = 0;               // Totale delle unità nel database

    /**
     * Carica le unità dal database con i filtri specificati
     * @param {string} search - Testo di ricerca per il nome
     * @param {string} category - Filtro per categoria (Super/Extreme)
     * @param {string} type - Filtro per tipo (AGL/TEQ/INT/STR/PHY)
     * @param {boolean} append - Se true, aggiunge i risultati invece di sostituirli
     */
    function loadUnits(search = '', category = '', type = '', append = false) {
        // Evita richieste multiple mentre sta caricando
        if (isLoading) return;
        
        isLoading = true;
        let url = `${SUPABASE_URL}/rest/v1/dokkan_units`;
        const params = [];
        
        // Costruzione dei parametri di ricerca
        if (search) {
            params.push(`name=ilike.*${search}*`);
        }
        
        if (category) params.push(`category=eq.${category}`);
        if (type) params.push(`type=eq.${type}`);
        
        // Modifica l'ordinamento per mostrare prima i più recenti
        params.push('order=id.desc'); // Ordina per ID decrescente (dal più alto al più basso)
        
        // Calcolo offset per la paginazione
        const offset = currentPage * unitsPerPage;
        const limit = unitsPerPage;
        
        params.push(`offset=${offset}`);
        params.push(`limit=${limit}`);

        // Aggiunge i parametri all'URL
        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        // Chiamata AJAX a Supabase
        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Range': `${offset}-${offset + limit - 1}`,
                'Prefer': 'count=exact'
            },
            success: function(response, status, xhr) {
                // Estrae il numero totale di risultati dall'header
                const range = xhr.getResponseHeader('Content-Range');
                if (range) {
                    const [_, total] = range.split('/');
                    totalUnits = parseInt(total);
                    updatePaginationControls();
                }
                
                displayUnits(response);
                isLoading = false;
            },
            error: function(xhr, status, error) {
                console.error('Errore nella richiesta:', error);
                console.log('Status:', status);
                console.log('Response:', xhr.responseText);
                isLoading = false;
            }
        });
    }

    /**
     * Aggiorna i controlli di paginazione in base al numero totale di unità
     */
    function updatePaginationControls() {
        const totalPages = Math.ceil(totalUnits / unitsPerPage);
        
        // Aggiorna i contatori di pagina in alto e in basso
        $('#current-page-num, #current-page-num-top').text(currentPage + 1);
        $('#total-pages, #total-pages-top').text(totalPages);
        
        // Gestisce lo stato dei pulsanti di navigazione
        const isFirstPage = currentPage === 0;
        const isLastPage = (currentPage + 1) >= totalPages;
        
        // Disabilita/abilita i pulsanti appropriati
        $('#first-page, #first-page-top').prop('disabled', isFirstPage);
        $('#prev-page, #prev-page-top').prop('disabled', isFirstPage);
        $('#next-page, #next-page-top').prop('disabled', isLastPage);
        $('#last-page, #last-page-top').prop('disabled', isLastPage);
    }

    /**
     * Visualizza le unità nella griglia
     * @param {Array} units - Array di unità da visualizzare
     */
    function displayUnits(units) {
        const grid = $('#units-grid');
        grid.empty();
        
        // Mostra messaggio 404 se non ci sono risultati
        if (!units || units.length === 0) {
            const notFoundMessage = $(`
                <div class="text-center py-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">404 Not Found</h3>
                    <p class="text-gray-600">Nessun risultato trovato per la tua ricerca</p>
                </div>
            `);
            grid.append(notFoundMessage);
            return;
        }
        
        // Crea e aggiunge le card per ogni unità
        units.forEach(unit => {
            // Definizione dei colori per tipo e categoria
            const typeColors = {
                'AGL': 'bg-blue-100 text-blue-800',
                'TEQ': 'bg-green-100 text-green-800',
                'INT': 'bg-purple-100 text-purple-800',
                'STR': 'bg-red-100 text-red-800',
                'PHY': 'bg-yellow-100 text-yellow-800'
            };

            const categoryColors = {
                'Super': 'bg-orange-100 text-orange-800',
                'Extreme': 'bg-gray-100 text-gray-800'
            };

            // Creazione della card con Tailwind CSS
            const card = $(`
                <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center">
                    <div class="relative mr-4">
                        <img src="img/Units/${unit.image}" 
                             alt="${unit.name}" 
                             class="w-24 h-24 object-contain rounded-lg"
                        >
                        <img src="img/Type/${unit.category}/${unit.category[0]}${unit.type}_icon.webp" 
                             alt="${unit.category} ${unit.type}" 
                             class="w-8 h-8 absolute -bottom-1 -right-0"
                        >
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-lg mb-2">${unit.name}</h3>
                        <div class="flex gap-4">
                            <div class="bg-gray-50 p-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200">
                                <img src="img/Skill/Pot_skill_critical.webp" alt="Crit" class="w-8 h-8">
                                <span class="font-medium">${unit.crit}</span>
                            </div>
                            <div class="bg-gray-50 p-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200">
                                <img src="img/Skill/Pot_skill_additional.webp" alt="Add" class="w-8 h-8">
                                <span class="font-medium">${unit.add}</span>
                            </div>
                            <div class="bg-gray-50 p-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200">
                                <img src="img/Skill/Pot_skill_dodge.webp" alt="Escape" class="w-8 h-8">
                                <span class="font-medium">${unit.esc}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            grid.append(card);
        });
    }

    // Event Listeners per la paginazione
    $('#first-page, #first-page-top').on('click', function() {
        if (currentPage !== 0) {
            currentPage = 0;
            const search = $('#search').val();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    $('#prev-page, #prev-page-top').on('click', function() {
        if (currentPage > 0) {
            currentPage--;
            const search = $('#search').val();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    $('#next-page, #next-page-top').on('click', function() {
        const totalPages = Math.ceil(totalUnits / unitsPerPage);
        if (currentPage + 1 < totalPages) {
            currentPage++;
            const search = $('#search').val();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    $('#last-page, #last-page-top').on('click', function() {
        const totalPages = Math.ceil(totalUnits / unitsPerPage);
        if (currentPage !== totalPages - 1) {
            currentPage = totalPages - 1;
            const search = $('#search').val();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    // Event Listeners per la ricerca
    $('#search-button').on('click', function() {
        currentPage = 0;
        const search = $('#search').val().trim(); // Rimuove spazi extra
        const category = $('#category-filter').val();
        const type = $('#type-filter').val();
        loadUnits(search, category, type, false);
    });

    // Gestione della ricerca con il tasto Enter
    $('#search').on('keypress', function(e) {
        if (e.which === 13) {  // 13 è il codice del tasto Enter
            currentPage = 0;
            const search = $(this).val().trim();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    // Event Listener per i filtri di categoria e tipo
    $('#category-filter, #type-filter').on('change', function() {
        currentPage = 0;
        const search = $('#search').val();
        const category = $('#category-filter').val();
        const type = $('#type-filter').val();
        loadUnits(search, category, type, false);
    });

    // Caricamento iniziale delle unità
    loadUnits();
}); 