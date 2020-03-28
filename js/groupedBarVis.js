class groupedBarVis {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 580,
            containerHeight: _config.containerHeight || 680,
          }
          this.config.margin = _config.margin || { top: 40, bottom: 140, right: 0, left: 0 }
          this.perCategoryData = _config.perCategoryData;
  
          this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        console.log('data: ', vis.perCategoryData)
        const categories = ['left', 'mainstream', 'right'];
        const truthRankings = ["mostly true", "mixture of true and false", "mostly false", "no factual content"];
        const leftShift = 125;
        const svg = d3.select('svg#groupedBarVis');
        let g = svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        const chartWidth = 500;
        const chartHeight = 350;
        const titleOffset = 80;
        const titleG = g.append('g')
            .attr('class', 'vis-title')
            .style('fill', '#434244')
            .style('font-size', '24px')
            .attr('width', '200px');

        titleG.append('text')
            .text("What is the percentage of engagement")
            .attr('x', vis.width/4)

        titleG.append('text')
            .text("resulting from each type of post across")
            .attr('y', titleOffset-50)
            .attr('x', vis.width/4)

        titleG.append('text')
            .text("the political spectrum?")
            .attr('y', titleOffset-20)
            .attr('x', vis.width/4)

        const chartG = g.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top+titleOffset})`);
        const formatter = d3.format(".0%");

        // need second x scale
        vis.xScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, chartWidth]);

        vis.xAxis = chartG.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${leftShift}, ${chartHeight})`)
            .call(d3.axisBottom(vis.xScale).tickSizeInner(-chartHeight).tickFormat(formatter).ticks(4))

        vis.yScale = d3.scaleBand()
            .domain(categories)
            .range([0, chartHeight])

        vis.yAxis = chartG.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${leftShift}, ${0})`)
            .call(d3.axisLeft(vis.yScale).tickSizeInner(0))

        vis.colorScale = d3.scaleOrdinal()
            .domain(truthRankings)
            .range(["#67D99B", "#D3DCE7", "#E05E5E", "#634265"])
            
        // move x-axis labels down a bit
        d3.selectAll('#groupedBarVis .x-axis text')
            .attr('transform', 'translate(0, 10)')

        const barsG = g.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top+titleOffset})`)
            .attr('class', 'all-bars');
        
        barsG.selectAll('rect')
            .data(vis.perCategoryData)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            .each(function (d) {
                console.log(d);
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