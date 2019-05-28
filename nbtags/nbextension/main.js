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

    var notebook_tag = null;
    var cell_tags = [];
    var visible = false;

    function init_events() {
        events.on('create.Cell', function (e, data) {
            setTimeout(function() {
                extend_cell(data.cell);
            }, 0);
        });
    }

    function attach_notebook_tag() {
        var t = new tagging.NotebookPageTag(Jupyter.notebook);
        notebook_tag = t;
        t.createElement(function(child) {
            $('#notebook').append(child.addClass('nbtags-notebook-base'));
            tagging.check_content(t);
        });
        if (visible) {
            t.show();
        }
    }

    function extend_cell(cell) {
        var t = new tagging.CellTag(cell);
        cell_tags.push(t);
        t.createElement(function(child) {
            cell.element.append(child);
            tagging.check_content(t);
        });
        if (visible) {
            t.show();
        }
    }

    function on_notebook_saved() {
        cell_tags.filter(function(t) {
            return t.hasMEME == false;
        }).forEach(function(t) {
            console.log(log_prefix, 'Without MEME', t);
            if (t.cell.metadata['lc_cell_meme']) {
                t.createElement(function(child) {
                    tagging.check_content(t);
                });
            }
        });
        if (notebook_tag != null && notebook_tag.hasMEME == false) {
            var t = notebook_tag;
            if (t.notebook.metadata['lc_notebook_meme']) {
                t.createElement(function(child) {
                    tagging.check_content(t);
                });
            }
        }
    }

    function toggle() {
        visible = $('#toggle-sidestickies').attr('aria-pressed') == 'false';
        cell_tags.forEach(function(t) {
            if (visible) {
                t.show();
            } else {
                t.hide();
            }
        });
        var t = notebook_tag;
        if (t) {
            if (visible) {
                t.show();
            } else {
                t.hide();
            }
        }
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
        var buttons = [Jupyter.keyboard_manager.actions.register({
                    'help'   : 'Sidestickies',
                    'icon'   : 'fa-comments',
                    'handler': function() { toggle(); },
                }, 'toggle-sidestickies', 'sidestickies')];
        Jupyter.toolbar.add_buttons_group(buttons)
            .find('.btn')
            .attr('id', 'toggle-sidestickies')
            .attr('data-toggle', 'button')
            .attr('aria-pressed', 'false');
    }

    var init_nbtags = function() {
        load_extension();
        register_toolbar_buttons();

        /**
        * execute this extension on load
        */
        var on_notebook_loaded = function() {
            attach_notebook_tag();

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
            events.on('notebook_saved.Notebook', on_notebook_saved);
        }).catch(function on_error(reason) {
            console.error(log_prefix, 'Error:', reason);
        });
    };

    return {
        load_ipython_extension : init_nbtags,
        load_jupyter_extension : init_nbtags
    };
});
