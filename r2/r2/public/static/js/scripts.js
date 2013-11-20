// Run all jQuery
$(function () {
    $('body').find('img').each(function(){
        $(this).attr('src', $(this).attr('src').replace('test.lightnet','lightnet'));
    });
    // $(".dropdown-toggle").dropdown();
});


$(document).on('click.postlink', '.postlink', function (e) {
    e.preventDefault();
    $('<form>', {
        'action': $(e.target).data('action'),
        'method': 'POST',
        'html': '<input type="hidden" name="uh" value="' + Reddit.modhash + '" />'
    }).appendTo(document.body).submit();
});
