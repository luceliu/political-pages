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

    let pageCategories = {};
    let processPerPageData = data => {
      // collect total posts for the page
      // collect each type of post for the page
      let names = [...new Set(data.map(d => d.Page))]
      let ratings = [... new Set(data.map(d => d.Rating))]
      let map = names.map(n => {
          let obj = {};
          ratings.forEach(r => obj[r] = 0);
          obj.name = n;
          return obj;
      })

      names.forEach(n => {
        let entry = data.find(c => c.Page == n);
        pageCategories[n] = entry.Category;
      });

      let perPageData = data.reduce((map, current) => {
          let page = map.find(d => d.name == current.Page);
          page[current.Rating]++;
          return map;
      }, map)

      console.log('data: ', data);
      console.log('perPageData: ', perPageData);

      perPageData.forEach(d =>
        d.total = Object.values(d).filter(a => !isNaN(a)).reduce((sum, cur) => sum + cur)
      );

      return perPageData;
  }

  let perPageData = processPerPageData(data);
  console.log(perPageData);

    // Initialize color legend
    let categoryLegend = new colorLegend({ 
        parentElement: '#color-legend',
        squareSize: 18
    });
  
    // Initialize bubble vis
    let postBubbles = new bubbleVis({ 
      parentElement: '#bubbleVis',
      containerWidth: document.getElementById("bubbleVis").clientWidth,
      containerHeight: document.getElementById("bubbleVis").clientHeight,
      data: data,
      idValue: d => d.post_id,
      colorValue: d => d.Rating,
      zValue: d => d.engagement_count,
      pageValue: d => d.Page,
      linkValue: d => d['Post URL'],
      formatValue: d => d['Post Type'],
      politicalValue: d => d.Category,
    });
  
    postBubbles.render();  

    let pageRankings, truthPercentage;

    let onMouseover = (d) => {
      pageRankings.selectedPage = d.name;
      truthPercentage.selectedPage = d.name;
      pageRankings.render();
      pageRankings.showTooltip(d);
      truthPercentage.render();
  }
  
  let onMouseout = (d) => {
      pageRankings.selectedPage = null;
      truthPercentage.selectedPage = null;
      pageRankings.render();
      pageRankings.hideTooltip();
      truthPercentage.render();
  }

  let onRatingMouseover = (d) => {
    pageRankings.postCircleSelected = d;
    truthPercentage.postCircleSelected = d;
    truthPercentage.selectedRating = pageRankings.sortKey;
    pageRankings.render();
    truthPercentage.render();
}

let onRatingMouseout = (d) => {
    pageRankings.postCircleSelected = null;
    truthPercentage.postCircleSelected = null;
    truthPercentage.selectedRating = null;
    pageRankings.render();
    truthPercentage.render();
}

    pageRankings = new circleJuxtaposeVis({
      parentElement: '#falseToAllPostsRanking',
      data: data,
      postMap: perPageData,
      pageCategories: pageCategories,
      onMouseout: onMouseout,
      onMouseover: onMouseover,
      onRatingMouseout: onRatingMouseout,
      onRatingMouseover: onRatingMouseover,
      containerWidth: document.getElementById("falseToAllPostsRanking").clientWidth,
      containerHeight: document.getElementById("falseToAllPostsRanking").clientHeight,
    })

    pageRankings.render();

    // Event listeners for bubble vis layout tabs
    d3.select('#layout-tabs')
      .selectAll('.bubble-tab')
        .on('click', (d, i, nodes) => {
          const selectedButton = nodes[i]
          d3.selectAll('.bubble-tab').classed('active', false);
          d3.select(selectedButton).classed('active', true);
          const layoutId = d3.select(selectedButton).attr('id');
          postBubbles.update(layoutId);
      });

    // Event listeners for page ranking viz 
      d3.select('#rank-layout-tabs')
      .selectAll('.tab')
        .on('click', (d, i, nodes) => {
          const selectedButton = nodes[i];
          d3.selectAll('.tab').classed('active', false);
          d3.select(selectedButton).classed('active', true);
          console.log(d3.select(selectedButton).node().innerText.toLowerCase());
          pageRankings.sortKey = d3.select(selectedButton).node().innerText.toLowerCase();
          pageRankings.changingRank = true;
          pageRankings.update();
          pageRankings.render();
      });
    
    truthPercentage = new stackedBarVis({
      parentElement: '#stackedBarVis',
      data: data,
      postMap: perPageData,
      containerWidth: document.getElementById("stackedBarVis").clientWidth,
      containerHeight: document.getElementById("stackedBarVis").clientHeight,
    })

    let pageSelect1 = new pageSelect({
      precedingElementId: "span-1",
      select_id: "page-select-1",
      selectedPage: "Addicting Info" // default to start
    })

    let pageSelect2 = new pageSelect({
      precedingElementId: "span-2",
      select_id: "page-select-2",
      selectedPage: "Politico" // default to start
    })

    // Group data by page
    // <"Politico", [...]>
    const processGroupedData = data => {
      const groupedData = new Map();
      let maxCount = 0; // to get global max engagement count
      data.forEach(function(post) {
      if (!groupedData.has(post.Page)) {
        groupedData.set(post.Page, []);
      }
      const pagePosts = groupedData.get(post.Page);
      const newPost = {};
      newPost.category = post.Category;
      newPost.page = post.Page;
      newPost.rating = post.Rating;
      newPost.engCount = post.engagement_count;
      if (newPost.engCount > maxCount) {
        maxCount = newPost.engCount;
      }
      pagePosts.push(newPost);
      groupedData.set(post.Page, pagePosts);
    })

      return [groupedData, maxCount];

    }

    const processedData = processGroupedData(data);
    groupedData = processedData[0];
    maxEngCount = processedData[1];
    let pageScatterplot1 = new engagementByPageViz({
      parentElement: "#engagementCountByPage1",
      data: groupedData.get(pageSelect1.selectedPage),
      maxCount: maxEngCount,
      containerWidth: document.getElementById("engagementCountByPage1").clientWidth,
      containerHeight: document.getElementById("engagementCountByPage1").clientHeight,
    })
    
    let pageScatterplot2 = new engagementByPageViz({
      parentElement: "#engagementCountByPage2",
      data: groupedData.get(pageSelect2.selectedPage),
      maxCount: maxEngCount,
      containerWidth: document.getElementById("engagementCountByPage2").clientWidth,
      containerHeight: document.getElementById("engagementCountByPage2").clientHeight,
    })

    // Event listeners for handling page selections
    const select1 = document.getElementById('page-select-1');
    select1.addEventListener('change', function(){
      pageScatterplot1.data = groupedData.get(this.value);
      pageScatterplot1.update();
    });

    const select2 = document.getElementById('page-select-2');
    select2.addEventListener('change', function(){
      pageScatterplot2.data = groupedData.get(this.value);
      pageScatterplot2.update();
    });

    pageScatterplot1.render();
    pageScatterplot2.render();
    
    pageRankings.onMouseover = onMouseover;
    pageRankings.onMouseout = onMouseout;
    truthPercentage.onMouseover = onMouseover;
    truthPercentage.onMouseout = onMouseout;
  
  });
  
  