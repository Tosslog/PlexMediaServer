// ==UserScript==
// @name         Plex External Player PotPlayer
// @namespace    
// @version      1.0.0
// @description  脚本 修改自 Plex External Player 插件 原版地址:https://greasyfork.org/zh-CN/scripts/13437-plex-external-player
// @author       北京土著 
// @include     /^https?://.*:32400/web.*
// @include     http://*:32400/web/index.html*
// @include     https://*:32400/web/index.html*
// @include     https://app.plex.tv/*
// @require     http://code.jquery.com/jquery-3.2.1.min.js
// @connect     *
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/js/toastr.min.js
// @grant       GM_xmlhttpRequest
// ==/UserScript==

$("head").append(
  '<link href="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/css/toastr.min.css" rel="stylesheet" type="text/css">'
);

// 消息框
toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": true,
  "positionClass": "toast-bottom-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

// 输出消息
var showToast = function (msg, error) {
  var title = 'Plex External Player';
  if (error) {
      toastr.error(msg, title, { timeOut: 10000 });
      logMessage(msg);
  }
  else {
      toastr.success(msg, title);
  }
};

// 控制台输出
var logMessage = function (msg) {
  console.log('[Plex External] ' + msg);
};

var clickListener = function (e) {
  e.preventDefault();
  e.stopPropagation();
  var a = jQuery(e.target).closest('a');
  var link = a.attr('href');
  var openFolder = jQuery(e.target).attr('title') === 'Open folder';
  var url = link;
  if (link === '#' || link === undefined || link === 'javascript:void(0)') {
      url = window.location.hash;
  }

  if (url.indexOf('/server/') > -1) {
      var serverId = url.split('/')[2];
  }

  if (url.indexOf('%2Fmetadata%2F') > -1) {
      var idx = url.indexOf('%2Fmetadata%2F');
      var mediaId = url.substr(idx + 14);
      var idToken = mediaId.indexOf('&');
      if (idToken > -1) {
          mediaId = mediaId.substr(0, idToken);
      }
  }

    // getToken
    var X_Plex_Token = localStorage.myPlexAccessToken
    console.log('X-Plex-Token = ' + localStorage.myPlexAccessToken);


    // ServerId
    console.log('serverId = ' + serverId);
    // mediaId
    console.log('mediaId = ' + mediaId);

    var metaDataPath = pmsUrls.get(serverId) + '/library/metadata/' + mediaId + '?includeConcerts=1&includeExtras=1&includeOnDeck=1&includePopularLeaves=1&includePreferences=1&includeChapters=1&asyncCheckFiles=0&asyncRefreshAnalysis=0&asyncRefreshLocalMediaAgent=0&X-Plex-Token=' + X_Plex_Token;
    console.log('metaDataPath = ' + metaDataPath)
    makeRequest(metaDataPath, serverId)
          .then(function (response) {
        let mediaurl = '';
        let subtitlelist = [];
        let parts = response.responseXML.getElementsByTagName('Part');
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].attributes['file'] !== undefined) {
                mediaurl = pmsUrls.get(serverId) + parts[i].attributes['key'].value + '?download=1&X-Plex-Token=' + X_Plex_Token;
            }
        }

        let Stream = response.responseXML.getElementsByTagName('Stream');
        console.log(Stream)
        for (let i = 0; i < Stream.length; i++) {
            if (Stream[i].attributes['key'] !== undefined) {
                let subtitlekey = Stream[i].attributes['key'].value;
                if (subtitlekey !== undefined) {
                    subtitlelist.push(subtitlekey);
                }
                else{
                    logMessage('未找到本地外挂字幕文件');
                }
            }
        }

        let subtitleUrl = [];
        for (let i = 0; i < subtitlelist.length; i++) {
            subtitleUrl.push(pmsUrls.get(serverId) + subtitlelist[i] + '?X-Plex-Token=' + X_Plex_Token);
        };

        console.log(subtitleUrl)

        var origAccessToken = localStorage.myPlexAccessToken;
        var serverNode = {};
        if (localStorage.users) {
            serverNode = JSON.parse(localStorage.users);
            console.log(serverNode);
        } else {
            logMessage('User details not found');
        }
        var tokenToTry = origAccessToken;
        if (serverNode === undefined) {
            serverNode = {
                users: []
            };
        }
        logMessage('Looking for token of serverId:'+serverId)
        let tokenFound = false
        if (serverId !== undefined) {
            serverLoop:
            for (var i = 0; i < serverNode.users.length; i++) {
                logMessage('Checking server list ('+serverNode.users[i].servers.length+') for user:' +serverNode.users[i].username)
                for (var j = 0; j < serverNode.users[i].servers.length; j++) {
                    logMessage('Checking server with id '+serverNode.users[i].servers[j].machineIdentifier)
                    if (serverNode.users[i].servers[j].machineIdentifier == serverId) {
                        tokenToTry = serverNode.users[i].servers[j].accessToken;
                        logMessage('Token found:' + tokenToTry);
                        tokenFound = true
                        break serverLoop;
                    }
                }
            }
            if (!tokenFound){
                showToast('Could not find authentication info', 1);
                reject();
                return;
            }
        }

        var authedUrl = mediaurl + '&X-Plex-Token=' + tokenToTry;
        let poturl = "potplayer://" + authedUrl + " /sub=" + subtitleUrl[0] + '&X-Plex-Token=' + tokenToTry;
        console.log(poturl);
        window.open(poturl, "_blank");

    });

};

