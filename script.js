$(document).ready(function() {
    // Verifica che le variabili ENV siano disponibili
    if (!window.configLoaded || !window.ENV) {
        console.error('Errore: config.js non caricato correttamente');
        return;
    }
    
    // Usa le variabili dall'oggetto ENV
    const SUPABASE_URL = window.ENV.SUPABASE_URL;
    const SUPABASE_KEY = window.ENV.SUPABASE_KEY;
    
    let currentPage = 0;
    const unitsPerPage = 20;
    let isLoading = false;
    let totalUnits = 0;

    function loadUnits(search = '', category = '', type = '', append = false) {
        if (isLoading) return;
        
        isLoading = true;
        let url = `${SUPABASE_URL}/rest/v1/dokkan_units`;
        const params = [];
        
        if (search) {
            params.push(`name=ilike.*${search}*`);
        }
        
        if (category) params.push(`category=eq.${category}`);
        if (type) params.push(`type=eq.${type}`);
        
        const offset = currentPage * unitsPerPage;
        const limit = unitsPerPage;
        
        params.push(`offset=${offset}`);
        params.push(`limit=${limit}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

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

    function updatePaginationControls() {
        const totalPages = Math.ceil(totalUnits / unitsPerPage);
        
        // Aggiorna entrambi i contatori di pagina
        $('#current-page-num, #current-page-num-top').text(currentPage + 1);
        $('#total-pages, #total-pages-top').text(totalPages);
        
        // Aggiorna lo stato di tutti i pulsanti di paginazione
        const isFirstPage = currentPage === 0;
        const isLastPage = (currentPage + 1) >= totalPages;
        
        $('#first-page, #first-page-top').prop('disabled', isFirstPage);
        $('#prev-page, #prev-page-top').prop('disabled', isFirstPage);
        $('#next-page, #next-page-top').prop('disabled', isLastPage);
        $('#last-page, #last-page-top').prop('disabled', isLastPage);
    }

    function displayUnits(units) {
        const grid = $('#units-grid');
        grid.empty();
        
        if (!units || units.length === 0) {
            // Aggiungi un messaggio 404 quando non ci sono risultati
            const notFoundMessage = $(`
                <div class="text-center py-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">404 Not Found</h3>
                    <p class="text-gray-600">Nessun risultato trovato per la tua ricerca</p>
                </div>
            `);
            grid.append(notFoundMessage);
            return;
        }
        
        units.forEach(unit => {
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

            const card = $(`
                <div class="bg-white p-4 rounded-lg shadow flex items-center">
                    <img src="img/${unit.image}" alt="${unit.name}" class="w-24 h-24 object-contain rounded-lg mr-4">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg">${unit.name}</h3>
                        <div class="flex gap-2 mt-2">
                            <span class="px-2 py-1 rounded ${unit.category === 'Super' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}">${unit.category}</span>
                            <span class="px-2 py-1 rounded bg-gray-100 text-gray-800">${unit.type}</span>
                        </div>
                        <div class="flex gap-4 mt-2">
                            <div class="bg-gray-50 p-1 rounded flex items-center gap-1">
                                <img src="img/Pot_skill_critical.webp" alt="Crit" class="w-6 h-6">
                                ${unit.crit}
                            </div>
                            <div class="bg-gray-50 p-1 rounded flex items-center gap-1">
                                <img src="img/Pot_skill_additional.webp" alt="Add" class="w-6 h-6">
                                ${unit.add}
                            </div>
                            <div class="bg-gray-50 p-1 rounded flex items-center gap-1">
                                <img src="img/Pot_skill_dodge.webp" alt="Escape" class="w-6 h-6">
                                ${unit.esc}
                            </div>
                        </div>
                    </div>
                </div>
            `);
            grid.append(card);
        });
    }

    // Aggiungi gli eventi per i pulsanti di paginazione (per entrambi i set)
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

    // Modifica l'evento per il pulsante di ricerca
    $('#search-button').on('click', function() {
        currentPage = 0;
        const search = $('#search').val().trim(); // Rimuove spazi extra
        const category = $('#category-filter').val();
        const type = $('#type-filter').val();
        loadUnits(search, category, type, false);
    });

    // Modifica anche l'evento keypress per la ricerca con Enter
    $('#search').on('keypress', function(e) {
        if (e.which === 13) {  // 13 è il codice del tasto Enter
            currentPage = 0;
            const search = $(this).val().trim();
            const category = $('#category-filter').val();
            const type = $('#type-filter').val();
            loadUnits(search, category, type, false);
        }
    });

    $('#category-filter, #type-filter').on('change', function() {
        currentPage = 0;
        const search = $('#search').val();
        const category = $('#category-filter').val();
        const type = $('#type-filter').val();
        loadUnits(search, category, type, false);
    });

    // Carica le unità all'avvio della pagina
    loadUnits();
}); 