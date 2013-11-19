// Run all jQuery
$(function () {
  $('body').find('img').each(function(){
    $(this).attr('src', $(this).attr('src').replace('test.lightnet','lightnet'));
  });
  // $(".dropdown-toggle").dropdown();
});