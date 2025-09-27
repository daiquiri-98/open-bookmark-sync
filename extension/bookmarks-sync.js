// Bookmark synchronization functions

async function syncCollectionsToBookmarks(collections) {
  try {
    console.log(`Starting bookmark sync for ${collections.length} collections`);

    // Get the bookmarks bar
    const bookmarksTree = await chrome.bookmarks.getTree();
    const bookmarksBar = findBookmarksBar(bookmarksTree);

    if (!bookmarksBar) {
      throw new Error('Could not find bookmarks bar');
    }

    console.log(`Found bookmarks bar with ID: ${bookmarksBar.id}`);

    // Clear existing bookmarks in the bookmarks bar
    await clearBookmarksBar(bookmarksBar);

    // Create folders for each collection and add bookmarks
    for (const collection of collections) {
      try {
        await createCollectionFolder(bookmarksBar.id, collection);
      } catch (error) {
        console.error(`Failed to create folder for collection "${collection.title}":`, error);
      }
    }

    console.log('Bookmark sync completed successfully');

  } catch (error) {
    console.error('Bookmark sync failed:', error);
    throw error;
  }
}

function findBookmarksBar(bookmarksTree) {
  // The bookmarks bar is typically the first child of the root
  // and has the title "Bookmarks bar" or similar
  for (const rootNode of bookmarksTree) {
    if (rootNode.children) {
      for (const child of rootNode.children) {
        // Look for the bookmarks bar by checking common IDs and titles
        if (child.id === '1' || // Chrome's default bookmarks bar ID
            child.title === 'Bookmarks bar' ||
            child.title === 'Bookmarks Bar' ||
            child.title === 'Favorites bar' ||
            child.url === undefined && child.children !== undefined) {
          return child;
        }
      }
    }
  }

  // If not found by common patterns, try to find the first folder without URL
  for (const rootNode of bookmarksTree) {
    if (rootNode.children) {
      for (const child of rootNode.children) {
        if (!child.url && child.children !== undefined) {
          console.log(`Using folder "${child.title}" as bookmarks bar`);
          return child;
        }
      }
    }
  }

  return null;
}

async function clearBookmarksBar(bookmarksBar) {
  try {
    console.log(`Clearing bookmarks bar: ${bookmarksBar.title}`);

    // Get all children of the bookmarks bar
    const children = bookmarksBar.children || [];

    // Delete all existing bookmarks and folders
    for (const child of children) {
      try {
        if (child.children !== undefined) {
          // It's a folder, remove recursively
          await chrome.bookmarks.removeTree(child.id);
        } else {
          // It's a bookmark
          await chrome.bookmarks.remove(child.id);
        }
      } catch (error) {
        console.error(`Failed to remove bookmark/folder "${child.title}":`, error);
      }
    }

    console.log(`Cleared ${children.length} items from bookmarks bar`);

  } catch (error) {
    console.error('Failed to clear bookmarks bar:', error);
    throw error;
  }
}

async function createCollectionFolder(parentId, collection) {
  try {
    const folderTitle = sanitizeBookmarkTitle(collection.title);
    console.log(`Creating folder "${folderTitle}" with ${collection.raindrops?.length || 0} bookmarks`);

    // Create the collection folder
    const folder = await chrome.bookmarks.create({
      parentId: parentId,
      title: folderTitle
    });

    console.log(`Created folder "${folderTitle}" with ID: ${folder.id}`);

    // Add bookmarks to the folder
    const raindrops = collection.raindrops || [];

    for (const raindrop of raindrops) {
      try {
        await createBookmark(folder.id, raindrop);
      } catch (error) {
        console.error(`Failed to create bookmark for "${raindrop.title}":`, error);
      }
    }

    console.log(`Added ${raindrops.length} bookmarks to folder "${folderTitle}"`);

  } catch (error) {
    console.error(`Failed to create collection folder for "${collection.title}":`, error);
    throw error;
  }
}

async function createBookmark(parentId, raindrop) {
  try {
    const title = sanitizeBookmarkTitle(raindrop.title);
    const url = raindrop.url;

    // Validate URL
    if (!isValidUrl(url)) {
      console.warn(`Skipping invalid URL: ${url}`);
      return;
    }

    await chrome.bookmarks.create({
      parentId: parentId,
      title: title,
      url: url
    });

  } catch (error) {
    console.error(`Failed to create bookmark "${raindrop.title}":`, error);
    throw error;
  }
}

function sanitizeBookmarkTitle(title) {
  if (!title || typeof title !== 'string') {
    return 'Untitled';
  }

  // Remove or replace characters that might cause issues
  return title
    .trim()
    .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .substring(0, 255); // Limit length to prevent issues
}

function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

async function getBookmarksStats() {
  try {
    const bookmarksTree = await chrome.bookmarks.getTree();
    const bookmarksBar = findBookmarksBar(bookmarksTree);

    if (!bookmarksBar) {
      return { folders: 0, bookmarks: 0 };
    }

    let folderCount = 0;
    let bookmarkCount = 0;

    function countItems(node) {
      if (node.children) {
        folderCount++;
        for (const child of node.children) {
          countItems(child);
        }
      } else if (node.url) {
        bookmarkCount++;
      }
    }

    // Count items in bookmarks bar (excluding the bar itself)
    for (const child of bookmarksBar.children || []) {
      countItems(child);
    }

    return { folders: folderCount, bookmarks: bookmarkCount };

  } catch (error) {
    console.error('Failed to get bookmarks stats:', error);
    return { folders: 0, bookmarks: 0 };
  }
}

// Export functions for use in other modules
window.syncCollectionsToBookmarks = syncCollectionsToBookmarks;
window.getBookmarksStats = getBookmarksStats;
window.findBookmarksBar = findBookmarksBar;