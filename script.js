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

    fetchTrendingMovies();

    const urlParams = new URLSearchParams(window.location.search);
    const movieIdFromUrl = urlParams.get('movie');
    if (movieIdFromUrl) {
        playMovie(movieIdFromUrl);
    }

    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        playerSection.style.display = 'none';
        searchResultsSection.style.display = 'block';
        searchResultsHeading.style.display = 'block';
        trendingList.parentElement.style.display = 'none';

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
            const response = await fetch(`/.netlify/functions/search-movies?trending=true`);
            const movies = await response.json();
            displayMovies(movies, trendingList);
        } catch (error) {
            console.error('Error fetching trending movies:', error);
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

    const originalDisplayMovies = function(movies, containerElement) {
        containerElement.innerHTML = '';
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
    };

    function displayMovies(movies, containerElement) {
        originalDisplayMovies(movies, containerElement);

        containerElement.querySelectorAll('.movie-item').forEach(movieDiv => {
            movieDiv.classList.add('movie-item--border-glow');

            let isHovered = false;
            let particles = [];
            let timeouts = [];
            let magnetismAnimation = null;

            const clearAllParticles = () => {
                timeouts.forEach(clearTimeout);
                timeouts = [];
                if (magnetismAnimation) gsap.killTweensOf(magnetismAnimation);
                particles.forEach(particle => {
                    gsap.to(particle, {
                        scale: 0,
                        opacity: 0,
                        duration: 0.3,
                        ease: 'back.in(1.7)',
                        onComplete: () => {
                            particle.parentNode?.removeChild(particle);
                        }
                    });
                });
                particles = [];
            };

            const animateParticles = () => {
                if (!movieDiv || !isHovered) return;

                const { width, height } = movieDiv.getBoundingClientRect();
                const memoizedParticles = Array.from({ length: DEFAULT_PARTICLE_COUNT }, () =>
                    createParticleElement(Math.random() * width, Math.random() * height, DEFAULT_GLOW_COLOR_RGB)
                );

                memoizedParticles.forEach((particle, idx) => {
                    const timeoutId = setTimeout(() => {
                        if (!isHovered || !movieDiv) return;

                        const clone = particle.cloneNode(true);
                        movieDiv.appendChild(clone);
                        particles.push(clone);

                        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

                        gsap.to(clone, {
                            x: (Math.random() - 0.5) * 100,
                            y: (Math.random() - 0.5) * 100,
                            rotation: Math.random() * 360,
                            duration: 2 + Math.random() * 2,
                            ease: 'none',
                            repeat: -1,
                            yoyo: true
                        });

                        gsap.to(clone, {
                            opacity: 0.3,
                            duration: 1.5,
                            ease: 'power2.inOut',
                            repeat: -1,
                            yoyo: true
                        });
                    }, idx * 100);

                    timeouts.push(timeoutId);
                });
            };

            movieDiv.addEventListener('mouseenter', () => {
                isHovered = true;
                animateParticles();
                gsap.to(movieDiv, {
                    rotateX: 5,
                    rotateY: 5,
                    duration: 0.3,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });
            });

            movieDiv.addEventListener('mouseleave', () => {
                isHovered = false;
                clearAllParticles();
                gsap.to(movieDiv, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
                gsap.to(movieDiv, {
                    x: 0,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            movieDiv.addEventListener('mousemove', e => {
                const rect = movieDiv.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                gsap.to(movieDiv, {
                    rotateX,
                    rotateY,
                    duration: 0.1,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });

                const magnetX = (x - centerX) * 0.05;
                const magnetY = (y - centerY) * 0.05;
                magnetismAnimation = gsap.to(movieDiv, {
                    x: magnetX,
                    y: magnetY,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            movieDiv.addEventListener('click', e => {
                const rect = movieDiv.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const maxDistance = Math.max(
                    Math.hypot(x, y),
                    Math.hypot(x - rect.width, y),
                    Math.hypot(x, y - rect.height),
                    Math.hypot(x - rect.width, y - rect.height)
                );

                const ripple = document.createElement('div');
                ripple.style.cssText = `
                    position: absolute;
                    width: ${maxDistance * 2}px;
                    height: ${maxDistance * 2}px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(${DEFAULT_GLOW_COLOR_RGB}, 0.4) 0%, rgba(${DEFAULT_GLOW_COLOR_RGB}, 0.2) 30%, transparent 70%);
                    left: ${x - maxDistance}px;
                    top: ${y - maxDistance}px;
                    pointer-events: none;
                    z-index: 1000;
                `;

                movieDiv.appendChild(ripple);

                gsap.fromTo(
                    ripple,
                    {
                        scale: 0,
                        opacity: 1
                    },
                    {
                        scale: 1,
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        onComplete: () => ripple.remove()
                    }
                );
            });
        });
    }

    function playMovie(movieId) {
        currentMovieId = movieId;
        const embedUrl = `https://www.vidking.net/embed/movie/${movieId}`;
        vidkingPlayer.src = embedUrl;
        searchResultsSection.style.display = 'none';
        trendingList.parentElement.style.display = 'none';
        playerSection.style.display = 'block';
        document.getElementById('player-title').style.display = 'block';
        playerContainer.style.display = 'block';
        playerOverlay.style.display = 'flex';

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

    const DEFAULT_PARTICLE_COUNT = 12;
    const DEFAULT_SPOTLIGHT_RADIUS = 300;
    const DEFAULT_GLOW_COLOR_RGB = '147, 51, 234';

    const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR_RGB) => {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(${color}, 1);
        box-shadow: 0 0 6px rgba(${color}, 0.6);
        pointer-events: none;
        z-index: 100;
        left: ${x}px;
        top: ${y}px;
      `;
      return el;
    };

    const calculateSpotlightValues = radius => ({
      proximity: radius * 0.5,
      fadeDistance: radius * 0.75
    });

    const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
      const rect = card.getBoundingClientRect();
      const relativeX = ((mouseX - rect.left) / rect.width) * 100;
      const relativeY = ((mouseY - rect.top) / rect.height) * 100;

      card.style.setProperty('--glow-x', `${relativeX}%`);
      card.style.setProperty('--glow-y', `${relativeY}%`);
      card.style.setProperty('--glow-intensity', glow.toString());
      card.style.setProperty('--glow-radius', `${radius}px`);
    };

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    document.body.appendChild(spotlight);

    let isInsideSection = false;
    const mainElement = document.querySelector('main');

    document.addEventListener('mousemove', e => {
        const rect = mainElement?.getBoundingClientRect();
        const mouseInside =
            rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

        isInsideSection = mouseInside || false;
        const movieItems = document.querySelectorAll('.movie-item');

        if (!mouseInside) {
            gsap.to(spotlight, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
            movieItems.forEach(card => {
                card.style.setProperty('--glow-intensity', '0');
            });
            return;
        }

        const { proximity, fadeDistance } = calculateSpotlightValues(DEFAULT_SPOTLIGHT_RADIUS);
        let minDistance = Infinity;

        movieItems.forEach(card => {
            const cardElement = card;
            const cardRect = cardElement.getBoundingClientRect();
            const centerX = cardRect.left + cardRect.width / 2;
            const centerY = cardRect.top + cardRect.height / 2;
            const distance =
                Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
            const effectiveDistance = Math.max(0, distance);

            minDistance = Math.min(minDistance, effectiveDistance);

            let glowIntensity = 0;
            if (effectiveDistance <= proximity) {
                glowIntensity = 1;
            } else if (effectiveDistance <= fadeDistance) {
                glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
            }

            updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, DEFAULT_SPOTLIGHT_RADIUS);
        });

        gsap.to(spotlight, {
            left: e.clientX,
            top: e.clientY,
            duration: 0.1,
            ease: 'power2.out'
        });

        const targetOpacity =
            minDistance <= proximity
                ? 0.8
                : minDistance <= fadeDistance
                    ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
                    : 0;

        gsap.to(spotlight, {
            opacity: targetOpacity,
            duration: targetOpacity > 0 ? 0.2 : 0.5,
            ease: 'power2.out'
        });
    });

    document.addEventListener('mouseleave', () => {
        isInsideSection = false;
        document.querySelectorAll('.movie-item').forEach(card => {
            card.style.setProperty('--glow-intensity', '0');
        });
        gsap.to(spotlight, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
    });
});
