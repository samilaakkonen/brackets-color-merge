define(function (require, exports, module) {
    "use strict";
    
    var ExtensionUtils = brackets.getModule('utils/ExtensionUtils');
    var PanelManager = brackets.getModule( 'view/PanelManager' );
    var Resizer = brackets.getModule('utils/Resizer');
	var DocumentManager = brackets.getModule('document/DocumentManager');
	var ColorUtils = brackets.getModule('utils/ColorUtils');
    var newColors = [];
	
    ExtensionUtils.loadStyleSheet(module, 'styles.css');
    
    var panelTemplate = require('text!html/panel.html');
    var colorsTemplate = require('text!html/colors.html');
	var exportTemplate = require('text!svg/export.svg');
	var exportColorTemplate = require('text!svg/export_color.svg');
    
	var renderColors = function(colors) {
        var colorsHTML = Mustache.render(colorsTemplate, {
			colors: colors
		});
		return colorsHTML;
    };
	
	var renderExportColors = function(colors) {
		var colorsSVG = Mustache.render(exportColorTemplate, {
			colors: colors
		});
		return colorsSVG;
	};
	
    var panelHTML = Mustache.render(panelTemplate, {colors: renderColors()});
    PanelManager.createBottomPanel( 'samilaakkonen.colormerge.panel', $(panelHTML), 100);
    
    var colorsContainer = $("#sl-color-merge-colors");
	var buttonGet = $("#sl-color-merge-get");
	var buttonClear = $("#sl-color-merge-clear");
	var buttonExport = $("#sl-color-merge-export");
	var buttonMerge = $("#sl-color-merge-merge");
	var icon = $('<a href="#" title="Color Merge" id="sl-color-merge-icon"></a>').appendTo($('#main-toolbar .buttons'));
	
	var lastSelectedColor = null;
    
    colorsContainer.on('click', '.sl-color-merge-color', function() {
        $(this).toggleClass('sl-color-merge-selected');
		lastSelectedColor = $(this).attr('data-id');
		refreshUI();
    });
    
    colorsContainer.on('mousedown', '.sl-color-merge-color', function(e){ 
		if(e.button == 2) { 
			$(this).prependTo($(this).parent());
		}
	});
    
	buttonGet.on('click', function() {
		getColors();
		refreshUI();
    });
    
	buttonClear.on('click', function() {
		colorsContainer.find('.sl-color-merge-selected').removeClass('sl-color-merge-selected');
		refreshUI();
    });
    
	buttonExport.on('click', function() {
		for (i in newColors) {
			newColors[i].y = 20 + i * 22;
			newColors[i].textY = 35 + i * 22;
		}
		var exportSVG = Mustache.render(exportTemplate, {colors: renderExportColors(newColors)});
		var document = DocumentManager.getCurrentDocument();
		document.setText(exportSVG);
	});
    
	buttonMerge.on('click', function() {
		var selectedColors = [];
		$.each(colorsContainer.find('.sl-color-merge-selected'), function(index, element) {
			selectedColors.push($(element).attr('data-code'));
		});
		var sameColor = $(colorsContainer.find('.sl-color-merge-color[data-id=' + lastSelectedColor + ']')).attr('data-code');
		
		var document = DocumentManager.getCurrentDocument();
		var documentText = document.getText();
		$.each(selectedColors, function(index, color) {
			var patt = new RegExp(color, 'gi');
			documentText = documentText.replace(patt, sameColor);
		});
		
		document.setText(documentText);
		getColors();
		refreshUI();
    });
    
	$('#sl-color-merge-panel .close').on('click', function() {
		handleActive();
	});
    
	icon.on('click', function() {
		handleActive();
	});
	
	var handleActive = function() {
		if (icon.hasClass('active')) {
            Resizer.hide($("#sl-color-merge-panel"));
            icon.removeClass('active');
        } else {
            Resizer.show($("#sl-color-merge-panel"));
            icon.addClass('active');
            getColors();
            refreshUI();
        }
	};
	
	var refreshUI = function() {
		if (colorsContainer.find('.sl-color-merge-selected').length == 0) {
			buttonClear.attr('disabled', 'disabled');
			buttonMerge.attr('disabled', 'disabled');
			lastSelectedColor = null;
		}
		else {
			buttonClear.removeAttr('disabled');
			buttonMerge.removeAttr('disabled');
		}
		
		if (newColors.length > 0) {
			buttonExport.removeAttr('disabled');
		}
		else {
			buttonExport.attr('disabled', 'disabled');
		}
		
		refreshLastSelectedColor();
	};
	
	var lastSelectedClass = 'sl-color-merge-last-selected';
    
	var refreshLastSelectedColor = function() {
		var lastSelectedFound = false;
        
		$.each(colorsContainer.find('.sl-color-merge-color'), function(index, element) {
			var elementID = $(element).attr('data-id');
			if ($(element).hasClass('sl-color-merge-selected') && elementID == lastSelectedColor) {
				$(element).addClass(lastSelectedClass);
				lastSelectedFound = true;
			}
			else {
				$(element).removeClass(lastSelectedClass);
			}
		});
        
		if (!lastSelectedFound) {
			var firstSelected = colorsContainer.find('.sl-color-merge-color.sl-color-merge-selected:first');
			if (firstSelected) {
				firstSelected.addClass(lastSelectedClass);
				lastSelectedColor = firstSelected.attr('data-id');
			}
			else {
				lastSelectedColor = null;
			}
		}
	};
	
	var updateColors = function(colors) {
		colorsContainer.empty().append(renderColors(colors));
	};
	
	var getColors = function() {
		var documentText = DocumentManager.getCurrentDocument().getText();
		var foundColors = documentText.match(ColorUtils.COLOR_REGEX);
		
		if (foundColors) {
			var filteredColors = [];
            
			$.each(foundColors, function(index, value) {
				if ($.inArray(value, filteredColors) === -1 && value.charAt(0) == '#') filteredColors.push(value);
			});

			newColors = [];
            
			$.each(filteredColors, function(index, value) {
				newColors.push({
					id: index,
					code: value,
					selected: false
				});
			});
		}
		else {
			newColors = [];
		}
		
		updateColors(newColors);
		refreshUI();
	};
});