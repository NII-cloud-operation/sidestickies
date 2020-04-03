define([
    'base/js/namespace',
    'jquery',
    'base/js/utils'
], function(Jupyter, $, utils) {
    "use strict";

    var mod_name = 'NBTags';
    var log_prefix = '[' + mod_name + ']';

    var tags = [];
    var loading = 0;

    var loading_interval_ms = 1000 * 2;
    var refresh_interval_ms = 1000 * 60 * 10;
    var max_content_length = 1024;

    function refresh(tag) {
        console.log(log_prefix, 'Refresh', tag);
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

    function _normalize_toc(toc) {
        var ntoc = [];
        var ntoclen = 0;
        var exceed = false;
        toc.forEach(function(line) {
            if (ntoclen + line.length >= max_content_length - 2) {
                exceed = true;
                return;
            }
            ntoc.push(line);
            ntoclen += line.length;
        });
        if (exceed) {
            ntoc.push('..');
        }
        return ntoc;
    }

    function Tag(cell) {
        this.cell = cell;
        this.element = null;
        this.hasMEME = false;
        this.cachedJSON = null;
        this.visible = false;
    }

    Tag.prototype.updateContent = function(json) {
        var self = this;
        var c = $('.nbtags-tag', self.element);
        c.empty();
        c.append($('<span class="item_name"><i class="fa fa-refresh nbtags-refresh"></i></span>')
                     .click(function(event) {
                         refresh(self);
                         event.stopPropagation();
                     }));
        if (json['summary']) {
            var desc = '';
            var summary = json['summary'];
            if (summary['description']) {
                desc = summary['description'] + ' ';
            }
            c.addClass('nbtags-has-page')
             .append($('<span class="item_name"></span>')
                .append(desc)
                .append($('<i class="fa fa-comments"></i>'))
                .append(summary['count'])
                .click(function(event) {
                           self.getMEME(function (meme) {
                               if (json['meme'] !== meme['current']) {
                                   self.create();
                               } else if (! summary['has_code']) {
                                   var url = self.getBaseURL();
                                   self.getContent(function(content) {
                                       var curl = url + '?title=' + encodeURIComponent(summary['title']) +
                                         '&mode=edit' +
                                         '&' + self.query +
                                         '=' + encodeURIComponent(content);
                                       window.open(curl);
                                   });
                               } else {
                                   window.open(summary['page_url']);
                               }
                           });
                           event.stopPropagation();
                       }));
        } else {
            c.append($('<span class="item_name"><i class="fa fa-comment"></i></span>')
                .click(function(event) {
                           self.create();
                           event.stopPropagation();
                       }));
        }
    };

    Tag.prototype.checkContent = function(finished) {
        var self = this;
        this.getMEME(function(meme) {
            if (!meme) {
                finished(self);
                return;
            }
            console.log(log_prefix, 'Check content', meme);
            var url = self.getBaseURL() + '/' + meme['current'];
            $.ajax({
                url: url,
                dataType: 'json',
                success: function (json) {
                    console.log(log_prefix, self, meme, json);
                    self.cachedJSON = json;
                    self.updateContent(json);
                    finished(self);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error(log_prefix, textStatus, errorThrown);
                    var c = $('.nbtags-tag', self.element);
                    c.empty();
                    c.append($('<span class="item_name"><i class="fa fa-refresh nbtags-refresh"></i></span>')
                                 .click(function(event) {
                                     refresh(self);
                                     event.stopPropagation();
                                 }))
                         .append('<span class="nbtags-error">!</span>');
                    finished(self);
                }
            });
        });
    };

    Tag.prototype.create = function() {
        var url = this.getBaseURL();
        var self = this;
        this.getContent(function(content) {
            console.log(log_prefix, content);
            var cellurl = url + '?' + self.query + '=' + encodeURIComponent(content);
            window.open(cellurl);
        });
    };

    Tag.prototype.createElement = function(created) {
        var self = this;
        this.getMEME(function(meme) {
            var content;
            var noMEME = self.hasMEME == false;
            if (meme) {
                self.hasMEME = true;
                content = $('<span></span>')
                              .addClass('nbtags-tag')
                              .append($('<span class="item_name"><i class="fa fa-refresh nbtags-refresh"></i></span>')
                                  .click(function(event) {
                                      refresh(self);
                                      event.stopPropagation();
                                  }));
            } else {
                content = $('<span></span>')
            }
            if (noMEME) {
                if (self.element) {
                    self.element.empty().append(content);
                } else {
                    self.element = $('<div></div>')
                                       .addClass('nbtags-base')
                                       .append(content);
                    if (self.visible) {
                        self.element.show();
                    } else {
                        self.element.hide();
                    }
                }
            }
            created(self.element);
        });
    };

    Tag.prototype.show = function() {
        this.visible = true;
        if (this.element) {
            this.element.show();
        }
    };

    Tag.prototype.hide = function() {
        this.visible = false;
        if (this.element) {
            this.element.hide();
        }
    };

    function CellTag(cell) {
        Tag.call(this);

        this.cell = cell;
        this.query = 'cell'
    }

    CellTag.prototype = Object.create(Tag.prototype);

    Object.defineProperty(CellTag.prototype, 'constructor',
                          {value: CellTag, enumerable: false, writable: true});

    CellTag.prototype.getMEME = function(handler) {
        handler(this.cell.metadata['lc_cell_meme']);
    };

    CellTag.prototype.getContent = function(handler) {
        var cell = this.cell.toJSON();
        var content = {};
        content['cell_type'] = cell['cell_type'];
        content['metadata'] = {'lc_cell_meme': cell['metadata']['lc_cell_meme']};
        content['source'] = cell['source'].length < max_content_length ?
                            cell['source'] : cell['source'].substring(0, max_content_length - 2) + '..';
        console.log(log_prefix, 'Content', content)
        handler(JSON.stringify(content));
    };

    CellTag.prototype.getBaseURL = function() {
        return Jupyter.notebook.base_url + 'nbtags/cell';
    };

    function NotebookTag(path) {
        Tag.call(this);
        this.path = path;
        this.query = 'notebook';
    }

    NotebookTag.prototype = Object.create(Tag.prototype);

    Object.defineProperty(NotebookTag.prototype, 'constructor',
                          {value: NotebookTag, enumerable: false, writable: true});

    NotebookTag.prototype.getMEME = function(handler) {
        var url = this.getBaseURL() + this.path + '/meme';
        var self = this;
        $.ajax({
            url: url,
            dataType: 'json',
            success: function (json) {
                console.log(log_prefix, self, json);

                handler(json['meme']);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(log_prefix, textStatus, errorThrown);

                handler(undefined);
            }
        });
    };

    NotebookTag.prototype.getContent = function(handler) {
        var url = this.getBaseURL() + this.path + '/meme';
        var self = this;
        $.ajax({
            url: url,
            dataType: 'json',
            success: function (json) {
                console.log(log_prefix, self, json);

                handler(JSON.stringify({'meme': json['meme'],
                                        'toc': _normalize_toc(json['toc'])}));
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(log_prefix, textStatus, errorThrown);

                handler(undefined);
            }
        });
    };

    NotebookTag.prototype.getBaseURL = function() {
        return utils.get_body_data('baseUrl') + 'nbtags/notebook';
    };

    function NotebookPageTag(notebook) {
        Tag.call(this);
        this.notebook = notebook;
        this.query = 'notebook';
    }

    NotebookPageTag.prototype = Object.create(Tag.prototype);

    Object.defineProperty(NotebookPageTag.prototype, 'constructor',
                          {value: NotebookPageTag, enumerable: false, writable: true});

    NotebookPageTag.prototype.getMEME = function(handler) {
        handler(this.notebook.metadata['lc_notebook_meme']);
    };

    NotebookPageTag.prototype.getContent = function(handler) {
        var meme = this.notebook.metadata['lc_notebook_meme'];
        var toc = [];
        this.notebook.get_cells().forEach(function(cell) {
            var celljson = cell.toJSON();
            if (celljson['cell_type'] == 'markdown') {
                if (/^\#+/.test(celljson['source'])) {
                    toc.push(celljson['source'].split('\n')[0]);
                }
            }
        });
        console.log(log_prefix, 'TOC', toc);
        handler(JSON.stringify({'meme': meme, 'toc': _normalize_toc(toc)}));
    };

    NotebookPageTag.prototype.getBaseURL = function() {
        return Jupyter.notebook.base_url + 'nbtags/notebook';
    };

    return {
        CellTag: CellTag,
        NotebookTag: NotebookTag,
        NotebookPageTag: NotebookPageTag,
        check_content: check_content
    };
});
