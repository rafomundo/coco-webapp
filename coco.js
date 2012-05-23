/**
 *  This is the applications main controll file.
 *  We listen to change events on the text input fields,
 *  get the content from the text fields, validate and correct it,
 *  calculate the values for the color systems,
 *  format the output and update the text fields with the results.
 *  We also load and save the user preferences made in the option menue
 *  to the HTML5 localStorage.
 *
 *  File: coco.js                       Date: 2011-07-15
 *  Author: Raphael Kuchta              Version: 11.09.02
 */


/** global constants */
const HEX_NOT_VALID = -1;               // given hex string is not valid

/** global vars */
var isHexSharp = "false";                  // always use # prefix with hex values?
var isCMYKPercent = "false";               // use percent for cmyk values

/** keys for localStorage values */
const HEX_SHARP_KEY = "hex_sharp";
const CMYK_PERCENT_KEY = "cmyk_percent";


/**
 * Validate the given RGB value and correct it if necessary
 * The RGB value must be between 0 and 255.
 * Smaler Values are set to 0, same with values that are not numbers.
 * Greater values are set to 255.
 *
 * @param  value    The value to validate
 *
 * @return The validated (and corrected) value
 */
function makeValidRgb(value) {
  if (isNaN(value) || value < 0) {
    return 0;
  }
  if (value > 255) {
    return 255;
  }
  return value;
}
 
/**
 * Validate the given CMYK value and correct it if necessary
 * The CMYK value must be between 0.0 and 1.0.
 * Smaler Values are set to 0.0, same with values that are not numbers.
 * Greater values are set to 1.0.
 *
 * @param  value    The value to validate
 *
 * @return The validated (and corrected) value
 */
function makeValidCmyk(value) { 
  if (isNaN(value) || value < 0.0) {
    return 0.0;
  }
  if (value > 1.0) {
    return 1.0;
  }
  return value;
}

/**
 * Validate the given HEX string and correct it if necessary
 *
 * @param  value    The hex string to validate
 *
 * @return The validated (and corrected) hex string
 */
function makeValidHex(value) {
  // remove the # symbol if the hex value starts with it
  if (value.charAt(0) == '#') {
    value = value.substr(1, 6);
  }
  else if (value.length > 6) {
    // cut too long hex strings to 6 characters
    // (only needed if we did not cut the string already by removing the # symbol)
    value = value.substr(0, 6);
  }
  
  // get the string length
  var l = value.length;
  if (l != 3 && l != 6) {
    return HEX_NOT_VALID;
  }
  // stretch it to 6 chars, if length is only 3
  if (l == 3) {
    value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
  }
  value = value.toUpperCase();
  
  // check if this is a valid hex string
  var regExp = new RegExp("[0-9ABCEDF]{6}");
  if (!regExp.test(value)) {
    return HEX_NOT_VALID;
  }
  return value;
}

/** 
 * Convert RGB to CMYK 
 *
 * @param  iR Red portion of the RGB value
 * @param  iG Green portion of the RGB value
 * @param  iB Blue portion of the RGB value
 *
 * @return An array containing the CMYK values
 */
function rgb2cmyk(iR, iG, iB) {
  // first calculate CMY
  var fC = 1 - (iR / 255);
  var fM = 1 - (iG / 255);
  var fY = 1 - (iB / 255);
  var fK = 1;
  
  // set black to smalest color value first
  fK = Math.min(fK, Math.min(fC, Math.min(fM, fY)));

  // pure black?
  if (fK == 1) {
    fC = 0.0;
    fM = 0.0;
    fY = 0.0;
  }
  else {
    // cmy -> cmyk
    fC = (fC - fK) / (1 - fK);
    fM = (fM - fK) / (1 - fK);
    fY = (fY - fK) / (1 - fK);
  }
  
  // return cmyk value in an array
  var aCMYK = new Array(fC, fM, fY, fK);
  return aCMYK;
}

/**
 * Convert CMYK to RGB
 *
 * @param   fC  Cyan portion of the CMYK value
 * @param   fM  Magenta portion of the CMYK value
 * @param   fY  Yellow portion of the CMYK value
 * @param   fK  Black portion of the CMYK value
 *
 * @return  The RGB values in an array
 */
function cmyk2rgb(fC, fM, fY, fK) {
  fC = (fC * (1 - fK) + fK);
  fM = (fM * (1 - fK) + fK);
  fY = (fY * (1 - fK) + fK);
  
  var iR = Math.round((1 - fC) * 255);
  var iG = Math.round((1 - fM) * 255);
  var iB = Math.round((1 - fY) * 255);
  
  var aRGB = new Array(iR, iG, iB);
  return aRGB;
}

/**
 * Convert RGB to HEX
 *
 * @param  iR Red value
 * @param  iG Green value
 * @param  iB Blue value
 *
 * @return A string with the HEX value
 */
