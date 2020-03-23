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

        // create two kinds of scales 
        // one for placement of total posts and one for fake
        // and one y-scale for the number of sites (9)
        vis.xScale = d3.scaleBand()
            .domain([0, 1, 2])
            .range([0, vis.width])
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

        vis.update();
    }

    update() {
        // no reorganization currently needed
        let vis = this;
        vis.sortKey = "mostly false";
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

        console.log(vis.postMap);

        // TODO determine the best highlighting idiom
        // TODO add numbers 
        let onMouseover = (d, i) => {
            console.log(d)
            vis.selectedPage = d;
        }

        let onMouseout = (d, i) => {
            vis.selectedPage = null;
        }

        let group = vis.chart.append('g');

        let groups = group.selectAll('g')
            .data(vis.postMap)
            .on('mouseover', onMouseover)
            .on('mouseout', onMouseout);

        let groupsEnter = groups.enter().append('g')
        groups = groups.merge(groupsEnter);

        let backgroundRect = groups.selectAll('rect').data(d => [d]);
        backgroundRect.enter().merge(backgroundRect)
            .append('rect')
            .attr('width', vis.width)
            .attr('height', vis.yScale.bandwidth())
            .transition()
            .attr('y', d => vis.yScale(d.name) + vis.yScale.bandwidth() / 2)
            .attr('fill', d => (d === vis.selectedPage && vis.selectedPage != null) ? 'gray' : 'none')

        // create elements 
        let postCircle = groups.selectAll('.post-circle').data(d => [d]);

        postCircle.enter().merge(postCircle)
            .append('circle')
            .attr('fill', 'orange')
            .attr('class', 'post-circle')
            .transition()
            .attr('cx', vis.xScale(0))
            .attr('r', d => vis.postRadiusScale(d[vis.sortKey]))
            // TODO in-progress: this is very janky; there must be a better way to get value
            .attr('cy', function(d) { return vis.yScale(d.name)
                - (vis.postRadiusScale(d[vis.sortKey]) / 2) });

        let totalCircle = groups.selectAll('.total-circle').data(d => [d]);

        totalCircle.enter().merge(totalCircle)
            .append('circle')
            .attr('fill', 'red')
            .attr('class', 'total-circle')
            .transition()
            .attr('cx', vis.xScale(2))
            .attr('r', d => vis.totalRadiusScale(d.total))
            // TODO in-progress: this is very janky; there must be a better way to get value
            //.attr('cy', function(d) { console.log(d3.select(this).node().r.animVal.value); return vis.yScale(d.name)});
            .attr('cy', function(d) { return vis.yScale(d.name)
            - (vis.totalRadiusScale(d.total) / 2) });

        let names = groups.selectAll('.name-label')
            .data(d => [d]);
        names.enter().merge(names)
            .append('text')
            .text(d => d.name)
            .attr('class', 'name-label')
            .transition()
            .attr('x', vis.xScale(1))
            .attr('y', d => vis.yScale(d.name))
            // TODO janky way of setting the placement of text
            //.each(function(d) { d.nameWidth = this.getBBox().width })
            //.attr('transform', function(d) { `translate(${-d.nameWidth / 2}, 0)` });
            .each(function (d) {
                d3.select(this)
                .attr('transform', `translate(${-this.getBBox().width / 2}, 0)`)
            });

        // TODO come up aith better position inheritance


    }
}
