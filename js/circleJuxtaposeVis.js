class circleJuxtaposeVis {

    // initialize different groups with 
    // 

    constructor(_config) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1000,
            containerHeight: _config.containerHeight || 870,
        }

        this.config.margin = _config.margin || { top: 50, bottom: 75, right: 10, left: 120 }

        this.data = _config.data;
        // this.pageValue = _config.pageValue;
        // this.idValue = _config.idValue;
        // this.colorValue = _config.colorValue; 
        // this.zValue = _config.zValue;
        // this.selectedCategory = _config.selectedCategory;
        // this.svg = d3.select(this.config.parentElement);
        // this.chart = this.svg.append('g');
        // this.formatValue = _config.formatValue;
        // this.linkValue = _config.linkValue;

        this.width = this.config.containerWidth - this.config.margin.left - this.config.margin.right;
        this.height = this.config.containerHeight - this.config.margin.top - this.config.margin.bottom;


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
            .domain([0,1,2])
            .range([0, vis.width])
            .padding(0.2);

        vis.yScale = d3.scaleBand()
            .domain(vis.postMap.map(d => d.name))
            .range([0, vis.height])
            .padding(0.2);
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



    }
}