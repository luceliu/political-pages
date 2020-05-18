class asymmetricalViolin {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
        }
        this.config.margin = _config.margin || { top: 16, bottom: 50, right: 20, left: 8 }
        this.data = _config.data;
        this.maxCount = _config.maxCount;

        this.yDomain = _config.yDomain || ["no factual content", "mostly false", "mixture of true and false", "mostly true"];
        this.xValue = _config.xValue || (p => p.engCount);
        this.yValue = _config.yValue || (p => p.rating);

        this.colourValue = _config.colourValue;
        this.colourScale = _config.colourScale;

        this.onMouseover = _config.onMouseover;
        this.onMouseout = _config.onMouseout;

        this.binGranularity = 5;
        this.chartName = _config.chartName;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.titleOffset = 50;
        vis.yAxisLabelOffset = 60;
        vis.plotWidth = vis.width - vis.yAxisLabelOffset; // actual width of chart, i.e. excluding title & axes labels
        vis.plotHeight = 250;
        vis.POINT_RADIUS = 3;

        const svg = d3.select(`svg${vis.config.parentElement}`)
        const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'violin');
        vis.pageName = vis.data[0].page; // just grab from the first index since they're all the same

        vis.yScale = d3.scaleLog()
            .domain([1, vis.maxCount])
            .range([vis.plotHeight, 0])
            .nice();

        vis.xScale = d3.scaleBand()
            .domain(vis.yDomain)
            .range([0, vis.plotWidth])
        const formatter = d3.format(".2s");

        vis.xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.plotHeight + vis.titleOffset})`)
            .call(d3.axisBottom(vis.xScale).tickSizeOuter(0));

        vis.xAxis.selectAll('.domain').remove();

        vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset / 2}, ${vis.titleOffset})`)
            .call(d3.axisLeft(vis.yScale).tickFormat(formatter).ticks(4).tickSizeOuter(0))

        vis.histogram = d3.histogram()
            .domain(vis.yScale.domain())
            .thresholds(vis.yScale.ticks(vis.binGranularity))
            .value(d => d)

        // create histogram bins for each post format and rating
        let processed = [];
        ['link', 'photo', 'video'].forEach(type => {
            let ratingsHistogram = ["no factual content", "mostly false", "mixture of true and false", "mostly true"].reduce(
                (acc, cur) => {
                    acc.push({
                        rating: cur,
                        bins: vis.histogram(
                            vis.data.filter(item => item.format == type && item.rating == cur).map(p => p.engCount))
                    });
                    return acc;
                }, []
            );
            processed.push({ format: type, bins: ratingsHistogram });
        });

        vis.processed = processed;

        vis.maxByPage = Math.max(...Object.keys(processed)
            .map(type => Math.max(...Object.keys(processed[type].bins)
                .map(rating => d3.max(processed[type].bins[rating].bins.map(d => d.length))))));

        // how many posts are of a certain rating?
        vis.violinScale = d3.scaleLinear()
            .domain([0, vis.maxByPage])
            .range([0, vis.xScale.bandwidth() / 3 * 2]);

        // canvas setup
        const chart = d3.select(`${vis.config.parentElement} g.violin`);
        const chartTitle = chart.selectAll('text.chartTitle').data([vis.pageName]);

        // add a chart title
        chartTitle.enter().append('text').merge(chartTitle)
            .text(vis.chartName)
            .attr('class', 'chartTitle')
            .style('text-anchor', 'middle')
            .attr('x', vis.width / 2)
            .attr('y', 24)

        chartTitle.exit().remove();

        // set up groups for each format
        let typeGroup = chart.selectAll('.type-group').data(vis.processed);
        let typeGroupEnter = typeGroup.enter()
            .append('g')
            .attr('class', 'type-group')
            .attr('transform', `translate(${vis.yAxisLabelOffset + vis.xScale.bandwidth() / 2}, ${vis.titleOffset})`);

        // now append a plot for each rating for each type
        vis.ratingGroup = typeGroup.merge(typeGroupEnter).selectAll('.rating-group').data(d => [d]);
        vis.ratingGroupEnter = vis.ratingGroup
            .enter()
            .append('g')
            .attr('class', 'rating-group')
            .attr("group-type", d => d.rating)
            // move down to correct y coordinate
            .attr('transform', d => `translate(${vis.xScale(vis.yValue(d))}, 0)`);

    }

    update(selectedTruthCategory) {
        let vis = this;
        vis.selectedRating = selectedTruthCategory;
        vis.render();
    }

    // https://www.d3-graph-gallery.com/graph/violin_basicHist.html
    render() {
        let vis = this;

        // draw each curve
        let ratingGroupBins = vis.ratingGroup.merge(vis.ratingGroupEnter).selectAll('path').data(d => d.bins);

        let ratingGroupBinsDeeper = ratingGroupBins.data(d => d.bins);
        ratingGroupBinsDeeper.enter()
        .append("path")
        .attr("class", d => d.rating)
            .style('fill', "none")
            .on("mouseover", function(d) {
                vis.onMouseover(d3.select(this).attr("class"));
            })
            .on("mouseout", vis.onMouseout)
            .attr("transform", d => d.rating == 'mixture of true or false' || d.rating == 'mostly false' ? '' : `scale(-1, 1)`)
            .style("stroke", d => vis.colourScale == null ? '' : vis.colourScale(vis.colourValue(d)))
            .style("stroke-width", 1.5)
            // draw the line for a curve from the histogram bins
            .datum(d => d.bins)
            .attr("d", d3.line()
                .y(d => vis.yScale(d.x0))
                .x(d => vis.violinScale(d.length))
                .curve(d3.curveCatmullRom)    // smooth the line
            )
            .merge(ratingGroupBins)
            // interactivity
            .transition()
            .style("stroke-opacity", d => vis.selectedRating == null || vis.selectedRating == d.rating ? 1 : 0.2)


    }
}
