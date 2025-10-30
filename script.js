document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const movieList = document.getElementById('movie-list');
    const playerSection = document.getElementById('player');
    const vidkingPlayer = document.getElementById('vidking-player');

    let currentMovieId = null;

    // Handle URL parameters on load
    const urlParams = new URLSearchParams(window.location.search);
    const movieIdFromUrl = urlParams.get('movie');
    if (movieIdFromUrl) {
        playMovie(movieIdFromUrl);
    }

    // Search button click
    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        playerSection.style.display = 'none';
        document.getElementById('results').style.display = 'block';
        if (query) {
            if (query.startsWith('https://www.themoviedb.org/movie/')) {
                const movieId = extractMovieIdFromUrl(query);
                if (movieId) {
                    playMovie(movieId);
                } else {
                    alert('Invalid TMDB URL format.');
                }
            } else {
                searchMovies(query);
            }
        }
    });

    // Enter key on input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    function extractMovieIdFromUrl(url) {
        const match = url.match(/\/movie\/(\d+)/);
        return match ? match[1] : null;
    }

    async function searchMovies(query) {
        try {
            const response = await fetch(`/.netlify/functions/search-movies?query=${encodeURIComponent(query)}`);
            const movies = await response.json();
            displayMovies(movies);
        } catch (error) {
            console.error('Error searching movies:', error);
            alert('Error searching movies. Please try again later.');
        }
    }

    function displayMovies(movies) {
        movieList.innerHTML = '';
        const resultsHeading = document.createElement('h2');
        resultsHeading.textContent = 'Search Results';
        resultsHeading.style.textAlign = 'center';
        resultsHeading.style.marginBottom = '20px';
        movieList.appendChild(resultsHeading);
        movies.forEach(movie => {
            const movieDiv = document.createElement('div');
            movieDiv.className = 'movie-item';
            const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
            movieDiv.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w154${movie.poster_path || ''}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Image'">
                <p>${movie.title} (${releaseYear})</p>
            `;
            movieDiv.addEventListener('click', function() {
                playMovie(movie.id);
            });
            movieList.appendChild(movieDiv);
        });
    }

    function playMovie(movieId) {
        currentMovieId = movieId;
        const embedUrl = `https://www.vidking.net/embed/movie/${movieId}`;
        vidkingPlayer.src = embedUrl;
        document.getElementById('results').style.display = 'none';
        playerSection.style.display = 'block';
        document.getElementById('player-title').style.display = 'block';
        vidkingPlayer.style.display = 'block';
        // Update URL
        const newUrl = `${window.location.origin}${window.location.pathname}?movie=${movieId}`;
        window.history.pushState({movieId: movieId}, '', newUrl);
    }
});
