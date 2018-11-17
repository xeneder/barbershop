(($) => {
    const table = $('<tbody>')
    //loading service options from JSON file
    $.getJSON('/services.json', (data) => {
        //adding the options
        data.services.forEach((e) => {
            row = $('<tr>')
                .append($('<td>').text(e.name))
                .append($('<td>').text(e.price + ' ₽'))
            table.append(row);
            console.log(e);
        });
    });
    $('.price-table').append(table);
})(jQuery);