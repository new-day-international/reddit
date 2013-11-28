/*
Two js files from textext are included here, textext.core.js and textext.plugin.autocomplete.js. (http://textextjs.com/)
Followed by the atwho.js library.
Our own code is at the bottom
*/

/*
textext.core.js contents:
*/

/**
 * jQuery TextExt Plugin
 * http://textextjs.com
 *
 * @version 1.3.1
 * @copyright Copyright (C) 2011 Alex Gorbatchev. All rights reserved.
 * @license MIT License
 */
(function($, undefined)
{
	/**
	 * TextExt is the main core class which by itself doesn't provide any functionality
	 * that is user facing, however it has the underlying mechanics to bring all the
	 * plugins together under one roof and make them work with each other or on their
	 * own.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt
	 */
	function TextExt() {};

	/**
	 * ItemManager is used to seamlessly convert between string that come from the user input to whatever 
	 * the format the item data is being passed around in. It's used by all plugins that in one way or 
	 * another operate with items, such as Tags, Filter, Autocomplete and Suggestions. Default implementation 
	 * works with `String` type. 
	 *
	 * Each instance of `TextExt` creates a new instance of default implementation of `ItemManager`
	 * unless `itemManager` option was set to another implementation.
	 *
	 * To satisfy requirements of managing items of type other than a `String`, different implementation
	 * if `ItemManager` should be supplied.
	 *
	 * If you wish to bring your own implementation, you need to create a new class and implement all the 
	 * methods that `ItemManager` has. After, you need to supply your pass via the `itemManager` option during
	 * initialization like so:
	 *
	 *     $('#input').textext({
	 *         itemManager : CustomItemManager
	 *     })
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager
	 */
	function ItemManager() {};

	/**
	 * TextExtPlugin is a base class for all plugins. It provides common methods which are reused
	 * by majority of plugins.
	 *
	 * All plugins must register themselves by calling the `$.fn.textext.addPlugin(name, constructor)`
	 * function while providing plugin name and constructor. The plugin name is the same name that user
	 * will identify the plugin in the `plugins` option when initializing TextExt component and constructor
	 * function will create a new instance of the plugin. *Without registering, the core won't
	 * be able to see the plugin.*
	 *
	 * <span class="new label version">new in 1.2.0</span> You can get instance of each plugin from the core 
	 * via associated function with the same name as the plugin. For example:
	 *
	 *     $('#input').textext()[0].tags()
	 *     $('#input').textext()[0].autocomplete()
	 *     ...
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin
	 */
	function TextExtPlugin() {};

	var stringify = (JSON || {}).stringify,
		slice     = Array.prototype.slice,
		p,
		UNDEFINED = 'undefined',

		/**
		 * TextExt provides a way to pass in the options to configure the core as well as
		 * each plugin that is being currently used. The jQuery exposed plugin `$().textext()` 
		 * function takes a hash object with key/value set of options. For example:
		 *
		 *     $('textarea').textext({
		 *         enabled: true
		 *     })
		 *
		 * There are multiple ways of passing in the options:
		 *
		 * 1. Options could be nested multiple levels deep and accessed using all lowercased, dot
		 * separated style, eg `foo.bar.world`. The manual is using this style for clarity and
		 * consistency. For example:
		 *
		 *        {
		 *            item: {
		 *                manager: ...
		 *            },
		 *
		 *            html: {
		 *                wrap: ...
		 *            },
		 *
		 *            autocomplete: {
		 *                enabled: ...,
		 *                dropdown: {
		 *                   position: ...
		 *                }
		 *            }
		 *        }
		 *
		 * 2. Options could be specified using camel cased names in a flat key/value fashion like so:
		 *
		 *        {
		 *            itemManager: ...,
		 *            htmlWrap: ...,
		 *            autocompleteEnabled: ...,
		 *            autocompleteDropdownPosition: ...
		 *        }
		 *
		 * 3. Finally, options could be specified in mixed style. It's important to understand that
		 * for each dot separated name, its alternative in camel case is also checked for, eg for 
		 * `foo.bar.world` it's alternatives could be `fooBarWorld`, `foo.barWorld` or `fooBar.world`, 
		 * which translates to `{ foo: { bar: { world: ... } } }`, `{ fooBarWorld: ... }`, 
		 * `{ foo : { barWorld : ... } }` or `{ fooBar: { world: ... } }` respectively. For example:
		 *
		 *        {
		 *            itemManager : ...,
		 *            htmlWrap: ...,
		 *            autocomplete: {
		 *                enabled: ...,
		 *                dropdownPosition: ...
		 *            }
		 *        }
		 *
		 * Mixed case is used through out the code, wherever it seems appropriate. However in the code, all option
		 * names are specified in the dot notation because it works both ways where as camel case is not
		 * being converted to its alternative dot notation.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExt.options
		 */

		/**
		 * Default instance of `ItemManager` which takes `String` type as default for tags.
		 *
		 * @name item.manager
		 * @default ItemManager
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.item.manager
		 */
		OPT_ITEM_MANAGER = 'item.manager',
		
		/**
		 * List of plugins that should be used with the current instance of TextExt. The list could be
		 * specified as array of strings or as comma or space separated string.
		 *
		 * @name plugins
		 * @default []
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.plugins
		 */
		OPT_PLUGINS = 'plugins',
		
		/**
		 * TextExt allows for overriding of virtually any method that the core or any of its plugins
		 * use. This could be accomplished through the use of the `ext` option.
		 *
		 * It's possible to specifically target the core or any plugin, as well as overwrite all the
		 * desired methods everywhere.
		 *
		 * 1. Targeting the core:
		 *
		 *        ext: {
		 *            core: {
		 *                trigger: function()
		 *                {
		 *                    console.log('TextExt.trigger', arguments);
		 *                    $.fn.textext.TextExt.prototype.trigger.apply(this, arguments);
		 *                }
		 *            }
		 *        }
		 *
		 * 2. Targeting individual plugins:
		 *
		 *        ext: {
		 *            tags: {
		 *                addTags: function(tags)
		 *                {
		 *                    console.log('TextExtTags.addTags', tags);
		 *                    $.fn.textext.TextExtTags.prototype.addTags.apply(this, arguments);
		 *                }
		 *            }
		 *        }
		 *
		 * 3. Targeting `ItemManager` instance:
		 *
		 *        ext: {
		 *            itemManager: {
		 *                stringToItem: function(str)
		 *                {
		 *                    console.log('ItemManager.stringToItem', str);
		 *                    return $.fn.textext.ItemManager.prototype.stringToItem.apply(this, arguments);
		 *                }
		 *            }
		 *        }
		 *
		 * 4. And finally, in edge cases you can extend everything at once:
		 *
		 *        ext: {
		 *            '*': {
		 *                fooBar: function() {}
		 *            }
		 *        }
		 *
		 * @name ext
		 * @default {}
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.ext
		 */
		OPT_EXT = 'ext',
		
		/**
		 * HTML source that is used to generate elements necessary for the core and all other
		 * plugins to function.
		 *
		 * @name html.wrap
		 * @default '<div class="text-core"><div class="text-wrap"/></div>'
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.html.wrap
		 */
		OPT_HTML_WRAP = 'html.wrap',

		/**
		 * HTML source that is used to generate hidden input value of which will be submitted 
		 * with the HTML form.
		 *
		 * @name html.hidden
		 * @default '<input type="hidden" />'
		 * @author agorbatchev
		 * @date 2011/08/20
		 * @id TextExt.options.html.hidden
		 */
		OPT_HTML_HIDDEN = 'html.hidden',
		
		/**
		 * Hash table of key codes and key names for which special events will be created
		 * by the core. For each entry a `[name]KeyDown`, `[name]KeyUp` and `[name]KeyPress` events 
		 * will be triggered along side with `anyKeyUp` and `anyKeyDown` events for every 
		 * key stroke.
		 *
		 * Here's a list of default keys:
		 *
		 *     {
		 *         8   : 'backspace',
		 *         9   : 'tab',
		 *         13  : 'enter!',
		 *         27  : 'escape!',
		 *         37  : 'left',
		 *         38  : 'up!',
		 *         39  : 'right',
		 *         40  : 'down!',
		 *         46  : 'delete',
		 *         108 : 'numpadEnter'
		 *     }
		 *
		 * Please note the `!` at the end of some keys. This tells the core that by default
		 * this keypress will be trapped and not passed on to the text input.
		 *
		 * @name keys
		 * @default { ... }
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.options.keys
		 */
		OPT_KEYS = 'keys',

		/**
		 * The core triggers or reacts to the following events.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExt.events
		 */

		/**
		 * Core triggers `preInvalidate` event before the dimensions of padding on the text input
		 * are set.
		 *
		 * @name preInvalidate
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.preInvalidate
		 */
		EVENT_PRE_INVALIDATE = 'preInvalidate',

		/**
		 * Core triggers `postInvalidate` event after the dimensions of padding on the text input
		 * are set.
		 *
		 * @name postInvalidate
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.postInvalidate
		 */
		EVENT_POST_INVALIDATE = 'postInvalidate',
		
		/**
		 * Core triggers `getFormData` on every key press to collect data that will be populated
		 * into the hidden input that will be submitted with the HTML form and data that will
		 * be displayed in the input field that user is currently interacting with.
		 *
		 * All plugins that wish to affect how the data is presented or sent must react to 
		 * `getFormData` and populate the data in the following format:
		 *
		 *     {
		 *         input : {String},
		 *         form  : {Object}
		 *     }
		 *
		 * The data key must be a numeric weight which will be used to determine which data
		 * ends up being used. Data with the highest numerical weight gets the priority. This
		 * allows plugins to set the final data regardless of their initialization order, which
		 * otherwise would be impossible.
		 *
		 * For example, the Tags and Autocomplete plugins have to work side by side and Tags
		 * plugin must get priority on setting the data. Therefore the Tags plugin sets data
		 * with the weight 200 where as the Autocomplete plugin sets data with the weight 100.
		 *
		 * Here's an example of a typical `getFormData` handler:
		 * 
		 *     TextExtPlugin.prototype.onGetFormData = function(e, data, keyCode)
		 *     {
		 *         data[100] = self.formDataObject('input value', 'form value');
		 *     };
		 *
		 * Core also reacts to the `getFormData` and updates hidden input with data which will be
		 * submitted with the HTML form.
		 *
		 * @name getFormData
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.getFormData
		 */
		EVENT_GET_FORM_DATA = 'getFormData',

		/**
		 * Core triggers and reacts to the `setFormData` event to update the actual value in the
		 * hidden input that will be submitted with the HTML form. Second argument can be value
		 * of any type and by default it will be JSON serialized with `TextExt.serializeData()`
		 * function.
		 *
		 * @name setFormData
		 * @author agorbatchev
		 * @date 2011/08/22
		 * @id TextExt.events.setFormData
		 */
		EVENT_SET_FORM_DATA = 'setFormData',

		/**
		 * Core triggers and reacts to the `setInputData` event to update the actual value in the
		 * text input that user is interacting with. Second argument must be of a `String` type
		 * the value of which will be set into the text input.
		 *
		 * @name setInputData
		 * @author agorbatchev
		 * @date 2011/08/22
		 * @id TextExt.events.setInputData
		 */
		EVENT_SET_INPUT_DATA = 'setInputData',
		
		/**
		 * Core triggers `postInit` event to let plugins run code after all plugins have been 
		 * created and initialized. This is a good place to set some kind of global values before 
		 * somebody gets to use them. This is not the right place to expect all plugins to finish
		 * their initialization.
		 *
		 * @name postInit
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.postInit
		 */
		EVENT_POST_INIT = 'postInit',

		/**
		 * Core triggers `ready` event after all global configuration and prepearation has been
		 * done and the TextExt component is ready for use. Event handlers should expect all 
		 * values to be set and the plugins to be in the final state.
		 *
		 * @name ready
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.ready
		 */
		EVENT_READY = 'ready',

		/**
		 * Core triggers `anyKeyUp` event for every key up event triggered within the component.
		 *
		 * @name anyKeyUp
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.anyKeyUp
		 */

		/**
		 * Core triggers `anyKeyDown` event for every key down event triggered within the component.
		 *
		 * @name anyKeyDown
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.anyKeyDown
		 */

		/**
		 * Core triggers `[name]KeyUp` event for every key specifid in the `keys` option that is 
		 * triggered within the component.
		 *
		 * @name [name]KeyUp
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.[name]KeyUp
		 */

		/**
		 * Core triggers `[name]KeyDown` event for every key specified in the `keys` option that is 
		 * triggered within the component.
		 *
		 * @name [name]KeyDown
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.[name]KeyDown
		 */

		/**
		 * Core triggers `[name]KeyPress` event for every key specified in the `keys` option that is 
		 * triggered within the component.
		 *
		 * @name [name]KeyPress
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExt.events.[name]KeyPress
		 */

		DEFAULT_OPTS = {
			itemManager : ItemManager,

			plugins : [],
			ext : {},

			html : {
				wrap   : '<div class="text-core"><div class="text-wrap"/></div>',
				hidden : '<input type="hidden" />'
			},

			keys : {
				8   : 'backspace',
				9   : 'tab',
				13  : 'enter!',
				27  : 'escape!',
				37  : 'left',
				38  : 'up!',
				39  : 'right',
				40  : 'down!',
				46  : 'delete',
				108 : 'numpadEnter'
			}
		}
		;

	// Freak out if there's no JSON.stringify function found
	if(!stringify)
		throw new Error('JSON.stringify() not found');

	/**
	 * Returns object property by name where name is dot-separated and object is multiple levels deep.
	 * @param target Object Source object.
	 * @param name String Dot separated property name, ie `foo.bar.world`
	 * @id core.getProperty
	 */
	function getProperty(source, name)
	{
		if(typeof(name) === 'string')
			name = name.split('.');

		var fullCamelCaseName = name.join('.').replace(/\.(\w)/g, function(match, letter) { return letter.toUpperCase() }),
			nestedName        = name.shift(),
			result
			;

		if(typeof(result = source[fullCamelCaseName]) != UNDEFINED)
			result = result;

		else if(typeof(result = source[nestedName]) != UNDEFINED && name.length > 0)
			result = getProperty(result, name);

		// name.length here should be zero
		return result;
	};

	/**
	 * Hooks up specified events in the scope of the current object.
	 * @author agorbatchev
	 * @date 2011/08/09
	 */
	function hookupEvents()
	{
		var args   = slice.apply(arguments),
			self   = this,
			target = args.length === 1 ? self : args.shift(),
			event
			;

		args = args[0] || {};

		function bind(event, handler)
		{
			target.bind(event, function()
			{
				// apply handler to our PLUGIN object, not the target
				return handler.apply(self, arguments);
			});
		}

		for(event in args)
			bind(event, args[event]);
	};

	function formDataObject(input, form)
	{
		return { 'input' : input, 'form' : form };
	};

	//--------------------------------------------------------------------------------
	// ItemManager core component
	
	p = ItemManager.prototype;

	/**
	 * Initialization method called by the core during instantiation.
	 *
	 * @signature ItemManager.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.init
	 */
	p.init = function(core)
	{
	};

	/**
	 * Filters out items from the list that don't match the query and returns remaining items. Default 
	 * implementation checks if the item starts with the query.
	 *
	 * @signature ItemManager.filter(list, query)
	 *
	 * @param list {Array} List of items. Default implementation works with strings.
	 * @param query {String} Query string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.filter
	 */
	p.filter = function(list, query)
	{
		var result = [],
			i, item
			;

		for(i = 0; i < list.length; i++)
		{
			item = list[i];
			if(this.itemContains(item, query))
				result.push(item);
		}

		return result;
	};

	/**
	 * Returns `true` if specified item contains another string, `false` otherwise. In the default implementation 
	 * `String.indexOf()` is used to check if item string begins with the needle string.
	 *
	 * @signature ItemManager.itemContains(item, needle)
	 *
	 * @param item {Object} Item to check. Default implementation works with strings.
	 * @param needle {String} Search string to be found within the item.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.itemContains
	 */
	p.itemContains = function(item, needle)
	{
		return this.itemToString(item).toLowerCase().indexOf(needle.toLowerCase()) == 0;
	};

	/**
	 * Converts specified string to item. Because default implemenation works with string, input string
	 * is simply returned back. To use custom objects, different implementation of this method could
	 * return something like `{ name : {String} }`.
	 *
	 * @signature ItemManager.stringToItem(str)
	 *
	 * @param str {String} Input string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.stringToItem
	 */
	p.stringToItem = function(str)
	{
		return str;
	};

	/**
	 * Converts specified item to string. Because default implemenation works with string, input string
	 * is simply returned back. To use custom objects, different implementation of this method could
	 * for example return `name` field of `{ name : {String} }`.
	 *
	 * @signature ItemManager.itemToString(item)
	 *
	 * @param item {Object} Input item to be converted to string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.itemToString
	 */
	p.itemToString = function(item)
	{
		return item;
	};

	/**
	 * Returns `true` if both items are equal, `false` otherwise. Because default implemenation works with 
	 * string, input items are compared as strings. To use custom objects, different implementation of this 
	 * method could for example compare `name` fields of `{ name : {String} }` type object.
	 *
	 * @signature ItemManager.compareItems(item1, item2)
	 *
	 * @param item1 {Object} First item.
	 * @param item2 {Object} Second item.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id ItemManager.compareItems
	 */
	p.compareItems = function(item1, item2)
	{
		return item1 == item2;
	};

	//--------------------------------------------------------------------------------
	// TextExt core component

	p = TextExt.prototype;
		
	/**
	 * Initializes current component instance with work with the supplied text input and options.
	 *
	 * @signature TextExt.init(input, opts)
	 *
	 * @param input {HTMLElement} Text input.
	 * @param opts {Object} Options.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.init
	 */
	p.init = function(input, opts)
	{
		var self = this,
			hiddenInput,
			itemManager,
			container
			;

		self._defaults    = $.extend({}, DEFAULT_OPTS);
		self._opts        = opts || {};
		self._plugins     = {};
		self._itemManager = itemManager = new (self.opts(OPT_ITEM_MANAGER))();
		input             = $(input);
		container         = $(self.opts(OPT_HTML_WRAP));
		hiddenInput       = $(self.opts(OPT_HTML_HIDDEN));

		input
			.wrap(container)
			.keydown(function(e) { return self.onKeyDown(e) })
			.keyup(function(e) { return self.onKeyUp(e) })
			.data('textext', self)
			;

		// keep references to html elements using jQuery.data() to avoid circular references
		$(self).data({
			'hiddenInput'   : hiddenInput,
			'wrapElement' : input.parents('.text-wrap').first(),
			'input'         : input
		});

		// set the name of the hidden input to the text input's name
		hiddenInput.attr('name', input.attr('name'));
		// remove name attribute from the text input
		input.attr('name', null);
		// add hidden input to the DOM
		hiddenInput.insertAfter(input);

		$.extend(true, itemManager, self.opts(OPT_EXT + '.item.manager'));
		$.extend(true, self, self.opts(OPT_EXT + '.*'), self.opts(OPT_EXT + '.core'));
		
		self.originalWidth = input.outerWidth();

		self.invalidateBounds();

		itemManager.init(self);

		self.initPatches();
		self.initPlugins(self.opts(OPT_PLUGINS), $.fn.textext.plugins);

		self.on({
			setFormData  : self.onSetFormData,
			getFormData  : self.onGetFormData,
			setInputData : self.onSetInputData,
			anyKeyUp     : self.onAnyKeyUp
		});

		self.trigger(EVENT_POST_INIT);
		self.trigger(EVENT_READY);

		self.getFormData(0);
	};

	/**
	 * Initialized all installed patches against current instance. The patches are initialized based on their
	 * initialization priority which is returned by each patch's `initPriority()` method. Priority
	 * is a `Number` where patches with higher value gets their `init()` method called before patches
	 * with lower priority value.
	 *
	 * This facilitates initializing of patches in certain order to insure proper dependencies
	 * regardless of which order they are loaded.
	 *
	 * By default all patches have the same priority - zero, which means they will be initialized
	 * in rorder they are loaded, that is unless `initPriority()` is overriden.
	 *
	 * @signature TextExt.initPatches()
	 *
	 * @author agorbatchev
	 * @date 2011/10/11
	 * @id TextExt.initPatches
	 */
	p.initPatches = function()
	{
		var list   = [],
			source = $.fn.textext.patches,
			name
			;

		for(name in source)
			list.push(name);

		this.initPlugins(list, source);
	};

	/**
	 * Creates and initializes all specified plugins. The plugins are initialized based on their
	 * initialization priority which is returned by each plugin's `initPriority()` method. Priority
	 * is a `Number` where plugins with higher value gets their `init()` method called before plugins
	 * with lower priority value.
	 *
	 * This facilitates initializing of plugins in certain order to insure proper dependencies
	 * regardless of which order user enters them in the `plugins` option field.
	 *
	 * By default all plugins have the same priority - zero, which means they will be initialized
	 * in the same order as entered by the user.
	 *
	 * @signature TextExt.initPlugins(plugins)
	 *
	 * @param plugins {Array} List of plugin names to initialize.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.initPlugins
	 */
	p.initPlugins = function(plugins, source)
	{
		var self = this,
			ext, name, plugin, initList = [], i
			;

		if(typeof(plugins) == 'string')
			plugins = plugins.split(/\s*,\s*|\s+/g);

		for(i = 0; i < plugins.length; i++)
		{
			name   = plugins[i];
			plugin = source[name];

			if(plugin)
			{
				self._plugins[name] = plugin = new plugin();
				self[name] = (function(plugin) { 
				  return function(){ return plugin; } 
				})(plugin);
				initList.push(plugin);
				$.extend(true, plugin, self.opts(OPT_EXT + '.*'), self.opts(OPT_EXT + '.' + name));
			}
		}

		// sort plugins based on their priority values
		initList.sort(function(p1, p2)
		{
			p1 = p1.initPriority();
			p2 = p2.initPriority();

			return p1 === p2
				? 0
				: p1 < p2 ? 1 : -1
				;
		});

		for(i = 0; i < initList.length; i++)
			initList[i].init(self);
	};

	/**
	 * Returns true if specified plugin is was instantiated for the current instance of core.
	 *
	 * @signature TextExt.hasPlugin(name)
	 *
	 * @param name {String} Name of the plugin to check.
	 *
	 * @author agorbatchev
	 * @date 2011/12/28
	 * @id TextExt.hasPlugin
	 * @version 1.1
	 */
	p.hasPlugin = function(name)
	{
		return !!this._plugins[name];
	};

	/**
	 * Allows to add multiple event handlers which will be execued in the scope of the current object.
	 * 
	 * @signature TextExt.on([target], handlers)
	 *
	 * @param target {Object} **Optional**. Target object which has traditional `bind(event, handler)` method.
	 *                        Handler function will still be executed in the current object's scope.
	 * @param handlers {Object} Key/value pairs of event names and handlers, eg `{ event: handler }`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.on
	 */
	p.on = hookupEvents;

	/**
	 * Binds an event handler to the input box that user interacts with.
	 *
	 * @signature TextExt.bind(event, handler)
	 *
	 * @param event {String} Event name.
	 * @param handler {Function} Event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.bind
	 */
	p.bind = function(event, handler)
	{
		this.input().bind(event, handler);
	};

	/**
	 * Triggers an event on the input box that user interacts with. All core events are originated here.
	 * 
	 * @signature TextExt.trigger(event, ...args)
	 *
	 * @param event {String} Name of the event to trigger.
	 * @param ...args All remaining arguments will be passed to the event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.trigger
	 */
	p.trigger = function()
	{
		var args = arguments;
		this.input().trigger(args[0], slice.call(args, 1));
	};

	/**
	 * Returns instance of `itemManager` that is used by the component.
	 *
	 * @signature TextExt.itemManager()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.itemManager
	 */
	p.itemManager = function()
	{
		return this._itemManager;
	};

	/**
	 * Returns jQuery input element with which user is interacting with.
	 *
	 * @signature TextExt.input()
	 *
	 * @author agorbatchev
	 * @date 2011/08/10
	 * @id TextExt.input
	 */
	p.input = function()
	{
		return $(this).data('input');
	};

	/**
	 * Returns option value for the specified option by name. If the value isn't found in the user
	 * provided options, it will try looking for default value.
	 *
	 * @signature TextExt.opts(name)
	 *
	 * @param name {String} Option name as described in the options.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.opts
	 */
	p.opts = function(name)
	{
		var result = getProperty(this._opts, name);
		return typeof(result) == 'undefined' ? getProperty(this._defaults, name) : result;
	};

	/**
	 * Returns HTML element that was created from the `html.wrap` option. This is the top level HTML
	 * container for the text input with which user is interacting with.
	 *
	 * @signature TextExt.wrapElement()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.wrapElement
	 */
	p.wrapElement = function()
	{
		return $(this).data('wrapElement');
	};

	/**
	 * Updates container to match dimensions of the text input. Triggers `preInvalidate` and `postInvalidate`
	 * events.
	 *
	 * @signature TextExt.invalidateBounds()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.invalidateBounds
	 */
	p.invalidateBounds = function()
	{
		var self      = this,
			input     = self.input(),
			wrap      = self.wrapElement(),
			container = wrap.parent(),
			width     = self.originalWidth + 'px',
			height
			;

		self.trigger(EVENT_PRE_INVALIDATE);

		height = input.outerHeight() + 'px';

		// using css() method instead of width() and height() here because they don't seem to do the right thing in jQuery 1.8.x
		// https://github.com/alexgorbatchev/jquery-textext/issues/74
		input.css({ 'width' : width });
		wrap.css({ 'width' : width, 'height' : height });
		container.css({ 'height' : height }); 

		self.trigger(EVENT_POST_INVALIDATE);
	};

	/**
	 * Focuses user input on the text box.
	 *
	 * @signature TextExt.focusInput()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.focusInput
	 */
	p.focusInput = function()
	{
		this.input()[0].focus();
	};

	/**
	 * Serializes data for to be set into the hidden input field and which will be submitted 
	 * with the HTML form.
	 *
	 * By default simple JSON serialization is used. It's expected that `JSON.stringify`
	 * method would be available either through built in class in most modern browsers
	 * or through JSON2 library.
	 *
	 * @signature TextExt.serializeData(data)
	 *
	 * @param data {Object} Data to serialize.
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExt.serializeData
	 */
	p.serializeData = stringify;

	/**
	 * Returns the hidden input HTML element which will be submitted with the HTML form.
	 *
	 * @signature TextExt.hiddenInput()
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExt.hiddenInput
	 */
	p.hiddenInput = function(value)
	{
		return $(this).data('hiddenInput');
	};

	/**
	 * Abstracted functionality to trigger an event and get the data with maximum weight set by all
	 * the event handlers. This functionality is used for the `getFormData` event.
	 *
	 * @signature TextExt.getWeightedEventResponse(event, args)
	 *
	 * @param event {String} Event name.
	 * @param args {Object} Argument to be passed with the event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.getWeightedEventResponse
	 */
	p.getWeightedEventResponse = function(event, args)
	{
		var self      = this,
			data      = {},
			maxWeight = 0
			;

		self.trigger(event, data, args);

		for(var weight in data)
			maxWeight = Math.max(maxWeight, weight);

		return data[maxWeight];
	};

	/**
	 * Triggers the `getFormData` event to get all the plugins to return their data.
	 *
	 * After the data is returned, triggers `setFormData` and `setInputData` to update appopriate values.
	 *
	 * @signature TextExt.getFormData(keyCode)
	 *
	 * @param keyCode {Number} Key code number which has triggered this update. It's impotant to pass
	 * this value to the plugins because they might return different values based on the key that was 
	 * pressed. For example, the Tags plugin returns an empty string for the `input` value if the enter
	 * key was pressed, otherwise it returns whatever is currently in the text input.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.getFormData
	 */
	p.getFormData = function(keyCode)
	{
		var self = this,
			data = self.getWeightedEventResponse(EVENT_GET_FORM_DATA, keyCode || 0)
			;

		self.trigger(EVENT_SET_FORM_DATA  , data['form']);
		self.trigger(EVENT_SET_INPUT_DATA , data['input']);
	};

	//--------------------------------------------------------------------------------
	// Event handlers

	/**
	 * Reacts to the `anyKeyUp` event and triggers the `getFormData` to change data that will be submitted
	 * with the form. Default behaviour is that everything that is typed in will be JSON serialized, so
	 * the end result will be a JSON string.
	 *
	 * @signature TextExt.onAnyKeyUp(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.onAnyKeyUp
	 */
	p.onAnyKeyUp = function(e, keyCode)
	{
		this.getFormData(keyCode);
	};

	/**
	 * Reacts to the `setInputData` event and populates the input text field that user is currently
	 * interacting with.
	 *
	 * @signature TextExt.onSetInputData(e, data)
	 *
	 * @param e {Event} jQuery event.
	 * @param data {String} Value to be set.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.onSetInputData
	 */
	p.onSetInputData = function(e, data)
	{
		this.input().val(data);
	};

	/**
	 * Reacts to the `setFormData` event and populates the hidden input with will be submitted with
	 * the HTML form. The value will be serialized with `serializeData()` method.
	 *
	 * @signature TextExt.onSetFormData(e, data)
	 *
	 * @param e {Event} jQuery event.
	 * @param data {Object} Data that will be set.
	 * 
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExt.onSetFormData
	 */
	p.onSetFormData = function(e, data)
	{
		var self = this;
		self.hiddenInput().val(self.serializeData(data));
	};

	/**
	 * Reacts to `getFormData` event triggered by the core. At the bare minimum the core will tell
	 * itself to use the current value in the text input as the data to be submitted with the HTML
	 * form.
	 *
	 * @signature TextExt.onGetFormData(e, data)
	 *
	 * @param e {Event} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExt.onGetFormData
	 */
	p.onGetFormData = function(e, data)
	{
		var val = this.input().val();
		data[0] = formDataObject(val, val);
	};

	//--------------------------------------------------------------------------------
	// User mouse/keyboard input

	/**
	 * Triggers `[name]KeyUp` and `[name]KeyPress` for every keystroke as described in the events.
	 *
	 * @signature TextExt.onKeyUp(e)
	 *
	 * @param e {Object} jQuery event.
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.onKeyUp
	 */

	/**
	 * Triggers `[name]KeyDown` for every keystroke as described in the events.
	 *
	 * @signature TextExt.onKeyDown(e)
	 *
	 * @param e {Object} jQuery event.
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.onKeyDown
	 */
	
	$(['Down', 'Up']).each(function()
	{
		var type = this.toString();

		p['onKey' + type] = function(e)
		{
			var self          = this,
				keyName       = self.opts(OPT_KEYS)[e.keyCode],
				defaultResult = true
				;

			if(keyName)
			{
				defaultResult = keyName.substr(-1) != '!';
				keyName       = keyName.replace('!', '');

				self.trigger(keyName + 'Key' + type);

				// manual *KeyPress event fimplementation for the function keys like Enter, Backspace, etc.
				if(type == 'Up' && self._lastKeyDown == e.keyCode)
				{
					self._lastKeyDown = null;
					self.trigger(keyName + 'KeyPress');
				}

				if(type == 'Down')
					self._lastKeyDown = e.keyCode;
			}

			self.trigger('anyKey' + type, e.keyCode);

			return defaultResult;
		};
	});

	//--------------------------------------------------------------------------------
	// Plugin Base
	
	p = TextExtPlugin.prototype;

	/**
	 * Allows to add multiple event handlers which will be execued in the scope of the current object.
	 * 
	 * @signature TextExt.on([target], handlers)
	 *
	 * @param target {Object} **Optional**. Target object which has traditional `bind(event, handler)` method.
	 *                        Handler function will still be executed in the current object's scope.
	 * @param handlers {Object} Key/value pairs of event names and handlers, eg `{ event: handler }`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.on
	 */
	p.on = hookupEvents;

	/**
	 * Returns the hash object that `getFormData` triggered by the core expects.
	 *
	 * @signature TextExtPlugin.formDataObject(input, form)
	 *
	 * @param input {String} Value that will go into the text input that user is interacting with.
	 * @param form {Object} Value that will be serialized and put into the hidden that will be submitted
	 * with the HTML form.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtPlugin.formDataObject
	 */
	p.formDataObject = formDataObject;

	/**
	 * Initialization method called by the core during plugin instantiation. This method must be implemented
	 * by each plugin individually.
	 *
	 * @signature TextExtPlugin.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.init
	 */
	p.init = function(core) { throw new Error('Not implemented') };

	/**
	 * Initialization method wich should be called by the plugin during the `init()` call.
	 *
	 * @signature TextExtPlugin.baseInit(core, defaults)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 * @param defaults {Object} Default plugin options. These will be checked if desired value wasn't
	 * found in the options supplied by the user.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.baseInit
	 */
	p.baseInit = function(core, defaults)
	{
		var self = this;

		core._defaults = $.extend(true, core._defaults, defaults);
		self._core     = core;
		self._timers   = {};
	};

	/**
	 * Allows starting of multiple timeout calls. Each time this method is called with the same
	 * timer name, the timer is reset. This functionality is useful in cases where an action needs
	 * to occur only after a certain period of inactivity. For example, making an AJAX call after 
	 * user stoped typing for 1 second.
	 *
	 * @signature TextExtPlugin.startTimer(name, delay, callback)
	 *
	 * @param name {String} Timer name.
	 * @param delay {Number} Delay in seconds.
	 * @param callback {Function} Callback function.
	 *
	 * @author agorbatchev
	 * @date 2011/08/25
	 * @id TextExtPlugin.startTimer
	 */
	p.startTimer = function(name, delay, callback)
	{
		var self = this;

		self.stopTimer(name);

		self._timers[name] = setTimeout(
			function()
			{
				delete self._timers[name];
				callback.apply(self);
			},
			delay * 1000
		);
	};

	/**
	 * Stops the timer by name without resetting it.
	 *
	 * @signature TextExtPlugin.stopTimer(name)
	 *
	 * @param name {String} Timer name.
	 *
	 * @author agorbatchev
	 * @date 2011/08/25
	 * @id TextExtPlugin.stopTimer
	 */
	p.stopTimer = function(name)
	{
		clearTimeout(this._timers[name]);
	};

	/**
	 * Returns instance of the `TextExt` to which current instance of the plugin is attached to.
	 *
	 * @signature TextExtPlugin.core()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.core
	 */
	p.core = function()
	{
		return this._core;
	};

	/**
	 * Shortcut to the core's `opts()` method. Returns option value.
	 *
	 * @signature TextExtPlugin.opts(name)
	 * 
	 * @param name {String} Option name as described in the options.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.opts
	 */
	p.opts = function(name)
	{
		return this.core().opts(name);
	};

	/**
	 * Shortcut to the core's `itemManager()` method. Returns instance of the `ItemManger` that is
	 * currently in use.
	 *
	 * @signature TextExtPlugin.itemManager()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.itemManager
	 */
	p.itemManager = function()
	{
		return this.core().itemManager();
	};

	/**
	 * Shortcut to the core's `input()` method. Returns instance of the HTML element that represents
	 * current text input.
	 *
	 * @signature TextExtPlugin.input()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.input
	 */
	p.input = function()
	{
		return this.core().input();
	};

	/**
	 * Shortcut to the commonly used `this.input().val()` call to get or set value of the text input.
	 *
	 * @signature TextExtPlugin.val(value)
	 *
	 * @param value {String} Optional value. If specified, the value will be set, otherwise it will be
	 * returned.
	 *
	 * @author agorbatchev
	 * @date 2011/08/20
	 * @id TextExtPlugin.val
	 */
	p.val = function(value)
	{
		var input = this.input();

		if(typeof(value) === UNDEFINED)
			return input.val();
		else
			input.val(value);
	};

	/**
	 * Shortcut to the core's `trigger()` method. Triggers specified event with arguments on the
	 * component core.
	 *
	 * @signature TextExtPlugin.trigger(event, ...args)
	 *
	 * @param event {String} Name of the event to trigger.
	 * @param ...args All remaining arguments will be passed to the event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtPlugin.trigger
	 */
	p.trigger = function()
	{
		var core = this.core();
		core.trigger.apply(core, arguments);
	};

	/**
	 * Shortcut to the core's `bind()` method. Binds specified handler to the event.
	 *
	 * @signature TextExtPlugin.bind(event, handler)
	 *
	 * @param event {String} Event name.
	 * @param handler {Function} Event handler.
	 *
	 * @author agorbatchev
	 * @date 2011/08/20
	 * @id TextExtPlugin.bind
	 */
	p.bind = function(event, handler)
	{
		this.core().bind(event, handler);
	};

	/**
	 * Returns initialization priority for this plugin. If current plugin depends upon some other plugin
	 * to be initialized before or after, priority needs to be adjusted accordingly. Plugins with higher
	 * priority initialize before plugins with lower priority.
	 *
	 * Default initialization priority is `0`.
	 *
	 * @signature TextExtPlugin.initPriority()
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtPlugin.initPriority
	 */
	p.initPriority = function()
	{
		return 0;
	};

	//--------------------------------------------------------------------------------
	// jQuery Integration
	
	/**
	 * TextExt integrates as a jQuery plugin available through the `$(selector).textext(opts)` call. If
	 * `opts` argument is passed, then a new instance of `TextExt` will be created for all the inputs
	 * that match the `selector`. If `opts` wasn't passed and TextExt was already intantiated for 
	 * inputs that match the `selector`, array of `TextExt` instances will be returned instead.
	 *
	 *     // will create a new instance of `TextExt` for all elements that match `.sample`
	 *     $('.sample').textext({ ... });
	 *
	 *     // will return array of all `TextExt` instances
	 *     var list = $('.sample').textext();
	 *
	 * The following properties are also exposed through the jQuery `$.fn.textext`:
	 *
	 * * `TextExt` -- `TextExt` class.
	 * * `TextExtPlugin` -- `TextExtPlugin` class.
	 * * `ItemManager` -- `ItemManager` class.
	 * * `plugins` -- Key/value table of all registered plugins.
	 * * `addPlugin(name, constructor)` -- All plugins should register themselves using this function.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExt.jquery
	 */

	var cssInjected = false;

	var textext = $.fn.textext = function(opts)
	{
		var css;
		
		if(!cssInjected && (css = $.fn.textext.css) != null)
		{
			$('head').append('<style>' + css + '</style>');
			cssInjected = true;
		}

		return this.map(function()
		{
			var self = $(this);

			if(opts == null)
				return self.data('textext');

			var instance = new TextExt();

			instance.init(self, opts);
			self.data('textext', instance);

			return instance.input()[0];
		});
	};

	/**
	 * This static function registers a new plugin which makes it available through the `plugins` option
	 * to the end user. The name specified here is the name the end user would put in the `plugins` option
	 * to add this plugin to a new instance of TextExt.
	 * 
	 * @signature $.fn.textext.addPlugin(name, constructor)
	 *
	 * @param name {String} Name of the plugin.
	 * @param constructor {Function} Plugin constructor.
	 *
	 * @author agorbatchev
	 * @date 2011/10/11
	 * @id TextExt.addPlugin
	 */
	textext.addPlugin = function(name, constructor)
	{
		textext.plugins[name] = constructor;
		constructor.prototype = new textext.TextExtPlugin();
	};

	/**
	 * This static function registers a new patch which is added to each instance of TextExt. If you are
	 * adding a new patch, make sure to call this method.
	 * 
	 * @signature $.fn.textext.addPatch(name, constructor)
	 *
	 * @param name {String} Name of the patch.
	 * @param constructor {Function} Patch constructor.
	 *
	 * @author agorbatchev
	 * @date 2011/10/11
	 * @id TextExt.addPatch
	 */
	textext.addPatch = function(name, constructor)
	{
		textext.patches[name] = constructor;
		constructor.prototype = new textext.TextExtPlugin();
	};

	textext.TextExt       = TextExt;
	textext.TextExtPlugin = TextExtPlugin;
	textext.ItemManager   = ItemManager;
	textext.plugins       = {};
	textext.patches       = {};
})(jQuery);

