class bubbleVis {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 900,
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
    
    // initialize tooltip with width
    vis.tt = new tooltip('bubble_tooltip', 180);

    vis.forceStrength = 0.15;
    vis.bubbles = null;
    vis.nodes = [];

    // center of the visualization for positioning bubbles
    vis.center = {
      x: vis.config.containerWidth / 2,
      y: 1.25 * vis.config.containerHeight / 3
    };

    // center coordinates for political category layout
    vis.politicalCenters = {
      'left': { x: vis.config.containerWidth / 3, y: 1.3 * vis.config.containerHeight / 3},
      'mainstream': { x: vis.config.containerWidth / 2, y: 1.25 * vis.config.containerHeight / 3 },
      'right': { x: 2 * vis.config.containerWidth / 3, y: 1.2 * vis.config.containerHeight / 3 }
    }

    // x-position for political category labels
    vis.categoryLabelCenters = {
      'left': vis.config.containerWidth / 3 - 30,
      'mainstream': vis.config.containerWidth / 2 + 60,
      'right': 2 * vis.config.containerWidth / 3 + 80
    }

    // center coordinates for Page layout
    vis.pageCenters = {
      'The Other 98%': { x: vis.config.containerWidth / 3, y: vis.config.containerHeight / 3 - 20 },
      'Addicting Info': { x: vis.config.containerWidth / 3, y: vis.config.containerHeight / 2 - 20 },
      'Occupy Democrats': { x: vis.config.containerWidth / 3, y: 2 * vis.config.containerHeight / 3 },
      'Politico': { x: vis.config.containerWidth / 2, y: vis.config.containerHeight / 3 - 30 },
      'CNN Politics': { x: vis.config.containerWidth / 2, y: vis.config.containerHeight / 2 - 22 },
      'ABC News Politics': { x: vis.config.containerWidth / 2, y: 2 * vis.config.containerHeight / 3 - 20 },
      'Eagle Rising': { x: 2 * vis.config.containerWidth / 3, y: vis.config.containerHeight / 3 - 50 },
      'Right Wing News': { x: 2 * vis.config.containerWidth / 3, y: vis.config.containerHeight / 2 - 20 },
      'Freedom Daily': { x: 2 * vis.config.containerWidth / 3, y: 2 * vis.config.containerHeight / 3 - 20 },
    }

    // center coordinates for Page labels 
    vis.pageLabelCenters = {
      'The Other 98%': { x: vis.config.containerWidth / 3 - 40, y: vis.config.containerHeight / 3 - 200 },
      'Addicting Info': { x: vis.config.containerWidth / 3 - 40, y: vis.config.containerHeight / 2 - 100 },
      'Occupy Democrats': { x: vis.config.containerWidth / 3 - 40, y: 2 * vis.config.containerHeight / 3 - 104 },
      'Politico': { x: vis.config.containerWidth / 2 + 40, y: vis.config.containerHeight / 3 - 200 },
      'CNN Politics': { x: vis.config.containerWidth / 2 + 40, y: vis.config.containerHeight / 2 - 100 },
      'ABC News Politics': { x: vis.config.containerWidth / 2 + 60, y: 2 * vis.config.containerHeight / 3 - 10 },
      'Eagle Rising': { x: 2 * vis.config.containerWidth / 3 + 80, y: vis.config.containerHeight / 3 - 190 },
      'Right Wing News': { x: 2 * vis.config.containerWidth / 3 + 80, y: vis.config.containerHeight / 2 - 100 },
      'Freedom Daily': { x: 2 * vis.config.containerWidth / 3 + 80, y: 2 * vis.config.containerHeight / 3 - 20 },
    }

    // charge function that is called for each node, creates repulsion between nodes
    function charge(d) {
      return -Math.pow(d.radius, 2.08) * vis.forceStrength;
    }

    // create force layout
    vis.simulation = d3.forceSimulation()
      .velocityDecay(0.18)
      .force('x', d3.forceX().strength(vis.forceStrength).x(vis.center.x))
      .force('y', d3.forceY().strength(vis.forceStrength).y(vis.center.y))
      .force('charge', d3.forceManyBody().strength(charge))
      .on('tick', () => vis.ticked(vis));

    // stop the visualization since nodes haven't been initialized yet
    vis.simulation.stop();

    // color scale for truthfulness categories
    vis.colorScale = d3.scaleOrdinal()
      .domain(['no factual content', 'mostly false', 'mixture of true and false', 'mostly true'])
      .range(['#634265', '#E05E5E', '#D3DCE7', '#67D99B']);

    // emoji scale for post formats
    vis.formatScale = d3.scaleOrdinal()
    .domain(['link', 'video', 'photo'])
    .range(['🔗', '⏯️', '🖼️']);
      
    const maxValue = d3.max(vis.data, vis.zValue);

