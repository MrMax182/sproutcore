// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*global jQuery*/

sc_require('system/browser');
sc_require('system/event');
sc_require('system/cursor');
sc_require('system/responder');
sc_require('system/theme');

sc_require('system/string');
sc_require('views/view/base');


/**
  Default property to disable or enable by default the contextMenu
*/
SC.CONTEXT_MENU_ENABLED = YES;

/**
  Default property to disable or enable if the focus can jump to the address
  bar or not.
*/
SC.TABBING_ONLY_INSIDE_DOCUMENT = NO;

/**
  Tells the property (when fetched with themed()) to get its value from the renderer (if any).
*/
SC.FROM_THEME = "__FROM_THEME__"; // doesn't really matter what it is, so long as it is unique. Readability is a plus.

/** @private - custom array used for child views */
SC.EMPTY_CHILD_VIEWS_ARRAY = [];
SC.EMPTY_CHILD_VIEWS_ARRAY.needsClone = YES;

/**
  @class

*/
SC.CoreView.reopen(
/** @scope SC.View.prototype */ {

  /**
    An array of the properties of this class that will be concatenated when
    also present on subclasses.

    For example, displayProperties is a concatenated property.  SC.CoreView
    defines displayProperties as ['ariaHidden'] and its subclass SC.View
    defines the same property as ['isFirstResponder'].  Therefore, the
    actual displayProperties on SC.View becomes ['ariaHidden', 'isFirstResponder'].

    @type Array
    @default ['outlets', 'displayProperties', 'classNames', 'renderMixin', 'didCreateLayerMixin', 'willDestroyLayerMixin', 'classNameBindings', 'attributeBindings']
  */
  concatenatedProperties: ['outlets', 'displayProperties', 'classNames', 'renderMixin', 'didCreateLayerMixin', 'willDestroyLayerMixin', 'classNameBindings', 'attributeBindings'],

  /**
    The WAI-ARIA role of the control represented by this view. For example, a
    button may have a role of type 'button', or a pane may have a role of
    type 'alertdialog'. This property is used by assistive software to help
    visually challenged users navigate rich web applications.

    The full list of valid WAI-ARIA roles is available at:
    http://www.w3.org/TR/wai-aria/roles#roles_categorization

    @type String
    @default null
  */
  ariaRole: null,

  /**
    The full list of valid WAI-ARIA roles is available at:
    http://www.w3.org/TR/wai-aria/roles#roles_categorization

    @type String
    @default null
  */
  ariaHidden: null,

  /**
    The current pane.

    @field
    @type SC.Pane
    @default null
  */
  pane: function () {
    var view = this;

    while (view && !view.isPane) { view = view.get('parentView'); }

    return view;
  }.property('parentView').cacheable(),

  /**
    The page this view was instantiated from.  This is set by the page object
    during instantiation.

    @type SC.Page
    @default null
  */
  page: null,

  /**
    If the view is currently inserted into the DOM of a parent view, this
    property will point to the parent of the view.

    @type SC.View
    @default null
  */
  parentView: null,

  /**
    The isVisible property determines if the view should be displayed or not.
    You should set this property to show or hide a view that has been appended
    to the DOM.

    If you also set a transitionShow or transitionHide plugin, then when
    isVisible changes, the appropriate transition will execute as the view's
    visibility changes.

    Note that isVisible can be set to true and the view may still not be
    "visible" in the window.  This can occur if:

      1. the view is not attached to the DOM.
      2. the view has a view ancestor with isVisible set to false.

    @type Boolean
    @see SC.View#isShown
    @see SC.View#isHidden
    @default true
  */
  isVisible: true,
  isVisibleBindingDefault: SC.Binding.bool(),

  /**
    To determine actual visibility of a view use the `isAttached`, `isShown`
    and `isHidden` properties.

    @see SC.View#isAttached
    @see SC.View#isShown
    @see SC.View#isHidden
    @deprecated Version 1.10
  */
  isVisibleInWindow: YES,

  // ..........................................................
  // CHILD VIEW SUPPORT
  //

  /**
    Array of child views.  You should never edit this array directly unless
    you are implementing createChildViews().  Most of the time, you should
    use the accessor methods such as appendChild(), insertBefore() and
    removeChild().

    @type Array
    @default []
  */
  childViews: SC.EMPTY_CHILD_VIEWS_ARRAY,

  /**
    The child view layout plugin to use when laying out child views.

    You can set this property to a child layout plugin object to
    automatically set and adjust the layouts of this view's child views
    according to some specific layout style.  For instance, SproutCore includes
    two such plugins, SC.View.VERTICAL_STACK and SC.View.HORIZONTAL_STACK.

    SC.View.VERTICAL_STACK will arrange child views in order in a vertical
    stack, which only requires that the height of each child view be specified.
    Likewise, SC.View.HORIZONTAL_STACK does the same in the horizontal
    direction, which requires that the width of each child view be specified.

    Where child layout plugins are extremely useful, besides simplifying
    the amount of layout code you need to write, is that they can update the
    layouts automatically as things change.  For more details and examples,
    please see the documentation for SC.View.VERTICAL_STACK and
    SC.View.HORIZONTAL_STACK.

    To define your own child view layout plugin, simply create an object that
    conforms to the SC.ChildViewLayoutProtocol protocol.

    **Note** This should only be set once and is not bindable.

    @type Object
    @default null
   */
  childViewLayout: null,

  /**
    The options for the given child view layout plugin.

    These options are specific to the current child layout plugin being used and
    are used to modify the applied layouts.  For example, SC.View.VERTICAL_STACK
    accepts options like:

        childViewLayoutOptions: {
          paddingAfter: 20,
          paddingBefore: 20,
          spacing: 10
        }

    To determine what options may be used for a given plugin and to see what the
    default options are, please refer to the documentation for the child layout
    plugin being used.

    @type Object
    @default null
  */
  childViewLayoutOptions: null,

  /**
    Whether the child views should be monitored for changes that affect the
    current child view layout.

    When true and using a childViewLayout plugin, the child views will be
    observed for changes that would change the layout of all the child views.
    For example, when using SC.View.VERTICAL_STACK, if any child view's height
    or visibility changes, the view will adjust the other child views
    accordingly.

    @type Boolean
    @default true
  */
  isChildViewLayoutLive: true,

  /**
    Called by observers on child views when a property of the child view
    changes in such a manner that requires the child view layout to be
    reapplied.
  */
  childViewLayoutNeedsUpdate: function () {
    var childViewLayout = this.childViewLayout;

    childViewLayout.adjustChildViews(this);
  },

  // ..........................................................
  // LAYER SUPPORT
  //

  /**
    Returns the current layer for the view.  The layer for a view is only
    generated when the view first becomes visible in the window and even
    then it will not be computed until you request this layer property.

    If the layer is not actually set on the view itself, then the layer will
    be found by calling this.findLayerInParentLayer().

    You can also set the layer by calling set on this property.

    @type DOMElement the layer
  */
  layer: function (key, value) {
    if (value !== undefined) {
      this._view_layer = value;

    // no layer...attempt to discover it...
    } else {
      value = this._view_layer;
      if (!value) {
        var parent = this.get('parentView');
        if (parent) { parent = parent.get('layer'); }
        this._view_layer = value = this.findLayerInParentLayer(parent);
      }
    }
    return value;
  }.property('isVisibleInWindow').cacheable(),

  /**
    Get a CoreQuery object for this view's layer, or pass in a selector string
    to get a CoreQuery object for a DOM node nested within this layer.

    @param {String} sel a CoreQuery-compatible selector string
    @returns {SC.CoreQuery} the CoreQuery object for the DOM node
  */
  $: function (sel) {
    var layer = this.get('layer');

    if (!layer) { return SC.$(); }
    else if (sel === undefined) { return SC.$(layer); }
    else { return SC.$(sel, layer); }
  },

  /**
    Returns the DOM element that should be used to hold child views when they
    are added/remove via DOM manipulation.  The default implementation simply
    returns the layer itself.  You can override this to return a DOM element
    within the layer.

    @type DOMElement the container layer
  */
  containerLayer: function () {
    return this.get('layer');
  }.property('layer').cacheable(),

  /**
    The ID to use when trying to locate the layer in the DOM.  If you do not
    set the layerId explicitly, then the view's GUID will be used instead.
    This ID must be set at the time the view is created.

    @type String
    @readOnly
  */
  layerId: function (key, value) {
    if (value) { this._layerId = value; }
    if (this._layerId) { return this._layerId; }
    return SC.guidFor(this);
  }.property().cacheable(),

  /**
    Attempts to discover the layer in the parent layer.  The default
    implementation looks for an element with an ID of layerId (or the view's
    guid if layerId is null).  You can override this method to provide your
    own form of lookup.  For example, if you want to discover your layer using
    a CSS class name instead of an ID.

    @param {DOMElement} parentLayer the parent's DOM layer
    @returns {DOMElement} the discovered layer
  */
  findLayerInParentLayer: function (parentLayer) {
    var id = "#" + this.get('layerId');
    return jQuery(id, parentLayer)[0] || jQuery(id)[0];
  },

  /**
    Returns YES if the receiver is a subview of a given view or if it's
    identical to that view. Otherwise, it returns NO.

    @property {SC.View} view
  */
  isDescendantOf: function (view) {
    var parentView = this.get('parentView');

    if (this === view) { return YES; }
    else if (parentView) { return parentView.isDescendantOf(view); }
    else { return NO; }
  },

  /**
    This method is invoked whenever a display property changes.  It will set
    the layerNeedsUpdate method to YES.  If you need to perform additional
    setup whenever the display changes, you can override this method as well.

    @returns {SC.View} receiver
  */
  displayDidChange: function () {
    this.invokeOnce(this._doUpdateContent);

    return this;
  },

  /**
    Marks the view as needing a display update if the isVisible property changes.

    Note that this behavior is identical to a display property. It is broken out
    into its own observer so that it can be overridden with additional
    functionality if the visibility module is applied to SC.View.
  */
  _sc_isVisibleDidChange: function () {
    this._visibilityNeedsUpdate = true;
    if (this.get('isVisible')) {
      this.invokeOnce(this._doShow);
    } else {
      this.invokeOnce(this._doHide);
    }
  }.observes('isVisible'),

  /**
    Setting this property to YES will cause the updateLayerIfNeeded method to
    be invoked at the end of the runloop.  You can also force a view to update
    sooner by calling updateLayerIfNeeded() directly.  The method will update
    the layer only if this property is YES.

    @type Boolean
    @test in updateLayer
  */
  layerNeedsUpdate: NO,

  /** @private
    Schedules the updateLayerIfNeeded method to run at the end of the runloop
    if layerNeedsUpdate is set to YES.
  */
  _view_layerNeedsUpdateDidChange: function () {
    if (this.get('layerNeedsUpdate')) {
      this.invokeOnce(this._doUpdateContent);
    }
  }.observes('layerNeedsUpdate'),

  /**
    Updates the layer only if the view is visible onscreen and if
    layerNeedsUpdate is set to YES.  Normally you will not invoke this method
    directly.  Instead you set the layerNeedsUpdate property to YES and this
    method will be called once at the end of the runloop.

    If you need to update view's layer sooner than the end of the runloop, you
    can call this method directly.  If your view is not visible in the window
    but you want it to update anyway, then call this method, passing YES for
    the 'skipIsVisibleInWindowCheck' parameter.

    You should not override this method.  Instead override updateLayer() or
    render().

    @returns {SC.View} receiver
    @test in updateLayer
  */
  updateLayerIfNeeded: function (skipIsVisibleInWindowCheck) {
    //@if(debug)
    if (skipIsVisibleInWindowCheck) {
      SC.warn("Developer Warning: The `skipIsVisibleInWindowCheck` argument of updateLayerIfNeeded is not supported and will be ignored.");
    }
    //@endif

    this._doUpdateContent(false);

    return this;
  },

  /**
    This is the core method invoked to update a view layer whenever it has
    changed.  This method simply creates a render context focused on the
    layer element and then calls your render() method.

    You will not usually call or override this method directly.  Instead you
    should set the layerNeedsUpdate property to YES to cause this method to
    run at the end of the run loop, or you can call updateLayerIfNeeded()
    to force the layer to update immediately.

    Instead of overriding this method, consider overriding the render() method
    instead, which is called both when creating and updating a layer.  If you
    do not want your render() method called when updating a layer, then you
    should override this method instead.

    @param {Boolean} force Force the update to the layer immediately even if the view is not in a shown state.
    @returns {SC.View} receiver
  */
  updateLayer: function (force) {
    this._doUpdateContent(force);

    return this;
  },

  /** @private */
  parentViewDidResize: function () {
    if (!this.get('hasLayout')) { this.notifyPropertyChange('frame'); }
    this.viewDidResize();
  },

  /**
    Override this in a child class to define behavior that should be invoked
    when a parent's view was resized.
   */
  viewDidResize: function () {},

  /**
    Creates a new renderContext with the passed tagName or element.  You
    can override this method to provide further customization to the context
    if needed.  Normally you will not need to call or override this method.

    @returns {SC.RenderContext}
  */
  renderContext: function (tagNameOrElement) {
    return SC.RenderContext(tagNameOrElement);
  },

  /**
    Creates the layer by creating a renderContext and invoking the view's
    render() method.  This will only create the layer if the layer does not
    already exist.

    When you create a layer, it is expected that your render() method will
    also render the HTML for all child views as well.  This method will
    notify the view along with any of its childViews that its layer has been
    created.

    @returns {SC.View} receiver
  */
  createLayer: function () {
    this._doRender();

    return this;
  },

  /**
    Destroys any existing layer along with the layer for any child views as
    well.  If the view does not currently have a layer, then this method will
    do nothing.

    If you implement willDestroyLayer() on your view or if any mixins
    implement willDestroLayerMixin(), then this method will be invoked on your
    view before your layer is destroyed to give you a chance to clean up any
    event handlers, etc.

    If you write a willDestroyLayer() handler, you can assume that your
    didCreateLayer() handler was called earlier for the same layer.

    Normally you will not call or override this method yourself, but you may
    want to implement the above callbacks when it is run.

    @returns {SC.View} receiver
  */
  destroyLayer: function () {
    // We allow you to call destroy layer, but you should really detach first.
    if (this.get('isAttached')) {
      //@if(debug)
      SC.warn("Developer Warning: You should properly remove a view first before calling destroyLayer on it.  For example, by calling `remove()` on a pane or `removeChild()` on a child view.  This view, %@, will be detached from the DOM and its layer destroyed.".fmt(this));
      //@endif
      this._doDetach();
    }

    this._doDestroyLayer();

    return this;
  },

  /**
    Destroys and recreates the current layer.  Doing this on a parent view can
    be more efficient than modifying individual child views independently.

    @returns {SC.View} receiver
  */
  replaceLayer: function () {
    return this.destroyLayer().createLayer();
  },

  /**
    If the parent view has changed, we need to insert this
    view's layer into the layer of the new parent view.
  */
  parentViewDidChange: function () {
    //@if(debug)
    SC.warn("Developer Warning: parentViewDidChange has been deprecated.  Please use the notification methods willAddChild, didAddChild, willRemoveChild or didRemoveChild on the parent or willAddToParent, didAddToParent, willRemoveFromParent or didRemoveFromParent on the child to perform updates when the parent/child status changes.")
    //@endif
  },

  /**
    Set to YES when the view's layer location is dirty.  You can call
    updateLayerLocationIfNeeded() to clear this flag if it is set.

    @type Boolean
  */
  layerLocationNeedsUpdate: NO,

  /**
    Calls updateLayerLocation(), but only if the view's layer location
    currently needs to be updated.  This method is called automatically at
    the end of a run loop if you have called parentViewDidChange() at some
    point.

    @returns {SC.View} receiver
    @test in updateLayerLocation
  */
  updateLayerLocationIfNeeded: function () {
    if (this.get('layerLocationNeedsUpdate')) {
      this.updateLayerLocation();
    }

    return this;
  },

  /**
    This method is called when a view changes its location in the view
    hierarchy.  This method will update the underlying DOM-location of the
    layer so that it reflects the new location.

    @deprecated Version 1.10
    @returns {SC.View} receiver
  */
  updateLayerLocation: function () {
    //@if(debug)
    SC.warn("SC.View.prototype.updateLayerLocation is no longer used and has been deprecated.  See the SC.View statechart code for more details on attaching and detaching layers.");
    //@endif

    return this;
  },

  /**
    @private

    Renders to a context.
    Rendering only happens for the initial rendering. Further updates happen in updateLayer,
    and are not done to contexts, but to layers.
    Note: You should not generally override nor directly call this method. This method is only
    called by createLayer to set up the layer initially, and by renderChildViews, to write to
    a context.

    @param {SC.RenderContext} context the render context.
    @param {Boolean} firstTime Provided for compatibility when rendering legacy views only.
  */
  renderToContext: function (context, firstTime) {
    var hasLegacyRenderMethod, mixins, idx, len;

    this.beginPropertyChanges();
    // this.set('layerNeedsUpdate', NO);

    if (SC.none(firstTime)) { firstTime = YES; }

    this._renderLayerSettings(context, firstTime);

    // If the render method takes two parameters, we assume that it is a
    // legacy implementation that takes context and firstTime. If it has only
    // one parameter, we assume it is the render delegates style that requires
    // only context. Note that, for backwards compatibility, the default
    // SC.View implementation of render uses the old style.
    hasLegacyRenderMethod = !this.update;

    // Let the render method handle rendering. If we have a render delegate
    // object set, it will be used there.
    if (hasLegacyRenderMethod) {
      this.render(context, firstTime);
    }
    // This view implements the render delegate protocol.
    else {
      if (firstTime) {
        this.render(context);
      } else {
        this.update(context.$());
      }
    }

    // If we've made it this far and renderChildViews() was never called,
    // render any child views now.
    if (firstTime && !this._didRenderChildViews) { this.renderChildViews(context, firstTime); }
    // Reset the flag so that if the layer is recreated we re-render the child views
    this._didRenderChildViews = NO;


    if (mixins = this.renderMixin) {
      len = mixins.length;
      for (idx = 0; idx < len; ++idx) { mixins[idx].call(this, context, firstTime); }
    }

    this.endPropertyChanges();
  },

  _renderLayerSettings: function (context, firstTime) {
    context.resetClasses();
    context.resetStyles();

    this.applyAttributesToContext(context);
  },

  applyAttributesToContext: function (context) {
    if (!this.get('layer')) {
      this._applyClassNameBindings();
      this._applyAttributeBindings(context);
    }

    context.addClass(this.get('classNames'));

    if (this.get('isTextSelectable')) { context.addClass('allow-select'); }
    if (!this.get('isVisible')) { context.addClass('sc-hidden'); }
    if (this.get('isFirstResponder')) { context.addClass('focus'); }

    context.id(this.get('layerId'));
    context.setAttr('role', this.get('ariaRole'));

    var _ariaHidden = this.get('ariaHidden');
    if (_ariaHidden !== null) {
      if (_ariaHidden === NO) context.removeAttr('aria-hidden');
      else context.setAttr('aria-hidden', _ariaHidden);
    }
  },

  /**
    @private

    Iterates over the view's `classNameBindings` array, inserts the value
    of the specified property into the `classNames` array, then creates an
    observer to update the view's element if the bound property ever changes
    in the future.
  */
  _applyClassNameBindings: function () {
    var classBindings = this.get('classNameBindings'),
        classNames = this.get('classNames'),
        dasherizedClass;

    if (!classBindings) { return; }

    // Loop through all of the configured bindings. These will be either
    // property names ('isUrgent') or property paths relative to the view
    // ('content.isUrgent')
    classBindings.forEach(function (property) {

      // Variable in which the old class value is saved. The observer function
      // closes over this variable, so it knows which string to remove when
      // the property changes.
      var oldClass;

      // Set up an observer on the context. If the property changes, toggle the
      // class name.
      var observer = function () {
        // Get the current value of the property
        var newClass = this._classStringForProperty(property);
        var elem = this.$();

        // If we had previously added a class to the element, remove it.
        if (oldClass) {
          elem.removeClass(oldClass);
          classNames.removeObject(oldClass);
        }

        // If necessary, add a new class. Make sure we keep track of it so
        // it can be removed in the future.
        if (newClass) {
          elem.addClass(newClass);
          classNames.push(newClass);
          oldClass = newClass;
        } else {
          oldClass = null;
        }
      };

      this.addObserver(property.split(':')[0], this, observer);

      // Get the class name for the property at its current value
      dasherizedClass = this._classStringForProperty(property);

      if (dasherizedClass) {
        // Ensure that it gets into the classNames array
        // so it is displayed when we render.
        classNames.push(dasherizedClass);

        // Save a reference to the class name so we can remove it
        // if the observer fires. Remember that this variable has
        // been closed over by the observer.
        oldClass = dasherizedClass;
      }

    }, this);
  },

  /**
    Iterates through the view's attribute bindings, sets up observers for each,
    then applies the current value of the attributes to the passed render buffer.

    @param {SC.RenderBuffer} buffer
  */
  _applyAttributeBindings: function (context) {
    var attributeBindings = this.get('attributeBindings'),
        attributeValue, elem, type;

    if (!attributeBindings) { return; }

    attributeBindings.forEach(function (attribute) {
      // Create an observer to add/remove/change the attribute if the
      // JavaScript property changes.
      var observer = function () {
        elem = this.$();
        var currentValue = elem.attr(attribute);
        attributeValue = this.get(attribute);

        type = typeof attributeValue;

        if ((type === 'string' || type === 'number') && attributeValue !== currentValue) {
          elem.attr(attribute, attributeValue);
        } else if (attributeValue && type === 'boolean') {
          elem.attr(attribute, attribute);
        } else if (attributeValue === NO) {
          elem.removeAttr(attribute);
        }
      };

      this.addObserver(attribute, this, observer);

      // Determine the current value and add it to the render buffer
      // if necessary.
      attributeValue = this.get(attribute);
      type = typeof attributeValue;

      if (type === 'string' || type === 'number') {
        context.setAttr(attribute, attributeValue);
      } else if (attributeValue && type === 'boolean') {
        // Apply boolean attributes in the form attribute="attribute"
        context.setAttr(attribute, attribute);
      }
    }, this);
  },

  /**
    @private

    Given a property name, returns a dasherized version of that
    property name if the property evaluates to a non-falsy value.

    For example, if the view has property `isUrgent` that evaluates to true,
    passing `isUrgent` to this method will return `"is-urgent"`.
  */
  _classStringForProperty: function (property) {
    var split = property.split(':'), className = split[1];
    property = split[0];

    var val = SC.getPath(this, property);

    // If value is a Boolean and true, return the dasherized property
    // name.
    if (val === YES) {
      if (className) { return className; }

      // Normalize property path to be suitable for use
      // as a class name. For exaple, content.foo.barBaz
      // becomes bar-baz.
      return SC.String.dasherize(property.split('.').get('lastObject'));

    // If the value is not NO, undefined, or null, return the current
    // value of the property.
    } else if (val !== NO && val !== undefined && val !== null) {
      return val;

    // Nothing to display. Return null so that the old class is removed
    // but no new class is added.
    } else {
      return null;
    }
  },

  /**
    Your render method should invoke this method to render any child views,
    especially if this is the first time the view will be rendered.  This will
    walk down the childView chain, rendering all of the children in a nested
    way.

    @param {SC.RenderContext} context the context
    @param {Boolean} firstName true if the layer is being created
    @returns {SC.RenderContext} the render context
    @test in render
  */
  renderChildViews: function (context, firstTime) {
    var cv = this.get('childViews'), len = cv.length, idx, view;
    for (idx = 0; idx < len; ++idx) {
      view = cv[idx];
      if (!view) { continue; }
      context = context.begin(view.get('tagName'));
      view.renderToContext(context, firstTime);
      context = context.end();
    }
    this._didRenderChildViews = YES;

    return context;
  },

  /** @private -
    override to add support for theming or in your view
  */
  render: function () { },

  /** @private -
    Invokes the receivers didAppendToDocument() method if it exists and
    then invokes the same on all child views.
  */

  // _notifyDidAppendToDocument: function () {
  //   if (!this.get('hasLayout')) { this.notifyPropertyChange('frame'); }
  //   if (this.didAppendToDocument) { this.didAppendToDocument(); }

  //   var i = 0, childView, childViews = this.get('childViews');
  //   for (var i = childViews.length - 1; i >= 0; i--) {
  //   // for (i = 0, childLen = children.length; i < childLen; i++) {
  //     childView = childViews[i];

  //     // if (childView.get('isOrphan')) {
  //     //   childView._doAdopt(this, null);
  //     // }

  //     if (childView._notifyDidAppendToDocument) {
  //       childView._notifyDidAppendToDocument();
  //     }
  //   }
  // },

  // childViewsObserver: function () {
  //   var childViews = this.get('childViews'), i, iLen, child;
  //   for (i = 0, iLen = childViews.length; i < iLen; i++) {
  //     child = childViews[i];
  //     if (child._notifyDidAppendToDocument) {
  //       child._notifyDidAppendToDocument();
  //     }
  //   }
  // }.observes('childViews'),

  // ..........................................................
  // STANDARD RENDER PROPERTIES
  //

  /**
    A list of properties on the view to translate dynamically into attributes on
    the view's layer (element).

    When the view is rendered, the value of each property listed in
    attributeBindings will be inserted in the element.  If the value is a
    Boolean, the attribute name itself will be inserted.  As well, as the
    value of any of these properties changes, the layer will update itself
    automatically.

    This is an easy way to set custom attributes on the View without
    implementing it through a render or update function.

    For example,

        // ...  MyApp.MyView

        attributeBindings: ['aria-valuenow', 'disabled'],

        'aria-valuenow': function () {
          return this.get('value');
        }.property('value').cacheable(), // adds 'aria-valuenow="{value}"' attribute

        disabled: YES, // adds 'disabled="disabled"' attribute

        // ...

    @type Array
    @default null
  */
  attributeBindings: null,


  /**
    Tag name for the view's outer element.  The tag name is only used when
    a layer is first created.  If you change the tagName for an element, you
    must destroy and recreate the view layer.

    @type String
    @default 'div'
  */
  tagName: 'div',

  /**
    Standard CSS class names to apply to the view's outer element.  These class
    names are used in addition to any defined on the view's superclass.

    @type Array
    @default []
  */
  classNames: [],

  /**
    A list of local property names to translate dynamically into standard
    CSS class names on your view's layer (element).

    Each entry in the array should take the form "propertyName:css-class".
    For example, "isRed:my-red-view" will cause the class "my-red-view" to
    be appended if the property "isRed" is (or becomes) true, and removed
    if it later becomes false (or null/undefined).

    Optionally, you may provide just the property name, in which case it will
    be dasherized and used as the class name.  For example, including
    "isUpsideDown" will cause the view's isUpsideDown property to mediate the
    class "is-upside-down".

    Instead of a boolean value, your property may return a string, which will
    be used as the class name for that entry.  Use caution when returning other
    values; numbers will be appended verbatim and objects will be stringified,
    leading to unintended results such as class="4" or class="Object object".

    Class names mediated by these bindings are used in addition to any that
    you've listed in the classNames property.

    @type Array
  */
  classNameBindings: null,

  /**
    Tool tip property that will be set to the title attribute on the HTML
    rendered element.

    @type String
  */
  toolTip: null,

  /**
    The computed tooltip.  This is generated by localizing the toolTip
    property if necessary.

    @type String
  */
  displayToolTip: function () {
    var ret = this.get('toolTip');
    return (ret && this.get('localize')) ? SC.String.loc(ret) : (ret || '');
  }.property('toolTip', 'localize').cacheable(),

  /**
    Determines if the user can select text within the view.  Normally this is
    set to NO to disable text selection.  You should set this to YES if you
    are creating a view that includes editable text.  Otherwise, settings this
    to YES will probably make your controls harder to use and it is not
    recommended.

    @type Boolean
    @readOnly
  */
  isTextSelectable: NO,

  /**
    You can set this array to include any properties that should immediately
    invalidate the display.  The display will be automatically invalidated
    when one of these properties change.

    These are the properties that will be visible to any Render Delegate.
    When the RenderDelegate asks for a property it needs, the view checks the
    displayProperties array. It first looks for the property name prefixed
    by 'display'; for instance, if the render delegate needs a 'title',
    the view will attempt to find 'displayTitle'. If there is no 'displayTitle'
    in displayProperties, the view will then try 'title'. If 'title' is not
    in displayProperties either, an error will be thrown.

    This allows you to avoid collisions between your view's API and the Render
    Delegate's API.

    Implementation note:  'isVisible' is also effectively a display property,
    but it is not declared as such because the same effect is implemented
    inside _sc_isVisibleDidChange().  This avoids having two observers on
    'isVisible', which is:
      a.  More efficient
      b.  More correct, because we can guarantee the order of operations

    @type Array
    @readOnly
  */
  displayProperties: ['ariaHidden'],

  // .......................................................
  // SC.RESPONDER SUPPORT
  //

  /** @property
    The nextResponder is usually the parentView.
  */
  nextResponder: function () {
    return this.get('parentView');
  }.property('parentView').cacheable(),


  /** @property
    Set to YES if your view is willing to accept first responder status.  This
    is used when calculating key responder loop.
  */
  acceptsFirstResponder: NO,

  // .......................................................
  // CORE DISPLAY METHODS
  //

  /** @private
    Setup a view, but do not finish waking it up.

     - configure childViews
     - Determine the view's theme
     - Fetch a render delegate from the theme, if necessary
     - register the view with the global views hash, which is used for event
       dispatch
  */
  init: function () {
    var childViews,
      childViewLayout = this.childViewLayout;

    sc_super();

    // Register the view for event handling. This hash is used by
    // SC.RootResponder to dispatch incoming events.
    //@if (debug)
    if (SC.View.views[this.get('layerId')]) {
      throw new Error("Developer Error: A view with layerId, '%@', already exists.  Each view must have a unique layerId.".fmt(this.get('layerId')));
    }
    //@endif
    SC.View.views[this.get('layerId')] = this;

    // setup classNames
    this.classNames = this.get('classNames').slice();

    // setup child views.  be sure to clone the child views array first
    childViews = this.childViews = this.get('childViews').slice();
    this.createChildViews(); // setup child Views

    // Apply an automatic child view layout if it is defined.
    if (childViewLayout) {
      childViewLayout.adjustChildViews(this);

      if (this.get('isChildViewLayoutLive')) {
        this.addObserver('childViewLayoutOptions', this, 'childViewLayoutNeedsUpdate');
        childViewLayout.beginObserving(this);
      }
    }

    // register display property observers ..
    // TODO: Optimize into class setup
    // displayProperties = this.get('displayProperties');
    // for (var i = 0, l = displayProperties.length; i < l; i++) {
    //   this.addObserver(displayProperties[i], this, this.displayDidChange);
    // }
  },

  /**
    Wakes up the view. The default implementation immediately syncs any
    bindings, which may cause the view to need its display updated. You
    can override this method to perform any additional setup. Be sure to
    call sc_super to setup bindings and to call awake on childViews.

    It is best to awake a view before you add it to the DOM.  This way when
    the DOM is generated, it will have the correct initial values and will
    not require any additional setup.

    @returns {void}
  */
  awake: function () {
    sc_super();
    var childViews = this.get('childViews'), len = childViews.length, idx;
    for (idx = 0; idx < len; ++idx) {
      if (!childViews[idx]) { continue; }
      childViews[idx].awake();
    }
  },

  /**
    Frame describes the current bounding rect for your view.  This is always
    measured from the top-left corner of the parent view.

    @type Rect
    @test in layoutStyle
  */
  frame: function () {
    return this.computeFrameWithParentFrame(null);
  }.property('useStaticLayout').cacheable(),    // We depend on the layout, but layoutDidChange will call viewDidResize to check the frame for us

  /**
    Computes the frame of the view by examining the view's DOM representation.
    If no representation exists, returns null.

    If the view has a parent view, the parent's bounds will be taken into account when
    calculating the frame.

    @returns {Rect} the computed frame
  */
  computeFrameWithParentFrame: function () {
    var layer,                            // The view's layer
        pv = this.get('parentView'),      // The view's parent view (if it exists)
        f;                                // The layer's coordinates in the document

    // need layer to be able to compute rect
    if (layer = this.get('layer')) {
      f = SC.offset(layer); // x,y
      if (pv) { f = pv.convertFrameFromView(f, null); }

      /*
        TODO Can probably have some better width/height values - CC
        FIXME This will probably not work right with borders - PW
      */
      f.width = layer.offsetWidth;
      f.height = layer.offsetHeight;
      return f;
    }

    // Unable to compute yet
    if (this.get('hasLayout')) {
      return null;
    } else {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  },

  /**
    The clipping frame returns the visible portion of the view, taking into
    account the clippingFrame of the parent view.  Keep in mind that
    the clippingFrame is in the context of the view itself, not it's parent
    view.

    Normally this will be calculated based on the intersection of your own
    clippingFrame and your parentView's clippingFrame.

    @type Rect
  */
  clippingFrame: function () {
    var f = this.get('frame'),
        ret = f,
        pv, cf;

    if (!f) return null;
    pv = this.get('parentView');
    if (pv) {
      cf = pv.get('clippingFrame');
      if (!cf) return { x: 0, y: 0, width: f.width, height: f.height};
      ret = SC.intersectRects(cf, f);
    }
    ret.x -= f.x;
    ret.y -= f.y;

    return ret;
  }.property('parentView', 'frame').cacheable(),

  /** @private
    This method is invoked whenever the clippingFrame changes, notifying
    each child view that its clippingFrame has also changed.
  */
  _sc_view_clippingFrameDidChange: function () {
    var cvs = this.get('childViews'), len = cvs.length, idx, cv;
    for (idx = 0; idx < len; ++idx) {
      cv = cvs[idx];

      cv.notifyPropertyChange('clippingFrame');
      cv._sc_view_clippingFrameDidChange();
    }
  },

  /**
    Removes the child view from the parent view *and* detaches it from the DOM.
    This does *not* remove the child view's layer (i.e. the node still exists,
    but is no longer in the DOM) and does *not* destroy the child view (i.e.
    it can still be re-used).

    Note that if the child view uses a transitionOut plugin, it will not be
    fully detached until the transition completes.  To force the view to detach
    immediately you can pass true for the optional `immediately` argument.

    If you wish to remove the child and discard it, use `removeChildAndDestroy`.

    @param {SC.View} view The view to remove as a child view.
    @param {Boolean} [immediately=false] Forces the child view to be removed immediately regardless if it uses a transitionOut plugin.
    @see SC.View#removeChildAndDestroy
    @returns {SC.View} receiver
  */
  removeChild: function (view, immediately) {
    view._doDetach(immediately);
    view._doOrphan();

    return this;
  },

  /**
    Removes the child view from the parent view, detaches it from the DOM *and*
    destroys the view and its layer.

    Note that if the child view uses a transitionOut plugin, it will not be
    fully detached and destroyed until the transition completes.  To force the
    view to detach immediately you can pass true for the optional `immediately`
    argument.

    If you wish to remove the child and keep it for further re-use, use
    `removeChild`.

    @param {SC.View} view The view to remove as a child view and destroy.
    @param {Boolean} [immediately=false] Forces the child view to be removed and destroyed immediately regardless if it uses a transitionOut plugin.
    @see SC.View#removeChild
    @returns {SC.View} receiver
  */
  removeChildAndDestroy: function (view, immediately) {
    view._doDetach(immediately);

    // If the view will transition out, wait for the transition to complete
    // before destroying the view entirely.
    if (view.get('transitionOut') && !immediately) {
      view.addObserver('_state', this, this._destroyChildView);
    } else {
      view._destroy(); // Destroys the layer and the view.
    }

    return this;
  },

  /**
    Removes all children from the parentView *and* destroys them and their
    layers.

    Note that if any child view uses a transitionOut plugin, it will not be
    fully removed until the transition completes.  To force all child views to
    remove immediately you can pass true as the optional `immediately` argument.

    Tip: If you know that there are no transitions for the child views,
    you should pass true to optimize the document removal.

    @param {Boolean} [immediately=false] Forces all child views to be removed immediately regardless if any uses a transitionOut plugin.
    @returns {SC.View} receiver
  */
  removeAllChildren: function (immediately) {
    var childViews = this.get('childViews');

    // OPTIMIZATION!
    // If we know that we're removing all children and we are rendered, lets do the document cleanup in one sweep.
    if (immediately && this.get('isRendered')) {
      var layer,
        parentNode;

      // If attached, detach and track our parent node so we can re-attach.
      if (this.get('isAttached')) {
        layer = this.get('layer');
        parentNode = layer.parentNode;

        this._doDetach();
      }

      // Destroy our layer and thus all the children's layers in one move.
      this.destroyLayer();

      // Remove all the children.
      for (var i = childViews.get('length') - 1; i >= 0; i--) {
        this.removeChildAndDestroy(childViews.objectAt(i), immediately);
      }

      // Recreate our layer (now empty).
      this.createLayer();

      // Reattach our layer.
      if (parentNode) { this._doAttach(parentNode); }
    } else {
      for (var i = childViews.get('length') - 1; i >= 0; i--) {
        this.removeChildAndDestroy(childViews.objectAt(i), immediately);
      }
    }

    return this;
  },

  /**
    Removes the view from its parentView, if one is found.  Otherwise
    does nothing.

    @returns {SC.View} receiver
  */
  removeFromParent: function () {
    var parent = this.get('parentView');
    if (parent) { parent.removeChild(this); }

    return this;
  },

  /** @private Observer for child views that are being discarded after transitioning out. */
  _destroyChildView: function (view) {
    var state = view.get('_state');

    // Commence destroying of the view once it is detached.
    if (!view.get('isAttached')) {
      view.destroy();
    }
  },

  /**
    Completely destroys a view instance so that it may be garbage collected.

    You must call this method on a view to destroy the view (and all of its
    child views). This will remove the view from any parent, detach the
    view's layer from the DOM if it is attached and clear the view's layer
    if it is rendered.

    Once a view is destroyed it can *not* be reused.

    @returns {SC.View} receiver
  */
  destroy: function () {
    // Fast path!
    if (this.get('isDestroyed')) { return this; }

    // Do generic destroy. It takes care of mixins and sets isDestroyed to YES.
    // Do this first, since it cleans up bindings that may apply to parentView
    // (which we will soon null out).
    var ret = sc_super();

    this._destroy();

    return ret;
  },

  /** @private */
  _destroy: function () {
    // Orphan the view if adopted.
    this._doOrphan();

    // Remove the layer if attached (ignores transitionOut).
    this._doDetach(true);

    // Destroy the layer if rendered. This will avoid each child view destroying
    // the layer over and over again.
    this._doDestroyLayer();

    // first destroy any children.
    var childViews = this.get('childViews'), len = childViews.length, idx;
    if (len) {
      childViews = childViews.slice();
      for (idx = 0; idx < len; ++idx) { childViews[idx].destroy(); }
    }

    // next remove view from global hash
    delete SC.View.views[this.get('layerId')];
    delete this._CQ;
    delete this.page;

    // clear owner.
    // TODO: Deprecate owner in this sense.
    this.set('owner', null);

    return this;
  },

  /**
    This method is called when your view is first created to setup any  child
    views that are already defined on your class.  If any are found, it will
    instantiate them for you.

    The default implementation of this method simply steps through your
    childViews array, which is expects to either be empty or to contain View
    designs that can be instantiated

    Alternatively, you can implement this method yourself in your own
    subclasses to look for views defined on specific properties and then build
     a childViews array yourself.

    Note that when you implement this method yourself, you should never
    instantiate views directly.  Instead, you should use
    this.createChildView() method instead.  This method can be much faster in
    a production environment than creating views yourself.

    @returns {SC.View} receiver
  */
  createChildViews: function () {
    var childViews = this.get('childViews'),
        len        = childViews.length,
        isNoLongerValid = false,
        idx, key, view;

    this.beginPropertyChanges();

    // swap the array
    for (idx = 0; idx < len; ++idx) {
      key = view = childViews[idx];

      // is this is a key name, lookup view class
      if (typeof key === SC.T_STRING) {
        view = this[key];
      } else {
        key = null;
      }

      if (!view) {
        //@if (debug)
        SC.warn("Developer Warning: The child view named '%@' was not found in the view, %@.  This child view will be ignored.".fmt(key, this));
        //@endif

        // skip this one.
        isNoLongerValid = true;
        childViews[idx] = null;
        continue;
      }

      // createChildView creates the view if necessary, but also sets
      // important properties, such as parentView
      view = this.createChildView(view);
      if (key) { this[key] = view; } // save on key name if passed

      childViews[idx] = view;
    }

    // Set childViews to be only the valid array.
    if (isNoLongerValid) { this.set('childViews', childViews.compact()); }

    this.endPropertyChanges();
    return this;
  },

  /**
    Instantiates a view to be added to the childViews array during view
    initialization. You generally will not call this method directly unless
    you are overriding createChildViews(). Note that this method will
    automatically configure the correct settings on the new view instance to
    act as a child of the parent.

    @param {Class} viewClass
    @param {Hash} attrs optional attributes to add
    @returns {SC.View} new instance
    @test in createChildViews
  */
  createChildView: function (view, attrs) {
    if (!view.isClass) {
      attrs = view;
    } else {
      // attrs should always exist...
      if (!attrs) { attrs = {}; }
      // clone the hash that was given so we do not pollute it if it's being reused
      else { attrs = SC.clone(attrs); }
    }

    attrs.owner = attrs.parentView = this;

    // We need to set isVisibleInWindow before the init method is called on the view
    // The prototype check is a bit hackish and should be revisited - PDW
    // if (view.isClass && view.prototype.hasVisibility) {
    //   attrs.isVisibleInWindow = this.get('isVisibleInWindow');
    // }

    if (!attrs.page) { attrs.page = this.page; }

    // Now add this to the attributes and create.
    if (view.isClass) { view = view.create(attrs); }

    return view;
  },

  /** walk like a duck */
  isView: YES,

  /**
    Default method called when a selectstart event is triggered. This event is
    only supported by IE. Used in sproutcore to disable text selection and
    IE8 accelerators. The accelerators will be enabled only in
    text selectable views. In FF and Safari we use the css style 'allow-select'.

    If you want to enable text selection in certain controls is recommended
    to override this function to always return YES , instead of setting
    isTextSelectable to true.

    For example in textfield you do not want to enable textSelection on the text
    hint only on the actual text you are entering. You can achieve that by
    only overriding this method.

    @param evt {SC.Event} the selectstart event
    @returns YES if selectable
  */
  selectStart: function (evt) {
    return this.get('isTextSelectable');
  },

  /**
    Used to block the contextMenu per view.

    @param evt {SC.Event} the contextmenu event
    @returns YES if the contextmenu will be allowed to show up
  */
  contextMenu: function (evt) {
    if (this.get('isContextMenuEnabled')) {
      evt.allowDefault();
      return YES;
    }
  }

});

SC.CoreView.mixin(/** @scope SC.CoreView.prototype */ {

  /** @private walk like a duck -- used by SC.Page */
  isViewClass: YES,

  /**
    This method works just like extend() except that it will also preserve
    the passed attributes in case you want to use a view builder later, if
    needed.

    @param {Hash} attrs Attributes to add to view
    @returns {Class} SC.View subclass to create
    @function
  */
  design: function () {
    if (this.isDesign) {
      // @if (debug)
      SC.Logger.warn("Developer Warning: .design() was called twice for %@.".fmt(this));
      // @endif
      return this;
    }

    var ret = this.extend.apply(this, arguments);
    ret.isDesign = YES;
    if (SC.ViewDesigner) {
      SC.ViewDesigner.didLoadDesign(ret, this, SC.A(arguments));
    }
    return ret;
  },

  extend: function () {
    var last = arguments[arguments.length - 1];

    if (last && !SC.none(last.theme)) {
      last.themeName = last.theme;
      delete last.theme;
    }

    return SC.Object.extend.apply(this, arguments);
  },

  /**
    Helper applies the layout to the prototype.
  */
  layout: function (layout) {
    this.prototype.layout = layout;
    return this;
  },

  /**
    Helper applies the classNames to the prototype
  */
  classNames: function (sc) {
    sc = (this.prototype.classNames || []).concat(sc);
    this.prototype.classNames = sc;
    return this;
  },

  /**
    Help applies the tagName
  */
  tagName: function (tg) {
    this.prototype.tagName = tg;
    return this;
  },

  /**
    Helper adds the childView
  */
  childView: function (cv) {
    var childViews = this.prototype.childViews || [];
    if (childViews === this.superclass.prototype.childViews) {
      childViews = childViews.slice();
    }
    childViews.push(cv);
    this.prototype.childViews = childViews;
    return this;
  },

  /**
    Helper adds a binding to a design
  */
  bind: function (keyName, path) {
    var p = this.prototype, s = this.superclass.prototype;
    var bindings = p._bindings;
    if (!bindings || bindings === s._bindings) {
      bindings = p._bindings = (bindings || []).slice();
    }

    keyName = keyName + "Binding";
    p[keyName] = path;
    bindings.push(keyName);

    return this;
  },

  /**
    Helper sets a generic property on a design.
  */
  prop: function (keyName, value) {
    this.prototype[keyName] = value;
    return this;
  },

  /**
    Used to construct a localization for a view.  The default implementation
    will simply return the passed attributes.
  */
  localization: function (attrs, rootElement) {
    // add rootElement
    if (rootElement) attrs.rootElement = SC.$(rootElement)[0];
    return attrs;
  },

  /**
    Creates a view instance, first finding the DOM element you name and then
    using that as the root element.  You should not use this method very
    often, but it is sometimes useful if you want to attach to already
    existing HTML.

    @param {String|Element} element
    @param {Hash} attrs
    @returns {SC.View} instance
  */
  viewFor: function (element, attrs) {
    var args = SC.$A(arguments); // prepare to edit
    if (SC.none(element)) {
      args.shift(); // remove if no element passed
    } else args[0] = { rootElement: SC.$(element)[0] };
    var ret = this.create.apply(this, arguments);
    args = args[0] = null;
    return ret;
  },

  /**
    Create a new view with the passed attributes hash.  If you have the
    Designer module loaded, this will also create a peer designer if needed.
  */
  create: function () {
    var last = arguments[arguments.length - 1];

    if (last && last.theme) {
      last.themeName = last.theme;
      delete last.theme;
    }

    var C = this, ret = new C(arguments);
    if (SC.ViewDesigner) {
      SC.ViewDesigner.didCreateView(ret, SC.$A(arguments));
    }
    return ret;
  },

  /**
    Applies the passed localization hash to the component views.  Call this
    method before you call create().  Returns the receiver.  Typically you
    will do something like this:

    view = SC.View.design({...}).loc(localizationHash).create();

    @param {Hash} loc
    @param rootElement {String} optional rootElement with prepped HTML
    @returns {SC.View} receiver
  */
  loc: function (loc) {
    var childLocs = loc.childViews;
    delete loc.childViews; // clear out child views before applying to attrs

    this.applyLocalizedAttributes(loc);
    if (SC.ViewDesigner) {
      SC.ViewDesigner.didLoadLocalization(this, SC.$A(arguments));
    }

    // apply localization recursively to childViews
    var childViews = this.prototype.childViews, idx = childViews.length,
      viewClass;
    while (--idx >= 0) {
      viewClass = childViews[idx];
      loc = childLocs[idx];
      if (loc && viewClass && typeof viewClass === SC.T_STRING) SC.String.loc(viewClass, loc);
    }

    return this; // done!
  },

  /**
    Internal method actually updates the localized attributes on the view
    class.  This is overloaded in design mode to also save the attributes.
  */
  applyLocalizedAttributes: function (loc) {
    SC.mixin(this.prototype, loc);
  },

  views: {}

});

// .......................................................
// OUTLET BUILDER
//

/**
  Generates a computed property that will look up the passed property path
  the first time you try to get the value.  Use this whenever you want to
  define an outlet that points to another view or object.  The root object
  used for the path will be the receiver.
*/
SC.outlet = function (path, root) {
  return function (key) {
    return (this[key] = SC.objectForPropertyPath(path, (root !== undefined) ? root : this));
  }.property();
};

/** @private on unload clear cached divs. */
SC.CoreView.unload = function () {
  // delete view items this way to ensure the views are cleared.  The hash
  // itself may be owned by multiple view subclasses.
  var views = SC.View.views;
  if (views) {
    for (var key in views) {
      if (!views.hasOwnProperty(key)) continue;
      delete views[key];
    }
  }
};

/**
  @class

  Base class for managing a view.  Views provide two functions:

   1. They translate state and events into drawing instructions for the
     web browser and
   2. They act as first responders for incoming keyboard, mouse, and
     touch events.

  View Initialization
  ====

  When a view is setup, there are several methods you can override that
  will be called at different times depending on how your view is created.
  Here is a guide to which method you want to override and when:

   - `init` -- override this method for any general object setup (such as
     observers, starting timers and animations, etc) that you need to happen
     every time the view is created, regardless of whether or not its layer
     exists yet.
   - `render` -- override this method to generate or update your HTML to reflect
     the current state of your view.  This method is called both when your view
     is first created and later anytime it needs to be updated.
   - `didCreateLayer` -- the render() method is used to generate new HTML.
     Override this method to perform any additional setup on the DOM you might
     need to do after creating the view.  For example, if you need to listen
     for events.
   - `willDestroyLayer` -- if you implement didCreateLayer() to setup event
     listeners, you should implement this method as well to remove the same
     just before the DOM for your view is destroyed.
   - `updateLayer` -- Normally, when a view needs to update its content, it will
     re-render the view using the render() method.  If you would like to
     override this behavior with your own custom updating code, you can
     replace updateLayer() with your own implementation instead.
   - `didAppendToDocument` -- in theory all DOM setup could be done
     in didCreateLayer() as you already have a DOM element instantiated.
     However there is cases where the element has to be first appended to the
     Document because there is either a bug on the browser or you are using
     plugins which objects are not instantiated until you actually append the
     element to the DOM. This will allow you to do things like registering
     DOM events on flash or quicktime objects.

  @extends SC.Responder
  @extends SC.DelegateSupport
  @since SproutCore 1.0

*/
SC.View = SC.CoreView.extend(/** @scope SC.View.prototype */{
  classNames: ['sc-view'],

  displayProperties: ['isFirstResponder']
});

//unload views for IE, trying to collect memory.
if (SC.browser.isIE) SC.Event.add(window, 'unload', SC.View, SC.View.unload);


