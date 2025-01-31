function savedToLocalStorage(pokemon) {
    console.log(`You saved this Pokémon to your favorites: ${pokemon}`);
    let favoriteArr = getFromLocalStorage();
    const normalizedPokemon = pokemon.toLowerCase(); // Normalize the Pokémon name
    if (favoriteArr.includes(normalizedPokemon)) {
        console.log(`${normalizedPokemon} is already in your favorites.`);
        return; // Prevent duplicates
    }
    if (favoriteArr.length >= 5) {
        console.log("You can only have 5 favorite Pokémon.");
        return; // Prevent adding more than 5
    }
    favoriteArr.push(normalizedPokemon);
    localStorage.setItem('pokemon_favorites', JSON.stringify(favoriteArr)); // Renamed key
}

function getFromLocalStorage() {
    return JSON.parse(localStorage.getItem('pokemon_favorites')) || []; // Renamed key
}

function removeFromLocalStorage(pokemon) {
    let favoriteArr = getFromLocalStorage();
    const normalizedPokemon = pokemon.toLowerCase(); // Normalize the Pokémon name
    
    let index = favoriteArr.indexOf(normalizedPokemon);
    if (index !== -1) {
        favoriteArr.splice(index, 1);
        localStorage.setItem('pokemon_favorites', JSON.stringify(favoriteArr)); // Renamed key
        console.log(`You removed ${normalizedPokemon} from favorites.`);
    } else {
        console.log(`${normalizedPokemon} is not in favorites.`);
    }
}

export { savedToLocalStorage, getFromLocalStorage, removeFromLocalStorage };
