class groupedBarVis {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 580,
            containerHeight: _config.containerHeight || 580,
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
        const leftShift = 125;
        const svg = d3.select('svg#groupedBarVis');
        let g = svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

          const titleOffset = 40;
          const titleG = g.append('g')
            .attr('class', 'vis-title')
            .style('fill', '#434244')
            .style('font-size', '24px')
            .attr('text-anchor', 'middle')
            .attr('width', '200px');

          titleG.append('text')
            .text("What is the percentage of engagement")
            .attr('x', vis.width/2)

          titleG.append('text')
            .text("resulting from each type of post across")
            .attr('y', titleOffset+10)
            .attr('x', vis.width/2)

          titleG.append('text')
          .text("the political spectrum?")
          .attr('y', titleOffset+20)
          .attr('x', vis.width/2)

        const formatter = d3.format(".0%");

        vis.xScale = d3.scaleLinear()
            .domain([0,1])
            .range([0, vis.width]);

        vis.xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${leftShift}, ${vis.height+titleOffset})`)
            .call(d3.axisBottom(vis.xScale).tickFormat(formatter))

        vis.yScale = d3.scaleBand()
            .domain(categories)
            .range([0, vis.height])

        vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${leftShift}, ${titleOffset})`)
            .call(d3.axisLeft(vis.yScale).tickSizeInner(0))
    }

    update() {
        let vis = this;
        vis.render();
    }

    render() {
        let vis = this;
    }
}