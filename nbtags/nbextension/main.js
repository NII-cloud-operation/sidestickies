define([
    'base/js/namespace',
    'jquery',
    'require',
    'base/js/events',
    //'base/js/dialog',
    'services/config',
    //'base/js/utils',
], function(Jupyter, $, require, events /*, jsdialog*/, configmod /*, utils*/) {
    "use strict";

    var mod_name = 'NBTags';
    var log_prefix = '[' + mod_name + ']';

    // defaults, overridden by server's config
    var options = {};

    var tags = [];
    var loading = false;

    function check_content(tag) {
        if (loading) {
            tags.push(tag);
        } else {
            loading = true;
            tag.checkContent(_check_content);
        }
    }

    function _check_content() {
        loading = false;

        if (tags.length > 0) {
            var tag = tags.shift();
            loading = true;
            tag.checkContent(_check_content);
        }
    }

    function init_events() {
        events.on('create.Cell', function (e, data) {
            setTimeout(function() {
                extend_cell(data.cell);
            }, 0);
        });
    }

    function Tag(cell) {
        this.cell = cell;
    }

    Tag.prototype.checkContent = function(finished) {
        var meme = this.cell.metadata['lc_cell_meme'];
        if (!meme) {
            finished();
            return;
        }
        var url = Jupyter.notebook.base_url + 'nbtags/cell/' + meme['current'];
        var self = this;
        $.ajax({
            url: url,
            dataType: 'json',
            async: false,
            success: function (json) {
                console.log(self, meme, json);
                if (json['summary']) {
                    var c = $('.nbtags-tag', self.element);
                    c.empty();
                    c.append($('<a></a>')
                        .append(json['summary']['description'])
                        .click(function() {
                                   window.open(json['summary']['page_url']);
                               }));
                }
                finished();
            }
        });
    };

    Tag.prototype.create = function() {
        var url = Jupyter.notebook.base_url + 'nbtags/cell';
        console.log(this.cell.toJSON());
        $.ajax({
            url: url + '?cell=' + encodeURIComponent(JSON.stringify(this.cell.toJSON())),
            dataType: 'json',
            async: false,
            success: function (json) {
                console.log(json);
                window.open(json['create_url']);
            }
        })
    };

    Tag.prototype.createElement = function() {
        var content;
        var meme = this.cell.metadata['lc_cell_meme'];
        if (meme) {
            var self = this;
            content = $('<span></span>')
                          .addClass('nbtags-tag')
                          .append($('<a><i class="fa fa-plus"></i></a>')
                              .click(function() {
                                  self.create();
                              }));
        } else {
            content = $('<span></span>')
        }
        this.element = $('<div></div>')
                           .addClass('nbtags-base')
                           .append(content);
        return this.element;
    };

    function extend_cell(cell) {
        var t = new Tag(cell);
        cell.element.append(t.createElement());
        check_content(t);
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
