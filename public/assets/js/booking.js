//async queries processing module

const Queries = (() => {
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    
    drawCalendar = (date) => {
        //clear the table
        $('table td')
            .text('')
            .removeClass()
            .unbind('click');
            
        //send the query for our date
        $.post('/booking-query', {queryType: 'calendar', data: {date: date}}, (data) => {
            //drawing the calendar
            for (let i = 0; i < data.days; i++) {
                const calendarDay = i + data.firstDay;
                const thisDate = new Date(data.year, data.month, i + 1, 23, 59, 59);
                //setting the date
                $('table td:eq(' + calendarDay + ')')
                    .attr('data-date', thisDate.valueOf())
                    .text(i + 1);
                //set inactive if the date is already in the past or booking for that date is not available
                if (thisDate < data.currentDate || !data.availableDays.includes(i + 1)) {
                    $('table td:eq(' + calendarDay + ')')
                        .addClass('disabled');
                } else {
                    //set active
                    $('table td:eq(' + calendarDay + ')')
                        .click(function() {
                            $('table td').removeClass('active');
                            $(this).addClass('active');
                            //query to check for available time slots for the date
                            console.log($(this).attr('data-date'))
                            setDate($(this).attr('data-date'));
                        });
                }
            }
            //update month name
            $('.month')
                .attr('data-date', new Date(data.year, data.month, 1).valueOf())
                .text(months[data.month]);
        }, 'json');
    };
    
    //query to check for available time slots for the date
    setDate = (date) => {
        $('#date').val(date);
        
        //reveal the booking tab
        $('.booking').show();
        
        //reset time slots
        $('#time').children().slice(1).remove();
        
        console.log(date);
        
        //send the query for our date
        $.post('/booking-query', {queryType: 'time', data: {date: date}}, (data) => {
            //add each available time slot
            data.timeslots.forEach((e) => {
                let time = '' + e.minutes;
                if (e.minutes < 10) {
                    time = '0' + time;
                }
                time = e.hours + ':' + time;
                if (e.hours < 10) {
                    time = '0' + time;
                }
                $('#time').append($('<option>')
                    .text(time)
                    .val(time)
                );
            });
        }, 'json');
    }
    
    return {
        callDrawCalendar: (date) => drawCalendar(date)
    };
})();


//initialization
(($) => {
    Queries.callDrawCalendar(-1);
    
    //set month change handlers
    $('.fa-chevron-left').click(() => {
        const date = new Date(+($('.month').attr('data-date')));
        date.setMonth(date.getMonth() - 1);
        Queries.callDrawCalendar(date.valueOf());
    });
    
    $('.fa-chevron-right').click(() => {
        const date = new Date(+($('.month').attr('data-date')));
        date.setMonth(date.getMonth() + 1);
        Queries.callDrawCalendar(date.valueOf());
    });
    
    //loading service options from JSON file
    $.getJSON('/services.json', (data) => {
        let i = 0;
        data.services.forEach((e) => {
            i++;
            $('#service').append($('<option>')
                .text(e.name + ' (' + e.price + ' ₽)')
                .val(i)
            );
        })
    });
    
    //reveal time slot selection when service has been chosen
    $('#service').mouseup(function() {
        if ($('#service').val() != '') {
            $('#time').show();
        }
    });
        
    //reveal credentials form when time has been chosen
    $('#time').mouseup(function() {
        if ($('#time').val() != '') {
            $('#name').show();
            $('#email').show();
            $('#tel').show();
            $('.submit').show();
        }
    });
    
    //form validation
    $.formUtils.addValidator({
        name : 'ruTel',
        validatorFunction : function(value, $el, config, language, $form) {
            return /\+\d{1}\(\d{3}\)\d{3}-\d{2}-\d{2}/g.test(value); 
        },
        errorMessage : 'Неверный номер телефона',
        errorMessageKey: 'badRuTel'
    });
    
    $.validate({
        lang: 'ru',
        form: '#booking'
    });
    
    //phone mask
    $('#tel').mask('+7(000)000-00-00');
    
    //using hash to tell if successfully booked
    if(window.location.hash.substring(1) === 'success') {
        $('.table-wrapper').prepend('Вы были успешно записаны!');
    }
})(jQuery);