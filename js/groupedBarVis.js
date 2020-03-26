class groupedBarVis {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 580,
            containerHeight: _config.containerHeight || 580,
          }
          this.config.margin = _config.margin || { top: 40, bottom: 140, right: 30, left: 170 }
          this.perCategoryData = _config.perCategoryData;
  
          this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;


        const svg = d3.select('svg#groupedBarVis');
        let g = svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        const formatter = d3.format(".0%");
    }

    update() {
        let vis = this;
        vis.render();
    }

    render() {
        let vis = this;
    }
}