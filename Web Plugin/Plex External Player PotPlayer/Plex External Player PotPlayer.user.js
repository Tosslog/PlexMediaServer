// ==UserScript==
// @name         Plex External Player PotPlayer
// @namespace    https://github.com/Tosslog/PlexMediaServer/tree/main/Web%20Plugin/Plex%20External%20Player%20PotPlayer
// @version      1.2.1
// @description  插件用于激活本地PotPlayer 播放器使用。
// @author       北京土著 30344386@qq.com
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

// 消息设定
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
    "extendedTimeOut": "5000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

// 输出消息
var showToast = function (msg, error) {
    var title = 'Plex External PotPlayer';
    if (error) {
        toastr.error(msg, title, { timeOut: 10000 });
        MSG(msg, 'Error');
    }
    else {
        toastr.success(msg, title);
    }
};

// 控制台输出
var MSG = function (msg, _type, _tag) {
    let did = debugID()
    if (_tag === undefined) {
        _tag = '[' + did + ']'
    }
    else {
        _tag = '[' + _tag + '-' + did + ']'
    }
    _type = '' + _type
    _type = _type.toLowerCase()
    if (_type === 'info') {
        _type = 'INFO'

        let style = 'color: #61afef'
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: Bgin ↓', style);
        console.log(msg);
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: End ↑', style);
    }
    else if (_type === 'debug') {
        if (toastr.options['debug'] === true) {
            _type = 'DEBUG'
            let style = 'color: #e5c07b'
            console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: Bgin ↓', style);
            console.log(msg);
            console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: End ↑', style);
        }
    }
    else if (_type === 'warn') {
        _type = 'WARN'
        let style = 'color: #e5c07b'
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: Bgin ↓', style);
        console.log(msg);
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: End ↑', style);
    }
    else if (_type === 'error') {
        _type = 'ERROR'
        let style = 'color: #e06c75'
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: Bgin ↓', style);
        console.log(msg);
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: End ↑', style);
    }
    else {
        _type = 'LOG'
        let style = 'color: #98c379'
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: Bgin ↓', style);
        console.log(msg);
        console.log('%c ' + _tag + '-[Plex External PotPlayer ' + _type + ']: End ↑', style);
    }
};

//得到 Plex Servers
var makeRequest = function (url, serverId) {
    return new Promise(function (resolve, reject) {
        var origAccessToken = localStorage.myPlexAccessToken;
        var serverNode = {};
        if (localStorage.users) {
            serverNode = JSON.parse(localStorage.users);
            MSG(serverNode, 'debug')
        } else {
            MSG(Language.User_details_not_found, 'error')
        }
        var tokenToTry = origAccessToken;
        if (serverNode === undefined) {
            serverNode = {
                users: []
            };
        }

        let tokenFound = false
        if (serverId !== undefined) {
            serverLoop:
            for (var i = 0; i < serverNode.users.length; i++) {
                MSG(getJSLocale(Language.Checking_server_list_for_user, { user: serverNode.users[i].servers.length, server: serverNode.users[i].username }))
                for (var j = 0; j < serverNode.users[i].servers.length; j++) {
                    MSG(getJSLocale(Language.Checking_server_with_id, { id: serverNode.users[i].servers[j].machineIdentifier }), 'debug')
                    if (serverNode.users[i].servers[j].machineIdentifier == serverId) {
                        tokenToTry = serverNode.users[i].servers[j].accessToken;
                        MSG(getJSLocale(Language.Token_found, { token: tokenToTry }), 'debug');
                        tokenFound = true
                        break serverLoop;
                    }
                }
            }
            token = tokenToTry;
            if (!tokenFound) {
                showToast(getJSLocale(Language.No_authentication_information_found), 1);
                reject();
                return;
            }
        }
        var authedUrl = url + '&X-Plex-Token=' + tokenToTry;
        MSG(getJSLocale(Language.Verify_permissions_URL, { authurl: authedUrl }), 'debug');
        GM_xmlhttpRequest({
            method: "GET",

            url: authedUrl,
            onload: function (state) {
                if (state.status === 200) {
                    MSG(Language.Verify_permissions_successfully, 'Log');
                    resolve(state);
                }
            },
            onreadystatechange: function (state) {
                if (state.readyState === 4) {

                    if (state.status === 401) {
                        MSG(Language.unauthorized, 'Error');
                        showToast(Language.unauthorized, 1)
                    } else if (state.status !== 200) {
                        MSG(getJSLocale(Language.Request_return_status, { status: state.status }), 'error');
                        MSG(getJSLocale(Language.Call_error_response_code_message, { url: url, responseText: state.responseText, status: state.status, statusText: state.statusText }), 'error')
                        showToast(getJSLocale(Language.Request_return_status, { status: state.status }), 1);
                    }
                }
            },
        });
    });
};

