class pageSelect {
    constructor(_config) {
        this.select_id = _config.select_id;
        this.precedingElementId = _config.precedingElementId;
        this.selectedPage = _config.selectedPage;
        this.initSelect();
    }

    initSelect() {
        let sel = this;
        let pageNames = [
            "Eagle Rising", 
            "Freedom Daily", 
            "Right Wing News", 
            "Occupy Democrats",
            "Addicting Info",
            "The Other 98%",
            "ABC News Politics",
            "CNN Politics",
            "Politico"
        ]
        sel.dropdown = d3.select('#small-multiples-pages')
            .insert('select', `#${sel.precedingElementId} + *`)
            .attr('id', sel.select_id);
        
        sel.dropdownOptions = sel.dropdown.selectAll("option")
            .data(pageNames)
            .enter()
            .append("option");

        sel.dropdownOptions
            .text(function(d) {
                return d;
            })
            .attr("value", function(d) {
                return d;
            })

        // Set default/starting page selection
        d3.select(`#${sel.select_id}`).property('value', sel.selectedPage);
        
    }
}