(function($)
{
	function TextExtIE9Patches() {};

	$.fn.textext.TextExtIE9Patches = TextExtIE9Patches;
	$.fn.textext.addPatch('ie9',TextExtIE9Patches);

	var p = TextExtIE9Patches.prototype;

	p.init = function(core)
	{
		if(navigator.userAgent.indexOf('MSIE 9') == -1)
			return;

		var self = this;

		core.on({ postInvalidate : self.onPostInvalidate });
	};

	p.onPostInvalidate = function()
	{
		var self  = this,
			input = self.input(),
			val   = input.val()
			;

		// agorbatchev :: IE9 doesn't seem to update the padding if box-sizing is on until the
		// text box value changes, so forcing this change seems to do the trick of updating
		// IE's padding visually.
		input.val(Math.random());
		input.val(val);
	};
})(jQuery);

/*
textext.plugin.autocomplete.js contents:
*/

/**
 * jQuery TextExt Plugin
 * http://textextjs.com
 *
 * @version 1.3.1
 * @copyright Copyright (C) 2011 Alex Gorbatchev. All rights reserved.
 * @license MIT License
 */
(function($)
{
	/**
	 * Autocomplete plugin brings the classic autocomplete functionality to the TextExt ecosystem.
	 * The gist of functionality is when user starts typing in, for example a term or a tag, a
	 * dropdown would be presented with possible suggestions to complete the input quicker.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete
	 */
	function TextExtAutocomplete() {};

	$.fn.textext.TextExtAutocomplete = TextExtAutocomplete;
	$.fn.textext.addPlugin('autocomplete', TextExtAutocomplete);

	var p = TextExtAutocomplete.prototype,
		
		CSS_DOT            = '.',
		CSS_SELECTED       = 'text-selected',
		CSS_DOT_SELECTED   = CSS_DOT + CSS_SELECTED,
		CSS_SUGGESTION     = 'text-suggestion',
		CSS_DOT_SUGGESTION = CSS_DOT + CSS_SUGGESTION,
		CSS_LABEL          = 'text-label',
		CSS_DOT_LABEL      = CSS_DOT + CSS_LABEL,

		/**
		 * Autocomplete plugin options are grouped under `autocomplete` when passed to the 
		 * `$().textext()` function. For example:
		 *
		 *     $('textarea').textext({
		 *         plugins: 'autocomplete',
		 *         autocomplete: {
		 *             dropdownPosition: 'above'
		 *         }
		 *     })
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.options
		 */

		/**
		 * This is a toggle switch to enable or disable the Autucomplete plugin. The value is checked
		 * each time at the top level which allows you to toggle this setting on the fly.
		 *
		 * @name autocomplete.enabled
		 * @default true
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.options.autocomplete.enabled
		 */
		OPT_ENABLED = 'autocomplete.enabled',

		/**
		 * This option allows to specify position of the dropdown. The two possible values
		 * are `above` and `below`.
		 *
		 * @name autocomplete.dropdown.position
		 * @default "below"
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.options.autocomplete.dropdown.position
		 */
		OPT_POSITION = 'autocomplete.dropdown.position',

		/**
		 * This option allows to specify maximum height of the dropdown. Value is taken directly, so
		 * if desired height is 200 pixels, value must be `200px`.
		 *
		 * @name autocomplete.dropdown.maxHeight
		 * @default "100px"
		 * @author agorbatchev
		 * @date 2011/12/29
		 * @id TextExtAutocomplete.options.autocomplete.dropdown.maxHeight
		 * @version 1.1
		 */
		OPT_MAX_HEIGHT = 'autocomplete.dropdown.maxHeight',

		/**
		 * This option allows to override how a suggestion item is rendered. The value should be
		 * a function, the first argument of which is suggestion to be rendered and `this` context
		 * is the current instance of `TextExtAutocomplete`. 
		 *
		 * [Click here](/manual/examples/autocomplete-with-custom-render.html) to see a demo.
		 *
		 * For example:
		 *
		 *     $('textarea').textext({
		 *         plugins: 'autocomplete',
		 *         autocomplete: {
		 *             render: function(suggestion)
		 *             {
		 *                 return '<b>' + suggestion + '</b>';
		 *             }
		 *         }
		 *     })
		 *
		 * @name autocomplete.render
		 * @default null
		 * @author agorbatchev
		 * @date 2011/12/23
		 * @id TextExtAutocomplete.options.autocomplete.render
		 * @version 1.1
		 */
		OPT_RENDER = 'autocomplete.render',

		/**
		 * HTML source that is used to generate the dropdown.
		 *
		 * @name html.dropdown
		 * @default '<div class="text-dropdown"><div class="text-list"/></div>'
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.options.html.dropdown
		 */
		OPT_HTML_DROPDOWN = 'html.dropdown',

		/**
		 * HTML source that is used to generate each suggestion.
		 *
		 * @name html.suggestion
		 * @default '<div class="text-suggestion"><span class="text-label"/></div>'
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.options.html.suggestion
		 */
		OPT_HTML_SUGGESTION = 'html.suggestion',

		/**
		 * Autocomplete plugin triggers or reacts to the following events.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.events
		 */
	
		/**
		 * Autocomplete plugin triggers and reacts to the `hideDropdown` to hide the dropdown if it's 
		 * already visible.
		 *
		 * @name hideDropdown
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.events.hideDropdown
		 */
		EVENT_HIDE_DROPDOWN = 'hideDropdown',

		/**
		 * Autocomplete plugin triggers and reacts to the `showDropdown` to show the dropdown if it's 
		 * not already visible.
		 *
		 * It's possible to pass a render callback function which will be called instead of the
		 * default `TextExtAutocomplete.renderSuggestions()`. 
		 *
		 * Here's how another plugin should trigger this event with the optional render callback:
		 *
		 *     this.trigger('showDropdown', function(autocomplete)
		 *     {
		 *         autocomplete.clearItems();
		 *         var node = autocomplete.addDropdownItem('<b>Item</b>');
		 *         node.addClass('new-look');
		 *     });
		 *
		 * @name showDropdown
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.events.showDropdown
		 */
		EVENT_SHOW_DROPDOWN = 'showDropdown',

		/**
		 * Autocomplete plugin reacts to the `setSuggestions` event triggered by other plugins which
		 * wish to populate the suggestion items. Suggestions should be passed as event argument in the 
		 * following format: `{ data : [ ... ] }`. 
		 *
		 * Here's how another plugin should trigger this event:
		 *
		 *     this.trigger('setSuggestions', { data : [ "item1", "item2" ] });
		 *
		 * @name setSuggestions
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.events.setSuggestions
		 */

		/**
		 * Autocomplete plugin triggers the `getSuggestions` event and expects to get results by listening for
		 * the `setSuggestions` event.
		 *
		 * @name getSuggestions
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtAutocomplete.events.getSuggestions
		 */
		EVENT_GET_SUGGESTIONS = 'getSuggestions',

		/**
		 * Autocomplete plugin triggers `getFormData` event with the current suggestion so that the the core
		 * will be updated with serialized data to be submitted with the HTML form.
		 * 
		 * @name getFormData
		 * @author agorbatchev
		 * @date 2011/08/18
		 * @id TextExtAutocomplete.events.getFormData
		 */
		EVENT_GET_FORM_DATA = 'getFormData',

		/**
		 * Autocomplete plugin reacts to `toggleDropdown` event and either shows or hides the dropdown
		 * depending if it's currently hidden or visible.
		 * 
		 * @name toggleDropdown
		 * @author agorbatchev
		 * @date 2011/12/27
		 * @id TextExtAutocomplete.events.toggleDropdown
		 * @version 1.1
		 */
		EVENT_TOGGLE_DROPDOWN = 'toggleDropdown',

		POSITION_ABOVE = 'above',
		POSITION_BELOW = 'below',
		
		DATA_MOUSEDOWN_ON_AUTOCOMPLETE = 'mousedownOnAutocomplete',

		DEFAULT_OPTS = {
			autocomplete : {
				enabled : true,
				dropdown : {
					position : POSITION_BELOW,
					maxHeight : '100px'
				}
			},

			html : {
				dropdown   : '<div class="text-dropdown"><div class="text-list"/></div>',
				suggestion : '<div class="text-suggestion"><span class="text-label"/></div>'
			}
		}
		;

	/**
	 * Initialization method called by the core during plugin instantiation.
	 *
	 * @signature TextExtAutocomplete.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.init
	 */
	p.init = function(core)
	{
		var self = this;

		self.baseInit(core, DEFAULT_OPTS);

		var input = self.input(),
			container
			;

		if(self.opts(OPT_ENABLED) === true)
		{
			self.on({
				blur              : self.onBlur,
				anyKeyUp          : self.onAnyKeyUp,
				deleteKeyUp       : self.onAnyKeyUp,
				backspaceKeyPress : self.onBackspaceKeyPress,
				enterKeyPress     : self.onEnterKeyPress,
				escapeKeyPress    : self.onEscapeKeyPress,
				setSuggestions    : self.onSetSuggestions,
				showDropdown      : self.onShowDropdown,
				hideDropdown      : self.onHideDropdown,
				toggleDropdown    : self.onToggleDropdown,
				postInvalidate    : self.positionDropdown,
				getFormData       : self.onGetFormData,

				// using keyDown for up/down keys so that repeat events are
				// captured and user can scroll up/down by holding the keys
				downKeyDown : self.onDownKeyDown,
				upKeyDown   : self.onUpKeyDown
			});

			container = $(self.opts(OPT_HTML_DROPDOWN));
			container.insertAfter(input);

			self.on(container, {
				mouseover : self.onMouseOver,
				mousedown : self.onMouseDown,
				click     : self.onClick
			});

			container
				.css('maxHeight', self.opts(OPT_MAX_HEIGHT))
				.addClass('text-position-' + self.opts(OPT_POSITION))
				;

			$(self).data('container', container);
			
			$(document.body).click(function(e) 
			{
				if (self.isDropdownVisible() && !self.withinWrapElement(e.target))
					self.trigger(EVENT_HIDE_DROPDOWN);
			});

			self.positionDropdown();
		}
	};

	/**
	 * Returns top level dropdown container HTML element.
	 * 
	 * @signature TextExtAutocomplete.containerElement()
	 * 
	 * @author agorbatchev
	 * @date 2011/08/15
	 * @id TextExtAutocomplete.containerElement
	 */
	p.containerElement = function()
	{
		return $(this).data('container');
	};

	//--------------------------------------------------------------------------------
	// User mouse/keyboard input
	
	/**
	 * Reacts to the `mouseOver` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onMouseOver(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onMouseOver
	 */
	p.onMouseOver = function(e)
	{
		var self   = this,
			target = $(e.target)
			;

        // Fixing a bug here, as it otherwise wouldn't work if there were custom html elements
        if (!target.is(CSS_DOT_SUGGESTION)) {
          var tparents = target.parents(CSS_DOT_SUGGESTION);
          if (tparents && tparents.length >= 1) {
              target = $(tparents[0]);
           }  
        } 

		if(target.is(CSS_DOT_SUGGESTION))
		{
			self.clearSelected();
			target.addClass(CSS_SELECTED);
		}
	};
	
	/**
	 * Reacts to the `mouseDown` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onMouseDown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author adamayres
	 * @date 2012/01/13
	 * @id TextExtAutocomplete.onMouseDown
	 */
	p.onMouseDown = function(e)
	{
		this.containerElement().data(DATA_MOUSEDOWN_ON_AUTOCOMPLETE, true);
	};
	
	/**
	 * Reacts to the `click` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onClick(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onClick
	 */
	p.onClick = function(e)
	{
		var self   = this,
			target = $(e.target)
			;

        // Fixing a bug here, as it otherwise wouldn't work if there were custom html elements
        if (!target.is(CSS_DOT_SUGGESTION)) {
          var tparents = target.parents(CSS_DOT_SUGGESTION);
          if (tparents && tparents.length >= 1) {
              target = $(tparents[0]);
           }  
        }
                
		if(target.is(CSS_DOT_SUGGESTION) || target.is(CSS_DOT_LABEL)) {
		    // if we're in a suggestion element
			self.trigger('enterKeyPress');
		}
		
		if (self.core().hasPlugin('tags'))
			self.val('');
	};

	/**
	 * Reacts to the `blur` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onBlur(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onBlur
	 */
	p.onBlur = function(e)
	{
		var self              = this,
			container         = self.containerElement(),
			isBlurByMousedown = container.data(DATA_MOUSEDOWN_ON_AUTOCOMPLETE) === true
			;

		// only trigger a close event if the blur event was 
		// not triggered by a mousedown event on the autocomplete
		// otherwise set focus back back on the input
		if(self.isDropdownVisible())
			isBlurByMousedown ? self.core().focusInput() : self.trigger(EVENT_HIDE_DROPDOWN);
				
		container.removeData(DATA_MOUSEDOWN_ON_AUTOCOMPLETE);
	};

	/**
	 * Reacts to the `backspaceKeyPress` event triggered by the TextExt core. 
	 *
	 * @signature TextExtAutocomplete.onBackspaceKeyPress(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onBackspaceKeyPress
	 */
	p.onBackspaceKeyPress = function(e)
	{
		var self    = this,
			isEmpty = self.val().length > 0
			;

		if(isEmpty || self.isDropdownVisible())
			self.getSuggestions();
	};

	/**
	 * Reacts to the `anyKeyUp` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onAnyKeyUp(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onAnyKeyUp
	 */
	p.onAnyKeyUp = function(e, keyCode)
	{
		var self          = this,
			isFunctionKey = self.opts('keys.' + keyCode) != null
			;

		if(self.val().length > 0 && !isFunctionKey)
			self.getSuggestions();
	};

	/**
	 * Reacts to the `downKeyDown` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onDownKeyDown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onDownKeyDown
	 */
	p.onDownKeyDown = function(e)
	{
		var self = this;

		self.isDropdownVisible()
			? self.toggleNextSuggestion() 
			: self.getSuggestions()
			;
	};

	/**
	 * Reacts to the `upKeyDown` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onUpKeyDown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onUpKeyDown
	 */
	p.onUpKeyDown = function(e)
	{
		this.togglePreviousSuggestion();
	};

	/**
	 * Reacts to the `enterKeyPress` event triggered by the TextExt core.
	 *
	 * @signature TextExtAutocomplete.onEnterKeyPress(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onEnterKeyPress
	 */
	p.onEnterKeyPress = function(e)
	{
		var self = this;

		if(self.isDropdownVisible())
			self.selectFromDropdown();
	};

	/**
	 * Reacts to the `escapeKeyPress` event triggered by the TextExt core. Hides the dropdown
	 * if it's currently visible.
	 *
	 * @signature TextExtAutocomplete.onEscapeKeyPress(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onEscapeKeyPress
	 */
	p.onEscapeKeyPress = function(e)
	{
		var self = this;

		if(self.isDropdownVisible())
			self.trigger(EVENT_HIDE_DROPDOWN);
	};

	//--------------------------------------------------------------------------------
	// Core functionality

	/**
	 * Positions dropdown either below or above the input based on the `autocomplete.dropdown.position`
	 * option specified, which could be either `above` or `below`.
	 *
	 * @signature TextExtAutocomplete.positionDropdown()
	 *
	 * @author agorbatchev
	 * @date 2011/08/15
	 * @id TextExtAutocomplete.positionDropdown
	 */
	p.positionDropdown = function()
	{
		var self      = this,
			container = self.containerElement(),
			direction = self.opts(OPT_POSITION),
			height    = self.core().wrapElement().outerHeight(),
			css       = {}
			;

		css[direction === POSITION_ABOVE ? 'bottom' : 'top'] = height + 'px';
		container.css(css);
	};

	/**
	 * Returns list of all the suggestion HTML elements in the dropdown.
	 *
	 * @signature TextExtAutocomplete.suggestionElements()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.suggestionElements
	 */
	p.suggestionElements = function()
	{
		return this.containerElement().find(CSS_DOT_SUGGESTION);
	};


	/**
	 * Highlights specified suggestion as selected in the dropdown.
	 *
	 * @signature TextExtAutocomplete.setSelectedSuggestion(suggestion)
	 *
	 * @param suggestion {Object} Suggestion object. With the default `ItemManager` this
	 * is expected to be a string, anything else with custom implementations.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.setSelectedSuggestion
	 */
	p.setSelectedSuggestion = function(suggestion)
	{
		if(!suggestion)
			return;

		var self   = this,
			all    = self.suggestionElements(),
			target = all.first(),
			item, i
			;

		self.clearSelected();

		for(i = 0; i < all.length; i++)
		{
			item = $(all[i]);

			if(self.itemManager().compareItems(item.data(CSS_SUGGESTION), suggestion))
			{
				target = item.addClass(CSS_SELECTED);
				break;
			}
		}

		target.addClass(CSS_SELECTED);
		self.scrollSuggestionIntoView(target);
	};

	/**
	 * Returns the first suggestion HTML element from the dropdown that is highlighted as selected.
	 *
	 * @signature TextExtAutocomplete.selectedSuggestionElement()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.selectedSuggestionElement
	 */
	p.selectedSuggestionElement = function()
	{
		return this.suggestionElements().filter(CSS_DOT_SELECTED).first();
	};

	/**
	 * Returns `true` if dropdown is currently visible, `false` otherwise.
	 *
	 * @signature TextExtAutocomplete.isDropdownVisible()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.isDropdownVisible
	 */
	p.isDropdownVisible = function()
	{
		return this.containerElement().is(':visible') === true;
	};

	/**
	 * Reacts to the `getFormData` event triggered by the core. Returns data with the
	 * weight of 100 to be *less than the Tags plugin* data weight. The weights system is
	 * covered in greater detail in the [`getFormData`][1] event documentation.
	 *
	 * [1]: /manual/textext.html#getformdata
	 *
	 * @signature TextExtAutocomplete.onGetFormData(e, data, keyCode)
	 *
	 * @param e {Object} jQuery event.
	 * @param data {Object} Data object to be populated.
	 * @param keyCode {Number} Key code that triggered the original update request.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtAutocomplete.onGetFormData
	 */
	p.onGetFormData = function(e, data, keyCode)
	{
		var self       = this,
			val        = self.val(),
			inputValue = val,
			formValue  = val
			;
		data[100] = self.formDataObject(inputValue, formValue);
	};

	/**
	 * Returns initialization priority of the Autocomplete plugin which is expected to be
	 * *greater than the Tags plugin* because of the dependencies. The value is 200.
	 *
	 * @signature TextExtAutocomplete.initPriority()
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtAutocomplete.initPriority
	 */
	p.initPriority = function()
	{
		return 200;
	};

	/**
	 * Reacts to the `hideDropdown` event and hides the dropdown if it's already visible.
	 *
	 * @signature TextExtAutocomplete.onHideDropdown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onHideDropdown
	 */
	p.onHideDropdown = function(e)
	{
		this.hideDropdown();
	};

	/**
	 * Reacts to the 'toggleDropdown` event and shows or hides the dropdown depending if
	 * it's currently hidden or visible.
	 *
	 * @signature TextExtAutocomplete.onToggleDropdown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/12/27
	 * @id TextExtAutocomplete.onToggleDropdown
	 * @version 1.1.0
	 */
	p.onToggleDropdown = function(e)
	{
		var self = this;
		self.trigger(self.containerElement().is(':visible') ? EVENT_HIDE_DROPDOWN : EVENT_SHOW_DROPDOWN);
	};

	/**
	 * Reacts to the `showDropdown` event and shows the dropdown if it's not already visible.
	 * It's possible to pass a render callback function which will be called instead of the
	 * default `TextExtAutocomplete.renderSuggestions()`.
	 *
	 * If no suggestion were previously loaded, it will fire `getSuggestions` event and exit.
	 *
	 * Here's how another plugin should trigger this event with the optional render callback:
	 *
	 *     this.trigger('showDropdown', function(autocomplete)
	 *     {
	 *         autocomplete.clearItems();
	 *         var node = autocomplete.addDropdownItem('<b>Item</b>');
	 *         node.addClass('new-look');
	 *     });
	 *
	 * @signature TextExtAutocomplete.onShowDropdown(e, renderCallback)
	 *
	 * @param e {Object} jQuery event.
	 * @param renderCallback {Function} Optional callback function which would be used to 
	 * render dropdown items. As a first argument, reference to the current instance of 
	 * Autocomplete plugin will be supplied. It's assumed, that if this callback is provided
	 * rendering will be handled completely manually.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onShowDropdown
	 */
	p.onShowDropdown = function(e, renderCallback)
	{
		var self        = this,
			current     = self.selectedSuggestionElement().data(CSS_SUGGESTION),
			suggestions = self._suggestions
			;

		if(!suggestions)
			return self.trigger(EVENT_GET_SUGGESTIONS);

		if($.isFunction(renderCallback))
		{
			renderCallback(self);
		}
		else
		{
			self.renderSuggestions(self._suggestions);
			self.toggleNextSuggestion();
		}
		
		self.showDropdown(self.containerElement());
		self.setSelectedSuggestion(current);
	};

	/**
	 * Reacts to the `setSuggestions` event. Expects to recieve the payload as the second argument
	 * in the following structure:
	 *
	 *     {
	 *         result : [ "item1", "item2" ],
	 *         showHideDropdown : false
	 *     }
	 *
	 * Notice the optional `showHideDropdown` option. By default, ie without the `showHideDropdown` 
	 * value the method will trigger either `showDropdown` or `hideDropdown` depending if there are
	 * suggestions. If set to `false`, no event is triggered.
	 *
	 * @signature TextExtAutocomplete.onSetSuggestions(e, data)
	 *
	 * @param data {Object} Data payload.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.onSetSuggestions
	 */
	p.onSetSuggestions = function(e, data)
	{
		var self        = this,
			suggestions = self._suggestions = data.result
			;

		if(data.showHideDropdown !== false)
			self.trigger(suggestions === null || suggestions.length === 0 ? EVENT_HIDE_DROPDOWN : EVENT_SHOW_DROPDOWN);
	};

	/**
	 * Prepears for and triggers the `getSuggestions` event with the `{ query : {String} }` as second
	 * argument.
	 *
	 * @signature TextExtAutocomplete.getSuggestions()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.getSuggestions
	 */
	p.getSuggestions = function()
	{
		var self = this,
			val  = self.val()
			;

		if(self._previousInputValue == val)
			return;

		// if user clears input, then we want to select first suggestion
		// instead of the last one
		if(val == '')
			current = null;

		self._previousInputValue = val;
		self.trigger(EVENT_GET_SUGGESTIONS, { query : val });
	};

	/**
	 * Removes all HTML suggestion items from the dropdown.
	 *
	 * @signature TextExtAutocomplete.clearItems()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.clearItems
	 */
	p.clearItems = function()
	{
		this.containerElement().find('.text-list').children().remove();
	};

	/**
	 * Clears all and renders passed suggestions.
	 *
	 * @signature TextExtAutocomplete.renderSuggestions(suggestions)
	 *
	 * @param suggestions {Array} List of suggestions to render.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.renderSuggestions
	 */
	p.renderSuggestions = function(suggestions)
	{
		var self = this;

		self.clearItems();

		$.each(suggestions || [], function(index, item)
		{
			self.addSuggestion(item);
		});
	};

	/**
	 * Shows the dropdown.
	 *
	 * @signature TextExtAutocomplete.showDropdown()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.showDropdown
	 */
	p.showDropdown = function()
	{
		this.containerElement().show();
	};

	/**
	 * Hides the dropdown.
	 *
	 * @signature TextExtAutocomplete.hideDropdown()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.hideDropdown
	 */
	p.hideDropdown = function()
	{
		var self     = this,
			dropdown = self.containerElement()
			;

		self._previousInputValue = null;
		dropdown.hide();
	};

	/**
	 * Adds single suggestion to the bottom of the dropdown. Uses `ItemManager.itemToString()` to
	 * serialize provided suggestion to string.
	 *
	 * @signature TextExtAutocomplete.addSuggestion(suggestion)
	 *
	 * @param suggestion {Object} Suggestion item. By default expected to be a string.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.addSuggestion
	 */
	p.addSuggestion = function(suggestion)
	{
		var self     = this,
			renderer = self.opts(OPT_RENDER),
			node     = self.addDropdownItem(renderer ? renderer.call(self, suggestion) : self.itemManager().itemToString(suggestion))
			;

		node.data(CSS_SUGGESTION, suggestion);
	};

	/**
	 * Adds and returns HTML node to the bottom of the dropdown.
	 *
	 * @signature TextExtAutocomplete.addDropdownItem(html)
	 *
	 * @param html {String} HTML to be inserted into the item.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.addDropdownItem
	 */
	p.addDropdownItem = function(html)
	{
		var self      = this,
			container = self.containerElement().find('.text-list'),
			node      = $(self.opts(OPT_HTML_SUGGESTION))
			;

		node.find('.text-label').html(html);
		container.append(node);
		return node;
	};

	/**
	 * Removes selection highlight from all suggestion elements.
	 *
	 * @signature TextExtAutocomplete.clearSelected()
	 *
	 * @author agorbatchev
	 * @date 2011/08/02
	 * @id TextExtAutocomplete.clearSelected
	 */
	p.clearSelected = function()
	{
		this.suggestionElements().removeClass(CSS_SELECTED);
	};

	/**
	 * Selects next suggestion relative to the current one. If there's no
	 * currently selected suggestion, it will select the first one. Selected
	 * suggestion will always be scrolled into view.
	 *
	 * @signature TextExtAutocomplete.toggleNextSuggestion()
	 *
	 * @author agorbatchev
	 * @date 2011/08/02
	 * @id TextExtAutocomplete.toggleNextSuggestion
	 */
	p.toggleNextSuggestion = function()
	{
		var self     = this,
			selected = self.selectedSuggestionElement(),
			next
			;

		if(selected.length > 0)
		{
			next = selected.next();

			if(next.length > 0)
				selected.removeClass(CSS_SELECTED);
		}
		else
		{
			next = self.suggestionElements().first();
		}

		next.addClass(CSS_SELECTED);
		self.scrollSuggestionIntoView(next);
	};

	/**
	 * Selects previous suggestion relative to the current one. Selected
	 * suggestion will always be scrolled into view.
	 *
	 * @signature TextExtAutocomplete.togglePreviousSuggestion()
	 *
	 * @author agorbatchev
	 * @date 2011/08/02
	 * @id TextExtAutocomplete.togglePreviousSuggestion
	 */
	p.togglePreviousSuggestion = function()
	{
		var self     = this,
			selected = self.selectedSuggestionElement(),
			prev     = selected.prev()
			;

		if(prev.length == 0)
			return;

		self.clearSelected();
		prev.addClass(CSS_SELECTED);
		self.scrollSuggestionIntoView(prev);
	};

	/**
	 * Scrolls specified HTML suggestion element into the view.
	 *
	 * @signature TextExtAutocomplete.scrollSuggestionIntoView(item)
	 *
	 * @param item {HTMLElement} jQuery HTML suggestion element which needs to
	 * scrolled into view.
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.scrollSuggestionIntoView
	 */
	p.scrollSuggestionIntoView = function(item)
	{
		var itemHeight     = item.outerHeight(),
			dropdown       = this.containerElement(),
			dropdownHeight = dropdown.innerHeight(),
			scrollPos      = dropdown.scrollTop(),
			itemTop        = (item.position() || {}).top,
			scrollTo       = null,
			paddingTop     = parseInt(dropdown.css('paddingTop'))
			;

		if(itemTop == null)
			return;

		// if scrolling down and item is below the bottom fold
		if(itemTop + itemHeight > dropdownHeight)
			scrollTo = itemTop + scrollPos + itemHeight - dropdownHeight + paddingTop;

		// if scrolling up and item is above the top fold
		if(itemTop < 0)
			scrollTo = itemTop + scrollPos - paddingTop;

		if(scrollTo != null)
			dropdown.scrollTop(scrollTo);
	};

	/**
	 * Uses the value from the text input to finish autocomplete action. Currently selected
	 * suggestion from the dropdown will be used to complete the action. Triggers `hideDropdown`
	 * event.
	 *
	 * @signature TextExtAutocomplete.selectFromDropdown()
	 *
	 * @author agorbatchev
	 * @date 2011/08/17
	 * @id TextExtAutocomplete.selectFromDropdown
	 */
	p.selectFromDropdown = function()
	{
		var self       = this,
			suggestion = self.selectedSuggestionElement().data(CSS_SUGGESTION)
			;

		if(suggestion)
		{
			self.val(self.itemManager().itemToString(suggestion));
			self.core().getFormData();	
		}

		self.trigger(EVENT_HIDE_DROPDOWN);
	};
	
	/**
	 * Determines if the specified HTML element is within the TextExt core wrap HTML element.
	 *
	 * @signature TextExtAutocomplete.withinWrapElement(element)
	 *
	 * @param element {HTMLElement} element to check if contained by wrap element
	 *
	 * @author adamayres
	 * @version 1.3.0
	 * @date 2012/01/15
	 * @id TextExtAutocomplete.withinWrapElement
	 */
	p.withinWrapElement = function(element) 
	{
		return this.core().wrapElement().find(element).size() > 0;
	}
})(jQuery);



