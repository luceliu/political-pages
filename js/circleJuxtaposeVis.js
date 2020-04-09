class circleJuxtaposeVis {

    // initialize different groups with 
    // 

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight
        }

        this.config.margin = _config.margin || { top: 110, bottom: 20, right: 0, left: 0 }

        this.data = _config.data;

        // deep copy this object so I can mess with it
        this.postMap = JSON.parse(JSON.stringify(_config.postMap));

        this.duration = _config.duration || 700;

        // unpack handlers for linked highlighting
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

        this.politicalCategory = _config.pageCategories;

        this.initVis();
    }

    initVis() {
        let vis = this;
        
        let ratingArray = ["mostly false", "mostly true", "mixture of true and false",
            "no factual content"];

        vis.tooltip = new tooltip('rank-tooltip', 100);

        // compute percentages for each Page and Rating
        vis.postMap.forEach(
            d => ratingArray.forEach(r =>
                d[r] = d[r] / d.total)
        )

        // set up our three columns (percentage of posts, name, total posts)
        vis.xScale = d3.scaleBand()
            .domain([0, 1, 2])
            .range([0, vis.width])
            .padding(0.2);

        // set up y-scale (one band per page)
        vis.yScale = d3.scaleBand()
            .domain(vis.postMap.map(d => d.name))
            .range([0, vis.height])
            .padding(0.2);
    
        // generic function to compute statistic over posts
        let computeStatistic = (func) =>
        func(...vis.postMap.map(d => func(...ratingArray.map(r => d[r]))));

        // set the scale that determines how big the post percentage circle is
        vis.postRadiusScale = d3.scaleSqrt()
            .domain([computeStatistic(Math.min),
            computeStatistic(Math.max)])
            .range([2, 22]);

        // the scale that determines how big the 
        vis.totalRadiusScale = d3.scaleSqrt()
            .domain([Math.min(...vis.postMap.map(d => d.total)),
            Math.max(...vis.postMap.map(d => d.total))])
            .range([2, 24]);

        vis.colourScale = d3.scaleOrdinal()
            .domain(['no factual content', 'mostly false', 'mixture of true and false', 'mostly true'])
            .range(['#634265', '#E05E5E', '#96a8b3', '#67D99B']);

        // what Rating type are we currently displaying?
        vis.sortKey = "mostly false";

        // compute so that the 100% stacked bar is next to us
        let parentElementID = vis.config.parentElement;
        parentElementID = parentElementID.slice(1);

        const rect = document.getElementById(parentElementID).getBoundingClientRect();
        const rightEdge = rect.x + rect.width;
        const leftEdge = rect.x;

        // set up legend text for total posts and post percentages
        vis.totalkey = vis.chart.append("text");
        vis.totalkey
            .attr('class', 'key-text')
            .attr('x', rect.width - 100) 
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

        // create the circle used for unidirectional highlighting
        // created once and moved around on hover
        vis.highlightCircle = vis.group
            .append("circle");
        vis.highlightCircle
            .attr("fill", "none")
            .attr('class', 'highlight-circle')
            .style("stroke-width", vis.circleStroke / 2 + 2) 
            .style("opacity", 0.6);

        vis.update();
    }

    update() {
        let vis = this;

        // change our legend to reflect updated text
        vis.sortKeyText
            .transition()
            .text(vis.sortKey);

        // sort our data so that we're descending by selected Rating
        vis.postMap = vis.postMap.sort((a, b) => b[vis.sortKey] - a[vis.sortKey]);

        // change scale of post percentage circles based on max/min in sort key
        vis.postRadiusScale.domain(
            [Math.min(...vis.postMap.map(d => d[vis.sortKey])),
            Math.max(...vis.postMap.map(d => d[vis.sortKey]))]
        );

        // update y-scale so our pages are properly ranked
        vis.yScale.domain(vis.postMap.map(d => d.name));
    }

    render() {
        // set up groups
        let vis = this;

        let id = function (d) { return d.name; }
        // create parent group
        let groups = vis.group.selectAll('g')
            .data(vis.postMap, id);

        // create groups for each page to hold the circles, name, etc
        let groupsEnter = groups.enter().append('g')
        groups = groups.merge(groupsEnter);

        // add the name labels
        // this should be done first to set up some values
        let names = groups.selectAll('.name-label')
            .data(d => [d]);

        names.enter()
            .append('text')
            .attr('class', 'name-label')
            .text(d => d.name)
            .each(function (d) {
                // store how tall and wide the text is
                d.textWidth = this.getBBox().width;
                d.textHeight = this.getBBox().height;
            })
            .merge(names)
            .transition().duration(vis.duration)
            .attr('x', vis.xScale(1) + vis.xScale.bandwidth() / 2)
            .attr('y', d => vis.yScale(d.name))
            .text(d => d.name)
            .each(function (d) {
                // centre the text 
                d3.select(this)
                    .attr('transform', `translate(${-d.textWidth / 2}, 0)`)
            });

        // add the line that connects the group together
        let line = groups.selectAll('.line').data(d => [d]);
        line.enter()
            .append('rect')
            .attr('class', 'line')
            // span the whole viz
            .attr('width', vis.xScale(2) - vis.xScale(0) + vis.xScale.bandwidth())
            .attr('height', 2)
            .attr('fill', 'lightgray')
            .merge(line)
            .attr('x', d => vis.xScale(0))
            .attr('y', d => vis.yScale(d.name) - d.textHeight / 2)

        // add circles representing what percentage of posts have this ranking
        let postCircle = groups.selectAll('.post-circle').data(d => [d]);

        postCircle.enter()
            .append('circle')
            .attr('class', 'post-circle')
            // add unidirectional highlighting 
            .on("mouseover", vis.postCircleMouseover)
            .on("mouseout", vis.postCircleMouseout)
            .merge(postCircle)
            .transition().duration(vis.duration)
            .attr('fill', d => vis.colourScale(vis.sortKey))
            .attr('cx', vis.xScale(0))
            .attr('r', d => {
                // if we don't actually have any posts of this rating, don't show any circle
                if (d[vis.sortKey] == 0 || d[vis.sortKey] == undefined) { return 0; }
                // increase the size of the circle to compensate for the stroke we add in
                d.postCircleRadius = vis.postRadiusScale(d[vis.sortKey]) + vis.circleStroke / 2;
                return d.postCircleRadius;
            })
            .attr('cy', function (d) {
                // centre the circle wrt text centre
                return vis.yScale(d.name) - d.textHeight / 2;
            });

        // update circle for unidirectional highlighting if we have 
        // an element selected (i.e. we're hovering over it)
        vis.highlightCircle
            .attr("r", (vis.postCircleSelected != null) ? vis.postCircleSelected.postCircleRadius + 1 : 0)
            .attr("cx", vis.xScale(0))
            .attr("cy",  (vis.postCircleSelected != null) ? 
            vis.yScale(vis.postCircleSelected.name) - vis.postCircleSelected.textHeight / 2 : 0)
            .style("stroke", (vis.postCircleSelected != null) ? vis.colourScale(vis.sortKey) : "none");

        // add circles that represent the total number of posts
        let totalCircle = groups.selectAll('.total-circle').data(d => [d]);

        totalCircle.enter()
            .append('circle')
            .attr('fill', 'cornflowerblue')
            .attr('class', 'total-circle')
            .merge(totalCircle)
            .transition().duration(vis.duration)
            .attr('cx', vis.xScale(2) + vis.xScale.bandwidth())
            .attr('r', d => {
                // same logic as
                d.totalCircleRadius = vis.totalRadiusScale(d.total) + vis.circleStroke / 2;
                return d.totalCircleRadius;
            })
            .attr('cy', function (d) {
                return vis.yScale(d.name) - d.textHeight / 2;
            });

        // add a background under each text label to hide the line running underneath
        // and to provide the highlighting idiom for bidirectional highlighting
        // if a page is selected, the background turns gray
        let backgroundRect = groups.selectAll('.background-rect').data(d => [d]);
        backgroundRect.enter()
            .append('rect')
            .attr('class', 'background-rect')
            .attr('rx', 5)
            .attr('ry', 5)
            .on("mouseover", vis.onMouseover)
            .on("mouseout", vis.onMouseout)
            .merge(backgroundRect)
            // use the size of the text box stored previously to find dimensions
            .attr('width', d => d.textWidth * 1.2)
            .attr('height', d => d.textHeight * 1.8)
            // adjust for the padding used
            .attr('y', d => vis.yScale(d.name) - d.textHeight - 4)
            .attr('x', d => vis.xScale(1) - d.textWidth / 2 - (d.textWidth * 0.2 / 2) + vis.xScale.bandwidth() / 2)
            .attr('fill', d => (d.name === vis.selectedPage && vis.selectedPage != null) ? '#E7E7E7' : '#FDFDFD')

        // add text to both circles
        let postCircleText = groups.selectAll('.post-circle-text').data(d => [d]);

        postCircleText.enter()
            .append('text')
            .attr('class', 'post-circle-text')
            .merge(postCircleText)
            .style('fill', d => { if (vis.changingRank) {
                vis.changingRank = false;
                return 'none';
            } else { return 'white'; }})
            .attr('x', vis.xScale(0))
            .attr('y', d => vis.yScale(d.name) - d.textHeight / 2 - 2)
            // only show the text if it will fit on the circle
            .text(d => d.postCircleRadius >= 14 ? Math.round(d[vis.sortKey] * 100) + "%" : '')
            .each(function (d) {
                d3.select(this)
                    .attr('transform', `translate(${-this.getBBox().width / 2}, ${this.getBBox().height / 2})`)
            })
            .style('fill', '#FDFDFD');


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

        // make sure the highlight-circle is on top of other elements
        d3.select('.highlight-circle').raise();

        // make sure each name label is on top of the background rectangle
        groups.selectAll('.name-label').each(function (d) {
            d3.select(this).raise();
        });
    }

    showTooltip(d) {
        let vis = this;

        const content = '<p class="header">' +
        d.name +
        '</p>' +
        '<p class="attr">Political Category</p><p class="value">' +
        vis.politicalCategory[d.name] +
        '</p>' +
        '<p class="attr">Percentage Posts with this Rating</p>' + 
        '<p class="value">' +
        Math.round(d[vis.sortKey] * 100) + "%" +
        '</p>' +
        '<p class="attr">Total posts</p><p class="value">' +
        d.total +
        '</p>';

        if (("#" + d3.event.relatedTarget.id).includes(this.config.parentElement)) {
            vis.tooltip.showTooltip(content, d3.event, 'none');
        }
    }

    hideTooltip() {
        this.tooltip.hideTooltip();
    }
}
