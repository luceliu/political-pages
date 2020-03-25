class pageSelect {
    constructor(_config) {
        this.select_id = _config.select_id;
        this.precedingElementId = _config.precedingElementId;
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
        console.log('sel.dropdown: ', sel.dropdown)
        
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
    }
}