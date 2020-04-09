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
      .selectAll('.tab-legend')
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
    const processSmallMultiplesData = data => {
      const smallMultiplesData = new Map();
      let maxCount = 0;
      data.forEach(function(post) {
      if (!smallMultiplesData.has(post.Page)) {
        smallMultiplesData.set(post.Page, []);
      }
      const pagePosts = smallMultiplesData.get(post.Page);
      const newPost = {};
      newPost.category = post.Category;
      newPost.page = post.Page;
      newPost.rating = post.Rating;
      newPost.engCount = post.engagement_count;
      if (newPost.engCount > maxCount) {
        maxCount = newPost.engCount;
      }
      pagePosts.push(newPost);
      smallMultiplesData.set(post.Page, pagePosts);
    })

      return [smallMultiplesData, maxCount];

    }

    const processedData = processSmallMultiplesData(data);
    smData = processedData[0];
    maxEngCount = processedData[1];
    let pageScatterplot1 = new engagementByPageViz({
      parentElement: "#engagementCountByPage1",
      data: smData.get(pageSelect1.selectedPage),
      maxCount: maxEngCount,
      containerWidth: document.getElementById("engagementCountByPage1").clientWidth,
      containerHeight: document.getElementById("engagementCountByPage1").clientHeight,
    })
    
    let pageScatterplot2 = new engagementByPageViz({
      parentElement: "#engagementCountByPage2",
      data: smData.get(pageSelect2.selectedPage),
      maxCount: maxEngCount,
      containerWidth: document.getElementById("engagementCountByPage2").clientWidth,
      containerHeight: document.getElementById("engagementCountByPage2").clientHeight,
    })

    // Event listeners for handling page selections
    const select1 = document.getElementById('page-select-1');
    select1.addEventListener('change', function(){
      pageScatterplot1.data = smData.get(this.value);
      pageScatterplot1.update();
    });

    const select2 = document.getElementById('page-select-2');
    select2.addEventListener('change', function(){
      pageScatterplot2.data = smData.get(this.value);
      pageScatterplot2.update();
    });

    pageScatterplot1.render();
    pageScatterplot2.render();

    let perCategoryData = {};

    let engData = data.map(d => {
      let item = {page: d.Category, engCount: d.engagement_count, rating: d.Rating, format: d["Post Type"]};
      return item; 
    });
  
    perCategoryData.Left = engData.filter(d => d.page == "left");
    perCategoryData.Right = engData.filter(d => d.page == "right");
    perCategoryData.Mainstream = engData.filter(d => d.page == "mainstream");
    
  let pageScatterplots = [];
  ["Left", "Right", "Mainstream"].forEach(leaning => {
    let pageScatterplot = new asymmetricalViolin({
      parentElement: "#engagementByPage" + leaning,
      data: perCategoryData[leaning],
      maxCount: maxEngCount,
      yValue: (d => d.format),
      yDomain: ['link', 'photo', 'video'],
      colourScale: d3.scaleOrdinal()
      .domain(['no factual content *', 'mostly false', 'mixture of true and false', 'mostly true'])
      .range(['#634265', '#E05E5E', '#D3DCE7', '#67D99B']),
      colourValue: (d => d.rating),
      containerWidth: document.getElementById("engagementByPage" + leaning).clientWidth,
      containerHeight: document.getElementById("engagementByPage" + leaning).clientHeight,
    });

    pageScatterplots.push(pageScatterplot);
  });    

    pageScatterplots.forEach(psp => {
      psp.update();
      psp.render();
    });
    
    pageRankings.onMouseover = onMouseover;
    pageRankings.onMouseout = onMouseout;
    truthPercentage.onMouseover = onMouseover;
    truthPercentage.onMouseout = onMouseout;
  
    const processGroupedBarData = data => {
      const groupedBarData = new Map();
      const defaultObj = {
          'no factual content': 0,
          'mostly false': 0,
          'mixture of true and false': 0,
          'mostly true': 0,
          'total': 0,
        }
      groupedBarData.set('left', defaultObj)
      groupedBarData.set('mainstream', defaultObj)
      groupedBarData.set('right', defaultObj)

      data.forEach(post => {
        const cat = post['Category'];
        const rat = post['Rating'];
        const count = post['engagement_count'];
        const newObj = Object.assign({}, groupedBarData.get(cat))
        const prev = newObj[rat]
        const prevTotal = newObj['total']
        newObj[rat] = prev + count;
        newObj['total'] = prevTotal + count;
        groupedBarData.set(cat, newObj)
      })

      groupedBarPercentagesData = new Map();

      for (const [k, v] of groupedBarData) {
        console.log(k, v)
        const percentObj = {}
        for (const rating in v) {
          percentObj[rating] = v[rating] / v['total']
        }
        delete percentObj['total']
        groupedBarPercentagesData.set(k, percentObj)
      }

      return groupedBarPercentagesData;
    }

    const processedGbData = processGroupedBarData(data);

    const categoryEngagement = new groupedBarVis({
      parentElement: '#groupedBarVis',
      perCategoryData: processedGbData,
      containerWidth: document.getElementById("grouped-bar").clientWidth,
      containerHeight: document.getElementById("grouped-bar").clientHeight,
    })

    categoryEngagement.render();
  });
  
  