class stackedBarVis {
    constructor(_config) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: _config.containerWidth || 500,
          containerHeight: _config.containerHeight || 470,
        }
        this.config.margin = _config.margin || { top: 40, bottom: 50, right: 0, left: 160 }
        this.data = _config.data;
        this.perPageData = _config.postMap;
        this.initVis();
      }

      initVis() {
          let vis = this;
          vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
          vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

          const truthRankings = ["mostly true", "mixture of true and false", "mostly false", "no factual content"];

          const svg = d3.select('svg#stackedBarVis');
          const g = svg.append('g')
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

          vis.xAxis = d3.axisBottom(vis.xScale)
            .tickFormat(formatter)

          const pageTitles = vis.perPageData.map(page => page.name)

          vis.yScale = d3.scaleBand()
            .domain(pageTitles)
            .range([0, vis.height])
            .padding(0.3);

          vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(0, ${titleOffset})`)
            .call(d3.axisLeft(vis.yScale).tickSizeInner(0))
            .call(g => g.select(".domain").remove());

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
            .call(g => g.select(".domain").remove())

          xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('y', 50)
          .attr('x', vis.width / 2)
          .attr('fill', 'black')
          .attr('text-anchor', 'middle')
          .text("Percentage of page’s total posts");

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
              d3.select(this).selectAll("rect")
                .data(d)
                .enter()
                .append("rect")
                .attr("width", d => vis.widthScale(d[1] - d[0]))
                .attr("height", 28)
                .attr('y', (p, i) => vis.yScale(pageTitles[i])) 
                .attr('x', p => vis.xScale(p[0])) // changed from p[1] to p[0]
                .style("fill", vis.colorScale(d))
            })
      }

      update() {
          let vis = this;
          vis.render();
      }

      render() {
          let vis = this;
          
      }
}