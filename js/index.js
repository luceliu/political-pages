// Load data
Promise.all([
    d3.csv('/data/facebook-fact-check.csv'),
  ]).then(files => {
    let data = files[0];

    // Change all engagement counts to numbers
    data.forEach(d => {
      const columns = Object.keys(d)
      for (const col of columns) {
        if (col == "share_count" || col == "reaction_count" || col == "comment_count" || col == "engagement_count") {
          d[col] = +d[col];
        }
      }
    });
  
    // Initialize bubble vis
    let postBubbles = new bubbleVis({ 
      parentElement: '#bubbleVis',
      colorValue: d => d[Rating],
      pageValue: d => d[Page],
      selectedCategory: 'left'
    });
  
    postBubbles.render();  
    
  });
  