class SmallMultiplesPagesViz {
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

    }

    update() {
        let vis = this;
        vis.render();
    }

    render() {
        let vis = this;

    }
}