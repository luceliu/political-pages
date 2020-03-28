class circleJuxtaposeVis {

    // initialize different groups with 
    // 

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight
        }

        this.config.margin = _config.margin || { top: 100, bottom: 20, right: 0, left: 0 }

        this.data = _config.data;
        // deep copy this object so I can mess with it
        this.postMap = JSON.parse(JSON.stringify(_config.postMap));

        this.duration = _config.duration || 700;

        this.onMouseover = _config.onMouseover;
        this.onMouseout = _config.onMouseout;

        this.postCircleMouseover = _config.onRatingMouseover;
        this.postCircleMouseout = _config.onRatingMouseout;

        this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;
        this.height = this.config.containerHeight - this.config.margin.top - this.config.margin.bottom;

        d3.select(this.config.parentElement)
            .attr('height', this.config.containerHeight)
            .attr('width', this.config.containerWidth);

        this.chart = d3.select(this.config.parentElement).append('g')
            .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`)
            .attr('height', this.height)
            .attr('width', this.width);

        this.circleStroke = 6;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.frontTextPadding = 0;
        vis.backTextPadding = 0;

        // create two kinds of scales 
        // one for placement of total posts and one for fake
        // and one y-scale for the number of sites (9)

        // TODO compute percentages
        let ratingArray = ["mostly false", "mostly true", "mixture of true and false",
            "no factual content"];

        vis.postMap.forEach(
            d => ratingArray.forEach(r =>
                d[r] = d[r] / d.total)
        )

        vis.xScale = d3.scaleBand()
            .domain([0, 1, 2])
            .range([0, vis.width])
            .padding(0.2);

        let computeStatistic = (func) =>
            func(...vis.postMap.map(d => func(...ratingArray.map(r => d[r]))));

        vis.yScale = d3.scaleBand()
            .domain(vis.postMap.map(d => d.name))
            .range([0, vis.height])
            .padding(0.2);

        // stand-in for now (domain across all values)
        vis.postRadiusScale = d3.scaleSqrt()
            .domain([computeStatistic(Math.min),
            computeStatistic(Math.max)])
            .range([0, 23]);

        vis.totalRadiusScale = d3.scaleSqrt()
            .domain([Math.min(...vis.postMap.map(d => d.total)),
            Math.max(...vis.postMap.map(d => d.total))])
            .range([2, 25]);

        // TODO - get this from somewhere else
        vis.colourScale = d3.scaleOrdinal()
            .domain(['no factual content', 'mostly false', 'mixture of true and false', 'mostly true'])
            .range(['#634265', '#E05E5E', '#96a8b3', '#67D99B']);

        vis.sortKey = "mostly false";

        // Label positioning values
        // Get x-coordinate of div
        let parentElementID = vis.config.parentElement;
        parentElementID = parentElementID.slice(1);

        const rect = document.getElementById(parentElementID).getBoundingClientRect();
        const rightEdge = rect.x + rect.width;
        const leftEdge = rect.x;

        vis.totalkey = vis.chart.append("text");
        vis.totalkey
            .attr('class', 'key-text')
            .attr('x', rect.width - 100) // todo another magic number...
            .attr('y', -60)
            .text("Total posts");

        vis.sortKeyPre = vis.chart.append("text");
        vis.sortKeyPre
            .attr('class', 'key-text')
            .text("Percentage posts rated")
            .attr('x', 4)
            .attr('y', -60)

        vis.sortKeyText = vis.chart.append("text");
        vis.sortKeyText
            .attr('class', 'key-text')
            .text(vis.sortKey)
            .attr('x', 4)
            .attr('y', -38)

        vis.group = vis.chart.append('g');
        vis.group.attr('transform', `translate(${vis.frontTextPadding}, 0)`);

        // may want to make radius smaller for selected postcircles
        vis.highlightCircle = vis.group
            .append("circle");
        vis.highlightCircle
            .attr("fill", "none")
            .attr('class', 'highlight-circle')
            .style("stroke-width", vis.circleStroke / 2 + 2) // play around with this
            .style("opacity", 0.6);

        vis.update();
    }

    update() {
        // no reorganization currently needed
        let vis = this;

        vis.sortKeyText
            .transition()
            .text(vis.sortKey);

        vis.postMap = vis.postMap.sort((a, b) => b[vis.sortKey] - a[vis.sortKey]);

        // change scale based on sort key
        vis.postRadiusScale.domain(
            [Math.min(...vis.postMap.map(d => d[vis.sortKey])),
            Math.max(...vis.postMap.map(d => d[vis.sortKey]))]
        );

        vis.yScale.domain(vis.postMap.map(d => d.name));
    }

    render() {
        // set up groups
        let vis = this;

        let id = function (d) { return d.name; }
        let groups = vis.group.selectAll('g')
            .data(vis.postMap, id);

        let groupsEnter = groups.enter().append('g')
        groups = groups.merge(groupsEnter);

        let names = groups.selectAll('.name-label')
            .data(d => [d]);

        names.enter()
            .append('text')
            .attr('class', 'name-label')
            .text(d => d.name)
            .each(function (d) {
                d.textWidth = this.getBBox().width;
                d.textHeight = this.getBBox().height;
            })
            .merge(names)
            .transition().duration(vis.duration)
            .attr('x', vis.xScale(1) + vis.xScale.bandwidth() / 2)
            .attr('y', d => vis.yScale(d.name))
            .text(d => d.name)
            .each(function (d) {
                d3.select(this)
                    .attr('transform', `translate(${-d.textWidth / 2}, 0)`)
            });
        // TODO janky way of setting the placement of text
        //.each(function(d) { d.nameWidth = this.getBBox().width })
        //.attr('transform', function(d) { `translate(${-d.nameWidth / 2}, 0)` });


        let line = groups.selectAll('.line').data(d => [d]);
        line.enter()
            .append('rect')
            .attr('class', 'line')
            // span the whole line 
            .attr('width', vis.xScale(2) - vis.xScale(0) + vis.xScale.bandwidth())
            .attr('height', 2)
            .attr('fill', 'lightgray')
            .merge(line)
            //.transition().duration(vis.duration)
            .attr('x', d => vis.xScale(0))
            .attr('y', d => vis.yScale(d.name) - d.textHeight / 2)

        // create elements 
        let postCircle = groups.selectAll('.post-circle').data(d => [d]);

        postCircle.enter()
            .append('circle')
            .attr('class', 'post-circle')
            .on("mouseover", vis.postCircleMouseover)
            .on("mouseout", vis.postCircleMouseout)
            .merge(postCircle)
            .transition().duration(vis.duration)
            .attr('fill', d => vis.colourScale(vis.sortKey))
            .attr('cx', vis.xScale(0))
            .attr('r', d => {
                d.postCircleRadius = vis.postRadiusScale(d[vis.sortKey]) + vis.circleStroke / 2;
                return d.postCircleRadius;
            })
            // TODO in-progress: this is very janky; there must be a better way to get value
            .attr('cy', function (d) {
                // d.postCirclePosY = vis.yScale(d.name)
                //     - (vis.postRadiusScale(d[vis.sortKey]) / 2);
                //return d.postCirclePosY;
                return vis.yScale(d.name) - d.textHeight / 2;
            });

        vis.highlightCircle
            .attr("r", (vis.postCircleSelected != null) ? vis.postCircleSelected.postCircleRadius + 1 : 0)
            .attr("cx", vis.xScale(0))
            .attr("cy",  (vis.postCircleSelected != null) ? 
            vis.yScale(vis.postCircleSelected.name) - vis.postCircleSelected.textHeight / 2 : 0)
            .style("stroke", (vis.postCircleSelected != null) ? vis.colourScale(vis.sortKey) : "none");

        let totalCircle = groups.selectAll('.total-circle').data(d => [d]);

        totalCircle.enter()
            .append('circle')
            .attr('fill', 'cornflowerblue')
            .attr('class', 'total-circle')
            .merge(totalCircle)
            .transition().duration(vis.duration)
            .attr('cx', vis.xScale(2) + vis.xScale.bandwidth())
            .attr('r', d => {
                d.totalCircleRadius = vis.totalRadiusScale(d.total) + vis.circleStroke / 2;
                return d.totalCircleRadius;
            })
            .attr('cy', function (d) {
                // d.totalCirclePosY = vis.yScale(d.name)
                //     - (vis.totalRadiusScale(d.total) / 2);
                //return d.totalCirclePosY;
                return vis.yScale(d.name) - d.textHeight / 2;
            });

        // add lines and backgrounds    
        // and add backgrounds to each circle        
        let backgroundRect = groups.selectAll('.background-rect').data(d => [d]);
        backgroundRect.enter()
            .append('rect')
            .attr('class', 'background-rect')
            .attr('rx', 5)
            .attr('ry', 5)
            .on("mouseover", vis.onMouseover)
            .on("mouseout", vis.onMouseout)
            // width of text box... or a set width
            .merge(backgroundRect)
            //.transition().duration(vis.duration)
            .attr('width', d => d.textWidth * 1.2)
            .attr('height', d => d.textHeight * 1.8)
            .attr('y', d => vis.yScale(d.name) - d.textHeight - 4)
            .attr('x', d => vis.xScale(1) - d.textWidth / 2 - (d.textWidth * 0.2 / 2) + vis.xScale.bandwidth() / 2)
            .attr('fill', d => (d.name === vis.selectedPage && vis.selectedPage != null) ? '#E7E7E7' : '#FDFDFD')

        // add text to circles
        let postCircleText = groups.selectAll('.post-circle-text').data(d => [d]);

        postCircleText.enter()
            .append('text')
            .attr('class', 'post-circle-text')
            .merge(postCircleText)
            .attr('x', vis.xScale(0))
            .attr('y', d => vis.yScale(d.name) - d.textHeight / 2 - 2)
            .text(d => d.postCircleRadius >= 14 ? Math.round(d[vis.sortKey] * 100) + "%" : '')
            .each(function (d) {
                d3.select(this)
                    .attr('transform', `translate(${-this.getBBox().width / 2}, ${this.getBBox().height / 2})`)
            });

        let totalCircleText = groups.selectAll('.total-circle-text').data(d => [d]);

        totalCircleText.enter()
            .append('text')
            .attr('class', 'total-circle-text')
            .merge(totalCircleText)
            .attr('x', vis.xScale(2) + vis.xScale.bandwidth())
            .attr('y', d => vis.yScale(d.name) - d.textHeight / 2 - 2)
            .text(d => d.totalCircleRadius >= 14 ? d.total : '')
            .each(function (d) {
                d3.select(this)
                    .attr('transform', `translate(${-this.getBBox().width / 2}, ${this.getBBox().height / 2})`)
            });

        d3.select('.highlight-circle').raise();

        groups.selectAll('.name-label').each(function (d) {
            d3.select(this).raise();
        });

        // TODO come up aith better position inheritance

        // vis.totalkey
        // .transition()
        // .attr('x', vis.group.node().getBBox().width + vis.backTextPadding + 10);

    }
}