/*
  Implement Github like autocomplete mentions
  http://ichord.github.com/At.js

  Copyright (c) 2013 chord.luo@gmail.com
  Licensed under the MIT license.
*/


/*
本插件操作 textarea 或者 input 内的插入符
只实现了获得插入符在文本框中的位置，我设置
插入符的位置.
*/

(function() {
  (function(factory) {
    if (typeof define === 'function' && define.amd) {
      return define(['jquery'], factory);
    } else {
      return factory(window.jQuery);
    }
  })(function($) {
    "use strict";
    var EditableCaret, InputCaret, Mirror, Utils, methods, pluginName;

    pluginName = 'caret';
    EditableCaret = (function() {
      function EditableCaret($inputor) {
        this.$inputor = $inputor;
        this.domInputor = this.$inputor[0];
      }

      EditableCaret.prototype.setPos = function(pos) {
        return this.domInputor;
      };

      EditableCaret.prototype.getIEPosition = function() {
        return $.noop();
      };

      EditableCaret.prototype.getPosition = function() {
        return $.noop();
      };

      EditableCaret.prototype.getOldIEPos = function() {
        var preCaretTextRange, textRange;

        textRange = document.selection.createRange();
        preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(this.domInputor);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        return preCaretTextRange.text.length;
      };

      EditableCaret.prototype.getPos = function() {
        var clonedRange, pos, range;

        if (range = this.range()) {
          clonedRange = range.cloneRange();
          clonedRange.selectNodeContents(this.domInputor);
          clonedRange.setEnd(range.endContainer, range.endOffset);
          pos = clonedRange.toString().length;
          clonedRange.detach();
          return pos;
        } else if (document.selection) {
          return this.getOldIEPos();
        }
      };

      EditableCaret.prototype.getOldIEOffset = function() {
        var range, rect;

        range = document.selection.createRange().duplicate();
        range.moveStart("character", -1);
        rect = range.getBoundingClientRect();
        return {
          height: rect.bottom - rect.top,
          left: rect.left,
          top: rect.top
        };
      };

      EditableCaret.prototype.getOffset = function(pos) {
        var clonedRange, offset, range, rect;

        offset = null;
        if (window.getSelection && (range = this.range())) {
          if (range.endOffset - 1 < 0) {
            return null;
          }
          clonedRange = range.cloneRange();
          clonedRange.setStart(range.endContainer, range.endOffset - 1);
          clonedRange.setEnd(range.endContainer, range.endOffset);
          rect = clonedRange.getBoundingClientRect();
          offset = {
            height: rect.height,
            left: rect.left + rect.width,
            top: rect.top
          };
          clonedRange.detach();
          offset;
        } else if (document.selection) {
          this.getOldIEOffset();
        }
        return Utils.adjustOffset(offset, this.$inputor);
      };

      EditableCaret.prototype.range = function() {
        var sel;

        if (!window.getSelection) {
          return;
        }
        sel = window.getSelection();
        if (sel.rangeCount > 0) {
          return sel.getRangeAt(0);
        } else {
          return null;
        }
      };

      return EditableCaret;

    })();
    InputCaret = (function() {
      function InputCaret($inputor) {
        this.$inputor = $inputor;
        this.domInputor = this.$inputor[0];
      }

      InputCaret.prototype.getIEPos = function() {
        var endRange, inputor, len, normalizedValue, pos, range, textInputRange;

        inputor = this.domInputor;
        range = document.selection.createRange();
        pos = 0;
        if (range && range.parentElement() === inputor) {
          normalizedValue = inputor.value.replace(/\r\n/g, "\n");
          len = normalizedValue.length;
          textInputRange = inputor.createTextRange();
          textInputRange.moveToBookmark(range.getBookmark());
          endRange = inputor.createTextRange();
          endRange.collapse(false);
          if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
            pos = len;
          } else {
            pos = -textInputRange.moveStart("character", -len);
          }
        }
        return pos;
      };

      InputCaret.prototype.getPos = function() {
        if (document.selection) {
          return this.getIEPos();
        } else {
          return this.domInputor.selectionStart;
        }
      };

      InputCaret.prototype.setPos = function(pos) {
        var inputor, range;

        inputor = this.domInputor;
        if (document.selection) {
          range = inputor.createTextRange();
          range.move("character", pos);
          range.select();
        } else if (inputor.setSelectionRange) {
          inputor.setSelectionRange(pos, pos);
        }
        return inputor;
      };

      InputCaret.prototype.getIEOffset = function(pos) {
        var h, range, textRange, x, y;

        textRange = this.domInputor.createTextRange();
        if (pos) {
          textRange.move('character', pos);
        } else {
          range = document.selection.createRange();
          textRange.moveToBookmark(range.getBookmark());
        }
        x = textRange.boundingLeft;
        y = textRange.boundingTop;
        h = textRange.boundingHeight;
        return {
          left: x,
          top: y,
          height: h
        };
      };

      InputCaret.prototype.getOffset = function(pos) {
        var $inputor, offset, position;

        $inputor = this.$inputor;
        if (document.selection) {
          return Utils.adjustOffset(this.getIEOffset(pos), $inputor);
        } else {
          offset = $inputor.offset();
          position = this.getPosition(pos);
          return offset = {
            left: offset.left + position.left,
            top: offset.top + position.top,
            height: position.height
          };
        }
      };

      InputCaret.prototype.getPosition = function(pos) {
        var $inputor, at_rect, format, html, mirror, start_range;

        $inputor = this.$inputor;
        format = function(value) {
          return value.replace(/</g, '&lt').replace(/>/g, '&gt').replace(/`/g, '&#96').replace(/"/g, '&quot').replace(/\r\n|\r|\n/g, "<br />");
        };
        if (pos === void 0) {
          pos = this.getPos();
        }
        start_range = $inputor.val().slice(0, pos);
        html = "<span>" + format(start_range) + "</span>";
        html += "<span id='caret'>|</span>";
        mirror = new Mirror($inputor);
        return at_rect = mirror.create(html).rect();
      };

      InputCaret.prototype.getIEPosition = function(pos) {
        var h, inputorOffset, offset, x, y;

        offset = this.getIEOffset(pos);
        inputorOffset = this.$inputor.offset();
        x = offset.left - inputorOffset.left;
        y = offset.top - inputorOffset.top;
        h = offset.height;
        return {
          left: x,
          top: y,
          height: h
        };
      };

      return InputCaret;

    })();
    Mirror = (function() {
      Mirror.prototype.css_attr = ["overflowY", "height", "width", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom", "marginTop", "marginLeft", "marginRight", "marginBottom", "fontFamily", "borderStyle", "borderWidth", "wordWrap", "fontSize", "lineHeight", "overflowX", "text-align"];

      function Mirror($inputor) {
        this.$inputor = $inputor;
      }

      Mirror.prototype.mirrorCss = function() {
        var css,
          _this = this;

        css = {
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: -20000,
          'white-space': 'pre-wrap'
        };
        $.each(this.css_attr, function(i, p) {
          return css[p] = _this.$inputor.css(p);
        });
        return css;
      };

      Mirror.prototype.create = function(html) {
        this.$mirror = $('<div></div>');
        this.$mirror.css(this.mirrorCss());
        this.$mirror.html(html);
        this.$inputor.after(this.$mirror);
        return this;
      };

      Mirror.prototype.rect = function() {
        var $flag, pos, rect;

        $flag = this.$mirror.find("#caret");
        pos = $flag.position();
        rect = {
          left: pos.left,
          top: pos.top,
          height: $flag.height()
        };
        this.$mirror.remove();
        return rect;
      };

      return Mirror;

    })();
    Utils = {
      adjustOffset: function(offset, $inputor) {
        if (!offset) {
          return;
        }
        offset.top += $(window).scrollTop() + $inputor.scrollTop();
        offset.left += +$(window).scrollLeft() + $inputor.scrollLeft();
        return offset;
      },
      contentEditable: function($inputor) {
        return !!($inputor[0].contentEditable && $inputor[0].contentEditable === 'true');
      }
    };
    methods = {
      pos: function(pos) {
        if (pos) {
          return this.setPos(pos);
        } else {
          return this.getPos();
        }
      },
      position: function(pos) {
        if (document.selection) {
          return this.getIEPosition(pos);
        } else {
          return this.getPosition(pos);
        }
      },
      offset: function(pos) {
        return this.getOffset(pos);
      }
    };
    $.fn.caret = function(method) {
      var caret;

      caret = Utils.contentEditable(this) ? new EditableCaret(this) : new InputCaret(this);
      if (methods[method]) {
        return methods[method].apply(caret, Array.prototype.slice.call(arguments, 1));
      } else {
        return $.error("Method " + method + " does not exist on jQuery.caret");
      }
    };
    $.fn.caret.EditableCaret = EditableCaret;
    $.fn.caret.InputCaret = InputCaret;
    $.fn.caret.Utils = Utils;
    return $.fn.caret.apis = methods;
  });

}).call(this);


/**
 * jQuery TextExt Plugin
 * http://textextjs.com
 *
 * @version 1.3.1
 * @copyright Copyright (C) 2011 Alex Gorbatchev. All rights reserved.
 * @license MIT License
 */
(function($)
{
	/**
	 * Tags plugin brings in the traditional tag functionality where user can assemble and
	 * edit list of tags. Tags plugin works especially well together with Autocomplete, Filter,
	 * Suggestions and Ajax plugins to provide full spectrum of features. It can also work on
	 * its own and just do one thing -- tags.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags
	 */
	function TextExtTags() {};

	$.fn.textext.TextExtTags = TextExtTags;
	$.fn.textext.addPlugin('tags', TextExtTags);

	var p = TextExtTags.prototype,

		CSS_DOT             = '.',
		CSS_TAGS_ON_TOP     = 'text-tags-on-top',
		CSS_DOT_TAGS_ON_TOP = CSS_DOT + CSS_TAGS_ON_TOP,
		CSS_TAG             = 'text-tag',
		CSS_DOT_TAG         = CSS_DOT + CSS_TAG,
		CSS_TAGS            = 'text-tags',
		CSS_DOT_TAGS        = CSS_DOT + CSS_TAGS,
		CSS_LABEL           = 'text-label',
		CSS_DOT_LABEL       = CSS_DOT + CSS_LABEL,
		CSS_REMOVE          = 'text-remove',
		CSS_DOT_REMOVE      = CSS_DOT + CSS_REMOVE,

		/**
		 * Tags plugin options are grouped under `tags` when passed to the
		 * `$().textext()` function. For example:
		 *
		 *     $('textarea').textext({
		 *         plugins: 'tags',
		 *         tags: {
		 *             items: [ "tag1", "tag2" ]
		 *         }
		 *     })
		 *
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options
		 */

		/**
		 * This is a toggle switch to enable or disable the Tags plugin. The value is checked
		 * each time at the top level which allows you to toggle this setting on the fly.
		 *
		 * @name tags.enabled
		 * @default true
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.tags.enabled
		 */
		OPT_ENABLED = 'tags.enabled',

		/**
		 * Allows to specify tags which will be added to the input by default upon initialization.
		 * Each item in the array must be of the type that current `ItemManager` can understand.
		 * Default type is `String`.
		 *
		 * @name tags.items
		 * @default null
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.tags.items
		 */
		OPT_ITEMS = 'tags.items',

		/**
		 * HTML source that is used to generate a single tag.
		 *
		 * @name html.tag
		 * @default '<div class="text-tags"/>'
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.html.tag
		 */
		OPT_HTML_TAG  = 'html.tag',

		/**
		 * HTML source that is used to generate container for the tags.
		 *
		 * @name html.tags
		 * @default '<div class="text-tag"><div class="text-button"><span class="text-label"/><a class="text-remove"/></div></div>'
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.options.html.tags
		 */
		OPT_HTML_TAGS = 'html.tags',

		/**
		 * Tags plugin dispatches or reacts to the following events.
		 *
		 * @author agorbatchev
		 * @date 2011/08/17
		 * @id TextExtTags.events
		 */

		/**
		 * Tags plugin triggers the `isTagAllowed` event before adding each tag to the tag list. Other plugins have
		 * an opportunity to interrupt this by setting `result` of the second argument to `false`. For example:
		 *
		 *     $('textarea').textext({...}).bind('isTagAllowed', function(e, data)
		 *     {
		 *         if(data.tag === 'foo')
		 *             data.result = false;
		 *     })
		 *
		 * The second argument `data` has the following format: `{ tag : {Object}, result : {Boolean} }`. `tag`
		 * property is in the format that the current `ItemManager` can understand.
		 *
		 * @name isTagAllowed
		 * @author agorbatchev
		 * @date 2011/08/19
		 * @id TextExtTags.events.isTagAllowed
		 */
		EVENT_IS_TAG_ALLOWED = 'isTagAllowed',

		/**
		 * Tags plugin triggers the `tagClick` event when user clicks on one of the tags. This allows to process
		 * the click and potentially change the value of the tag (for example in case of user feedback).
		 *
		 *     $('textarea').textext({...}).bind('tagClick', function(e, tag, value, callback)
		 *     {
		 *         var newValue = window.prompt('New value', value);

		 *         if(newValue)
		 *             callback(newValue, true);
		 *     })
		 *
		 *  Callback argument has the following signature:
		 *
		 *     function(newValue, refocus)
		 *     {
		 *         ...
		 *     }
		 *
		 * Please check out [example](/manual/examples/tags-changing.html).
		 *
		 * @name tagClick
		 * @version 1.3.0
		 * @author s.stok
		 * @date 2011/01/23
		 * @id TextExtTags.events.tagClick
		 */
		EVENT_TAG_CLICK = 'tagClick',

		DEFAULT_OPTS = {
			tags : {
				enabled : true,
				items   : null
			},

			html : {
				tags : '<div class="text-tags"/>',
				tag  : '<div class="text-tag"><div class="text-button"><span class="text-label"/><a class="text-remove"/></div></div>'
			}
		}
		;

	/**
	 * Initialization method called by the core during plugin instantiation.
	 *
	 * @signature TextExtTags.init(core)
	 *
	 * @param core {TextExt} Instance of the TextExt core class.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.init
	 */
	p.init = function(core)
	{
		this.baseInit(core, DEFAULT_OPTS);
		var self  = this,
			input = self.input(),
			container
			;

		if(self.opts(OPT_ENABLED))
		{
			container = $(self.opts(OPT_HTML_TAGS));
			input.after(container);

			$(self).data('container', container);

			self.on({
				enterKeyPress    : self.onEnterKeyPress,
				backspaceKeyDown : self.onBackspaceKeyDown,
				preInvalidate    : self.onPreInvalidate,
				postInit         : self.onPostInit,
				getFormData      : self.onGetFormData
			});

			self.on(container, {
				click     : self.onClick,
				mousemove : self.onContainerMouseMove
			});

			self.on(input, {
				mousemove : self.onInputMouseMove
			});
		}

		self._originalPadding = {
			left : parseInt(input.css('paddingLeft') || 0),
			top  : parseInt(input.css('paddingTop') || 0)
		};

		self._paddingBox = {
			left : 0,
			top  : 0
		};

		self.updateFormCache();
	};

	/**
	 * Returns HTML element in which all tag HTML elements are residing.
	 *
	 * @signature TextExtTags.containerElement()
	 *
	 * @author agorbatchev
	 * @date 2011/08/15
	 * @id TextExtTags.containerElement
	 */
	p.containerElement = function()
	{
		return $(this).data('container');
	};

	//--------------------------------------------------------------------------------
	// Event handlers

	/**
	 * Reacts to the `postInit` event triggered by the core and sets default tags
	 * if any were specified.
	 *
	 * @signature TextExtTags.onPostInit(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExtTags.onPostInit
	 */
	p.onPostInit = function(e)
	{
		var self = this;
		self.addTags(self.opts(OPT_ITEMS));
	};

	/**
	 * Reacts to the [`getFormData`][1] event triggered by the core. Returns data with the
	 * weight of 200 to be *greater than the Autocomplete plugin* data weight. The weights
	 * system is covered in greater detail in the [`getFormData`][1] event documentation.
	 *
	 * [1]: /manual/textext.html#getformdata
	 *
	 * @signature TextExtTags.onGetFormData(e, data, keyCode)
	 *
	 * @param e {Object} jQuery event.
	 * @param data {Object} Data object to be populated.
	 * @param keyCode {Number} Key code that triggered the original update request.
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtTags.onGetFormData
	 */
	p.onGetFormData = function(e, data, keyCode)
	{
		var self       = this,
			inputValue = keyCode === 13 ? '' : self.val(),
			formValue  = self._formData
			;

		data[200] = self.formDataObject(inputValue, formValue);
	};

	/**
	 * Returns initialization priority of the Tags plugin which is expected to be
	 * *less than the Autocomplete plugin* because of the dependencies. The value is
	 * 100.
	 *
	 * @signature TextExtTags.initPriority()
	 *
	 * @author agorbatchev
	 * @date 2011/08/22
	 * @id TextExtTags.initPriority
	 */
	p.initPriority = function()
	{
		return 100;
	};

	/**
	 * Reacts to user moving mouse over the text area when cursor is over the text
	 * and not over the tags. Whenever mouse cursor is over the area covered by
	 * tags, the tags container is flipped to be on top of the text area which
	 * makes all tags functional with the mouse.
	 *
	 * @signature TextExtTags.onInputMouseMove(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/08
	 * @id TextExtTags.onInputMouseMove
	 */
	p.onInputMouseMove = function(e)
	{
		this.toggleZIndex(e);
	};

	/**
	 * Reacts to user moving mouse over the tags. Whenever the cursor moves out
	 * of the tags and back into where the text input is happening visually,
	 * the tags container is sent back under the text area which allows user
	 * to interact with the text using mouse cursor as expected.
	 *
	 * @signature TextExtTags.onContainerMouseMove(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/08
	 * @id TextExtTags.onContainerMouseMove
	 */
	p.onContainerMouseMove = function(e)
	{
		this.toggleZIndex(e);
	};

	/**
	 * Reacts to the `backspaceKeyDown` event. When backspace key is pressed in an empty text field,
	 * deletes last tag from the list.
	 *
	 * @signature TextExtTags.onBackspaceKeyDown(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/02
	 * @id TextExtTags.onBackspaceKeyDown
	 */
	p.onBackspaceKeyDown = function(e)
	{
		var self    = this,
			lastTag = self.tagElements().last()
			;

		if(self.val().length == 0)
			self.removeTag(lastTag);
	};

	/**
	 * Reacts to the `preInvalidate` event and updates the input box to look like the tags are
	 * positioned inside it.
	 *
	 * @signature TextExtTags.onPreInvalidate(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.onPreInvalidate
	 */
	p.onPreInvalidate = function(e)
	{
		var self    = this,
			lastTag = self.tagElements().last(),
			pos     = lastTag.position()
			;

		if(lastTag.length > 0)
			pos.left += lastTag.innerWidth();
		else
			pos = self._originalPadding;

		self._paddingBox = pos;

		self.input().css({
			paddingLeft : pos.left,
			paddingTop  : pos.top
		});
	};

	/**
	 * Reacts to the mouse `click` event.
	 *
	 * @signature TextExtTags.onClick(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.onClick
	 */
	p.onClick = function(e)
	{
		var self   = this,
			core   = self.core(),
			source = $(e.target),
			focus  = 0,
			tag
			;

		if(source.is(CSS_DOT_TAGS))
		{
			focus = 1;
		}
		else if(source.is(CSS_DOT_REMOVE))
		{
			self.removeTag(source.parents(CSS_DOT_TAG + ':first'));
			focus = 1;
		}
		else if(source.is(CSS_DOT_LABEL))
		{
			tag = source.parents(CSS_DOT_TAG + ':first');
			self.trigger(EVENT_TAG_CLICK, tag, tag.data(CSS_TAG), tagClickCallback);
		}

		function tagClickCallback(newValue, refocus)
		{
			tag.data(CSS_TAG, newValue);
			tag.find(CSS_DOT_LABEL).text(self.itemManager().itemToString(newValue));

			self.updateFormCache();
			core.getFormData();
			core.invalidateBounds();

			if(refocus)
				core.focusInput();
		}

		if(focus)
			core.focusInput();
	};

	/**
	 * Reacts to the `enterKeyPress` event and adds whatever is currently in the text input
	 * as a new tag. Triggers `isTagAllowed` to check if the tag could be added first.
	 *
	 * @signature TextExtTags.onEnterKeyPress(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.onEnterKeyPress
	 */
	p.onEnterKeyPress = function(e)
	{
		var self = this,
			val  = self.val(),
			tag  = self.itemManager().stringToItem(val)
			;

		if(self.isTagAllowed(tag))
		{
			self.addTags([ tag ]);
			// refocus the textarea just in case it lost the focus
			self.core().focusInput();
		}
	};

	//--------------------------------------------------------------------------------
	// Core functionality

	/**
	 * Creates a cache object with all the tags currently added which will be returned
	 * in the `onGetFormData` handler.
	 *
	 * @signature TextExtTags.updateFormCache()
	 *
	 * @author agorbatchev
	 * @date 2011/08/09
	 * @id TextExtTags.updateFormCache
	 */
	p.updateFormCache = function()
	{
		var self   = this,
			result = []
			;

		self.tagElements().each(function()
		{
			result.push($(this).data(CSS_TAG));
		});

		// cache the results to be used in the onGetFormData
		self._formData = result;
	};

	/**
	 * Toggles tag container to be on top of the text area or under based on where
	 * the mouse cursor is located. When cursor is above the text input and out of
	 * any of the tags, the tags container is sent under the text area. If cursor
	 * is over any of the tags, the tag container is brought to be over the text
	 * area.
	 *
	 * @signature TextExtTags.toggleZIndex(e)
	 *
	 * @param e {Object} jQuery event.
	 *
	 * @author agorbatchev
	 * @date 2011/08/08
	 * @id TextExtTags.toggleZIndex
	 */
	p.toggleZIndex = function(e)
	{
		var self            = this,
			offset          = self.input().offset(),
			mouseX          = e.clientX - offset.left,
			mouseY          = e.clientY - offset.top,
			box             = self._paddingBox,
			container       = self.containerElement(),
			isOnTop         = container.is(CSS_DOT_TAGS_ON_TOP),
			isMouseOverText = mouseX > box.left && mouseY > box.top
			;

		if(!isOnTop && !isMouseOverText || isOnTop && isMouseOverText)
			container[(!isOnTop ? 'add' : 'remove') + 'Class'](CSS_TAGS_ON_TOP);
	};

	/**
	 * Returns all tag HTML elements.
	 *
	 * @signature TextExtTags.tagElements()
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.tagElements
	 */
	p.tagElements = function()
	{
		return this.containerElement().find(CSS_DOT_TAG);
	};

	/**
	 * Wrapper around the `isTagAllowed` event which triggers it and returns `true`
	 * if `result` property of the second argument remains `true`.
	 *
	 * @signature TextExtTags.isTagAllowed(tag)
	 *
	 * @param tag {Object} Tag object that the current `ItemManager` can understand.
	 * Default is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.isTagAllowed
	 */
	p.isTagAllowed = function(tag)
	{
		var opts = { tag : tag, result : true };
		this.trigger(EVENT_IS_TAG_ALLOWED, opts);
		return opts.result === true;
	};

	/**
	 * Adds specified tags to the tag list. Triggers `isTagAllowed` event for each tag
	 * to insure that it could be added. Calls `TextExt.getFormData()` to refresh the data.
	 *
	 * @signature TextExtTags.addTags(tags)
	 *
	 * @param tags {Array} List of tags that current `ItemManager` can understand. Default
	 * is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.addTags
	 */
	p.addTags = function(tags)
	{
		if(!tags || tags.length == 0)
			return;

		var self      = this,
			core      = self.core(),
			container = self.containerElement(),
			i, tag
			;

		for(i = 0; i < tags.length; i++)
		{
			tag = tags[i];

			if(tag && self.isTagAllowed(tag))
				container.append(self.renderTag(tag));
		}

		self.updateFormCache();
		core.getFormData();
		core.invalidateBounds();
	};

	/**
	 * Returns HTML element for the specified tag.
	 *
	 * @signature TextExtTags.getTagElement(tag)
	 *
	 * @param tag {Object} Tag object in the format that current `ItemManager` can understand.
	 * Default is `String`.

	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.getTagElement
	 */
	p.getTagElement = function(tag)
	{
		var self = this,
			list = self.tagElements(),
			i, item
			;

		for(i = 0; i < list.length; i++) {
			item = $(list[i]);
			if(self.itemManager().compareItems(item.data(CSS_TAG), tag))
				return item;
		}
		
		return null;
	};

	/**
	 * Removes specified tag from the list. Calls `TextExt.getFormData()` to refresh the data.
	 *
	 * @signature TextExtTags.removeTag(tag)
	 *
	 * @param tag {Object} Tag object in the format that current `ItemManager` can understand.
	 * Default is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.removeTag
	 */
	p.removeTag = function(tag)
	{
		var self = this,
			core = self.core(),
			element
			;

		if(tag instanceof $)
		{
			element = tag;
			tag = tag.data(CSS_TAG);
		}
		else
		{
			element = self.getTagElement(tag);
			if (element === null) {
				//Tag does not exist
				return;
			}
		}

		element.remove();
		self.updateFormCache();
		core.getFormData();
		core.invalidateBounds();
	};

	/**
	 * Creates and returns new HTML element from the source code specified in the `html.tag` option.
	 *
	 * @signature TextExtTags.renderTag(tag)
	 *
	 * @param tag {Object} Tag object in the format that current `ItemManager` can understand.
	 * Default is `String`.
	 *
	 * @author agorbatchev
	 * @date 2011/08/19
	 * @id TextExtTags.renderTag
	 */
	p.renderTag = function(tag)
	{
		var self = this,
			node = $(self.opts(OPT_HTML_TAG))
			;

		node.find('.text-label').text(self.itemManager().itemToString(tag));
		node.data(CSS_TAG, tag);
		return node;
	};
})(jQuery);


/*
  Implement Github like autocomplete mentions
  http://ichord.github.com/At.js

  Copyright (c) 2013 chord.luo@gmail.com
  Licensed under the MIT license.
*/


(function() {
  var __slice = [].slice;

  (function(factory) {
    if (typeof define === 'function' && define.amd) {
      return define(['jquery'], factory);
    } else {
      return factory(window.jQuery);
    }
  })(function($) {
    var $CONTAINER, Api, App, Atwho, Controller, DEFAULT_CALLBACKS, KEY_CODE, Model, View;
    App = (function() {

      function App(inputor) {
        this.current_flag = null;
        this.controllers = {};
        this.$inputor = $(inputor);
        this.listen();
      }

      App.prototype.controller = function(at) {
        return this.controllers[at || this.current_flag];
      };

      App.prototype.set_context_for = function(at) {
        this.current_flag = at;
        return this;
      };

      App.prototype.reg = function(flag, setting) {
        var controller, _base;
        controller = (_base = this.controllers)[flag] || (_base[flag] = new Controller(this, flag));
        if (setting.alias) {
          this.controllers[setting.alias] = controller;
        }
        controller.init(setting);
        return this;
      };

      App.prototype.listen = function() {
        var _this = this;
        return this.$inputor.on('keyup.atwho', function(e) {
          return _this.on_keyup(e);
        }).on('keydown.atwho', function(e) {
          return _this.on_keydown(e);
        }).on('scroll.atwho', function(e) {
          var _ref;
          return (_ref = _this.controller()) != null ? _ref.view.hide() : void 0;
        }).on('blur.atwho', function(e) {
          var c;
          if (c = _this.controller()) {
            return c.view.hide(c.get_opt("display_timeout"));
          }
        });
      };

      App.prototype.dispatch = function() {
        var _this = this;
        return $.map(this.controllers, function(c) {
          if (c.look_up()) {
            return _this.set_context_for(c.at);
          }
        });
      };

      App.prototype.on_keyup = function(e) {
        var _ref;
        switch (e.keyCode) {
          case KEY_CODE.ESC:
            e.preventDefault();
            if ((_ref = this.controller()) != null) {
              _ref.view.hide();
            }
            break;
          case KEY_CODE.DOWN:
          case KEY_CODE.UP:
            $.noop();
            break;
          default:
            this.dispatch();
        }
      };

      App.prototype.on_keydown = function(e) {
        var view, _ref;
        view = (_ref = this.controller()) != null ? _ref.view : void 0;
        if (!(view && view.visible())) {
          return;
        }
        switch (e.keyCode) {
          case KEY_CODE.ESC:
            e.preventDefault();
            view.hide();
            break;
          case KEY_CODE.UP:
            e.preventDefault();
            view.prev();
            break;
          case KEY_CODE.DOWN:
            e.preventDefault();
            view.next();
            break;
          case KEY_CODE.TAB:
          case KEY_CODE.ENTER:
            if (!view.visible()) {
              return;
            }
            e.preventDefault();
            view.choose();
            break;
          default:
            $.noop();
        }
      };

      return App;

    })();
    Controller = (function() {
      var uuid, _uuid;

      _uuid = 0;

      uuid = function() {
        return _uuid += 1;
      };

      function Controller(app, at) {
        this.app = app;
        this.at = at;
        this.$inputor = this.app.$inputor;
        this.id = this.$inputor[0].id || uuid();
        this.setting = null;
        this.query = null;
        this.pos = 0;
        this.cur_rect = null;
        this.range = null;
        $CONTAINER.append(this.$el = $("<div id='atwho-ground-" + this.id + "'></div>"));
        this.model = new Model(this);
        this.view = new View(this);
      }

      Controller.prototype.init = function(setting) {
        this.setting = $.extend({}, this.setting || $.fn.atwho["default"], setting);
        this.view.init();
        return this.model.reload(this.setting.data);
      };

      Controller.prototype.call_default = function() {
        var args, func_name;
        func_name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        try {
          return DEFAULT_CALLBACKS[func_name].apply(this, args);
        } catch (error) {
          return $.error("" + error + " Or maybe At.js doesn't have function " + func_name);
        }
      };

      Controller.prototype.trigger = function(name, data) {
        var alias, event_name;
        data.push(this);
        alias = this.get_opt('alias');
        event_name = alias ? "" + name + "-" + alias + ".atwho" : "" + name + ".atwho";
        return this.$inputor.trigger(event_name, data);
      };

      Controller.prototype.callbacks = function(func_name) {
        return this.get_opt("callbacks")[func_name] || DEFAULT_CALLBACKS[func_name];
      };

      Controller.prototype.get_opt = function(at, default_value) {
        try {
          return this.setting[at];
        } catch (e) {
          return null;
        }
      };

      Controller.prototype.content = function() {
        if (this.$inputor.is('textarea, input')) {
          return this.$inputor.val();
        } else {
          return this.$inputor.text();
        }
      };

      Controller.prototype.catch_query = function() {
        var caret_pos, content, end, query, start, subtext;
        content = this.content();
        caret_pos = this.$inputor.caret('pos');
        subtext = content.slice(0, caret_pos);
        query = this.callbacks("matcher").call(this, this.at, subtext, this.get_opt('start_with_space'));
        if (typeof query === "string" && query.length <= this.get_opt('max_len', 20)) {
          start = caret_pos - query.length;
          end = start + query.length;
          this.pos = start;
          query = {
            'text': query.toLowerCase(),
            'head_pos': start,
            'end_pos': end
          };
          this.trigger("matched", [this.at, query.text]);
        } else {
          this.view.hide();
        }
        return this.query = query;
      };

      Controller.prototype.rect = function() {
        var c, scale_bottom;
        if (!(c = this.$inputor.caret('offset', this.pos - 1))) {
          return;
        }
        if (this.$inputor.attr('contentEditable') === 'true') {
          c = (this.cur_rect || (this.cur_rect = c)) || c;
        }
        scale_bottom = document.selection ? 0 : 2;
        return {
          left: c.left,
          top: c.top,
          bottom: c.top + c.height + scale_bottom
        };
      };

      Controller.prototype.reset_rect = function() {
        if (this.$inputor.attr('contentEditable') === 'true') {
          return this.cur_rect = null;
        }
      };

      Controller.prototype.mark_range = function() {
        return this.range = this.get_range() || this.get_ie_range();
      };

      Controller.prototype.clear_range = function() {
        return this.range = null;
      };

      Controller.prototype.get_range = function() {
        return this.range || (window.getSelection ? window.getSelection().getRangeAt(0) : void 0);
      };

      Controller.prototype.get_ie_range = function() {
        return this.range || (document.selection ? document.selection.createRange() : void 0);
      };

      Controller.prototype.insert_content_for = function($li) {
        var data, data_value, tpl;
        data_value = $li.data('value');
        tpl = this.get_opt('insert_tpl');
        if (this.$inputor.is('textarea, input') || !tpl) {
          return data_value;
        }
        data = $.extend({}, $li.data('item-data'), {
          'atwho-data-value': data_value,
          'atwho-at': this.at
        });
        return this.callbacks("tpl_eval").call(this, tpl, data);
      };

      Controller.prototype.insert = function(content, $li) {
        var $inputor, $insert_node, class_name, content_node, insert_node, pos, range, sel, source, start_str, text;
        $inputor = this.$inputor;
        if ($inputor.attr('contentEditable') === 'true') {
          class_name = "atwho-view-flag atwho-view-flag-" + (this.get_opt('alias') || this.at);
          content_node = "" + content + "<span contenteditable='false'>&nbsp;<span>";
          insert_node = "<span contenteditable='false' class='" + class_name + "'>" + content_node + "</span>";
          $insert_node = $(insert_node).data('atwho-data-item', $li.data('item-data'));
          if (document.selection) {
            $insert_node = $("<span contenteditable='true'></span>").html($insert_node);
          }
        }
        if ($inputor.is('textarea, input')) {
          content = '' + content;
          source = $inputor.val();
          start_str = source.slice(0, Math.max(this.query.head_pos - this.at.length, 0));
          text = "" + start_str + content + " " + (source.slice(this.query['end_pos'] || 0));
          $inputor.val(text);
          $inputor.caret('pos', start_str.length + content.length + 1);
        } else if (range = this.get_range()) {
          pos = range.startOffset - (this.query.end_pos - this.query.head_pos) - this.at.length;
          range.setStart(range.endContainer, Math.max(pos, 0));
          range.setEnd(range.endContainer, range.endOffset);
          range.deleteContents();
          range.insertNode($insert_node[0]);
          range.collapse(false);
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else if (range = this.get_ie_range()) {
          range.moveStart('character', this.query.end_pos - this.query.head_pos - this.at.length);
          range.pasteHTML($insert_node[0]);
          range.collapse(false);
          range.select();
        }
        $inputor.focus();
        return $inputor.change();
      };

      Controller.prototype.render_view = function(data) {
        var search_key;
        search_key = this.get_opt("search_key");
        data = this.callbacks("sorter").call(this, this.query.text, data.slice(0, 1001), search_key);
        return this.view.render(data.slice(0, this.get_opt('limit')));
      };

      Controller.prototype.look_up = function() {
        var query, _callback;
        if (!(query = this.catch_query())) {
          return;
        }
        _callback = function(data) {
          if (data && data.length > 0) {
            return this.render_view(data);
          } else {
            return this.view.hide();
          }
        };
        this.model.query(query.text, $.proxy(_callback, this));
        return query;
      };

      return Controller;

    })();
    Model = (function() {
      var _storage;

      _storage = {};

      function Model(context) {
        this.context = context;
        this.at = this.context.at;
      }

      Model.prototype.saved = function() {
        return this.fetch() > 0;
      };

      Model.prototype.query = function(query, callback) {
        var data, search_key, _ref;
        data = this.fetch();
        search_key = this.context.get_opt("search_key");
        callback(data = this.context.callbacks('filter').call(this.context, query, data, search_key));
        if (!(data && data.length > 0)) {
          return (_ref = this.context.callbacks('remote_filter')) != null ? _ref.call(this.context, query, callback) : void 0;
        }
      };

      Model.prototype.fetch = function() {
        return _storage[this.at] || [];
      };

      Model.prototype.save = function(data) {
        return _storage[this.at] = this.context.callbacks("before_save").call(this.context, data || []);
      };

      Model.prototype.load = function(data) {
        if (!(this.saved() || !data)) {
          return this._load(data);
        }
      };

      Model.prototype.reload = function(data) {
        return this._load(data);
      };

      Model.prototype._load = function(data) {
        var _this = this;
        if (typeof data === "string") {
          return $.ajax(data, {
            dataType: "json"
          }).done(function(data) {
            return _this.save(data);
          });
        } else {
          return this.save(data);
        }
      };

      return Model;

    })();
    View = (function() {

      function View(context) {
        this.context = context;
        this.$el = $("<div class='atwho-view'><ul class='atwho-view-ul'></ul></div>");
        this.timeout_id = null;
        this.context.$el.append(this.$el);
        this.bind_event();
      }

      View.prototype.init = function() {
        var id;
        id = this.context.get_opt("alias") || this.context.at.charCodeAt(0);
        return this.$el.attr({
          'id': "at-view-" + id
        });
      };

      View.prototype.bind_event = function() {
        var $menu,
          _this = this;
        $menu = this.$el.find('ul');
        $menu.on('mouseenter.atwho-view', 'li', function(e) {
          $menu.find('.cur').removeClass('cur');
          return $(e.currentTarget).addClass('cur');
        }).on('click', function(e) {
          _this.choose();
          return e.preventDefault();
        });
        return this.$el.on('mouseenter.atwho-view', 'ul', function(e) {
          return _this.context.mark_range();
        }).on('mouseleave.atwho-view', 'ul', function(e) {
          return _this.context.clear_range();
        });
      };

      View.prototype.visible = function() {
        return this.$el.is(":visible");
      };

      View.prototype.choose = function() {
        var $li, content;
        $li = this.$el.find(".cur");
        content = this.context.insert_content_for($li);
        this.context.insert(this.context.callbacks("before_insert").call(this.context, content, $li), $li);
        this.context.trigger("inserted", [$li]);
        return this.hide();
      };

      View.prototype.reposition = function(rect) {
        var offset;
        if (rect.bottom + this.$el.height() - $(window).scrollTop() > $(window).height()) {
          rect.bottom = rect.top - this.$el.height();
        }
        offset = {
          left: rect.left,
          top: rect.bottom
        };
        this.$el.offset(offset);
        return this.context.trigger("reposition", [offset]);
      };

      View.prototype.next = function() {
        var cur, next;
        cur = this.$el.find('.cur').removeClass('cur');
        next = cur.next();
        if (!next.length) {
          next = this.$el.find('li:first');
        }
        return next.addClass('cur');
      };

      View.prototype.prev = function() {
        var cur, prev;
        cur = this.$el.find('.cur').removeClass('cur');
        prev = cur.prev();
        if (!prev.length) {
          prev = this.$el.find('li:last');
        }
        return prev.addClass('cur');
      };

      View.prototype.show = function() {
        var rect;
        if (!this.visible()) {
          this.$el.show();
        }
        if (rect = this.context.rect()) {
          return this.reposition(rect);
        }
      };

      View.prototype.hide = function(time) {
        var callback,
          _this = this;
        if (isNaN(time && this.visible())) {
          this.context.reset_rect();
          return this.$el.hide();
        } else {
          callback = function() {
            return _this.hide();
          };
          clearTimeout(this.timeout_id);
          return this.timeout_id = setTimeout(callback, time);
        }
      };

      View.prototype.render = function(list) {
        var $li, $ul, item, li, tpl, _i, _len;
        if (!$.isArray(list || list.length <= 0)) {
          this.hide();
          return;
        }
        this.$el.find('ul').empty();
        $ul = this.$el.find('ul');
        tpl = this.context.get_opt('tpl');
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          item = list[_i];
          item = $.extend({}, item, {
            'atwho-at': this.context.at
          });
          li = this.context.callbacks("tpl_eval").call(this.context, tpl, item);
          $li = $(this.context.callbacks("highlighter").call(this.context, li, this.context.query.text));
          $li.data("item-data", item);
          $ul.append($li);
        }
        this.show();
        return $ul.find("li:first").addClass("cur");
      };

      return View;

    })();
    KEY_CODE = {
      DOWN: 40,
      UP: 38,
      ESC: 27,
      TAB: 9,
      ENTER: 13
    };
    DEFAULT_CALLBACKS = {
      before_save: function(data) {
        var item, _i, _len, _results;
        if (!$.isArray(data)) {
          return data;
        }
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          item = data[_i];
          if ($.isPlainObject(item)) {
            _results.push(item);
          } else {
            _results.push({
              name: item
            });
          }
        }
        return _results;
      },
      matcher: function(flag, subtext, should_start_with_space) {
        var match, regexp;
        flag = flag.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        if (should_start_with_space) {
          flag = '(?:^|\\s)' + flag;
        }
        regexp = new RegExp(flag + '([A-Za-z0-9_\+\-]*)$|' + flag + '([^\\x00-\\xff]*)$', 'gi');
        match = regexp.exec(subtext);
        if (match) {
          return match[2] || match[1];
        } else {
          return null;
        }
      },
      filter: function(query, data, search_key) {
        var item, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          item = data[_i];
          if (~item[search_key].toLowerCase().indexOf(query)) {
            _results.push(item);
          }
        }
        return _results;
      },
      remote_filter: null,
      sorter: function(query, items, search_key) {
        var item, _i, _len, _results;
        if (!query) {
          return items;
        }
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          item.atwho_order = item[search_key].toLowerCase().indexOf(query);
          if (item.atwho_order > -1) {
            _results.push(item);
          }
        }
        return _results.sort(function(a, b) {
          return a.atwho_order - b.atwho_order;
        });
      },
      tpl_eval: function(tpl, map) {
        try {
          return tpl.replace(/\$\{([^\}]*)\}/g, function(tag, key, pos) {
            return map[key];
          });
        } catch (error) {
          return "";
        }
      },
      highlighter: function(li, query) {
        var regexp;
        if (!query) {
          return li;
        }
        regexp = new RegExp(">\\s*(\\w*)(" + query.replace("+", "\\+") + ")(\\w*)\\s*<", 'ig');
        return li.replace(regexp, function(str, $1, $2, $3) {
          return '> ' + $1 + '<strong>' + $2 + '</strong>' + $3 + ' <';
        });
      },
      before_insert: function(value, $li) {
        return value;
      }
    };
    Api = {
      load: function(at, data) {
        var c;
        if (c = this.controller(at)) {
          return c.model.load(data);
        }
      },
      getInsertedItemsWithIDs: function(at) {
        var c, ids, items;
        if (!(c = this.controller(at))) {
          return [null, null];
        }
        if (at) {
          at = "-" + (c.get_opt('alias') || c.at);
        }
        ids = [];
        items = $.map(this.$inputor.find("span.atwho-view-flag" + (at || "")), function(item) {
          var data;
          data = $(item).data('atwho-data-item');
          if (ids.indexOf(data.id) > -1) {
            return;
          }
          if (data.id) {
            ids.push = data.id;
          }
          return data;
        });
        return [ids, items];
      },
      getInsertedItems: function(at) {
        return Api.getInsertedItemsWithIDs.apply(this, [at])[1];
      },
      getInsertedIDs: function(at) {
        return Api.getInsertedItemsWithIDs.apply(this, [at])[0];
      },
      run: function() {
        return this.dispatch();
      }
    };
    Atwho = {
      init: function(options) {
        var $this, app;
        app = ($this = $(this)).data("atwho");
        if (!app) {
          $this.data('atwho', (app = new App(this)));
        }
        app.reg(options.at, options);
        return this;
      }
    };
    $CONTAINER = $("<div id='atwho-container'></div>");
    $.fn.atwho = function(method) {
      var result, _args;
      _args = arguments;
      $('body').append($CONTAINER);
      result = null;
      this.filter('textarea, input, [contenteditable=true]').each(function() {
        var app;
        if (typeof method === 'object' || !method) {
          return Atwho.init.apply(this, _args);
        } else if (Api[method]) {
          if (app = $(this).data('atwho')) {
            return result = Api[method].apply(app, Array.prototype.slice.call(_args, 1));
          }
        } else {
          return $.error("Method " + method + " does not exist on jQuery.caret");
        }
      });
      return result || this;
    };
    return $.fn.atwho["default"] = {
      at: void 0,
      alias: void 0,
      data: null,
      tpl: "<li data-value='${atwho-at}${name}'>${name}</li>",
      insert_tpl: "<span>${atwho-data-value}</span>",
      callbacks: DEFAULT_CALLBACKS,
      search_key: "name",
      start_with_space: true,
      limit: 5,
      max_len: 20,
      display_timeout: 300
    };
  });

}).call(this);



/*
Our code:
Anything of class namepicker gets a textext namepicker
*/


var multinamepickerconfig = {
      plugins : 'tags autocomplete',
      html : {
          suggestion : '<div class="text-suggestion"><div class="text-label"></div></div>'
      },    
      autocomplete: {
          render: function(suggestion) {
              var pic = 'http://' + s3_user_files_host + '/u/' + userhash[suggestion].pic + '/profile_photo.jpg';   
              return '<img src="' + pic + '"> <div>' + userhash[suggestion].full + '</div>';
          }
      },
      ext: {
          tags: {
              renderTag: function(tag) {
          		var self = this, node = $(self.opts('html.tag'));
         		if (userhash[tag]) {
          		    var full = userhash[tag].full.replace('_',' ');
          		    node.find('.text-label').text(full);
          		    node.data('text-tag', tag);
          		    return node;
          		} else {
          		    return tag;
          		}    
              }
          },
      }
  };
  
$(function() {
  $('.spacenamepicker')
    .textext({
        plugins : 'autocomplete',
    })
    .bind('getSuggestions',function(e, data) {
      var query = (data ? data.query : '') || '';
      var textext = $(e.target).textext()[0];
      $(this).trigger(
          'setSuggestions',
          { result : textext.itemManager().filter(spacenames, query) }
      );
    }); 

  var cur_namepick_username = '';
  var cur_namepick_realname = '';
  $('.namepicker')
    .textext({
        plugins : 'autocomplete',
        html : {
            hidden : '<input type="hidden" />',
            suggestion : '<div class="text-suggestion"><div class="text-label"></div></div>'
        },    
        autocomplete: {
            render: function(suggestion) {
                var pic = 'http://' + s3_user_files_host + '/u/' + userhash[suggestion].pic + '/profile_photo.jpg';   
                return '<img src="' + pic + '"> <div>' + userhash[suggestion].full + '</div>';
            }
        },
        ext: {
            core: {
                serializeData: function(data) {
                    if (data == cur_namepick_realname) {
                        return cur_namepick_username;
                    } else {
                        return data;
                    }
                }
            },
            itemManager: {
                  itemToString: function(item) {
                      cur_namepick_username = item;
                      cur_namepick_realname = userhash[item].full.replace('_',' ')
                      return cur_namepick_realname;
                  },
              }
        }
    })
    .bind('getSuggestions',function(e, data) {
      var query = (data ? data.query : '') || '';
      var textext = $(e.target).textext()[0];
      $(this).trigger(
          'setSuggestions',
          { result : textext.itemManager().filter(usernames, query) }
      );
    }); 

  $('.multinamepicker').textext(multinamepickerconfig)
      .bind('getSuggestions',function(e, data) {
        var query = (data ? data.query : '') || '';
        var textext = $(e.target).textext()[0];
        $(this).trigger(
            'setSuggestions',
            { result : textext.itemManager().filter(usernames, query) }
        );
      }); 
  
});

/*
Any textarea of class atnamepicker, or under such a class, gets an atwho namepicker
*/

$(function() { 
  $('.atnamepicker, .atnamepicker textarea').atwho('run').atwho({
      at: "@",
      tpl: '<li data-value="@$'+'{name}"><img src="http://'+s3_user_files_host+'/u/$'+'{pic}/profile_photo.jpg"> <div>$'+'{full}</div></li>',
      data: userdata
  });
});


function printObject(o) {
  var out = '';
  for (var p in o) {
    out += p + ': ' + o[p] + '\n';
  }
  alert(out);
}
