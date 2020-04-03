class engagementByPageViz {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
          }
          this.config.margin = _config.margin || { top: 32, bottom: 50, right: 8, left: 0 }
          this.data = _config.data;
          this.maxCount = _config.maxCount;

          this.yDomain = _config.yDomain || ["no factual content", "mostly false", "mixture of true and false", "mostly true"];
          this.xValue = _config.xValue || (p => p.engCount);
          this.yValue = _config.yValue || (p => p.rating);

          this.colourValue = _config.colourValue;
          this.colourScale = _config.colourScale;

          this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.titleOffset = 50;
        vis.yAxisLabelOffset = 180;
        vis.plotWidth = vis.width - vis.yAxisLabelOffset; // actual width of chart, i.e. excluding title & axes labels
        vis.plotHeight = 175;
        vis.POINT_RADIUS = 3;
        const svg = d3.select(`svg${vis.config.parentElement}`)
        const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'scatterplot');
        vis.pageName = vis.data[0].page; // just grab from the first index since they're all the same
        console.log(vis.data);

        vis.xScale = d3.scaleLog()
            .domain([1, vis.maxCount])
            .range([0, vis.plotWidth])
        
        vis.yScale = d3.scaleBand()
            .domain(vis.yDomain)
            .range([0, vis.plotHeight])

        const formatter = d3.format(".2s");

        vis.xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.plotHeight+vis.titleOffset})`)
            .call(d3.axisBottom(vis.xScale).tickFormat(formatter).ticks(4))

        vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.titleOffset})`)
            .call(d3.axisLeft(vis.yScale))
    }

    update() {
        let vis = this;
        console.log('new data is for page: ', vis.data[0].page)
        console.log('new data: ', vis.data)
        vis.pageName = vis.data[0].page;
        // not binding post/circle data correctly. workaround for now:
        d3.selectAll(`${vis.config.parentElement} g.all-circles`).remove();
        vis.render();
    }

    render() {
        let vis = this;
        const chart = d3.select(`${vis.config.parentElement} g.scatterplot`);
        console.log('chart', chart);
        const chartTitle = chart.selectAll('text.chartTitle').data([vis.pageName])
        console.log('vis.width: ', vis.width)

        chartTitle.enter().append('text').merge(chartTitle)
            // .transition()
            .text(vis.pageName)
            .attr('class', 'chartTitle')
            .style('text-anchor', 'middle')
            .attr('x', vis.width/2) // TODO: fix this positioning lol
            .attr('y', 10)
        
        chartTitle.exit().remove();

        const postPoints = chart.append('g')
            .attr('class', 'all-circles')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.titleOffset+22})`);

        postPoints.selectAll('.all-circles circle')
            .data(vis.data)
            .enter()
            .append('circle')
            .merge(postPoints)
            // .transition()
            .attr('r', vis.POINT_RADIUS)
            .attr('cx', p => vis.xScale(vis.xValue(p)))
            .attr('cy', p => vis.yScale(vis.yValue(p)))
            .style('fill', d => vis.colourScale == null ? '' : vis.colourScale(vis.colourValue(d)))

        postPoints.exit().remove();
    }
}