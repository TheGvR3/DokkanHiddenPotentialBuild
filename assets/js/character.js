$(document).ready(function () {
    if (!window.configLoaded || !window.ENV) {
        console.error('Error: config.js not loaded correctly');
        return;
    }

    const SUPABASE_URL = window.ENV.SUPABASE_URL;
    const SUPABASE_KEY = window.ENV.SUPABASE_KEY;

    // Get character ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');

    if (!characterId) {
        $('#character-details').html('<p class="text-red-600">Error: No character ID specified</p>');
        return;
    }

    // Load character details
    function loadCharacterDetails(id) {
        $.ajax({
            url: `${SUPABASE_URL}/rest/v1/dokkan_units?id=eq.${id}`,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            success: function (response) {
                if (response && response.length > 0) {
                    const character = response[0];
                    displayCharacterDetails(character);
                } else {
                    $('#character-details').html('<p class="text-red-600">Character not found</p>');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error in request:', error);
                $('#character-details').html('<p class="text-red-600">Error loading character details</p>');
            }
        });
    }

    function displayCharacterDetails(character) {
        const detailsHtml = `
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Character image and type -->
                <div class="relative mx-auto lg:mx-0">
                    <img src="../img/Units/${character.category}/${character.type}/${character.image}" 
                         alt="${character.name}"
                         class="w-48 h-48 md:w-64 md:h-64 object-contain rounded-lg shadow-lg"
                    >
                </div>

                <!-- Character info -->
                <div class="flex-1">
                    <h1 class="text-2xl md:text-3xl font-bold mb-4 text-center lg:text-left">${character.name}</h1>
                    
                    <!-- Info boxes in grid -->
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        <div class="bg-gray-50 rounded-lg p-3 flex flex-col items-center text-center">
                            <h2 class="font-semibold text-sm mb-1">Category</h2>
                            <p class="text-gray-800">${character.category}</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 flex flex-col items-center text-center">
                            <h2 class="font-semibold text-sm mb-1">Type</h2>
                            <p class="text-gray-800">${character.type}</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-3 flex flex-col items-center text-center">
                        <h2 class="font-semibold text-sm mb-1">EZA</h2>
                        ${character.seza ? `
                            <img src="../img/seza.webp" alt="SEZA" class="w-30 h-15 -bottom-2 -right-6">
                        ` : character.eza ? `
                            <img src="../img/EZA.webp" alt="EZA" class="w-8 h-8 -bottom-10 -right-1 ">
                        ` : ''}
                        </div>
                    </div>

                    <!-- Hidden Potential section -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h2 class="text-xl font-bold mb-4 text-center lg:text-left">Hidden Potential Build</h2>
                        ${character.crit === 0 && character.add === 0 && character.esc === 0 ? `
                            <p class="text-red-600 font-bold text-lg text-center">Wait for EZA</p>
                        ` : `
                            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                                <div class="bg-white rounded-lg p-2 sm:p-3 flex flex-col items-center text-center">
                                    <div class="mb-1 sm:mb-2">
                                        <img src="../img/Skill/Pot_skill_critical.webp" alt="Critical" class="w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10">
                                    </div>
                                    <p class="font-bold text-base sm:text-lg">${character.crit}</p>
                                    <p class="text-[10px] sm:text-xs text-gray-600">Critical</p>
                                </div>
                                <div class="bg-white rounded-lg p-2 sm:p-3 flex flex-col items-center text-center">
                                    <div class="mb-1 sm:mb-2">
                                        <img src="../img/Skill/Pot_skill_additional.webp" alt="Additional" class="w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10">
                                    </div>
                                    <p class="font-bold text-base sm:text-lg">${character.add}</p>
                                    <p class="text-[10px] sm:text-xs text-gray-600">Additional</p>
                                </div>
                                <div class="bg-white rounded-lg p-2 sm:p-3 flex flex-col items-center text-center">
                                    <div class="mb-1 sm:mb-2">
                                        <img src="../img/Skill/Pot_skill_dodge.webp" alt="Dodge" class="w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10">
                                    </div>
                                    <p class="font-bold text-base sm:text-lg">${character.esc}</p>
                                    <p class="text-[10px] sm:text-xs text-gray-600">Dodge</p>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        $('#character-details').html(detailsHtml);
    }

    // Load character details on page load
    loadCharacterDetails(characterId);
});