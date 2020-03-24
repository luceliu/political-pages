class stackedBarVis {
    constructor(_config) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: _config.containerWidth || 500,
          containerHeight: _config.containerHeight || 470,
        }
        this.config.margin = _config.margin || { top: 40, bottom: 40, right: 0, left: 0 }
        this.data = _config.data;
        this.perPageData = _config.postMap;
        this.initVis();
      }

      initVis() {
          let vis = this;
          vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
          vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

          const truthRankings = ["mostly true", "mixture of true and false", "mostly false", "no factual content"];

          console.log(vis.perPageData);
          const svg = d3.select('svg#stackedBarVis');
          const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        
          g.append('text')
            .attr('class', 'vis-title')
            .attr('y', -10)
            .attr('x', 0)

          const formatter = d3.format(".0%");

          vis.xScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, vis.width])

          vis.xAxis = d3.axisBottom(vis.xScale)
            .tickFormat(formatter)

          const pageTitles = vis.perPageData.map(page => page.name)
          console.log('pageTitles: ', pageTitles);

          vis.yScale = d3.scaleBand()
            .domain(pageTitles)
            .range([0, vis.height])
            .padding(0.3);

          console.log('test: ', vis.yScale("Eagle Rising")) // not giving a valid y value??

          vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSizeInner(4)
            .tickPadding(10);

          vis.colorScale = d3.scaleOrdinal()
            .domain(truthRankings)
            .range(["#67D99B", "#D3DCE7", "#E05E5E", "#634265"])

          vis.widthScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, vis.width])

          const xAxisG = g.append('g')
            .attr('class', 'x-axis-g')
            .attr('transform', `translate(0,${vis.height})`)
            .call(vis.xAxis);

          const yAxisG = g.append('g')
            .attr('class', 'y-axis-g')
            .call(vis.yAxis);

          yAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('y', 40)
          .attr('x', -vis.height / 2)
          .attr('fill', 'black')
          .attr('transform', `rotate(-90)`)
          .attr('text-anchor', 'middle')
          .text("Blahblahbalha");

          xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('y', 0)
          .attr('x', vis.width / 2)
          .attr('fill', 'black')
          .attr('text-anchor', 'middle')
          .text("Hellllloooooo");

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

          console.log('percentages: ', percentages)

          const series = truthfulnessStack(percentages);
          console.log('series: ', series)
          const bars = g.append('g');
          bars.selectAll("rect")
            .data(truthfulnessStack(percentages))
            .enter()
            .append('g')
            .attr('class', 'bar')
            .each(function(d) {
              console.log('d: ', d)
              d3.select(this).selectAll("rect")
                .data(d)
                .enter()
                .append("rect")
                .attr("width", d => vis.widthScale(d[1] - d[0]))
                .attr("height", 28)
                .attr('y', (p, i) => vis.yScale(pageTitles[i])) // giving completely bogus y values???
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