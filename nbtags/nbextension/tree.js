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

    var init_nbtags = function() {
        load_extension();

        console.log(log_prefix, 'Loaded')
    };

    return {
        load_ipython_extension : init_nbtags,
        load_jupyter_extension : init_nbtags
    };
});
