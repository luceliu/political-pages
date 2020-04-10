class colorLegend {

    constructor(_config) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 180,
        containerHeight: _config.containerHeight || 126,
      }

      // set size of color square  
      this.squareSize = _config.squareSize;
      this.svg = d3.select(this.config.parentElement);
      
      // create color scale
      this.colorScale = d3.scaleOrdinal()
        .domain(['no factual content *', 'mostly false', 'mixture of true and false', 'mostly true'])
        .range(['#634265', '#E05E5E', '#D3DCE7', '#67D99B']);
  
      this.render();
    }
    
    render() {
        const backgroundRect = this.svg.selectAll('rect')
            .data([null]);

        const numLines = this.colorScale.domain().length;
        const spacing = 28;

        const groups = this.svg.selectAll('.tick')
            .data(this.colorScale.domain());

        const groupsEnter = groups
        .enter().append('g')
            .attr('class', 'tick');
            
        groupsEnter
        .merge(groups)
            .attr('transform', (d, i) =>
            `translate(0, ${i * spacing})`
        );

        groups.exit().remove();

        groupsEnter.append('rect')
            .merge(groups.select('rect'))
            .attr('width', this.squareSize)
            .attr('height', this.squareSize)
            .attr('fill', this.colorScale);

        groupsEnter.append('text')
            .merge(groups.select('text'))
            .text(d => d)
            .attr('dy', '0.82em')
            .attr('x', 28);
    }
  }