function rgb2hex(iR, iG, iB) {
  // a constant with all possible hex values
  const hex = "0123456789ABCDEF";
  
  // convert decimal values to hex
  var value = hex.charAt((iR - iR % 16) / 16) + hex.charAt(iR % 16);
  value += hex.charAt((iG - iG % 16) / 16) + hex.charAt(iG % 16);
  value += hex.charAt((iB - iB % 16) / 16) + hex.charAt(iB % 16);
  
  // use # as prefix?
  if (isHexSharp == "true") {
    value = "#" + value;
  }
  
  // return hex string
  return value;
}
 
/**
 * converts a HEX string to RGB value
 *
 * @param  sHEX The HEX string
 *
 * @return An array containing the RGB values
 */
function hex2rgb(sHEX) {
  var sR = sHEX.substr(0, 2);
  var sG = sHEX.substr(2, 2);
  var sB = sHEX.substr(4, 2);
  
  // build the rgb values easy with the parsInt function
  var aRGB = new Array(parseInt(sR, 16), parseInt(sG, 16), parseInt(sB, 16));
  return aRGB;
}

/**
 *  One of the RGB values has changed.
 *  Get the RGB values and convert them to CMYK and HEX, then show the results, 
 *  and update the color in the demo area.
 */
function rgbChanged() {
  // get rgb values
  var iR = parseInt($("input[name='rgb_R']").val(), 10);
  var iG = parseInt($("input[name='rgb_G']").val(), 10);
  var iB = parseInt($("input[name='rgb_B']").val(), 10);
  
  // make the values valid (if they are not)
  iR = makeValidRgb(iR);
  iG = makeValidRgb(iG);
  iB = makeValidRgb(iB);
  
  // convert rgb to cmyk (and also format the output)
  var aCMYK = formatCmykOutput(rgb2cmyk(iR, iG, iB));
  
  // convert rgb to hex
  var sHEX = rgb2hex(iR, iG, iB);
  
  // output cmyk values
  $("input[name='cmyk_C']").val(aCMYK[0]);
  $("input[name='cmyk_M']").val(aCMYK[1]);
  $("input[name='cmyk_Y']").val(aCMYK[2]);
  $("input[name='cmyk_K']").val(aCMYK[3]);

  // output hex value
  $("input[name='hex']").val(sHEX);
  
  // also output rgb values (they could be corrected in case of wrong input)
  $("input[name='rgb_R']").val(iR);
  $("input[name='rgb_G']").val(iG);
  $("input[name='rgb_B']").val(iB);
  
  // update the color in the demo area
  updateColorDemo(sHEX);
}

/**
 *  One of the CMYK values has changed.
 *  Get the CMYK values and convert it to RGB and HEX, then show the results, 
 *  and update the color in the demo area.
 */
function cmykChanged() {
  // get cmyk values
  if (isCMYKPercent == "false") {
    var fC = parseFloat($("input[name='cmyk_C']").val().replace(',', '.'));
    var fM = parseFloat($("input[name='cmyk_M']").val().replace(',', '.'));
    var fY = parseFloat($("input[name='cmyk_Y']").val().replace(',', '.'));
    var fK = parseFloat($("input[name='cmyk_K']").val().replace(',', '.'));
  }
  else {
    var fC = parseInt($("input[name='cmyk_C']").val(), 10) / 100;
    var fM = parseInt($("input[name='cmyk_M']").val(), 10) / 100;
    var fY = parseInt($("input[name='cmyk_Y']").val(), 10) / 100;
    var fK = parseInt($("input[name='cmyk_K']").val(), 10) / 100;
  }
  
  // validate and (if necessary) correct the values
  fC = makeValidCmyk(fC);
  fM = makeValidCmyk(fM);
  fY = makeValidCmyk(fY);
  fK = makeValidCmyk(fK);
  
  // calculate rgb from cmyk
  var aRGB = cmyk2rgb(fC, fM, fY, fK);
  
  // now convert rgb to hex
  var sHEX = rgb2hex(aRGB[0], aRGB[1], aRGB[2]);
  
  // output rgb values
  $("input[name='rgb_R']").val(aRGB[0]);
  $("input[name='rgb_G']").val(aRGB[1]);
  $("input[name='rgb_B']").val(aRGB[2]);
    
  // output hex value
  $("input[name='hex']").val(sHEX);
  
  // put values in array and format for output
  var aCMYK = new Array(fC, fM, fY, fK);
  aCMYK = formatCmykOutput(aCMYK);
  
  // output also cmyk again (it could differ from user input now, if we corrected it)
  $("input[name='cmyk_C']").val(aCMYK[0]);
  $("input[name='cmyk_M']").val(aCMYK[1]);
  $("input[name='cmyk_Y']").val(aCMYK[2]);
  $("input[name='cmyk_K']").val(aCMYK[3]);
  
  // update the color in the demo area
  updateColorDemo(sHEX);
}

/**
 *  The HEX value has changed:  
 *  Get the HEX value and convert it to RGB and CMYK,
 *  than display all values again, 
 *  and set the color in the demo area to the new hex value.
 */
