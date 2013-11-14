function dataURLtoBlob(dataURL) {
    var byteString = atob(dataURL.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
}

(function() {
  var $;

  $ = jQuery;

  $.awesomeCropper = function(inputAttachTo, options) {
    var $saveButton, $cancelButton, $closeButton, $container, $cropSandbox, $fileSelect, $imagesContainer,
 		$inputAttachTo, $progressBar, $resultImage, $resultImageSmall, $resultImageSmall, $sourceIm, 
        $urlSelect, $urlSelectButton, $promptDiv, a, cleanImages, div, drawImage, fileAllowed, handleDragOver,
		handleDropFileSelect, handleFileSelect, image, input, log, readFile, removeAreaSelect, removeLoading, 
		saveCrop, setAreaSelect, setImages, setLoading, setOriginalSize, settings, imageWasCropped;

    settings = {
      max_original_width: 400,
      width: 100,
      height: 100,
      debug: false,
      onsave: null
    };

    settings = $.extend(settings, options);

    imageWasCropped = false;

    log = function() {
      if (settings.debug) {
        return typeof console !== "undefined" && console !== null ? console.log(arguments) : void 0;
      }
    };

    $inputAttachTo = $(inputAttachTo);
    input = function(type) {
      return $("<input type = \"" + type + "\" />");
    };

    div = function() {
      return $("<div/>");
    };

    dismissButton = function() {
      return $('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>');
    };

    modalTitle = function() {
      return $('<h4 class="modal-title">Crop profile photo to desired size</h4>');
    };

    a = function(text) {
      return $("<a href=\"#\">" + text + "</a>");
    };

    image = function() {
      return $('<img/>');
    };

    $container = div().insertAfter($inputAttachTo).addClass('awesome-cropper');
    $cropSandbox = $('<canvas></canvas>').addClass('cropped-image-canvas');
    $cropSandbox.attr({
      width: settings.width,
      height: settings.height
    });
    $container.append($cropSandbox);
    $fileSelect = input('file').addClass('file-to-crop');
    $container.append($fileSelect);
    if (settings.proxy_path !== void 0) {
      $urlSelect = input('text');
      $urlSelectButton = input('button');
      $urlSelectButton.val('Upload from url');
      $container.append(div().addClass('control-group form-inline').append($urlSelect).append($urlSelectButton));
    }
    $progressBar = div().addClass('progress progress-striped active hide').append(div().addClass('bar').css('width', '100%'));
    $container.append($progressBar);

    // Result images are shown in the container *after* the image has been cropped.
    $resultImage = image().addClass('cropped-image');
    $resultImageMedium = image().addClass('cropped-image-medium image-space-h');
	$resultImageSmall = image().addClass('cropped-image-small image-space-h');
    $resultImage.attr('src', settings.image_source);
	$container.append($resultImage);
    /*
	$resultImageMedium.attr('src', settings.image_source);
	$resultImageSmall.attr('src', settings.image_source);
    $container.append($resultImageMedium);
	$container.append($resultImageSmall);
	*/

    // The source image will be the one selected by the user.
	$sourceIm = image();

    $saveButton = a('Save').addClass('btn yes btn-primary');
    $cancelButton = a('Cancel').addClass('btn').attr({
      'data-dismiss': "modal",
      'aria-hidden': "true"
    });
    $closeButton = dismissButton();
    $prompt = div().html("<h5>" + settings.promptText + "</h5>");

    $imagesContainer = div().append(
      div().addClass('modal-dialog').append(
          div().addClass('modal-content').append(
            div().addClass('modal-header').append(
              $closeButton,
              modalTitle()
              ),
            div().addClass('modal-body').append(
              div().addClass('row').append(
                $prompt.addClass('col-md-12')
                ),
              div().addClass('row').append(
                div().addClass('col-md-9').append($sourceIm),
                div().addClass('col-md-3').append($cropSandbox)
                )
              ),
            div().addClass('modal-footer').append(
              div().addClass('btn-group')
                .append($cancelButton, $saveButton)
            )
          )
        )
    ).append().addClass('modal').attr({
      role: 'dialog'
    });

    $container.append($imagesContainer);
    removeAreaSelect = function(image) {
      return image.imgAreaSelect({
        remove: true
      });
    };

    cleanImages = function() {
      var im;
      removeAreaSelect($sourceIm);
      im = $sourceIm;
      $sourceIm = image();
      return im.replaceWith($sourceIm);
    };

    setLoading = function() {
      return $progressBar.removeClass('hide');
    };

    removeLoading = function() {
      $cropSandbox.on('shown', function() {
        return setAreaSelect($sourceIm);
      });
      $imagesContainer.modal().on('shown', function() {
        return setAreaSelect($sourceIm);
      }).on('hidden', function() {
        return cleanImages();
      });
      $progressBar.addClass('hide');
      return setAreaSelect($sourceIm);
    };

    setOriginalSize = function(img) {
      var tempImage;
      tempImage = new Image();
      tempImage.onload = function() {
        return img.attr({
          'data-original-width': tempImage.width,
          'data-original-height': tempImage.height
        });
      };
      return tempImage.src = img.attr('src');
    };

    setImages = function(uri) {
	  return $sourceIm.attr('src', uri).load(function() {
        removeLoading();
        return setOriginalSize($sourceIm);
      });
    };

    drawImage = function(img, x, y, width, height) {
      var context, destHeight, destWidth, destX, destY, oHeight, oWidth, r, sourceHeight, sourceWidth, sourceX, sourceY;
      oWidth = img.attr('data-original-width');
      oHeight = img.attr('data-original-height');
      if (oWidth > oHeight) {
        r = oHeight / img.height();
      } else {
        r = oWidth / img.width();
      }
      sourceX = Math.round(x * r);
      sourceY = Math.round(y * r);
      sourceWidth = Math.round(width * r);
      sourceHeight = Math.round(height * r);
      destX = 0;
      destY = 0;
      destWidth = settings.width;
      destHeight = settings.height;
      context = $cropSandbox.get(0).getContext('2d');
      return context.drawImage(img.get(0), sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
    };

    setAreaSelect = function(image) {
      var viewPort, x2, y2, height_adjust, context, _this = this;

      if ($sourceIm.width() > settings.max_original_width) {
        $sourceIm.css({
          width: settings.max_original_width + "px"
        });
      }
      viewPortHeight = $(window).height() - 150;
      if ($sourceIm.height() > viewPortHeight) {
        $sourceIm.css({
          height: viewPort + "px"
        });
      }
      log(image.width(), image.height());

      // If the image is wider than it is tall...
      if (image.width() / settings.width >= image.height() / settings.height) {
        y2 = image.height();
        x2 = Math.round(settings.width * (image.height() / settings.height));

      // the image is taller than it is wide...
      } else {
        x2 = image.width();
        y2 = Math.round(settings.height * (image.width() / settings.width));
      }
      log("x2, y2, width, height", x2, y2, image.width(), image.height());
      context = $cropSandbox.get(0).getContext('2d');
      context.clearRect(0, 0, settings.width - 1 , settings.height - 1);
      drawImage($sourceIm, 0, 0, x2 - 1, y2 - 1);
      return image.imgAreaSelect({
	    show: true,
        aspectRatio: "" + settings.width + ":" + settings.height,
        handles: true,
        x1: 0,
        y1: 0,
        x2: x2,
        y2: y2,

        onInit: function(img, selection) {
          return drawImage($sourceIm, selection.x1, selection.y1, selection.width - 1, selection.height - 1);
        },

        onSelectEnd: function(img, selection) {
          imageWasCropped = true;
          return drawImage($sourceIm, selection.x1, selection.y1, selection.width - 1, selection.height - 1);
        }
      });
    };

    fileAllowed = function(name) {
      var res;
      res = name.match(/\.(jpg|png|gif|jpeg)$/mi);
      if (!res) {
        alert('Only *.jpeg, *.jpg, *.png, *.gif files allowed');
        return false;
      } else {
        return true;
      }
    };

    readFile = function(file) {
      var reader;
      reader = new FileReader();
      setLoading();
      reader.onload = function(e) {
        return setImages(e.target.result);
      };
      return reader.readAsDataURL(file);
    };

    handleDropFileSelect = function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      if (evt.originalEvent.dataTransfer.files[0] !== void 0) {
        if (!fileAllowed(evt.originalEvent.dataTransfer.files[0].name)) {
          return;
        }
        return readFile(evt.originalEvent.dataTransfer.files[0]);
      }
    };

    handleDragOver = function(e) {
      e.originalEvent.dataTransfer.dropEffect = "copy";
      e.stopPropagation();
      return e.preventDefault();
    };

    handleFileSelect = function(evt) {
      if (evt.target.files[0] !== void 0) {
        if (!fileAllowed(evt.target.files[0].name)) {
          return;
        }
        readFile(evt.target.files[0]);
        return evt.target.value = "";
      }
    };

    saveCrop = function() {
      var dataURL, imageBlob;

      dataURL = $cropSandbox.get(0).toDataURL("image/jpeg");
      $resultImage.attr('src', dataURL);
      /*
      $resultImageMedium.attr('src', dataURL);
	  $resultImageSmall.attr('src', dataURL);
      */

	  imageBlob = dataURLtoBlob(dataURL);
      if (settings.on_save) {
        settings.on_save(imageBlob);
      }
      return cleanImages();
    };

    $fileSelect.on('change', handleFileSelect);
    $container.on('dragover', handleDragOver);
    $container.on('drop', handleDropFileSelect);
    if (settings.proxy_path !== void 0) {
      $urlSelect.on('dragover', handleDragOver);
      $urlSelect.on('drop', handleDropFileSelect);
      $urlSelectButton.click(function() {
        var url;
        if (!$urlSelect.val().match(/^(https?:\/\/)?/)) {
          return;
        }
        if (!fileAllowed($urlSelect.val())) {
          return;
        }
        setLoading();
        url = settings.proxy_path.replace(/:url/, $urlSelect.val());
        return $.get(url).done(function(data) {
          return setImages(data);
        }).fail(function(jqXNR, textStatus) {
          $progressBar.addClass('hide');
          return alert("Failed to load image");
        });
      });
    }
    $cancelButton.on('click', function() {
      return cleanImages();
    });
    $closeButton.on('click', function() {
      return cleanImages();
    });
    return $saveButton.on('click', function() {
      if (!imageWasCropped){
          $cropSandbox.trigger("shown");
      }
      saveCrop();
      return $imagesContainer.modal('hide');
    });
  };

  /*
  # jQuery Awesome Cropper plugin
  #
  # Copyright 2013 8xx8, vdv73rus
  #
  # v0.0.2
  */


  $.fn.extend({
    awesomeCropper: function(options) {
      return this.each(function() {
        if ($(this).data("awesomeCropper")) {
          if (options.remove) {
            $(this).data("awesomeCropper").remove();
            $(this).removeData("awesomeCropper");
          } else {
            $(this).data("awesomeCropper").setOptions(options);
          }
        } else if (!options.remove) {
          $(this).data("awesomeCropper", new $.awesomeCropper(this, options));
        }
        if (options.instance) {
          return $(this).data("awesomeCropper");
        }
        return this;
      });
    }
  });

}).call(this);
