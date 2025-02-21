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
    const unitsPerPage = 21;          // Numero di unità per pagina
    let isLoading = false;            // Flag per evitare richieste multiple
    let totalUnits = 0;               // Totale delle unità nel database
    let currentView = 'grid'; // 'grid' o 'list'

    /**
     * Carica le unità dal database con i filtri specificati
     * @param {string} search - Testo di ricerca per il nome
     * @param {string} category - Filtro per categoria (Super/Extreme)
     * @param {string} type - Filtro per tipo (AGL/TEQ/INT/STR/PHY)
     * @param {boolean} append - Se true, aggiunge i risultati invece di sostituirli
     */
    function loadUnits(search = '', category = '', type = '', append = false) {
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
        
        // Aggiungi il filtro per EZA/SEZA
        const ezaFilter = $('#eza-filter').val();
        if (ezaFilter) {
            switch(ezaFilter) {
                case 'eza':
                    params.push('eza=eq.true'); // Solo EZA
                    break;
                case 'seza':
                    params.push('seza=eq.true'); // Solo SEZA
                    break;
                case 'both':
                    params.push('or=(eza.eq.true,seza.eq.true)'); // Mostra tutti quelli con EZA o SEZA
                    break;
                case 'no':
                    params.push('or=(and(eza.eq.false,seza.eq.false),and(eza.is.null,seza.is.null))'); // Né EZA né SEZA o campi null
                    break;
            }
        }
        
        // Modifica l'ordinamento per mostrare prima i più recenti
        params.push('order=id.desc');
        
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
        
        if (!units || units.length === 0) {
            const notFoundMessage = $(`
                <div class="text-center py-8 col-span-full">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">404 Not Found</h3>
                    <p class="text-gray-600">No results found for your search</p>
                </div>
            `);
            grid.append(notFoundMessage);
            return;
        }

        units.forEach(unit => {
            if (currentView === 'grid') {
                // Vista a griglia - solo immagine
                const card = $(`
                    <div class="bg-white p-2 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                         onclick="window.location.href='pages/character.html?id=${unit.id}'">
                        <div class="relative aspect-square">
                            <img src="img/Units/${unit.category}/${unit.type}/${unit.image}" 
                                alt="${unit.name}" 
                                class="w-full h-full object-contain rounded-lg"
                            >
                            ${unit.seza ? `
                                <div class="sm:hidden">
                                    <!-- Versione mobile -->
                                    <img src="img/seza.webp" alt="SEZA" class="w-20 h-10 absolute bottom-0 right-0 translate-x-5 translate-y-1">
                                </div>
                                <div class="hidden sm:block">
                                    <!-- Versione desktop -->
                                    <img src="img/seza.webp" alt="SEZA" class="w-27 h-13 absolute bottom-0 right-0 translate-x-6 translate-y-2">
                                </div>
                            ` : unit.eza ? `
                                <div class="sm:hidden">
                                    <!-- Versione mobile -->
                                    <img src="img/EZA.webp" alt="EZA" class="w-5 h-5 absolute bottom-1 right-2">
                                </div>
                                <div class="hidden sm:block">
                                    <!-- Versione desktop -->
                                    <img src="img/EZA.webp" alt="EZA" class="w-7 h-7 absolute bottom-1 right-0 -translate-x-3">
                                </div>
                            ` : unit.new ? `
                                <div class="sm:hidden">
                                    <!-- Versione mobile -->
                                    <img src="img/new.webp" alt="NEW" class="w-12 h-12 absolute bottom-0 right-1 translate-y-3">
                                </div>
                                <div class="hidden sm:block">
                                    <!-- Versione desktop -->
                                    <img src="img/new.webp" alt="NEW" class="w-20 h-20 absolute bottom-0 right-1 translate-y-6">
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
                grid.append(card);
            } else {
                // Vista a lista - layout completo
                const card = $(`
                    <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center cursor-pointer"
                         onclick="window.location.href='pages/character.html?id=${unit.id}'">
                        <div class="relative mr-4">
                            <img src="img/Units/${unit.category}/${unit.type}/${unit.image}" 
                                alt="${unit.name}" 
                                class="w-24 h-24 object-contain rounded-lg"
                            >
                            ${unit.seza ? `
                                <img src="img/seza.webp" alt="SEZA" class="w-20 h-10 absolute -bottom-2 -right-6">
                            ` : unit.eza ? `
                                <img src="img/EZA.webp" alt="EZA" class="w-5 h-5 absolute -bottom-0 -right-0 -translate-x-1 -translate-y-1">
                            ` : unit.new ? `
                                <img src="img/new.webp" alt="NEW" class="w-10 h-10 absolute -bottom-2 -right-0 -translate-x-1">
                            ` : ''}
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-lg mb-2">${unit.name}</h3>
                            ${unit.crit === 0 && unit.add === 0 && unit.esc === 0 ? `
                                <div class="text-red-600 font-bold text-lg">
                                    Wait for EZA
                                </div>
                            ` : `
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
                            `}
                        </div>
                    </div>
                `);
                grid.append(card);
            }
        });

        updateViewButtons();
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

    // Aggiungi l'event listener per il nuovo filtro
    $('#eza-filter').on('change', function() {
        currentPage = 0;
        const search = $('#search').val();
        const category = $('#category-filter').val();
        const type = $('#type-filter').val();
        loadUnits(search, category, type, false);
    });

    // Aggiungi questo con gli altri event listeners
    $('#clear-filters').on('click', function() {
        // Reset all filters
        $('#search').val('');
        $('#category-filter').val('');
        $('#type-filter').val('');
        $('#eza-filter').val('');
        
        // Reset page
        currentPage = 0;
        
        // Reload units
        loadUnits('', '', '', false);
    });

    // Aggiungi questi event listeners dopo gli altri
    $('#grid-view').on('click', function() {
        if (currentView !== 'grid') {
            currentView = 'grid';
            updateViewButtons();
            const search = $('#search').val();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    $('#list-view').on('click', function() {
        if (currentView !== 'list') {
            currentView = 'list';
            updateViewButtons();
            const search = $('#search').val();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    function updateViewButtons() {
        if (currentView === 'grid') {
            $('#grid-view').addClass('bg-blue-500 text-white').removeClass('hover:bg-blue-500 hover:text-white');
            $('#list-view').removeClass('bg-blue-500 text-white').addClass('hover:bg-blue-500 hover:text-white');
            $('#units-grid').removeClass('grid-cols-1').addClass('grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4');
        } else {
            $('#list-view').addClass('bg-blue-500 text-white').removeClass('hover:bg-blue-500 hover:text-white');
            $('#grid-view').removeClass('bg-blue-500 text-white').addClass('hover:bg-blue-500 hover:text-white');
            $('#units-grid').removeClass('grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6').addClass('grid-cols-1 gap-4');
        }
    }

    // Caricamento iniziale delle unità
    loadUnits();
}); 