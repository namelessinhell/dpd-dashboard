(function() {
  var key = $.cookie('DpdSshKey');
  _dpd.ajax.headers = {
    'dpd-ssh-key': key || true
  };
})();

$(document).ready(function() {
  var resourceSidebarTemplate = _.template($('#resource-sidebar-template').html())
    , resourceTypesTemplate = _.template($('#resource-types-template').html())
    , resources
    , resourceTypes
    , resourceMenu = ui.menu()
    , currentMenuResource = null;


  setupResourceMenu();
  loadResourceTypes();
  loadResources();
  setupMobileTouchHandlers();

  // Quick client-side filter for resources
  $('#resource-sidebar-container').on('input', '#resource-search', function() {
    var q = ($(this).val() || '').toLowerCase();
    var $items = $('#resource-sidebar li.resource');
    if (!q) { $items.show(); return; }
    $items.each(function() {
      var $a = $(this).find('> a').first();
      var text = ($a.text() || '').toLowerCase().replace(/\s+/g, ' ').trim();
      $(this).toggle(text.indexOf(q) !== -1);
    });
  });

  $('#resource-types').on('click', 'a', function() {
    createResource($(this).attr('data-id'));
  });

  // Keyboard shortcuts
  // - '/' focuses the resource filter
  // - 'j'/'k' navigate visible resources
  // - 'Enter' opens the focused resource
  (function initKeyboardShortcuts() {
    var navIndex = -1;

    function isTypingContext(e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return true;
      if ($(e.target).closest('.ace_editor').length) return true;
      return false;
    }

    function visibleItems() {
      return $('#resource-sidebar li.resource:visible');
    }

    function currentIndex() {
      var $items = visibleItems();
      var idx = -1;
      $items.each(function(i) {
        if ($(this).hasClass('nav-focus')) idx = i;
      });
      if (idx === -1) {
        $items.each(function(i) { if ($(this).hasClass('active')) { idx = i; return false; } });
      }
      return idx;
    }

    function applyFocus(index) {
      var $items = visibleItems();
      $items.removeClass('nav-focus');
      if (index >= 0 && index < $items.length) {
        var $el = $($items.get(index));
        $el.addClass('nav-focus');
        var top = $el.position().top, cont = $('#resource-sidebar-container .well');
        if (top < 0 || top > cont.height() - 40) {
          cont.scrollTop(cont.scrollTop() + top - 20);
        }
      }
    }

    $(document).on('keydown', function(e) {
      if (isTypingContext(e)) return; // don't hijack typing contexts

      // Focus filter
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var $f = $('#resource-search');
        if ($f.length) {
          e.preventDefault();
          $f.focus().select();
        }
        return;
      }

      // Navigation
      if ((e.key === 'j' || e.key === 'k' || e.key === 'Enter') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var $items = visibleItems();
        if (!$items.length) return;

        if (e.key === 'j') {
          e.preventDefault();
          var idx = currentIndex();
          navIndex = (idx + 1) % $items.length;
          applyFocus(navIndex);
          return;
        }
        if (e.key === 'k') {
          e.preventDefault();
          var idx2 = currentIndex();
          navIndex = (idx2 <= 0 ? $items.length - 1 : idx2 - 1);
          applyFocus(navIndex);
          return;
        }
        if (e.key === 'Enter') {
          var idx3 = currentIndex();
          if (idx3 >= 0) {
            e.preventDefault();
            var href = $($items.get(idx3)).find('> a').attr('href');
            if (href) { window.location.href = href; }
          }
          return;
        }
      }
    });
  })();

  // Add mobile touch event handlers for table column editing
  function setupMobileTouchHandlers() {
    // Handle touch events for table cells that need editing
    $(document).on('touchstart', '.name, .path', function(e) {
      var $element = $(this);

      // Prevent default to avoid text selection
      e.preventDefault();

      // Add visual feedback for touch
      $element.addClass('touch-active');

      // Show the editing interface (same as hover effect)
      $element.css({
        'border': 'dashed 1px #000',
        'background': 'rgba(0, 0, 0, 0.5)',
        'color': '#fff',
        'margin-left': '0',
        'padding': '5px'
      });

      // Create input field for editing
      var currentText = $element.text();
      var $input = $('<input type="text" class="mobile-edit-input" value="' + currentText + '" />');

      // Style the input
      $input.css({
        'position': 'absolute',
        'top': $element.offset().top,
        'left': $element.offset().left,
        'width': $element.outerWidth(),
        'height': $element.outerHeight(),
        'background': '#fff',
        'color': '#000',
        'border': '1px solid #007acc',
        'padding': '2px 4px',
        'font-size': $element.css('font-size'),
        'font-family': $element.css('font-family'),
        'z-index': '1000'
      });

      // Add input to body
      $('body').append($input);
      $input.focus();

      // Handle input events
      $input.on('blur keydown', function(e) {
        if (e.type === 'blur' || e.keyCode === 13) {
          var newValue = $input.val();

          // Update the element text
          $element.text(newValue);

          // Remove touch-active class
          $element.removeClass('touch-active');

          // Reset styles
          $element.css({
            'border': '',
            'background': '',
            'color': '',
            'margin-left': '',
            'padding': ''
          });

          // Remove input
          $input.remove();

          // Trigger save if needed
          if (newValue !== currentText) {
            triggerSave($element);
          }
        }
      });
    });

    // Handle touch events for component items
    $(document).on('touchstart', '.component-item-header', function(e) {
      var $header = $(this);
      var $item = $header.closest('.component-item');

      // Toggle active state
      $item.toggleClass('active');

      // Show/hide detail section
      var $detail = $item.find('.detail');
      if ($item.hasClass('active')) {
        $detail.slideDown(200);
      } else {
        $detail.slideUp(200);
      }
    });
  }

  // Function to trigger save when data is modified
  function triggerSave($element) {
    // Find the closest component item
    var $componentItem = $element.closest('.component-item');
    if ($componentItem.length) {
      // Add unsaved indicator
      $componentItem.addClass('unsaved');

      // Show save notification
      ui.notify("Changes detected - save to apply").hide(2000).effect('slide');
    }
  }

  function loadResourceTypes() {
    dpd('__resources').get('types', function(res, err) {
      var types = Object.keys(res).reduce(function(prevValue, curValue) {
        res[curValue].id = curValue;
        prevValue.push(res[curValue]);
        return prevValue;
      }, []);
      resourceTypes = res;
      $('#resource-types').html(resourceTypesTemplate({types: types}));
      renderSidebar();
    });
  }

  function setupResourceMenu(argument) {
    resourceMenu.add('Rename', function() {
      renameResource(currentMenuResource);
    });

    resourceMenu.add('Delete', function() {
      deleteResource(currentMenuResource);
    });
  }

  function loadResources() {
    dpd('__resources').get(function(res, err) {
      resources = res.sort(function(a, b) {
        var sort = a.ctime - b.ctime;
        if (sort === 0) {
          sort = a.id.localeCompare(b.id);
        }
        return sort;
      });
      renderSidebar();
    });
  }

  function renderSidebar() {
    if (!resourceTypes || !resources) return;

    $('#resource-sidebar-container > .hide').removeClass('hide d-none').show();

    var $sidebar = $('#resource-sidebar').empty();

    if (resources.length) {
      resources = resources.sort(function(a, b){
        if (a.id > b.id) return 1;
        if (a.id < b.id) return -1;
        return 0;
      });

      var resourceTypesList = Object.keys(resourceTypes).map(function(k) {
        return { label: resourceTypes[k].label || resourceTypes[k].type, resource: resourceTypes[k] };
      }).sort(function(a, b){
        if (a.label > b.label) return 1;
        if (a.label < b.label) return -1;
        return 0;
      });

      $('#resources-empty').hide();

      resourceTypesList.forEach(function(type) {
        var $el = $(resourceSidebarTemplate({type: type}));
        $el.appendTo($sidebar);

        resources.filter(function(resource) {
          return resource.type == type.resource.type;
        }).forEach(function(resource) {
          var $el = $(resourceSidebarTemplate({resource: resource, types: resourceTypes}));

          function showContextMenu(e) {
            var $options = $el.find('.options')
              , pos = $options.offset();
            currentMenuResource = resource;
            resourceMenu.moveTo(pos.left + $options.width(), pos.top + $options.height()).show();
            e.preventDefault();
          }

          $el.find('.pages-header').dblclick(function() {
            location.href = $(this).attr('href');
          }).click(function(e) {
            if (e.which === 2) { return true; }
            $el.find('.pages').slideToggle(200);
            return false;
          });

          $el.find('.options').click(function(e) {
            showContextMenu(e);
            return false;
          });
          // disable context menu
          // $el.on('contextmenu', function(e) {
          //   showContextMenu(e);
          //   return false;
          // });
          $el.appendTo($sidebar);
        });

      });


    } else {
      $('#resources-empty').removeClass('hide d-none').show();
    }
  }

  function createResource(typeId) {
    var type = resourceTypes[typeId];
    pathDialog("Create", "Create New " + (type.label || type.id), type.defaultPath || ('/' + typeId.toLowerCase()), function(path) {
      dpd('__resources').post(path, {
          type: typeId
      }, function(res, err) {
        if (err) { return showError(err, "Could not create resource"); }
        location.href = "/dashboard" + path;
      });
    });
  }

  function deleteResource(resource) {
    ui.confirm("Delete " + resource.id + "?", "This cannot be undone!")
      .ok("Delete")
      .cancel("cancel")
      .overlay()
      .show(function(ok) {
        if (ok) {
          dpd('__resources').del(resource.id, function(res, err) {
            if (err) { return showError(err, "Could not delete resource"); }
            loadResources();
            if (resource.id === Context.resourceId) {
              location.href = "/dashboard";
            }
          });
        }
      });
  }

  function renameResource(resource) {
    pathDialog("Rename", "Rename " + resource.id, '/' + resource.id, function(newPath) {
      var oldPath = resource.id;
      resource.id = newPath;
      dpd('__resources').put(oldPath, resource, function(res, err) {
        if (err) { return showError(err, "Could not rename resource"); }
        loadResources();
        if (oldPath === Context.resourceId) {
          var relative = location.pathname.split('/dashboard/' + oldPath)[1] || '';
          location.href = '/dashboard/' + res.id + relative;
        }
      });
    });
  }

  function pathDialog(verb, title, defaultValue, fn) {
    var $input = $('<input type="text" value="' + defaultValue + '" />')
      , confirm;
    confirm = ui.confirm(title, $input)
      .ok(verb)
      .cancel("cancel")
      .overlay()
      .show(function(ok) {
        if (ok) fn($input.val());
      });

    $input.on('keypress', function(e) {
      setTimeout(function() {
        $input.val(sanitizeResourcePath($input.val()));
        if (e.which == 13) {
          fn($input.val());
          confirm.hide();
        }
      }, 1);
    });
    setTimeout(function() {$input.focus();}, 1);
  }

  function sanitizeResourcePath(path) {
    path = path.toLowerCase().replace(/[ _]/g, '-').replace(/[^a-z0-9\/\-]/g, '');
    if (path.indexOf('/') !== 0) {
      path = '/' + path;
    }
    return path;
  }

  function showError(err, message) {
    var errMessage = err && err.message;
    ui.error(message, errMessage).sticky().effect('slide');
  }
});
