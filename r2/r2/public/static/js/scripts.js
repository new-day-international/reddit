// Run all jQuery
$(function () {
  $('body').find('img').each(function(){
    $(this).attr('src', $(this).attr('src').replace('test.lightnet','lightnet'));
  });

  $(".tall-collapse-button").click(function(){
    var sidebar_width = $("#left-sidebar").outerWidth() - 1;

    if($(this).parent().hasClass("col-md-3"))
        $("#left-sidebar").addClass("col-md-0").removeClass("col-md-3").width("10");
    else
        $("#left-sidebar").removeClass("col-md-0").addClass("col-md-3").width("auto");
  })
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