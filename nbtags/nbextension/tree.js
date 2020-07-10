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

    var tags = [];
    var cached_tags = [];
    var last_url = null;
    var visible = false;

    const scan_tree_interval_ms = 500;
    let scan_tree_timer_id = null;
    let scan_tree_last_time = Date.now();

    function extend_file(item) {
        var a = item.find('a');
        var path = a.attr('href');
        if (! path) {
            return path;
        }
        var itemName = a.find('.item_name').text();
        if (itemName === undefined) {
            return undefined;
        }
        var pathPart = /^(\/user\/[^\/]+)?\/notebooks(\/.+)$/.exec(path);
        if (! pathPart) {
            return undefined;
        }
        var contentPath = pathPart[2];
        var old = tags.filter(function(t) {
            return t.path == contentPath;
        });
        if (old.length > 0) {
            const t = old[0];
            const itemElement = item.find('.col-md-12');
            if (itemElement.find('.nbtags-base').length === 0) {
                console.log(log_prefix, 'Reattachment', contentPath, itemName);
                t.createElement(function(child) {
                    itemElement.append(child);
                    if (t.cachedJSON) {
                        t.updateContent(t.cachedJSON);
                    } else {
                        tagging.check_content(t);
                    }
                });
                if (visible) {
                    t.show();
                }
            }
            return contentPath;
        }
        var cached = cached_tags.filter(function(t) {
            return t.path == contentPath;
        });
        if (cached.length > 0) {
            console.log(log_prefix, 'Reusing', contentPath, itemName);
            var t = cached[0];
            tags.push(t);
            t.createElement(function(child) {
                item.find('.col-md-12').append(child);
                if (t.cachedJSON) {
                    t.updateContent(t.cachedJSON);
                } else {
                    tagging.check_content(t);
                }
            });
            if (visible) {
                t.show();
            }
        } else {
            console.log(log_prefix, 'Creating', contentPath, itemName);
            var t = new tagging.NotebookTag(contentPath);
            tags.push(t);
            cached_tags.push(t);
            t.createElement(function(child) {
                item.find('.col-md-12').append(child);
                tagging.check_content(t);
            });
            if (visible) {
                t.show();
            }
        }
        return contentPath;
    }

    function _remove_tags(tags, actives) {
        var removed = tags.map(function(t1, index) {
            var exists = actives.find(function(t2) {
                return t1.path == t2;
            });
            return {'index': index, 'notexists': exists === undefined,
                    'tag': t1};
        }).filter(function(e) {
            return e['notexists'];
        });
        removed.reverse().forEach(function(e) {
            console.log('Removed', e['tag']);
            tags.splice(e['index'], 1);
        });
        return removed.length;
    }

    function scan_tree() {
        if (scan_tree_timer_id) return;
        const elapsed = Date.now() - scan_tree_last_time;
        if (elapsed > scan_tree_interval_ms) {
            _scan_tree();
        } else {
            scan_tree_timer_id = setTimeout(() => {
                scan_tree_timer_id = null;
                _scan_tree();
            }, scan_tree_interval_ms - elapsed);
        }
    }

    function _scan_tree() {
        scan_tree_last_time = Date.now();
        var actives = [];
        $('#notebook_list .list_item').each(function(i, e) {
            var path = extend_file($(e));
            if (path) {
                actives.push(path);
            }
        });
        _remove_tags(tags, actives);
        if (window.location.href != last_url) {
            var removed = _remove_tags(cached_tags, actives);
            console.log(log_prefix, 'Removed', removed);
            last_url = window.location.href;
        }
    }

    function toggle() {
        visible = $(this).attr('aria-pressed') == 'false';
        tags.forEach(function(t) {
            if (visible) {
                t.show();
            } else {
                t.hide();
            }
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

    var init_nbtags = function() {
        load_extension();

        scan_tree();
        const observer = new MutationObserver((mutations) => {
            const filtered = mutations.filter(mutation => $(mutation.target).closest('.nbtags-base').length === 0);
            if (filtered.length > 0) {
                scan_tree();
            }
        });
        observer.observe($("#notebook_list").get(0), {
            attributes: true,
            characterData: true,
            subtree: true
        });
        var toggle_button = $('<button></button>')
                                .addClass('btn btn-default btn-xs')
                                .attr('data-toggle', 'button')
                                .attr('aria-pressed', 'false')
                                .append($('<i></i>').addClass('fa fa-comments'))
                                .append($('<span></span>').text(' Sidestickies'));
        toggle_button.click(toggle);
        $('#new-buttons').parent().prepend(toggle_button);
        console.log(log_prefix, 'Loaded')
    };

    return {
        load_ipython_extension : init_nbtags,
        load_jupyter_extension : init_nbtags
    };
});
