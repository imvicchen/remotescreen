function WxHelp()  
{  
    var socket = undefined;
    var oDOM;
    var CDN = 'http://192.168.1.31:3000/';
    var SocketCDN = 'http://192.168.1.31:3001/';

    function loadScript(sScriptSrc, oCallback) {
        var oHead = document.getElementsByTagName('head')[0];
        var oScript = document.createElement('script');
        oScript.type = 'text/javascript';
        oScript.src = sScriptSrc;
        oScript.onload = oCallback;
        oScript.onreadystatechange = function() {
            if (this.readyState == 'loaded' ||this.readyState == 'complete') {
                oCallback();
            }
        };
        oHead.appendChild(oScript);
    }

    function LoadAllScripts(){
        if (typeof jQuery == 'undefined') {
            loadScript(CDN + 'lib/js/jquery.js', function(){
                //loadScript(CDN + 'lib/js/mutation_summary.js', function(){
                    //loadScript(CDN + 'lib/js/tree_mirror.js', function(){
                        //loadScript(SocketCDN + 'socket.io/socket.io.js', function(){
                            init();
                        //});
                    //})
                //});
            })
        }
        else{
            //loadScript(CDN + 'lib/js/mutation_summary.js', function(){
                //loadScript(CDN + 'lib/js/tree_mirror.js', function(){
                    //loadScript(SocketCDN + 'socket.io/socket.io.js', function(){
                        init();
                    //});
                //})
            //});
        }
    }
    
    function CheckChromeFrame(){
        loadScript('http://google.com/tools/dlpage/res/chromeframe/script/CFInstall.min.js', function(){
            CFInstall.check({
                mode: "popup"
            });
        });
    }
    
    function BrowserCheck(){
        var isIE = /*@cc_on!@*/false;
        if(isIE){
            CheckChromeFrame();
        }
        else{
            loadScript(CDN + 'lib/js/loader.js', function(){
                LoadAllScripts();
            });
        }
    }

    function init(){
        yepnope({
            load : [
                CDN + 'lib/js/session.js',
                //CDN + 'lib/css/screenshare.css'
            ],
            complete : function(){
                // if(sessvars.Session){
                //     ContinueSession();
                // }
                // AddMenu();
                // $(window).resize(function() {
                //     if(socket != undefined){
                //         socketSend({height: $(window).height(), width: $(window).width()});
                //     }
                //     $('#MenuTable').css({left: ($(window).width() - 30), top: ($(window).height()/2) - 150});
                // });
            }
        });
    }
    
    function socketSend(msg) {
        socket.emit('changeHappened', {change: msg, room: sessvars.Session});
    }
    
    this.StartMirroring = function() {
        loadScript(CDN + 'lib/js/mutation_summary.js', function(){
            loadScript(CDN + 'lib/js/tree_mirror.js', function(){
                var mirrorClient;
                mirrorClient = new TreeMirrorClient(document, {
                    initialize: function(rootId, children) {
                        oDOM = {
                            f: 'initialize',
                            args: [rootId, children]
                        }
                    },
            
                    applyChanged: function(removed, addedOrMoved, attributes, text) {
                        if(socket != undefined){
                            socketSend({
                                f: 'applyChanged',
                                args: [removed, addedOrMoved, attributes, text]
                            });
                        }
                    }
                });
            });
        });
    }
    function ContinueSession(SessionKey){
        socket = io.connect(SocketCDN);
        socket.on('connect', function(){
            socket.emit('PageChange', SessionKey);
            $('#RemoteStatus').text('Status: Waiting for connection.');
            socket.on('SessionStarted', function() {
                $('#RemoteStatus').text('Status: Connected!');
                socketSend({height: $(window).height(), width: $(window).width()});
                socketSend({ base: location.href.match(/^(.*\/)[^\/]*$/)[1] });
                socketSend(oDOM);
                SendMouse(SessionKey);
                $('body').append('<div id="AdminPointer"></div> ');
                $(window).scroll(function(){
                    socketSend({scroll: $(window).scrollTop()});
                });
            });
            socket.on('AdminMousePosition', function(msg) {
                $('#AdminPointer').css({'left': msg.PositionLeft - 15, 'top': msg.PositionTop});
            });
            socket.on('DOMLoaded', function(){
                BindEverything();
            })
        });
    }

    function BindEverything(){
        $(':input').each(function(){
            $(this).attr('value', this.value);
        });
        $('select').each(function(){
            var Selected = $(this).children('option:selected');
            $(this).children('option').removeAttr('selected', false);
            Selected.attr('selected', true);
            $(this).replaceWith($(this)[0].outerHTML);
        });
        $(':input').bind('keyup', function() {
            $(this).attr('value', this.value);
        });
        $('select').change(function(){
            var Selected = $(this).children('option:selected');
            $(this).children('option').removeAttr('selected', false);
            Selected.attr('selected', true);
            $(this).replaceWith($(this)[0].outerHTML);
            $('select').unbind('change');
            $('select').change(function(){
                var Selected = $(this).children('option:selected');
                $(this).children('option').removeAttr('selected', false);
                Selected.attr('selected', true);
                $(this).replaceWith($(this)[0].outerHTML);
                $('select').unbind('change');
            });
        });
    }
    
    
    function SendMouse(SessionKey){
        document.onmousemove = function(e) {
            if(!e) e = window.event;
    
            if(e.pageX == null && e.clientX != null) {
                var doc = document.documentElement, body = document.body;
    
                e.pageX = e.clientX
                    + (doc && doc.scrollLeft || body && body.scrollLeft || 0)
                    - (doc.clientLeft || 0);
    
                e.pageY = e.clientY
                    + (doc && doc.scrollTop || body && body.scrollTop || 0)
                    - (doc.clientTop || 0);
            }
            socket.emit('ClientMousePosition', {room: SessionKey, PositionLeft: e.pageX, PositionTop: e.pageY - 5});
        }
    }

    this.CreateSession = function(SessionKey){
        loadScript(CDN + 'lib/js/socket.io.js', function(){
            socket = io.connect(SocketCDN);
            socket.on('connect', function(){
                socket.emit('CreateSession', SessionKey);
                $('#RemoteStatus').text('Status: Waiting for connection.');
                socket.on('SessionStarted', function() {
                    sessvars.Session = SessionKey;
                    $('#RemoteStatus').text('Status: Connected!');
                    socketSend({height: $(window).height(), width: $(window).width()});
                    socketSend({ base: location.href.match(/^(.*\/)[^\/]*$/)[1] });
                    socketSend(oDOM);
                    SendMouse(SessionKey);
                    $('body').append('<div id="AdminPointer"></div> ');
                    $(window).scroll(function(){
                        socketSend({scroll: $(window).scrollTop()});
                    });
                });
                socket.on('AdminMousePosition', function(msg) {
                    $('#AdminPointer').css({'left': msg.PositionLeft - 15, 'top': msg.PositionTop});
                });
                socket.on('DOMLoaded', function(){
                    BindEverything();
                })
            });
        });
    }



    BrowserCheck();
}  