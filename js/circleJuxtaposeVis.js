class circleJuxtaposeVis {

    // initialize different groups with 
    // 

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1000,
            containerHeight: _config.containerHeight || 950,
        }

        this.config.margin = _config.margin || { top: 40, bottom: 20, right: 0, left: 0 }

        this.data = _config.data;
        this.postMap = _config.postMap;

        this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;
        this.height = this.config.containerHeight - this.config.margin.top - this.config.margin.bottom;

        d3.select(this.config.parentElement)
            .attr('height', this.config.containerHeight)
            .attr('width', this.config.containerWidth);

        this.chart = d3.select(this.config.parentElement).append('g')
            .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`)
            .attr('height', this.height)
            .attr('width', this.width);

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.frontTextPadding = 140;
        vis.backTextPadding = 100;

        // create two kinds of scales 
        // one for placement of total posts and one for fake
        // and one y-scale for the number of sites (9)
        vis.xScale = d3.scaleBand()
            .domain([0, 1, 2])
            .range([0, vis.width - vis.frontTextPadding + vis.backTextPadding])
            .padding(0.2);

        let arrayOfObjSummary = (arr, funcArray, funcObj) =>
            funcArray(...arr.map(d => funcObj(...Object.values(d).filter(a => !isNaN(a)))));

        vis.yScale = d3.scaleBand()
            .domain(vis.postMap.map(d => d.name))
            .range([0, vis.height])
            .padding(0.2);

        // stand-in for now (domain across all values)
        vis.postRadiusScale = d3.scaleSqrt()
            .domain([arrayOfObjSummary(vis.postMap, Math.min, Math.min),
            arrayOfObjSummary(vis.postMap, Math.max, Math.max)])
            .range([5, 30]);

        vis.totalRadiusScale = d3.scaleSqrt()
            .domain([Math.min(...vis.postMap.map(d => d.total)),
            Math.max(...vis.postMap.map(d => d.total))])
            .range([10, 40]);

            // TODO - get this from somewhere else
        vis.colourScale = d3.scaleOrdinal()
        .domain(['no factual content', 'mostly false', 'mixture of true and false', 'mostly true'])
        .range(['#634265', '#E05E5E', '#D3DCE7', '#67D99B']);

        vis.sortKey = "mostly false";

        vis.totalkey = vis.chart.append("text");
        vis.totalkey
        .attr('class', 'key-text')
        .attr('x', vis.width - vis.backTextPadding)
        .attr('y', 0)
        .text("Total posts");

        vis.sortKeyPre = vis.chart.append("text");
        vis.sortKeyPre
        .attr('class', 'key-text')
        .text("Posts rated as")
        .attr('x', 0)
        .attr('y', 0)

        vis.sortKeyText = vis.chart.append("text");
        vis.sortKeyText
        .attr('class', 'key-text')
        .text(vis.sortKey)
        .attr('x', 0)
        // TODO lots of magic numbers related to pixels
        .attr('y', 20)
        
        vis.group = vis.chart.append('g');
        vis.group.attr('transform', `translate(${vis.frontTextPadding}, 0)`);

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
        console.log(vis.yScale.domain());
    }

    render() {
        // set up groups
        let vis = this;

        // TODO add numbers 
        let onMouseover = (d, i) => {
            console.log(d)
            vis.selectedPage = d;
        }

        let onMouseout = (d, i) => {
            vis.selectedPage = null;
        }

        let groups = vis.group.selectAll('g')
            .data(vis.postMap);

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
            .attr('x', vis.xScale(1))
            .attr('y', d => vis.yScale(d.name))
            .merge(names)
            .transition()
            .text(d => d.name)
            .each(function (d) {
                console.log(d)
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
            .attr('width', vis.xScale(2) - vis.xScale(0))
            .attr('height', 2)
            .attr('fill', 'lightgray')
            .merge(line)
            .transition()
            .attr('x', d => vis.xScale(0))
            .attr('y', d => vis.yScale(d.name) - d.textHeight / 2)

        // create elements 
        let postCircle = groups.selectAll('.post-circle').data(d => [d]);

        let circleStroke = 10;
        postCircle.enter()
            .append('circle')
            .attr('class', 'post-circle')
            .merge(postCircle)
            .transition()
            .attr('fill', d => vis.colourScale(vis.sortKey))
            .attr('cx', vis.xScale(0))
            .attr('r', d => vis.postRadiusScale(d[vis.sortKey]) + circleStroke /2)
            // TODO in-progress: this is very janky; there must be a better way to get value
            .attr('cy', function (d) {
                // d.postCirclePosY = vis.yScale(d.name)
                //     - (vis.postRadiusScale(d[vis.sortKey]) / 2);
                //return d.postCirclePosY;
                return vis.yScale(d.name) - d.textHeight / 2;
            });

        let totalCircle = groups.selectAll('.total-circle').data(d => [d]);

        totalCircle.enter()
            .append('circle')
            .attr('fill', 'cornflowerblue')
            .attr('class', 'total-circle')
            .merge(totalCircle)
            .transition()
            .attr('cx', vis.xScale(2))
            .attr('r', d => vis.totalRadiusScale(d.total) + circleStroke /2)
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
            // width of text box... or a set width
            .merge(backgroundRect)
            .attr('width', d => d.textWidth * 1.2)
            .attr('height', d => d.textHeight * 1.4)
            .attr('y', d => vis.yScale(d.name) - d.textHeight)
            .attr('x', d => vis.xScale(1) - d.textWidth / 2 - (d.textWidth * 0.2 / 2))
            .attr('fill', d => (d === vis.selectedPage && vis.selectedPage != null) ? 'gray' : 'white')

        groups.selectAll('.name-label').each(function(d) {
            d3.select(this).raise();
        });

        // TODO come up aith better position inheritance

        vis.totalkey
        .transition()
        .attr('x', vis.group.node().getBBox().width + vis.backTextPadding + 10);

    }
}
