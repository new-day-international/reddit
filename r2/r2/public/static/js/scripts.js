// Run all jQuery
$(function () {
  $('body').find('img').each(function(){
    $(this).attr('src', $(this).attr('src').replace('test.lightnet','lightnet'));
  });

  $('.content').css("min-height", $('#right-sidebar').height() );

  var sidebar_width;

  $(".tall-collapse-button").on("click", function(){

    $(".main-list").prepend(sidebar_width);

    if($("#left-sidebar").hasClass("col-md-2")) {
        $("#left-sidebar").addClass("col-md-0").removeClass("col-md-2");
        $(".main-list").removeClass("col-md-7").addClass("col-md-9");
        $(".tall-collapse-button").removeClass("open").addClass("closed");
    } else {
        $("#left-sidebar").removeClass("col-md-0").addClass("col-md-2");
        $(".main-list").removeClass("col-md-9").addClass("col-md-7");
        $(".tall-collapse-button").removeClass("closed").addClass("open");
    }
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