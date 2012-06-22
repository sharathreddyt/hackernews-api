// Generated by CoffeeScript 1.3.3

/*
 * ==========================================================
 * Name:    hackernews-api.js v0.2
 * Author:  Eric E. Lewis
 * Website: http://www.boxy.co
 * ===================================================
 * Copyright 2012 boxyco, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==========================================================
*/


(function() {
  var config, jsdom, server, tools, version;

  jsdom = require('jsdom');

  server = require('express').createServer();

  config = require('./config');

  version = config.server.version;

  tools = {
    commentScraper: function(req, res, errors, window) {
      var $, comments;
      $ = window.$;
      comments = [];
      $('td .default > span').each(function() {
        var childspan, parent;
        parent = $(this).parent();
        childspan = parent.children('div').children('span');
        comments[comments.length] = {
          comment: $(this).children('font').html(),
          indent: parseInt(parent.prev().prev().children('img').attr('width') / 40),
          postedBy: childspan.children('a:eq(0)').text(),
          postedAgo: childspan.children('a').remove() && parent.children('div').children('span').text().substring(0, 15).trim()
        };
      });
      if (comments.length > 0) {
        return {
          comments: comments
        };
      } else {
        return error('no comments found');
      }
    },
    pageScraper: function(req, res, errors, window) {
      var $, links, nextPageLink;
      $ = window.$;
      links = [];
      $('td.title a[rel!="nofollow"]').each(function() {
        var item, itemLinkText, itemSubText, _ref;
        item = $(this);
        itemSubText = item.parent().parent().next().children('.subtext');
        itemLinkText = item.next().text().trim();
        links[links.length] = {
          url: item.attr('href').indexOf('http') === 0 ? item.attr('href') : "" + config.server.base_url + (item.attr('href')),
          title: item.text(),
          points: parseInt(itemSubText.children('span').text().split(' ')[0]),
          postedBy: itemSubText.children('a:eq(0)').text(),
          postedAgo: itemSubText.text().split(' ').slice(4, -4).join(' '),
          commentCount: parseInt(itemSubText.children('a:eq(1)').text().split(' ')[0]),
          id: parseInt((_ref = itemSubText.children('a:eq(1)').attr('href')) != null ? _ref.substring(8) : void 0),
          site: item.attr('href').indexOf('http') === 0 ? item.parent().children('span').text().trim() : "(ycombinator.com)"
        };
      });
      nextPageLink = $('td.title:last a').attr('href');
      nextPageLink = nextPageLink !== 'news2' ? nextPageLink.split('=')[1] : nextPageLink;
      if (links.length > 0) {
        return {
          links: links,
          nextId: nextPageLink
        };
      } else {
        return {
          error: 'no links found'
        };
      }
    },
    profileScraper: function(req, res, errors, window) {
      var $, item, profile;
      $ = window.$;
      item = $('form tr td:odd');
      profile = {
        about: item.get(4).innerHTML,
        username: item.get(0).innerHTML,
        createdAgo: item.get(1).innerHTML,
        karma: parseInt(item.get(2).innerHTML)
      };
      return {
        profile: profile
      };
    }
  };

  server.get('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    return next();
  });

  server.get('/discuss/:id?', function(req, res) {
    var html, thread;
    html = "" + config.server.base_url + "item?id=";
    thread = req.params.id;
    return jsdom.env({
      html: "" + html + thread,
      scripts: [config.server.jquery_url],
      done: function(errors, window) {
        var comments, post;
        try {
          post = tools.pageScraper(req, res, errors, window);
          comments = tools.commentScraper(req, res, errors, window);
          res.json({
            post: post.links,
            comments: comments.comments,
            requestTime: new Date(),
            version: version
          });
        } catch (err) {
          res.json({
            error: 'invalid id',
            requestTime: new Date(),
            version: version
          }, 404);
        }
      }
    });
  });

  server.get('/profile/:userid?', function(req, res) {
    var html, userid;
    userid = req.params.userid;
    html = "" + config.server.base_url + "user?id=" + userid;
    return jsdom.env({
      html: html,
      scripts: [config.server.jquery_url],
      done: function(errors, window) {
        var profile;
        try {
          profile = tools.profileScraper(req, res, errors, window);
          res.json({
            profile: profile.profile,
            requestTime: new Date(),
            version: version
          });
        } catch (err) {
          res.json({
            error: 'invalid username',
            requestTime: new Date(),
            version: version
          }, 404);
        }
      }
    });
  });

  server.get('/profile/:id/comments?', function(req, res) {
    var html, userid;
    html = "" + config.server.base_url + "threads?id=";
    userid = req.params.id;
    return jsdom.env({
      html: "" + html + userid,
      scripts: [config.server.jquery_url],
      done: function(errors, window) {
        var comments;
        try {
          comments = tools.commentScraper(req, res, errors, window);
          res.json({
            comments: comments.comments,
            requestTime: new Date(),
            version: version
          });
        } catch (err) {
          res.json({
            error: 'invalid id',
            requestTime: new Date(),
            version: version
          }, 404);
        }
      }
    });
  });

  server.get('/profile/:id/submissions?/:page?', function(req, res) {
    var html, userid;
    html = "" + config.server.base_url + "submitted?id=";
    userid = req.params.id;
    return jsdom.env({
      html: "" + html + userid,
      scripts: [config.server.jquery_url],
      done: function(errors, window) {
        var post;
        try {
          post = tools.pageScraper(req, res, errors, window);
          res.json({
            links: post.links,
            requestTime: new Date(),
            version: version
          });
        } catch (err) {
          res.json({
            error: 'invalid username',
            requestTime: new Date(),
            version: version
          }, 404);
        }
      }
    });
  });

  server.get('/:root/:page?', function(req, res) {
    var html, page, root;
    root = req.params.root;
    page = req.params.page;
    html = !(page != null) ? "" + config.server.base_url + root : page === 'news2' ? "" + config.server.base_url + page : "" + config.server.base_url + "x?fnid=" + page;
    return jsdom.env({
      html: html,
      scripts: [config.server.jquery_url],
      done: function(errors, window) {
        var post;
        try {
          post = tools.pageScraper(req, res, errors, window);
          res.json({
            links: post.links,
            nextId: post.nextId,
            requestTime: new Date(),
            version: version
          });
        } catch (err) {
          res.json({
            error: 'invalid nextId',
            requestTime: new Date(),
            version: version
          }, 404);
        }
      }
    });
  });

  server.get('*', function(req, res) {
    return res.json({
      error: 'could not find a related method',
      requestTime: new Date(),
      version: version
    }, 404);
  });

  server.listen(config.server.listen_port);

  console.log("Server running on port: " + config.server.listen_port);

}).call(this);
