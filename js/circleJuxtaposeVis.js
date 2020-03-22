class circleJuxtaposeVis {

    // initialize different groups with 
    // 

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1000,
            containerHeight: _config.containerHeight || 870,
        }

        this.config.margin = _config.margin || { top: 10, bottom: 10, right: 0, left: 0 }

        this.data = _config.data;
        // this.pageValue = _config.pageValue;
        // this.idValue = _config.idValue;
        // this.colorValue = _config.colorValue; 
        // this.zValue = _config.zValue;
        // this.selectedCategory = _config.selectedCategory;

        // this.chart = this.svg.append('g');
        // this.formatValue = _config.formatValue;
        // this.linkValue = _config.linkValue;

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
        let processData = data => {
            // collect total posts for the page
            // collect each type of post for the page

            let names = [...new Set(data.map(d => d.Page))]
            let ratings = [... new Set(data.map(d => d.Rating))]
            let map = names.map(n => {
                let obj = {};
                ratings.forEach(r => obj[r] = 0);
                obj.name = n;
                return obj;
            })

            console.log(map);
            return data.reduce((map, current) => {
                let page = map.find(d => d.name == current.Page);
                page[current.Rating]++;
                return map;
            }, map)
        }

        vis.postMap = processData(vis.data);
        console.log(vis.postMap)

        // create two kinds of scales 
        // one for placement of total posts and one for fake
        // and one y-scale for the number of sites (9)
        vis.xScale = d3.scaleBand()
            .domain([0, 1, 2])
            .range([0, vis.width])
            .padding(0.2);

        let arrayOfObjSummary = (arr, func) => 
            func(...arr.map(d => func(...Object.values(d).filter(a => !isNaN(a)))));
    

        vis.yScale = d3.scaleBand()
            .domain(vis.postMap.map(d => d.name))
            .range([0, vis.height])
            .padding(0.2);

        vis.radiusScale = d3.scaleLinear()
        .domain([arrayOfObjSummary(vis.postMap, Math.min), 
            arrayOfObjSummary(vis.postMap, Math.max)])
        .range([10, 40]);

        vis.update();
    }

    update() {
        // no reorganization currently needed
        let vis = this;
        vis.sortKey = "mostly false";
        vis.postMap.sort((a, b) => b[vis.sortKey] - a[vis.sortKey]);
        console.log(vis.postMap);
    }

    render() {
        // set up groups
        let vis = this;

        // TODO determine the best highlighting idiom
        let onMouseover = (d, i) => {
            vis.selectedPage = d;
        }

        let onMouseout = (d, i) => {
            vis.selectedPage = null;
        }

        let group = vis.chart.append('g');

        let groups = group.selectAll('g')
            .data(vis.postMap);

        let groupsEnter = groups.enter().append('g')
        .on('mouseover', onMouseover)
        .on('mouseout', onMouseout);
        groups = groups.merge(groupsEnter);

        console.log(groups);

        // create elements 
        let postCircle = groups.selectAll('.post-circle').data(d => [d]);
        console.log(vis.radiusScale.domain());
        console.log(vis.postMap.map(d => d[vis.sortKey]));
        postCircle.enter().merge(postCircle)
            .append('circle')
            .attr('fill', 'orange')
            .attr('class', 'post-circle')
            .transition()
            .attr('cx', vis.xScale(0))
            .attr('cy', d => vis.yScale(d.name))
            .attr('r', d => vis.radiusScale(d[vis.sortKey]));

        console.log(postCircle);
        // TODO radius scale
        let totalCircle = groups.selectAll('.total-circle').data(d => [d]);

        totalCircle.enter().merge(totalCircle)
            .append('circle')
            .attr('fill', 'red')
            .attr('class', 'total-circle')
            .transition()
            .attr('cx', vis.xScale(2))
            .attr('cy', d => vis.yScale(d.name))
            .attr('r', d => vis.radiusScale(d[vis.sortKey]));

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
            .each(function(d) { d3.select(this)
                .attr('transform', `translate(${-this.getBBox().width / 2}, 0)`) });
            
        // TODO come up aith better position inheritance


    }
}