var getHosts = function () {
    MSG(Language.Find_server_server_address)
    makeRequest('https://plex.tv/api/resources?includeHttps=1&X-Plex-Token=' + localStorage.myPlexAccessToken)
        .then(function (response) {
            let parts = response.responseXML.getElementsByTagName('Device');
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].getAttribute('product') == 'Plex Media Server') {
                    let connections = parts[i].getElementsByTagName('Connection');
                    for (let j = 0; j < connections.length; j++) {
                        if (connections[j].getAttribute('local') == parts[i].getAttribute('publicAddressMatches')) {
                            pmsUrls.set(parts[i].getAttribute('clientIdentifier'), 'http://' + connections[j].getAttribute('address') + ':' + connections[j].getAttribute('port'));
                            MSG(getJSLocale(Language.Get_the_server_address, { address: 'http://' + connections[j].getAttribute('address') + ':' + connections[j].getAttribute('port') }))
                            break;
                        }
                    }
                }
            }
        }).catch(function () {
            MSG(Language.Failed_to_get_PMS_URLs, 'error')
            showToast(Language.Failed_to_get_PMS_URLs, 1);
        });
}

var pmsUrls = new Map();
var token = '';
var title = '';
setTimeout(function () {
    getHosts();
    //console.log(token)
}, 1000);


// 单击侦听器
var clickListener = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var a = jQuery(e.target).closest('a');
    var link = a.attr('href');
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

    var metaDataPath = pmsUrls.get(serverId) + '/library/metadata/' + mediaId + '?includeConcerts=1&includeExtras=1&includeOnDeck=1&includePopularLeaves=1&includePreferences=1&includeChapters=1&asyncCheckFiles=0&asyncRefreshAnalysis=0&asyncRefreshLocalMediaAgent=0&X-Plex-Token=' + localStorage.myPlexAccessToken;
    MSG(getJSLocale(Language.Get_Media_address, { mediaaddress: metaDataPath }), 'debug')
    makeRequest(metaDataPath, serverId)
        .then((response) => {
            let mediaurl = '';
            let subtitlelist = [];
            let Video = response.responseXML.getElementsByTagName('Video');
            for (let i = 0; i < Video.length; i++) {
                if (Video[i].attributes['title'] !== undefined) {
                    title = ' [' + Video[i].attributes['title'].value + '] ';
                    break;
                }
            }


            let parts = response.responseXML.getElementsByTagName('Part');
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].attributes['file'] !== undefined) {
                    mediaurl = pmsUrls.get(serverId) + parts[i].attributes['key'].value + '?download=1';
                }
            }

            let Stream = response.responseXML.getElementsByTagName('Stream');
            //console.log(Stream)
            for (let i = 0; i < Stream.length; i++) {
                if (Stream[i].attributes['key'] !== undefined) {
                    let subtitlekey = Stream[i].attributes['key'].value;
                    if (subtitlekey !== undefined) {
                        subtitlelist.push(subtitlekey);
                    }
                    else {
                        MSG(Language.The_local_external_subtitle_file_was_not_found);
                    }
                }
            }

            let subtitleUrl = [];
            for (let i = 0; i < subtitlelist.length; i++) {
                subtitleUrl.push(pmsUrls.get(serverId) + subtitlelist[i]);
            };

            var authedUrl = mediaurl + '&X-Plex-Token=' + token;
            let poturl = "potplayer://" + authedUrl + " /sub=" + subtitleUrl[0] + '?X-Plex-Token=' + token;
            MSG(poturl, 'debug')
            showToast(getJSLocale(Language.Successfully_parsed_the_path_of_the_movie, { mediatitle: title }))
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


