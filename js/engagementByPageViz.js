class engagementByPageViz {
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
        console.log('viz data: ', vis.data);
        const svg = d3.select(`svg${vis.config.parentElement}`)
        const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'pleaseSeeMe');
    }

    update() {
        let vis = this;
        console.log('new data is for page: ', vis.data[0].page)
        console.log('new data: ', vis.data)
        vis.render();
    }

    render() {
        let vis = this;

    }
}