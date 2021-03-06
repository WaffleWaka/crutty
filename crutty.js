class crutty {
    constructor (){
        this.telnet = require("telnet-client")
        this.ssh = require("ssh2")
        this.connections = []
        return this
    }
    connect (params){
        var config = {
            host: params.host,
            protocol: params.protocol == "telnet" ? false : true, //Telnet = 0; SSH = 1
            port: parseInt(params.port) > 0 ? parseInt(params.port) : params.protocol == "telnet" ? 23 : 22 , //Use default port 23 for telnet and 22 for SSH
            timeout: parseInt(params.timeout) > 0 ? parseInt(params.timeout) : 1500,
            callback: typeof params.callback == "function" ? params.callback : null,
            onError: typeof params.onError == "function" ? params.onError : function (){},
            onClose: typeof params.onClose == "function" ? params.onClose : function (){},
            ssh_username: params.ssh_username ? params.ssh_username : null,
            ssh_password: params.ssh_password ? params.ssh_password : null
        }
        //Validate config
        Object.keys(config).forEach(function (key){
            if (!config[key])
            return false
        })
        const { StringDecoder } = require("string_decoder")
        config.protocol ? connectSSH.apply(this) : connectTelnet.apply(this)

        function connectTelnet (){
            const { Telnet } = require('telnet-client')
            const connection = new Telnet()
            connection.on("connect",    function (){eventHandler("connect",     arguments, this)})
            connection.on("ready",      function (){eventHandler("ready",       arguments, this)})
            connection.on("writedone",  function (){eventHandler("writedone",   arguments, this)})
            connection.on("data",       function (){eventHandler("data",        arguments, this)})
            connection.on("timeout",    function (){eventHandler("timeout",     arguments, this)})
            connection.on("failedlogin",function (){eventHandler("failedlogin", arguments, this)})
            connection.on("error",      function (){eventHandler("error",       arguments, this)})
            connection.on("end",        function (){eventHandler("end",         arguments, this)})
            connection.on("close",      function (){eventHandler("close",       arguments, this)})
            connection.connect({
                host: config.host,
                port: config.port,
                negotiationMandatory: false,
                timeout: config.timeout,
                shellPrompt: null,
            }).then(params.callback)

            function eventHandler (eventType, args, data){
//                if(eventType == "data"){
//                    var chunk =  arguments[2].decode(args[0])
//                    console.log(chunk)
//                }
                var eventType_state = {
                    connect     : {state: "ready",        subState: "connected"},
                    ready       : {state: "ready",        subState: "ready"},
                    writedone   : {state: "ready",        subState: "writedone"},
                    data        : {state: "ready",        subState: "dataWaiting"},
                    timeout     : {state: "error",        subState: "timeout"},
                    failedLogin : {state: "error",        subState: "failedLogin"},
                    error       : {state: "error",        subState: args},
                    end         : {state: "error",        subState: "end"},
                    close       : {state: "error",        subState: "close"},
                }
                if (eventType_state.hasOwnProperty(eventType)){
                    cruttyConnection.sessionState = eventType_state[eventType]
                }
                if (cruttyConnection.sessionState !== "error" && cruttyConnection._writeBuffer.length > 0){
                    var commands = cruttyConnection._writeBuffer
                    cruttyConnection._writeBuffer = []
                    commands.forEach(function (text){
                        cruttyConnection.write(text)
                    })
                }
                if (eventType == "connect"){
                    cruttyConnection._decoder = data.decode
                    cruttyConnection._writehead = data.socket.write
                    cruttyConnection._socket = data.socket
                }
                if  (eventType == "data"){
                    cruttyConnection._bufferRaw = cruttyConnection._bufferRaw.concat(args[0])
                    cruttyConnection._buffer += data.decode(args[0])
                    cruttyConnection.onData(cruttyConnection.read(), cruttyConnection)
                }
                console.log("Event Type: ", eventType, args)
            }


            let cruttyConnection = {
                sessionState : {state: "notConnected", subState: "notConnected"},
                onData: config.callback,
                onError: config.onError,
                onClose: config.onClose,
                _sessionText : "",
                _sessionRaw : [],
                _buffer : "",
                _bufferRaw: [],
                _writeBuffer : [],
                _decoder: null,
                _writehead: null,
                _socket: null,
                read : function (fullSession = false) {
                    if (fullSession){ //Reading the full session does NOT clear the buffer
                        return this.decoder(this._sessionText + this._buffer)
                    } else {
                        var tempBuffer = this._buffer
                        this._buffer = ""
                        this._sessionText += tempBuffer
                        return tempBuffer
                    }
                },
                readRaw : function (fullSession = false) {
                    if (fullSession){
                        return this._sessionRaw.concat(this._bufferRaw)
                    } else {
                        var tempBuffer = this._bufferRaw
                        this._bufferRaw = []
                        this._sessionRaw = this._sessionRaw.concat(this._bufferRaw)
                        return tempBuffer
                    }
                },
                write : function (text){
                    if (this.sessionState.state == "ready"){
                        this._socket.write(text)
                    } else {
                        this.writeWhenReady(text)
                    }
                },
                writeWhenReady: function (text){
                    if (this.sessionState.state == "ready") {
                        this._writehead("text")
                    } else {
                        if (this._writeBuffer == null) {
                            this._writeBuffer = [text]
                        } else {
                            this._writeBuffer.push(text)
                        }
                    }
                },
                end: function (){
                    this._socket.end()
                }
            }
            return cruttyConnection
        }
        function connectSSH (){
            const { Client } = require('ssh2');
            const connection = new Client()
            connection.on("banner", 				function (){eventHandler("banner",					arguments, this)})
            //connection.on("change password", 		function (){eventHandler("change password",			arguments, this)})
            connection.on("close", 					function (){eventHandler("close",					arguments, this)})
            connection.on("end", 					function (){eventHandler("end",						arguments, this)})
            connection.on("error", 					function (){eventHandler("error",					arguments, this)})
            connection.on("handshake", 				function (){eventHandler("handshake", 				arguments, this)})
            //connection.on("hostkeys", 				function (){eventHandler("hostkeys", 				arguments, this)})
            //connection.on("keyboard-interactive",	function (){eventHandler("keyboard-interactive",	arguments, this)})
            connection.on("ready", 					function (){eventHandler("ready", 					arguments, this)})
            //connection.on("rekey", 					function (){eventHandler("rekey", 					arguments, this)})
            //connection.on("tcp connection", 		function (){eventHandler("tcp connection", 			arguments, this)})
            //connection.on("unix connection", 		function (){eventHandler("unix connection", 		arguments, this)})
            //connection.on("x11", 					function (){eventHandler("x11", 					arguments, this)})
            connection.connect({
                host: config.host,
                port: config.port,
                username: config.ssh_username,
                password: config.ssh_password,
                //authHandler: {type: "password", username: config.ssh_username, password: config.ssh_password},
                 algorithms: { //By default SSH2 has a list of "preferred" algorithms, as well as several optional ones. This accepts all available algorithms 
                    cipher:         {append: ['aes128-gcm@openssh.com', 'aes256-gcm@openssh.com', 'aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'chacha20-poly1305@openssh.com', 'aes256-cbc', 'aes192-cbc', 'aes128-cbc', 'blowfish-cbc', '3des-cbc', 'arcfour256', 'arcfour128', 'cast128-cbc', 'arcfour']},
                    compress:       {append: ["none", "zlib@openssh.com", "zlib"]},
                    hmas:           {append: ["hmac-sha2-256-etm@openssh.com", "hmac-sha2-512-etm@openssh.com", "hmac-sha1-etm@openssh.com", "hmac-sha2-256", "hmac-sha2-512", "hmac-sha1", "hmac-md5", "hmac-sha2-256-96", "hmac-sha2-512-96", "hmac-ripemd160", "hmac-sha1-96", "hmac-md5-96"]},
                    kex:            {append: ["curve25519-sha256", "curve25519-sha256@libssh.org", "ecdh-sha2-nistp256", "ecdh-sha2-nistp384", "ecdh-sha2-nistp521", "diffie-hellman-group-exchange-sha256", "diffie-hellman-group14-sha256", "diffie-hellman-group15-sha512", "diffie-hellman-group16-sha512", "diffie-hellman-group17-sha512", "diffie-hellman-group18-sha512", "diffie-hellman-group-exchange-sha1", "diffie-hellman-group14-sha1", "diffie-hellman-group1-sha1"]},
                    serverHostKey:  {append: ["ssh-ed25519", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521", "rsa-sha2-512", "rsa-sha2-256", "ssh-rsa", "ssh-dss"]}
                 }

            })
            function eventHandler(eventType, args, parent) {
                console.log("Event Type: ", eventType, args)
                if (eventType == "ready") {
                    cruttyConnection._socket = parent

                    cruttyConnection.sessionState = {state: "ready", substate: "connected"}
                    parent.shell(function (err, stream) {
                        cruttyConnection._socket = stream
                        cruttyConnection._writehead = stream.write

                        //stream.setDefaultEncoding("ascii")
                        stream.on("error", 	function (){shellHandler("error",	    arguments, this)});
                        stream.on("finish", function (){shellHandler("finish",	    arguments, this)});
                        stream.on("close", 	function (){shellHandler("close",	    arguments, this)});
                        stream.on("data", 	function (){shellHandler("data",         arguments, this)})
                    })
                }
                function shellHandler(eventType, args, parent) {
                    var eventType_state = {
                        error   : {state: "error",      subState: "error"},
                        finish  : {state: "error",      subState: "end"},
                        close   : {state: "error",      subState: "close"},
                        data    : {state: "ready",      subState: "dataWaiting"},
                    }
                    if (eventType_state.hasOwnProperty(eventType)){
                        cruttyConnection.sessionState = eventType_state[eventType]
                    }

                    if (cruttyConnection.sessionState.state == "error"){
                        if (cruttyConnection.sessionState.subState == "close"){
                            cruttyConnection.onClose(cruttyConnection)
                        } else {
                            cruttyConnection.onError(args, cruttyConnection)
                        }
                    }

                    if (cruttyConnection.sessionState.state !== "error" && cruttyConnection._writeBuffer.lenght > 0){
                        var commands = cruttyConnection._writeBuffer
                        cruttyConnection._writeBuffer = []
                        commands.forEach(function (text){
                            cruttyConnection.write(text)
                        })
                    }

                    if (eventType == "data"){
                        cruttyConnection._bufferRaw = cruttyConnection._bufferRaw.concat(Array.from(args[0]))
                        cruttyConnection._buffer += cruttyConnection._decoder.write(args[0])
                        cruttyConnection.onData(cruttyConnection.read(), cruttyConnection)
                    }
                }
            }
        }

            
        let cruttyConnection = {
            sessionState: { state: "notConnected", subState: "notConnected" },
            onData: config.callback,
            onError: config.onError,
            onClose: config.onClose,
            _sessionText: "",
            _sessionRaw: [],
            _buffer: "",
            _bufferRaw: [],
            _writeBuffer: [],
            _decoder: new StringDecoder("utf8"),
            _writehead: null,
            _socket: null,
            read: function (fullSession = false) {
                if (fullSession) { //Reading the full session does NOT clear the buffer
                    return this._sessionText + this._buffer
                } else {
                    var tempBuffer = this._buffer
                    this._buffer = ""
                    this._sessionText += tempBuffer
                    return tempBuffer
                }
            },
            readRaw: function (fullSession = false) {
                if (fullSession) {
                    return this._sessionRaw.concat(this._bufferRaw)
                } else {
                    var tempBuffer = this._bufferRaw
                    this._bufferRaw = []
                    this._sessionRaw = this._sessionRaw.concat(this._bufferRaw)
                    return tempBuffer
                }
            },
            write: function (text) {
                if (this.sessionState.state == "ready") {
                    this._socket.write(text)
                } else {
                    this.writeWhenReady(text)
                }
            },
            writeWhenReady: function (text) {
                if (this.sessionState.state == "ready") {
                    this._writehead("text")
                } else {
                    if (this._writeBuffer == null) {
                        this._writeBuffer = [text]
                    } else {
                        this._writeBuffer.push(text)
                    }
                }
            },
            end: function (){
                this._socket.end()
                //this._onClose will be called by the eventHandler routine
            }
        }
        }
    }
module.exports = crutty