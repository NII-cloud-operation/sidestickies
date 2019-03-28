define([
    'base/js/namespace',
    'jquery'
], function(Jupyter, $) {
    "use strict";

    var mod_name = 'NBTags';
    var log_prefix = '[' + mod_name + ']';

    var tags = [];
    var loading = 0;

    var loading_interval_ms = 1000 * 2;
    var refresh_interval_ms = 1000 * 60 * 10;

    function refresh(tag) {
        console.log('Refresh', tag);
        $('.nbtags-refresh', tag.element).addClass('fa-spin');
        tag.checkContent(function() {
            $('.nbtags-refresh', tag.element).removeClass('fa-spin');
        });
    }

    function check_content(tag) {
        $('.nbtags-refresh', tag.element).addClass('fa-spin');
        if (loading > 0) {
            tags.push(tag);
        } else {
            loading ++;
            setTimeout(function() {
                tag.checkContent(_check_content);
            }, loading_interval_ms);
        }
    }

    function _check_content(ptag) {
        loading --;
        $('.nbtags-refresh', ptag.element).removeClass('fa-spin');

        setTimeout(function() {
            check_content(ptag);
        }, refresh_interval_ms);

        if (tags.length > 0) {
            var tag = tags.shift();
            loading ++;
            setTimeout(function() {
                tag.checkContent(_check_content);
            }, loading_interval_ms);
        }
    }

    function Tag(cell) {
        this.cell = cell;
    }

    Tag.prototype.checkContent = function(finished) {
        var meme = this.cell.metadata['lc_cell_meme'];
        if (!meme) {
            finished(this);
            return;
        }
        console.log('Check content', meme);
        var url = Jupyter.notebook.base_url + 'nbtags/cell/' + meme['current'];
        var self = this;
        $.ajax({
            url: url,
            dataType: 'json',
            success: function (json) {
                console.log(self, meme, json);
                var c = $('.nbtags-tag', self.element);
                c.empty();
                c.append($('<i class="fa fa-refresh nbtags-refresh"></i>')
                             .click(function() {
                                 refresh(self);
                             }));
                if (json['summary']) {
                    var desc = '';
                    var summary = json['summary'];
                    if (summary['description']) {
                        desc = summary['description'] + ' ';
                    }
                    c.addClass('nbtags-has-page')
                     .append($('<span></span>')
                        .append(desc)
                        .append($('<i class="fa fa-comments"></i>'))
                        .append(summary['count'])
                        .click(function() {
                                   if (! summary['has_code']) {
                                       var url = Jupyter.notebook.base_url + 'nbtags/cell';
                                       var curl = url + '?title=' + encodeURIComponent(summary['title']) +
                                                  '&mode=edit' +
                                                  '&cell=' + encodeURIComponent(JSON.stringify(self.cell.toJSON()));
                                       window.open(curl);
                                   } else {
                                       window.open(summary['page_url']);
                                   }
                               }));
                } else {
                    c.append($('<i class="fa fa-comment"></i>')
                        .click(function() {
                                   self.create();
                               }));
                }
                finished(self);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(textStatus, errorThrown);
                var c = $('.nbtags-tag', self.element);
                c.empty();
                c.append($('<i class="fa fa-refresh nbtags-refresh"></i>')
                             .click(function() {
                                 refresh(self);
                             }))
                     .append('<span class="nbtags-error">!</span>');
                finished(self);
            }
        });
    };

    Tag.prototype.create = function() {
        var url = Jupyter.notebook.base_url + 'nbtags/cell';
        console.log(this.cell.toJSON());
        var cellurl = url + '?cell=' + encodeURIComponent(JSON.stringify(this.cell.toJSON()));
        window.open(cellurl);
    };

    Tag.prototype.createElement = function() {
        var content;
        var meme = this.cell.metadata['lc_cell_meme'];
        if (meme) {
            var self = this;
            content = $('<span></span>')
                          .addClass('nbtags-tag')
                          .append($('<i class="fa fa-refresh nbtags-refresh"></i>')
                              .click(function() {
                                  refresh(self);
                              }));
        } else {
            content = $('<span></span>')
        }
        this.element = $('<div></div>')
                           .addClass('nbtags-base')
                           .append(content);
        return this.element;
    };

    return {
        Tag: Tag,
        check_content: check_content
    };
});
