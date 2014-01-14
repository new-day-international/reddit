// Run all jQuery
$(function () {
  $("button[data-href]").click(function() {
      location.href = $(this).data("href");
  });

  $('.content').css("min-height", $('#right-sidebar').height() );
  $('.subreddit').tooltip({
    selector: "[data-toggle=tooltip]",
    container: "body"
  });

  $('#house-name').on('click', function() {
    if( $('.sidebar_description').css('height') == "0px" ) {
      $('.sidebar_description').css('height', 'auto');
    } else {
      $('.sidebar_description').css('height', "0px");
    }
  });

  $('.house-lightnet-rules').on('focus', function(){
    $(this).addClass("nobg");
  });
  $('.house-lightnet-rules').on('blur', function(){
    if ($(this).val() == "") {
      $(this).removeClass("nobg");
    }
  });

  $('.bottommenu .icon').on('mouseenter', function() {
    $('.bottommenu .content').removeClass('hide');
  }).on('mouseleave', function() {
    $('.bottommenu .content').addClass('hide');
  })
  
  $('.subreddit .house_color').popover({
    trigger: 'hover',
    placement: 'top',
    html: true,
    content: function() {
      return $(this).find('.popover_content_wrapper').html();
    }
  });
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

  function close_leftbar() {
    $("#left-sidebar").addClass("col-md-0").removeClass("col-md-2");
    if ($(".main-list").hasClass("rightbar")) {
      $(".main-list").removeClass("col-md-7").removeClass("col-md-offset-2").addClass("col-md-9");
    } else {
      $(".main-list").removeClass("col-md-10").removeClass("col-md-offset-2").addClass("col-md-12");
    }
    $(".footer-parent").removeClass("col-md-7").removeClass("col-md-offset-2").addClass("col-md-9");
    $(".tall-collapse-button").removeClass("open").addClass("closed");
    $.request("leftbar_expanded", {expanded: false});
  }

  function open_leftbar() {
    $("#left-sidebar").removeClass("col-md-0").addClass("col-md-2");
    if ($(".main-list").hasClass("rightbar")) {
      $(".main-list").addClass("col-md-7").addClass("col-md-offset-2").removeClass("col-md-9");
    } else {
      $(".main-list").addClass("col-md-10").addClass("col-md-offset-2").removeClass("col-md-12");
    }
    $(".footer-parent").removeClass("col-md-9").addClass("col-md-7").addClass("col-md-offset-2");
    $(".tall-collapse-button").removeClass("closed").addClass("open");
    $.request("leftbar_expanded", {expanded: true});
  }

  $(".tall-collapse-button").on("click", function(){

    if($(".tall-collapse-button").hasClass("open")) {
      close_leftbar();
    } else {
      open_leftbar();
    }
  })

  $(".fancy-toggle-button .btn").on("click", function(){
    var checkboxes = $(this).parent().next();
    if(checkboxes.hasClass("hide")) {
      checkboxes.removeClass("hide").addClass("show");
    } else {
      checkboxes.removeClass("show").addClass("hide");
    }
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