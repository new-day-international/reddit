// We need a popover that 

+function ($) { "use strict";

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var LightnetPopover = function (element, options) {
    this.init('lightnet_popover', element, options)
  }

  if (!$.fn.popover) throw new Error('LightnetPopover requires popover.js')

  LightnetPopover.DEFAULTS = $.extend({} , $.fn.popover.Constructor.DEFAULTS, {
    template: '<div class="lightnet-popover popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: LIGHTNET POPOVER EXTENDS popover.js
  // ================================

  LightnetPopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype)

  LightnetPopover.prototype.constructor = LightnetPopover

  LightnetPopover.prototype.getDefaults = function () {
    return LightnetPopover.DEFAULTS
  }

  LightnetPopover.prototype.replaceArrow = function(delta, dimension, position) {
    this.arrow().css(position, "17px");
  }

  LightnetPopover.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top - 5, left: pos.left + pos.width   }
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  var old = $.fn.lightnet_popover

  $.fn.lightnet_popover = function (option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.lightnet_popover')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.lightnet_popover', (data = new LightnetPopover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.lightnet_popover.Constructor = LightnetPopover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.lightnet_popover.noConflict = function () {
    $.fn.lightnet_popover = old
    return this
  }

}(jQuery);
