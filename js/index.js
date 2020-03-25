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
      containerWidth: document.getElementsByClassName("bubble-container")[0].clientWidth,
      containerHeight: document.getElementsByClassName("bubble-container")[0].clientHeight,
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

    let pageRankings = new circleJuxtaposeVis({
      parentElement: '#falseToAllPostsRanking',
      data: data,
      postMap: perPageData,
    })

    pageRankings.render();

    // Event listeners for layout tabs
    d3.select('#layout-tabs')
      .selectAll('.tab')
        .on('click', (d, i, nodes) => {
          const selectedButton = nodes[i]
          d3.selectAll('.tab').classed('active', false);
          d3.select(selectedButton).classed('active', true);
          const layoutId = d3.select(selectedButton).attr('id');
          pageRankings.se
          postBubbles.update(layoutId);
      });

      d3.select('#circle-layout-tabs')
      .selectAll('.tab')
        .on('click', (d, i, nodes) => {
          const selectedButton = nodes[i];
          d3.selectAll('.tab').classed('active', false);
          d3.select(selectedButton).classed('active', true);
          console.log(d3.select(selectedButton).node().innerText.toLowerCase());
          pageRankings.sortKey = d3.select(selectedButton).node().innerText.toLowerCase();
          pageRankings.update();
          pageRankings.render();
      });
    
    let truthPercentage = new stackedBarVis({
      parentElement: '#stackedBarVis',
      data: data,
      postMap: perPageData,
    })

    let pageSelect1 = new pageSelect({
      precedingElementId: "span-1",
      select_id: "page-select-1",
      selectedPage: "Addicting Info"
    })

    let pageSelect2 = new pageSelect({
      precedingElementId: "span-2",
      select_id: "page-select-2",
      selectedPage: "Politico"
    })


    // Group data by page
    // <"Politico", [...]>
    const processGroupedData = data => {
      const groupedData = new Map();
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
      pagePosts.push(newPost);
      groupedData.set(post.Page, pagePosts);
    })

      return groupedData;

    }

    const groupedData = processGroupedData(data);
    console.log('groupedData: ', groupedData);

    let pageScatterplot1 = new engagementByPageViz({
      parentElement: "#engagementCountByPage1",
      data: groupedData.get(pageSelect1.selectedPage),
    })
    
    let pageScatterplot2 = new engagementByPageViz({
      parentElement: "#engagementCountByPage2",
      data: groupedData.get(pageSelect2.selectedPage),
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
  });
  