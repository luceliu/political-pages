class engagementByPageViz {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
          }
          this.config.margin = _config.margin || { top: 24, bottom: 50, right: 8, left: 0 }
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
        vis.titleOffset = 24;
        vis.yAxisLabelOffset = 180;
        vis.plotWidth = vis.width - vis.yAxisLabelOffset; // actual width of chart, i.e. excluding title & axes labels
        vis.plotHeight = 175;
        vis.POINT_RADIUS = 3;
        const svg = d3.select(`svg${vis.config.parentElement}`)
        const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'scatterplot');
        vis.pageName = vis.data[0].page; // just grab from the first index since they're all the same

        vis.xScale = d3.scaleLog()
            .domain([1, vis.maxCount])
            .range([0, vis.plotWidth])
            .nice()
        
        vis.yScale = d3.scaleBand()
            .domain(vis.yDomain)
            .range([0, vis.plotHeight])

        const formatter = d3.format(".2s");

        vis.xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.plotHeight+vis.titleOffset})`)
            .call(d3.axisBottom(vis.xScale).tickSizeInner(0).tickSizeOuter(0).tickFormat(formatter).ticks(4))

        vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.titleOffset})`)
            .call(d3.axisLeft(vis.yScale).tickSizeInner(0).tickSizeOuter(0))

        // give axis labels some breathing space
        d3.selectAll(`${vis.config.parentElement} .x-axis text`)
            .attr('transform', 'translate(0, 10)')

        d3.selectAll(`${vis.config.parentElement} .y-axis text`)
            .attr('transform', 'translate(-10, 0)')
    }

    update() {
        let vis = this;
        vis.pageName = vis.data[0].page;
        d3.selectAll(`${vis.config.parentElement} g.all-circles`).remove();
        vis.render();
    }

    render() {
        let vis = this;
        const chart = d3.select(`${vis.config.parentElement} g.scatterplot`);
        const chartTitle = chart.selectAll('text.chartTitle').data([vis.pageName])

        chartTitle.enter().append('text').merge(chartTitle)
            .text(vis.pageName)
            .attr('class', 'chartTitle')
            .style('text-anchor', 'middle')
            .attr('x', vis.width/3 * 2.25)
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
            .attr('r', vis.POINT_RADIUS)
            .attr('cx', p => vis.xScale(vis.xValue(p)))
            .attr('cy', p => vis.yScale(vis.yValue(p)))
            .style('fill', d => vis.colourScale == null ? '' : vis.colourScale(vis.colourValue(d)))

        postPoints.exit().remove();
    }
}