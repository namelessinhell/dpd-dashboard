(function($, bootstrap) {
  if (!$ || !bootstrap) return;

  var EVENT_MAP = {
    modal: [
      { bs: 'show.bs.modal', legacy: 'show' },
      { bs: 'shown.bs.modal', legacy: 'shown' },
      { bs: 'hide.bs.modal', legacy: 'hide' },
      { bs: 'hidden.bs.modal', legacy: 'hidden' }
    ],
    tooltip: [
      { bs: 'show.bs.tooltip', legacy: 'show' },
      { bs: 'shown.bs.tooltip', legacy: 'shown' },
      { bs: 'hide.bs.tooltip', legacy: 'hide' },
      { bs: 'hidden.bs.tooltip', legacy: 'hidden' }
    ],
    popover: [
      { bs: 'show.bs.popover', legacy: 'show' },
      { bs: 'shown.bs.popover', legacy: 'shown' },
      { bs: 'hide.bs.popover', legacy: 'hide' },
      { bs: 'hidden.bs.popover', legacy: 'hidden' }
    ]
  };

  function legacyKey(name) {
    return '__bsLegacy_' + name;
  }

  function ensureLegacyEvents(el, name) {
    if (!EVENT_MAP[name] || el[legacyKey(name)]) return;
    el[legacyKey(name)] = true;
    EVENT_MAP[name].forEach(function(pair) {
      el.addEventListener(pair.bs, function(ev) {
        $(el).trigger(pair.legacy, ev);
      });
    });
  }

  function storeInstance(el, name, instance) {
    if (!instance) return;
    $(el).data('bs.' + name, instance);
  }

  function normalizeOptions(name, el, options) {
    if (!options || typeof options !== 'object') return options;
    if (name === 'tooltip' && options.title != null) {
      var title = options.title;
      el.setAttribute('data-original-title', title);
      el.setAttribute('data-bs-original-title', title);
      el.setAttribute('title', title);
    }
    if (name === 'popover') {
      if (options.title != null) {
        var popTitle = options.title;
        el.setAttribute('data-original-title', popTitle);
        el.setAttribute('data-bs-original-title', popTitle);
        el.setAttribute('title', popTitle);
      }
      if (options.content != null) {
        var content = options.content;
        el.setAttribute('data-content', content);
        el.setAttribute('data-bs-content', content);
      }
    }
    return options;
  }

  function updateTooltipTitle(instance, el) {
    var title = el.getAttribute('data-original-title') || el.getAttribute('data-bs-original-title') || el.getAttribute('title') || '';
    el.setAttribute('data-bs-original-title', title);
    el.setAttribute('title', title);

    if (typeof instance.setContent === 'function') {
      try {
        instance.setContent({ '.tooltip-inner': title });
      } catch (err) {}
    } else {
      var tip = instance.getTipElement ? instance.getTipElement() : null;
      if (tip) {
        var inner = tip.querySelector('.tooltip-inner');
        if (inner) inner.textContent = title;
      }
    }

    if (typeof instance.update === 'function') {
      instance.update();
    }
  }

  function invokeCommand(name, instance, el, command, args) {
    if (!instance) return;

    if (name === 'tooltip' && command === 'fixTitle') {
      updateTooltipTitle(instance, el);
      return;
    }

    if (command === 'destroy' && typeof instance.dispose === 'function') {
      instance.dispose();
      return;
    }

    if (typeof instance[command] === 'function') {
      instance[command].apply(instance, args || []);
      return;
    }

    if (command === 'toggle' && typeof instance.toggle === 'function') {
      instance.toggle();
    }
  }

  function pluginFactory(name, Constructor) {
    $.fn[name] = function(config) {
      var args = Array.prototype.slice.call(arguments, 1);
      var isCommand = typeof config === 'string';

      return this.each(function() {
        var el = this;
        ensureLegacyEvents(el, name);

        if (isCommand) {
          var instance = Constructor.getInstance(el);
          if (!instance) {
            Constructor.getOrCreateInstance(el);
            instance = Constructor.getInstance(el);
          }
          invokeCommand(name, instance, el, config, args);
          storeInstance(el, name, instance);
        } else {
          var options = normalizeOptions(name, el, config);
          var instance = Constructor.getOrCreateInstance(el, options);
          storeInstance(el, name, instance);
        }
      });
    };
  }

  if (!$.fn.tooltip && bootstrap.Tooltip) {
    pluginFactory('tooltip', bootstrap.Tooltip);
  }

  if (!$.fn.popover && bootstrap.Popover) {
    pluginFactory('popover', bootstrap.Popover);
  }

  if (!$.fn.modal && bootstrap.Modal) {
    pluginFactory('modal', bootstrap.Modal);
  }

})(window.jQuery, window.bootstrap);

(function($){
  if(!$) return;
  if(!$.clean){
    $.clean = function(elems, context, fragment, scripts){
      context = context || document;
      var ret = [];
      if (!Array.isArray(elems)) elems = elems != null ? [elems] : [];
      elems.forEach(function(elem){
        if (typeof elem === 'string'){
          var container = context.createElement('div');
          container.innerHTML = elem;
          var children = container.childNodes ? Array.prototype.slice.call(container.childNodes) : [];
          Array.prototype.push.apply(ret, children);
        } else if (typeof Node !== 'undefined' && elem instanceof Node){
          ret.push(elem);
        }
      });
      if (fragment && fragment.appendChild){
        ret.forEach(function(node){ fragment.appendChild(node); });
      }
      if (Array.isArray(scripts)){ scripts.length = 0; }
      return ret;
    };
  }
})(window.jQuery);




(function($){
  if(!$) return;
  if(!$.fn.bind){
    $.fn.bind = function(types, data, fn){ return this.on(types, data, fn); };
  }
  if(!$.fn.unbind){
    $.fn.unbind = function(types, fn){ return this.off(types, fn); };
  }
  if(!$.fn.delegate){
    $.fn.delegate = function(selector, types, data, fn){ return this.on(types, selector, data, fn); };
  }
  if(!$.fn.undelegate){
    $.fn.undelegate = function(selector, types, fn){ return selector ? this.off(types, selector, fn) : this.off(types); };
  }
  if(!$.fn.size){
    $.fn.size = function(){ return this.length; };
  }
})(window.jQuery);