function hexChanged() {
  // get hex string
  var sHEX = $("input[name='hex']").val();
  
  // validate and (if necessary) correct the hex string
  sHEX = makeValidHex(sHEX);
  if (sHEX == HEX_NOT_VALID) {
    // user entered a completly wrong hex string -> show him an error message
    alert("Der HEX-Wert kan mit # beginnen und muss 6, oder 3 Zeichen lang sein.");
    return false;
  }
  
  // convert hex to rgb
  var aRGB = hex2rgb(sHEX);
  
  // now convert rgb to cmyk
  var aCMYK = formatCmykOutput(rgb2cmyk(aRGB[0], aRGB[1], aRGB[2]));
  
  // output rgb values
  $("input[name='rgb_R']").val(aRGB[0]);
  $("input[name='rgb_G']").val(aRGB[1]);
  $("input[name='rgb_B']").val(aRGB[2]);
  
  // output cmyk values
  $("input[name='cmyk_C']").val(aCMYK[0]);
  $("input[name='cmyk_M']").val(aCMYK[1]);
  $("input[name='cmyk_Y']").val(aCMYK[2]);
  $("input[name='cmyk_K']").val(aCMYK[3]);
  
  // use # as prefix again?
  if (isHexSharp == "true") {
    sHEX = "#" + sHEX;
  }
    
  // output (corrected) HEX value
  $("input[name='hex']").val(sHEX);
  
  // update the color in the demo area
  updateColorDemo(sHEX);
 }
 
 /**
  * Formats the CMYK values for output, be trimming them to 3 trailing decimals,
  * or converting the float values (0.0 - 1.0) to percent values (0 - 100%).
  *
  * @param aCMYK An Array with CMYK values
  *
  * @return The formatted CMYK values
  */
function formatCmykOutput(aCMYK) {
  if (isCMYKPercent == "true") {
    // convert CMYK float values (0.000 - 1.000) to percent (0% - 100%)
    for (var i = 0; i < aCMYK.length; i++) {
      aCMYK[i] = Math.round(aCMYK[i] * 100) + " %";
    }
  }
  else {
    // trim values to 3 trailing decimals
    for (var i = 0; i < aCMYK.length; i++) {
      aCMYK[i] = aCMYK[i].toFixed(3);
    }
  }
  // return array with formated cmyk values
  return aCMYK;
 }
 
 /**
  * Updates the color in the colorDemo div with the actual HEX value.
  *
  * @param  sHex  The HEX value of the new color.
  */
function updateColorDemo(sHex) {
  // make sure, that the hex value contains the # symbol
  // (the css attribute needs it to set the new color)
  if (isHexSharp == "false") {
    sHex = "#" + sHex;
  }
  
  // just set the css background-color attribute with our actual hex value
  $("#colorDemo").css('background-color', sHex);
}
 

/** document ready function */
$(document).ready( function() {

  // init jqtouch
	$.jQTouch({
        icon: 'icon.png',
        statusBar: 'black-translucent',
        preloadImages: [
            'apple/img/backButton.png',
            'apple/img/toolButton.png',
            'apple/img/on_off.png'
        ]
    });

    
    // load local settings from localStorage
    if (localStorage.getItem(HEX_SHARP_KEY) != null) {
      isHexSharp = localStorage.getItem(HEX_SHARP_KEY);
    }
    if (localStorage.getItem(CMYK_PERCENT_KEY) != null) {
      isCMYKPercent = localStorage.getItem(CMYK_PERCENT_KEY);
    }
    
    // adjust the option menue to match the stored settings
    if (localStorage.getItem(HEX_SHARP_KEY) == "true") {
      $("input[name='hex_sharp']").attr("checked", "checked");
    }
    if (localStorage.getItem(CMYK_PERCENT_KEY) == "true") {
      $("input[name='cmyk_percent']").attr("checked", "checked");
    }
    
	
    // one RGB value changed
		$(".rgb").change( rgbChanged );
    
    // one CMYK value changed
    $(".cmyk").change( cmykChanged );
    
    // the HEX value changed
    $(".hex").change( hexChanged );
    
    
    // hex sharp option changed
    $("input[name='hex_sharp']").change( function() {
      // determine if the checkbox (the on/off switch) is checked, or not and 
      // save the new settings to localStorage
      if ($("input[name='hex_sharp']").is(":checked")) {
        localStorage.setItem(HEX_SHARP_KEY, "true");
        isHexSharp = "true";
      }
      else {
        localStorage.setItem(HEX_SHARP_KEY, "false");
        isHexSharp = "false";
      }
    });
    
    // CMYK percent option changed
    $("input[name='cmyk_percent']").change( function() {
      // determine if the checkbox (the on/off switch) is checked, or not and 
      // save the new settings to localStorage
      if ($("input[name='cmyk_percent']").is(":checked")) {
        localStorage.setItem(CMYK_PERCENT_KEY, "true");
        isCMYKPercent = "true";
      }
      else {
        localStorage.setItem(CMYK_PERCENT_KEY, "false");
        isCMYKPercent = "false";
      }
    });
});