    // radius scale
    vis.zScale = d3.scalePow()
    .exponent(0.5)
    .range([2, 40])
    .domain([0, maxValue]);
  }

  update(layoutID) {
    let vis = this;
    
    // update bubble layout with selected layout
    vis.updateLayout(layoutID);
  }

  render() {
    let vis = this;

    // initialize nodes
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

    // create node objects given csv data
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

    // sort nodes to prevent occlusion of smaller nodes
    nodes.sort(function (a, b) { return b.value - a.value; });
    return nodes;
  }

  // reposition bubbles after each tick of force simulation
  ticked(vis) {
    vis.bubbles
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  // set styling for hovered bubble, display tooltip
  setHover(d, vis, circle) {
    // increase saturation, decrease luminance of given color for the selected stroke
    let c = d3.hsl(vis.colorScale(d.color));
    c.s += 0.1;
    c.l -= 0.25;

    // set stroke
    d3.select(circle)
      .attr('stroke', c)
      .attr('stroke-width', 4);

    // get emoji for given post format to render in tooltip
    let dynamicFormatEmoji = vis.formatScale(d.format);

    // format tooltip contents
    const content = '<p class="header">' +
    d.page +
    '</p>' +
    '<p class="attr">Rating</p><p class="value dynamic-color">' +
    d.color +
    '</p>' +
    '<p class="attr">Engagement Count</p><p class="value">' +
    d.zValue +
    '</p>' + 
    '<p class="attr">Format</p><p class="value">' +
    dynamicFormatEmoji + ' ' + d.format +
    '</p>';

    // get color based on truthfulness rating of selected bubble
    let dynamicColor = d3.hsl(vis.colorScale(d.color));

    // modify saturation and luminance if selected bubble is purple
    if(d.color != 'no factual content') {
      dynamicColor.s += 0.1;
      dynamicColor.l -= 0.15;
    }

    // render tooltip
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

  bubblePoliticalXPosition(d, vis) {
    return vis.politicalCenters[d.category].x;
  }

  bubblePoliticalYPosition(d, vis) {
    return vis.politicalCenters[d.category].y;
  }

  bubblePageXPosition(d, vis) {
    return vis.pageCenters[d.page].x;
  }
  bubblePageYPosition(d, vis) {
    return vis.pageCenters[d.page].y;
  }

  // updates the layout given selected layout
  // restarts the simulation to render bubbles in new x/y positions
  updateLayout(layout) {
    let vis = this;
    if(layout === 'political-layout') {
      vis.simulation
      .force('x', d3.forceX().strength(vis.forceStrength)
        .x((d) => vis.bubblePoliticalXPosition(d, vis)))
      .force('y', d3.forceY().strength(vis.forceStrength)
        .y((d) => vis.bubblePoliticalYPosition(d, vis)));
      vis.simulation.alpha(1).restart();
      vis.renderLabels(layout);
    } else if (layout === 'all-layout') {
      vis.simulation
      .force('x', d3.forceX().strength(vis.forceStrength)
        .x(vis.center.x))
      .force('y', d3.forceY().strength(vis.forceStrength)
        .y(vis.center.y));
      vis.simulation.alpha(1).restart();
      vis.hideLabels();
    } else {
      vis.simulation
      .force('x', d3.forceX().strength(vis.forceStrength)
        .x(d => vis.bubblePageXPosition(d, vis)))
      .force('y', d3.forceY().strength(vis.forceStrength)
        .y(d => vis.bubblePageYPosition(d, vis)));
      vis.simulation.alpha(1).restart();
      vis.renderLabels(layout);
    }
  }

  // render bubble grouping labels for the different layouts
  renderLabels(layout) {
    let vis = this;

    // political category layout 
    if (layout === 'political-layout') {
      // remove Page labels
      vis.svg.selectAll('.page')
      .transition().duration(300)
      .attr( 'fill-opacity', 0)
      .remove();

      const categories = d3.keys(vis.categoryLabelCenters);
      const categoryLabels = vis.svg.selectAll('.category')
        .data(categories);
      
      // render political category labels
      categoryLabels.enter().append('text')
        .attr('class', 'category')
        .attr('color', '#8D9097')
        .attr('x', d => vis.categoryLabelCenters[d])
        .attr('y', 64)
        .attr('text-anchor', 'middle')
        .text(d => d)
        .transition().duration(300)
        .attr( 'fill-opacity', 1);

    // Page layout
    } else {
      // remove political category labels
      vis.svg.selectAll('.category')
      .transition().duration(300)
      .attr( 'fill-opacity', 0)
      .remove();

      const pages = d3.keys(vis.pageLabelCenters);
      const pageLabels = vis.svg.selectAll('.page')
        .data(pages);
      
      // render Page labels 
      pageLabels.enter().append('text')
        .attr('class', 'page')
        .attr('color', '#8D9097')
        .attr('x', d => vis.pageLabelCenters[d].x)
        .attr('y', d => vis.pageLabelCenters[d].y)
        .attr('text-anchor', 'middle')
        .text(d => d)
        .transition().duration(300)
        .attr( 'fill-opacity', 1);
    }
  }

  // hide labels for when all posts layout is selected
  hideLabels() {
    let vis = this;
    
    vis.svg.selectAll('.category')
      .transition().duration(300)
      .attr( 'fill-opacity', 0)
      .remove();

    vis.svg.selectAll('.page')
    .transition().duration(300)
    .attr( 'fill-opacity', 0)
    .remove();
  }
}