class asymmetricalViolin {
    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
        }
        this.config.margin = _config.margin || { top: 32, bottom: 50, right: 8, left: 0 }
        this.data = _config.data;
        this.maxCount = _config.maxCount;

        this.yDomain = _config.yDomain || ["no factual content", "mostly false", "mixture of true and false", "mostly true"];
        this.xValue = _config.xValue || (p => p.engCount);
        this.yValue = _config.yValue || (p => p.rating);

        this.colourValue = _config.colourValue;
        this.colourScale = _config.colourScale;

        this.binGranularity = 5;

        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.titleOffset = 50;
        vis.yAxisLabelOffset = 40;
        vis.plotWidth = vis.width - vis.yAxisLabelOffset; // actual width of chart, i.e. excluding title & axes labels
        vis.plotHeight = 250;
        vis.POINT_RADIUS = 3;
        const svg = d3.select(`svg${vis.config.parentElement}`)
        const g = svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'scatterplot');
        vis.pageName = vis.data[0].page; // just grab from the first index since they're all the same
        console.log(vis.data);

        // vis.xScale = d3.scaleLog()
        //     .domain([1, vis.maxCount])
        //     .range([0, vis.plotWidth])

        // vis.yScale = d3.scaleBand()
        //     .domain(vis.yDomain)
        //     .range([0, vis.plotHeight])
        // const formatter = d3.format(".2s");

        vis.yScale = d3.scaleLog()
            .domain([1, vis.maxCount])
            .range([vis.plotHeight, 0])
            .nice()

        vis.xScale = d3.scaleBand()
            .domain(vis.yDomain)
            .range([vis.yAxisLabelOffset, vis.plotWidth])
        const formatter = d3.format(".2s");

        vis.xAxis = g.append('g')
            .attr('class', 'x-axis')
            //.attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.plotHeight + vis.titleOffset})`)
            // .call(d3.axisBottom(vis.xScale).tickFormat(formatter).ticks(4))
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.plotHeight + vis.titleOffset})`)
            .call(d3.axisBottom(vis.xScale))

        vis.yAxis = g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.titleOffset})`)
            //.attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.titleOffset})`)
            // .call(d3.axisLeft(vis.yScale))
            .call(d3.axisLeft(vis.yScale).tickFormat(formatter).ticks(4))

        vis.histogram = d3.histogram()
            //.domain(vis.xScale.domain())
            .domain(vis.yScale.domain())
            //.thresholds(vis.xScale.ticks(vis.binGranularity))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .thresholds(vis.yScale.ticks(vis.binGranularity))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
            .value(d => d)


        // I could probably just compute bins for each Category 
        // manually, but why not do it the d3 way?
        // var sumstat = d3.nest()  // nest function allows to group the calculation per level of a factor
        //     .key(d => d.Category)
        //     .rollup(function (d) {   // For each key..
        //         console.log("What is d?");
        //         console.log(d);
        //         let level = d.map(p => p.engCount)    // Keep the variable called Sepal_Length
        //         let bins = vis.histogram(level)   // And compute the binning on it.
        //         return (bins)
        //     }, d => d.Category)
        //     .entries(vis.data)


        let processed = [];
        ['link', 'photo', 'video'].forEach(type => {
            let ratingsHistogram = ["no factual content", "mostly false", "mixture of true and false", "mostly true"].reduce(
                (acc, cur) => {
                    acc.push({
                        rating: cur,
                        bins: vis.histogram(
                        vis.data.filter(item => item.format == type && item.rating == cur).map(p => p.engCount))});
                    return acc;
                    }, []
                );
            processed.push({format: type, bins: ratingsHistogram});
        });

        console.log(vis.data);
        console.log(processed);
        vis.processed = processed;

        //console.log(Object.keys(processed).map(type =>Object.keys(processed[type]).map(rating => d3.max(processed[type][rating].map(d => d.length)))))
        vis.maxByPage = Math.max(...Object.keys(processed)
        .map(type => Math.max(...Object.keys(processed[type].bins)
        .map(rating => d3.max(processed[type].bins[rating].bins.map(d => d.length))))));

        console.log(vis.maxByPage)
        // var maxNum = 0
        // for (i in sumstat) {
        //     allBins = sumstat[i].value
        //     lengths = allBins.map(function (a) { return a.length; })
        //     longuest = d3.max(lengths)
        //     if (longuest > maxNum) { maxNum = longuest }
        // }
        
        // how many posts are of a certain rating?
        vis.violinScale = d3.scaleLinear()
            .domain([0, vis.maxByPage])
            //.range([0, vis.yScale.bandwidth() /2]);
            .range([0, vis.xScale.bandwidth()/3*2]);
    }

    update() {
        let vis = this;
        vis.pageName = vis.data[0].page;
        // not binding post/circle data correctly. workaround for now:
        d3.selectAll(`${vis.config.parentElement} g.all-circles`).remove();
        vis.render();
    }

    // https://www.d3-graph-gallery.com/graph/violin_basicHist.html
    render() {
        let vis = this;
        const chart = d3.select(`${vis.config.parentElement} g.scatterplot`);
        console.log('chart', chart);
        const chartTitle = chart.selectAll('text.chartTitle').data([vis.pageName])
        console.log('vis.width: ', vis.width)

        chartTitle.enter().append('text').merge(chartTitle)
            // .transition()
            .text(vis.pageName)
            .attr('class', 'chartTitle')
            .style('text-anchor', 'middle')
            .attr('x', vis.width / 2) // TODO: fix this positioning lol
            .attr('y', 10)

        chartTitle.exit().remove();

        const typeGroup = chart.selectAll('.type-group').data(vis.processed)
        .enter()
        .append('g')
        .attr('class', 'type-group')
        //.attr('transform', `translate(${vis.yAxisLabelOffset}, ${vis.titleOffset + 22})`);
        .attr('transform', `translate(${vis.yAxisLabelOffset + vis.xScale.bandwidth()/2}, ${vis.titleOffset})`);

        // now append a plot for each rating for each type
        const ratingGroup = typeGroup.selectAll('.rating-group').data(d => [d])
        .enter()
        .append('g')
        .attr('class', 'rating-group')
        // move down to correct y coordinate
        //.attr('transform', d => `translate(0, ${vis.yScale(vis.yValue(d))})`);
        .attr('transform', d => `translate(${vis.xScale(vis.yValue(d))}, 0)`);

        let ratingGroupBins = ratingGroup.selectAll('path').data(d => d.bins)
        .enter();

        ratingGroupBins.data(d => d.bins)
        .append("path")
        //.style('fill', d => vis.colourScale == null ? '' : vis.colourScale(vis.colourValue(d)))
        .style('fill', "none")
        .attr("transform", d => d.rating == 'mixture of true or false' || d.rating == 'mostly false' ? '' : `scale(-1, 1)`)
        .style("stroke", d => vis.colourScale == null ? '' : vis.colourScale(vis.colourValue(d)))
        
        .datum(d => d.bins)     // So now we are working bin per bin
        //.style('fill', d => vis.colourScale == null ? '' : vis.colourScale((' ' + currRating).slice(1)))
        .attr("d", d3.line()//d3.area()
            // .x0(d => vis.violinScale(-d.length))
            // .x1(d => vis.violinScale(d.length))
            .y(d => vis.yScale(d.x0))
            .x(d => vis.violinScale(d.length))
            // .y(d => vis.yScale(d.x0))
            .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        );
    }
}