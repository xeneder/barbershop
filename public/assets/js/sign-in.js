(($) =>  {
    //form validation
    $.validate({
        lang: 'ru',
        form: '#form'
    });
    
    //using hash to tell if something went wrong on the back end
    if(window.location.hash.substring(1) === 'failure') {
        $('.form-wrapper > .col-6').prepend('Ошибка! Провертье правильность введённых данных.');
    }
})(jQuery);