// 绑定按钮
var bindClicks = function () {
  var hasBtn = false;
  var toolBar = jQuery("#plex-icon-toolbar-play-560").parent().parent();
  toolBar.children('button').each(function (i, e) {
      if (jQuery(e).hasClass('plexextplayer'))
          hasBtn = true;
  });


  if (!hasBtn) {
      var template = jQuery('<button class="play-btn media-poster-btn btn-link plexextplayer" tabindex="-1" title="外部播放器"><i class="glyphicon play plexextplayer plexextplayerico"></i></button>');
      toolBar.prepend(template);
      template.click(clickListener);

  }

  // Cover page
  jQuery('[class^=MetadataPosterCardOverlay-link]').each(function (i, e) {
      e = jQuery(e);
      let poster = e.parent();
      if (poster.length === 1 && poster[0].className.trim().startsWith('MetadataPosterCardOverlay')) {
          let existingButton = poster.find('.plexextplayerico');
          if (existingButton.length === 0) {
              let url = poster.find('a').attr('href');
              let template = jQuery('<a href="' + url + '" aria-haspopup="false"  aria-role="button" class="" type="button"><i class="glyphicon play plexextplayer plexextplayerico plexextplayericocover"></i></button>');
              let newButton = template.appendTo(poster);
              newButton.click(clickListener);
              poster.mouseenter(function () {
                  newButton.find('i').css('display', 'block');
              });
              poster.mouseleave(function () {
                  newButton.find('i').css('display', 'none');
              });
          }
      }
  });

  //Thumbnails
  jQuery('[class^=PosterCardLink-link]').each(function (i, e) {
      e = jQuery(e);
      let thumb = e.parent();
      if (thumb.length === 1 && thumb[0].className.trim().startsWith('MetadataPosterListItem-card')) {
          let existingButton = thumb.find('.plexextplayerico');
          if (existingButton.length === 0) {
              let url = thumb.find('a').attr('href');
              let template = jQuery('<a href="' + url + '" aria-haspopup="false"  aria-role="button" class="" type="button"><i class="glyphicon play plexextplayer plexextplayerico plexextplayericocover"></i></button>');
              let thumbButton = template.appendTo(thumb);
              thumbButton.click(clickListener);
              thumb.mouseenter(function () {
                  thumbButton.find('i').css('display', 'block');
              });
              thumb.mouseleave(function () {
                  thumbButton.find('i').css('display', 'none');
              });
          }
      }
  });

  // Playlist
  jQuery("span[class^=' MetadataPosterTitle-singleLineTitle']").each(function (i, e) {
      e = jQuery(e);
      let playlistItem = e.closest("[class^='PlaylistItemRow-overlay']").find("[class^='PlaylistItemMetadata-indexContainer']");
      if (playlistItem.length === 1) {
          let existingButton = playlistItem.find('.plexextplayerico');
          if (existingButton.length === 0) {
              let url = e.find('a').attr('href');
              let template = jQuery('<a href="' + url + '" aria-haspopup="false"  aria-role="button" class="" type="button"><i class="glyphicon play plexextplayer plexextplayerico plexextplayericocover"></i></button>');
              let newButton = template.appendTo(playlistItem);
              newButton.click(clickListener);
              playlistItem.closest("[class^='PlaylistItemRow-overlay']").mouseenter(function () {
                  newButton.find('i').css('display', 'block');
              });
              playlistItem.closest("[class^='PlaylistItemRow-overlay']").mouseleave(function () {
                  newButton.find('i').css('display', 'none');
              });
          }
      }
  });
};


