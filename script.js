document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const trendingList = document.getElementById('trending-list');
    const movieList = document.getElementById('movie-list');
    const searchResultsSection = document.getElementById('search-results');
    const searchResultsHeading = document.getElementById('search-results-heading');
    const playerSection = document.getElementById('player');
    const playerContainer = document.getElementById('player-container');
    const vidkingPlayer = document.getElementById('vidking-player');
    const playerOverlay = document.getElementById('player-overlay');

    let currentMovieId = null;

    // Fetch and display trending movies on page load
    fetchTrendingMovies();

    const urlParams = new URLSearchParams(window.location.search);
    const movieIdFromUrl = urlParams.get('movie');
    if (movieIdFromUrl) {
        playMovie(movieIdFromUrl);
    }

    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        playerSection.style.display = 'none';
        searchResultsSection.style.display = 'block'; // Show search results section
        searchResultsHeading.style.display = 'block'; // Show search results heading
        trendingList.parentElement.style.display = 'none'; // Hide trending section when searching

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

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    function extractMovieIdFromUrl(url) {
        const match = url.match(/\/movie\/(\d+)/);
        return match ? match[1] : null;
    }

    async function fetchTrendingMovies() {
        try {
            // Assuming a Netlify function for trending movies, or adapting the existing one
            const response = await fetch(`/.netlify/functions/search-movies?trending=true`);
            const movies = await response.json();
            displayMovies(movies, trendingList);
        } catch (error) {
            console.error('Error fetching trending movies:', error);
            // Optionally display an error message to the user
        }
    }

    async function searchMovies(query) {
        try {
            const response = await fetch(`/.netlify/functions/search-movies?query=${encodeURIComponent(query)}`);
            const movies = await response.json();
            displayMovies(movies, movieList);
        } catch (error) {
            console.error('Error searching movies:', error);
            alert('Error searching movies. Please try again later.');
        }
    }

    function displayMovies(movies, containerElement) {
        containerElement.innerHTML = ''; // Clear previous movies
        if (movies.length === 0) {
            containerElement.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">No movies found.</p>';
            return;
        }

        movies.forEach(movie => {
            const movieDiv = document.createElement('div');
            movieDiv.className = 'movie-item';
            const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
            movieDiv.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w185${movie.poster_path || ''}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/185x278?text=No+Image'">
                <p>${movie.title} (${releaseYear})</p>
            `;
            movieDiv.addEventListener('click', function() {
                playMovie(movie.id);
            });
            containerElement.appendChild(movieDiv);
        });
    }

    function playMovie(movieId) {
        currentMovieId = movieId;
        const embedUrl = `https://www.vidking.net/embed/movie/${movieId}`;
        vidkingPlayer.src = embedUrl;
        searchResultsSection.style.display = 'none'; // Hide search results
        trendingList.parentElement.style.display = 'none'; // Hide trending section
        playerSection.style.display = 'block';
        document.getElementById('player-title').style.display = 'block';
        playerContainer.style.display = 'block';
        playerOverlay.style.display = 'flex';

        // Adjust player dimensions based on screen size
        if (window.innerWidth >= 1024) {
            playerContainer.style.maxWidth = '1200px';
            playerContainer.style.height = '675px';
        } else {
            playerContainer.style.maxWidth = '95vw';
            playerContainer.style.height = '240px';
        }
        vidkingPlayer.style.width = '100%';
        vidkingPlayer.style.height = '100%';

        const newUrl = `${window.location.origin}${window.location.pathname}?movie=${movieId}`;
        window.history.pushState({movieId: movieId}, '', newUrl);
    }

    playerOverlay.addEventListener('click', function() {
        playerOverlay.style.display = 'none';
    });
});
