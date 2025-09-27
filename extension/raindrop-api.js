// Raindrop.io API client functions

const RAINDROP_API_BASE = 'https://api.raindrop.io/rest/v1';

async function fetchCollections() {
  try {
    const isValid = await ensureValidToken();
    if (!isValid) {
      throw new Error('Invalid or expired access token');
    }

    const config = await chrome.storage.sync.get(['accessToken']);

    console.log('Fetching collections from Raindrop API...');

    const response = await fetch(`${RAINDROP_API_BASE}/collections`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - 401 Unauthorized');
      }
      throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.items?.length || 0} collections`);

    // Filter out system collections and add raindrops to each collection
    const collections = data.items || [];
    const userCollections = collections.filter(collection =>
      collection._id !== -1 && // Unsorted
      collection._id !== -99 && // Trash
      collection._id !== 0 // All
    );

    // Fetch raindrops for each collection
    const collectionsWithRaindrops = await Promise.all(
      userCollections.map(async (collection) => {
        try {
          const raindrops = await fetchRaindrops(collection._id);
          return {
            ...collection,
            raindrops
          };
        } catch (error) {
          console.error(`Failed to fetch raindrops for collection ${collection._id}:`, error);
          return {
            ...collection,
            raindrops: []
          };
        }
      })
    );

    return collectionsWithRaindrops;

  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

async function fetchRaindrops(collectionId) {
  try {
    const config = await chrome.storage.sync.get(['accessToken']);

    console.log(`Fetching raindrops for collection ${collectionId}...`);

    // Fetch with pagination - start with page 0
    let allRaindrops = [];
    let page = 0;
    let hasMore = true;
    const perPage = 50; // Raindrop API default is 25, max is 50

    while (hasMore) {
      const url = new URL(`${RAINDROP_API_BASE}/raindrops/${collectionId}`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('perpage', perPage.toString());
      url.searchParams.set('sort', '-created'); // Sort by creation date, newest first

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - 401 Unauthorized');
        }
        throw new Error(`Failed to fetch raindrops: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const raindrops = data.items || [];

      allRaindrops.push(...raindrops);

      // Check if there are more pages
      const count = data.count || 0;
      const totalFetched = (page + 1) * perPage;
      hasMore = totalFetched < count;
      page++;

      console.log(`Fetched ${raindrops.length} raindrops (page ${page}, total: ${allRaindrops.length}/${count})`);
    }

    console.log(`Total raindrops fetched for collection ${collectionId}: ${allRaindrops.length}`);

    // Filter and transform raindrops to bookmarks format
    const bookmarks = allRaindrops
      .filter(raindrop => raindrop.link && raindrop.title) // Only include items with valid URL and title
      .map(raindrop => ({
        id: raindrop._id,
        title: raindrop.title,
        url: raindrop.link,
        excerpt: raindrop.excerpt,
        tags: raindrop.tags || [],
        created: raindrop.created,
        domain: raindrop.domain
      }));

    return bookmarks;

  } catch (error) {
    console.error(`Error fetching raindrops for collection ${collectionId}:`, error);
    throw error;
  }
}

async function fetchUserInfo() {
  try {
    const isValid = await ensureValidToken();
    if (!isValid) {
      throw new Error('Invalid or expired access token');
    }

    const config = await chrome.storage.sync.get(['accessToken']);

    const response = await fetch(`${RAINDROP_API_BASE}/user`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed - 401 Unauthorized');
      }
      throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.user;

  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

// Export functions for use in other modules
window.fetchCollections = fetchCollections;
window.fetchRaindrops = fetchRaindrops;
window.fetchUserInfo = fetchUserInfo;