class engagementByPageViz {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 470,
          }
          this.config.margin = _config.margin || { top: 40, bottom: 50, right: 0, left: 0 }
          this.data = _config.data;
          this.maxCount = _config.maxCount;
          this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        const titleOffset = 50;
        const yAxisLabelOffset = 180;
        const plotWidth = 300;
        const plotHeight = 175;
        console.log('viz data: ', vis.data);
        const svg = d3.select(`svg${vis.config.parentElement}`)
        const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'scatterplot');
        vis.pageName = vis.data[0].page;

        vis.xScale = d3.scaleLinear()
            .domain([0, vis.maxCount])
            .range([0, plotWidth])
        
        vis.yScale = d3.scaleBand()
            .domain(["no factual content", "mostly false", "mixture of true and false", "mostly true"])
            .range([0, plotHeight])

        const formatter = d3.format(".1s");

        vis.xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${yAxisLabelOffset}, ${plotHeight+titleOffset})`)
            .call(d3.axisBottom(vis.xScale).tickFormat(formatter))

        vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${yAxisLabelOffset}, ${titleOffset})`)
            .call(d3.axisLeft(vis.yScale))
    }

    update() {
        let vis = this;
        console.log('new data is for page: ', vis.data[0].page)
        console.log('new data: ', vis.data)
        vis.pageName = vis.data[0].page;
        vis.render();
    }

    render() {
        let vis = this;
        const chart = d3.select(`${vis.config.parentElement} g.scatterplot`);
        console.log('chart', chart);
        const chartTitle = chart.selectAll('text.chartTitle').data([vis.pageName])
        console.log('vis.width: ', vis.width)
        chartTitle.enter().append('text').merge(chartTitle)
            .text(vis.pageName)
            .attr('class', 'chartTitle')
            .style('text-anchor', 'middle')
            .attr('x', vis.width/2) // TODO: fix this positioning lol
            .attr('y', 10)
        
        chartTitle.exit().remove();
    }
}