//得到 Plex Servers
var makeRequest = function (url, serverId) {
  return new Promise(function (resolve, reject) {
      var origAccessToken = localStorage.myPlexAccessToken;
      var serverNode = {};
      if (localStorage.users) {
          serverNode = JSON.parse(localStorage.users);
          console.log(serverNode);
      } else {
          logMessage('User details not found');
      }
      var tokenToTry = origAccessToken;
      if (serverNode === undefined) {
          serverNode = {
              users: []
          };
      }
      logMessage('Looking for token of serverId:'+serverId)
      let tokenFound = false
      if (serverId !== undefined) {
          serverLoop:
          for (var i = 0; i < serverNode.users.length; i++) {
            logMessage('Checking server list ('+serverNode.users[i].servers.length+') for user:' +serverNode.users[i].username)
              for (var j = 0; j < serverNode.users[i].servers.length; j++) {
                logMessage('Checking server with id '+serverNode.users[i].servers[j].machineIdentifier)
                  if (serverNode.users[i].servers[j].machineIdentifier == serverId) {
                      tokenToTry = serverNode.users[i].servers[j].accessToken;
                      logMessage('Token found:' + tokenToTry);
                      tokenFound = true
                      break serverLoop;
                  }
              }
          }
          if (!tokenFound){
              showToast('Could not find authentication info', 1);
              reject();
              return;
          }
      }

      var authedUrl = url + '&X-Plex-Token=' + tokenToTry;
      logMessage('Calling ' + authedUrl);
      GM_xmlhttpRequest({
          method: "GET",

          url: authedUrl,
          onload: function (state) {
              if (state.status === 200) {
                  logMessage('Called sucessfully to ' + url);
                  resolve(state);
              }
          },
          onreadystatechange: function (state) {
              if (state.readyState === 4) {

                  if (state.status === 401) {
                      logMessage('Not Authorised ' + url);
                  } else if (state.status !== 200) {
                      logMessage('Request returned ' + state.status);
                      showToast('Error calling: ' + url + '. Response: ' + state.responseText + ' Code:' + state.status + ' Message: ' + state.statusText, 1);
                  }
              }
          },
      });
  });
};


var getHosts = function () {
  makeRequest('https://plex.tv/api/resources?includeHttps=1&X-Plex-Token=' + localStorage.myPlexAccessToken)
      .then(function (response) {
          let parts = response.responseXML.getElementsByTagName('Device');
          for (let i = 0; i < parts.length; i++) {
              if (parts[i].getAttribute('product') == 'Plex Media Server') {
                  let connections = parts[i].getElementsByTagName('Connection');
                  for (let j = 0; j < connections.length; j++) {
                      if (connections[j].getAttribute('local') == parts[i].getAttribute('publicAddressMatches')) {
                          pmsUrls.set(parts[i].getAttribute('clientIdentifier'), 'http://' + connections[j].getAttribute('address') + ':' + connections[j].getAttribute('port'));
                          break;
                      }
                  }
              }
          }
      }).catch(function () {
          showToast('Failed to get PMS URLs', 1);
      });
}

var pmsUrls = new Map();
setTimeout(function () {
  getHosts();
  console.log('Hosts' + pmsUrls);
}, 1000);


// Make buttons smaller
jQuery('body').append('<style>.plexextplayericocover {right: 10px; top: 10px; position:absolute; display:none;font-size:15px;} .glyphicon.plexfolderextplayerico:before {  content: "\\e145";   } .glyphicon.plexextplayerico:before {  content: "\\e161";   }</style>');


// 绑定按钮并每 100 毫秒检查一次新按钮
// 放置脚本最后
setInterval(bindClicks, 100);
bindClicks();

