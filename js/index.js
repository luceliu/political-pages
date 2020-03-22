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

    // Initialize color legend
    let categoryLegend = new colorLegend({ 
        parentElement: '#color-legend',
        squareSize: 18
    });
  
    // Initialize bubble vis
    let postBubbles = new bubbleVis({ 
      parentElement: '#bubbleVis',
      containerWidth: document.getElementsByClassName("vis-container")[0].clientWidth,
      data: data,
      idValue: d => d.post_id,
      colorValue: d => d.Rating,
      zValue: d => d.engagement_count,
      pageValue: d => d.Page,
      linkValue: d => d['Post URL'],
      formatValue: d => d['Post Type'],
      politicalValue: d => d.Category
    });
  
    postBubbles.render();  

    // Event listeners for layout tabs
    d3.select('#layout-tabs')
      .selectAll('.tab')
        .on('click', (d, i, nodes) => {
          const selectedButton = nodes[i]
          d3.selectAll('.tab').classed('active', false);
          d3.select(selectedButton).classed('active', true);
          const layoutId = d3.select(selectedButton).attr('id');
          postBubbles.update(layoutId);
      });
    
  });
  