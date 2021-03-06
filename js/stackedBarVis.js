class stackedBarVis {
    constructor(_config) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: _config.containerWidth || 580,
          containerHeight: _config.containerHeight || 580,
        }
        this.config.margin = _config.margin || { top: 40, bottom: 140, right: 30, left: 170 }
        this.data = _config.data;
        this.perPageData = _config.postMap;
        this.pageCategories = _config.pageCategories;
        this.onMouseover = _config.onMouseover;
        this.onMouseout = _config.onMouseout;

        this.initVis();
      }

      initVis() {
          let vis = this;
          vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
          vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

          const truthRankings = ["mostly true", "mixture of true and false", "mostly false", "no factual content"];
          
          // for use in detecting which substack the viewer mouses over
          const colourToRankMap = new Map();
          colourToRankMap.set('rgb(103, 217, 155)', 'mostly true');
          colourToRankMap.set('rgb(211, 220, 231)', 'mixture of true and false')
          colourToRankMap.set('rgb(224, 94, 94)', 'mostly false')
          colourToRankMap.set('rgb(99, 66, 101)', 'no factual content')

          // init tooltip
          vis.tooltip = new tooltip({
            tooltip_id: 'stacked-tooltip',
            width: '200px'
          })

          vis.tooltip.tt.on('mouseover mouseenter mouseleave mouseup mousedown', function() {
            return false
         });

          vis.pageDataMap = new Map(); // to be used in grabbing data about each page for tooltip
          const perPageDataCopy = Array.from(vis.perPageData);
          vis.fillPageDataMap(vis.pageDataMap, perPageDataCopy);

          const svg = d3.select('svg#stackedBarVis');
          let g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        
          const titleOffset = 40;
          const titleG = g.append('g')
            .attr('class', 'vis-title')
            .text("Percentage of page's total posts by truth rating")
            .style('fill', '#434244')
            .style('font-size', '24px')
            .attr('text-anchor', 'middle')
            .attr('width', '200px');

          titleG.append('text')
            .text("Percentage of page's total posts by")
            .attr('x', vis.width/2)

          titleG.append('text')
            .text("truthfulness rating")
            .attr('y', titleOffset-10)
            .attr('x', vis.width/2)

          const formatter = d3.format(".0%");

          vis.xScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, vis.width])
            .nice();

          vis.xAxis = d3.axisBottom(vis.xScale)
            .tickFormat(formatter)

          const pageTitles = vis.perPageData.map(page => page.name)
          
          vis.yScale = d3.scaleBand()
            .domain(pageTitles)
            .range([0, vis.height])
            .padding(0.3);

          vis.highlightBar = g.append("rect")
            .attr("class", "highlight-bar")
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.yScale.bandwidth() + 16)
            .attr("fill", "none")
            .attr("rx", 10)
            .attr("ry", 8)
            .attr('transform', `translate(${-vis.config.margin.left},${titleOffset - 10})`);

          vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(0, ${titleOffset})`)
            .call(d3.axisLeft(vis.yScale).tickSizeInner(0))
            .call(g => g.select(".domain").remove()); // remove y-axis line

            g.selectAll(".y-axis .tick")
            .on("mouseover", function(d) { vis.onMouseover({name: d})})
            .on("mouseout", function(d) { vis.onMouseout()});

          vis.colorScale = d3.scaleOrdinal()
            .domain(truthRankings)
            .range(["#67D99B", "#D3DCE7", "#E05E5E", "#634265"])

          vis.widthScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, vis.width])

          const xAxisG = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(10,${vis.height+titleOffset})`)
            .call(vis.xAxis.tickSizeInner(-vis.height).ticks(12))
            .call(g => g.select(".domain").remove()) // remove x-axis line

          xAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('y', 50)
            .attr('x', vis.width / 2)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text("Percentage of political category's total posts");

          // record widths for highlighting bar
          vis.widthsMap = {};
          vis.perPageData.forEach(d => vis.widthsMap[d.name] = {});

          const truthfulnessStack = d3.stack().keys(truthRankings)
          const percentages = vis.perPageData.map(function(page) {
            const p = {};
            p["no factual content"] = page["no factual content"] / page['total'];
            p["mostly true"] = page["mostly true"] / page['total'];
            p["mixture of true and false"] = page["mixture of true and false"] / page['total'];
            p["mostly false"] = page["mostly false"] / page['total'];
            p['name'] = page['name']
            return p;
          })

          const bars = g.append('g')
            .attr('class', 'all-bars')
            .attr('transform', `translate(10,${titleOffset})`)
          bars.selectAll("rect")
            .data(truthfulnessStack(percentages))
            .enter()
            .append('g')
            .attr('class', 'bar')
            .each(function(d) {
              let key = d.key;
              d3.select(this).selectAll("rect")
                .data(d)
                .enter()
                .append("rect")
                .on("mouseover", function (d) {
                  const fillRgb = d3.select(this).style("fill");
                  let rating = colourToRankMap.get(fillRgb);
                  vis.postCircleSelected = d.data;
                  vis.selectedRating = rating;    
                  vis.onMouseover(d.data);
                  vis.showTooltip(d.data, rating);
                })
                .on("mouseout", function (d) {
                  vis.postCircleSelected = null;
                  vis.ranking = null;
                  vis.onMouseout(d.data);
                      
                  vis.hideTooltip();
                })
                .attr("width", d => {
                  vis.widthsMap[d.data.name][key] = [vis.xScale(d[0]), vis.xScale(d[1])];
                  return vis.widthScale(d[1] - d[0]);
                })
                .attr("height", 28)
                .attr('y', (p, i) => vis.yScale(pageTitles[i])) 
                .attr('x', p => vis.xScale(p[0]))
                .style("fill", vis.colorScale(d))
            })

            vis.highlightSize = 10;
            vis.ratingHighlight = g.append('rect');
            vis.ratingHighlight
              .attr("height", vis.yScale.bandwidth() + 16)
              .attr("class", "highlight-bar")
              .attr("fill", "none")
              .attr("rx", 10)
              .attr("ry", 8)
              .attr('transform', `translate(0,${titleOffset - 8})`);
            
            vis.highlightStroke = g.append('rect')
              .attr("height", vis.yScale.bandwidth())
              .attr('class', 'highlight-stroke')
              .attr("fill", "none")
              .attr('transform', `translate(${vis.highlightSize},${titleOffset})`);
      }

      update() {
          let vis = this;
          vis.render();
      }

      render() {
          let vis = this;
        
          // stacked bar corresponding to a page is highlighted upon hover
          vis.highlightBar
           .attr("y", (vis.selectedPage != null) ? vis.yScale(vis.selectedPage) : 0)
          .transition().duration(1000)
          .attr("fill", 
            d => (vis.selectedPage != null)
            ? "#E7E7E7" : "none" // render gray border around highlighted page
          )
      
          vis.ratingHighlight
            .attr("y", (vis.postCircleSelected != null) ? vis.yScale(vis.postCircleSelected.name) : 0)
            .attr("x", (vis.postCircleSelected != null) ? 
          vis.widthsMap[vis.postCircleSelected.name][vis.selectedRating][0] : 0)
            .attr("width", () => {
              if (vis.postCircleSelected != null) {
              let width = vis.widthsMap[vis.postCircleSelected.name][vis.selectedRating][1]
                -  vis.widthsMap[vis.postCircleSelected.name][vis.selectedRating][0];
                if (width == 0) { 
                  return 0; 
                } else {
                  return width + 2 * vis.highlightSize;
                }
              } else return 0;
            })
            .style("fill", vis.colorScale(vis.selectedRating))
            .style("opacity", 0.6);

          vis.highlightStroke
            .attr("y", (vis.postCircleSelected != null) ? vis.yScale(vis.postCircleSelected.name) : 0)
            .attr("x", (vis.postCircleSelected != null) ? 
          vis.widthsMap[vis.postCircleSelected.name][vis.selectedRating][0] : 0)
            .attr("width", () => {
              if (vis.postCircleSelected != null) {
              let width = vis.widthsMap[vis.postCircleSelected.name][vis.selectedRating][1]
                -  vis.widthsMap[vis.postCircleSelected.name][vis.selectedRating][0];
                if (width == 0) { 
                  return 0; 
                } else {
                  return width;
                }
              } else return 0;
            })
      }

      showTooltip(d, ranking) {
        let vis = this;

        // assemble tooltip text
        const content = '<p class="header">' +
        d.name +
        '</p>' +
        '<p class="attr">Political Category</p>' +
        '<p class="value">' +
        vis.pageCategories[d.name] +
        '</p>' +
        '<p class="attr">Rating</p>' +
        '<p class="value dynamic-color">' +
        ranking +
        '</p>' +
        '<p class="attr">Percentage of Posts with this Rating</p>' + 
        '<p class="value">' +
        Math.round(d[ranking] * 100) + "%" +
        '</p>' +
        '<p class="attr">Number of Posts with this Rating</p><p class="value">' +
        vis.pageDataMap.get(d.name)[ranking] + 
        ' out of ' + 
        vis.pageDataMap.get(d.name)['total']
        '</p>' ;
        
        let dynamicColor = d3.hsl(vis.colorScale(ranking));
        // all colours except purple should be darkened to use as text label
        if(ranking !== 'no factual content') {
          dynamicColor.s += 0.1;
          dynamicColor.l -= 0.15;
        }
        
        vis.tooltip.showTooltip(content, d3.event, dynamicColor)
      }

      hideTooltip() {
        this.tooltip.hideTooltip();  
      }

      // set map key-val pairs
      // to quickly grab info about a page given the page name
      fillPageDataMap(map, array) {
        array.forEach(function (item) {
          const pageObj = JSON.parse(JSON.stringify(item)) // deep copy to safely delete key
          const page = pageObj.name;
          map.set(page, pageObj);
        })
      }
}