// Make buttons smaller
jQuery('body').append('<style>.plexextplayericocover {right: 10px; top: 10px; position:absolute; display:none;font-size:15px;} .glyphicon.plexfolderextplayerico:before {  content: "\\e145";   } .glyphicon.plexextplayerico:before {  content: "\\e161";   }</style>');


// 绑定按钮并每 100 毫秒检查一次新按钮
// 放置脚本最后
setInterval(bindClicks, 100);
bindClicks();

function debugID() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4());
}

function getRow() {
    let err = new Error().stack.split('at')
    err = err[err.length - 1].split(':')
    err = err[err.length - 1].replace(')', '')
    return parseInt(err)
}

function getJSLocale(key, params) {
    var result = ""; 	// 对应的资源的内容
    var paramsObj = {};	// 参数对象
    if (params) paramsObj = params;

    if (typeof (key) != 'undefined' && typeof (Language) != 'undefined') {
        // 根据key取得对应的资源内容，如果没有找到则返回key值
        if (Language[key] != undefined) {
            result = Language[key];
        } else {
            result = key;
        }

        // 替换对应参数为value的值
        var regExp = new RegExp(); //替换资源中参数的正则
        for (var k in paramsObj) {
            regExp = eval("/{{:" + k + "}}/g");
            result = result.replace(regExp, paramsObj[k]);
        }

        // 如果没有找到对应的资源则返回 "No Value"
        if (/{{:[a-zA-Z]+}}/.test(result)) {
            result = result.replace(/{{:[a-zA-Z]+}}/g, "No Value");
        }
    }
    return result;
}

var lang = navigator.language
var Language = {}
if (lang === 'zh-CN') {
    Language = {
        User_details_not_found: '未找到用户详细信息',
        Checking_server_list_for_user: '检查第 {{:user}} 个用户的 {{:server}} 服务器列表',
        Checking_server_with_id: '使用服务器ID {{:id}} 检查服务器',
        Token_found: '找到令牌:{{:token}}',
        No_authentication_information_found: '找不到身份验证信息',
        Verify_permissions_URL: '验证权限URL:{{:authurl}}',
        Verify_permissions_successfully: '验证权限成功',
        unauthorized: '未授权',
        Request_return_status: '请求返回状态:{{:status}}',
        Call_error_response_code_message: '调用错误:{{:url}}\n响应:{{:responseText}}代码:{{:status}}消息:{{:statusText}}',
        Find_server_server_address: '查找服务器地址',
        Get_the_server_address: '得到服务器地址：{{:address}}',
        Failed_to_get_PMS_URLs: '获取服务器地址失败',
        Get_Media_address: '得到媒体地址:{{:mediaaddress}}',
        The_local_external_subtitle_file_was_not_found: '未找到本地外挂字幕文件',
        Successfully_parsed_the_path_of_the_movie: '成功解析电影{{:mediatitle}}的路径，正在激活本地PotPlayer播放器。'
    }
}
if (lang === 'en') {
    Language = {
        User_details_not_found: 'User details not found',
        Checking_server_list_for_user: 'Checking the {{:server}} service list of the {{:user}}th user',
        Checking_server_with_id: 'Check the server with server ID {{:id}}',
        Token_found: 'Token found: {{:token}}',
        No_authentication_information_found: 'No authentication information found',
        Verify_permissions_URL: 'Verification authority URL: {{:authurl}}',
        Verify_permissions_successfully: 'Verify permissions successfully',
        unauthorized: 'unauthorized',
        Request_return_status: 'Request return status: {{:status}}',
        Call_error_response_code_message: 'Call error: {{:url}}\nResponse: {{:responseText}} Code: {{:status}} Message: {{:statusText}}',
        Find_server_server_address: 'Find server server address',
        Get_the_server_address: 'Get the server address:{{:address}}',
        Failed_to_get_PMS_URLs: 'Failed to get PMS URLs',
        Get_Media_address: 'Get media address:{{:mediaaddress}}',
        The_local_external_subtitle_file_was_not_found: 'The local external subtitle file was not found',
        Successfully_parsed_the_path_of_the_movie: 'Successfully parsed the path of the movie {{:mediatitle}}, and the local PotPlayer player is being activated'
    }
}
