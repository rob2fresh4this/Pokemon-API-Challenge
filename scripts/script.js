import { savedToLocalStorage, getFromLocalStorage, removeFromLocalStorage } from "./local_storage.js";

const submit = document.getElementById('submit');
const userInput = document.getElementById('userinput');
const infoContainer = document.getElementById('infoContainer');
const favoriteBtn = document.getElementById('favorite-btn');
const randomBtn = document.getElementById('random');
const displayFavorites = document.getElementById('displayFav');

async function getPokemonData(name) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!response.ok) {
        console.log('Pokemon not found');
        infoContainer.innerHTML = `<div class="flex justify-center text-white"><p>Pokémon not found</p></div>`;
        return;
    }
    const data = await response.json();
    return data;
}

async function getLocationData(pokemonId) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`);
    const data = await response.json();
    return data;
}

async function getEvolutionChain(pokemonId) {
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    const speciesData = await speciesResponse.json();
    const evolutionResponse = await fetch(speciesData.evolution_chain.url);
    const evolutionData = await evolutionResponse.json();
    return extractEvolutionChain(evolutionData.chain);
}

function extractEvolutionChain(chain) {
    let evolutionStages = [];
    function getEvolutionStages(evolutionChain) {
        if (!evolutionChain) return;
        evolutionStages.push(evolutionChain.species.name); // Add current evolution stage
        if (evolutionChain.evolves_to.length > 0) {
            getEvolutionStages(evolutionChain.evolves_to[0]); // Get the next stage
        }
    }
    getEvolutionStages(chain);
    return evolutionStages.length > 1 ? evolutionStages.join(" → ") : "N/A"; // If only one stage, return N/A
}

function updateInfoContainer(data, locationInfo, evolutionPath) {
    infoContainer.innerHTML = `
        <div class="flex flex-col lg:flex-row justify-between w-[90%] lg:w-[80%] m-auto">
            <div class="w-[100%] lg:w-[20%] flex flex-row lg:flex-col  justify-between">
                <img class="w-[50%] lg:w-full aspect-square border-2 border-[#B3A125]" src="${data.sprites.other["official-artwork"].front_default}" alt="${data.name}">
                <img class="w-[50%] lg:w-full aspect-square border-2 border-[#B3A125]" src="${data.sprites.other["official-artwork"].front_shiny}" alt="${data.name} Shiny">
            </div>
            <div class="w-[100%] lg:w-[79.5%] p-[40px] flex flex-col justify-between text-[white]" style="background-color: #4556D0;">
                <p id="pokemonName">Name: ${data.name}</p>
                <p>ID: #${data.id}</p>
                <p>Height: ${data.height}</p>
                <p>Weight: ${data.weight}</p>
                <p>Base Experience: ${data.base_experience}</p>
                <p>Abilities: ${data.abilities.map(ability => ability.ability.name).join(', ')}</p>
                <p>Types: ${data.types.map(type => type.type.name).join(', ')}</p>
                <div class="w-[100%] h-[100px] overflow-y-auto border p-4">
                    <p>Moves: ${data.moves.map(move => move.move.name).join(', ')}</p>
                </div>
                ${locationInfo}
                <p>Evolutionary Path: ${evolutionPath}</p>
            </div>
        </div>
    `;
}

submit.addEventListener('click', async function () {
    const pokemonName = userInput.value.trim().toLowerCase();
    if (!pokemonName) return;
    const data = await getPokemonData(pokemonName);
    if (data.id > 649) {
        console.log('Pokemon not found in Gen 1-5');
        infoContainer.innerHTML = `<div class="flex justify-center text-white"><p>Pokémon not found in Gen 1-5</p></div>`;
        return;
    }

    const locations = await getLocationData(data.id);
    let locationInfo = locations.length > 0
        ? `<p>Location: ${locations[0].location_area.name}</p>`
        : `<p>Location data not available for this Pokémon.</p>`;
    const evolutionPath = await getEvolutionChain(data.id);
    updateInfoContainer(data, locationInfo, evolutionPath);
    updateFavoriteButton(data.name.toLowerCase());
    userInput.value = '';
});

randomBtn.addEventListener('click', async function () {
    const randomId = Math.floor(Math.random() * 649) + 1;
    const data = await getPokemonData(randomId);
    const locations = await getLocationData(randomId);
    let locationInfo = locations.length > 0
        ? `<p>Location: ${locations[0].location_area.name}</p>`
        : `<p>Location data not available for this Pokémon.</p>`;
    const evolutionPath = await getEvolutionChain(data.id);
    updateInfoContainer(data, locationInfo, evolutionPath);
    updateFavoriteButton(data.name.toLowerCase());
});

displayFavorites.addEventListener('click', function () {
    console.log('Display favorites button clicked');
    const favorites = getFromLocalStorage();
    if (favorites.length === 0) {
        infoContainer.innerHTML = `<p class="flex justify-center mb-[10px] text-[white]">You have no favorite Pokémon.</p>`;
        return;
    }

    let favoritePokemon = `<div class="flex justify-center mb-[10px] text-[white]"><h1>Your Favorite Pokémon</h1></div>`;
    favorites.forEach(pokemon => {
        getPokemonData(pokemon).then(data => {
            favoritePokemon += `
                <div class="flex items-center justify-between border-b p-4 w-[90%] md:w-[40%] m-auto bg-[#4556D0]">
                    <h2 class="text-[white]">${data.name}</h2>
                    <div>
                    <button class="bg-red-500 text-white p-2 rounded-md hover:bg-red-700 remove_from_favorites" data-name="${data.name}">Remove</button>
                    <button class="bg-green-500 text-white p-2 rounded-md hover:bg-green-700 go_to_that_pokemon" data-name="${data.name}">Go</button>
                    </div>
                </div>
            `;
            infoContainer.innerHTML = favoritePokemon;// update the HTML
            const goButtons = infoContainer.querySelectorAll('.go_to_that_pokemon');
            goButtons.forEach(goButton => {
                goButton.addEventListener('click', function () {
                    const pokemonName = goButton.getAttribute('data-name');
                    userInput.value = pokemonName;
                    submit.click();
                });
            });
            const removeButtons = infoContainer.querySelectorAll('.remove_from_favorites');
            removeButtons.forEach(removeButton => {
                removeButton.addEventListener('click', function () {
                    const pokemonName = removeButton.getAttribute('data-name');
                    removeFromLocalStorage(pokemonName);
                    removeButton.parentElement.parentElement.remove();
                });
            });
        });
    });
});

favoriteBtn.addEventListener('click', function () {
    console.log('Favorite button clicked');
    const pokemon = infoContainer.querySelector('#pokemonName')?.textContent.split(': ')[1].toLowerCase();
    if (!pokemon) return;
    let favorites = getFromLocalStorage();
    if (favorites.includes(pokemon)) {
        removeFromLocalStorage(pokemon);
    } else {
        if (favorites.length >= 5) {
            console.log("You can only have 5 favorite Pokémon.");
            alert("You can only have 5 favorite Pokémon.");
            return;
        }
        savedToLocalStorage(pokemon);
    }
    updateFavoriteButton(pokemon);
});

userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        submit.click();
    }
});

function updateFavoriteButton(pokemon) {
    let favorites = getFromLocalStorage();

    if (favorites.includes(pokemon)) {
        favoriteBtn.innerHTML = `<svg class="w-[50px] h-[50px] fill-yellow-500" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>`;
    } else {
        favoriteBtn.innerHTML = `<svg class="w-[50px] h-[50px] fill-[#D9D9D9]" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>`;
    }
}
randomBtn.click(); // Load a random Pokémon on page load