exports.handler = async (event, context) => {
    const apiKey = process.env.TMDB_KEY;
    const { query, trending } = event.queryStringParameters;

    let url = '';

    if (trending === 'true') {
        url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;
    } else if (query) {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query or trending parameter' })
        };
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(data.results)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch movies' })
        };
    }
};
