define([
    'base/js/namespace',
    'jquery',
    'require',
    'base/js/events',
    'services/config',
    './tagging'
], function(Jupyter, $, require, events, configmod, tagging) {
    "use strict";

    var mod_name = 'NBTags';
    var log_prefix = '[' + mod_name + ']';

    // defaults, overridden by server's config
    var options = {};

    function init_events() {
        events.on('create.Cell', function (e, data) {
            setTimeout(function() {
                extend_cell(data.cell);
            }, 0);
        });
    }

    function extend_cell(cell) {
        var t = new tagging.CellTag(cell);
        t.createElement(function(child) {
            cell.element.append(child);
            tagging.check_content(t);
        });
    }

    /* Load additional CSS */
    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name, 'css');
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    var load_extension = function() {
        load_css('./main.css');
    };

    function register_toolbar_buttons() {
        var buttons = [];

        Jupyter.toolbar.add_buttons_group(buttons);
    }

    var init_nbtags = function() {
        load_extension();
        register_toolbar_buttons();

        /**
        * execute this extension on load
        */
        var on_notebook_loaded = function() {
            Jupyter.notebook.get_cells().forEach(function(cell, index, array) {
                extend_cell(cell);
            });
            init_events();
        };

        Jupyter.notebook.config.loaded.then(function on_config_loaded() {
            $.extend(true, options, Jupyter.notebook.config.data[mod_name]);
        }, function on_config_load_error(reason) {
            console.warn(log_prefix, 'Using defaults after error loading config:', reason);
        }).then(function do_stuff_with_config() {
            events.on("notebook_loaded.Notebook", on_notebook_loaded);
            if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
                on_notebook_loaded();
            }
        }).catch(function on_error(reason) {
            console.error(log_prefix, 'Error:', reason);
        });
    };

    return {
        load_ipython_extension : init_nbtags,
        load_jupyter_extension : init_nbtags
    };
});
