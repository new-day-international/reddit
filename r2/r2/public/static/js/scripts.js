// Run all jQuery
$(function () {
  $('body').find('img').each(function(){
    $(this).attr('src', $(this).attr('src').replace('test.lightnet','lightnet'));
  });

  $('.content').css("min-height", $('#right-sidebar').height() );

    $('#access-help').popover({
        trigger: 'hover',
        placement: 'top',
        html: true,
        content: '<p>There are three levels of access</p>' +
          '<ul class="list-unstyled popover-list">' +
            '<li><strong>Public:</strong> anyone can view and submit</li>' +
            '<li><strong>Restricted:</strong> anyone can view, but only some are approved to submit links</li>' +
            '<li><strong>Private:</strong> only approved members can view and submitone</li>' +
          '</ul>'
    });

  $(".tall-collapse-button").on("click", function(){

    if($("#left-sidebar").hasClass("col-md-2")) {
        $("#left-sidebar").addClass("col-md-0").removeClass("col-md-2");
        $(".main-list").removeClass("col-md-7").removeClass("col-md-offset-2").addClass("col-md-9");
        $(".footer-parent").removeClass("col-md-7").removeClass("col-md-offset-2").addClass("col-md-9");
        $(".tall-collapse-button").removeClass("open").addClass("closed");
    } else {
        $("#left-sidebar").removeClass("col-md-0").addClass("col-md-2");
        $(".main-list").removeClass("col-md-9").addClass("col-md-7").addClass("col-md-offset-2");
        $(".footer-parent").removeClass("col-md-9").addClass("col-md-7").addClass("col-md-offset-2");
        $(".tall-collapse-button").removeClass("closed").addClass("open");
    }
  })

  $(".item-reply").on("click", function(){
    if($("form.usertext.cloneable").hasClass("show")) {
      $("form.usertext.cloneable").removeClass("show");
    } else {
      $("form.usertext.cloneable").addClass("show");
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