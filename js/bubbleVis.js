class bubbleVis {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 870,
    }

    this.data = _config.data;
    this.xValue = _config.pageValue;
    this.idValue = _config.idValue;
    this.colorValue = _config.colorValue; 
    this.zValue = _config.zValue;
    this.selectedCategory = _config.selectedCategory;
    this.svg = d3.select(this.config.parentElement);
    this.chart = this.svg.append('g');

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.forceStrength = 0.2;
    vis.bubbles = null;
    vis.nodes = [];

    vis.center = {
      x: vis.config.containerWidth / 2,
      y: vis.config.containerHeight / 2 };

    function charge(d) {
      return -Math.pow(d.radius, 2.08) * vis.forceStrength;
    }


    vis.simulation = d3.forceSimulation()
      .velocityDecay(0.2)
      .force('x', d3.forceX().strength(vis.forceStrength).x(vis.center.x))
      .force('y', d3.forceY().strength(vis.forceStrength).y(vis.center.y))
      .force('charge', d3.forceManyBody().strength(charge))
      .on('tick', () => vis.ticked(vis));

    vis.simulation.stop();

    vis.colorScale = d3.scaleOrdinal()
      .domain(['no factual content', 'mostly false', 'mixture of true and false', 'mostly true'])
      .range(['#634265', '#E05E5E', '#D3DCE7', '#67D99B']);
      
    const maxValue = d3.max(vis.data, vis.zValue);

    vis.zScale = d3.scalePow()
    .exponent(0.5)
    .range([2, 80])
    .domain([0, maxValue]);
  }

  update() {
    let vis = this;

    vis.render();
  }

  render() {
    let vis = this;

    vis.nodes = vis.createNodes(vis.data);

    vis.bubbles = vis.svg.selectAll('.bubble')
      .data(vis.nodes, vis.idValue);
    
    var bubbleElements = vis.bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', d => vis.colorScale(d.color));
      // .on('mouseover', showDetail)
      // .on('mouseout', hideDetail);

    vis.bubbles = vis.bubbles.merge(bubbleElements);

    vis.bubbles.transition()
      .duration(2000)
      .attr('r', d => d.radius);

    vis.simulation.nodes(vis.nodes)
      .restart();

  }

  createNodes() {
    let vis = this; 

    var nodes = vis.data.map(function (d) {
      return {
        id: vis.idValue(d),
        radius: vis.zScale(vis.zValue(d)),
        value: vis.zValue(d),
        category: vis.xValue(d),
        color: vis.colorValue(d),
        x: Math.random() * 900,
        y: Math.random() * 800
      }
    });

      nodes.sort(function (a, b) { return b.value - a.value; });
    return nodes;
  }

  ticked(vis) {
    vis.bubbles
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }
}