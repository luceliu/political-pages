class bubbleVis {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1280,
      containerHeight: _config.containerHeight || 800,
    }

    this.data = _config.data;
    this.pageValue = _config.pageValue;
    this.idValue = _config.idValue;
    this.colorValue = _config.colorValue; 
    this.zValue = _config.zValue;
    this.svg = d3.select(this.config.parentElement);
    this.chart = this.svg.append('g');
    this.formatValue = _config.formatValue;
    this.linkValue = _config.linkValue;
    this.politicalValue = _config.politicalValue;

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    vis.tt = new tooltip('bubble_tooltip', 180);

    vis.forceStrength = 0.2;
    vis.bubbles = null;
    vis.nodes = [];

    vis.center = {
      x: vis.config.containerWidth / 2,
      y: vis.config.containerHeight / 2
    };

    vis.politicalCenters = {
      'left': { x: vis.config.containerWidth / 3, y: vis.config.containerHeight / 2 },
      'mainstream': { x: vis.config.containerWidth / 2, y: vis.config.containerHeight / 2 },
      'right': { x: 2 * vis.config.containerWidth / 3, y: vis.config.containerHeight / 2 }
    }

    vis.categoryLabelCenters = {
      'left': vis.config.containerWidth / 3 - 30,
      'mainstream': vis.config.containerWidth / 2 + 110,
      'right': 2 * vis.config.containerWidth / 3 + 150
    }

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

    vis.formatScale = d3.scaleOrdinal()
    .domain(['link', 'video', 'photo'])
    .range(['🔗', '⏯️', '🖼️']);
      
    const maxValue = d3.max(vis.data, vis.zValue);

    vis.zScale = d3.scalePow()
    .exponent(0.5)
    .range([2, 72])
    .domain([0, maxValue]);
  }

  update(layoutID) {
    let vis = this;
    
    vis.updateLayout(layoutID);
  }

  render() {
    let vis = this;

    vis.nodes = vis.createNodes(vis.data);

    vis.bubbles = vis.svg.selectAll('.bubble')
      .data(vis.nodes, vis.idValue);
    
    var bubbleElements = vis.bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', d => vis.colorScale(d.color))
      .on('mouseover', (d, i, nodes) => vis.setHover(d, vis, nodes[i]))
      .on('mouseout', (d, i, nodes) => vis.removeHover(d, vis, nodes[i]))
      .on('click', d => {
        window.open(d.link, '_blank')
      });

    vis.bubbles = vis.bubbles.merge(bubbleElements);

    vis.bubbles
      .transition()
        .duration(2000)
        .attr('r', d => d.radius);

    vis.simulation.nodes(vis.nodes)
      .restart();

  }

  createNodes() {
    let vis = this; 

    var nodes = vis.data.map(function (d) {
      return {
        itemID: vis.idValue(d),
        radius: vis.zScale(vis.zValue(d)),
        zValue: vis.zValue(d),
        color: vis.colorValue(d),
        format: vis.formatValue(d),
        page: vis.pageValue(d),
        link: vis.linkValue(d),
        category: vis.politicalValue(d),
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

  setHover(d, vis, circle) {
    let c = d3.hsl(vis.colorScale(d.color));
    c.s += 0.1;
    c.l -= 0.25;

    vis.bubblePoliticalPosition(d, vis);

    d3.select(circle)
      .attr('stroke', c)
      .attr('stroke-width', 4);

    let dynamicFormatEmoji = vis.formatScale(d.format);

    const content = '<p class="header">' +
    dynamicFormatEmoji + ' ' + d.format +
    '</p>' +
    '<p class="attr">Rating</p><p class="value dynamic-color">' +
    d.color +
    '</p>' +
    '<p class="attr">Engagement Count</p><p class="value">' +
    d.zValue +
    '</p>' + 
    '<p class="attr">Page</p><p class="value">' +
    d.page + 
    '</p>';

    let dynamicColor = d3.hsl(vis.colorScale(d.color));

    if(d.color != 'no factual content') {
      dynamicColor.s += 0.1;
      dynamicColor.l -= 0.15;
    }

    vis.tt.showTooltip(content, d3.event, dynamicColor);
  }

  removeHover(d, vis, circle) {
    d3.select(circle)
      .attr('stroke','none')
      .attr('stroke-width', 0);
    vis.tt.hideTooltip();
  }

  // Provides a x-value for each bubble for splitting
  // by political category

  bubblePoliticalPosition(d, vis) {
    return vis.politicalCenters[d.category].x;
  }

  updateLayout(layout) {
    let vis = this;
    if(layout === 'political-layout') {
      vis.simulation.force('x', d3.forceX().strength(vis.forceStrength)
        .x((d) => vis.bubblePoliticalPosition(d, vis)));
      vis.simulation.alpha(1).restart();
      vis.renderLabels(layout);
    } else if (layout === 'all-layout') {
      vis.simulation.force('x', d3.forceX().strength(vis.forceStrength)
        .x(vis.center.x));
      vis.simulation.alpha(1).restart();
      vis.hideLabels();
    }
  }

  renderLabels(layout) {
    let vis = this;
    if (layout === 'political-layout') {
      const categories = d3.keys(vis.categoryLabelCenters);
      const categoryLabels = vis.svg.selectAll('.category')
        .data(categories);
      
      categoryLabels.enter().append('text')
        .attr('class', 'category')
        .attr('color', '#8D9097')
        .attr('x', d => vis.categoryLabelCenters[d])
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .text(d => d)
        .transition().duration(300)
        .attr( 'fill-opacity', 1);
    }
  }

  hideLabels() {
    let vis = this;
    vis.svg.selectAll('.category')
    .transition().duration(300)
    .attr( 'fill-opacity', 0)
    .remove();
  }
  
}