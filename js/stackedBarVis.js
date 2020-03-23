class stackedBarVis {
    constructor(_config) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: _config.containerWidth || 1000,
          containerHeight: _config.containerHeight || 870,
        }
        this.config.margin = _config.margin || { top: 60, bottom: 25, right: 0, left: 0 }
        this.data = _config.data;
        this.perPageData = _config.postMap;

        this.initVis();
      }

      initVis() {
          let vis = this;
          console.log(vis.perPageData);
          const svg = d3.select('svg#stackedBarVis');
          const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        
          g.append('text')
            .attr('class', 'vis-title')
            .attr('y', -10)
            .attr('x', 0)
            .text('Percentage of a page’s total posts by truthfulness rating')

      }

      update() {
          let vis = this;
          vis.render();
      }

      render() {
          let vis = this;
          
      }
}