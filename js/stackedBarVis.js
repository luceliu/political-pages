class stackedBarVis {
    constructor(_config) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: _config.containerWidth || 1000,
          containerHeight: _config.containerHeight || 870,
        }
    
        this.data = _config.data;

        this.initVis();
      }

      initVis() {
          let vis = this;
          console.log(vis.data);
      }

      update() {
          let vis = this;
          vis.render();
      }

      render() {
          let vis = this;
          
      }
}