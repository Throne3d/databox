"use strict";
function checkReportPresent() {
  var url = 'https://raw.githubusercontent.com/Throne3d/databox/master/toc_report.json'

  $("#report_present_check").remove();

  function path(){ return window.location.pathname; }
  function stripHTML(text) {
    var htmlRemove = /\<\/?\w+(\s+[^\>]+)?\>/g;
    return text.replace(htmlRemove, '');
  }
  function msg(thing, options){
    if (typeof options === 'undefined') options = {'simplify_console': false, 'do_console': true}
    if (typeof options['simplify_console'] === 'undefined') options['simplify_console'] = false;
    if (typeof options['do_console'] === 'undefined') options['do_console'] = true;
    if (options['do_console']) {
      var logThing = thing;
      if (options['simplify_console']) logThing = stripHTML(logThing);
      console.log(logThing);
    }
    var msg_box = $("#report_present_check");
    if (msg_box.length == 0) {
      msg_box = $("<div id='report_present_check' style='position:absolute;top:0;left:0;width:100%;background-color:rgba(255,255,255,0.9);color:#000;padding:10px;box-sizing:border-box;'></div>");
      var msg_button = $("<button style='float:right;margin-right:0;margin-top:0;'>×</button>");
      msg_button.click(function(){msg_box.remove();});
      msg_box.append(msg_button);
      $('body').append(msg_box);
    }
    msg_box.append(thing.toString()).append("<br />");
  }

  function msg_error(thing) {
    thing = "<span style='color:#F00;font-weight:bold'>" + thing + "</span>";
    console.error(stripHTML(thing));
    return msg(thing, {'do_console': false});
  }

  function alert_thread(thing) {
    var obj = {'title_extras': '', 'report_flags': ''};
    obj['title'] = $(thing).text().trim();
    obj['href'] = $(thing).attr('href');
    if (obj['href'][0] == '/') obj['href'] = 'https://glowfic.com' + obj['href']
    console.log(obj);
    msg('"' + obj['title'] + '" with URL: <a href="' + obj['href'] + '" style="color:#000;font-weight:bold;">' + obj['href'] + '</a>', {'simplify_console': true});
  }

  $.getJSON(url, {_: new Date().getTime()}, function(data) {
    /*list = JSON.parse(data);*/
    console.log("loaded toc_report.json");
    console.log(data.length.toString() + ' thing(s)');
    var list = [];
    for (var i=0; i < data.length; i++) {
      var chapter = data[i];
      var chapter_url = chapter['url'].replace('http://', 'https://').replace('https://vast-journey-9935.herokuapp.com', '').replace('https://www.glowfic.com', '').replace('https://glowfic.com', '').replace(/(\?|&)style=site/, '').replace(/(\?|&)view=flat/, '');
      list.push(chapter_url);
    }

    var path = window.location.pathname;
    var host = window.location.hostname;
    if (host.endsWith('.dreamwidth.org')) {
      /* Dreamwidth, assume on thread page */
      var thing = $("#content .entry .entry-title a");
      if (list.indexOf(thing.attr('href')) < 0) {
        msg("<strong>Thread was not found in the report!</strong> It should perhaps be added.", {'simplify_console': true});
        alert_thread(thing);
      } else {
        msg("<em>Thread was found in the report.</em>", {'simplify_console': true});
      }
    } else if (host == 'vast-journey-9935.herokuapp.com' || host == 'www.glowfic.com' || host == 'glowfic.com') {
      /* Constellation */
      if (path.match('/posts/?$|/boards/\\d+$|/posts/unread|/reports/daily$|/users/\\d+')){
        // /posts/, /boards/, /boards/:id, /posts/unread, /reports/daily
        var ignore_board_match = /\/boards\/(29|50)$/;
        if (path.match(ignore_board_match)) {
          msg("<em>Board is ignored from the report.</em>", {'simplify_console': true});
          return;
        }
        var all_things = true;
        var old_things = 0;
        var date_bit = $('#content > span, #content > form > span').get(0);
        if (date_bit) {
          var now = new Date(date_bit.innerHTML.trim());
        } else {
          var now = new Date();
          msg_error("No 'pretty time' tag found. Using current time.");
        }
        $("#content tr:has(.post-subject)").each(function(){
          var thing = $($('td.post-subject a:not(:has(img))', this).get(0));
          var post_url = thing.attr('href');

          var board = $('td.post-board a', this);
          if (board.length > 0) {
            var board_url = board.attr('href');
            if (board_url.match(ignore_board_match)) {
              // skip MWF (board ID 29)
              console.log("Skipping " + thing.text().trim() + " (in a skipped continuity)");
              return;
            }
          }

          var imgs = $('td.post-completed img', this);
          var status = 'incomplete';
          imgs.each(function(){
            var title = $(this).attr('title');
            if (title.indexOf('Hiatus') > -1) status = 'hiatus'
            else if (title.indexOf('Complete') > -1) status = 'complete';
          });

          var date = $("td.post-time", this).text().split('by')[0].trim();
          if (date.length <= 9 && path.match('/reports/daily$')) {
            var header = $("thead tr th:not(.sub)", $(this).parents('table'));
            date = header.text().replace('Daily Report -', '').trim() + ' ' + date;
            console.log("parsed header for date:", date);
          }
          var dater = Date.parse(date);

          var days_since = (now - dater) / 1000 / 60 / 60 / 24;

          if (!(((status == 'incomplete' || status == 'hiatus') && days_since < 32) || (status == 'complete' && days_since < 8))) {
            old_things += 1;
            console.log("Old thing: " + thing.text().trim());
          } else if (list.indexOf(post_url) < 0) {
            if (all_things) msg("<strong>Following things should be added <em>(with appropriate title_extras and report_flags)</em>:</strong>", {'simplify_console': true});
            alert_thread(thing);
            all_things = false;
          }
        });
        if (all_things) msg("Page seems to only contain listed things, or things that are expired and not to be listed (hiatus/incomplete & >31 days old, complete & >7 days old).");
      } else if (path.match('/posts/\\d+|/replies/\\d+$')) {
        var thing = $('#content #post-title a');
        if (list.indexOf(thing.attr('href')) < 0) {
          msg("<strong>Thread was not found in the report!</strong> It should perhaps be added.", {'simplify_console': true});
          alert_thread(thing);
        } else {
          msg("<em>Thread was found in the report.</em>", {'simplify_console': true});
        }
      } else {
        msg_error("Unrecognized page!");
      }
    } else {
      msg_error("Unrecognized site!");
    }
  });
}

if(typeof jQuery=='undefined') {
    var headTag = document.getElementsByTagName("head")[0];
    var jqTag = document.createElement('script');
    jqTag.type = 'text/javascript';
    jqTag.src = 'https://code.jquery.com/jquery-3.1.0.min.js';
    jqTag.onload = checkReportPresent;
    headTag.appendChild(jqTag);
} else {
     checkReportPresent();
}